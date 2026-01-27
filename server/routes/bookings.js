const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const availabilityService = require('../services/availabilityService');
const googleCalendarService = require('../services/googleCalendarService');
const emailService = require('../services/emailService');
const moment = require('moment-timezone');

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
      clientAddress
    } = req.body;

    console.log('📝 Creating booking:', { businessSlug, serviceId, clientEmail, bookingDate, bookingTime });

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
      order: [['createdAt', 'DESC']],
      limit: 10 // Get last 10 messages
    });

    // Attach chat reference to booking if messages exist
    if (chatMessages.length > 0) {
      await booking.update({
        hasChatHistory: true,
        lastChatMessageAt: chatMessages[0].createdAt
      });
      console.log('💬 Attached', chatMessages.length, 'chat messages to booking');
    }

    // Include service details in response
    const bookingWithService = await db.Booking.findByPk(booking.id, {
      include: [{ model: db.Service, as: 'Service' }]
    });

    // Try to create Google Calendar events (non-blocking)
    try {
      // Check if business has Google Calendar connected
      if (business.googleCalendarTokens) {
        const calendarEvent = await googleCalendarService.createBookingEvent(
          booking,
          business,
          service,
          JSON.parse(business.googleCalendarTokens)
        );
        
        // Save calendar event ID
        await booking.update({ googleCalendarEventId: calendarEvent.id });
        console.log('📅 Google Calendar event created');
      }
    } catch (calendarError) {
      console.error('⚠️ Calendar sync failed (non-blocking):', calendarError.message);
      // Don't fail the booking if calendar sync fails
    }

    // Send email notifications (non-blocking)
    try {
      await emailService.sendBookingConfirmation(
        booking,
        business,
        service
      );
      console.log('📧 Confirmation email sent');
    } catch (emailError) {
      console.error('⚠️ Email sending failed (non-blocking):', emailError.message);
    }

    res.status(201).json({ 
      message: 'Booking created successfully',
      booking: bookingWithService,
      hasChatHistory: chatMessages.length > 0,
      chatMessageCount: chatMessages.length
    });

  } catch (error) {
    console.error('❌ Create booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== GET AVAILABLE SLOTS ====================
router.get('/available-slots/:businessSlug/:date', async (req, res) => {
  try {
    const { businessSlug, date } = req.params;
    const { serviceId } = req.query;

    console.log('🔍 Checking available slots:', { businessSlug, date, serviceId });

    // Find business with schedules
    const business = await db.Business.findOne({ 
      where: { slug: businessSlug },
      include: [{ model: db.Schedule, as: 'schedules' }]
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Get service
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
        bookingDate: date,
        status: ['pending', 'confirmed']
      },
      include: [{ model: db.Service, as: 'Service' }]
    });

    // Generate available slots
    const availableSlots = await availabilityService.getAvailableSlots(
      business,
      service,
      date,
      existingBookings
    );

    // Get minimum advance booking requirement
    const minAdvanceDays = availabilityService.getMinAdvanceDays(
      business.bufferTime,
      service.duration
    );

    res.json({ 
      availableSlots,
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

    // Attach chat message count for each booking
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

// ==================== GET BOOKING BY ID ====================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await db.Booking.findOne({
      where: { id: req.params.id, businessId: req.business.id },
      include: [{ model: db.Service, as: 'Service' }]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get chat messages for this client
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

    // Update Google Calendar event if connected
    try {
      const business = await db.Business.findByPk(req.business.id);
      
      if (business.googleCalendarTokens && booking.googleCalendarEventId) {
        if (status === 'cancelled') {
          // Delete calendar event
          await googleCalendarService.deleteBookingEvent(
            booking.googleCalendarEventId,
            JSON.parse(business.googleCalendarTokens)
          );
          console.log('📅 Calendar event deleted');
        } else {
          // Update calendar event
          await googleCalendarService.updateBookingEvent(
            booking.googleCalendarEventId,
            booking,
            business,
            booking.Service,
            JSON.parse(business.googleCalendarTokens)
          );
          console.log('📅 Calendar event updated');
        }
      }
    } catch (calendarError) {
      console.error('⚠️ Calendar update failed:', calendarError.message);
    }

    // Send status update email
    try {
      await emailService.sendBookingStatusUpdate(
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

// ==================== GET CLIENT BOOKINGS ====================
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

    await booking.update({ status: 'cancelled' });

    // Update calendar if connected
    try {
      if (booking.Business.googleCalendarTokens && booking.googleCalendarEventId) {
        await googleCalendarService.deleteBookingEvent(
          booking.googleCalendarEventId,
          JSON.parse(booking.Business.googleCalendarTokens)
        );
      }
    } catch (calendarError) {
      console.error('⚠️ Calendar update failed:', calendarError.message);
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

// ==================== CHECK BOOKING AVAILABILITY ====================
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