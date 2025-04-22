import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PostJob from './components/PostJob';
import JobsList from './components/JobsList';
import Applications from './components/Applications';
import ReportPage from './components/ReportPage'; // Added new component

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: !!localStorage.getItem('token'),
    token: localStorage.getItem('token'),
    role: localStorage.getItem('token') ? JSON.parse(atob(localStorage.getItem('token').split('.')[1])).role : null
  });
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      setAuthState({
        isAuthenticated: !!token,
        token,
        role: token ? JSON.parse(atob(token.split('.')[1])).role : null
      });
    };
    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthState({ isAuthenticated: false, token: null, role: null });
    setShowRegister(false);
    navigate('/login');
  };

  const toggleRegister = () => {
    setShowRegister(!showRegister);
    if (location.pathname !== '/login') {
      navigate('/login');
    }
  };

  return (
    <div className="app-container">
      <div className="header-container">
        <h1>TaskConnect</h1>
        <nav className="navbar">
          {!authState.isAuthenticated ? (
            showRegister ? (
              <button className="nav-link" onClick={toggleRegister}>
                Login
              </button>
            ) : (
              <button className="nav-link" onClick={toggleRegister}>
                Register
              </button>
            )
          ) : (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              {authState.role === 'professional-body' ? (
                <>
                  <Link to="/post-job" className="nav-link">Post Job</Link>
                  <Link to="/applications" className="nav-link">View Applications</Link>
                </>
              ) : (
                <>
                  <Link to="/jobs" className="nav-link">View Jobs</Link>
                  <Link to="/report" className="nav-link">Generate Report</Link> {/* Added report link */}
                </>
              )}
              <Link to="/login" onClick={handleLogout} className="nav-link">Logout</Link>
            </>
          )}
        </nav>
      </div>
      <Routes>
        <Route
          path="/login"
          element={<Login showRegister={showRegister} toggleRegister={toggleRegister} />}
        />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/jobs" element={<JobsList />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/report" element={<ReportPage />} /> {/* Added report route */}
        <Route path="/" element={<h2 className="welcome-text">Welcome to TaskConnect!</h2>} />
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  return <Router><App /></Router>;
}