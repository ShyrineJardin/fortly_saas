const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function createAdmin() {
  try {
    await db.sequelize.sync();

    const email = 'admin@fortly.xyz';
    const password = 'admin123'; // Change this!
    const name = 'Admin';

    const existingAdmin = await db.Admin.findOne({ where: { email } });
    
    if (existingAdmin) {
      console.log('❌ Admin already exists:', email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await db.Admin.create({
      email,
      password: hashedPassword,
      name,
      role: 'super_admin',
      isActive: true
    });

    console.log('✅ Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();