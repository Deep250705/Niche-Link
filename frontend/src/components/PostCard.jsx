import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PostCard = ({ post, onDelete }) => {
  const { user: currentUser } = useAuth();

  const isAuthor = post.author?._id === currentUser?.id || post.author === currentUser?.id;
  const isAdmin = currentUser?.role === 'Admin';
  const timeFormatted = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Strip HTML tags for clean card description preview
  const stripHTML = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none'; // Hide broken images gracefully
  };

  return (
    <div className="glass-card p-4 mb-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2.5">
          {post.author?.avatar ? (
            <img
              src={post.author.avatar}
              alt="Avatar"
              className="rounded-circle"
              style={{ width: '38px', height: '38px', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-light small fw-bold"
              style={{ width: '38px', height: '38px' }}
            >
              {post.author?.name ? post.author.name.charAt(0) : 'U'}
            </div>
          )}
          
          <div>
            <div className="d-flex align-items-center gap-1.5">
              <span className="small fw-semibold text-light">{post.author?.name || 'Anonymous'}</span>
              <span className="text-muted small fs-8">@{post.author?.username || 'user'}</span>
            </div>
            <small className="text-muted fs-8 d-block">{timeFormatted}</small>
          </div>
        </div>

        {/* Delete actions */}
        {(isAuthor || isAdmin) && (
          <button
            onClick={() => onDelete(post._id)}
            className="btn btn-sm btn-outline-danger border-0 p-1"
            title="Delete post"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Body */}
      <Link to={`/posts/${post._id}`} className="text-decoration-none text-light">
        <h5 className="mb-2 hover-text-primary">{post.title}</h5>
        <p className="text-muted small mb-3 text-line-clamp-3" style={{ maxHeight: '72px', overflow: 'hidden' }}>
          {stripHTML(post.content)}
        </p>

        {/* Attached Images row */}
        {post.images && post.images.length > 0 && (
          <div className="d-flex gap-2 mb-3 overflow-hidden rounded">
            {post.images.slice(0, 3).map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt="Attachment"
                className="img-fluid border border-secondary"
                style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '6px' }}
                onError={handleImageError}
              />
            ))}
          </div>
        )}
      </Link>

      {/* Footer */}
      <div className="d-flex justify-content-between align-items-center border-top border-secondary pt-3 mt-2 text-muted small fs-8">
        <span>💬 {post.commentsCount || 0} comments</span>
        {post.community && (
          <Link to={`/communities/${post.community.slug}`} className="text-primary text-decoration-none fw-medium">
            in {post.community.name}
          </Link>
        )}
      </div>
    </div>
  );
};

export default PostCard;
