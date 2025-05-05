import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReportPage = () => {
  const [report, setReport] = useState('');
  const [message, setMessage] = useState('');
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);
    if (!token) {
      setMessage('No token found. Please log in.');
    } else {
      fetchReport(token);
    }

    const storedCount = localStorage.getItem('pageVisitCount');
    const count = storedCount ? parseInt(storedCount, 10) + 1 : 1;
    setVisitCount(count);
    localStorage.setItem('pageVisitCount', count);
    console.log(`Page visited ${count} time(s)`);
  }, []);

  const fetchReport = async (token) => {
    try {
      setMessage('Generating report...');
      const response = await axios.get('http://localhost:5001/api/jobs/report', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Report response:', response.data);
      setReport(response.data.report);
      setMessage('Report generated successfully');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error('Report Error:', err.response ? JSON.stringify(err.response.data, null, 2) : err.message, err.stack);
      setMessage('Error generating report. Check console.');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="report-page">
      <h1>Website Report</h1>
      <p className="visit-count">Visited {visitCount} time(s)</p>
      {message && (
        <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      {report && (
        <div className="report-container">
          <div dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br/>') }} />
        </div>
      )}
    </div>
  );
};

export default ReportPage;