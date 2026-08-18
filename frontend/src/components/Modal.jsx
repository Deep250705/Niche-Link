import React, { useEffect } from 'react';

const Modal = ({ show, onClose, title = 'Modal Title', children }) => {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="modal-backdrop-blur position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1050
      }}
      onClick={onClose}
    >
      <div
        className="glass-card p-4 w-100 m-3 position-relative"
        style={{ maxWidth: '600px', cursor: 'default' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="h5 text-white mb-0">{title}</h4>
          <button
            type="button"
            className="btn btn-sm btn-outline-light border-0"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="modal-body-content text-light" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
