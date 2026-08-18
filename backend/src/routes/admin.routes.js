import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/authz.middleware.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Project from '../models/Project.js';
import Report from '../models/Report.js';
import Subscription from '../models/Subscription.js';

const router = express.Router();

// Enforce auth & admin globally for all admin routes
router.use(requireAuth, requireAdmin);

// GET /api/admin/metrics
// Fetch real database counts and billing metrics
router.get('/metrics', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const freeMembers = await User.countDocuments({ role: 'FreeMember' });
    const proMembers = await User.countDocuments({ role: 'ProMember' });
    const adminMembers = await User.countDocuments({ role: 'Admin' });

    const totalCommunities = await Community.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalProjects = await Project.countDocuments();
    const totalReports = await Report.countDocuments({ status: 'Pending' });

    const activeSubs = await Subscription.countDocuments({ status: 'active' });
    const failedSubs = await Subscription.countDocuments({ status: 'failed' });
    const canceledSubs = await Subscription.countDocuments({ status: 'canceled' });

    res.status(200).json({
      success: true,
      metrics: {
        users: { total: totalUsers, free: freeMembers, pro: proMembers, admin: adminMembers },
        content: { communities: totalCommunities, posts: totalPosts, comments: totalComments, projects: totalProjects },
        moderation: { pendingReports: totalReports },
        subscriptions: { active: activeSubs, failed: failedSubs, canceled: canceledSubs }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users
// Search/Filter/Paginate users directory
router.get('/users', async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:userId/role
// Update user administrative role (safeguarded)
router.patch('/users/:userId/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;

    if (!['FreeMember', 'ProMember', 'Admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role choice.' });
    }

    // Guard: Prevent demoting self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security Guard: You cannot demote yourself or remove your own Admin access.'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully.',
      user: targetUser
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:userId/status
// Suspend/Reactivate user profile
router.patch('/users/:userId/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const { userId } = req.params;

    // Guard: Prevent deactivating self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security Guard: You cannot suspend or deactivate your own account.'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User successfully ${isActive ? 'reactivated' : 'deactivated'}.`,
      user: targetUser
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/reports
// Retrieve list of moderation reports
router.get('/reports', async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/reports/:reportId/resolve
// Resolve or Dismiss a pending report
router.patch('/reports/:reportId/resolve', async (req, res, next) => {
  try {
    const { status } = req.body; // 'Resolved' or 'Rejected'
    const { reportId } = req.params;

    if (!['Resolved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Resolved or Rejected.' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    res.status(200).json({
      success: true,
      message: `Report status updated to ${status}.`,
      report
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/posts/:postId
// Moderate: Remove inappropriate post
router.delete('/posts/:postId', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    await post.deleteOne();
    res.status(200).json({
      success: true,
      message: 'Post successfully moderated/deleted by Admin.'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/comments/:commentId
// Moderate: Remove inappropriate comment
router.delete('/comments/:commentId', async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    await comment.deleteOne();
    res.status(200).json({
      success: true,
      message: 'Comment successfully moderated/deleted by Admin.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
