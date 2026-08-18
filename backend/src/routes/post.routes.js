import express from 'express';
import Post from '../models/Post.js';
import Community from '../models/Community.js';
import Subscription from '../models/Subscription.js';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/authz.middleware.js';
import { sanitizeHTML } from '../utils/sanitize.js';

const router = express.Router();

const checkProSubscription = async (userId) => {
  const sub = await Subscription.findOne({ user: userId });
  return sub && sub.status === 'active' && sub.currentPeriodEnd > new Date();
};

// @desc    Create a discussion post
// @route   POST /api/posts
// @access  Private
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { title, content, contentFormat, communityId, images } = req.body;

    if (!title || !content || !communityId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, content, and communityId'
      });
    }

    // Load community
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Target Tribe not found' });
    }

    // Enforce community membership requirement
    if (!community.members.includes(req.user._id) && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of the Tribe to create posts.'
      });
    }

    // Enforce Pro community checks
    if (community.isPro && req.user.role !== 'Admin') {
      const isPro = await checkProSubscription(req.user._id);
      if (!isPro) {
        return res.status(403).json({
          success: false,
          message: 'Posting in this Pro Tribe requires an active Pro subscription.'
        });
      }
    }

    // Sanitize title and content HTML to prevent XSS
    const sanitizedTitle = sanitizeHTML(title);
    const sanitizedContent = sanitizeHTML(content);

    const post = await Post.create({
      title: sanitizedTitle,
      content: sanitizedContent,
      contentFormat: contentFormat || 'text',
      author: req.user._id,
      community: communityId,
      images: images || []
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    next(error);
  }
});

// @desc    List discussion posts (with pagination, filters, and searches)
// @route   GET /api/posts
// @access  Private
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { community, author, search, page = 1, limit = 10 } = req.query;
    const query = { isPublished: true };

    if (community) query.community = community;
    if (author) query.author = author;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    const posts = await Post.find(query)
      .populate('author', 'name username avatar profession')
      .populate('community', 'name slug isPro')
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalPosts: total
      },
      posts
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single post details
// @route   GET /api/posts/:id
// @access  Private
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name username avatar profession')
      .populate('community', 'name slug isPro members');

    if (!post || !post.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update discussion post (Author only)
// @route   PUT /api/posts/:id
// @access  Private
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Verify ownership: only the author can modify
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this post'
      });
    }

    const { title, content, images } = req.body;

    if (title) post.title = sanitizeHTML(title);
    if (content) post.content = sanitizeHTML(content);
    if (images) post.images = images;

    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete discussion post (Author or Admin only)
// @route   DELETE /api/posts/:id
// @access  Private
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Verify authorization: author or Admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    const isModeratorAction = post.author.toString() !== req.user._id.toString() && req.user.role === 'Admin';
    const authorId = post.author;
    const postTitle = post.title;

    await post.deleteOne();

    if (isModeratorAction) {
      try {
        await Notification.create({
          recipient: authorId,
          sender: req.user._id,
          type: 'moderation',
          title: 'Content Moderated',
          message: `Your post "${postTitle}" was removed by a moderator for guidelines violation.`,
          link: ''
        });
      } catch (notifErr) {
        console.error('Failed to create moderation notification:', notifErr);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
