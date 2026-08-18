import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [reports, setReports] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch platforms metrics
      const mRes = await api.get('/admin/metrics');
      if (mRes.data.success) {
        setMetrics(mRes.data.metrics);
      }

      // Fetch users list
      const uRes = await api.get('/admin/users');
      setUsers(uRes.data.users || []);

      // Fetch communities
      const cRes = await api.get('/communities');
      setCommunities(cRes.data.communities || []);

      // Fetch reports
      const rRes = await api.get('/admin/reports');
      setReports(rRes.data.reports || []);
    } catch (err) {
      setError('Failed to fetch administrative platform logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        alert(`User role successfully changed to ${newRole}`);
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      } else {
        alert(res.data.message || 'Failed to change role');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change role');
    }
  };

  const handleDeactivate = async (userId, status) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { isActive: status });
      if (res.data.success) {
        alert(`User account ${status ? 'activated' : 'deactivated'}.`);
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: status } : u));
      } else {
        alert(res.data.message || 'Failed to update status');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      const res = await api.patch(`/admin/reports/${reportId}/resolve`, { status: 'resolved' });
      if (res.data.success) {
        setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'resolved' } : r));
        alert('Report resolved.');
      } else {
        alert(res.data.message || 'Failed to resolve report');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve report');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="text-white mb-1">Moderator Control Center</h2>
        <p className="text-muted small">Manage members, moderate tribes, and resolve flag reports.</p>
      </div>

      {error && <div className="alert alert-danger py-2 px-3 small rounded mb-4">{error}</div>}

      {/* Tabs */}
      <div className="d-flex border-bottom border-secondary mb-4 overflow-x-auto">
        <button onClick={() => setActiveTab('users')} className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}>
          👥 Users
        </button>
        <button onClick={() => setActiveTab('communities')} className={`admin-tab ${activeTab === 'communities' ? 'active' : ''}`}>
          🏘️ Tribes
        </button>
        <button onClick={() => setActiveTab('reports')} className={`admin-tab ${activeTab === 'reports' ? 'active' : ''}`}>
          🚩 Reports
        </button>
        <button onClick={() => setActiveTab('subscriptions')} className={`admin-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}>
          📊 Subscriptions
        </button>
      </div>

      {/* Tab Contents */}
      <div className="glass-card p-4">
        {activeTab === 'users' && (
          <div>
            <h3 className="h5 text-white mb-3">User Directory ({users.length})</h3>
            {users.length === 0 ? (
              <EmptyState icon="👥" title="No Users Registered" message="There are currently no users in the database directory." />
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover table-borderless align-middle small mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary text-muted fs-8">
                      <th>Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-bottom border-secondary last-border-none">
                        <td>{u.name}</td>
                        <td className="text-muted">@{u.username}</td>
                        <td>{u.email}</td>
                        <td>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="form-select form-select-sm bg-dark border-secondary text-light fs-8 py-0.5"
                            style={{ width: '120px' }}
                          >
                            <option value="FreeMember">FreeMember</option>
                            <option value="ProMember">ProMember</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <span className={`badge ${u.isActive !== false ? 'bg-success' : 'bg-danger'} fs-9 px-2`}>
                            {u.isActive !== false ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="text-end">
                          {u.isActive !== false ? (
                            <button onClick={() => handleDeactivate(u._id, false)} className="btn btn-sm btn-outline-danger py-0.5 fs-8">
                              Suspend
                            </button>
                          ) : (
                            <button onClick={() => handleDeactivate(u._id, true)} className="btn btn-sm btn-outline-success py-0.5 fs-8">
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'communities' && (
          <div>
            <h3 className="h5 text-white mb-3">Tribe Communities ({communities.length})</h3>
            {communities.length === 0 ? (
              <EmptyState icon="🏘️" title="No Tribes Active" message="No tribe communities are currently registered." />
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover table-borderless align-middle small mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary text-muted fs-8">
                      <th>Name</th>
                      <th>Category</th>
                      <th>Members</th>
                      <th>Plan Type</th>
                      <th>Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {communities.map((c) => (
                      <tr key={c._id} className="border-bottom border-secondary last-border-none">
                        <td className="fw-semibold text-white">{c.name}</td>
                        <td className="text-muted">{c.category}</td>
                        <td>{c.memberCount} members</td>
                        <td>
                          <span className={`badge ${c.isPro ? 'bg-primary' : 'bg-secondary'} fs-9`}>
                            {c.isPro ? '💎 Pro' : 'Free'}
                          </span>
                        </td>
                        <td className="text-muted">@{c.owner?.username || 'admin'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <h3 className="h5 text-white mb-3">Flagged Moderation Reports ({reports.length})</h3>
            {reports.length === 0 ? (
              <EmptyState icon="🚩" title="No Flag Reports" message="Great! There are no flagged moderation issues pending." />
            ) : (
              <div className="d-flex flex-column gap-3">
                {reports.map((r) => (
                  <div key={r._id} className="p-3 bg-dark-card border border-secondary rounded d-flex justify-content-between align-items-center">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-danger fs-9">Type: {r.type}</span>
                        <span className={`badge ${r.status === 'resolved' ? 'bg-success' : 'bg-warning text-dark'} fs-9`}>{r.status}</span>
                      </div>
                      <h5 className="h6 text-white mb-1">{r.reason}</h5>
                      <p className="text-muted small mb-0">{r.details}</p>
                    </div>
                    {r.status === 'pending' && (
                      <button onClick={() => handleResolveReport(r._id)} className="btn btn-sm btn-gradient-primary">
                        Resolve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div>
            <h3 className="h5 text-white mb-3">Subscription Overview</h3>
            <div className="row g-4 mt-2">
              <div className="col-sm-6 col-md-4">
                <div className="card bg-dark border-secondary p-4 rounded text-center">
                  <span className="text-muted small text-uppercase">Total Pro Members</span>
                  <h2 className="text-primary mt-2 mb-0">
                    {metrics ? metrics.subscriptions.active : users.filter(u => u.role === 'ProMember').length}
                  </h2>
                </div>
              </div>
              <div className="col-sm-6 col-md-4">
                <div className="card bg-dark border-secondary p-4 rounded text-center">
                  <span className="text-muted small text-uppercase">Total Free Members</span>
                  <h2 className="text-white mt-2 mb-0">
                    {metrics ? metrics.users.free : users.filter(u => u.role === 'FreeMember').length}
                  </h2>
                </div>
              </div>
              <div className="col-sm-6 col-md-4">
                <div className="card bg-dark border-secondary p-4 rounded text-center">
                  <span className="text-muted small text-uppercase">Monthly Recurrent Revenue</span>
                  <h2 className="text-success mt-2 mb-0">
                    ₹{(metrics ? metrics.subscriptions.active : users.filter(u => u.role === 'ProMember').length) * 1499}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
