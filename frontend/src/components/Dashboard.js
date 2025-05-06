import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);
  const [editSection, setEditSection] = useState(null);
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      if (!token || !role) {
        setError('Not authenticated. Please log in to access the dashboard.');
        return;
      }

      try {
        const response = await axios.get(
          role === 'worker'
            ? 'http://localhost:5001/api/user/worker/me'
            : 'http://localhost:5001/api/user/professional-body/me',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setUser(response.data);
        setEditData(response.data); // Initialize edit data with user data
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching user data. Please try logging in again.');
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleEdit = (section) => {
    setEditSection(section);
    setEditData({ ...user }); // Reset edit data to current user data
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = async (section) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const endpoint = role === 'worker' ? 'worker' : 'professional-body';

    // Define allowed fields for each section
    const allowedFields = {
      basic: ['name', 'email'],
      worker: ['category', 'skills', 'experience', 'availability'],
      professional: ['type', 'location', 'description']
    };

    // Filter editData to only include allowed fields for the current section
    const updates = {};
    allowedFields[section].forEach((field) => {
      if (editData[field] !== undefined) {
        if (field === 'skills') {
          // Ensure skills is an array
          updates[field] = Array.isArray(editData[field]) 
            ? editData[field] 
            : editData[field].split(',').map(skill => skill.trim());
        } else if (field === 'experience') {
          // Convert experience to number
          updates[field] = Number(editData[field]);
        } else {
          updates[field] = editData[field];
        }
      }
    });

    console.log('Update payload:', updates); // Debug log

    try {
      const response = await axios.put(
        `http://localhost:5001/api/user/${endpoint}/me`,
        updates,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUser(response.data); // Update user data with the response
      setEditData(response.data); // Update editData to reflect saved changes
      setEditSection(null); // Exit edit mode
      setError(''); // Clear any previous errors
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error updating user data.';
      const errorDetails = err.response?.data?.details || '';
      setError(`${errorMsg}${errorDetails ? `: ${errorDetails}` : ''}`);
      console.error('Update error:', err.response?.data || err.message); // Debug log
    }
  };

  const handleCancel = () => {
    setEditSection(null);
    setEditData({ ...user }); // Revert changes
  };

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <div className="message error">{error}</div>
          <button className="logout-btn" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="dashboard-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2 className="dashboard-title">Welcome, {user.name || 'User'}!</h2>
        <div className="user-details">
          {/* Basic Information Section */}
          <div className="detail-section">
            <div
              className={`detail-header ${expandedSection === 'basic' ? 'active' : ''}`}
              onClick={() => toggleSection('basic')}
            >
              Basic Information
            </div>
            <div className={`detail-content ${expandedSection === 'basic' ? 'active' : ''}`}>
              {editSection === 'basic' ? (
                <>
                  <div className="detail-item">
                    <label>Name:</label>
                    <input
                      type="text"
                      name="name"
                      value={editData.name || ''}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <input
                      type="email"
                      name="email"
                      value={editData.email || ''}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="actions">
                    <button className="save-btn" onClick={() => handleSave('basic')}>
                      Save
                    </button>
                    <button className="cancel-btn" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="detail-item">
                    <label>Name:</label> {user.name || 'N/A'}
                  </p>
                  <p className="detail-item">
                    <label>Email:</label> {user.email || 'N/A'}
                  </p>
                  <p className="detail-item">
                    <label>Role:</label> {localStorage.getItem('role') || 'N/A'}
                  </p>
                  <div className="actions">
                    <button className="edit-btn" onClick={() => handleEdit('basic')}>
                      Edit
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Worker Details Section */}
          {localStorage.getItem('role') === 'worker' && (
            <div className="detail-section">
              <div
                className={`detail-header ${expandedSection === 'worker' ? 'active' : ''}`}
                onClick={() => toggleSection('worker')}
              >
                Worker Details
              </div>
              <div className={`detail-content ${expandedSection === 'worker' ? 'active' : ''}`}>
                {editSection === 'worker' ? (
                  <>
                    <div className="detail-item">
                      <label>Category:</label>
                      <input
                        type="text"
                        name="category"
                        value={editData.category || ''}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="detail-item">
                      <label>Skills:</label>
                      <input
                        type="text"
                        name="skills"
                        value={editData.skills?.join(', ') || ''}
                        onChange={(e) =>
                          setEditData({ ...editData, skills: e.target.value.split(',').map(skill => skill.trim()) })
                        }
                      />
                    </div>
                    <div className="detail-item">
                      <label>Experience:</label>
                      <input
                        type="number"
                        name="experience"
                        value={editData.experience || 0}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="detail-item">
                      <label>Availability:</label>
                      <input
                        type="text"
                        name="availability"
                        value={editData.availability || ''}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="actions">
                      <button className="save-btn" onClick={() => handleSave('worker')}>
                        Save
                      </button>
                      <button className="cancel-btn" onClick={handleCancel}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="detail-item">
                      <label>Category:</label> {user.category || 'N/A'}
                    </p>
                    <p className="detail-item">
                      <label>Skills:</label> {user.skills?.join(', ') || 'N/A'}
                    </p>
                    <p className="detail-item">
                      <label>Experience:</label> {user.experience || '0'} years
                    </p>
                    <p className="detail-item">
                      <label>Availability:</label> {user.availability || 'N/A'}
                    </p>
                    <div className="actions">
                      <button className="edit-btn" onClick={() => handleEdit('worker')}>
                        Edit
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Professional Body Details Section */}
          {localStorage.getItem('role') === 'professional-body' && (
            <div className="detail-section">
              <div
                className={`detail-header ${expandedSection === 'professional' ? 'active' : ''}`}
                onClick={() => toggleSection('professional')}
              >
                Professional Body Details
              </div>
              <div className={`detail-content ${expandedSection === 'professional' ? 'active' : ''}`}>
                {editSection === 'professional' ? (
                  <>
                    <div className="detail-item">
                      <label>Type:</label>
                      <input
                        type="text"
                        name="type"
                        value={editData.type || ''}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="detail-item">
                      <label>Location:</label>
                      <input
                        type="text"
                        name="location"
                        value={editData.location || ''}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="detail-item">
                      <label>Description:</label>
                      <textarea
                        name="description"
                        value={editData.description || ''}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="actions">
                      <button className="save-btn" onClick={() => handleSave('professional')}>
                        Save
                      </button>
                      <button className="cancel-btn" onClick={handleCancel}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="detail-item">
                      <label>Type:</label> {user.type || 'N/A'}
                    </p>
                    <p className="detail-item">
                      <label>Location:</label> {user.location || 'N/A'}
                    </p>
                    <p className="detail-item">
                      <label>Description:</label> {user.description || 'N/A'}
                    </p>
                    <div className="actions">
                      <button className="edit-btn" onClick={() => handleEdit('professional')}>
                        Edit
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;