const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ... (other routes remain the same) ...

// GET /applications - Fetch applications based on user role
router.get('/applications', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching applications for user:', req.user);
    let applications = []; // Initialize as an empty array

    if (req.user.role === 'professional-body') {
      console.log('Fetching applications for Professional Body:', req.user.id);
      // Find jobs posted by this professional body
      const jobs = await Job.find({ postedBy: req.user.id })
        .populate({ // Populate worker details for each application
          path: 'applications.worker',
          select: 'name email category skills experience availability' // Select desired worker fields
        })
        .populate('postedBy', 'name'); // Populate professional body name for context if needed

      // Flatten the applications from all jobs into a single array
      applications = jobs.flatMap(job =>
        job.applications.map(app => ({
          _id: app._id,
          job: { // Include necessary job details
            _id: job._id,
            title: job.title,
            category: job.category,
            location: job.location,
            budget: job.budget
          },
          worker: app.worker ? { // Ensure worker details are included
            _id: app.worker._id,
            name: app.worker.name || 'Unknown',
            email: app.worker.email || 'Not provided',
            category: app.worker.category || 'N/A',
            skills: app.worker.skills || [],
            experience: app.worker.experience || 0,
            availability: app.worker.availability || 'N/A'
          } : null, // Handle case where worker might not populate correctly
          appliedAt: app.appliedAt,
          status: app.status
        }))
      );
      console.log(`Found ${applications.length} applications for Professional Body.`);

    } else if (req.user.role === 'worker') {
      console.log('Fetching applications for Worker:', req.user.id);
      // Find jobs where this worker has applied
      const jobs = await Job.find({ 'applications.worker': req.user.id })
        .populate('postedBy', 'name') // Populate professional body name
        .populate({ // Populate worker details for the specific application
          path: 'applications.worker',
          select: 'name email category skills experience availability'
        });

      // Filter and map applications specific to this worker
      applications = jobs.flatMap(job =>
        job.applications
          .filter(app => app.worker && app.worker._id.toString() === req.user.id) // Ensure worker exists and matches
          .map(app => ({
            _id: app._id,
            job: { // Include necessary job details
              _id: job._id,
              title: job.title,
              description: job.description,
              category: job.category,
              location: job.location,
              budget: job.budget,
              postedBy: job.postedBy ? job.postedBy.name : 'Unknown' // Include who posted the job
            },
            worker: app.worker ? { // Ensure worker details are included
              _id: app.worker._id,
              name: app.worker.name || 'Unknown',
              email: app.worker.email || 'Not provided',
              category: app.worker.category || 'N/A',
              skills: app.worker.skills || [],
              experience: app.worker.experience || 0,
              availability: app.worker.availability || 'N/A'
            } : null,
            appliedAt: app.appliedAt,
            status: app.status
          }))
      );
      console.log(`Found ${applications.length} applications for Worker.`);

    } else {
      console.log('Access denied: Invalid role');
      return res.status(403).json({ message: 'Access denied: Invalid role' });
    }

    // Send the flat array of applications
    res.json(applications);

  } catch (err) {
    console.error('Error fetching applications:', err.message, err.stack);
    res.status(500).json({ message: 'Error fetching applications', error: err.message });
  }
});


// ... (other routes like /report, POST /, POST /:id/apply, etc. remain the same) ...
// Make sure to include the accept/reject routes as well
router.post('/applications/:applicationId/accept', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'professional-body') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { applicationId } = req.params;
    // Find the job containing the application
    const job = await Job.findOne({ 'applications._id': applicationId });
    if (!job) {
      return res.status(404).json({ message: 'Application or Job not found' });
    }
    // Ensure the logged-in user posted this job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this application' });
    }
    // Find the specific subdocument
    const application = job.applications.id(applicationId);
    if (!application) {
       // This case should ideally not happen if the findOne worked, but good practice
      return res.status(404).json({ message: 'Application subdocument not found' });
    }
    application.status = 'accepted';
    await job.save();
    res.json({ message: 'Application accepted successfully' });
  } catch (err) {
    console.error('Error accepting application:', err);
    res.status(500).json({ message: 'Error accepting application' });
  }
});

router.post('/applications/:applicationId/reject', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'professional-body') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { applicationId } = req.params;
     // Find the job containing the application
    const job = await Job.findOne({ 'applications._id': applicationId });
     if (!job) {
      return res.status(404).json({ message: 'Application or Job not found' });
    }
     // Ensure the logged-in user posted this job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this application' });
    }
     // Find the specific subdocument
    const application = job.applications.id(applicationId);
     if (!application) {
      // This case should ideally not happen if the findOne worked, but good practice
      return res.status(404).json({ message: 'Application subdocument not found' });
    }
    application.status = 'rejected';
    await job.save();
    res.json({ message: 'Application rejected successfully' });
  } catch (err) {
    console.error('Error rejecting application:', err);
    res.status(500).json({ message: 'Error rejecting application' });
  }
});


module.exports = router;
