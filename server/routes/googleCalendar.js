const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const googleCalendarService = require('../services/googleCalendarService');

/**
 * Google Calendar Integration Routes
 * Handles OAuth2 flow and calendar management
 */

// ==================== CONNECT GOOGLE CALENDAR ====================
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

// ==================== OAUTH CALLBACK ====================
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).send('Authorization code not provided');
    }

    console.log('📥 Received OAuth callback');

    // Parse state to get user info
    let userId, userType;
    try {
      const stateData = JSON.parse(decodeURIComponent(state));
      userId = stateData.userId;
      userType = stateData.userType;
    } catch (parseError) {
      console.error('❌ Error parsing state:', parseError);
      return res.status(400).send('Invalid state parameter');
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.getTokensFromCode(code);
    
    console.log('✅ Received tokens from Google');

    // Save tokens to business
    if (userType === 'business') {
      await db.Business.update(
        {
          googleCalendarTokens: JSON.stringify(tokens),
          googleCalendarConnected: true
        },
        { where: { id: userId } }
      );
      
      console.log('✅ Tokens saved to database for business:', userId);
    }

    // Redirect back to dashboard with success message
    res.redirect(`${process.env.FRONTEND_URL}/business/dashboard?calendar=connected`);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/business/dashboard?calendar=error`);
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
        const calendarEvent = await googleCalendarService.createBookingEvent(
          booking,
          business,
          booking.Service,
          JSON.parse(business.googleCalendarTokens)
        );

        await booking.update({ googleCalendarEventId: calendarEvent.id });
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

// ==================== REFRESH TOKEN (INTERNAL) ====================
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

    // Refresh the access token
    const newTokens = await googleCalendarService.refreshAccessToken(
      currentTokens.refresh_token
    );

    // Save new tokens
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
    
    // If refresh fails, disconnect calendar
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