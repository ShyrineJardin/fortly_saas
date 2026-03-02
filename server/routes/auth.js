const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

// Forgot Password - Send reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find business by email
    const business = await db.Business.findOne({ where: { email } });

    if (!business) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    business.resetPasswordToken = resetToken;
    business.resetPasswordExpires = resetTokenExpiry;
    await business.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/business/reset-password?token=${resetToken}`;

    // Get emailService from services folder
    const emailService = require('../services/emailService');

    // Send password reset email
    await emailService.sendPasswordResetEmail(business, resetUrl, resetToken);

    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
  }
});

// Reset Password - Update password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find business with valid reset token
    const business = await db.Business.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [db.Sequelize.Op.gt]: new Date() // Token not expired
        }
      }
    });

    if (!business) {
      return res.status(400).json({ message: 'Invalid or expired reset token. Please request a new password reset.' });
    }

    // Update password (will be hashed by the beforeCreate hook)
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    business.password = await bcrypt.hash(password, salt);
    
    // Clear reset token fields
    business.resetPasswordToken = null;
    business.resetPasswordExpires = null;
    
    await business.save();

    // Get emailService from services folder
    const emailService = require('../services/emailService');

    // Send confirmation email
    await emailService.sendPasswordResetConfirmation(business);

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password. Please try again.' });
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

    // ✅ CHECK FOR PENDING/CONFIRMED APPOINTMENTS
    const pendingBookings = await db.Booking.findAll({
      where: { 
        businessId,
        status: ['pending', 'confirmed']
      },
      include: [
        { model: db.Service, as: 'Service' }
      ],
      order: [['bookingDate', 'ASC'], ['bookingTime', 'ASC']]
    });

    if (pendingBookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account with pending appointments',
        pendingBookings: pendingBookings.map(booking => ({
          id: booking.id,
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          serviceName: booking.Service?.name,
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          status: booking.status
        }))
      });
    }

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