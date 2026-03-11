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
const allowedOrigins = [
  "https://app.fortly.xyz",
  "https://dev.fortly.xyz",
  "http://localhost:3000",
  "http://localhost:5173"
];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,  
    pingInterval: 25000,
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
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
  console.log('🔌 New client connected:', socket.id, '| origin:', socket.handshake.headers.origin);
  console.log('🌐 Transport:', socket.conn.transport.name);

  socket.on('join-business', (businessSlug) => {
    console.log('📥 join-business received:', businessSlug, '| socket:', socket.id);
    const roomName = `business-${businessSlug}`;
    socket.join(roomName);
    connectedUsers.set(socket.id, { type: 'business', businessSlug });
    
    // ✅ Verify room join
    const room = io.sockets.adapter.rooms.get(roomName);
    console.log(`👔 Business ${businessSlug} joined room | Total in room: ${room?.size || 0}`);
    
    // ✅ Send confirmation back to client
    socket.emit('joined', { room: roomName, success: true });
  });

  socket.on('join-client', ({ businessSlug, clientEmail }) => {
    console.log('📥 join-client received:', businessSlug, clientEmail, '| socket:', socket.id);
    const roomName = `client-${businessSlug}-${clientEmail}`;
    socket.join(roomName);
    connectedUsers.set(socket.id, { type: 'client', businessSlug, clientEmail });
    
    // ✅ Verify room join
    const room = io.sockets.adapter.rooms.get(roomName);
    console.log(`👤 Client ${clientEmail} joined room for business ${businessSlug} | Total in room: ${room?.size || 0}`);
    
    // ✅ Send confirmation back to client
    socket.emit('joined', { room: roomName, success: true });
  });

  socket.on('typing', (data) => {
    console.log('⌨️  Typing event:', data.sender, data.isTyping);
    
    if (data.sender === 'business') {
      const roomName = `client-${data.businessSlug}-${data.clientEmail}`;
      console.log(`📤 Emitting typing to ${roomName}`);
      io.to(roomName).emit('typing', {
        isTyping: data.isTyping,
        sender: 'business'
      });
    } else {
      const roomName = `business-${data.businessSlug}`;
      console.log(`📤 Emitting typing to ${roomName}`);
      io.to(roomName).emit('typing', {
        isTyping: data.isTyping,
        sender: 'client',
        clientEmail: data.clientEmail,
        clientName: data.clientName
      });
    }
  });

  socket.on('disconnect', (reason) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`👋 ${user.type} disconnected:`, socket.id, '| reason:', reason);
      connectedUsers.delete(socket.id);
    } else {
      console.log(`👋 Unknown socket disconnected:`, socket.id, '| reason:', reason);
    }
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', socket.id, error);
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
    return db.sequelize.sync({ force: false });
  })
  .then(async () => {
    console.log('✅ Database synced');

    const migrations = [
      `ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "reminderSent" BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "subscriptionPlan" VARCHAR(50) NOT NULL DEFAULT 'free'`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "subscriptionStartDate" TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "subscriptionEndDate" TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "isPaused" BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "pausedAt" TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "pauseReason" TEXT`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "subscriptionStatus" VARCHAR(50) NOT NULL DEFAULT 'trial'`,
      `UPDATE "Businesses" SET "trialEndsAt" = "createdAt" + INTERVAL '30 days' WHERE "trialEndsAt" IS NULL`,
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

    try {
      const bcrypt = require('bcryptjs');
      const plainPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Fortly2024';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      await db.sequelize.query(
        `UPDATE "Admins" SET "password" = '${hashedPassword}', "email" = '${process.env.ADMIN_EMAIL || 'admin@fortly.xyz'}', "updatedAt" = NOW()`
      );
      const [verify] = await db.sequelize.query(
        `SELECT substring(password, 1, 10) as hash_start, email FROM "Admins" LIMIT 1`,
        { type: db.Sequelize.QueryTypes.SELECT }
      );
      console.log('🔍 Verify stored hash starts with:', verify?.hash_start);
      console.log('🔍 Verify stored email:', verify?.email);
      const testMatch = await bcrypt.compare(plainPassword, hashedPassword);
      console.log('🔐 bcrypt self-test:', testMatch ? '✅ PASS' : '❌ FAIL - hash broken');
      console.log('✅ Admin password reset to:', plainPassword);
      console.log('📧 Admin email:', process.env.ADMIN_EMAIL || 'admin@fortly.xyz');
    } catch (err) {
      console.warn('⚠️  Admin reset warning:', err.message);
    }

    try {
      const adminCount = await db.sequelize.query(
        'SELECT COUNT(*) as count FROM "Admins"',
        { type: db.Sequelize.QueryTypes.SELECT }
      );
      const count = parseInt(adminCount[0].count);
      if (count === 0) {
        const bcrypt = require('bcryptjs');
        const plainPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Fortly2024';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
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
        console.log('🔑 Password:', process.env.ADMIN_DEFAULT_PASSWORD || 'Fortly2024');
        console.log('⚠️  Change this password immediately via Admin Settings!');
      } else {
        console.log('✅ Admin account exists');
      }
    } catch (err) {
      console.warn('⚠️  Admin seed warning:', err.message);
    }

    startReminderScheduler();
    console.log('⏰ Reminder scheduler started');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📧 Resend email configured`);
    });

    // Keep Neon database alive - ping every 4 minutes
    setInterval(async () => {
      try {
        await db.sequelize.query('SELECT 1');
        console.log('🟢 DB keepalive ping');
      } catch (err) {
        console.error('❌ DB keepalive failed:', err.message);
      }
    }, 4 * 60 * 1000);

    // Memory monitor - log every 2 minutes
    setInterval(() => {
      const used = process.memoryUsage();
      console.log(`📊 Memory: heap ${Math.round(used.heapUsed/1024/1024)}MB / ${Math.round(used.heapTotal/1024/1024)}MB | RSS ${Math.round(used.rss/1024/1024)}MB`);
    }, 2 * 60 * 1000);

  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });