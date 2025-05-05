import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css'; // Using index.css for styling

const WorkerJobsView = () => {
  // State variables
  const [availableJobs, setAvailableJobs] = useState([]); // Jobs worker can apply to
  const [appliedJobs, setAppliedJobs] = useState([]);   // Applications with pending/rejected status
  const [acceptedJobs, setAcceptedJobs] = useState([]); // Applications with accepted status
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('available'); // 'available', 'applied', 'accepted'

  // Fetch initial data on component mount
  useEffect(() => {
    fetchJobsAndApplications();
  }, []);

  const fetchJobsAndApplications = async () => {
    setLoading(true);
    setError(null);
    setMessage('');
    const token = localStorage.getItem('token');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    if (!token) {
      setError('No authentication token found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      // Fetch available jobs (jobs not applied to yet)
      console.log('[WorkerJobsView] Fetching available jobs...');
      const availableRes = await axios.get(`${apiUrl}/api/jobs/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[WorkerJobsView] Available Jobs Response:', availableRes.data);
      // The backend returns categorized jobs, flatten them for the state
      const flattenedAvailableJobs = Object.values(availableRes.data).flat();
      setAvailableJobs(flattenedAvailableJobs);

      // Fetch all applications for this worker
      console.log('[WorkerJobsView] Fetching worker applications...');
      const applicationsRes = await axios.get(`${apiUrl}/api/jobs/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[WorkerJobsView] Applications Response:', applicationsRes.data);

      if (Array.isArray(applicationsRes.data)) {
        const allApps = applicationsRes.data;
        // Filter applications based on status
        setAcceptedJobs(allApps.filter(app => app.status === 'accepted'));
        setAppliedJobs(allApps.filter(app => app.status === 'pending' || app.status === 'rejected'));
      } else {
         console.error('[WorkerJobsView] Applications API did not return an array:', applicationsRes.data);
         setError('Received unexpected application data format from the server.');
         setAppliedJobs([]);
         setAcceptedJobs([]);
      }

    } catch (err) {
      console.error('[WorkerJobsView] Error fetching data:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error fetching job data';
      setError(errorMsg);
      setMessage(errorMsg); // Show error message to user
      // Clear state on error
      setAvailableJobs([]);
      setAppliedJobs([]);
      setAcceptedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle applying for a job
  const handleApply = async (jobId) => {
    setMessage(`Applying for job ${jobId}...`);
    const token = localStorage.getItem('token');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    if (!token) {
      setMessage('No authentication token found. Please log in.');
      return;
    }

    try {
      console.log(`[WorkerJobsView] Applying for job with ID: ${jobId}`);
      const response = await axios.post(
        `${apiUrl}/api/jobs/${jobId}/apply`,
        {}, // Empty request body
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('[WorkerJobsView] Apply response:', response.data);
      setMessage(response.data.message || 'Application submitted successfully!');

      // --- Optimistic UI Update ---
      // Find the job that was just applied for
      const appliedJob = availableJobs.find(job => job._id === jobId);
      if (appliedJob) {
        // Remove from available jobs
        setAvailableJobs(prev => prev.filter(job => job._id !== jobId));
        // Add to applied jobs (as pending)
        // Construct an application-like object for the applied list
        const newApplication = {
            _id: `temp_${jobId}`, // Temporary ID, real one comes on next fetch
            job: appliedJob,
            status: 'pending',
            appliedAt: new Date().toISOString() // Show immediately
        };
        setAppliedJobs(prev => [newApplication, ...prev]);
      }
      // Optionally switch tab to show the applied jobs
      // setActiveTab('applied');

      // Optional: Clear message after delay
       setTimeout(() => setMessage(''), 3000);

    } catch (err) {
      console.error('[WorkerJobsView] Error applying for job:', err);
      const errorMsg = err.response?.data?.message || 'Error applying for job';
      setMessage(errorMsg);
       // Optional: Clear message after delay
       setTimeout(() => setMessage(''), 5000);
    }
  };

  // Helper to render a list of jobs/applications
  const renderJobList = (jobs, type) => {
    if (!jobs || jobs.length === 0) {
      let message = 'No jobs found.';
      if (type === 'applied') message = 'You have not applied for any jobs yet.';
      if (type === 'accepted') message = 'No accepted job offers yet.';
      if (type === 'available') message = 'No available jobs matching your criteria, or you have applied to all.';
      return <p className="no-jobs">{message}</p>;
    }

    return jobs.map((item) => {
      // 'item' can be a job (for available) or an application (for applied/accepted)
      const job = type === 'available' ? item : item.job;
      const applicationStatus = type !== 'available' ? item.status : null;
      const appliedDate = type !== 'available' ? item.appliedAt : null;

      // Basic check if job data exists
      if (!job) {
          console.warn('[WorkerJobsView] Skipping rendering item due to missing job data:', item);
          return null; // Skip rendering if job data is missing
      }

      return (
        <div key={type === 'available' ? job._id : item._id} className="job-card">
          <h3 className="job-title">{job.title || 'Untitled Job'}</h3>
          <p className="job-detail"><strong>Description:</strong> {job.description || 'No description'}</p>
          <p className="job-detail"><strong>Category:</strong> {job.category || 'N/A'}</p>
          <p className="job-detail"><strong>Location:</strong> {job.location || 'N/A'}</p>
          <p className="job-detail"><strong>Budget:</strong> ${job.budget || '0'}</p>
          {/* Display Posted By if available */}
          {job.postedBy?.name && <p className="job-detail"><strong>Posted By:</strong> {job.postedBy.name}</p>}

          {/* Display Application Status and Date if applicable */}
          {applicationStatus && (
             <p className={`job-detail status-${applicationStatus}`}>
                <strong>Status:</strong> {applicationStatus}
             </p>
          )}
           {appliedDate && (
             <p className="job-detail">
                <strong>Applied On:</strong> {new Date(appliedDate).toLocaleDateString()}
             </p>
          )}

          {/* Show Apply button only for available jobs */}
          {type === 'available' && (
            <button className="apply-btn" onClick={() => handleApply(job._id)}>
              Apply
            </button>
          )}
        </div>
      );
    });
  };

  // --- Render Logic ---
  if (error && !loading) {
    return (
      <div className="jobs-list-container">
        <h2 className="jobs-list-title">Worker Job Portal</h2>
        <p className="message error">Failed to load data: {error}</p>
      </div>
    );
  }

  return (
    <div className="jobs-list-container">
      <h2 className="jobs-list-title">Worker Job Portal</h2>

      {/* Tab Navigation */}
      <div className="role-tabs" style={{ marginBottom: '2rem' }}>
        <button
          className={`tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available ({availableJobs.length})
        </button>
        <button
          className={`tab ${activeTab === 'applied' ? 'active' : ''}`}
          onClick={() => setActiveTab('applied')}
        >
          Applied ({appliedJobs.length})
        </button>
        <button
          className={`tab ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          Accepted ({acceptedJobs.length})
        </button>
      </div>

      {/* Message Area */}
      {message && (
        <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}

      {/* Loading Indicator */}
      {loading && <p className="loading">Loading...</p>}

      {/* Job Lists based on Active Tab */}
      {!loading && (
        <div className="jobs-list">
          {activeTab === 'available' && renderJobList(availableJobs, 'available')}
          {activeTab === 'applied' && renderJobList(appliedJobs, 'applied')}
          {activeTab === 'accepted' && renderJobList(acceptedJobs, 'accepted')}
        </div>
      )}
    </div>
  );
};

export default WorkerJobsView; // Make sure export name matches filename if needed elsewhere
