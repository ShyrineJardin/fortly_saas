const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const googleCalendarService = require('../services/googleCalendarService');

/**
 * Google Calendar Integration Routes
 * Handles OAuth2 flow for BOTH business and client calendars
 */

// ==================== BUSINESS: CONNECT GOOGLE CALENDAR ====================
router.get('/connect', authMiddleware, async (req, res) => {
  try {
    const authUrl = googleCalendarService.getAuthUrl(
      req.business.id,
      'business'
    );
    
    res.json({ 
      authUrl,
      message: 'Redirect user to this URL to authorize' 
    });
  } catch (error) {
    console.error('❌ Error generating auth URL:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== CLIENT: CONNECT GOOGLE CALENDAR ====================
router.get('/connect-client', async (req, res) => {
  try {
    const { clientEmail, bookingId } = req.query;

    if (!clientEmail) {
      return res.status(400).json({ message: 'Client email required' });
    }

    // Generate auth URL for client
    const authUrl = googleCalendarService.getAuthUrl(
      clientEmail, // Use email as userId for clients
      'client',
      bookingId
    );
    
    res.json({ 
      authUrl,
      message: 'Redirect client to this URL to authorize their Google Calendar'
    });
  } catch (error) {
    console.error('❌ Error generating client auth URL:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== OAUTH CALLBACK (HANDLES BOTH BUSINESS & CLIENT) ====================
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).send('Authorization code not provided');
    }

    console.log('📥 Received OAuth callback');

    // Parse state to get user info
    let userId, userType, bookingId;
    try {
      const stateData = JSON.parse(decodeURIComponent(state));
      userId = stateData.userId;
      userType = stateData.userType;
      bookingId = stateData.bookingId;
    } catch (parseError) {
      console.error('❌ Error parsing state:', parseError);
      return res.status(400).send('Invalid state parameter');
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.getTokensFromCode(code);
    
    console.log('✅ Received tokens from Google');

    if (userType === 'business') {
      // Save tokens to business
      await db.Business.update(
        {
          googleCalendarTokens: JSON.stringify(tokens),
          googleCalendarConnected: true
        },
        { where: { id: userId } }
      );
      
      console.log('✅ Business calendar connected:', userId);
      res.redirect(`${process.env.FRONTEND_URL}/business/dashboard?calendar=connected`);

    } else if (userType === 'client') {
      // Save tokens for client
      const [clientToken, created] = await db.ClientCalendarToken.findOrCreate({
        where: { clientEmail: userId },
        defaults: {
          clientEmail: userId,
          googleCalendarTokens: JSON.stringify(tokens),
          isConnected: true,
          lastSyncedAt: new Date()
        }
      });

      if (!created) {
        await clientToken.update({
          googleCalendarTokens: JSON.stringify(tokens),
          isConnected: true,
          lastSyncedAt: new Date()
        });
      }

      console.log('✅ Client calendar connected:', userId);

      // If there's a pending booking, create the calendar event now
      if (bookingId) {
        try {
          const booking = await db.Booking.findByPk(bookingId, {
            include: [
              { model: db.Service, as: 'Service' },
              { model: db.Business, as: 'Business' }
            ]
          });

          if (booking && booking.Business.googleCalendarTokens) {
            // Get chat messages
            const chatMessages = await db.Message.findAll({
              where: {
                businessId: booking.businessId,
                clientEmail: booking.clientEmail
              },
              order: [['createdAt', 'ASC']],
              limit: 20
            });

            // Create events in both calendars
            const eventIds = await googleCalendarService.createBookingEvent(
              booking,
              booking.Business,
              booking.Service,
              JSON.parse(booking.Business.googleCalendarTokens),
              tokens,
              chatMessages
            );

            // Update booking with both event IDs
            await booking.update({
              googleCalendarEventId: eventIds.businessEventId,
              clientCalendarEventId: eventIds.clientEventId
            });

            console.log('✅ Booking synced to both calendars:', bookingId);
          }
        } catch (syncError) {
          console.error('⚠️ Error syncing booking to client calendar:', syncError);
        }
      }

      res.redirect(`${process.env.FRONTEND_URL}/booking-success?calendar=connected`);
    }

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    const redirectUrl = userType === 'business' 
      ? '/business/dashboard?calendar=error'
      : '/booking-success?calendar=error';
    res.redirect(`${process.env.FRONTEND_URL}${redirectUrl}`);
  }
});

// ==================== CHECK CONNECTION STATUS ====================
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const business = await db.Business.findByPk(req.business.id, {
      attributes: ['googleCalendarConnected', 'googleCalendarTokens']
    });

    const isConnected = googleCalendarService.isCalendarConnected(
      business.googleCalendarTokens ? JSON.parse(business.googleCalendarTokens) : null
    );

    res.json({
      connected: isConnected,
      connectedAt: business.updatedAt
    });

  } catch (error) {
    console.error('❌ Check status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== CLIENT: CHECK CONNECTION STATUS ====================
router.get('/status-client', async (req, res) => {
  try {
    const { clientEmail } = req.query;

    if (!clientEmail) {
      return res.status(400).json({ message: 'Client email required' });
    }

    const clientToken = await db.ClientCalendarToken.findOne({
      where: { clientEmail, isConnected: true }
    });

    res.json({
      connected: !!clientToken,
      connectedAt: clientToken?.updatedAt
    });

  } catch (error) {
    console.error('❌ Check client status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== DISCONNECT CALENDAR ====================
router.delete('/disconnect', authMiddleware, async (req, res) => {
  try {
    await db.Business.update(
      {
        googleCalendarTokens: null,
        googleCalendarConnected: false
      },
      { where: { id: req.business.id } }
    );

    console.log('✅ Calendar disconnected for business:', req.business.id);

    res.json({ message: 'Calendar disconnected successfully' });
  } catch (error) {
    console.error('❌ Disconnect calendar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== CLIENT: DISCONNECT CALENDAR ====================
router.delete('/disconnect-client', async (req, res) => {
  try {
    const { clientEmail } = req.body;

    if (!clientEmail) {
      return res.status(400).json({ message: 'Client email required' });
    }

    await db.ClientCalendarToken.destroy({
      where: { clientEmail }
    });

    console.log('✅ Client calendar disconnected:', clientEmail);

    res.json({ message: 'Calendar disconnected successfully' });
  } catch (error) {
    console.error('❌ Disconnect client calendar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== SYNC EXISTING BOOKINGS ====================
router.post('/sync-bookings', authMiddleware, async (req, res) => {
  try {
    const business = await db.Business.findByPk(req.business.id);

    if (!business.googleCalendarConnected || !business.googleCalendarTokens) {
      return res.status(400).json({ 
        message: 'Google Calendar not connected' 
      });
    }

    // Get all future bookings without calendar events
    const bookings = await db.Booking.findAll({
      where: {
        businessId: business.id,
        googleCalendarEventId: null,
        status: ['pending', 'confirmed'],
        bookingDate: {
          [db.Sequelize.Op.gte]: new Date()
        }
      },
      include: [{ model: db.Service, as: 'Service' }]
    });

    console.log(`🔄 Syncing ${bookings.length} bookings to calendar`);

    let successCount = 0;
    let errorCount = 0;

    for (const booking of bookings) {
      try {
        // Get client calendar tokens if they exist
        const clientToken = await db.ClientCalendarToken.findOne({
          where: { clientEmail: booking.clientEmail, isConnected: true }
        });

        // Get chat messages
        const chatMessages = await db.Message.findAll({
          where: {
            businessId: business.id,
            clientEmail: booking.clientEmail
          },
          order: [['createdAt', 'ASC']],
          limit: 20
        });

        const eventIds = await googleCalendarService.createBookingEvent(
          booking,
          business,
          booking.Service,
          JSON.parse(business.googleCalendarTokens),
          clientToken ? JSON.parse(clientToken.googleCalendarTokens) : null,
          chatMessages
        );

        await booking.update({ 
          googleCalendarEventId: eventIds.businessEventId,
          clientCalendarEventId: eventIds.clientEventId
        });
        successCount++;

      } catch (eventError) {
        console.error(`❌ Error syncing booking ${booking.id}:`, eventError);
        errorCount++;
      }
    }

    res.json({
      message: 'Sync completed',
      synced: successCount,
      errors: errorCount,
      total: bookings.length
    });

  } catch (error) {
    console.error('❌ Sync bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== REFRESH TOKEN ====================
router.post('/refresh-token', authMiddleware, async (req, res) => {
  try {
    const business = await db.Business.findByPk(req.business.id);

    if (!business.googleCalendarTokens) {
      return res.status(400).json({ message: 'No tokens found' });
    }

    const currentTokens = JSON.parse(business.googleCalendarTokens);
    
    if (!currentTokens.refresh_token) {
      return res.status(400).json({ 
        message: 'No refresh token available. Please reconnect.' 
      });
    }

    const newTokens = await googleCalendarService.refreshAccessToken(
      currentTokens.refresh_token
    );

    await business.update({
      googleCalendarTokens: JSON.stringify({
        ...currentTokens,
        ...newTokens
      })
    });

    console.log('✅ Token refreshed successfully');

    res.json({ message: 'Token refreshed successfully' });

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    
    await db.Business.update(
      {
        googleCalendarTokens: null,
        googleCalendarConnected: false
      },
      { where: { id: req.business.id } }
    );

    res.status(401).json({ 
      message: 'Token refresh failed. Please reconnect your calendar.' 
    });
  }
});

// ==================== GET CALENDAR EVENTS ====================
router.get('/events', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Start date and end date are required' 
      });
    }

    const business = await db.Business.findByPk(req.business.id);

    if (!business.googleCalendarConnected || !business.googleCalendarTokens) {
      return res.status(400).json({ 
        message: 'Google Calendar not connected' 
      });
    }

    const events = await googleCalendarService.getEvents(
      startDate,
      endDate,
      JSON.parse(business.googleCalendarTokens)
    );

    res.json({ events });

  } catch (error) {
    console.error('❌ Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;