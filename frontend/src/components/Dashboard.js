import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const endpoint = decoded.role === 'worker' ? '/worker/me' : '/professional-body/me';
        const response = await axios.get(`http://localhost:5001/api/user${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching user data');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!userData) return <p>Loading...</p>;

  return (
    <div>
      <h2>Dashboard</h2>
      {error && <p>{error}</p>}
      {userData && (
        <div>
          <h3>Welcome, {userData.name}!</h3>
          <p>Email: {userData.email}</p>
          {userData.role === 'worker' ? (
            <>
              <p>Category: {userData.category}</p>
              <p>Skills: {userData.skills.join(', ')}</p>
              <p>Experience: {userData.experience} years</p>
              <p>Availability: {userData.availability}</p>
            </>
          ) : (
            <>
              <p>Type: {userData.type}</p>
              <p>Location: {userData.location}</p>
              <p>Description: {userData.description}</p>
            </>
          )}
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;