import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(emailOrUsername, password);
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
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
              Where professionals find their high-signal tribe.
            </h1>
            <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
              Skip the noise. Connect directly with specialized remote professionals, join verified knowledge-sharing groups, and discover opportunities in your specific technical domain.
            </p>
          </div>

          <div className="mt-5">
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex -space-x-2">
                <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold border border-dark" style={{ width: '28px', height: '28px', fontSize: '0.65rem' }}>D</div>
                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold border border-dark" style={{ width: '28px', height: '28px', fontSize: '0.65rem', marginLeft: '-8px' }}>M</div>
                <div className="rounded-circle bg-success d-flex align-items-center justify-content-center text-white fw-bold border border-dark" style={{ width: '28px', height: '28px', fontSize: '0.65rem', marginLeft: '-8px' }}>R</div>
              </div>
              <span className="text-muted small">Join over 10,000+ niche developers and builders.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="col-lg-6 p-5" style={{ background: 'var(--nl-bg-card)' }}>
          <div className="mb-4">
            <h2 className="h3 text-white mb-1">Welcome back</h2>
            <p className="text-secondary small">Enter your credentials to enter your dashboard.</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2.5 small rounded border-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--nl-danger)' }} role="alert">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold">Username or Email</label>
              <input
                type="text"
                className="form-control nl-input"
                placeholder="e.g. johndev or john@niche.com"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label text-secondary small fw-semibold mb-0">Password</label>
              </div>
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
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to Tribe</span>
              )}
            </button>
          </form>

          <p className="mt-4 mb-0 text-center text-secondary small">
            New to NicheLink? <Link to="/register" className="text-decoration-none fw-semibold" style={{ color: 'var(--nl-accent-primary)' }}>Join a Tribe</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
