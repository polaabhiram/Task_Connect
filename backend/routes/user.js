const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Worker = require('../models/Worker');
const ProfessionalBody = require('../models/ProfessionalBody');

router.get('/worker/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const worker = await Worker.findById(req.user.id).select('-password');
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching worker: ' + err.message });
  }
});

router.get('/professional-body/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'professional-body') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const profBody = await ProfessionalBody.findById(req.user.id).select('-password');
    if (!profBody) {
      return res.status(404).json({ message: 'Professional body not found' });
    }
    res.json(profBody);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching professional body: ' + err.message });
  }
});

module.exports = router;