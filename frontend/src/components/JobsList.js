import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage('');
      console.log('Fetching jobs from API...');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        return;
      }
      const response = await axios.get('http://localhost:5001/api/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('API Response:', response);
      console.log('Jobs data:', response.data);

      if (!Array.isArray(response.data)) {
        throw new Error('Unexpected response format: Jobs data is not an array');
      }

      setJobs(response.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      console.error('Error details:', err.response || err.message);
      setError(err.response?.data?.message || err.message || 'Error fetching jobs');
      setMessage(err.response?.data?.message || 'Error fetching jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('No authentication token found. Please log in.');
        return;
      }
      console.log('Applying for job with ID:', jobId);
      console.log('Using token:', token);
      const response = await axios.post(
        `http://localhost:5001/api/jobs/${jobId}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Apply response:', response.data);
      setMessage(response.data.message);
    } catch (err) {
      console.error('Error applying for job:', err);
      console.error('Error details:', err.response || err.message);
      setMessage(err.response?.data?.message || 'Error applying for job');
    }
  };

  if (error && !loading) {
    return (
      <div className="jobs-list-container">
        <h2 className="jobs-list-title">Available Jobs</h2>
        <p className="message error">Failed to load jobs: {error}</p>
      </div>
    );
  }

  return (
    <div className="jobs-list-container">
      <h2 className="jobs-list-title">Available Jobs</h2>
      {message && (
        <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      {loading ? (
        <p className="loading">Loading jobs...</p>
      ) : (
        <div className="jobs-list">
          {jobs && jobs.length > 0 ? (
            jobs.map((job) => {
              try {
                return (
                  <div key={job._id} className="job-card">
                    <h3 className="job-title">{job.title || 'Untitled Job'}</h3>
                    <p className="job-detail"><strong>Description:</strong> {job.description || 'No description'}</p>
                    <p className="job-detail"><strong>Category:</strong> {job.category || 'N/A'}</p>
                    <p className="job-detail"><strong>Location:</strong> {job.location || 'N/A'}</p>
                    <p className="job-detail"><strong>Budget:</strong> ${job.budget || '0'}</p>
                    <p className="job-detail"><strong>Posted By:</strong> {job.postedBy?.name || 'Unknown'}</p>
                    <button className="apply-btn" onClick={() => handleApply(job._id)}>
                      Apply
                    </button>
                  </div>
                );
              } catch (err) {
                console.error('Error rendering job:', job, err);
                return null;
              }
            })
          ) : (
            <p className="no-jobs">No jobs available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default JobsList;