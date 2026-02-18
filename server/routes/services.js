const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { cloudinary, uploadLogo } = require('../config/cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs')

// Ensure upload directory exists
const uploadDir = 'uploads/services/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/services/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed'));
    }
    cb(null, true);
  }
});


// Get all services for a business (public)
router.get('/business/:slug', async (req, res) => {
  try {
    const business = await db.Business.findOne({ where: { slug: req.params.slug } });
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const services = await db.Service.findAll({
      where: { businessId: business.id, isActive: true }
    });

    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all services for logged-in business
router.get('/my-services', authMiddleware, async (req, res) => {
  try {
    const services = await db.Service.findAll({
      where: { businessId: req.business.id }
    });

    res.json({ services });
  } catch (error) {
    console.error('Get my services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create service
router.post('/', authMiddleware, uploadLogo.single('image'), async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;

    const serviceData = {
      businessId: req.business.id,
      name,
      description,
      price,
      duration
    };

    if (req.file) {
      serviceData.image = req.file.path; 
    }

    const service = await db.Service.create(serviceData);
    res.status(201).json({ message: 'Service created successfully', service });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update service
router.put('/:id', authMiddleware, uploadLogo.single('image'), async (req, res) => {
  try {
    const { name, description, price, duration, isActive } = req.body;

    const service = await db.Service.findOne({
      where: { id: req.params.id, businessId: req.business.id }
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const updateData = {
      name,
      description,
      price,
      duration,
      isActive: isActive !== undefined ? isActive : service.isActive
    };

    if (req.file) {
      updateData.image = req.file.path; 
    }

    await service.update(updateData);
    res.json({ message: 'Service updated successfully', service });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete service
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const service = await db.Service.findOne({
      where: { id: req.params.id, businessId: req.business.id }
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await service.destroy();

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;