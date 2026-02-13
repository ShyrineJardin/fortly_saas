const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

function generateSlug(businessName) {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Register business
router.post('/signup', async (req, res) => {
  try {
    const { businessName, email, password } = req.body;

    // Check if business already exists
    const existingBusiness = await db.Business.findOne({
      where: { email }
    });

    if (existingBusiness) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if business name is taken
    const existingName = await db.Business.findOne({
      where: { businessName }
    });

    if (existingName) {
      return res.status(400).json({ message: 'Business name already taken' });
    }

     // Generate unique slug
    let baseSlug = generateSlug(businessName);
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug exists and make it unique
    let slugExists = await db.Business.findOne({ where: { slug } });
    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await db.Business.findOne({ where: { slug } });
      counter++;
    }

    // Create business
    const business = await db.Business.create({
      businessName,
      email,
      password,
      slug
    });

    // Generate token
    const token = jwt.sign(
      { id: business.id, email: business.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Business registered successfully',
      token,
      business: {
        id: business.id,
        businessName: business.businessName,
        email: business.email,
        slug: business.slug,
        onboardingCompleted: business.onboardingCompleted
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login business
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find business
    const business = await db.Business.findOne({ where: { email } });

    if (!business) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await business.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: business.id, email: business.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      business: {
        id: business.id,
        businessName: business.businessName,
        email: business.email,
        slug: business.slug,
        onboardingCompleted: business.onboardingCompleted
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current business (verify token)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const business = await db.Business.findByPk(req.business.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: db.Schedule, as: 'schedules',  required: false  }] 
    });

    res.json({ business });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const businessId = req.business.id;

    // Delete all related data (cascading delete)
    await db.Schedule.destroy({ where: { businessId } });
    await db.Service.destroy({ where: { businessId } });
    await db.Gallery.destroy({ where: { businessId } });
    await db.Booking.destroy({ where: { businessId } });
    await db.Message.destroy({ where: { businessId } });
    await db.Review.destroy({ where: { businessId } });
    
    // Finally delete the business
    await db.Business.destroy({ where: { id: businessId } });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;