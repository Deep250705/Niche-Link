import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { upgradeSubscription } from '../store/slices/subscriptionSlice';

import api from '../services/api';

const Pricing = () => {
  const dispatch = useDispatch();
  const { plan, status, paymentState, error } = useSelector((state) => state.subscription);
  const currentUser = useSelector((state) => state.auth.currentUser);

  const handleUpgrade = async () => {
    if (!currentUser) {
      alert('Please log in to upgrade your subscription.');
      return;
    }
    try {
      const res = await api.post('/subscriptions/create', { planName: 'Pro' });
      const { keyId, orderId, subscriptionId } = res.data;

      const options = {
        key: keyId,
        order_id: orderId || subscriptionId,
        name: 'NicheLink',
        description: 'Monthly Pro Membership Subscription',
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/subscriptions/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              alert('Payment verified. Your Pro subscription is being activated.');
              window.location.reload();
            } else {
              alert('Verification failed: ' + verifyRes.data.message);
            }
          } catch (err) {
            alert('Verification request failed. Please check details.');
          }
        },
        prefill: {
          name: currentUser.name,
          email: currentUser.email
        },
        theme: {
          color: '#10b981' // Accent primary green color for payment window
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        alert('Payment could not be completed: ' + resp.error.description);
      });
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to start payment. Please try again.');
    }
  };

  const isPro = currentUser?.role === 'ProMember' || plan === 'Pro';

  return (
    <div className="container py-5 text-center">
      <h2 className="display-5 text-white mb-2 fw-bold">Simple, Value-Driven Plans</h2>
      <p className="lead text-secondary mb-5 mx-auto" style={{ maxWidth: '600px', fontSize: '1rem' }}>
        Unlock specialized private tribes, custom communities creation, direct chats, and freelance opportunities.
      </p>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-4 mx-auto small rounded border-0" style={{ maxWidth: '600px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--nl-danger)' }}>
          {error}
        </div>
      )}

      <div className="row g-4 justify-content-center align-items-stretch">
        {/* Free Plan */}
        <div className="col-md-5 col-lg-4">
          <div className="nl-card p-5 h-100 d-flex flex-column justify-content-between">
            <div>
              <h3 className="h6 text-uppercase text-secondary fw-bold mb-3">Free Member</h3>
              <h2 className="display-4 fw-extrabold text-white my-3">$0</h2>
              <p className="text-secondary small mb-4">Read-only access and basic community interaction.</p>
              <ul className="list-unstyled text-start text-secondary small mb-5">
                <li className="mb-2.5">✓ Access public communities</li>
                <li className="mb-2.5">✓ Read discussions & articles</li>
                <li className="mb-2.5">✓ View community rules & info</li>
                <li className="mb-2.5 text-decoration-line-through text-muted">✗ Create new discussion posts</li>
                <li className="mb-2.5 text-decoration-line-through text-muted">✗ Direct message DMs</li>
              </ul>
            </div>
            <button className="btn nl-btn nl-btn-outline w-100 py-2.5" disabled>
              {!isPro ? 'Current Plan' : 'Free Tier'}
            </button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="col-md-5 col-lg-4">
          <div className="nl-card p-5 h-100 d-flex flex-column justify-content-between position-relative" style={{ borderColor: 'var(--nl-accent-primary)' }}>
            <span className="position-absolute top-0 start-50 translate-middle badge nl-badge-pro text-uppercase px-3 py-1.5 rounded-pill" style={{ fontSize: '0.65rem' }}>Most Popular</span>
            <div>
              <h3 className="h6 text-uppercase fw-bold mb-3 mt-1" style={{ color: 'var(--nl-accent-primary)' }}>Pro Member</h3>
              <h2 className="display-4 fw-extrabold text-white my-3">₹1,499<span className="fs-6 text-secondary">/mo</span></h2>
              <p className="text-secondary small mb-4">Complete communication, creation, and collaboration suite.</p>
              <ul className="list-unstyled text-start text-secondary small mb-5">
                <li className="mb-2.5 text-white">✓ Post & comment in all tribes</li>
                <li className="mb-2.5 text-white">✓ Create public or private communities</li>
                <li className="mb-2.5 text-white">✓ Unlimited socket-connected direct DMs</li>
                <li className="mb-2.5 text-white">✓ Access freelance listings directory</li>
                <li className="mb-2.5 text-white">✓ Submit freelance project applications</li>
              </ul>
            </div>
            <button
              onClick={handleUpgrade}
              className="btn nl-btn nl-btn-primary w-100 py-2.5"
              disabled={isPro || paymentState === 'processing'}
            >
              {isPro ? 'Active Pro Member 💎' : paymentState === 'processing' ? 'Upgrading...' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
