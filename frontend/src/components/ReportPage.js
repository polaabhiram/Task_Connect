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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">Website Report</h1>
      <p className="text-center mb-4">Visited {visitCount} time(s)</p>
      {message && (
        <p className={`text-center mb-4 ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
      {report && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
          <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br/>') }} />
        </div>
      )}
    </div>
  );
};

export default ReportPage;