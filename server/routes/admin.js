const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const adminAuth = require('../middleware/adminAuth');

// ==================== ADMIN LOGIN ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await db.Admin.findOne({ where: { email } });
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ message: 'Account is disabled' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== GET DASHBOARD STATS ====================
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalBusinesses = await db.Business.count();
    const activeBusinesses = await db.Business.count({ 
      where: { subscriptionStatus: 'active' } 
    });
    const trialBusinesses = await db.Business.count({ 
      where: { subscriptionStatus: 'trial' } 
    });
    const pausedBusinesses = await db.Business.count({ 
      where: { isPaused: true } 
    });
    
    const totalBookings = await db.Booking.count();
    const pendingBookings = await db.Booking.count({ 
      where: { status: 'pending' } 
    });
    const confirmedBookings = await db.Booking.count({ 
      where: { status: 'confirmed' } 
    });
    
    const totalServices = await db.Service.count();
    const totalMessages = await db.Message.count();

    const monthlySubscriptions = await db.Business.count({ 
      where: { subscriptionPlan: 'monthly', subscriptionStatus: 'active' } 
    });
    const yearlySubscriptions = await db.Business.count({ 
      where: { subscriptionPlan: 'yearly', subscriptionStatus: 'active' } 
    });
    
    const monthlyRevenue = (monthlySubscriptions * 9.99) + (yearlySubscriptions * 99.99 / 12);

    res.json({
      businesses: {
        total: totalBusinesses,
        active: activeBusinesses,
        trial: trialBusinesses,
        paused: pausedBusinesses
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings
      },
      content: {
        services: totalServices,
        messages: totalMessages
      },
      revenue: {
        monthly: monthlyRevenue.toFixed(2),
        yearly: (monthlyRevenue * 12).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== GET ALL BUSINESSES ====================
router.get('/businesses', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = 'all', plan = 'all' } = req.query;
    
    const where = {};
    
    if (search) {
      where[db.Sequelize.Op.or] = [
        { businessName: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { email: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { ownerName: { [db.Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (status !== 'all') {
      where.subscriptionStatus = status;
    }
    
    if (plan !== 'all') {
      where.subscriptionPlan = plan;
    }

    const offset = (page - 1) * limit;

    const { count, rows: businesses } = await db.Business.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        { 
          model: db.Booking, 
          as: 'bookings',
          attributes: ['id', 'status']
        },
        { 
          model: db.Service, 
          as: 'services',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const enrichedBusinesses = businesses.map(business => {
      const b = business.toJSON();
      b.totalBookings = b.bookings?.length || 0;
      b.totalServices = b.services?.length || 0;
      
      if (b.trialEndsAt) {
        const now = new Date();
        const trialEnd = new Date(b.trialEndsAt);
        const daysLeft = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
        b.trialDaysLeft = daysLeft;
      }
      
      return b;
    });

    res.json({
      businesses: enrichedBusinesses,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== GET SINGLE BUSINESS ====================
router.get('/businesses/:id', adminAuth, async (req, res) => {
  try {
    const business = await db.Business.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: db.Service, as: 'services' },
        { model: db.Booking, as: 'bookings' },
        { model: db.Gallery, as: 'gallery' },
        { model: db.Schedule, as: 'schedules' },
        { model: db.Review, as: 'reviews' },
        { model: db.Message, as: 'messages' }
      ]
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json({ business });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== UPDATE BUSINESS SUBSCRIPTION ====================
router.put('/businesses/:id/subscription', adminAuth, async (req, res) => {
  try {
    const { subscriptionPlan, subscriptionStatus } = req.body;

    const business = await db.Business.findByPk(req.params.id);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const updateData = {};
    
    if (subscriptionPlan) {
      updateData.subscriptionPlan = subscriptionPlan;
      
      if (subscriptionPlan !== 'free') {
        updateData.subscriptionStartDate = new Date();
        
        const endDate = new Date();
        if (subscriptionPlan === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (subscriptionPlan === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        updateData.subscriptionEndDate = endDate;
      }
    }
    
    if (subscriptionStatus) {
      updateData.subscriptionStatus = subscriptionStatus;
    }

    await business.update(updateData);

    res.json({ 
      message: 'Subscription updated successfully',
      business: await db.Business.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
      })
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== PAUSE/UNPAUSE BUSINESS ====================
router.put('/businesses/:id/pause', adminAuth, async (req, res) => {
  try {
    const { isPaused, reason } = req.body;

    const business = await db.Business.findByPk(req.params.id);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    await business.update({
      isPaused,
      pausedAt: isPaused ? new Date() : null,
      pauseReason: isPaused ? reason : null
    });

    res.json({ 
      message: isPaused ? 'Business paused successfully' : 'Business unpaused successfully',
      business: await db.Business.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
      })
    });
  } catch (error) {
    console.error('Pause business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== DELETE BUSINESS ====================
router.delete('/businesses/:id', adminAuth, async (req, res) => {
  try {
    const business = await db.Business.findByPk(req.params.id);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    await db.Schedule.destroy({ where: { businessId: req.params.id } });
    await db.Service.destroy({ where: { businessId: req.params.id } });
    await db.Gallery.destroy({ where: { businessId: req.params.id } });
    await db.Booking.destroy({ where: { businessId: req.params.id } });
    await db.Message.destroy({ where: { businessId: req.params.id } });
    await db.Review.destroy({ where: { businessId: req.params.id } });
    
    await business.destroy();

    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Delete business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== EXTEND TRIAL ====================
router.put('/businesses/:id/extend-trial', adminAuth, async (req, res) => {
  try {
    const { days } = req.body;

    const business = await db.Business.findByPk(req.params.id);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const newTrialEnd = new Date(business.trialEndsAt || new Date());
    newTrialEnd.setDate(newTrialEnd.getDate() + parseInt(days));

    await business.update({
      trialEndsAt: newTrialEnd
    });

    res.json({ 
      message: `Trial extended by ${days} days`,
      business: await db.Business.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
      })
    });
  } catch (error) {
    console.error('Extend trial error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;