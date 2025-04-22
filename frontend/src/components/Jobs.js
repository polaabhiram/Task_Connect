import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';

const Jobs = () => {
  const [availableJobs, setAvailableJobs] = useState({});
  const [appliedJobs, setAppliedJobs] = useState({});
  const [message, setMessage] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage('No authentication token found. Please log in.');
          setLoading(false);
          return;
        }

        const availableResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/jobs/available`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Available Jobs:', availableResponse.data);
        setAvailableJobs(availableResponse.data);

        const appliedResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Applied Jobs:', appliedResponse.data);
        setAppliedJobs(appliedResponse.data);
      } catch (err) {
        console.error('Fetch Error:', err.response ? err.response.data : err.message);
        setMessage(err.response?.data?.message || 'Error fetching jobs. Check console.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleApply = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Sending apply request for jobId:', jobId);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/jobs/${jobId}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Apply Response:', response.data);
      setMessage(response.data.message);

      setAvailableJobs(response.data.availableJobs || {});
      setAppliedJobs(response.data.applications || {});

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Apply Error:', err.response ? err.response.data : err.message);
      setMessage(err.response?.data?.message || 'Error applying. Check console.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const generateReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/jobs/report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Report Response:', response.data);
      setReport(response.data.report);
      setMessage('Report generated successfully');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error('Report Error:', err.response ? err.response.data : err.message);
      setMessage('Error generating report. Check console.');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const isApplied = (jobId) => {
    for (let category in appliedJobs) {
      if (appliedJobs[category].some(app => app.job._id === jobId)) return true;
    }
    return false;
  };

  return (
    <div className="jobs-list-container">
      <h2 className="jobs-list-title">View Jobs</h2>
      {message && <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}
      {loading ? (
        <p className="no-jobs">Loading...</p>
      ) : (
        <>
          <h3>Available Jobs</h3>
          <div className="jobs-list">
            {Object.keys(availableJobs).length > 0 ? (
              Object.keys(availableJobs).map(category => (
                <div key={category} className="subcategory">
                  <h4>{category}</h4>
                  {availableJobs[category].map((job) => (
                    <div key={job._id} className="job-card">
                      <h3 className="job-title">{job.title}</h3>
                      <p className="job-detail">Description: {job.description}</p>
                      <p className="job-detail">Category: {job.category}</p>
                      <p className="job-detail">Location: {job.location}</p>
                      <p className="job-detail">Budget: ${job.budget}</p>
                      <button
                        className="apply-btn"
                        onClick={() => handleApply(job._id)}
                        disabled={isApplied(job._id)}
                      >
                        {isApplied(job._id) ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <p className="no-jobs">No available jobs.</p>
            )}
          </div>

          <h3>Applied Jobs</h3>
          <div className="jobs-list">
            {Object.keys(appliedJobs).length > 0 ? (
              Object.keys(appliedJobs).map(category => (
                <div key={category} className="subcategory">
                  <h4>{category}</h4>
                  {appliedJobs[category].map((application) => (
                    <div key={application._id} className="job-card">
                      <h3 className="job-title">{application.job.title}</h3>
                      <p className="job-detail">Description: {application.job.description}</p>
                      <p className="job-detail">Status: {application.status}</p>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <p className="no-jobs">No applied jobs yet.</p>
            )}
          </div>

          <h3>Generate Report</h3>
          <button className="generate-report-btn" onClick={generateReport}>
            Generate Website Report
          </button>
          {report && (
            <div className="report-container">
              <h4>Website Job Report</h4>
              <pre className="report-text">{report}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Jobs;