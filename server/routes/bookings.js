const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const availabilityService = require('../services/availabilityService');
const emailService = require('../services/emailService')();

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch existing bookings for a date range (handles multi-day occupancy bookings).
 * For a given date we need bookings that:
 *   - start on that date, OR
 *   - are occupancy bookings whose span INCLUDES that date
 */
async function getRelevantBookings(businessId, date) {
  const { Op } = db.Sequelize;
  return db.Booking.findAll({
    where: {
      businessId,
      status: ['pending', 'confirmed'],
      [Op.or]: [
        { bookingDate: date },
        // Occupancy bookings that started before and end after this date
        {
          bookingDate: { [Op.lte]: date },
          bookingEndDate: { [Op.gte]: date }
        }
      ]
    },
    include: [{ model: db.Service, as: 'Service' }]
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE BOOKING
// ─────────────────────────────────────────────────────────────────────────────
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

    const business = await db.Business.findOne({
      where: { slug: businessSlug },
      include: [{ model: db.Schedule, as: 'schedules' }]
    });
    if (!business) return res.status(404).json({ message: 'Business not found' });

    const service = await db.Service.findOne({
      where: { id: serviceId, businessId: business.id }
    });
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // Get all bookings relevant to this date (including multi-day spans)
    const existingBookings = await getRelevantBookings(business.id, bookingDate);

    const slotsData = await availabilityService.getAvailableSlotsWithStatus(
      business, service, bookingDate, existingBookings
    );

    const isAvailable = slotsData.availableSlots.some(slot => slot.time === bookingTime);
    if (!isAvailable) {
      return res.status(400).json({
        message: 'This time slot is no longer available. Please select another time.'
      });
    }

    // Calculate end date/time for multi-day services
    const { endDate, endTime } = availabilityService.calculateEndDate(
      bookingDate,
      bookingTime,
      service.duration,
      business.timezone
    );

    const booking = await db.Booking.create({
      businessId: business.id,
      serviceId,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      bookingDate,
      bookingTime,
      bookingEndDate: endDate !== bookingDate ? endDate : null,
      bookingEndTime: endTime,
      notes,
      status: 'pending'
    });

    // Attach chat history flag
    const chatMessages = await db.Message.findAll({
      where: { businessId: business.id, clientEmail },
      order: [['createdAt', 'ASC']],
      limit: 20
    });

    if (chatMessages.length > 0) {
      await booking.update({
        hasChatHistory: true,
        lastChatMessageAt: chatMessages[chatMessages.length - 1].createdAt
      });
    }

    const bookingWithService = await db.Booking.findByPk(booking.id, {
      include: [{ model: db.Service, as: 'Service' }]
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking: bookingWithService,
      hasChatHistory: chatMessages.length > 0,
      chatMessageCount: chatMessages.length
    });

    emailService.sendBookingConfirmation(booking, business, service)
      .then(() => console.log('✅ Confirmation emails sent'))
      .catch(err => console.error('❌ Email failed:', err.message));

  } catch (error) {
    console.error('❌ Create booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET AVAILABLE SLOTS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/available-slots/:businessSlug/:date', async (req, res) => {
  try {
    const { businessSlug, date } = req.params;
    const { serviceId } = req.query;

    const business = await db.Business.findOne({
      where: { slug: businessSlug },
      include: [{ model: db.Schedule, as: 'schedules' }]
    });
    if (!business) return res.status(404).json({ message: 'Business not found' });

    const service = await db.Service.findOne({
      where: { id: serviceId, businessId: business.id }
    });
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // Use extended query that includes multi-day spans
    const existingBookings = await getRelevantBookings(business.id, date);

    const slotsData = await availabilityService.getAvailableSlotsWithStatus(
      business, service, date, existingBookings
    );

    const minAdvanceDays = availabilityService.getMinAdvanceDays(
      business.bufferTime,
      service.duration,
      service.serviceType || 'appointment'
    );

    res.json({
      availableSlots: slotsData.availableSlots,
      takenSlots: slotsData.takenSlots,
      closedDay: slotsData.closedDay,
      blockedByOccupancy: slotsData.blockedByOccupancy,
      minAdvanceDays,
      timezone: business.timezone,
      bufferTime: business.bufferTime,
      serviceDuration: service.duration,
      serviceType: service.serviceType || 'appointment',
      maxConcurrentBookings: business.maxConcurrentBookings || 1
    });

  } catch (error) {
    console.error('❌ Get available slots error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CHECK AVAILABILITY
// ─────────────────────────────────────────────────────────────────────────────
router.post('/check-availability', async (req, res) => {
  try {
    const { businessSlug, serviceId, bookingDate, bookingTime } = req.body;

    const business = await db.Business.findOne({
      where: { slug: businessSlug },
      include: [{ model: db.Schedule, as: 'schedules' }]
    });
    if (!business) return res.status(404).json({ message: 'Business not found' });

    const service = await db.Service.findOne({
      where: { id: serviceId, businessId: business.id }
    });
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const existingBookings = await getRelevantBookings(business.id, bookingDate);

    const slotsData = await availabilityService.getAvailableSlotsWithStatus(
      business, service, bookingDate, existingBookings
    );

    const isAvailable = slotsData.availableSlots.some(slot => slot.time === bookingTime);

    res.json({
      available: isAvailable,
      message: isAvailable ? 'Time slot is available' : 'Time slot is not available'
    });

  } catch (error) {
    console.error('❌ Check availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE BOOKING STATUS
// ─────────────────────────────────────────────────────────────────────────────
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
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const oldStatus = booking.status;
    await booking.update({ status });

    res.json({ message: 'Booking status updated successfully', booking });

    try {
      const business = await db.Business.findByPk(req.business.id);
      emailService.sendBookingStatusUpdate(booking, business, booking.Service, oldStatus, status)
        .catch(err => console.error('⚠️ Email failed:', err.message));
    } catch (e) {
      console.error('⚠️ Email init failed:', e.message);
    }

  } catch (error) {
    console.error('❌ Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RESCHEDULE BOOKING
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { bookingDate, bookingTime, clientEmail } = req.body;

    const booking = await db.Booking.findOne({
      where: { id: req.params.id, clientEmail },
      include: [
        { model: db.Service, as: 'Service' },
        { model: db.Business, as: 'Business', include: [{ model: db.Schedule, as: 'schedules' }] }
      ]
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cannot reschedule cancelled or completed bookings' });
    }

    const existingBookings = (await getRelevantBookings(booking.businessId, bookingDate))
      .filter(b => b.id !== booking.id);

    const slotsData = await availabilityService.getAvailableSlotsWithStatus(
      booking.Business, booking.Service, bookingDate, existingBookings
    );

    const isAvailable = slotsData.availableSlots.some(slot => slot.time === bookingTime);
    if (!isAvailable) {
      return res.status(400).json({ message: 'This time slot is not available' });
    }

    const { endDate, endTime } = availabilityService.calculateEndDate(
      bookingDate,
      bookingTime,
      booking.Service.duration,
      booking.Business.timezone
    );

    await booking.update({
      bookingDate,
      bookingTime,
      bookingEndDate: endDate !== bookingDate ? endDate : null,
      bookingEndTime: endTime
    });

    res.json({ message: 'Booking rescheduled successfully', booking });

  } catch (error) {
    console.error('❌ Reschedule booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL BOOKING
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/cancel', async (req, res) => {
  try {
    const { clientEmail, reason, cancelledBy } = req.body;

    const booking = await db.Booking.findOne({
      where: { id: req.params.id, clientEmail },
      include: [
        { model: db.Service, as: 'Service' },
        { model: db.Business, as: 'Business' }
      ]
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is already cancelled' });
    if (booking.status === 'completed') return res.status(400).json({ message: 'Cannot cancel completed bookings' });

    await booking.update({
      status: 'cancelled',
      cancelledBy: cancelledBy || 'client',
      cancellationReason: reason,
      cancelledAt: new Date()
    });

    res.json({ message: 'Booking cancelled successfully. Both parties have been notified.', booking });

    emailService.sendCancellationNotification(booking, booking.Business, booking.Service, reason, cancelledBy || 'client')
      .catch(err => console.error('⚠️ Email failed:', err.message));

  } catch (error) {
    console.error('❌ Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET BUSINESS BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    const { status, date, startDate, endDate } = req.query;
    const { Op } = db.Sequelize;
    const whereClause = { businessId: req.business.id };

    if (status) whereClause.status = status;
    if (date) whereClause.bookingDate = date;
    if (startDate && endDate) {
      whereClause.bookingDate = { [Op.between]: [startDate, endDate] };
    }

    const bookings = await db.Booking.findAll({
      where: whereClause,
      include: [{ model: db.Service, as: 'Service' }],
      order: [['bookingDate', 'ASC'], ['bookingTime', 'ASC']]
    });

    const bookingsWithChat = await Promise.all(
      bookings.map(async (booking) => {
        const messageCount = await db.Message.count({
          where: { businessId: req.business.id, clientEmail: booking.clientEmail }
        });
        return { ...booking.toJSON(), chatMessageCount: messageCount, hasChatHistory: messageCount > 0 };
      })
    );

    res.json({ bookings: bookingsWithChat });
  } catch (error) {
    console.error('❌ Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE BOOKING
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await db.Booking.findOne({
      where: { id: req.params.id, businessId: req.business.id },
      include: [{ model: db.Service, as: 'Service' }]
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const chatMessages = await db.Message.findAll({
      where: { businessId: req.business.id, clientEmail: booking.clientEmail },
      order: [['createdAt', 'ASC']]
    });

    res.json({ booking, chatMessages, hasChatHistory: chatMessages.length > 0 });
  } catch (error) {
    console.error('❌ Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET CLIENT BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────
router.get('/client/:clientEmail', async (req, res) => {
  try {
    const { clientEmail } = req.params;
    const { businessSlug } = req.query;
    const whereClause = { clientEmail };

    if (businessSlug) {
      const business = await db.Business.findOne({ where: { slug: businessSlug } });
      if (business) whereClause.businessId = business.id;
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

module.exports = router;