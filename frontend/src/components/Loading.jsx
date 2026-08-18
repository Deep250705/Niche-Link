import React from 'react';

const Loading = () => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-50 py-5">
      <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 text-muted">Loading NicheLink...</p>
    </div>
  );
};

export default Loading;
