const jwt = require('jsonwebtoken');
const db = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const business = await db.Business.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!business) {
      return res.status(401).json({ message: 'Business not found' });
    }

    // ── Pause enforcement: block all authenticated business actions ──
    if (business.isPaused) {
      return res.status(403).json({
        message: 'Your account has been paused. Please contact support.',
        isPaused: true,
        pauseReason: business.pauseReason || null
      });
    }

    req.business = business;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};