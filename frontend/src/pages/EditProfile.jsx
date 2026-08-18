import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';

const EditProfile = () => {
  const { checkAuthStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const res = await api.get('/users/profile');
        if (res.data.success) {
          const u = res.data.user;
          setName(u.name || '');
          setProfession(u.profession || '');
          setBio(u.bio || '');
          setLocation(u.location || '');
          setWebsite(u.website || '');
          setSkillsStr(u.skills?.join(', ') || '');
          setGithub(u.socialLinks?.github || '');
          setLinkedin(u.socialLinks?.linkedin || '');
          setTwitter(u.socialLinks?.twitter || '');
          setAvatar(u.avatar || '');
        }
      } catch (err) {
        setError('Failed to fetch profile settings');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const skills = skillsStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await api.put('/users/profile', {
        name,
        profession,
        bio,
        location,
        website,
        skills,
        socialLinks: { github, linkedin, twitter }
      });

      if (res.data.success) {
        setSuccess('Profile updated successfully!');
        await checkAuthStatus(); // Refresh global auth user details
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpdate = async (newAvatarUrl) => {
    try {
      setSaving(true);
      const res = await api.post('/users/avatar', { avatar: newAvatarUrl });
      if (res.data.success) {
        setAvatar(res.data.avatar);
        setSuccess(newAvatarUrl ? 'Avatar updated!' : 'Avatar removed!');
        await checkAuthStatus();
      }
    } catch (err) {
      setError('Failed to update avatar image');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container py-4" style={{ maxWidth: '780px' }}>
      <div className="nl-card p-5">
        <h2 className="text-white mb-2 fw-bold h3">Edit Profile Settings</h2>
        <p className="text-secondary small mb-4">Keep your professional identity and skills up to date.</p>

        {error && <div className="alert alert-danger py-2.5 small mb-4 border-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--nl-danger)' }}>⚠️ {error}</div>}
        {success && <div className="alert alert-success py-2.5 small mb-4 border-0" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--nl-success)' }}>✨ {success}</div>}

        {/* Avatar Section */}
        <div className="mb-5 d-flex align-items-center gap-4 border-bottom pb-4" style={{ borderColor: 'var(--nl-border-color) !important' }}>
          {avatar ? (
            <img
              src={avatar}
              alt="Profile avatar"
              className="rounded-circle border"
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderColor: 'var(--nl-border-color)' }}
            />
          ) : (
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white font-weight-bold"
              style={{ width: '80px', height: '80px', fontSize: '2rem', background: 'var(--nl-gradient-brand)' }}
            >
              {name.charAt(0)}
            </div>
          )}
          
          <div className="flex-grow-1">
            <label className="form-label text-secondary small d-block">Avatar URL Link</label>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control nl-input form-control-sm"
                placeholder="https://example.com/avatar.jpg"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
              <button
                type="button"
                className="btn nl-btn nl-btn-primary btn-sm px-3"
                onClick={() => handleAvatarUpdate(avatar)}
                disabled={saving}
              >
                Apply
              </button>
              {avatar && (
                <button
                  type="button"
                  className="btn nl-btn nl-btn-outline btn-sm text-danger border-danger"
                  onClick={() => handleAvatarUpdate('')}
                  disabled={saving}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form Settings */}
        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label text-secondary small fw-semibold">Full Name</label>
              <input
                type="text"
                className="form-control nl-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="col-md-6">
              <label className="form-label text-secondary small fw-semibold">Profession</label>
              <input
                type="text"
                className="form-control nl-input"
                placeholder="e.g. SaaS Founder, React Architect"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
              />
            </div>

            <div className="col-12">
              <label className="form-label text-secondary small fw-semibold">Professional Bio</label>
              <textarea
                rows="3"
                className="form-control nl-input"
                placeholder="Write a brief professional summary..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength="200"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label text-secondary small fw-semibold">Location / Remote Indicator</label>
              <input
                type="text"
                className="form-control nl-input"
                placeholder="e.g. London, UK (Remote)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label text-secondary small fw-semibold">Website</label>
              <input
                type="url"
                className="form-control nl-input"
                placeholder="https://mywebsite.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="col-12">
              <label className="form-label text-secondary small fw-semibold">Technical Skills (Comma Separated)</label>
              <input
                type="text"
                className="form-control nl-input"
                placeholder="React, TypeScript, WebSockets, Docker"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
              />
            </div>

            <h5 className="mt-5 mb-2 text-white h6 fw-bold">Social Handles</h5>

            <div className="col-md-4">
              <label className="form-label text-secondary small">GitHub Username</label>
              <input
                type="text"
                className="form-control nl-input"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label text-secondary small">LinkedIn Username</label>
              <input
                type="text"
                className="form-control nl-input"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label text-secondary small">Twitter Username</label>
              <input
                type="text"
                className="form-control nl-input"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-3 mt-5 border-top pt-4" style={{ borderColor: 'var(--nl-border-color) !important' }}>
            <Link to="/profile" className="btn nl-btn nl-btn-outline">
              Back to Profile
            </Link>
            <button
              type="submit"
              className="btn nl-btn nl-btn-primary d-flex align-items-center gap-2"
              disabled={saving}
            >
              {saving && <span className="spinner-border spinner-border-sm text-dark animate-spin" role="status"></span>}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
