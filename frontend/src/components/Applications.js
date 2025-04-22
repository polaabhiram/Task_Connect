// TaskConnect/frontend/src/components/Applications.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage('No authentication token found. Please log in.');
          return;
        }
        console.log('Fetching applications with token:', token);
        console.log('API URL:', process.env.REACT_APP_API_URL);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/jobs/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Full API Response:', response);
        console.log('Applications API Response Data:', response.data);
        setApplications(response.data);
      } catch (err) {
        console.error('Error fetching applications - Full Error:', err);
        console.error('Error Response:', err.response);
        setMessage(err.response?.data?.message || 'Error fetching applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const handleAccept = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/jobs/applications/${applicationId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      setApplications(applications.map(app =>
        app._id === applicationId ? { ...app, status: 'accepted' } : app
      ));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error accepting application');
    }
  };

  const handleReject = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/jobs/applications/${applicationId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      setApplications(applications.map(app =>
        app._id === applicationId ? { ...app, status: 'rejected' } : app
      ));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error rejecting application');
    }
  };

  return (
    <div className="applications-container">
      <h2 className="applications-title">Applicant Details</h2>
      {message && (
        <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      {loading ? (
        <p className="loading">Loading applications...</p>
      ) : (
        <div className="applications-list">
          {applications.length > 0 ? (
            applications.map((app) => (
              <div key={app._id} className="application-card">
                
                <p className="application-detail"><strong>Name:</strong> {app.worker?.name || 'Unknown'}</p>
                <p className="application-detail"><strong>Email:</strong> {app.worker?.email || 'Not provided'}</p>
                <p className="application-detail"><strong>Category:</strong> {app.worker?.category || 'Not specified'}</p>
                <p className="application-detail"><strong>Applied On:</strong> {new Date(app.appliedAt).toLocaleDateString()}</p>
                <p className="application-detail"><strong>Applied for Job:</strong> {app.job.title}</p>
                <p className="application-detail"><strong>Status:</strong> {app.status || 'pending'}</p>
                {app.status === 'pending' ? (
                  <div className="application-actions">
                    <button className="accept-btn" onClick={() => handleAccept(app._id)}>
                      Accept
                    </button>
                    <button className="reject-btn" onClick={() => handleReject(app._id)}>
                      Reject
                    </button>
                  </div>
                ) : (
                  <p className={`status-message ${app.status}`}>
                    Application {app.status}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="no-applications">No applications yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;