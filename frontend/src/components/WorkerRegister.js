import React, { useState } from 'react';
import axios from 'axios';

const WorkerRegister = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', category: '', skills: '', experience: '', availability: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/auth/register/worker', {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim())
      });
      setMessage(response.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error registering worker');
    }
  };

  return (
    <div>
      <h2>Register as Worker</h2>
      <form onSubmit={handleSubmit}>
        <div><input type="text" name="name" placeholder="Name" onChange={handleChange} required /></div>
        <div><input type="email" name="email" placeholder="Email" onChange={handleChange} required /></div>
        <div><input type="password" name="password" placeholder="Password" onChange={handleChange} required /></div>
        <div><input type="text" name="category" placeholder="Category" onChange={handleChange} required /></div>
        <div><input type="text" name="skills" placeholder="Skills (comma-separated)" onChange={handleChange} /></div>
        <div><input type="number" name="experience" placeholder="Experience (years)" onChange={handleChange} /></div>
        <div><input type="text" name="availability" placeholder="Availability" onChange={handleChange} required /></div>
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default WorkerRegister;