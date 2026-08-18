import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await register(name, username, email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '85vh' }}>
      <div className="row w-100 g-0 rounded-4 overflow-hidden shadow-lg border border-secondary" style={{ maxWidth: '960px', borderColor: 'var(--nl-border-color)' }}>
        
        {/* Left Side: Brand Storytelling */}
        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 position-relative" style={{ background: 'linear-gradient(135deg, #090e1f 0%, #05070f 100%)' }}>
          <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)', pointerEvents: 'none' }}></div>
          
          <div>
            <div className="d-flex align-items-center gap-2 mb-4">
              <span className="fs-3">🔗</span>
              <span className="fw-extrabold fs-4 text-white" style={{ letterSpacing: '-0.02em' }}>NicheLink</span>
            </div>
            <h1 className="display-6 fw-bold text-white mb-3" style={{ lineHeight: '1.2' }}>
              Connect with specialized professional tribes.
            </h1>
            <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
              Explore micro-communities built specifically around your remote work specialty. Share articles, code files, discuss trends, find collaborative listings, and direct message peers.
            </p>
          </div>

          <div className="mt-5">
            <span className="text-muted small">🔒 Verified profiles & high-signal discussions only.</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="col-lg-6 p-5" style={{ background: 'var(--nl-bg-card)' }}>
          <div className="mb-4">
            <h2 className="h3 text-white mb-1">Create Account</h2>
            <p className="text-secondary small">Enter your details to register your tribe profile.</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2.5 small rounded border-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--nl-danger)' }} role="alert">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold">Full Name</label>
              <input
                type="text"
                className="form-control nl-input"
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold">Username</label>
              <input
                type="text"
                className="form-control nl-input"
                placeholder="e.g. janedoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold">Email Address</label>
              <input
                type="email"
                className="form-control nl-input"
                placeholder="e.g. jane@niche.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <label className="form-label text-secondary small fw-semibold">Password</label>
              <input
                type="password"
                className="form-control nl-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn nl-btn nl-btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true"></span>
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>

          <p className="mt-4 mb-0 text-center text-secondary small">
            Already have an account? <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: 'var(--nl-accent-primary)' }}>Sign In</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
