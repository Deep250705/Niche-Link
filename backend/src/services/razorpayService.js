import Razorpay from 'razorpay';
import crypto from 'crypto';

// Helper function to load configuration dynamically to prevent ES Module hoisting order issues with dotenv
const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
  return {
    keyId,
    keySecret,
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    })
  };
};

/**
 * Creates a Razorpay Order (no Plan ID needed)
 * @param {number} amount 
 * @returns {Promise<object>}
 */
export const createRazorpayOrder = async (amount) => {
  try {
    const { keyId, keySecret, client } = getRazorpay();

    // If using placeholder keys, return a mock response for smooth test running
    if (keyId.includes('placeholder') || keySecret.includes('placeholder')) {
      return {
        id: `order_mock_${Math.random().toString(36).substring(7)}`,
        status: 'created',
        amount,
        currency: 'INR'
      };
    }

    const order = await client.orders.create({
      amount, // in paise (e.g., 149900)
      currency: 'INR'
    });
    return order;
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    throw new Error(error.description || 'Razorpay order creation failed.');
  }
};

/**
 * Cancels an active Razorpay Subscription
 * @param {string} subscriptionId 
 * @returns {Promise<object>}
 */
export const cancelRazorpaySubscription = async (subscriptionId) => {
  try {
    const { keyId, keySecret, client } = getRazorpay();

    if (keyId.includes('placeholder') || keySecret.includes('placeholder') || subscriptionId.startsWith('sub_mock')) {
      return {
        id: subscriptionId,
        status: 'cancelled'
      };
    }

    const sub = await client.subscriptions.cancel(subscriptionId, {
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
