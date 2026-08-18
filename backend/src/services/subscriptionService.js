import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

/**
 * Centrally determines if a user has an active Pro subscription or Admin role.
 * Automatically handles downgrading expired user roles to FreeMember.
 * @param {string|mongoose.Types.ObjectId} userId 
 * @returns {Promise<boolean>}
 */
export const isProActive = async (userId) => {
  try {
    const userObj = await User.findById(userId);
    if (!userObj) return false;

    // Admin has access to all Pro features
    if (userObj.role === 'Admin') {
      return true;
    }

    const sub = await Subscription.findOne({ user: userId });
    if (!sub) {
      // If user is set to ProMember but has no subscription record, correct it
      if (userObj.role === 'ProMember') {
        userObj.role = 'FreeMember';
        await userObj.save();
      }
      return false;
    }

    const activeStates = ['active', 'trialing'];
    const isActive = activeStates.includes(sub.status) && sub.currentPeriodEnd > new Date();

    // If subscription is expired or inactive, downgrade role to FreeMember
    if (!isActive && userObj.role === 'ProMember') {
      userObj.role = 'FreeMember';
      await userObj.save();
    }

    // If subscription is active, ensure user role is ProMember
    if (isActive && userObj.role === 'FreeMember') {
      userObj.role = 'ProMember';
      await userObj.save();
    }

    return isActive;
  } catch (error) {
    console.error('Error checking isProActive status:', error);
    return false;
  }
};
