const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/services/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

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
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
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
      serviceData.image = '/uploads/services/' + req.file.filename;
    }

    const service = await db.Service.create(serviceData);

    res.status(201).json({ 
      message: 'Service created successfully',
      service 
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update service
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
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
      updateData.image = '/uploads/services/' + req.file.filename;
    }

    await service.update(updateData);

    res.json({ 
      message: 'Service updated successfully',
      service 
    });
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