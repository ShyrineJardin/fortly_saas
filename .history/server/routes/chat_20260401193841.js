const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const emailService = require('../services/emailService');

router.get('/public/:businessSlug', async (req, res) => {
  try {
    const { businessSlug } = req.params;

    const business = await db.Business.findOne({ 
      where: { slug: businessSlug },
      attributes: ['id', 'businessName', 'logo', 'slug'] 
    });
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json({
      name: business.businessName,
      logo: business.logo,
      slug: business.slug
    });
  } catch (error) {
    console.error('Get business details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all conversations for business
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await db.Message.findAll({
      where: { businessId: req.business.id },
      attributes: [
        'clientEmail',
        'clientName',
        [db.sequelize.fn('MAX', db.sequelize.col('createdAt')), 'lastMessageAt'],
        [db.sequelize.fn('COUNT', db.sequelize.literal('CASE WHEN "isRead" = false AND sender = \'client\' THEN 1 END')), 'unreadCount']
      ],
      group: ['clientEmail', 'clientName'],
      order: [[db.sequelize.literal('MAX("createdAt")'), 'DESC']]
    });

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Helper: find business by slug OR by id (handles temp slug after onboarding) ──
async function findBusinessBySlugOrId(slugOrId) {
  // Try slug first
  let business = await db.Business.findOne({ where: { slug: slugOrId } });
  // If not found, try by ID (UUID format)
  if (!business && slugOrId && slugOrId.match(/^[0-9a-f-]{36}$/i)) {
    business = await db.Business.findByPk(slugOrId);
  }
  return business;
}

// ── Get messages for business side ──
router.get('/messages/business/:businessSlug/:clientEmail', async (req, res) => {
  try {
    const { businessSlug, clientEmail } = req.params;

    const business = await findBusinessBySlugOrId(businessSlug);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const messages = await db.Message.findAll({
      where: { businessId: business.id, clientEmail },
      order: [['createdAt', 'ASC']]
    });

    await db.Message.update(
      { isRead: true },
      { where: { businessId: business.id, clientEmail, sender: 'client', isRead: false } }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get business messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Get all clients for a business ──
// Uses authMiddleware so we look up by business ID from JWT — never breaks on slug change
router.get('/clients/:businessSlug', authMiddleware, async (req, res) => {
  try {
    // ✅ Use business ID from JWT token — immune to slug changes
    const businessId = req.business.id;

    const clients = await db.sequelize.query(`
      SELECT DISTINCT ON (m1."clientEmail")
        m1."clientEmail",
        m1."clientName",
        m1."message" as "lastMessage",
        m1."createdAt" as "lastMessageTime",
        (
          SELECT COUNT(*)
          FROM "Messages" m2
          WHERE m2."businessId" = m1."businessId"
            AND m2."clientEmail" = m1."clientEmail"
            AND m2."isRead" = false
            AND m2."sender" = 'client'
        ) as unread
      FROM "Messages" m1
      WHERE m1."businessId" = :businessId
      ORDER BY m1."clientEmail", m1."createdAt" DESC
    `, {
      replacements: { businessId },
      type: db.sequelize.QueryTypes.SELECT
    });

    const formattedClients = clients.map((client, index) => ({
      id: index + 1,
      clientName: client.clientName,
      clientEmail: client.clientEmail,
      lastMessage: client.lastMessage,
      lastMessageTime: new Date(client.lastMessageTime).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      unread: parseInt(client.unread) || 0
    }));

    formattedClients.sort((a, b) => {
      const timeA = clients.find(c => c.clientEmail === a.clientEmail).lastMessageTime;
      const timeB = clients.find(c => c.clientEmail === b.clientEmail).lastMessageTime;
      return new Date(timeB) - new Date(timeA);
    });

    res.json({ clients: formattedClients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Send message from business ──
router.post('/send-business', authMiddleware, async (req, res) => {
  try {
    const { clientEmail, message, messageType, fileContent } = req.body;

    // ✅ Use business ID from JWT — immune to slug changes
    const business = await db.Business.findByPk(req.business.id);

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const existingMessage = await db.Message.findOne({
      where: { businessId: business.id, clientEmail }
    });

    const clientName = existingMessage ? existingMessage.clientName : 'Client';

    const newMessage = await db.Message.create({
      businessId: business.id,
      clientEmail,
      clientName,
      message,
      messageType: messageType || 'text',
      fileContent: fileContent || null,
      fileName: messageType ? message : null,
      sender: 'business'
    });

    const io = req.app.get('io');
    if (io) {
      // ✅ Use current slug (not the old temp slug) for room name
      const roomName = `client-${business.slug}-${clientEmail}`;
      console.log(`📢 Emitting to room: ${roomName}`);
      io.to(roomName).emit('new-message', {
        message: newMessage,
        sender: 'business',
        businessName: business.businessName,
        businessSlug: business.slug,
        clientEmail
      });
      const room = io.sockets.adapter.rooms.get(roomName);
      console.log(`👥 Clients in room ${roomName}:`, room?.size || 0);
      console.log('🔔 Real-time notification sent to client');
    }

    try {
      const messageText = messageType === 'text' ? message : `Sent a ${messageType}`;
      await emailService.sendClientNotification(
        clientEmail,
        clientName,
        business.businessName,
        messageText,
        business.slug
      );
    } catch (emailError) {
      console.error('❌ Email notification error:', emailError);
    }

    res.status(201).json({ message: 'Message sent successfully', messageData: newMessage });
  } catch (error) {
    console.error('Send business message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a conversation (auth)
router.get('/messages/:clientEmail', authMiddleware, async (req, res) => {
  try {
    const { clientEmail } = req.params;

    const messages = await db.Message.findAll({
      where: { businessId: req.business.id, clientEmail },
      order: [['createdAt', 'ASC']]
    });

    await db.Message.update(
      { isRead: true },
      { where: { businessId: req.business.id, clientEmail, sender: 'client', isRead: false } }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Get messages for client (no auth) ──
router.get('/messages/client/:businessSlug/:clientEmail', async (req, res) => {
  try {
    const { businessSlug, clientEmail } = req.params;

    const business = await findBusinessBySlugOrId(businessSlug);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const messages = await db.Message.findAll({
      where: { businessId: business.id, clientEmail },
      order: [['createdAt', 'ASC']]
    });

    await db.Message.update(
      { isRead: true },
      { where: { businessId: business.id, clientEmail, sender: 'business', isRead: false } }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get client messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message from business (auth)
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { clientEmail, message } = req.body;

    const existingMessage = await db.Message.findOne({
      where: { businessId: req.business.id, clientEmail }
    });

    const clientName = existingMessage ? existingMessage.clientName : 'Client';

    const newMessage = await db.Message.create({
      businessId: req.business.id,
      clientEmail,
      clientName,
      message,
      sender: 'business'
    });

    res.status(201).json({ message: 'Message sent successfully', messageData: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Send message from client ──
router.post('/send-client', async (req, res) => {
  try {
    const { businessSlug, clientEmail, clientName, message, messageType, fileContent } = req.body;

    const business = await findBusinessBySlugOrId(businessSlug);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const newMessage = await db.Message.create({
      businessId: business.id,
      clientEmail,
      clientName,
      message,
      messageType: messageType || 'text',
      fileContent: fileContent || null,
      fileName: messageType ? message : null, 
      sender: 'client'
    });

    const io = req.app.get('io');
    if (io) {
      // ✅ Always use the current real slug for the room
      const roomName = `business-${business.slug}`;
      console.log(`📢 Emitting to room: ${roomName}`);
      io.to(roomName).emit('new-message', {
        message: newMessage,
        sender: 'client',
        clientName,
        clientEmail,
        businessSlug: business.slug
      });
      const room = io.sockets.adapter.rooms.get(roomName);
      console.log(`👥 Clients in room ${roomName}:`, room?.size || 0);
      console.log('🔔 Real-time notification sent to business');
    }

    if (business.email) {
      try {
        const messageText = messageType === 'text' ? message : `Sent a ${messageType}`;
        await emailService.sendBusinessNotification(
          business.email,
          business.businessName,
          clientName,
          clientEmail,
          messageText
        );
      } catch (emailError) {
        console.error('❌ Email notification error:', emailError);
      }
    }

    res.status(201).json({ message: 'Message sent successfully', messageData: newMessage });
  } catch (error) {
    console.error('Send client message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread count for business
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await db.Message.count({
      where: { businessId: req.business.id, sender: 'client', isRead: false }
    });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;