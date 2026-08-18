import express from 'express';
import { requireAuth } from '../middleware/authz.middleware.js';
import Report from '../models/Report.js';

const router = express.Router();

// POST /api/reports
// Submit a report (users can report inappropriate content/communities/profiles)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide targetType, targetId, and reason.'
      });
    }

    // Map reason and status fields properly to lowercase/uppercase as defined in enums
    let mappedReason = reason.toLowerCase().trim();
    if (mappedReason === 'inappropriate content') {
      mappedReason = 'inappropriate';
    }

    // Enforce unique duplicate check to prevent report spamming
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      targetType,
      targetId,
      status: 'Pending'
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a pending report for this item.'
      });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason: mappedReason,
      description: description || '',
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Content is under moderation review.',
      report
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/me
// Get reports created by the current user
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const reports = await Report.find({ reporter: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    next(error);
  }
});

export default router;
