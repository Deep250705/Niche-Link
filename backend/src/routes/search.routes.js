import express from 'express';
import { requireAuth } from '../middleware/authz.middleware.js';
import Community from '../models/Community.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Project from '../models/Project.js';
import Subscription from '../models/Subscription.js';

const router = express.Router();

const checkProSubscription = async (userId) => {
  const sub = await Subscription.findOne({ user: userId });
  return sub && sub.status === 'active' && sub.currentPeriodEnd > new Date();
};

// Escape helper to prevent regex injection
const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

// @desc    Global Search
// @route   GET /api/search
// @access  Private
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        results: { communities: [], users: [], posts: [], projects: [] }
      });
    }

    const searchLimit = 5;
    const escapedQ = escapeRegex(q.trim());
    const regexQuery = { $regex: escapedQ, $options: 'i' };

    // 1. Determine subscription status to check Pro boundaries
    const isPro = req.user.role === 'Admin' || (await checkProSubscription(req.user._id));

    // 2. Fetch accessible communities list
    // - All public communities
    // - Private communities only if the user is a member
    const communityAccessQuery = {
      $or: [
        { visibility: 'public' },
        { members: req.user._id }
      ]
    };

    // Use $and to prevent key collisions on $or
    const communities = await Community.find({
      $and: [
        communityAccessQuery,
        {
          $or: [
            { name: regexQuery },
            { description: regexQuery },
            { category: regexQuery }
          ]
        }
      ]
    }).limit(searchLimit);

    // Get IDs of all communities this user has access to, to filter posts
    const accessibleCommunities = await Community.find(communityAccessQuery).select('_id isPro');
    
    // Filter out Pro communities from the accessible list if the user is not Pro/Admin
    const accessibleCommunityIds = accessibleCommunities
      .filter(c => !c.isPro || isPro)
      .map(c => c._id);

    // 3. Search Posts (Discussions) matching title/content within accessible communities
    const posts = await Post.find({
      isPublished: true,
      community: { $in: accessibleCommunityIds },
      $or: [
        { title: regexQuery },
        { content: regexQuery }
      ]
    })
      .populate('author', 'name username avatar')
      .populate('community', 'name slug')
      .limit(searchLimit);

    // 4. Search Users (People) matching name/username/profession/skills
    const users = await User.find({
      isActive: true,
      $or: [
        { name: regexQuery },
        { username: regexQuery },
        { profession: regexQuery },
        { skills: regexQuery }
      ]
    })
      .select('name username avatar profession role')
      .limit(searchLimit);

    // 5. Search Projects matching title/description/requiredSkills
    const projects = await Project.find({
      status: 'open',
      $or: [
        { title: regexQuery },
        { description: regexQuery },
        { requiredSkills: regexQuery }
      ]
    })
      .populate('creator', 'name username avatar')
      .limit(searchLimit);

    res.status(200).json({
      success: true,
      results: {
        communities,
        users,
        posts,
        projects
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
