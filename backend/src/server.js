import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Subscription from './models/Subscription.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Parse cookie string
const parseCookies = (cookieString) => {
  if (!cookieString) return {};
  return cookieString.split(';').reduce((acc, pair) => {
    const [key, val] = pair.split('=').map(c => c.trim());
    if (key) acc[key] = decodeURIComponent(val || '');
    return acc;
  }, {});
};

// Authentication Middleware for Socket.io
io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    const cookies = parseCookies(cookieHeader);
    let token = cookies.token;

    if (!token && socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
    }

    if (!token) {
      return next(new Error('Authentication error: Token not found'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretnichelinkkey123!');
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return next(new Error('Authentication error: User not active or invalid'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Map to track online users (userId -> Set of socketIds)
const onlineUsers = new Map();

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  console.log(`Socket connected for user ${socket.user.username}: ${socket.id}`);

  // Track socket connections for the user
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  // Join user's private channel
  socket.join(userId);

  // Broadcast user online status
  io.emit('userOnline', { userId });

  // Handle joining a conversation room
  socket.on('joinConversation', async ({ conversationId }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      // Verify conversation permissions
      if (!conversation.participants.includes(socket.user._id)) {
        return socket.emit('error', { message: 'Unauthorized conversation access' });
      }

      socket.join(conversationId);
      console.log(`User ${socket.user.username} joined conversation room: ${conversationId}`);
    } catch (error) {
      console.error('Error joining conversation room:', error);
    }
  });

  // Handle leaving a conversation room
  socket.on('leaveConversation', ({ conversationId }) => {
    socket.leave(conversationId);
    console.log(`User ${socket.user.username} left conversation room: ${conversationId}`);
  });

  // Handle sending a message
  socket.on('sendMessage', async ({ conversationId, receiverId, content }) => {
    try {
      // 1. Verify active Pro subscription (Admin bypasses)
      const sub = await Subscription.findOne({ user: socket.user._id });
      const isPro = socket.user.role === 'Admin' || (sub && sub.status === 'active' && sub.currentPeriodEnd > new Date());
      
      if (!isPro) {
        return socket.emit('error', { message: 'Pro subscription required' });
      }

      // 2. Verify recipient exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return socket.emit('error', { message: 'Recipient not found' });
      }

      let conversation;

      // 3. Find or create conversation
      if (conversationId) {
        conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(socket.user._id)) {
          return socket.emit('error', { message: 'Unauthorized conversation access' });
        }
      } else {
        conversation = await Conversation.findOne({
          participants: { $all: [socket.user._id, receiverId], $size: 2 }
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [socket.user._id, receiverId]
          });
        }
      }

      // 4. Save to MongoDB
      const message = await Message.create({
        conversation: conversation._id,
        sender: socket.user._id,
        receiver: receiverId,
        content
      });

      // Update conversation lastMessage
      conversation.lastMessage = message._id;
      await conversation.save();

      const populatedMessage = await Message.findById(message._id).populate('sender', 'name username avatar');

      // Real-time delivery via Socket.io
      io.to(conversation._id.toString()).emit('newMessage', populatedMessage);
      
      // Update recipient's conversations list/unread count if online
      if (onlineUsers.has(receiverId)) {
        io.to(receiverId).emit('newMessage', populatedMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('typing', ({ conversationId }) => {
    socket.to(conversationId).emit('typing', { conversationId, userId });
  });

  socket.on('stopTyping', ({ conversationId }) => {
    socket.to(conversationId).emit('stopTyping', { conversationId, userId });
  });

  // Read receipts
  socket.on('messageRead', async ({ conversationId, messageId }) => {
    try {
      await Message.updateMany(
        { conversation: conversationId, receiver: socket.user._id, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );
      socket.to(conversationId).emit('messageRead', { conversationId, messageId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Disconnection handler
  socket.on('disconnect', async () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
        // Broadcast user offline status
        io.emit('userOffline', { userId });
        // Persist lastSeen to DB
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      }
    }
  });
});

// Start DB connection & Server
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

const gracefulShutdown = async (signal) => {
  console.log(`\n[${signal}] Graceful shutdown initiated. Closing resources...`);
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed.');
  });

  // Close Database connection
  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
