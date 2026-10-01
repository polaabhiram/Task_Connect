const express = require('express');
const cors = require('cors');
const jobRoutes = require('./routes/job.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/jobs', jobRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'TaskConnect API is running'
    });
});



module.exports = app;