import express from 'express';
import { requireAuth } from '../middleware/authz.middleware.js';
import Conversation from '../models/Conversation.js';

const router = express.Router();

// GET /api/conversations
// Get all conversations for the logged in user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'name username avatar role')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name username'
        }
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    next(error);
  }
});

export default router;
