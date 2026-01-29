const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const availabilityService = require('../services/availabilityService');
const googleCalendarService = require('../services/googleCalendarService');
const moment = require('moment-timezone');

// Get email service - will be initialized when route is used
let emailService = null;
const getEmailService = (req) => {
  if (!emailService) {
    const transporter = req.app.get('emailTransporter');
    emailService = require('../services/emailService')(transporter);
  }
  return emailService;
};

// ==================== CREATE BOOKING ====================
router.post('/', async (req, res) => {
  try {
    const { 
      businessSlug, 
      serviceId, 
      clientName, 
      clientEmail, 
      clientPhone,
      bookingDate, 
      bookingTime, 
      notes,
      clientAddress,
      syncToClientCalendar // NEW: Flag to indicate if client wants calendar sync
    } = req.body;

    console.log('📝 Creating booking:', { 
      businessSlug, 
      serviceId, 
      clientEmail, 
      bookingDate, 
      bookingTime,
      syncToClientCalendar 
    });

    // Find business with schedules
    const business = await db.Business.findOne({ 
      where: { slug: businessSlug },
      include: [{ model: db.Schedule, as: 'schedules' }]
    });
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Verify service belongs to business
    const service = await db.Service.findOne({
      where: { id: serviceId, businessId: business.id }
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Get existing bookings for this date
    const existingBookings = await db.Booking.findAll({
      where: { 
        businessId: business.id,
        bookingDate,
        status: ['pending', 'confirmed']
      },
      include: [{ model: db.Service, as: 'Service' }]
    });

    // Validate that the selected time slot is available
    const isAvailable = await availabilityService.validateBookingSlot(
      business,
      service,
      bookingDate,
      bookingTime,
      existingBookings
    );

    if (!isAvailable) {
      return res.status(400).json({ 
        message: 'This time slot is no longer available. Please select another time.' 
      });
    }

    // Create booking
    const booking = await db.Booking.create({
      businessId: business.id,
      serviceId,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      bookingDate,
      bookingTime,
      notes,
      status: 'pending'
    });

    console.log('✅ Booking created:', booking.id);

    // Get chat messages if they exist
    const chatMessages = await db.Message.findAll({
      where: {
        businessId: business.id,
        clientEmail: clientEmail
      },
      order: [['createdAt', 'ASC']],
      limit: 20
    });

    // Attach chat reference to booking if messages exist
    if (chatMessages.length > 0) {
      await booking.update({
        hasChatHistory: true,
        lastChatMessageAt: chatMessages[chatMessages.length - 1].createdAt
      });
      console.log('💬 Found', chatMessages.length, 'chat messages for this client');
    }

    // Include service details in response
    const bookingWithService = await db.Booking.findByPk(booking.id, {
      include: [{ model: db.Service, as: 'Service' }]
    });

    let calendarSyncStatus = {
      businessCalendarSynced: false,
      clientCalendarSynced: false,
      requiresClientAuth: false,
      clientAuthUrl: null
    };

    // Try to create Google Calendar events (non-blocking)
    try {
      if (business.googleCalendarTokens) {
        console.log('📅 Creating calendar events...');
        
        // Check if client has authorized calendar
        let clientTokens = null;
        let clientToken = null;

        if (syncToClientCalendar) {
          clientToken = await db.ClientCalendarToken.findOne({
            where: { clientEmail, isConnected: true }
          });

          if (clientToken) {
            clientTokens = JSON.parse(clientToken.googleCalendarTokens);
          }
        }

        // Create events (business calendar always, client calendar if authorized)
        const eventIds = await googleCalendarService.createBookingEvent(
          booking,
          business,
          service,
          JSON.parse(business.googleCalendarTokens),
          clientTokens,
          chatMessages
        );
        
        // Save calendar event IDs
        await booking.update({ 
          googleCalendarEventId: eventIds.businessEventId,
          clientCalendarEventId: eventIds.clientEventId
        });

        calendarSyncStatus.businessCalendarSynced = !!eventIds.businessEventId;
        calendarSyncStatus.clientCalendarSynced = !!eventIds.clientEventId;

        console.log('✅ Calendar sync status:', calendarSyncStatus);

        // If client wants sync but hasn't authorized, provide auth URL
        if (syncToClientCalendar && !clientTokens) {
          const authUrl = googleCalendarService.getAuthUrl(
            clientEmail,
            'client',
            booking.id
          );
          
          calendarSyncStatus.requiresClientAuth = true;
          calendarSyncStatus.clientAuthUrl = authUrl;
          
          console.log('🔐 Client needs to authorize Google Calendar');
        }

      } else {
        console.log('⚠️ Google Calendar not connected for this business');
      }
    } catch (calendarError) {
      console.error('⚠️ Calendar sync failed (non-blocking):', calendarError.message);
    }

    // Send email notifications (non-blocking)
    try {
      const emailSvc = getEmailService(req);
      await emailSvc.sendBookingConfirmation(
        booking,
        business,
        service
      );
      console.log('📧 Confirmation email sent to:', booking.clientEmail);
    } catch (emailError) {
      console.error('⚠️ Email sending failed (non-blocking):', emailError.message);
    }

    res.status(201).json({ 
      message: 'Booking created successfully',
      booking: bookingWithService,
      hasChatHistory: chatMessages.length > 0,
      chatMessageCount: chatMessages.length,
      calendarSync: calendarSyncStatus
    });

  } catch (error) {
    console.error('❌ Create booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== UPDATE BOOKING STATUS ====================
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await db.Booking.findOne({
      where: { id: req.params.id, businessId: req.business.id },
      include: [{ model: db.Service, as: 'Service' }]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const oldStatus = booking.status;
    await booking.update({ status });

    console.log('📝 Booking status updated:', { id: booking.id, oldStatus, newStatus: status });

    // Get chat messages for calendar update
    const chatMessages = await db.Message.findAll({
      where: {
        businessId: req.business.id,
        clientEmail: booking.clientEmail
      },
      order: [['createdAt', 'ASC']],
      limit: 20
    });

    // Update Google Calendar events if connected
    try {
      const business = await db.Business.findByPk(req.business.id);
      
      if (business.googleCalendarTokens) {
        if (status === 'cancelled') {
          // Delete events from BOTH calendars
          if (booking.googleCalendarEventId) {
            await googleCalendarService.deleteBookingEvent(
              booking.googleCalendarEventId,
              JSON.parse(business.googleCalendarTokens)
            );
            console.log('📅 Business calendar event deleted');
          }

          // Delete from client calendar too
          if (booking.clientCalendarEventId) {
            const clientToken = await db.ClientCalendarToken.findOne({
              where: { clientEmail: booking.clientEmail, isConnected: true }
            });

            if (clientToken) {
              await googleCalendarService.deleteBookingEvent(
                booking.clientCalendarEventId,
                JSON.parse(clientToken.googleCalendarTokens)
              );
              console.log('📅 Client calendar event deleted');
            }
          }

        } else {
          // Update events in BOTH calendars
          if (booking.googleCalendarEventId) {
            await googleCalendarService.updateBookingEvent(
              booking.googleCalendarEventId,
              booking,
              business,
              booking.Service,
              JSON.parse(business.googleCalendarTokens),
              chatMessages
            );
            console.log('📅 Business calendar event updated');
          }

          if (booking.clientCalendarEventId) {
            const clientToken = await db.ClientCalendarToken.findOne({
              where: { clientEmail: booking.clientEmail, isConnected: true }
            });

            if (clientToken) {
              await googleCalendarService.updateBookingEvent(
                booking.clientCalendarEventId,
                booking,
                business,
                booking.Service,
                JSON.parse(clientToken.googleCalendarTokens),
                chatMessages
              );
              console.log('📅 Client calendar event updated');
            }
          }
        }
      }
    } catch (calendarError) {
      console.error('⚠️ Calendar update failed:', calendarError.message);
    }

    // Send status update email
    try {
      const emailSvc = getEmailService(req);
      await emailSvc.sendBookingStatusUpdate(
        booking,
        req.business,
        booking.Service,
        oldStatus,
        status
      );
      console.log('📧 Status update email sent');
    } catch (emailError) {
      console.error('⚠️ Email sending failed:', emailError.message);
    }

    res.json({ 
      message: 'Booking status updated successfully',
      booking 
    });
  } catch (error) {
    console.error('❌ Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== RESCHEDULE BOOKING ====================
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { bookingDate, bookingTime, clientEmail } = req.body;

    const booking = await db.Booking.findOne({
      where: { 
        id: req.params.id, 
        clientEmail: clientEmail 
      },
      include: [
        { model: db.Service, as: 'Service' },
        { model: db.Business, as: 'Business' }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({ 
        message: 'Cannot reschedule cancelled or completed bookings' 
      });
    }

    // Validate new time slot
    const existingBookings = await db.Booking.findAll({
      where: { 
        businessId: booking.businessId,
        bookingDate,
        status: ['pending', 'confirmed'],
        id: { [db.Sequelize.Op.ne]: booking.id } // Exclude current booking
      },
      include: [{ model: db.Service, as: 'Service' }]
    });

    const isAvailable = await availabilityService.validateBookingSlot(
      booking.Business,
      booking.Service,
      bookingDate,
      bookingTime,
      existingBookings
    );

    if (!isAvailable) {
      return res.status(400).json({ 
        message: 'This time slot is not available' 
      });
    }

    // Update booking
    await booking.update({ bookingDate, bookingTime });

    // Get chat messages
    const chatMessages = await db.Message.findAll({
      where: {
        businessId: booking.businessId,
        clientEmail: booking.clientEmail
      },
      order: [['createdAt', 'ASC']],
      limit: 20
    });

    // Update calendar events
    try {
      if (booking.Business.googleCalendarTokens && booking.googleCalendarEventId) {
        await googleCalendarService.updateBookingEvent(
          booking.googleCalendarEventId,
          booking,
          booking.Business,
          booking.Service,
          JSON.parse(booking.Business.googleCalendarTokens),
          chatMessages
        );
        console.log('📅 Business calendar updated after reschedule');
      }

      if (booking.clientCalendarEventId) {
        const clientToken = await db.ClientCalendarToken.findOne({
          where: { clientEmail: booking.clientEmail, isConnected: true }
        });

        if (clientToken) {
          await googleCalendarService.updateBookingEvent(
            booking.clientCalendarEventId,
            booking,
            booking.Business,
            booking.Service,
            JSON.parse(clientToken.googleCalendarTokens),
            chatMessages
          );
          console.log('📅 Client calendar updated after reschedule');
        }
      }
    } catch (calendarError) {
      console.error('⚠️ Calendar update failed:', calendarError.message);
    }

    res.json({ 
      message: 'Booking rescheduled successfully',
      booking 
    });
  } catch (error) {
    console.error('❌ Reschedule booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== CANCEL BOOKING (CLIENT) ====================
router.put('/:id/cancel', async (req, res) => {
  try {
    const { clientEmail } = req.body;

    const booking = await db.Booking.findOne({
      where: { 
        id: req.params.id, 
        clientEmail: clientEmail 
      },
      include: [
        { model: db.Service, as: 'Service' },
        { model: db.Business, as: 'Business' }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    await booking.update({ status: 'cancelled', cancelledBy: 'client' });

    // Delete from BOTH calendars
    try {
      if (booking.Business.googleCalendarTokens && booking.googleCalendarEventId) {
        await googleCalendarService.deleteBookingEvent(
          booking.googleCalendarEventId,
          JSON.parse(booking.Business.googleCalendarTokens)
        );
        console.log('📅 Business calendar event deleted after cancellation');
      }

      if (booking.clientCalendarEventId) {
        const clientToken = await db.ClientCalendarToken.findOne({
          where: { clientEmail: booking.clientEmail, isConnected: true }
        });

        if (clientToken) {
          await googleCalendarService.deleteBookingEvent(
            booking.clientCalendarEventId,
            JSON.parse(clientToken.googleCalendarTokens)
          );
          console.log('📅 Client calendar event deleted after cancellation');
        }
      }
    } catch (calendarError) {
      console.error('⚠️ Calendar delete failed:', calendarError.message);
    }

    res.json({ 
      message: 'Booking cancelled successfully',
      booking 
    });
  } catch (error) {
    console.error('❌ Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== GET AVAILABLE SLOTS ====================
// (Keep your existing implementation from the original file)
router.get('/available-slots/:businessSlug/:date', async (req, res) => {
  try {
    const { businessSlug, date } = req.params;
    const { serviceId } = req.query;

    console.log('🔍 Checking available slots:', { businessSlug, date, serviceId });

    const business = await db.Business.findOne({ 
      where: { slug: businessSlug },
      include: [{ model: db.Schedule, as: 'schedules' }]
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const service = await db.Service.findOne({
      where: { id: serviceId, businessId: business.id }
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const existingBookings = await db.Booking.findAll({
      where: { 
        businessId: business.id,
        bookingDate: date,
        status: ['pending', 'confirmed']
      },
      include: [{ model: db.Service, as: 'Service' }]
    });

    const slotsData = await availabilityService.getAvailableSlotsWithStatus(
      business,
      service,
      date,
      existingBookings
    );

    const minAdvanceDays = availabilityService.getMinAdvanceDays(
      business.bufferTime,
      service.duration
    );

    res.json({ 
      availableSlots: slotsData.availableSlots,
      takenSlots: slotsData.takenSlots,
      closedDay: slotsData.closedDay,
      minAdvanceDays,
      timezone: business.timezone,
      bufferTime: business.bufferTime,
      serviceDuration: service.duration
    });

  } catch (error) {
    console.error('❌ Get available slots error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== GET BUSINESS BOOKINGS ====================
// (Keep remaining routes from your original file)
router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    const { status, date, startDate, endDate } = req.query;
    
    const whereClause = { businessId: req.business.id };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (date) {
      whereClause.bookingDate = date;
    }

    if (startDate && endDate) {
      whereClause.bookingDate = {
        [db.Sequelize.Op.between]: [startDate, endDate]
      };
    }

    const bookings = await db.Booking.findAll({
      where: whereClause,
      include: [
        { model: db.Service, as: 'Service' }
      ],
      order: [['bookingDate', 'ASC'], ['bookingTime', 'ASC']]
    });

    const bookingsWithChat = await Promise.all(
      bookings.map(async (booking) => {
        const messageCount = await db.Message.count({
          where: {
            businessId: req.business.id,
            clientEmail: booking.clientEmail
          }
        });

        return {
          ...booking.toJSON(),
          chatMessageCount: messageCount,
          hasChatHistory: messageCount > 0
        };
      })
    );

    res.json({ bookings: bookingsWithChat });
  } catch (error) {
    console.error('❌ Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await db.Booking.findOne({
      where: { id: req.params.id, businessId: req.business.id },
      include: [{ model: db.Service, as: 'Service' }]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const chatMessages = await db.Message.findAll({
      where: {
        businessId: req.business.id,
        clientEmail: booking.clientEmail
      },
      order: [['createdAt', 'ASC']]
    });

    res.json({ 
      booking,
      chatMessages,
      hasChatHistory: chatMessages.length > 0
    });
  } catch (error) {
    console.error('❌ Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/client/:clientEmail', async (req, res) => {
  try {
    const { clientEmail } = req.params;
    const { businessSlug } = req.query;

    const whereClause = { clientEmail };

    if (businessSlug) {
      const business = await db.Business.findOne({ where: { slug: businessSlug } });
      if (business) {
        whereClause.businessId = business.id;
      }
    }

    const bookings = await db.Booking.findAll({
      where: whereClause,
      include: [
        { model: db.Service, as: 'Service' },
        { model: db.Business, as: 'Business', attributes: ['businessName', 'slug', 'logo'] }
      ],
      order: [['bookingDate', 'DESC'], ['bookingTime', 'DESC']]
    });

    res.json({ bookings });
  } catch (error) {
    console.error('❌ Get client bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/check-availability', async (req, res) => {
  try {
    const { businessSlug, serviceId, bookingDate, bookingTime } = req.body;

    const business = await db.Business.findOne({ 
      where: { slug: businessSlug },
      include: [{ model: db.Schedule, as: 'schedules' }]
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const service = await db.Service.findOne({
      where: { id: serviceId, businessId: business.id }
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const existingBookings = await db.Booking.findAll({
      where: { 
        businessId: business.id,
        bookingDate,
        status: ['pending', 'confirmed']
      },
      include: [{ model: db.Service, as: 'Service' }]
    });

    const isAvailable = await availabilityService.validateBookingSlot(
      business,
      service,
      bookingDate,
      bookingTime,
      existingBookings
    );

    res.json({ 
      available: isAvailable,
      message: isAvailable ? 'Time slot is available' : 'Time slot is not available'
    });

  } catch (error) {
    console.error('❌ Check availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;