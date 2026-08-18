import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loading from './Loading';
import CommentItem from './CommentItem';
import CommentEditor from './CommentEditor';

const CommentList = ({ postId, post }) => {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComments = async (pageNum = 1) => {
    try {
      const res = await api.get(`/comments?post=${postId}&page=${pageNum}&limit=10`);
      if (res.data.success) {
        setComments(res.data.comments);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments(page);
    }
  }, [postId, page]);

  // Determine permissions
  const isMember = post.community?.members?.some(
    (mId) => mId === currentUser?.id || mId?._id === currentUser?.id
  ) || currentUser?.role === 'Admin';

  const isProOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'ProMember';
  const canComment = currentUser && isMember && (!post.community?.isPro || isProOrAdmin);

  // Reconstruct tree from flat comments list
  const buildTree = (flatComments) => {
    const commentMap = {};
    const tree = [];

    // Map comments by ID
    flatComments.forEach((c) => {
      commentMap[c._id] = { ...c, children: [] };
    });

    // Populate children lists and top-level elements
    flatComments.forEach((c) => {
      const mapped = commentMap[c._id];
      if (c.parentComment) {
        const parentId = typeof c.parentComment === 'object' ? c.parentComment._id : c.parentComment;
        if (commentMap[parentId]) {
          commentMap[parentId].children.push(mapped);
        } else {
          tree.push(mapped); // fallback if parent is missing
        }
      } else {
        tree.push(mapped);
      }
    });

    return tree;
  };

  const handleAddComment = async (content) => {
    const res = await api.post('/comments', { post: postId, content });
    if (res.data.success) {
      // Append comment to flat list
      setComments((prev) => [res.data.comment, ...prev]);
    }
  };

  const handleAddReply = async (parentCommentId, content) => {
    const res = await api.post('/comments', {
      post: postId,
      content,
      parentComment: parentCommentId
    });
    if (res.data.success) {
      setComments((prev) => [...prev, res.data.comment]);
    }
  };

  const handleUpdateComment = async (commentId, content) => {
    const res = await api.patch(`/comments/${commentId}`, { content });
    if (res.data.success) {
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, content: res.data.comment.content } : c))
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    const res = await api.delete(`/comments/${commentId}`);
    if (res.data.success) {
      if (res.data.commentId) {
        // Hard deletion
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      } else if (res.data.comment) {
        // Soft deletion
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? { ...c, ...res.data.comment } : c))
        );
      }
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return <div className="alert alert-danger my-3">{error}</div>;
  }

  const commentTree = buildTree(comments);

  return (
    <div className="comments-section mt-5 border-top border-secondary pt-4">
      <h4 className="h6 text-uppercase text-muted fw-bold mb-4">Comments ({post.commentsCount || 0})</h4>

      {/* Editor to add top-level comment */}
      {canComment ? (
        <div className="mb-4">
          <CommentEditor onSubmit={handleAddComment} placeholder="Write a comment..." submitLabel="Comment" />
        </div>
      ) : (
        <div className="alert alert-secondary py-3 text-center small rounded mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
          {!currentUser ? (
            <span>Please <a href="/login" className="text-primary text-decoration-none fw-semibold">log in</a> to participate in discussions.</span>
          ) : !isMember ? (
            <span>You must be a member of this Tribe to comment.</span>
          ) : (
            <span>Commenting in this Pro Tribe requires an active Pro subscription.</span>
          )}
        </div>
      )}

      {/* Empty State */}
      {commentTree.length === 0 ? (
        <div className="text-center py-5 text-muted border border-secondary border-dashed rounded mb-4">
          <span className="fs-2 d-block mb-2">💬</span>
          <p className="mb-0 small">No comments yet. Be the first to start the conversation!</p>
        </div>
      ) : (
        <div className="comment-list-wrapper">
          {commentTree.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
              onAddReply={handleAddReply}
              canComment={canComment}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </button>
              <span className="text-muted small">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentList;
