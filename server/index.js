require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/business');
const serviceRoutes = require('./routes/services');
const galleryRoutes = require('./routes/gallery');
const bookingRoutes = require('./routes/bookings');
const chatRoutes = require('./routes/chat');
const reviewRoutes = require('./routes/reviews');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 50000 }));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e8
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection
db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully');
    // Sync database (creates tables if they don't exist)
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

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_business', (businessSlug) => {
    socket.join(businessSlug);
    console.log(`Socket ${socket.id} joined business: ${businessSlug}`);
  });

  socket.on('send_message', async (data) => {
    const { businessSlug, message, sender, senderName } = data;
    
    // Save message to database
    const Message = db.Message;
    try {
      const newMessage = await Message.create({
        businessId: data.businessId,
        clientEmail: data.clientEmail,
        message: message,
        sender: sender,
        senderName: senderName
      });

      // Emit to business room
      io.to(businessSlug).emit('receive_message', {
        id: newMessage.id,
        message: message,
        sender: sender,
        senderName: senderName,
        createdAt: newMessage.createdAt
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});