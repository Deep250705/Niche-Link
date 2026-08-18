import { authenticateUser } from './auth.middleware.js';
import Subscription from '../models/Subscription.js';

// Alias for authenticateUser to align with naming conventions
export const requireAuth = authenticateUser;

// Require Specific Roles Middleware
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Access requires one of the roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      });
    }

    next();
  };
};

// Require Pro Subscription Middleware
export const requirePro = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // Admins automatically bypass Pro checks
  if (req.user.role === 'Admin') {
    return next();
  }

  try {
    // If the user's role is not ProMember or Admin, they don't have access
    if (req.user.role !== 'ProMember') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Pro subscription required.'
      });
    }

    // Verify database Subscription status
    const sub = await Subscription.findOne({ user: req.user._id });
    if (!sub || sub.status !== 'active' || sub.currentPeriodEnd < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Your Pro subscription has expired or is inactive.'
      });
    }

    next();
  } catch (error) {
    console.error('requirePro validation error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying your subscription status.'
    });
  }
};

// Require Admin Middleware
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrative privileges required.'
    });
  }

  next();
};
