import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchSubscriptionStatus, cancelSubscription } from '../store/slices/subscriptionSlice';
import Loading from '../components/Loading';

const Subscription = () => {
  const dispatch = useDispatch();
  const { plan, status, currentPeriod, loading, error } = useSelector((state) => state.subscription);
  const currentUser = useSelector((state) => state.auth.currentUser);

  useEffect(() => {
    dispatch(fetchSubscriptionStatus());
  }, [dispatch]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your Pro membership? You will lose access to Pro tribes.')) return;
    try {
      await dispatch(cancelSubscription()).unwrap();
      alert('Subscription cancelled successfully.');
    } catch (err) {
      alert(err || 'Failed to cancel subscription.');
    }
  };

  if (loading) return <Loading />;

  const isPro = currentUser?.role === 'ProMember' || plan === 'Pro';

  return (
    <div className="container py-4" style={{ maxWidth: '600px' }}>
      <div className="mb-4">
        <h2 className="text-white mb-1">Billing & Subscription</h2>
        <p className="text-muted small">Manage your billing cycles, account tiers, and upgrade memberships.</p>
      </div>

      {error && <div className="alert alert-danger py-2 px-3 small rounded mb-4">{error}</div>}

      <div className="glass-card p-4">
        <h4 className="h5 text-white mb-3">Active Account Info</h4>
        
        <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom border-secondary">
          <div>
            <span className="text-muted small d-block">Current Tier</span>
            <strong className={isPro ? 'text-primary' : 'text-light'}>
              {isPro ? '💎 Pro Member Plan' : 'Free Member Plan'}
            </strong>
          </div>
          <span className="badge bg-secondary-subtle text-secondary-emphasis px-2.5 py-1 fs-8">
            {status === 'active' ? 'Active Billing' : 'No Active Billing'}
          </span>
        </div>

        {isPro && currentPeriod && (
          <div className="mb-4">
            <span className="text-muted small d-block">Next Invoice Period End</span>
            <strong className="text-white small">{new Date(currentPeriod).toLocaleDateString()}</strong>
          </div>
        )}

        <div className="d-flex flex-column gap-2 mt-4">
          {!isPro ? (
            <Link to="/pricing" className="btn btn-gradient-primary text-center">
              Upgrade to Pro Membership
            </Link>
          ) : (
            <button onClick={handleCancel} className="btn btn-outline-danger w-100">
              Cancel Pro Subscription
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscription;
