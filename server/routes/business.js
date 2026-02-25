const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { uploadLogo } = require('../config/cloudinary');

// Get business by slug (public route for clients)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const business = await db.Business.findOne({
      where: { slug },
      attributes: { exclude: ['password'] },
      include: [
        { model: db.Service, as: 'services', where: { isActive: true }, required: false },
        { model: db.Gallery, as: 'gallery' },
        { model: db.Schedule, as: 'schedules' },
        { 
          model: db.Review, 
          as: 'reviews', 
          where: { isApproved: true }, 
          required: false 
        }
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

// Complete onboarding
router.put('/onboarding', authMiddleware, uploadLogo.fields([
  { name: 'logo', maxCount: 1 },
]), async (req, res) => {
  try {
    const { 
      businessName,
      ownerName, 
      category, 
      phone, 
      location, 
      tagline, 
      description,
      timezone,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    const business = await db.Business.findByPk(req.business.id);

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    const updateData = {
      ownerName,
      category,
      phone,
      location,
      tagline,
      description,
      timezone: timezone || 'Asia/Manila',
      facebook,
      twitter,
      instagram,
      linkedin,
      onboardingCompleted: true
    };

    if (businessName && businessName.trim()) {
      // Only update if it's different from current name
      if (businessName !== business.businessName) {
        // Check if new business name is already taken by another business
        const existingBusiness = await db.Business.findOne({
          where: { 
            businessName,
            id: { [db.Sequelize.Op.ne]: business.id }
          }
        });

        if (existingBusiness) {
          return res.status(400).json({ message: 'Business name already taken' });
        }

        // Generate new slug from business name
        const baseSlug = businessName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        let slug = baseSlug;
        let counter = 1;
        
        // Check if slug exists
        let slugExists = await db.Business.findOne({ 
          where: { 
            slug,
            id: { [db.Sequelize.Op.ne]: business.id }
          }
        });
        
        // Make slug unique if needed
        while (slugExists) {
          slug = `${baseSlug}-${counter}`;
          slugExists = await db.Business.findOne({ 
            where: { 
              slug,
              id: { [db.Sequelize.Op.ne]: business.id }
            }
          });
          counter++;
        }

        updateData.businessName = businessName;
        updateData.slug = slug;
      }
    }

    // Handle logo upload
    if (req.files?.logo) {
      updateData.logo = req.files.logo[0].path; // Cloudinary URL
    }

    // Update the business
    await db.Business.update(updateData, {
      where: { id: req.business.id }
    });

    // Fetch updated business data
    const updatedBusiness = await db.Business.findByPk(req.business.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({ 
      message: 'Onboarding completed successfully',
      business: updatedBusiness 
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update business profile
router.put('/profile', authMiddleware, uploadLogo.fields([
  { name: 'logo', maxCount: 1 },
]), async (req, res) => {
  try {
    const { 
      ownerName,
      category,
      phone, 
      location, 
      tagline,
      description,
      timezone,
      facebook,
      twitter,
      instagram,
      linkedin,
      businessHours,
      bufferTime
    } = req.body;
    
    const updateData = {
      ownerName,
      category,
      phone,
      location,
      tagline,
      description,
      timezone,
      facebook,
      twitter,
      instagram,
      linkedin,
      // Handle optional buffer time - set to null if empty string
      bufferTime: bufferTime !== undefined ? (bufferTime || null) : undefined
    };

    if (req.files?.logo) {
      updateData.logo = req.files.logo[0].path; // Cloudinary URL
    }

    await db.Business.update(updateData, {
      where: { id: req.business.id }
    });

    if (businessHours) {
      const hours = typeof businessHours === 'string' 
        ? JSON.parse(businessHours) 
        : businessHours;

      // Delete existing schedules
      await db.Schedule.destroy({
        where: { businessId: req.business.id }
      });

      // Create new schedules with rest time support
      const schedulePromises = hours
        .filter(hour => hour.enabled && hour.startTime && hour.endTime)
        .map(hour => 
          db.Schedule.create({
            businessId: req.business.id,
            dayOfWeek: hour.day,
            startTime: hour.startTime,
            endTime: hour.endTime,
            enabled: hour.enabled,
            hasRest: hour.hasRest || false,
            restStartTime: hour.restStartTime || null,
            restEndTime: hour.restEndTime || null
          })
        );

      await Promise.all(schedulePromises);
    }

    const updatedBusiness = await db.Business.findByPk(req.business.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: db.Schedule, as: 'schedules' }]
    });

    res.json({ 
      message: 'Profile updated successfully',
      business: updatedBusiness 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update booking policy 
router.put('/booking-policy', authMiddleware, async (req, res) => {
  try {
    const { title, description, policyList } = req.body;

    await db.Business.update({
      bookingPolicyTitle: title,
      bookingPolicyDescription: description,
      bookingPolicyList: policyList
    }, {
      where: { id: req.business.id }
    });

    const updatedBusiness = await db.Business.findByPk(req.business.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      message: 'Booking policy updated successfully',
      business: updatedBusiness
    });
  } catch (error) {
    console.error('Update booking policy error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;