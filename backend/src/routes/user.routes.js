import express from 'express';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Subscription from '../models/Subscription.js';
import { requireAuth } from '../middleware/authz.middleware.js';

const router = express.Router();

// Helper to determine if a user has an active Pro subscription
const checkProSubscription = async (userId) => {
  const sub = await Subscription.findOne({ user: userId });
  return sub && sub.status === 'active' && sub.currentPeriodEnd > new Date();
};

// @desc    Get current user profile (Private)
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const isPro = await checkProSubscription(req.user._id);
    
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        bio: req.user.bio,
        profession: req.user.profession,
        skills: req.user.skills,
        location: req.user.location,
        website: req.user.website,
        socialLinks: req.user.socialLinks,
        role: req.user.role,
        isPro: isPro || req.user.role === 'Admin',
        communities: req.user.communities,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get public profile by username (Public)
// @route   GET /api/users/:username
// @access  Public
router.get('/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.username || req.params.username.toLowerCase() })
      .populate('communities', 'name slug description category icon');

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const isPro = await checkProSubscription(user._id);

    res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        profession: user.profession,
        skills: user.skills,
        location: user.location,
        website: user.website,
        socialLinks: user.socialLinks,
        isPro: isPro || user.role === 'Admin',
        communities: user.communities,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update profile (Private)
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { name, bio, profession, skills, location, website, socialLinks } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update allowed fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profession !== undefined) user.profession = profession;
    if (skills !== undefined) user.skills = skills;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    
    if (socialLinks) {
      user.socialLinks = {
        github: socialLinks.github !== undefined ? socialLinks.github : user.socialLinks.github,
        linkedin: socialLinks.linkedin !== undefined ? socialLinks.linkedin : user.socialLinks.linkedin,
        twitter: socialLinks.twitter !== undefined ? socialLinks.twitter : user.socialLinks.twitter
      };
    }

    await user.save();
    const isPro = await checkProSubscription(user._id);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        profession: user.profession,
        skills: user.skills,
        location: user.location,
        website: user.website,
        socialLinks: user.socialLinks,
        role: user.role,
        isPro: isPro || user.role === 'Admin',
        communities: user.communities,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload / Update Avatar (Private)
// @route   POST /api/users/avatar
// @access  Private
router.post('/avatar', requireAuth, async (req, res, next) => {
  try {
    const { avatar } = req.body; // Can be a URL or a base64 string

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.avatar = avatar || '';
    await user.save();

    res.status(200).json({
      success: true,
      message: avatar ? 'Avatar updated successfully' : 'Avatar removed successfully',
      avatar: user.avatar
    });
  } catch (error) {
    next(error);
  }
});

export default router;
