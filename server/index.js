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
    return db.sequelize.sync({ alter: false });
  })
  .then(async () => {                          
    console.log('✅ Database synced');

    // ── Migration: ensure reminderSent column exists ──
    try {
      // First, check if the column exists
      const queryInterface = db.sequelize.getQueryInterface();
      const tableDescription = await queryInterface.describeTable('Bookings');
      
      if (!tableDescription.reminderSent) {
        console.log('📋 Adding reminderSent column to Bookings table...');
        
        // Add the column with proper error handling
        await db.sequelize.query(`
          ALTER TABLE "Bookings"
          ADD COLUMN "reminderSent" BOOLEAN NOT NULL DEFAULT false;
        `);
        console.log('✅ reminderSent column added successfully');
      } else {
        console.log('✅ reminderSent column already exists');
      }
    } catch (err) {
      console.error('❌ Migration error - reminderSent column:', err.message);
      // Try alternative approach for PostgreSQL
      try {
        await db.sequelize.query(`
          ALTER TABLE "Bookings"
          ADD COLUMN IF NOT EXISTS "reminderSent" BOOLEAN DEFAULT false;
        `);
        console.log('✅ reminderSent column added (via IF NOT EXISTS)');
      } catch (altErr) {
        console.error('❌ Alternative migration also failed:', altErr.message);
        console.error('⚠️ Please manually run: ALTER TABLE "Bookings" ADD COLUMN "reminderSent" BOOLEAN DEFAULT false;');
      }
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