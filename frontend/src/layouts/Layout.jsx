import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from '../components/GlobalSearch';
import NotificationDropdown from '../components/NotificationDropdown';

const Layout = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: 'var(--nl-bg-base)' }}>
      {/* Top Navbar */}
      <nav className="navbar navbar-expand nl-navbar sticky-top py-3">
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center gap-4">
            <Link className="navbar-brand fw-extrabold fs-3 d-flex align-items-center gap-2" to="/" style={{ letterSpacing: '-0.03em' }}>
              <span style={{ background: 'var(--nl-gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NicheLink</span>
              <span className="fs-4">🔗</span>
            </Link>

            {/* Global Search - Desktop View Only */}
            {isAuthenticated && (
              <div className="d-none d-md-block ms-2">
                <GlobalSearch />
              </div>
            )}
          </div>
          
          <div className="ms-auto d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <div className="d-flex align-items-center gap-3">
                <NotificationDropdown />
                
                <span className="badge nl-badge rounded-pill px-2.5 py-1 d-none d-sm-inline-block">
                  {user.role === 'ProMember' ? '💎 PRO' : user.role}
                </span>

                <Link to="/profile" className="text-decoration-none d-flex align-items-center gap-2 text-light hover-opacity" style={{ transition: 'var(--nl-transition-fast)' }}>
                  {user.avatar ? (
                    <img src={user.avatar} className="rounded-circle border border-secondary" style={{ width: '36px', height: '36px', objectFit: 'cover', borderColor: 'var(--nl-border-color)' }} alt="Profile" />
                  ) : (
                    <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '36px', height: '36px', fontSize: '0.9rem', background: 'var(--nl-gradient-brand)' }}>
                      {user.name?.charAt(0)}
                    </div>
                  )}
                  <span className="d-none d-md-inline-block text-white fw-semibold small">{user.name}</span>
                </Link>

                <button onClick={handleLogout} className="btn btn-sm btn-link text-decoration-none text-muted hover-text-danger p-1 ms-2" title="Logout" style={{ transition: 'var(--nl-transition-fast)' }}>
                  <span className="fs-5">🚪</span>
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link className="btn nl-btn btn-link text-white text-decoration-none" to="/login">Login</Link>
                <Link className="btn nl-btn nl-btn-primary px-4" to="/register">Join Tribe</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Layout Area */}
      <div className="container-fluid flex-grow-1 px-0">
        <div className="d-flex">
          {/* Sidebar Navigation Rail - Desktop View Only */}
          {isAuthenticated && (
            <nav className="d-none d-md-flex flex-column align-items-center py-4 px-2 position-sticky nl-nav-rail" style={{ width: '88px', zIndex: 10 }}>
              <NavLink className={({ isActive }) => `nl-nav-rail-item w-100 ${isActive ? 'active' : ''}`} to="/" end>
                <span>🏠</span>
                <span>Home</span>
              </NavLink>
              
              <NavLink className={({ isActive }) => `nl-nav-rail-item w-100 ${isActive ? 'active' : ''}`} to="/dashboard">
                <span>📊</span>
                <span>Dashboard</span>
              </NavLink>

              <NavLink className={({ isActive }) => `nl-nav-rail-item w-100 ${isActive ? 'active' : ''}`} to="/communities">
                <span>👥</span>
                <span>Tribes</span>
              </NavLink>

              <NavLink className={({ isActive }) => `nl-nav-rail-item w-100 ${isActive ? 'active' : ''}`} to="/messages">
                <span>💬</span>
                <span>DMs</span>
              </NavLink>

              <NavLink className={({ isActive }) => `nl-nav-rail-item w-100 ${isActive ? 'active' : ''}`} to="/projects">
                <span>💼</span>
                <span>Projects</span>
              </NavLink>

              <NavLink className={({ isActive }) => `nl-nav-rail-item w-100 ${isActive ? 'active' : ''}`} to="/notifications">
                <span>🔔</span>
                <span>Alerts</span>
              </NavLink>

              <NavLink className={({ isActive }) => `nl-nav-rail-item w-100 ${isActive ? 'active' : ''}`} to="/pricing">
                <span>💎</span>
                <span>Pricing</span>
              </NavLink>

              {isAdmin && (
                <NavLink className={({ isActive }) => `nl-nav-rail-item w-100 mt-4 ${isActive ? 'active' : ''}`} to="/admin">
                  <span>⚙️</span>
                  <span>Mod</span>
                </NavLink>
              )}
            </nav>
          )}

          {/* Main Content Area */}
          <main className="flex-grow-1 px-3 px-md-5 py-4" style={{ minWidth: 0, marginBottom: isAuthenticated ? '70px' : '0' }}>
            <div className="nl-animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar - Visible on mobile only */}
      {isAuthenticated && (
        <nav className="d-md-none fixed-bottom border-top py-2 d-flex justify-content-around align-items-center" style={{ zIndex: 1030, background: 'rgba(6,8,19,0.96)', backdropFilter: 'blur(16px)', borderColor: 'var(--nl-border-color)' }}>
          <NavLink to="/" end className={({ isActive }) => `text-center text-decoration-none ${isActive ? 'text-emerald' : 'text-muted'}`} style={{ color: ({isActive}) => isActive ? 'var(--nl-accent-primary)' : 'var(--nl-text-secondary)' }}>
            <div className="fs-5">🏠</div>
            <div style={{ fontSize: '0.68rem', fontWeight: 500 }}>Home</div>
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `text-center text-decoration-none`} style={({isActive}) => ({ color: isActive ? 'var(--nl-accent-primary)' : 'var(--nl-text-secondary)' })}>
            <div className="fs-5">📊</div>
            <div style={{ fontSize: '0.68rem', fontWeight: 500 }}>Dashboard</div>
          </NavLink>
          <NavLink to="/communities" className={({ isActive }) => `text-center text-decoration-none`} style={({isActive}) => ({ color: isActive ? 'var(--nl-accent-primary)' : 'var(--nl-text-secondary)' })}>
            <div className="fs-5">👥</div>
            <div style={{ fontSize: '0.68rem', fontWeight: 500 }}>Tribes</div>
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => `text-center text-decoration-none`} style={({isActive}) => ({ color: isActive ? 'var(--nl-accent-primary)' : 'var(--nl-text-secondary)' })}>
            <div className="fs-5">💬</div>
            <div style={{ fontSize: '0.68rem', fontWeight: 500 }}>DMs</div>
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `text-center text-decoration-none`} style={({isActive}) => ({ color: isActive ? 'var(--nl-accent-primary)' : 'var(--nl-text-secondary)' })}>
            <div className="fs-5">💼</div>
            <div style={{ fontSize: '0.68rem', fontWeight: 500 }}>Projects</div>
          </NavLink>
        </nav>
      )}
    </div>
  );
};

export default Layout;
