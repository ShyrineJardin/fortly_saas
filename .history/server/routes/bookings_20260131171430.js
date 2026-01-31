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
      syncToClientCalendar
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

    // ✅ FIX: Validate using the same method that generates slots
    const slotsData = await availabilityService.getAvailableSlotsWithStatus(
      business,
      service,
      bookingDate,
      existingBookings
    );

    // Check if the requested time is in available slots
    const isAvailable = slotsData.availableSlots.some(slot => slot.time === bookingTime);

    if (!isAvailable) {
      console.log('❌ Time slot not available:', {
        requestedTime: bookingTime,
        availableSlots: slotsData.availableSlots.map(s => s.time)
      });
      return res.status(400).json({ 
        message: 'This time slot is no longer available. Please select another time.' 
      });
    }

    console.log('✅ Time slot validated:', bookingTime);

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

        const eventIds = await googleCalendarService.createBookingEvent(
          booking,
          business,
          service,
          JSON.parse(business.googleCalendarTokens),
          clientTokens,
          chatMessages
        );
        
        await booking.update({ 
          googleCalendarEventId: eventIds.businessEventId,
          clientCalendarEventId: eventIds.clientEventId
        });

        calendarSyncStatus.businessCalendarSynced = !!eventIds.businessEventId;
        calendarSyncStatus.clientCalendarSynced = !!eventIds.clientEventId;

        console.log('✅ Calendar sync status:', calendarSyncStatus);

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

    // ✅ FIX: Send email notifications (non-blocking)
    try {
      const emailSvc = getEmailService(req);
      await emailSvc.sendBookingConfirmation(booking, business, service);
      console.log('✅ Confirmation emails sent successfully');
    } catch (emailError) {
      console.error('❌ Email sending failed (non-blocking):', emailError.message);
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

// ==================== REQUEST CANCELLATION ====================
router.post('/:id/request-cancellation', async (req, res) => {
  try {
    const { requestedBy, reason, clientEmail } = req.body;
    // requestedBy: 'client' or 'business'

    const booking = await db.Booking.findOne({
      where: { id: req.params.id },
      include: [
        { model: db.Service, as: 'Service' },
        { model: db.Business, as: 'Business' }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Validate requester
    if (requestedBy === 'client' && booking.clientEmail !== clientEmail) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }

    // Create cancellation request
    const cancellationRequest = await db.CancellationRequest.create({
      bookingId: booking.id,
      requestedBy,
      reason,
      status: 'pending'
    });

    console.log('📝 Cancellation request created:', cancellationRequest.id);

    // Send email notifications
    try {
      const emailSvc = getEmailService(req);
      await emailSvc.sendCancellationRequest(
        booking,
        booking.Business,
        booking.Service,
        requestedBy,
        reason
      );
      console.log('✅ Cancellation request email sent');
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
    }

    res.json({ 
      message: 'Cancellation request sent successfully',
      cancellationRequest
    });

  } catch (error) {
    console.error('❌ Request cancellation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== RESPOND TO CANCELLATION REQUEST ====================
router.post('/:id/respond-cancellation', authMiddleware, async (req, res) => {
  try {
    const { cancellationRequestId, response, respondedBy } = req.body;
    // response: 'approved' or 'rejected'
    // respondedBy: 'client' or 'business'

    const cancellationRequest = await db.CancellationRequest.findByPk(cancellationRequestId, {
      include: [{
        model: db.Booking,
        as: 'Booking',
        include: [
          { model: db.Service, as: 'Service' },
          { model: db.Business, as: 'Business' }
        ]
      }]
    });

    if (!cancellationRequest) {
      return res.status(404).json({ message: 'Cancellation request not found' });
    }

    if (cancellationRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    const booking = cancellationRequest.Booking;

    // Update cancellation request
    await cancellationRequest.update({
      status: response,
      respondedBy,
      respondedAt: new Date()
    });

    console.log('📝 Cancellation request updated:', response);

    // If approved, cancel the booking
    if (response === 'approved') {
      await booking.update({ 
        status: 'cancelled',
        cancelledBy: cancellationRequest.requestedBy,
        cancellationReason: cancellationRequest.reason,
        cancelledAt: new Date()
      });

      console.log('✅ Booking cancelled:', booking.id);

      // Delete calendar events
      try {
        if (booking.Business.googleCalendarTokens && booking.googleCalendarEventId) {
          await googleCalendarService.deleteBookingEvent(
            booking.googleCalendarEventId,
            JSON.parse(booking.Business.googleCalendarTokens)
          );
          console.log('📅 Business calendar event deleted');
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
            console.log('📅 Client calendar event deleted');
          }
        }
      } catch (calendarError) {
        console.error('⚠️ Calendar delete failed:', calendarError.message);
      }
    }

    // Send email notifications
    try {
      const emailSvc = getEmailService(req);
      await emailSvc.sendCancellationResponse(
        booking,
        booking.Business,
        booking.Service,
        cancellationRequest,
        response,
        respondedBy
      );
      console.log('✅ Cancellation response email sent');
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
    }

    res.json({ 
      message: `Cancellation ${response} successfully`,
      booking,
      cancellationRequest
    });

  } catch (error) {
    console.error('❌ Respond to cancellation error:', error);
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

    const chatMessages = await db.Message.findAll({
      where: {
        businessId: req.business.id,
        clientEmail: booking.clientEmail
      },
      order: [['createdAt', 'ASC']],
      limit: 20
    });

    try {
      const business = await db.Business.findByPk(req.business.id);
      
      if (business.googleCalendarTokens) {
        if (status === 'cancelled') {
          if (booking.googleCalendarEventId) {
            await googleCalendarService.deleteBookingEvent(
              booking.googleCalendarEventId,
              JSON.parse(business.googleCalendarTokens)
            );
            console.log('📅 Business calendar event deleted');
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
              console.log('📅 Client calendar event deleted');
            }
          }

        } else {
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
        { model: db.Business, as: 'Business', include: [{ model: db.Schedule, as: 'schedules' }] }
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

    const existingBookings = await db.Booking.findAll({
      where: { 
        businessId: booking.businessId,
        bookingDate,
        status: ['pending', 'confirmed'],
        id: { [db.Sequelize.Op.ne]: booking.id }
      },
      include: [{ model: db.Service, as: 'Service' }]
    });

    const slotsData = await availabilityService.getAvailableSlotsWithStatus(
      booking.Business,
      booking.Service,
      bookingDate,
      existingBookings
    );

    const isAvailable = slotsData.availableSlots.some(slot => slot.time === bookingTime);

    if (!isAvailable) {
      return res.status(400).json({ 
        message: 'This time slot is not available' 
      });
    }

    await booking.update({ bookingDate, bookingTime });

    const chatMessages = await db.Message.findAll({
      where: {
        businessId: booking.businessId,
        clientEmail: booking.clientEmail
      },
      order: [['createdAt', 'ASC']],
      limit: 20
    });

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

// ==================== CANCEL BOOKING (CLIENT - LEGACY) ====================
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

    const slotsData = await availabilityService.getAvailableSlotsWithStatus(
      business,
      service,
      bookingDate,
      existingBookings
    );

    const isAvailable = slotsData.availableSlots.some(slot => slot.time === bookingTime);

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