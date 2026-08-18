import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Avatar from './Avatar';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        if (res.data.success) {
          setResults(res.data.results);
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelectLink = (path) => {
    navigate(path);
    setQuery('');
    setIsOpen(false);
  };

  const hasResults = results && (
    results.communities.length > 0 ||
    results.users.length > 0 ||
    results.posts.length > 0 ||
    results.projects.length > 0
  );

  return (
    <div className="position-relative" ref={containerRef} style={{ width: '320px' }}>
      <input
        type="search"
        className="form-control form-control-glass py-1.5 px-3 fs-8 w-100"
        placeholder="🔍 Search tribes, people, posts..."
        aria-label="Global search input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {/* Dropdown Overlay Results Panel */}
      {isOpen && (
        <div
          className="glass-card position-absolute mt-2 p-3 w-100 overflow-y-auto d-flex flex-column gap-3 shadow-lg"
          style={{
            top: '100%',
            left: 0,
            zIndex: 1040,
            maxHeight: '400px',
            backgroundColor: 'rgba(9, 13, 22, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {loading && (
            <div className="text-center py-3 text-muted small">
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Searching NicheLink...
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="text-muted small py-2 text-center">
              Type at least 2 characters to search...
            </div>
          )}

          {!loading && query.trim().length >= 2 && !hasResults && (
            <div className="text-muted small py-2 text-center">
              No matching records found.
            </div>
          )}

          {!loading && hasResults && (
            <>
              {/* Communities */}
              {results.communities.length > 0 && (
                <div>
                  <small className="text-uppercase text-muted fw-bold fs-9 mb-1.5 d-block">Communities</small>
                  <div className="d-flex flex-column gap-1">
                    {results.communities.map((c) => (
                      <div
                        key={c._id}
                        onClick={() => handleSelectLink(`/communities/${c.slug}`)}
                        className="p-2 rounded hover-bg-glass text-light small d-flex align-items-center gap-2 cursor-pointer"
                        style={{ cursor: 'pointer' }}
                      >
                        🏘️ <span className="fw-medium">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {results.users.length > 0 && (
                <div>
                  <small className="text-uppercase text-muted fw-bold fs-9 mb-1.5 d-block">People</small>
                  <div className="d-flex flex-column gap-1">
                    {results.users.map((u) => (
                      <div
                        key={u._id}
                        onClick={() => handleSelectLink(`/profile/${u.username}`)}
                        className="p-2 rounded hover-bg-glass text-light small d-flex align-items-center gap-2 cursor-pointer"
                        style={{ cursor: 'pointer' }}
                      >
                        <Avatar name={u.name} src={u.avatar} size={20} />
                        <div>
                          <span className="fw-medium d-block text-white" style={{ lineHeight: '1.2' }}>{u.name}</span>
                          <span className="fs-9 text-muted">@{u.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discussions (Posts) */}
              {results.posts.length > 0 && (
                <div>
                  <small className="text-uppercase text-muted fw-bold fs-9 mb-1.5 d-block">Discussions</small>
                  <div className="d-flex flex-column gap-1">
                    {results.posts.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => handleSelectLink(`/posts/${p._id}`)}
                        className="p-2 rounded hover-bg-glass text-light small d-flex align-items-center gap-2 cursor-pointer"
                        style={{ cursor: 'pointer' }}
                      >
                        💬 <span className="fw-medium text-truncate" style={{ maxWidth: '240px' }}>{p.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {results.projects.length > 0 && (
                <div>
                  <small className="text-uppercase text-muted fw-bold fs-9 mb-1.5 d-block">Projects</small>
                  <div className="d-flex flex-column gap-1">
                    {results.projects.map((pr) => (
                      <div
                        key={pr._id}
                        onClick={() => handleSelectLink('/projects')}
                        className="p-2 rounded hover-bg-glass text-light small d-flex align-items-center gap-2 cursor-pointer"
                        style={{ cursor: 'pointer' }}
                      >
                        💼 <span className="fw-medium text-truncate" style={{ maxWidth: '240px' }}>{pr.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
