import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchNotifications, markAsRead, receiveNotification } from '../store/slices/notificationSlice';
import Avatar from './Avatar';

const NotificationDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useSelector((state) => state.notification);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications());
    
    // Close dropdown on click outside
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dispatch]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await dispatch(markAsRead(notif._id));
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="btn btn-outline-light border-0 p-1 position-relative d-flex align-items-center justify-content-center"
        aria-expanded={isOpen}
        aria-label={`Notifications, ${unreadCount} unread`}
        style={{ fontSize: '1.2rem' }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-dark"
            style={{ fontSize: '0.6rem', padding: '0.25em 0.5em' }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="glass-card position-absolute p-3 mt-2 shadow-lg"
          style={{
            top: '100%',
            right: 0,
            width: '320px',
            zIndex: 1040,
            backgroundColor: 'rgba(9, 13, 22, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
            <span className="text-white fw-bold small">Notifications</span>
            <Link to="/notifications" onClick={() => setIsOpen(false)} className="text-primary text-decoration-none fs-8 fw-semibold">
              View All
            </Link>
          </div>

          <div className="d-flex flex-column gap-2 overflow-y-auto" style={{ maxHeight: '280px' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-muted small">No new notifications.</div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleItemClick(n)}
                  className={`p-2.5 rounded cursor-pointer transition d-flex gap-2 align-items-start ${!n.isRead ? 'bg-primary-subtle text-primary border-start border-primary' : 'hover-bg-glass text-muted'}`}
                  style={{ cursor: 'pointer', borderLeft: !n.isRead ? '3px solid #6366f1' : 'none' }}
                >
                  <Avatar name={n.sender?.name || 'System'} src={n.sender?.avatar} size={28} />
                  <div className="flex-grow-1 overflow-hidden">
                    <span className={`d-block fs-8 fw-medium text-truncate ${!n.isRead ? 'text-white' : 'text-light'}`}>{n.title}</span>
                    <p className="fs-9 mb-0 text-truncate text-muted">{n.message}</p>
                    <small className="fs-10 text-muted">{new Date(n.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
