const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Worker = require('../models/Worker');
const ProfessionalBody = require('../models/ProfessionalBody');

// Get Worker Details
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
    console.error('Error fetching worker:', err); // Debug log
    res.status(500).json({ message: 'Error fetching worker: ' + err.message });
  }
});

// Get Professional Body Details
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
    console.error('Error fetching professional body:', err); // Debug log
    res.status(500).json({ message: 'Error fetching professional body: ' + err.message });
  }
});

// Update Worker Details
router.put('/worker/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    const allowedUpdates = ['name', 'email', 'category', 'skills', 'experience', 'availability'];
    const updateKeys = Object.keys(updates);
    const isValidUpdate = updateKeys.every((key) => allowedUpdates.includes(key));

    if (!isValidUpdate) {
      const invalidFields = updateKeys.filter((key) => !allowedUpdates.includes(key));
      return res.status(400).json({ 
        message: 'Invalid updates', 
        details: `Only ${allowedUpdates.join(', ')} can be updated. Found invalid fields: ${invalidFields.join(', ')}`
      });
    }

    // Convert experience to number if provided
    if (updates.experience) {
      updates.experience = Number(updates.experience);
      if (isNaN(updates.experience)) {
        return res.status(400).json({ message: 'Experience must be a number' });
      }
    }

    // Ensure skills is an array
    if (updates.skills && !Array.isArray(updates.skills)) {
      return res.status(400).json({ message: 'Skills must be an array' });
    }

    const worker = await Worker.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json(worker);
  } catch (err) {
    console.error('Error updating worker:', err); // Debug log
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: 'Validation failed', details: errors });
    }
    res.status(500).json({ message: 'Error updating worker: ' + err.message });
  }
});

// Update Professional Body Details
router.put('/professional-body/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'professional-body') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = req.body;
    const allowedUpdates = ['name', 'email', 'type', 'location', 'description'];
    const updateKeys = Object.keys(updates);
    const isValidUpdate = updateKeys.every((key) => allowedUpdates.includes(key));

    if (!isValidUpdate) {
      const invalidFields = updateKeys.filter((key) => !allowedUpdates.includes(key));
      return res.status(400).json({ 
        message: 'Invalid updates', 
        details: `Only ${allowedUpdates.join(', ')} can be updated. Found invalid fields: ${invalidFields.join(', ')}`
      });
    }

    const profBody = await ProfessionalBody.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!profBody) {
      return res.status(404).json({ message: 'Professional body not found' });
    }

    res.json(profBody);
  } catch (err) {
    console.error('Error updating professional body:', err); // Debug log
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: 'Validation failed', details: errors });
    }
    res.status(500).json({ message: 'Error updating professional body: ' + err.message });
  }
});

module.exports = router;