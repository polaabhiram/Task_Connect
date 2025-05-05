// TaskConnect/frontend/src/components/Applications.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css'; // Ensure your CSS is imported

const Applications = () => {
  const [applications, setApplications] = useState([]); // Expecting a flat array
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(localStorage.getItem('role')); // Get role for conditional rendering

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setMessage(''); // Clear previous messages
      setApplications([]); // Clear previous applications

      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('role'); // Get role for the API call logic
      setRole(userRole); // Set role state

      if (!token || !userRole) {
        setMessage('Authentication details missing. Please log in.');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching applications with token:', token);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001'; // Fallback API URL
        console.log('Using API URL:', apiUrl);

        const response = await axios.get(`${apiUrl}/api/jobs/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Full API Response:', response);
        console.log('Applications API Response Data:', response.data);

        // Ensure the response data is an array before setting state
        if (Array.isArray(response.data)) {
          setApplications(response.data);
        } else {
          console.error('API did not return an array:', response.data);
          setMessage('Received unexpected data format from the server.');
          setApplications([]); // Set to empty array on error
        }

      } catch (err) {
        console.error('Error fetching applications - Full Error:', err);
        if (err.response) {
          console.error('Error Response Data:', err.response.data);
          console.error('Error Response Status:', err.response.status);
          setMessage(`Error fetching applications: ${err.response.data.message || err.response.statusText}`);
        } else if (err.request) {
          console.error('Error Request:', err.request);
          setMessage('Error fetching applications: No response received from server.');
        } else {
          console.error('Error Message:', err.message);
          setMessage(`Error fetching applications: ${err.message}`);
        }
        setApplications([]); // Ensure applications is an empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []); // Dependency array is empty, runs once on mount

  const handleStatusUpdate = async (applicationId, newStatus) => {
    setMessage(`Updating application ${applicationId} to ${newStatus}...`);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const endpoint = `${apiUrl}/api/jobs/applications/${applicationId}/${newStatus}`; // 'accept' or 'reject'

      const response = await axios.post(
        endpoint,
        {}, // Empty body for POST request
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(response.data.message || `Application ${newStatus}ed successfully.`);

      // Update the local state to reflect the change immediately
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app._id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      // Optional: Clear message after a delay
      // setTimeout(() => setMessage(''), 3000);

    } catch (err) {
      console.error(`Error ${newStatus}ing application:`, err);
      const errorMsg = err.response?.data?.message || `Error ${newStatus}ing application`;
      setMessage(errorMsg);
      // Optional: Clear message after a delay
      // setTimeout(() => setMessage(''), 5000);
    }
  };

  // Helper function to render details safely
  const renderDetail = (label, value, defaultValue = 'N/A') => (
    <p className="application-detail">
      <strong>{label}:</strong> {value || defaultValue}
    </p>
  );

  return (
    <div className="applications-container">
      <h2 className="applications-title">
        {role === 'professional-body' ? 'Received Applications' : 'My Applications'}
      </h2>
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
                {/* Display Job Title */}
                <h3 className="application-job-title">
                  Job: {app.job?.title || 'Job Title Missing'}
                </h3>

                {/* Display Worker Details (Relevant for Professional Body view) */}
                {role === 'professional-body' && app.worker && (
                  <>
                    {renderDetail('Applicant Name', app.worker.name)}
                    {renderDetail('Applicant Email', app.worker.email)}
                    {renderDetail('Category', app.worker.category)}
                    {renderDetail('Skills', app.worker.skills?.join(', ') || 'None specified')}
                    {renderDetail('Experience', `${app.worker.experience || 0} years`)}
                    {renderDetail('Availability', app.worker.availability)}
                  </>
                )}

                 {/* Display Job Details (Relevant for Worker view) */}
                 {role === 'worker' && app.job && (
                  <>
                    {renderDetail('Job Category', app.job.category)}
                    {renderDetail('Location', app.job.location)}
                    {renderDetail('Budget', `$${app.job.budget}`)}
                    {renderDetail('Posted By', app.job.postedBy)}
                  </>
                )}

                {/* Common Details */}
                {renderDetail('Applied On', app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A')}
                {renderDetail('Status', app.status || 'pending')}

                {/* Actions (Only for Professional Body and if status is pending) */}
                {role === 'professional-body' && app.status === 'pending' ? (
                  <div className="application-actions">
                    <button
                      className="accept-btn"
                      onClick={() => handleStatusUpdate(app._id, 'accepted')}
                    >
                      Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleStatusUpdate(app._id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                ) : role === 'professional-body' ? (
                  // Show status message if not pending (for Professional Body)
                  <p className={`status-message ${app.status}`}>
                    Application {app.status}
                  </p>
                ) : null /* No actions for Worker view */}
              </div>
            ))
          ) : (
            <p className="no-applications">No applications found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;
