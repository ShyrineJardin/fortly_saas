const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const adminAuth = require('../middleware/adminAuth');
router.get('/reset-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    await db.sequelize.query('DELETE FROM "Admins"');
    const hash = await bcrypt.hash('Fortly2024', 10);
    await db.sequelize.query(
      `INSERT INTO "Admins" ("id","email","password","name","role","isActive","createdAt","updatedAt")
       VALUES (gen_random_uuid(), 'admin@fortly.xyz', '${hash}', 'Super Admin', 'super_admin', true, NOW(), NOW())`
    );
    const match = await bcrypt.compare('Fortly2024', hash);
    res.json({ 
      success: true, 
      message: 'Admin reset done',
      bcryptTest: match,
      hash: hash.substring(0, 20)
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});