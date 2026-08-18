import dotenv from 'dotenv';
// Load environment variables immediately to resolve ES Module hoisting initialization order
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'mongo-sanitize';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import communityRouter from './routes/community.routes.js';
import postRouter from './routes/post.routes.js';
import commentRouter from './routes/comment.routes.js';
import searchRouter from './routes/search.routes.js';
import notificationRouter from './routes/notification.routes.js';
import uploadRouter from './routes/upload.routes.js';
import conversationRouter from './routes/conversation.routes.js';
import messageRouter from './routes/message.routes.js';
import projectRouter from './routes/project.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import adminRouter from './routes/admin.routes.js';
import reportRouter from './routes/report.routes.js';

const app = express();

// Secure HTTP Headers
app.use(helmet());

// NoSQL Injection Protection
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Limit auth attempts to 50 per 15 minutes
  message: { success: false, message: 'Too many auth requests. Please try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // General limit
  message: { success: false, message: 'Too many API requests. Please try again later.' }
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// CORS setup
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body & Cookie parsers - increase limit for handling base64 fallbacks
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Base API Routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/communities', communityRouter);
app.use('/api/posts', postRouter);
app.use('/api/comments', commentRouter);
app.use('/api/search', searchRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/messages', messageRouter);
app.use('/api/projects', projectRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/admin', adminRouter);
app.use('/api/reports', reportRouter);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not Found - Route ${req.originalUrl} does not exist`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for path: ${err.path}`;
    errors.push({ field: err.path, message: `Value '${err.value}' is invalid.` });
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Failed';
    errors = Object.keys(err.errors).map(key => ({
      field: key,
      message: err.errors[key].message
    }));
  }

  // Mongo duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value error: ${field} already exists.`;
    errors.push({ field, message: `The ${field} is already registered.` });
  }

  if (statusCode === 500) {
    console.error(`[CRITICAL ERROR] ${err.message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

export default app;
