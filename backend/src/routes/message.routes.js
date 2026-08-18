import express from 'express';
import { requireAuth } from '../middleware/authz.middleware.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

const router = express.Router();

const checkProSubscription = async (user) => {
  if (user.role === 'Admin') return true;
  if (user.role !== 'ProMember') return false;
  const sub = await Subscription.findOne({ user: user._id });
  return sub && sub.status === 'active' && sub.currentPeriodEnd > new Date();
};

// GET /api/messages/:conversationId
// Get all messages in a conversation
router.get('/:conversationId', requireAuth, async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name username avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/messages
// Send a message
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { conversationId, receiverId, content } = req.body;

    // 1. Verify active Pro subscription
    const isPro = await checkProSubscription(req.user);
    if (!isPro) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Pro subscription required to send messages.'
      });
    }

    // 2. Verify recipient exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found'
      });
    }

    let conversation;

    // 3. Find or create conversation
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }
      if (!conversation.participants.includes(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not a participant in this conversation'
        });
      }
    } else {
      // Find existing 1-to-1 conversation to avoid duplicates
      conversation = await Conversation.findOne({
        participants: { $all: [req.user._id, receiverId], $size: 2 }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [req.user._id, receiverId]
        });
      }
    }

    // 4. Create and save message
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      receiver: receiverId,
      content
    });

    // Update conversation lastMessage
    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name username avatar');

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    next(error);
  }
});

export default router;
