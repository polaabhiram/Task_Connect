// TaskConnect/frontend/src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('worker');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', {
        email,
        password,
        role,
      });
      localStorage.setItem('token', response.data.token);
      navigate('/jobs');
    } catch (err) {
      setMessage('Registration failed');
    }
  };

  return (
    <div className="login-container"> {/* Using login-container for consistency with index.css */}
      <h2 className="login-title">Register</h2>
      {message && <p className="message">{message}</p>}
      <div className="role-tabs">
        <button className={`tab ${role === 'worker' ? 'active' : ''}`} onClick={() => setRole('worker')}>
          Worker
        </button>
        <button className={`tab ${role === 'professional-body' ? 'active' : ''}`} onClick={() => setRole('professional-body')}>
          Professional Body
        </button>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <span className="input-icon">✉️</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        </div>
        <div className="input-group">
          <span className="input-icon">🔒</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input-group">
          <option value="worker">Worker</option>
          <option value="professional-body">Professional Body</option>
        </select>
        <button type="submit" className="login-btn">Register</button>
      </form>
    </div>
  );
};

export default Register;