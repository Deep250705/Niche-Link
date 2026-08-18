import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '../store/slices/notificationSlice';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, loading, error } = useSelector((state) => state.notification);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const handleDelete = (e, id) => {
    e.stopPropagation(); // prevent navigation
    if (window.confirm('Delete this notification?')) {
      dispatch(deleteNotification(id));
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await dispatch(markAsRead(notif._id));
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  if (loading && notifications.length === 0) return <Loading />;

  return (
    <div className="container py-4" style={{ maxWidth: '720px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-white mb-1 fw-bold h3">Notifications</h2>
          <p className="text-secondary small mb-0">Stay updated on comments, replies, project approvals, and DMs.</p>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button onClick={handleMarkAllRead} className="btn nl-btn nl-btn-outline btn-sm px-3">
            Mark All Read
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger py-2 px-3 small rounded mb-4 border-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--nl-danger)' }}>⚠️ {error}</div>}

      {notifications.length === 0 ? (
        <EmptyState icon="🔔" title="All Caught Up" message="No notifications received yet." />
      ) : (
        <div className="d-flex flex-column gap-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleItemClick(n)}
              className="nl-card p-3 d-flex align-items-center justify-content-between gap-3"
              style={{
                cursor: 'pointer',
                borderLeft: !n.isRead ? '3px solid var(--nl-accent-primary)' : '1px solid var(--nl-border-color)',
                backgroundColor: !n.isRead ? 'rgba(16, 185, 129, 0.03)' : 'var(--nl-bg-card)'
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <Avatar name={n.sender?.name || 'System'} src={n.sender?.avatar} size={36} />
                <div>
                  <span className={`d-block small fw-bold mb-1 ${!n.isRead ? 'text-white' : 'text-secondary'}`}>{n.title}</span>
                  <p className="text-secondary small mb-0">{n.message}</p>
                  <small className="text-muted mt-1 d-block" style={{ fontSize: '0.68rem' }}>{new Date(n.createdAt).toLocaleDateString()}</small>
                </div>
              </div>

              <div className="d-flex gap-2">
                {!n.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(n._id);
                    }}
                    className="btn nl-btn nl-btn-ghost border-0 p-1"
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(e, n._id)}
                  className="btn nl-btn nl-btn-ghost text-danger border-0 p-1"
                  title="Delete notification"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
