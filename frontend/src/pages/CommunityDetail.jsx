import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { fetchCommunityBySlug, joinCommunity, leaveCommunity } from '../store/slices/communitySlice';
import { fetchPosts, deletePost } from '../store/slices/postSlice';
import Loading from '../components/Loading';
import PostComposer from '../components/PostComposer';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';

const CommunityDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { user: currentUser } = useAuth();
  
  const { activeCommunity: comm, loading: loadingComm, error: commError } = useSelector((state) => state.community);
  const { feed: posts, pagination, loading: loadingPosts } = useSelector((state) => state.post);

  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  const fetchTribeDetails = async () => {
    try {
      const resultAction = await dispatch(fetchCommunityBySlug(slug)).unwrap();
      dispatch(fetchPosts({ communityId: resultAction._id, page, limit: 5 }));
    } catch (err) {
      setError(err || 'Failed to load Tribe details');
    }
  };

  useEffect(() => {
    fetchTribeDetails();
  }, [slug, page, dispatch]);

  const handleJoin = async () => {
    if (!comm) return;
    setError(null);
    setActionLoading(true);
    try {
      await dispatch(joinCommunity(comm._id)).unwrap();
      fetchTribeDetails();
    } catch (err) {
      setError(err || 'Failed to join Tribe');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!comm) return;
    setError(null);
    setActionLoading(true);
    try {
      await dispatch(leaveCommunity(comm._id)).unwrap();
      fetchTribeDetails();
    } catch (err) {
      setError(err || 'Failed to leave Tribe');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this discussion post?')) return;
    try {
      await dispatch(deletePost(postId)).unwrap();
      dispatch(fetchPosts({ communityId: comm._id, page, limit: 5 }));
    } catch (err) {
      setError('Failed to delete post');
    }
  };

  const handlePostCreated = () => {
    setPage(1);
    dispatch(fetchPosts({ communityId: comm._id, page: 1, limit: 5 }));
  };

  if (loadingComm || !comm) return <Loading />;

  const isMember = comm.members?.some(m => m._id?.toString() === currentUser?.id?.toString() || m === currentUser?.id?.toString());
  const isOwner = comm.owner?._id?.toString() === currentUser?.id?.toString() || comm.owner === currentUser?.id?.toString();

  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="container py-4">
      {error && <div className="alert alert-danger py-2.5 small mb-4 border-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--nl-danger)' }}>⚠️ {error}</div>}

      {/* Hero Header */}
      <div className="nl-card mb-4 overflow-hidden position-relative" style={{ height: '220px' }}>
        {comm.coverImage ? (
          <img src={comm.coverImage} className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Cover" />
        ) : (
          <div className="w-100 h-100" style={{ background: 'var(--nl-gradient-brand)', opacity: 0.8 }}></div>
        )}
        
        {/* Title Info overlay */}
        <div className="position-absolute bottom-0 start-0 w-100 p-4 d-flex align-items-end gap-3" style={{ background: 'linear-gradient(0deg, rgba(6,8,19,0.95) 0%, rgba(6,8,19,0) 100%)' }}>
          {comm.icon ? (
            <img src={comm.icon} className="rounded border" style={{ width: '70px', height: '70px', objectFit: 'cover', borderColor: 'var(--nl-border-color)' }} alt="Icon" />
          ) : (
            <div className="rounded d-flex align-items-center justify-content-center border text-white fw-bold" style={{ width: '70px', height: '70px', fontSize: '2rem', background: 'var(--nl-gradient-brand)', borderColor: 'var(--nl-border-color)' }}>
              {comm.name.charAt(0)}
            </div>
          )}
          
          <div className="flex-grow-1">
            <span className="badge nl-badge nl-badge-secondary mb-1">
              {comm.category}
            </span>
            <h1 className="h3 mb-0 text-white d-flex align-items-center gap-2 fw-bold">
              {comm.name}
              {comm.isPro && <span className="badge nl-badge-pro rounded-pill px-2 py-0.5">PRO</span>}
            </h1>
          </div>

          <div>
            {isMember ? (
              <button
                onClick={handleLeave}
                className="btn nl-btn nl-btn-outline text-danger border-danger btn-sm"
                disabled={actionLoading || isOwner}
                title={isOwner ? "Owner cannot leave" : ""}
              >
                Leave Tribe
              </button>
            ) : (
              <button
                onClick={handleJoin}
                className="btn nl-btn nl-btn-primary btn-sm px-4"
                disabled={actionLoading}
              >
                Join Tribe
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Feed */}
        <div className="col-lg-8">
          {/* Post composer */}
          {isMember && (
            <div className="mb-4">
              <PostComposer communityId={comm._id} onPostCreated={handlePostCreated} />
            </div>
          )}

          <div className="nl-card p-4">
            <h5 className="mb-4 text-white fw-bold h6 text-uppercase" style={{ letterSpacing: '0.05em' }}>Discussion Feed</h5>
            
            {loadingPosts ? (
              <Loading />
            ) : posts.length === 0 ? (
              <div className="text-center py-5 text-secondary border border-secondary border-dashed rounded-3" style={{ borderColor: 'var(--nl-border-color) !important' }}>
                <span className="fs-1 d-block mb-3">💬</span>
                <p className="mb-0">No posts have been shared in this Tribe yet.</p>
              </div>
            ) : (
              <div>
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <button
                      className="btn nl-btn nl-btn-outline btn-sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                    >
                      Previous
                    </button>
                    <span className="text-secondary small">Page {page} of {totalPages}</span>
                    <button
                      className="btn nl-btn nl-btn-outline btn-sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: About, Rules, Members */}
        <div className="col-lg-4">
          {/* About */}
          <div className="nl-card p-4 mb-4">
            <h5 className="h6 text-white mb-3 fw-bold">About Tribe</h5>
            <p className="text-secondary small mb-3">{comm.description}</p>
            <div className="border-top pt-3" style={{ borderColor: 'var(--nl-border-color) !important' }}>
              <span className="d-block small text-secondary mb-1">Owner: <span className="text-white">@{comm.owner?.username || 'admin'}</span></span>
              <span className="d-block small text-secondary">Members: <span className="text-white">{comm.memberCount}</span></span>
            </div>
          </div>

          {/* Rules */}
          {comm.rules && comm.rules.length > 0 && (
            <div className="nl-card p-4 mb-4">
              <h5 className="h6 text-white mb-3 fw-bold">Tribe Rules</h5>
              <ol className="list-group list-group-numbered bg-transparent border-0">
                {comm.rules.map((rule, idx) => (
                  <li key={idx} className="list-group-item bg-transparent border-0 text-secondary small p-1">
                    {rule}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Members */}
          <div className="nl-card p-4">
            <h5 className="h6 text-white mb-3 fw-bold">Members ({comm.memberCount})</h5>
            <div className="d-flex flex-column gap-3">
              {comm.members?.slice(0, 5).map((member) => (
                <div key={member._id} className="d-flex align-items-center gap-2">
                  <Avatar name={member.name} src={member.avatar} size={36} />
                  <div>
                    <span className="d-block small text-white fw-semibold">{member.name}</span>
                    <span className="d-block small text-secondary" style={{ fontSize: '0.72rem' }}>{member.profession || "Member"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;
