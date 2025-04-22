const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Application = require('../models/Application');
const Job = require('../models/Job');

router.post('/apply/:jobId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const existingApplication = await Application.findOne({
      job: req.params.jobId,
      worker: req.user.id
    });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }
    const application = new Application({
      job: req.params.jobId,
      worker: req.user.id
    });
    await application.save();
    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (err) {
    res.status(500).json({ message: 'Error applying to job: ' + err.message });
  }
});

router.get('/my-jobs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'professional-body') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const jobs = await Job.find({ professionalBody: req.user.id });
    const jobIds = jobs.map(job => job._id);
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('job', 'title')
      .populate('worker', 'name email');
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching applications: ' + err.message });
  }
});

router.put('/status/:applicationId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'professional-body') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    const job = await Job.findById(application.job);
    if (job.professionalBody.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }
    application.status = status;
    await application.save();
    res.json({ message: `Application ${status}`, application });
  } catch (err) {
    res.status(500).json({ message: 'Error updating application: ' + err.message });
  }
});

module.exports = router;