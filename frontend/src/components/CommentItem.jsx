import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CommentEditor from './CommentEditor';
import ReplyForm from './ReplyForm';

const CommentItem = ({
  comment,
  onUpdateComment,
  onDeleteComment,
  onAddReply,
  canComment
}) => {
  const { user: currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [repliesCollapsed, setRepliesCollapsed] = useState(false);

  const isDeleted = comment.content === '[This comment has been deleted]' || comment.author === null;
  const isAuthor = comment.author?._id === currentUser?.id || comment.author === currentUser?.id;
  const isAdmin = currentUser?.role === 'Admin';
  const canEdit = !isDeleted && isAuthor;
  const canDelete = !isDeleted && (isAuthor || isAdmin);

  const timeFormatted = new Date(comment.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleUpdate = async (newContent) => {
    await onUpdateComment(comment._id, newContent);
    setIsEditing(false);
  };

  const handleReplySubmit = async (replyContent) => {
    await onAddReply(comment._id, replyContent);
    setIsReplying(false);
  };

  return (
    <div className="comment-item mb-3">
      <div className="glass-card p-3" style={{ borderLeft: comment.parentComment ? '2px solid rgba(255,255,255,0.1)' : 'none' }}>
        {/* Comment Header */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center gap-2">
            {!isDeleted && comment.author?.avatar ? (
              <img
                src={comment.author.avatar}
                alt="Avatar"
                className="rounded-circle border border-secondary"
                style={{ width: '32px', height: '32px', objectFit: 'cover' }}
              />
            ) : (
              <div
                className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-light small fw-bold"
                style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
              >
                {isDeleted ? 'D' : (comment.author?.name ? comment.author.name.charAt(0) : 'U')}
              </div>
            )}
            <div>
              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                <span className="small fw-semibold text-light">
                  {isDeleted ? 'Deleted Comment' : (comment.author?.name || 'Anonymous')}
                </span>
                {!isDeleted && comment.author?.username && (
                  <span className="text-muted small fs-8">@{comment.author.username}</span>
                )}
                {!isDeleted && comment.author?.role === 'Admin' && (
                  <span className="badge bg-danger fs-9 px-1.5 py-0.5">Admin</span>
                )}
                {!isDeleted && comment.author?.role === 'ProMember' && (
                  <span className="badge bg-primary fs-9 px-1.5 py-0.5">Pro</span>
                )}
              </div>
              <small className="text-muted fs-8 d-block">
                {!isDeleted && comment.author?.profession ? `${comment.author.profession} • ` : ''}
                {timeFormatted}
              </small>
            </div>
          </div>

          {/* Edit/Delete Actions */}
          <div className="d-flex gap-1">
            {canEdit && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn btn-sm btn-outline-light border-0 p-1 fs-8"
                title="Edit comment"
              >
                ✏️
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDeleteComment(comment._id)}
                className="btn btn-sm btn-outline-danger border-0 p-1 fs-8"
                title="Delete comment"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Comment Content */}
        <div className="comment-body mt-2 text-muted small">
          {isEditing ? (
            <CommentEditor
              initialValue={comment.content}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              submitLabel="Save Changes"
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: comment.content }} />
          )}
        </div>

        {/* Action Bar (Reply & Collapse) */}
        {!isEditing && (
          <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top border-secondary fs-8">
            <div className="d-flex gap-3">
              {!isDeleted && canComment && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="btn btn-link text-decoration-none p-0 text-primary fw-medium"
                >
                  {isReplying ? 'Cancel Reply' : '💬 Reply'}
                </button>
              )}
            </div>

            {comment.children && comment.children.length > 0 && (
              <button
                onClick={() => setRepliesCollapsed(!repliesCollapsed)}
                className="btn btn-link text-decoration-none p-0 text-muted"
              >
                {repliesCollapsed ? `▼ Show ${comment.children.length} replies` : `▲ Hide replies`}
              </button>
            )}
          </div>
        )}

        {/* Inline Reply Form */}
        {isReplying && (
          <ReplyForm
            parentAuthorName={comment.author?.username || 'user'}
            onSubmit={handleReplySubmit}
            onCancel={() => setIsReplying(false)}
          />
        )}
      </div>

      {/* Nested Replies Rendering */}
      {comment.children && comment.children.length > 0 && !repliesCollapsed && (
        <div className="nested-replies mt-2 ps-4 border-start border-secondary">
          {comment.children.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              onAddReply={onAddReply}
              canComment={canComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
