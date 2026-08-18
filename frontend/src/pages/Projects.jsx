import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects, fetchProjectDetails, applyForProject, clearSelectedProject } from '../store/slices/projectSlice';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

const Projects = () => {
  const dispatch = useDispatch();
  const { projectListings, selectedProject, loading, error } = useSelector((state) => state.project);
  const currentUser = useSelector((state) => state.auth.currentUser);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleOpenDetail = async (projectId) => {
    try {
      await dispatch(fetchProjectDetails(projectId)).unwrap();
      setShowDetailModal(true);
    } catch (err) {
      alert('Failed to load project details');
    }
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setShowApplyForm(false);
    dispatch(clearSelectedProject());
    setCoverLetter('');
    setProposedBudget('');
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!coverLetter.trim() || !proposedBudget.trim() || !selectedProject) return;

    setApplying(true);
    try {
      await dispatch(applyForProject({
        projectId: selectedProject._id,
        applicationData: {
          coverLetter,
          proposedBudget
        }
      })).unwrap();
      alert('Application submitted successfully!');
      handleCloseDetail();
    } catch (err) {
      alert(err || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  if (loading && projectListings.length === 0) return <Loading />;

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="text-white mb-1 fw-bold h3">Collaboration Openings</h2>
        <p className="text-secondary small">Find active job openings and pitch for contract collaborations within your tribes.</p>
      </div>

      {error && <div className="alert alert-danger py-2 px-3 small rounded mb-4 border-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--nl-danger)' }}>⚠️ {error}</div>}

      {projectListings.length === 0 ? (
        <EmptyState icon="💼" title="No Projects Available" message="There are no active collaboration projects posted at the moment." />
      ) : (
        <div className="row g-4">
          {projectListings.map((p) => (
            <div key={p._id} className="col-md-6 col-lg-4">
              <div className="nl-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-2.5 mb-3">
                    <Avatar name={p.owner?.name} src={p.owner?.avatar} size={32} />
                    <div>
                      <small className="text-white fw-semibold d-block text-truncate" style={{ maxWidth: '140px' }}>{p.owner?.name || 'Anonymous'}</small>
                      <small className="text-secondary d-block" style={{ fontSize: '0.68rem' }}>@{p.owner?.username || 'user'}</small>
                    </div>
                  </div>
                  <h4 className="h5 text-white mb-2 fw-bold">{p.title}</h4>
                  <p className="text-secondary small mb-4 text-line-clamp-3" style={{ height: '54px', overflow: 'hidden' }}>
                    {p.description}
                  </p>
                </div>
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-white small fw-bold">💰 {p.budget}</span>
                    <span className="badge nl-badge rounded-pill">{p.status || 'open'}</span>
                  </div>
                  <button onClick={() => handleOpenDetail(p._id)} className="btn nl-btn nl-btn-outline btn-sm w-100">
                    View Project
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Details Modal */}
      <Modal show={showDetailModal} onClose={handleCloseDetail} title={selectedProject?.title || 'Project Details'}>
        {selectedProject && (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--nl-border-color) !important' }}>
              <div className="d-flex align-items-center gap-2">
                <Avatar name={selectedProject.owner?.name} src={selectedProject.owner?.avatar} size={40} />
                <div>
                  <span className="fw-semibold text-white d-block small">{selectedProject.owner?.name}</span>
                  <small className="text-secondary" style={{ fontSize: '0.72rem' }}>@{selectedProject.owner?.username} • {selectedProject.owner?.profession}</small>
                </div>
              </div>
              <div className="text-end">
                <small className="text-secondary d-block" style={{ fontSize: '0.72rem' }}>Budget Range</small>
                <strong style={{ color: 'var(--nl-accent-primary)' }}>{selectedProject.budget}</strong>
              </div>
            </div>

            <h5 className="h6 text-white mb-2 fw-bold">Description</h5>
            <p className="text-secondary small mb-4">{selectedProject.description}</p>

            <h5 className="h6 text-white mb-2 fw-bold">Required Skills</h5>
            <div className="d-flex flex-wrap gap-2 mb-4">
              {selectedProject.skills?.map((s, idx) => (
                <span key={idx} className="badge nl-badge">{s}</span>
              ))}
            </div>

            {/* Application Section */}
            {currentUser?.id !== selectedProject.owner?._id && currentUser?.id !== selectedProject.owner && (
              <div className="mt-4 pt-3 border-top" style={{ borderColor: 'var(--nl-border-color) !important' }}>
                {!showApplyForm ? (
                  <button onClick={() => setShowApplyForm(true)} className="btn nl-btn nl-btn-primary w-100">
                    Apply for this Project
                  </button>
                ) : (
                  <form onSubmit={handleApplySubmit} className="d-flex flex-column gap-3">
                    <div className="mb-2">
                      <label className="form-label text-secondary small fw-semibold">Proposed Budget ($)</label>
                      <input
                        type="text"
                        className="form-control nl-input"
                        placeholder="e.g. 500"
                        value={proposedBudget}
                        onChange={(e) => setProposedBudget(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-secondary small fw-semibold">Cover Letter / Pitch</label>
                      <textarea
                        className="form-control nl-input"
                        rows="4"
                        placeholder="Explain why you are a good fit and your experience with these skills..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        required
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" onClick={() => setShowApplyForm(false)} className="btn nl-btn nl-btn-outline flex-grow-1" disabled={applying}>
                        Cancel
                      </button>
                      <button type="submit" className="btn nl-btn nl-btn-primary flex-grow-1" disabled={applying}>
                        {applying ? 'Submitting...' : 'Submit Pitch'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Projects;
