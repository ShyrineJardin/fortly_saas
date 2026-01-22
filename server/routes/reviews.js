const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get approved reviews for a business (public - for clients)
router.get('/business/:slug', async (req, res) => {
  try {
    const business = await db.Business.findOne({ where: { slug: req.params.slug } });
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const reviews = await db.Review.findAll({
      where: { 
        businessId: business.id,
        isApproved: true 
      },
      order: [['createdAt', 'DESC']]
    });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    res.json({ 
      reviews,
      businessName: business.businessName,
      stats: {
        totalReviews: reviews.length,
        averageRating: avgRating.toFixed(1)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reviews for business (authenticated - for business dashboard)
router.get('/my-reviews', authMiddleware, async (req, res) => {
  try {
    const reviews = await db.Review.findAll({
      where: { businessId: req.business.id },
      order: [['createdAt', 'DESC']]
    });

    // Calculate stats
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    res.json({ 
      reviews,
      stats: {
        totalReviews: reviews.length,
        averageRating: avgRating.toFixed(1),
        repliedCount: reviews.filter(r => r.businessReply).length
      }
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create review (client - no auth, AUTO-APPROVED)
router.post('/', async (req, res) => {
  try {
    const { businessSlug, clientName, clientEmail, rating, comment } = req.body;

    const business = await db.Business.findOne({ where: { slug: businessSlug } });
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check if client already reviewed
    const existingReview = await db.Review.findOne({
      where: { 
        businessId: business.id,
        clientEmail 
      }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already submitted a review' });
    }

    const review = await db.Review.create({
      businessId: business.id,
      clientName,
      clientEmail,
      rating,
      comment,
      isApproved: true // AUTO-APPROVE!
    });

    res.status(201).json({ 
      message: 'Review submitted successfully!',
      review 
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reply to review (business only - CANNOT delete or edit review)
router.put('/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { businessReply } = req.body;

    const review = await db.Review.findOne({
      where: { id: req.params.id, businessId: req.business.id }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.update({ 
      businessReply,
      repliedAt: new Date()
    });

    res.json({ 
      message: 'Reply added successfully',
      review 
    });
  } catch (error) {
    console.error('Reply to review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;