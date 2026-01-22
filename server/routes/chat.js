const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get all conversations for business
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    // Get unique client emails with their latest message
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

// Get messages for a conversation
router.get('/messages/:clientEmail', authMiddleware, async (req, res) => {
  try {
    const { clientEmail } = req.params;

    const messages = await db.Message.findAll({
      where: { 
        businessId: req.business.id,
        clientEmail 
      },
      order: [['createdAt', 'ASC']]
    });

    // Mark messages as read
    await db.Message.update(
      { isRead: true },
      { 
        where: { 
          businessId: req.business.id,
          clientEmail,
          sender: 'client',
          isRead: false
        }
      }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for client (no auth)
router.get('/messages/client/:businessSlug/:clientEmail', async (req, res) => {
  try {
    const { businessSlug, clientEmail } = req.params;

    const business = await db.Business.findOne({ where: { slug: businessSlug } });
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const messages = await db.Message.findAll({
      where: { 
        businessId: business.id,
        clientEmail 
      },
      order: [['createdAt', 'ASC']]
    });

    // Mark business messages as read
    await db.Message.update(
      { isRead: true },
      { 
        where: { 
          businessId: business.id,
          clientEmail,
          sender: 'business',
          isRead: false
        }
      }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get client messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message from business
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { clientEmail, message } = req.body;

    // Get client name from previous messages
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

    res.status(201).json({ 
      message: 'Message sent successfully',
      messageData: newMessage 
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message from client (no auth)
router.post('/send-client', async (req, res) => {
  try {
    const { businessSlug, clientEmail, clientName, message } = req.body;

    const business = await db.Business.findOne({ where: { slug: businessSlug } });
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const newMessage = await db.Message.create({
      businessId: business.id,
      clientEmail,
      clientName,
      message,
      sender: 'client'
    });

    res.status(201).json({ 
      message: 'Message sent successfully',
      messageData: newMessage 
    });
  } catch (error) {
    console.error('Send client message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread count for business
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await db.Message.count({
      where: { 
        businessId: req.business.id,
        sender: 'client',
        isRead: false
      }
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;