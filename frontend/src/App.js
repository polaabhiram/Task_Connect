import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PostJob from './components/PostJob';
// Import the renamed component
import WorkerJobsView from './components/WorkerJobsView'; // <-- RENAMED IMPORT
import Applications from './components/Applications';
import ReportPage from './components/ReportPage';

// Import base styles - adjust path if necessary
import './index.css';
// You might have specific App styles too
// import './App.css';

function App() {
  // State to track authentication status and user role
  const [authState, setAuthState] = useState({
    isAuthenticated: !!localStorage.getItem('token'),
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role') // Get role directly
  });
  const [showRegister, setShowRegister] = useState(false); // State for toggling Login/Register view
  const navigate = useNavigate();
  const location = useLocation();

  // Effect to update auth state if localStorage changes (e.g., login/logout in another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      console.log('Storage changed! Token:', token, 'Role:', role); // Debug log
      setAuthState({
        isAuthenticated: !!token,
        token,
        role
      });
    };

    // Add listener
    window.addEventListener('storage', handleStorageChange);
    // Initial check in case state is stale on load
    handleStorageChange();

    // Cleanup listener on unmount
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Handle user logout
  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setAuthState({ isAuthenticated: false, token: null, role: null }); // Update state
    setShowRegister(false); // Reset to login view
    navigate('/login'); // Redirect to login page
  };

  // Toggle between Login and Register forms on the login page
  const toggleRegister = () => {
    setShowRegister(!showRegister);
    // Navigate to login page if toggling register from another page
    if (location.pathname !== '/login') {
      navigate('/login');
    }
  };

  // Determine navigation links based on authentication state and role
  const renderNavLinks = () => {
    if (!authState.isAuthenticated) {
      // User is not logged in
      return showRegister ? (
        <button className="nav-link" onClick={toggleRegister}>
          Already have an account? Login
        </button>
      ) : (
        <button className="nav-link" onClick={toggleRegister}>
          Need an account? Register
        </button>
      );
    } else {
      // User is logged in
      return (
        <>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          {/* Conditional links based on role */}
          {authState.role === 'professional-body' ? (
            <>
              <Link to="/post-job" className="nav-link">Post Job</Link>
              <Link to="/applications" className="nav-link">View Applications</Link>
            </>
          ) : authState.role === 'worker' ? (
            <>
              {/* Use the renamed component route */}
              <Link to="/jobs" className="nav-link">View Jobs</Link>
              <Link to="/report" className="nav-link">Generate Report</Link>
            </>
          ) : null /* Handle potential other roles or null role */}
          {/* Logout button always shown when authenticated */}
          <button onClick={handleLogout} className="nav-link logout-btn-nav">Logout</button>
        </>
      );
    }
  };


  return (
    <div className="app-container">
      <header className="header-container">
        <h1>TaskConnect</h1>
        <nav className="navbar">
          {renderNavLinks()}
        </nav>
      </header>
      <main className="main-content"> {/* Added a main wrapper */}
        <Routes>
          <Route
            path="/login"
            element={<Login showRegister={showRegister} toggleRegister={toggleRegister} />}
          />
          {/* Protected Routes - Render only if authenticated */}
          {authState.isAuthenticated && (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Routes specific to professional-body */}
              {authState.role === 'professional-body' && (
                <>
                  <Route path="/post-job" element={<PostJob />} />
                  <Route path="/applications" element={<Applications />} />
                </>
              )}
              {/* Routes specific to worker */}
              {authState.role === 'worker' && (
                <>
                  {/* Use the renamed component */}
                  <Route path="/jobs" element={<WorkerJobsView />} />
                  <Route path="/report" element={<ReportPage />} />
                </>
              )}
            </>
          )}
          {/* Default route - shows welcome message or redirects */}
          <Route
            path="/"
            element={
              authState.isAuthenticated ? (
                <h2 className="welcome-text">Welcome back to TaskConnect!</h2>
              ) : (
                <h2 className="welcome-text">Welcome to TaskConnect! Please login or register.</h2>
              )
            }
          />
          {/* Optional: Add a catch-all or Not Found route */}
          {/* <Route path="*" element={<NotFoundComponent />} /> */}
        </Routes>
      </main>
    </div>
  );
}

// Wrap App with Router
export default function AppWrapper() {
  return <Router><App /></Router>;
}
