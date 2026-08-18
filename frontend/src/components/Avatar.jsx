import React from 'react';

const Avatar = ({ name = 'User', src = '', size = 40 }) => {
  const initials = name ? name.charAt(0).toUpperCase() : 'U';

  if (src) {
    return (
      <img
        src={src}
        alt={`${name}'s avatar`}
        className="rounded-circle border border-secondary"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'cover',
          flexShrink: 0
        }}
      />
    );
  }

  return (
    <div
      className="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center text-light fw-bold"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${size * 0.4}px`,
        flexShrink: 0
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
