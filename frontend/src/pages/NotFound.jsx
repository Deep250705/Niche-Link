import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container py-5 text-center">
      <div className="glass-card p-5 max-width-600 mx-auto mt-5">
        <h1 className="display-1 text-primary fw-extrabold mb-3">404</h1>
        <h2 className="mb-4">Page Not Found</h2>
        <p className="lead text-muted mb-5">
          Oops! The page you are looking for does not exist, or has been moved to a different URL.
        </p>
        <Link to="/" className="btn btn-gradient-primary">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
