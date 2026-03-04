const jwt = require('jsonwebtoken');
const db = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No admin token provided' });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);
    const admin = await db.Admin.findByPk(decoded.id);

    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Invalid admin access' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ message: 'Unauthorized admin access' });
  }
};