import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCommunities } from '../store/slices/communitySlice';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

const Communities = () => {
  const dispatch = useDispatch();
  const { communities, loading, error } = useSelector((state) => state.community);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchCommunities());
  }, [dispatch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchCommunities(search));
  };

  if (loading) return <Loading />;

  return (
    <div className="container py-4">
      {/* Header & Search */}
      <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
        <div>
          <h2 className="text-white mb-1 fw-bold h3">Explore Tribes</h2>
          <p className="text-secondary small mb-0">Discover and join specialized micro-communities built around your career focus.</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="d-flex gap-2" style={{ maxWidth: '400px', width: '100%' }}>
          <input
            type="text"
            className="form-control nl-input"
            placeholder="Search by name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn nl-btn nl-btn-primary px-4">
            Search
          </button>
        </form>
      </div>

      {error && <div className="alert alert-danger py-2.5 small mb-4 border-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--nl-danger)' }}>⚠️ {error}</div>}

      {/* Grid List */}
      {communities.length === 0 ? (
        <EmptyState icon="👥" title="No Tribes Found" message="Try searching for another keyword or check back later." />
      ) : (
        <div className="row g-4">
          {communities.map((comm) => (
            <div key={comm._id} className="col-md-6 col-lg-4">
              <div className="nl-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="badge nl-badge nl-badge-secondary">
                      {comm.category}
                    </span>
                    {comm.isPro && (
                      <span className="badge nl-badge-pro rounded-pill px-2.5 py-0.5">
                        PRO
                      </span>
                    )}
                  </div>
                  
                  <h4 className="h5 text-white mb-2 fw-bold">{comm.name}</h4>
                  <p className="text-secondary small mb-4 text-line-clamp-3" style={{ height: '60px', overflow: 'hidden' }}>
                    {comm.description}
                  </p>
                </div>

                <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-3" style={{ borderColor: 'var(--nl-border-color) !important' }}>
                  <span className="text-secondary small">👥 {comm.memberCount} members</span>
                  <Link to={`/communities/${comm.slug}`} className="btn nl-btn nl-btn-outline btn-sm">
                    Enter Tribe
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Communities;
