import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCommunities } from '../store/slices/communitySlice';
import { fetchPosts } from '../store/slices/postSlice';
import { fetchProjects } from '../store/slices/projectSlice';
import Avatar from '../components/Avatar';
import Loading from '../components/Loading';

const Dashboard = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const { communities, loading: loadingComm } = useSelector((state) => state.community);
  const { feed, loading: loadingPosts } = useSelector((state) => state.post);
  const { projectListings } = useSelector((state) => state.project);
  const { unreadCount: unreadMessages } = useSelector((state) => state.message);
  const { unreadCount: unreadNotifications } = useSelector((state) => state.notification);

  useEffect(() => {
    dispatch(fetchCommunities());
    dispatch(fetchPosts({ limit: 4 }));
    dispatch(fetchProjects());
  }, [dispatch]);

  const isPro = currentUser?.role === 'ProMember';

  // Filter joined communities
  const joinedCommunities = communities.filter(c =>
    c.members?.some(mId => mId === currentUser?.id || mId?._id === currentUser?.id)
  );

  return (
    <div className="container py-4">
      {/* Welcome Banner / Command Center Header */}
      <div className="nl-card p-4 mb-4 d-flex flex-column flex-md-row align-items-center justify-content-between gap-4 position-relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'radial-gradient(circle at 10% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 60%)', pointerEvents: 'none' }}></div>
        
        <div className="d-flex align-items-center gap-3" style={{ zIndex: 1 }}>
          <Avatar name={currentUser?.name} src={currentUser?.avatar} size={64} />
          <div>
            <h2 className="h3 mb-1 text-white">Good day, {currentUser?.name || 'Partner'}!</h2>
            <p className="text-secondary small mb-0">Here's your professional overview and recent tribe activity.</p>
          </div>
        </div>
        <div className="d-flex gap-2" style={{ zIndex: 1 }}>
          <span className="badge nl-badge rounded-pill px-3 py-2 align-self-center">
            {currentUser?.role === 'ProMember' ? '💎 PRO MEMBER' : `Role: ${currentUser?.role}`}
          </span>
          <Link to="/pricing" className={`btn nl-btn ${isPro ? 'nl-btn-secondary' : 'nl-btn-primary'} px-3 py-2`}>
            {isPro ? '💎 Pro Subscription' : 'Upgrade to Pro'}
          </Link>
        </div>
      </div>

      {/* Network Insights (Row of metric cards) */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-md-3">
          <Link to="/messages" className="text-decoration-none">
            <div className="nl-card p-3 d-flex align-items-center justify-content-between">
              <div>
                <small className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>Unread DMs</small>
                <h4 className="mb-0 text-white mt-1 fw-bold">{unreadMessages}</h4>
              </div>
              <span className="fs-3">💬</span>
            </div>
          </Link>
        </div>
        <div className="col-sm-6 col-md-3">
          <Link to="/notifications" className="text-decoration-none">
            <div className="nl-card p-3 d-flex align-items-center justify-content-between">
              <div>
                <small className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>Notifications</small>
                <h4 className="mb-0 text-white mt-1 fw-bold">{unreadNotifications}</h4>
              </div>
              <span className="fs-3">🔔</span>
            </div>
          </Link>
        </div>
        <div className="col-sm-6 col-md-3">
          <Link to="/communities" className="text-decoration-none">
            <div className="nl-card p-3 d-flex align-items-center justify-content-between">
              <div>
                <small className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>My Tribes</small>
                <h4 className="mb-0 text-white mt-1 fw-bold">{joinedCommunities.length}</h4>
              </div>
              <span className="fs-3">👥</span>
            </div>
          </Link>
        </div>
        <div className="col-sm-6 col-md-3">
          <Link to="/projects" className="text-decoration-none">
            <div className="nl-card p-3 d-flex align-items-center justify-content-between">
              <div>
                <small className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>Collaboration Openings</small>
                <h4 className="mb-0 text-white mt-1 fw-bold">{projectListings.length}</h4>
              </div>
              <span className="fs-3">💼</span>
            </div>
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Recent Discussions */}
        <div className="col-lg-8">
          <div className="nl-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h3 className="h5 text-white mb-0">Tribe Conversations</h3>
                <small className="text-secondary">Recent high-signal discussion posts in your communities</small>
              </div>
              <Link to="/communities" className="text-decoration-none small fw-semibold" style={{ color: 'var(--nl-accent-secondary)' }}>Browse Tribes →</Link>
            </div>

            {loadingPosts ? (
              <Loading />
            ) : feed.length === 0 ? (
              <div className="text-center py-5 text-secondary border border-secondary border-dashed rounded-3" style={{ borderColor: 'var(--nl-border-color) !important' }}>
                No active discussions found. Join a tribe to populate your feed!
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {feed.slice(0, 3).map((post) => (
                  <div key={post._id} className="p-3 rounded border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)', borderColor: 'var(--nl-border-color)' }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Avatar name={post.author?.name} src={post.author?.avatar} size={24} />
                      <small className="text-secondary">
                        <span className="text-white fw-semibold">{post.author?.name}</span> • {new Date(post.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <Link to={`/posts/${post._id}`} className="text-decoration-none">
                      <h5 className="h6 text-white mb-2 hover-text-primary" style={{ transition: 'var(--nl-transition-fast)' }}>{post.title}</h5>
                    </Link>
                    <div className="d-flex align-items-center justify-content-between">
                      <small className="text-muted">💬 {post.commentsCount || 0} replies</small>
                      <span className="badge nl-badge rounded-pill">{post.community?.name || 'Tribe'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Tribes and Project Listings */}
        <div className="col-lg-4">
          {/* My Tribes */}
          <div className="nl-card p-4 mb-4">
            <h3 className="h5 text-white mb-3">Joined Tribes</h3>
            {joinedCommunities.length === 0 ? (
              <div className="text-center py-4 text-secondary small border border-secondary border-dashed rounded-3" style={{ borderColor: 'var(--nl-border-color) !important' }}>
                You haven't joined any Tribes yet.<br />
                <Link to="/communities" className="text-decoration-none fw-semibold" style={{ color: 'var(--nl-accent-primary)' }}>Discover Tribes</Link>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {joinedCommunities.slice(0, 3).map((c) => (
                  <Link key={c._id} to={`/communities/${c.slug}`} className="text-decoration-none d-flex align-items-center justify-content-between p-2 rounded hover-opacity text-light" style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
                    <div className="d-flex align-items-center gap-2 text-truncate">
                      {c.icon ? (
                        <img src={c.icon} className="rounded" style={{ width: '28px', height: '28px', objectFit: 'cover' }} alt="Icon" />
                      ) : (
                        <div className="rounded bg-secondary d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '28px', height: '28px', fontSize: '0.8rem', background: 'var(--nl-gradient-brand)' }}>
                          {c.name.charAt(0)}
                        </div>
                      )}
                      <div className="text-truncate">
                        <span className="small fw-semibold">{c.name}</span>
                      </div>
                    </div>
                    <span className="badge nl-badge rounded-pill">{c.category}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Project listings */}
          <div className="nl-card p-4">
            <h3 className="h5 text-white mb-3">Collab Openings</h3>
            {projectListings.length === 0 ? (
              <div className="text-center py-4 text-secondary small border border-secondary border-dashed rounded-3" style={{ borderColor: 'var(--nl-border-color) !important' }}>
                No active projects available currently.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {projectListings.slice(0, 3).map((p) => (
                  <div key={p._id} className="border-bottom pb-2 mb-2" style={{ borderColor: 'var(--nl-border-color) !important' }}>
                    <Link to="/projects" className="text-decoration-none">
                      <h6 className="text-white mb-1 small" style={{ transition: 'var(--nl-transition-fast)' }}>{p.title}</h6>
                    </Link>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <span className="text-secondary small">💰 {p.budget}</span>
                      <span className="badge nl-badge nl-badge-secondary">{p.skills?.[0] || 'Technical'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
