require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const nodemailer = require('nodemailer');
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

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Set up associations (make sure Business model is available in db)
if (db.Business) {
  db.Business.hasMany(ClientCalendarToken, { foreignKey: 'businessId', as: 'clientTokens' });
  ClientCalendarToken.belongsTo(db.Business, { foreignKey: 'businessId', as: 'Business' });
}

// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Make io and transporter accessible in routes
app.set('io', io);
app.set('emailTransporter', transporter);

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

  // Business joins their room
  socket.on('join-business', (businessSlug) => {
    socket.join(`business-${businessSlug}`);
    connectedUsers.set(socket.id, { type: 'business', businessSlug });
    console.log(`👔 Business ${businessSlug} joined room`);
  });

  // Client joins their room
  socket.on('join-client', ({ businessSlug, clientEmail }) => {
    const roomName = `client-${businessSlug}-${clientEmail}`;
    socket.join(roomName);
    connectedUsers.set(socket.id, { type: 'client', businessSlug, clientEmail });
    console.log(`👤 Client ${clientEmail} joined room for business ${businessSlug}`);
  });

  // Handle typing indicators
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

// Database connection
db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully');
    return db.sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('✅ Database synced');
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email configured: ${process.env.EMAIL_USER}`);
});