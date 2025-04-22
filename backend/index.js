const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('Error: MONGO_URI is not defined in .env file');
  process.exit(1);
}

mongoose.connect(uri)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

const Worker = require('./models/Worker');
const ProfessionalBody = require('./models/ProfessionalBody');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.send('Hello, TaskConnect!');
});

app.get('/test-models', async (req, res) => {
  console.log('Test-models route accessed');
  try {
    const workerCount = await Worker.countDocuments();
    const profBodyCount = await ProfessionalBody.countDocuments();
    res.json({
      message: 'Models are working',
      workers: workerCount,
      professionalBodies: profBodyCount
    });
  } catch (err) {
    res.status(500).send('Error testing models: ' + err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});