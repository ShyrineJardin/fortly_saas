const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { uploadGallery } = require('../config/cloudinary');

// Get gallery for a business (public)
router.get('/business/:slug', async (req, res) => {
  try {
    const business = await db.Business.findOne({ where: { slug: req.params.slug } });
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const gallery = await db.Gallery.findAll({
      where: { businessId: business.id },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({ gallery });
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get gallery for logged-in business
router.get('/my-gallery', authMiddleware, async (req, res) => {
  try {
    const gallery = await db.Gallery.findAll({
      where: { businessId: req.business.id },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({ gallery });
  } catch (error) {
    console.error('Get my gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload gallery media (image or video)
router.post('/', authMiddleware, uploadGallery.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { caption, order } = req.body;
    
    // Cloudinary provides the URL and resource type
    const mediaType = req.file.resource_type === 'video' ? 'video' : 'image';

    const galleryItem = await db.Gallery.create({
      businessId: req.business.id,
      mediaUrl: req.file.path, // Cloudinary URL
      mediaType: mediaType,
      caption: caption || '',
      order: order || 0
    });

    res.status(201).json({ 
      message: 'Media uploaded successfully',
      galleryItem 
    });
  } catch (error) {
    console.error('Upload gallery error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update gallery item
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { caption, order } = req.body;

    const galleryItem = await db.Gallery.findOne({
      where: { id: req.params.id, businessId: req.business.id }
    });

    if (!galleryItem) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    await galleryItem.update({ caption, order });

    res.json({ 
      message: 'Gallery item updated successfully',
      galleryItem 
    });
  } catch (error) {
    console.error('Update gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete gallery item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const galleryItem = await db.Gallery.findOne({
      where: { id: req.params.id, businessId: req.business.id }
    });

    if (!galleryItem) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    await galleryItem.destroy();

    res.json({ message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Delete gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;