// TaskConnect/frontend/src/components/PostJob.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const PostJob = () => {
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    budget: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setJobData({ ...jobData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5001/api/jobs', jobData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(response.data.message);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error posting job');
    }
  };

  return (
    <div className="post-job-container">
      <div className="post-job-card">
        <h2 className="post-job-title">Post a New Job</h2>
        <form onSubmit={handleSubmit} className="post-job-form">
          <div className="input-group">
            <span className="input-icon">📝</span>
            <input
              type="text"
              name="title"
              value={jobData.title}
              onChange={handleChange}
              placeholder="Job Title"
              required
            />
          </div>
          <div className="input-group">
            <span className="input-icon">📋</span>
            <textarea
              name="description"
              value={jobData.description}
              onChange={handleChange}
              placeholder="Job Description"
              required
            />
          </div>
          <div className="input-group">
            <span className="input-icon">🛠️</span>
            <input
              type="text"
              name="category"
              value={jobData.category}
              onChange={handleChange}
              placeholder="Category (e.g., Plumbing, Electrical)"
              required
            />
          </div>
          <div className="input-group">
            <span className="input-icon">📍</span>
            <input
              type="text"
              name="location"
              value={jobData.location}
              onChange={handleChange}
              placeholder="Location"
              required
            />
          </div>
          <div className="input-group">
            <span className="input-icon">💰</span>
            <input
              type="number"
              name="budget"
              value={jobData.budget}
              onChange={handleChange}
              placeholder="Budget"
              required
            />
          </div>
          <button type="submit" className="post-job-btn">Post Job</button>
        </form>
        {message && (
          <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default PostJob;