import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = username ? `/users/${username}` : '/users/profile';
        const res = await api.get(url);
        
        if (res.data.success) {
          setProfile(username ? res.data.profile : res.data.user);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser]);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="alert alert-danger py-3 my-4">
        {error}. <Link to="/" className="alert-link">Back to Home</Link>
      </div>
    );
  }

  const isOwnProfile = !username || currentUser?.username === profile?.username;

  return (
    <div className="container py-4">
      <div className="row g-4">
        {/* Left Column: Avatar & Basic Information card */}
        <div className="col-lg-4">
          <div className="nl-card p-4 text-center position-relative overflow-hidden">
            {/* Soft decorative background radial glow */}
            <div className="position-absolute top-0 start-50 translate-middle-x" style={{ width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Avatar container */}
              <div className="mb-3 position-relative d-inline-block">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="rounded-circle border shadow-lg"
                    style={{ width: '130px', height: '130px', objectFit: 'cover', borderColor: 'var(--nl-border-color)' }}
                  />
                ) : (
                  <div
                    className="rounded-circle shadow-lg d-flex align-items-center justify-content-center text-white"
                    style={{ width: '130px', height: '130px', fontSize: '3rem', fontWeight: 'bold', background: 'var(--nl-gradient-brand)' }}
                  >
                    {profile.name.charAt(0)}
                  </div>
                )}
                {profile.isPro && (
                  <span
                    className="position-absolute bottom-0 end-0 rounded-pill px-2.5 py-0.5 border fw-bold text-dark nl-badge-pro"
                    style={{ fontSize: '0.65rem' }}
                    title="Verified Pro Member"
                  >
                    💎 PRO
                  </span>
                )}
              </div>

              <h3 className="mb-1 text-white fw-bold">{profile.name}</h3>
              <p className="text-secondary small mb-3">@{profile.username}</p>

              {profile.profession ? (
                <p className="fw-semibold mb-3" style={{ color: 'var(--nl-accent-primary)' }}>{profile.profession}</p>
              ) : (
                <p className="text-muted small mb-3">Member</p>
              )}

              {profile.location && (
                <p className="text-secondary small mb-4">📍 {profile.location}</p>
              )}

              {isOwnProfile ? (
                <Link to="/profile/edit" className="btn nl-btn nl-btn-primary btn-sm w-100 py-2">
                  Edit Profile
                </Link>
              ) : (
                <Link to="/messages" className="btn nl-btn nl-btn-outline btn-sm w-100 py-2">
                  Send Direct Message
                </Link>
              )}
            </div>
          </div>

          {/* Social Presence panel */}
          {(profile.website || (profile.socialLinks && Object.values(profile.socialLinks).some(Boolean))) && (
            <div className="nl-card p-4 mt-4">
              <h5 className="h6 text-white mb-3 fw-bold">Web Presence</h5>
              <ul className="list-unstyled mb-0 gap-2.5 d-flex flex-column text-secondary small">
                {profile.website && (
                  <li className="d-flex align-items-center gap-2">
                    <span>🌐</span>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-light hover-opacity">{profile.website}</a>
                  </li>
                )}
                {profile.socialLinks?.github && (
                  <li className="d-flex align-items-center gap-2">
                    <span>🐙</span>
                    <a href={`https://github.com/${profile.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-light hover-opacity">GitHub</a>
                  </li>
                )}
                {profile.socialLinks?.linkedin && (
                  <li className="d-flex align-items-center gap-2">
                    <span>💼</span>
                    <a href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-light hover-opacity">LinkedIn</a>
                  </li>
                )}
                {profile.socialLinks?.twitter && (
                  <li className="d-flex align-items-center gap-2">
                    <span>🐦</span>
                    <a href={`https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-light hover-opacity">Twitter</a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Bio details, skills, and joined tribes */}
        <div className="col-lg-8">
          {/* Bio section */}
          <div className="nl-card p-4 mb-4">
            <h5 className="h6 text-white mb-3 fw-bold">About Professional</h5>
            <p className="text-secondary mb-0" style={{ lineHeight: '1.6' }}>
              {profile.bio || "No professional biography declared yet."}
            </p>
          </div>

          {/* Skills section */}
          <div className="nl-card p-4 mb-4">
            <h5 className="h6 text-white mb-3 fw-bold">Niche Expertise</h5>
            {profile.skills && profile.skills.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span key={index} className="badge nl-badge">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-secondary mb-0 small">No skill tags listed.</p>
            )}
          </div>

          {/* Tribes Joined section */}
          <div className="nl-card p-4">
            <h5 className="h6 text-white mb-3 fw-bold">Tribes & Communities</h5>
            {profile.communities && profile.communities.length > 0 ? (
              <div className="row g-3">
                {profile.communities.map((comm) => (
                  <div key={comm._id || comm.id} className="col-md-6">
                    <div className="p-3 rounded border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)', borderColor: 'var(--nl-border-color)' }}>
                      <h6 className="mb-1 text-white small fw-bold">{comm.name}</h6>
                      <small className="text-secondary text-truncate d-block">{comm.description}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary mb-0 small">Not joined in any tribes yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
