require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./config/database');

// Import Sequelize and DataTypes from db
const { sequelize, Sequelize } = db;
const { DataTypes } = Sequelize;

// Import routes
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/business');
const serviceRoutes = require('./routes/services');
const galleryRoutes = require('./routes/gallery');
const bookingRoutes = require('./routes/bookings');
const chatRoutes = require('./routes/chat');
const reviewRoutes = require('./routes/reviews');
const googleCalendarRoutes = require('./routes/googleCalendar');
const googleAuthRoutes = require('./routes/google-auth');
const { startReminderScheduler } = require('./services/reminderScheduler');
const adminRoutes = require('./routes/admin');
const lemonsqueezyRoutes = require('./routes/lemonsqueezy');

// Now we can use sequelize and DataTypes
const ClientCalendarToken = require('./models/ClientCalendarToken')(sequelize, DataTypes);

const app = express();
const server = http.createServer(app);

// Add ClientCalendarToken to db object
db.ClientCalendarToken = ClientCalendarToken;

// Configure Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Set up associations
if (db.Business) {
  db.Business.hasMany(ClientCalendarToken, { foreignKey: 'businessId', as: 'clientTokens' });
  ClientCalendarToken.belongsTo(db.Business, { foreignKey: 'businessId', as: 'Business' });
}

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
// ── Lemon Squeezy webhook needs raw body — must be before express.json ──
app.use('/api/lemonsqueezy/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 50000 }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Store connected users
const connectedUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('join-business', (businessSlug) => {
    socket.join(`business-${businessSlug}`);
    connectedUsers.set(socket.id, { type: 'business', businessSlug });
    console.log(`👔 Business ${businessSlug} joined room`);
  });

  socket.on('join-client', ({ businessSlug, clientEmail }) => {
    const roomName = `client-${businessSlug}-${clientEmail}`;
    socket.join(roomName);
    connectedUsers.set(socket.id, { type: 'client', businessSlug, clientEmail });
    console.log(`👤 Client ${clientEmail} joined room for business ${businessSlug}`);
  });

  socket.on('typing', (data) => {
    if (data.sender === 'business') {
      io.to(`client-${data.businessSlug}-${data.clientEmail}`).emit('typing', {
        isTyping: data.isTyping,
        sender: 'business'
      });
    } else {
      io.to(`business-${data.businessSlug}`).emit('typing', {
        isTyping: data.isTyping,
        sender: 'client',
        clientEmail: data.clientEmail,
        clientName: data.clientName
      });
    }
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`👋 ${user.type} disconnected:`, socket.id);
      connectedUsers.delete(socket.id);
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/googleCalendar', googleCalendarRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lemonsqueezy', lemonsqueezyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server — single entry point
const PORT = process.env.PORT || 5000;

db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully');
    return db.sequelize.sync({ force: false }); // schema managed by migrateDatabase.js
  })
  .then(async () => {                          // ← async here is the key fix
    console.log('✅ Database synced');

    // ── Auto-migration: run on every deploy, all IF NOT EXISTS so safe to repeat ──
    const migrations = [
      // Bookings
      `ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "reminderSent" BOOLEAN NOT NULL DEFAULT false`,

      // Business subscription columns
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "subscriptionPlan" VARCHAR(50) NOT NULL DEFAULT 'free'`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "subscriptionStartDate" TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "subscriptionEndDate" TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "isPaused" BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "pausedAt" TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "pauseReason" TEXT`,

      // Business subscriptionStatus — VARCHAR to avoid ENUM casting issues
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "subscriptionStatus" VARCHAR(50) NOT NULL DEFAULT 'trial'`,

      // Set trialEndsAt for existing businesses that don't have it yet (30 days from account creation)
      `UPDATE "Businesses" SET "trialEndsAt" = "createdAt" + INTERVAL '30 days' WHERE "trialEndsAt" IS NULL`,

      // Admins table
      `CREATE TABLE IF NOT EXISTS "Admins" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "role" VARCHAR(50) NOT NULL DEFAULT 'super_admin',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )`
    ];

    for (const sql of migrations) {
      try {
        await db.sequelize.query(sql);
        console.log('✅ Migration OK:', sql.slice(0, 60));
      } catch (err) {
        console.warn('⚠️  Migration FAILED:', err.message.split('\n')[0]);
        console.warn('    SQL was:', sql.slice(0, 80));
      }
    }

    // ── Verify columns actually exist after migration ──
    try {
      const [cols] = await db.sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'Businesses'
        AND column_name IN ('subscriptionPlan','subscriptionStatus','isPaused','trialEndsAt')
      `);
      console.log('✅ Verified columns:', cols.map(c => c.column_name).join(', ') || 'NONE FOUND ❌');
    } catch (e) {
      console.warn('⚠️  Column check failed:', e.message);
    }

    console.log('✅ Migrations complete');

    // ── Auto-create default admin if none exists ──
    try {
      const adminCount = await db.sequelize.query(
        'SELECT COUNT(*) as count FROM "Admins"',
        { type: db.Sequelize.QueryTypes.SELECT }
      );
      const count = parseInt(adminCount[0].count);
      if (count === 0) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@Fortly2024!', 10);
        await db.sequelize.query(`
          INSERT INTO "Admins" ("id", "email", "password", "name", "role", "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), :email, :password, 'Super Admin', 'super_admin', true, NOW(), NOW())
        `, {
          replacements: {
            email: process.env.ADMIN_EMAIL || 'admin@fortly.xyz',
            password: hashedPassword
          },
          type: db.Sequelize.QueryTypes.INSERT
        });
        console.log('✅ Default admin created:', process.env.ADMIN_EMAIL || 'admin@fortly.xyz');
        console.log('🔑 Password:', process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@Fortly2024!');
        console.log('⚠️  Change this password immediately via Admin Settings!');
      } else {
        console.log('✅ Admin account exists');
      }
    } catch (err) {
      console.warn('⚠️  Admin seed warning:', err.message);
    }

    // Start reminder scheduler after DB is ready
    startReminderScheduler();
    console.log('⏰ Reminder scheduler started');

    // Start the HTTP + Socket.IO server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📧 Resend email configured`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });