import React, { useState } from 'react';
import axios from 'axios';

const ProfessionalBodyRegister = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', type: '', location: '', description: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/auth/register/professional-body', formData);
      setMessage(response.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error registering professional body');
    }
  };

  return (
    <div>
      <h2>Register as Professional Body</h2>
      <form onSubmit={handleSubmit}>
        <div><input type="text" name="name" placeholder="Name" onChange={handleChange} required /></div>
        <div><input type="email" name="email" placeholder="Email" onChange={handleChange} required /></div>
        <div><input type="password" name="password" placeholder="Password" onChange={handleChange} required /></div>
        <div><input type="text" name="type" placeholder="Type" onChange={handleChange} required /></div>
        <div><input type="text" name="location" placeholder="Location" onChange={handleChange} required /></div>
        <div><textarea name="description" placeholder="Description" onChange={handleChange} required></textarea></div>
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ProfessionalBodyRegister;