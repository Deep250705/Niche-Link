import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay SDK instance
const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret
});

/**
 * Creates a Razorpay Subscription
 * @param {string} planId 
 * @returns {Promise<object>}
 */
export const createRazorpaySubscription = async (planId) => {
  try {
    // If using placeholder keys, return a mock response for smooth test running
    if (keyId.includes('placeholder') || keySecret.includes('placeholder')) {
      return {
        id: `sub_${Math.random().toString(36).substring(7)}`,
        status: 'created',
        plan_id: planId,
        current_start: Math.floor(Date.now() / 1000),
        current_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
      };
    }

    const sub = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12 // 1 year of monthly recurrences
    });
    return sub;
  } catch (error) {
    console.error('Razorpay Create Subscription Error:', error);
    throw new Error(error.description || 'Razorpay subscription creation failed.');
  }
};

/**
 * Cancels an active Razorpay Subscription
 * @param {string} subscriptionId 
 * @returns {Promise<object>}
 */
export const cancelRazorpaySubscription = async (subscriptionId) => {
  try {
    if (keyId.includes('placeholder') || keySecret.includes('placeholder') || subscriptionId.startsWith('sub_mock')) {
      return {
        id: subscriptionId,
        status: 'cancelled'
      };
    }

    const sub = await razorpay.subscriptions.cancel(subscriptionId, {
      cancel_at_cycle_end: 0 // cancel immediately for trial/mock runs
    });
    return sub;
  } catch (error) {
    console.error('Razorpay Cancel Subscription Error:', error);
    throw new Error(error.description || 'Razorpay subscription cancellation failed.');
  }
};

/**
 * Verifies the Webhook Signature
 * @param {Buffer|string} rawBody 
 * @param {string} signature 
 * @param {string} secret 
 * @returns {boolean}
 */
export const verifyWebhookSignature = (rawBody, signature, secret) => {
  try {
    if (!rawBody || !signature || !secret) return false;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature verification crash:', error);
    return false;
  }
};
