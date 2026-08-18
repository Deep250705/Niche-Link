import React, { useState } from 'react';

const CommentEditor = ({
  initialValue = '',
  onSubmit,
  onCancel,
  submitLabel = 'Comment',
  placeholder = 'Join the discussion...'
}) => {
  const [content, setContent] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(content);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-3">
      {error && (
        <div className="alert alert-danger py-2 px-3 mb-2 small rounded">
          {error}
        </div>
      )}
      <textarea
        className="form-control bg-dark-card text-light border-secondary rounded p-3 mb-2"
        rows="3"
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={submitting}
        maxLength={1000}
        style={{
          resize: 'vertical',
          backgroundColor: 'rgba(20, 20, 25, 0.6)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      />
      <div className="d-flex justify-content-end gap-2">
        {onCancel && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-sm btn-gradient-primary d-flex align-items-center gap-1.5"
          disabled={submitting || !content.trim()}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Submitting...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
};

export default CommentEditor;
