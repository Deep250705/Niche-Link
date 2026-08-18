import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import CommentList from '../components/CommentList';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const res = await api.get(`/posts/${id}`);
        if (res.data.success) {
          setPost(res.data.post);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load post details');
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [id]);

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  if (loading) return <Loading />;

  if (error || !post) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger mb-4">
          {error || 'Post not found'}
        </div>
        <Link to="/communities" className="btn btn-gradient-primary">
          Back to Tribes
        </Link>
      </div>
    );
  }

  const timeFormatted = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="container py-4" style={{ maxWidth: '800px' }}>
      <div className="mb-4">
        <Link to={`/communities/${post.community.slug}`} className="text-decoration-none text-muted small">
          ← Back to {post.community.name}
        </Link>
      </div>

      <div className="glass-card p-5">
        {/* Author Header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          {post.author?.avatar ? (
            <img
              src={post.author.avatar}
              alt="Avatar"
              className="rounded-circle border border-secondary"
              style={{ width: '45px', height: '45px', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-light fw-bold"
              style={{ width: '45px', height: '45px', fontSize: '1.25rem' }}
            >
              {post.author?.name ? post.author.name.charAt(0) : 'U'}
            </div>
          )}
          
          <div>
            <div className="d-flex align-items-center gap-1.5">
              <span className="fw-semibold text-light">{post.author?.name || 'Anonymous'}</span>
              <span className="text-muted small fs-8">@{post.author?.username || 'user'}</span>
            </div>
            <small className="text-muted fs-8 d-block">
              {post.author?.profession || 'Member'} • {timeFormatted}
            </small>
          </div>
        </div>

        {/* Post Content */}
        <h1 className="h2 mb-4 text-white">{post.title}</h1>
        
        {/* Render safe HTML content */}
        <div
          className="rich-post-content text-muted mb-5"
          style={{ lineHeight: '1.7' }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Attached Images */}
        {post.images && post.images.length > 0 && (
          <div className="mb-5">
            <h5 className="h6 text-muted mb-3">Attachments</h5>
            <div className="row g-3">
              {post.images.map((url, idx) => (
                <div key={idx} className="col-sm-6 col-md-4">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={`Post attachment ${idx + 1}`}
                      className="img-fluid rounded border border-secondary shadow-sm hover-opacity"
                      style={{ maxHeight: '180px', objectFit: 'cover', width: '100%' }}
                      onError={handleImageError}
                    />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <CommentList postId={post._id} post={post} />
      </div>
    </div>
  );
};

export default PostDetail;
