import React from 'react';

const EmptyState = ({ icon = '🔍', title = 'No results found', message = 'Try expanding your search parameters or check back later.' }) => {
  return (
    <div className="text-center py-5 px-4 border border-secondary border-dashed rounded-4 my-3 bg-dark-card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
      <span className="display-4 d-block mb-3" role="img" aria-label={title}>{icon}</span>
      <h4 className="h5 text-white mb-2">{title}</h4>
      <p className="text-muted mb-0 mx-auto" style={{ maxWidth: '400px' }}>{message}</p>
    </div>
  );
};

export default EmptyState;
