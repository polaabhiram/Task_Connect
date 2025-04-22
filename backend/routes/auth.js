const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Worker = require('../models/Worker');
const ProfessionalBody = require('../models/ProfessionalBody');
require('dotenv').config();

// Worker Registration
router.post('/register/worker', async (req, res) => {
  try {
    const { name, email, password, category, skills, experience, availability } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const worker = new Worker({
      name,
      email,
      password: hashedPassword,
      category,
      skills: skills || [],
      experience: experience || 0,
      availability
    });
    await worker.save();
    res.status(201).json({ message: 'Worker registered successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Error registering worker: ' + err.message });
  }
});

// Professional Body Registration
router.post('/register/professional-body', async (req, res) => {
  try {
    const { name, email, password, type, location, description } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const profBody = new ProfessionalBody({
      name,
      email,
      password: hashedPassword,
      type,
      location,
      description
    });
    await profBody.save();
    res.status(201).json({ message: 'Professional body registered successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Error registering professional body: ' + err.message });
  }
});

// Worker Login
router.post('/login/worker', async (req, res) => {
  try {
    const { email, password } = req.body;
    const worker = await Worker.findOne({ email });
    if (!worker || !(await bcrypt.compare(password, worker.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: worker._id, role: 'worker' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated token:', token);
    res.json({ token, message: 'Worker logged in successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in worker: ' + err.message });
  }
});

// Professional Body Login
router.post('/login/professional-body', async (req, res) => {
  try {
    const { email, password } = req.body;
    const profBody = await ProfessionalBody.findOne({ email });
    if (!profBody || !(await bcrypt.compare(password, profBody.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: profBody._id, role: 'professional-body' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, message: 'Professional body logged in successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in professional body: ' + err.message });
  }
});

module.exports = router;