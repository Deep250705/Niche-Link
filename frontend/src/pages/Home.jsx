import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Avatar from '../components/Avatar';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [tribes, setTribes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/communities')
      .then((res) => {
        setTribes(res.data.communities || []);
      })
      .catch((err) => {
        console.error('Failed to load communities on landing:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="container py-4">
      {/* Hero Banner Section */}
      <div className="nl-card p-5 mb-5 text-center position-relative overflow-hidden">
        {/* Deep emerald blur background glow */}
        <div className="position-absolute top-0 start-50 translate-middle-x" style={{ width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="badge nl-badge rounded-pill px-3 py-2 mb-3 fw-bold tracking-wider text-uppercase">The Professional Niche Platform</span>
          <h1 className="display-4 fw-extrabold mb-3 text-white">Connect with Your High-Signal Tribe</h1>
          <p className="lead text-secondary mb-4 mx-auto" style={{ maxWidth: '750px', lineHeight: '1.6' }}>
            NicheLink brings together remote developers, creators, and engineers into focused, value-driven micro-communities. Share knowledge, discover collaborative projects, and build real professional relationships.
          </p>
          <div className="d-flex justify-content-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn nl-btn nl-btn-primary px-4 py-2.5">Go to Dashboard</Link>
                <Link to="/communities" className="btn nl-btn nl-btn-outline px-4 py-2.5">Explore Tribes</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn nl-btn nl-btn-primary px-4 py-2.5">Get Started</Link>
                <Link to="/pricing" className="btn nl-btn nl-btn-outline px-4 py-2.5">View Pricing</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tribe Discovery Grid */}
      <div className="row g-4 mb-5">
        <div className="col-12 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-2">
          <div>
            <h2 className="h3 text-white mb-1">Discover Professional Tribes</h2>
            <p className="text-secondary small mb-0">Explore active workspaces and high-signal discussion boards.</p>
          </div>
          <Link to="/communities" className="text-decoration-none small fw-semibold" style={{ color: 'var(--nl-accent-secondary)' }}>View All Tribes →</Link>
        </div>

        {loading ? (
          <div className="col-12 py-5 text-center text-secondary">
            <div className="spinner-border text-emerald spinner-border-sm me-2" role="status" style={{ color: 'var(--nl-accent-primary)' }}></div>
            Loading active tribes...
          </div>
        ) : tribes.length === 0 ? (
          <div className="col-12 py-5 text-center text-secondary border border-secondary border-dashed rounded-4" style={{ borderColor: 'var(--nl-border-color) !important' }}>
            No tribes found. Check back later or create one!
          </div>
        ) : (
          tribes.slice(0, 4).map((tribe) => (
            <div key={tribe._id} className="col-md-6 col-lg-3">
              <div className="nl-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    {tribe.icon ? (
                      <img src={tribe.icon} className="rounded" style={{ width: '40px', height: '40px', objectFit: 'cover' }} alt="Icon" />
                    ) : (
                      <div className="rounded bg-secondary d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '40px', height: '40px', fontSize: '1.1rem', background: 'var(--nl-gradient-brand)' }}>
                        {tribe.name.charAt(0)}
                      </div>
                    )}
                    <div className="text-truncate">
                      <h5 className="h6 text-white mb-0 text-truncate" style={{ maxWidth: '140px' }}>{tribe.name}</h5>
                      <small className="text-secondary" style={{ fontSize: '0.72rem' }}>{tribe.category}</small>
                    </div>
                  </div>
                  <p className="text-secondary small mb-4 text-line-clamp-3" style={{ height: '54px', overflow: 'hidden' }}>
                    {tribe.description}
                  </p>
                </div>
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-secondary" style={{ fontSize: '0.75rem' }}>👥 {tribe.memberCount} members</span>
                    {tribe.isPro && <span className="badge nl-badge-pro rounded-pill px-2 py-0.5">PRO</span>}
                  </div>
                  <Link to={`/communities/${tribe.slug}`} className="btn nl-btn nl-btn-outline btn-sm w-100 text-center">
                    Explore
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Feature highlight */}
      <div className="row g-4 pt-4 border-top" style={{ borderColor: 'var(--nl-border-color)' }}>
        <div className="col-md-4">
          <div className="nl-card p-4">
            <span className="fs-3">💡</span>
            <h4 className="h6 text-white mt-3 mb-2 fw-bold">Micro-Communities</h4>
            <p className="text-secondary small mb-0">High-signal discussion boards with strict membership checks, ensuring spam-free participation.</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="nl-card p-4">
            <span className="fs-3">💼</span>
            <h4 className="h6 text-white mt-3 mb-2 fw-bold">Collab Openings</h4>
            <p className="text-secondary small mb-0">Apply for exclusive technical projects posted directly by companies and developers.</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="nl-card p-4">
            <span className="fs-3">💬</span>
            <h4 className="h6 text-white mt-3 mb-2 fw-bold">Direct DM Channels</h4>
            <p className="text-secondary small mb-0">Instant messages and secure professional chat threads with socket connection indicators.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
