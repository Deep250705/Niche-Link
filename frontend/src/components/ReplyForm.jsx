import React from 'react';
import CommentEditor from './CommentEditor';

const ReplyForm = ({ onSubmit, onCancel, parentAuthorName }) => {
  return (
    <div className="reply-form-container mt-2 ps-3 border-start border-secondary">
      <CommentEditor
        onSubmit={onSubmit}
        onCancel={onCancel}
        submitLabel="Reply"
        placeholder={`Replying to @${parentAuthorName || 'user'}...`}
      />
    </div>
  );
};

export default ReplyForm;
