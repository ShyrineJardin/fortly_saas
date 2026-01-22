const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Create booking (client - no auth required)
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
      notes 
    } = req.body;

    // Find business
    const business = await db.Business.findOne({ where: { slug: businessSlug } });
    
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

    // Create booking
    const booking = await db.Booking.create({
      businessId: business.id,
      serviceId,
      clientName,
      clientEmail,
      clientPhone,
      bookingDate,
      bookingTime,
      notes,
      status: 'pending'
    });

    // Include service details in response
    const bookingWithService = await db.Booking.findByPk(booking.id, {
      include: [{ model: db.Service, as: 'Service' }]
    });

    res.status(201).json({ 
      message: 'Booking created successfully',
      booking: bookingWithService 
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all bookings for business
router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    const { status, date } = req.query;
    
    const whereClause = { businessId: req.business.id };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (date) {
      whereClause.bookingDate = date;
    }

    const bookings = await db.Booking.findAll({
      where: whereClause,
      include: [
        { model: db.Service, as: 'Service' }
      ],
      order: [['bookingDate', 'ASC'], ['bookingTime', 'ASC']]
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await db.Booking.findOne({
      where: { id: req.params.id, businessId: req.business.id },
      include: [{ model: db.Service, as: 'Service' }]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await db.Booking.findOne({
      where: { id: req.params.id, businessId: req.business.id }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await booking.update({ status });

    res.json({ 
      message: 'Booking status updated successfully',
      booking 
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a date
router.get('/available-slots/:businessSlug/:date', async (req, res) => {
  try {
    const { businessSlug, date } = req.params;
    
    const business = await db.Business.findOne({ 
      where: { slug: businessSlug },
      include: [{ model: db.Schedule, as: 'schedules' }]
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Get bookings for that date
    const bookings = await db.Booking.findAll({
      where: { 
        businessId: business.id, 
        bookingDate: date,
        status: ['pending', 'confirmed']
      }
    });

    // Get day of week (0 = Sunday)
    const dayOfWeek = new Date(date).getDay();
    
    // Find schedule for that day
    const schedule = business.schedules.find(s => s.dayOfWeek === dayOfWeek && s.isOpen);

    if (!schedule) {
      return res.json({ availableSlots: [] });
    }

    // Generate time slots (you can customize this logic)
    const bookedTimes = bookings.map(b => b.bookingTime);
    
    res.json({ 
      schedule: {
        openTime: schedule.openTime,
        closeTime: schedule.closeTime
      },
      bookedTimes
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;