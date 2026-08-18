import express from 'express';
import Community from '../models/Community.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/authz.middleware.js';

const router = express.Router();

// Helper to check Pro subscription
const checkProSubscription = async (userId) => {
  const sub = await Subscription.findOne({ user: userId });
  return sub && sub.status === 'active' && sub.currentPeriodEnd > new Date();
};

// @desc    List all communities (with search)
// @route   GET /api/communities
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const communities = await Community.find(query)
      .populate('owner', 'name username avatar')
      .sort({ memberCount: -1 });

    res.status(200).json({
      success: true,
      count: communities.length,
      communities
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get community details by slug
// @route   GET /api/communities/:slug
// @access  Public (Details are public, but posts/membership access is checked)
router.get('/:slug', async (req, res, next) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug.toLowerCase() })
      .populate('owner', 'name username avatar')
      .populate('members', 'name username avatar profession');

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Tribe not found'
      });
    }

    res.status(200).json({
      success: true,
      community
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create a community (Admin only)
// @route   POST /api/communities
// @access  Private/Admin
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, category, rules, visibility, isPro, coverImage, icon } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, and category'
      });
    }

    const nameExists = await Community.findOne({ name });
    if (nameExists) {
      return res.status(400).json({
        success: false,
        message: 'A Tribe with this name already exists'
      });
    }

    const community = await Community.create({
      name,
      description,
      category,
      rules: rules || [],
      visibility: visibility || 'public',
      isPro: isPro || false,
      coverImage: coverImage || '',
      icon: icon || '',
      owner: req.user._id,
      members: [req.user._id],
      memberCount: 1
    });

    // Automatically add community reference to admin creator
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { communities: community._id } });

    res.status(201).json({
      success: true,
      message: 'Tribe created successfully',
      community
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update community (Admin or Owner)
// @route   PUT /api/communities/:id
// @access  Private
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Tribe not found' });
    }

    // Check authorization: must be admin or tribe owner
    if (req.user.role !== 'Admin' && community.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this Tribe'
      });
    }

    const { description, category, rules, visibility, isPro, coverImage, icon } = req.body;

    if (description !== undefined) community.description = description;
    if (category !== undefined) community.category = category;
    if (rules !== undefined) community.rules = rules;
    if (visibility !== undefined) community.visibility = visibility;
    if (isPro !== undefined) community.isPro = isPro;
    if (coverImage !== undefined) community.coverImage = coverImage;
    if (icon !== undefined) community.icon = icon;

    await community.save();

    res.status(200).json({
      success: true,
      message: 'Tribe updated successfully',
      community
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete community (Admin only)
// @route   DELETE /api/communities/:id
// @access  Private/Admin
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Tribe not found' });
    }

    // Remove community references from all users
    await User.updateMany(
      { communities: community._id },
      { $pull: { communities: community._id } }
    );

    await community.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Tribe deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Join community
// @route   POST /api/communities/:id/join
// @access  Private
router.post('/:id/join', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Tribe not found' });
    }

    // Check if already a member
    if (community.members.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this Tribe'
      });
    }

    // Check Pro subscription requirement
    if (community.isPro && req.user.role !== 'Admin') {
      const isPro = await checkProSubscription(req.user._id);
      if (!isPro) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Joining this Tribe requires an active Pro subscription.'
        });
      }
    }

    // Add membership
    community.members.push(req.user._id);
    community.memberCount = community.members.length;
    await community.save();

    // Link community in User model
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { communities: community._id } });

    res.status(200).json({
      success: true,
      message: 'Successfully joined the Tribe',
      members: community.members,
      memberCount: community.memberCount
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Leave community
// @route   POST /api/communities/:id/leave
// @access  Private
router.post('/:id/leave', requireAuth, async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Tribe not found' });
    }

    // Check if not a member
    if (!community.members.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this Tribe'
      });
    }

    // Admins or owners shouldn't leave their own community without deleting/transferring ownership
    if (community.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'As the owner, you cannot leave the Tribe. Transfer ownership or delete it instead.'
      });
    }

    // Remove membership
    community.members = community.members.filter(m => m.toString() !== req.user._id.toString());
    community.memberCount = community.members.length;
    await community.save();

    // Remove community reference in User model
    await User.findByIdAndUpdate(req.user._id, { $pull: { communities: community._id } });

    res.status(200).json({
      success: true,
      message: 'Successfully left the Tribe',
      members: community.members,
      memberCount: community.memberCount
    });
  } catch (error) {
    next(error);
  }
});

export default router;
