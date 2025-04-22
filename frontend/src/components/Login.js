// TaskConnect/frontend/src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const Login = ({ showRegister, toggleRegister }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '', role: 'worker' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'worker',
    type: '', // For Professional Body
    location: '', // For Professional Body
    description: '', // For Professional Body
    category: '', // For Worker
    availability: '' // For Worker
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const endpoint = loginData.role === 'worker' ? 'worker' : 'professional-body';
    try {
      const response = await axios.post(`http://localhost:5001/api/auth/login/${endpoint}`, {
        email: loginData.email,
        password: loginData.password
      });
      localStorage.setItem('token', response.data.token);
      console.log('Stored token:', localStorage.getItem('token'));
      window.dispatchEvent(new Event('storage'));
      setMessage(response.data.message);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err.response ? err.response.data : err.message);
      setMessage(err.response?.data?.message || 'Error logging in');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const endpoint = registerData.role === 'worker' ? 'worker' : 'professional-body';
    try {
      const payload = {
        email: registerData.email,
        password: registerData.password
      };

      if (registerData.role === 'worker') {
        payload.name = registerData.name;
        payload.category = registerData.category;
        payload.availability = registerData.availability;
      } else {
        payload.name = registerData.name;
        payload.type = registerData.type;
        payload.location = registerData.location;
        payload.description = registerData.description;
      }

      const response = await axios.post(`http://localhost:5001/api/auth/register/${endpoint}`, payload);
      setMessage(response.data.message);
      toggleRegister(); // Switch back to login mode after successful registration
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error registering');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">
          {showRegister ? 'Register to TaskConnect' : 'Login to TaskConnect'}
        </h2>
        <div className="role-tabs">
          <button
            type="button"
            className={`tab ${registerData.role === 'worker' ? 'active' : ''}`}
            onClick={() => {
              setLoginData({ ...loginData, role: 'worker' });
              setRegisterData({ ...registerData, role: 'worker' });
            }}
          >
            Worker
          </button>
          <button
            type="button"
            className={`tab ${registerData.role === 'professional-body' ? 'active' : ''}`}
            onClick={() => {
              setLoginData({ ...loginData, role: 'professional-body' });
              setRegisterData({ ...registerData, role: 'professional-body' });
            }}
          >
            Professional Body
          </button>
        </div>
        {showRegister ? (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="name"
                value={registerData.name}
                onChange={handleRegisterChange}
                placeholder="Name"
                required
              />
            </div>
            <div className="input-group">
              <span className="input-icon">📧</span>
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="Email"
                required
              />
            </div>
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                placeholder="Password"
                required
              />
            </div>
            {registerData.role === 'worker' ? (
              <>
                <div className="input-group">
                  <span className="input-icon">🛠️</span>
                  <input
                    type="text"
                    name="category"
                    value={registerData.category}
                    onChange={handleRegisterChange}
                    placeholder="Category (e.g., Plumber, Electrician)"
                    required
                  />
                </div>
                <div className="input-group">
                  <span className="input-icon">⏰</span>
                  <input
                    type="text"
                    name="availability"
                    value={registerData.availability}
                    onChange={handleRegisterChange}
                    placeholder="Availability (e.g., Full-time, Part-time)"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="input-group">
                  <span className="input-icon">🏢</span>
                  <input
                    type="text"
                    name="type"
                    value={registerData.type}
                    onChange={handleRegisterChange}
                    placeholder="Type (e.g., Company, Organization)"
                    required
                  />
                </div>
                <div className="input-group">
                  <span className="input-icon">📍</span>
                  <input
                    type="text"
                    name="location"
                    value={registerData.location}
                    onChange={handleRegisterChange}
                    placeholder="Location"
                    required
                  />
                </div>
                <div className="input-group">
                  <span className="input-icon">📝</span>
                  <textarea
                    name="description"
                    value={registerData.description}
                    onChange={handleRegisterChange}
                    placeholder="Description"
                    required
                    style={{ width: '100%', padding: '10px 10px 10px 40px', fontSize: '1rem', background: '#3A3F3F', border: 'none', borderRadius: '5px', color: '#ffffff', minHeight: '80px' }}
                  />
                </div>
              </>
            )}
            <button type="submit" className="login-btn">
              Register as {registerData.role === 'worker' ? 'Worker' : 'Professional Body'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="input-group">
              <span className="input-icon">📧</span>
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="Email"
                required
              />
            </div>
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Password"
                required
              />
            </div>
            <button type="submit" className="login-btn">
              Login as {loginData.role === 'worker' ? 'Worker' : 'Professional Body'}
            </button>
          </form>
        )}
        {message && (
          <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;