import express from 'express';
import Comment from '../models/Comment.js';
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

// ... lines omitted for space (Express route declarations) ...
// (We will replace from line 143 to 168 in the file content block where comment is created)
// Let's specify StartLine and EndLine to cover the exact target content


// @desc    Get comments for a post (flat list with paginated top-level comments)
// @route   GET /api/comments
// @access  Private
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { post: postId, page = 1, limit = 10 } = req.query;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a post ID'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    // Fetch paginated top-level comments
    const topLevelComments = await Comment.find({ post: postId, parentComment: null })
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum)
      .populate('author', 'name username avatar role profession');

    const totalTopLevel = await Comment.countDocuments({ post: postId, parentComment: null });

    // Fetch all replies for this post so frontend can construct the full tree
    const replies = await Comment.find({ post: postId, parentComment: { $ne: null } })
      .sort({ createdAt: 1 })
      .populate('author', 'name username avatar role profession');

    const allComments = [...topLevelComments, ...replies].map(c => {
      const obj = c.toObject();
      if (obj.content === '[This comment has been deleted]') {
        obj.author = null;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      comments: allComments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalTopLevel / limitNum),
        totalComments: totalTopLevel
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create a comment or reply
// @route   POST /api/comments
// @access  Private
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { post: postId, content, parentComment } = req.body;

    if (!postId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide post ID and comment content'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Load community of the post
    const community = await Community.findById(post.community);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Tribe not found for this post'
      });
    }

    // Enforce community membership requirement
    if (!community.members.includes(req.user._id) && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of the Tribe to comment.'
      });
    }

    // Enforce Pro community checks
    if (community.isPro && req.user.role !== 'Admin') {
      const isPro = await checkProSubscription(req.user._id);
      if (!isPro) {
        return res.status(403).json({
          success: false,
          message: 'Commenting in this Pro Tribe requires an active Pro subscription.'
        });
      }
    }

    // Sanitize content
    const sanitizedContent = sanitizeHTML(content);

    // If parentComment is provided, verify it exists and is on the same post
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent || parent.post.toString() !== postId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent comment'
        });
      }
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content: sanitizedContent,
      parentComment: parentComment || null
    });

    // Create notifications if recipient is not the sender
    try {
      if (parentComment) {
        const parent = await Comment.findById(parentComment);
        if (parent && parent.author && parent.author.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: parent.author,
            sender: req.user._id,
            type: 'reply',
            title: 'New Reply',
            message: `@${req.user.username} replied to your comment.`,
            link: `/posts/${postId}`
          });
        }
      } else {
        if (post.author && post.author.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: post.author,
            sender: req.user._id,
            type: 'comment',
            title: 'New Comment',
            message: `@${req.user.username} commented on your post "${post.title}".`,
            link: `/posts/${postId}`
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to create comment/reply notification:', notifErr);
    }

    // If it's a reply, add to parent replies array
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id }
      });
    }

    // Increment commentsCount on Post
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    // Populate author details to return a complete comment object
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name username avatar role profession');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populatedComment
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update a comment (Author only)
// @route   PATCH /api/comments/:id
// @access  Private
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Verify ownership: only the author can modify
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this comment'
      });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide content'
      });
    }

    comment.content = sanitizeHTML(content);
    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name username avatar role profession');

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment: populatedComment
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a comment (Author or Admin only)
// @route   DELETE /api/comments/:id
// @access  Private
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Verify authorization: author or Admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Decrement post commentsCount
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    // Handle soft delete if it has replies to preserve thread structure
    if (comment.replies && comment.replies.length > 0) {
      // Clear content to marked deletion text
      comment.content = '[This comment has been deleted]';
      await comment.save();

      return res.status(200).json({
        success: true,
        message: 'Comment deleted (soft delete due to replies)',
        comment: {
          _id: comment._id,
          post: comment.post,
          content: comment.content,
          parentComment: comment.parentComment,
          replies: comment.replies,
          author: null, // Return null to frontend to hide user info
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        }
      });
    } else {
      // Hard delete from database
      const commentId = comment._id;
      const parentCommentId = comment.parentComment;

      await comment.deleteOne();

      // If it had a parent, remove from parent's replies list
      if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
          $pull: { replies: commentId }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
        commentId
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
