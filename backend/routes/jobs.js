const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose'); // Ensure mongoose is required

// GET / - Fetch all jobs
router.get('/', async (req, res) => {
  try {
    console.log('[GET /] Fetching all jobs');
    const jobs = await Job.find().populate('postedBy', 'name');
    // Sanitize postedBy to prevent potential issues if population fails
    const sanitizedJobs = jobs.map(job => ({
      ...job.toObject(), // Convert Mongoose doc to plain object
      // Ensure postedBy exists and has a name, otherwise provide a default
      postedBy: job.postedBy ? { name: job.postedBy.name || 'Unknown' } : { name: 'Unknown' }
    }));
    console.log(`[GET /] Found ${sanitizedJobs.length} jobs.`);
    res.json(sanitizedJobs);
  } catch (err) {
    console.error('[GET /] Error fetching jobs:', err.message, err.stack);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});


// GET /available - Fetch jobs available for a worker
router.get('/available', authMiddleware, async (req, res) => {
  try {
    console.log('[GET /available] Fetching available jobs for user:', req.user);
    // Ensure the user is a worker
    if (req.user.role !== 'worker') {
      console.log('[GET /available] Access denied: User role is not worker.');
      return res.status(403).json({ message: 'Access denied: Only workers can view available jobs.' });
    }

    // Find IDs of jobs the worker has already applied to
    const appliedJobs = await Job.find({ 'applications.worker': req.user.id }, '_id'); // Only fetch IDs
    const appliedJobIds = appliedJobs.map(j => j._id);
    console.log('[GET /available] Worker has applied to job IDs:', appliedJobIds);

    // Find jobs that are NOT posted by the current worker AND the worker hasn't applied to
    const availableJobs = await Job.find({
        _id: { $nin: appliedJobIds },
        // postedBy: { $ne: req.user.id } // Removed this line - workers might apply to their own postings? Re-add if needed.
      })
      .populate('postedBy', 'name') // Populate the name of the professional body who posted
      .lean(); // Use lean for performance if not modifying docs

    console.log(`[GET /available] Found ${availableJobs.length} available jobs.`);

    // Categorize jobs by category (optional, based on frontend needs)
    const categorizedJobs = availableJobs.reduce((acc, job) => {
      const category = job.category || 'Uncategorized'; // Handle missing category
      (acc[category] = acc[category] || []).push(job);
      return acc;
    }, {});

    res.json(categorizedJobs); // Send categorized or flat array based on frontend expectation

  } catch (err) {
    console.error('[GET /available] Error fetching available jobs:', err.message, err.stack);
    res.status(500).json({ message: 'Error fetching available jobs', error: err.message });
  }
});


// GET /applications - Fetch applications based on user role
router.get('/applications', authMiddleware, async (req, res) => {
  try {
    console.log('[GET /applications] Fetching applications for user:', req.user);
    let applications = []; // Initialize as an empty array

    if (req.user.role === 'professional-body') {
      console.log('[GET /applications] Fetching applications for Professional Body ID:', req.user.id);
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
          // Safely access worker details, providing defaults if population failed or data is missing
          worker: app.worker ? {
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
      console.log(`[GET /applications] Found ${applications.length} applications for Professional Body.`);

    } else if (req.user.role === 'worker') {
      console.log('[GET /applications] Fetching applications for Worker ID:', req.user.id);
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
             // Safely access worker details
            worker: app.worker ? {
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
      console.log(`[GET /applications] Found ${applications.length} applications for Worker.`);

    } else {
      console.log('[GET /applications] Access denied: Invalid role');
      return res.status(403).json({ message: 'Access denied: Invalid role' });
    }

    // Send the flat array of applications
    console.log('[GET /applications] Sending response data:', applications);
    res.json(applications);

  } catch (err) {
    console.error('[GET /applications] Error fetching applications:', err.message, err.stack);
    res.status(500).json({ message: 'Error fetching applications', error: err.message });
  }
});

// GET /report - Generate website-wide report using Gemini API
router.get('/report', authMiddleware, async (req, res) => {
  try {
    if (!process.env.GENAI_API_KEY) {
        console.error('[GET /report] GENAI_API_KEY is not set in environment variables.');
        return res.status(500).json({ message: 'Report generation service is not configured.' });
    }
    const genAI = new GoogleGenerativeAI(process.env.GENAI_API_KEY);
    console.log('[GET /report] GenAI instance created. Generating report...');

    const jobs = await Job.find().populate('postedBy', 'name').lean();
    const allApplications = jobs.flatMap(job =>
        job.applications.map(app => ({
            jobTitle: job.title,
            jobCategory: job.category,
            status: app.status,
            appliedAt: app.appliedAt
        }))
    );

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const weeklyJobs = jobs.filter(j => j.createdAt >= oneWeekAgo);
    const monthlyJobs = jobs.filter(j => j.createdAt >= oneMonthAgo);
    const annualJobs = jobs.filter(j => j.createdAt >= oneYearAgo);

    const weeklyApps = allApplications.filter(a => a.appliedAt >= oneWeekAgo);
    const monthlyApps = allApplications.filter(a => a.appliedAt >= oneMonthAgo);
    const annualApps = allApplications.filter(a => a.appliedAt >= oneYearAgo);

    const getStatusCounts = (apps) => ({
        pending: apps.filter(a => a.status === 'pending').length,
        accepted: apps.filter(a => a.status === 'accepted').length,
        rejected: apps.filter(a => a.status === 'rejected').length,
    });

    const weeklyAppStatus = getStatusCounts(weeklyApps);
    const monthlyAppStatus = getStatusCounts(monthlyApps);
    const annualAppStatus = getStatusCounts(annualApps);
    const totalAppStatus = getStatusCounts(allApplications);

    const prompt = `
      Generate a professional summary report for the TaskConnect platform based on the following data.
      Format the report clearly with headings and bullet points. Use Markdown for formatting.

      **Overall Summary:**
      - Total Jobs Posted: ${jobs.length}
      - Total Applications Received: ${allApplications.length}
      - Overall Application Status: Pending: ${totalAppStatus.pending}, Accepted: ${totalAppStatus.accepted}, Rejected: ${totalAppStatus.rejected}

      **Activity in the Last 7 Days:**
      - New Jobs Posted: ${weeklyJobs.length}
      - New Applications Received: ${weeklyApps.length}
      - Application Status Breakdown (Weekly): Pending: ${weeklyAppStatus.pending}, Accepted: ${weeklyAppStatus.accepted}, Rejected: ${weeklyAppStatus.rejected}

      **Activity in the Last 30 Days:**
      - New Jobs Posted: ${monthlyJobs.length}
      - New Applications Received: ${monthlyApps.length}
      - Application Status Breakdown (Monthly): Pending: ${monthlyAppStatus.pending}, Accepted: ${monthlyAppStatus.accepted}, Rejected: ${monthlyAppStatus.rejected}

      **Activity in the Last 365 Days:**
      - New Jobs Posted: ${annualJobs.length}
      - New Applications Received: ${annualApps.length}
      - Application Status Breakdown (Annual): Pending: ${annualAppStatus.pending}, Accepted: ${annualAppStatus.accepted}, Rejected: ${annualAppStatus.rejected}

      Please provide a concise analysis or interpretation of these trends if possible.
      Report generated on: ${now.toLocaleString()}
    `;

    console.log('[GET /report] Sending prompt to Gemini...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    console.log('[GET /report] Received response from Gemini.');

    let reportText = '';
    if (result && result.response && typeof result.response.text === 'function') {
        reportText = result.response.text();
    } else {
        console.error('[GET /report] Unexpected response structure from Gemini:', result);
        throw new Error('Failed to get text from Gemini response.');
    }

    console.log('[GET /report] Generated report text.');
    res.json({ report: reportText });

  } catch (err) {
    console.error('[GET /report] Error generating report:', err.message, err.stack);
    res.status(500).json({ message: 'Error generating report. Please check server logs.', error: err.message });
  }
});


// POST / - Post a new job
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('[POST /] Received request to post job. User:', req.user);
    if (req.user.role !== 'professional-body') {
      console.log('[POST /] Access denied: Incorrect role.');
      return res.status(403).json({ message: 'Access denied: Only professional bodies can post jobs.' });
    }
    const job = new Job({
      ...req.body,
      postedBy: req.user.id,
      createdAt: new Date()
    });
    await job.save();
    console.log('[POST /] Job posted successfully:', job._id);
    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (err) {
    console.error('[POST /] Error posting job:', err.message, err.stack);
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message).join(', ');
        return res.status(400).json({ message: 'Validation failed', details: errors });
    }
    res.status(500).json({ message: 'Error posting job' });
  }
});


// POST /:id/apply - Apply for a job
router.post('/:id/apply', authMiddleware, async (req, res) => {
  const jobId = req.params.id;
  console.log(`[POST /${jobId}/apply] Received application request by user:`, req.user);
  try {
    if (req.user.role !== 'worker') {
      console.log(`[POST /${jobId}/apply] Access denied: User role is not worker.`);
      return res.status(403).json({ message: 'Access denied: Only workers can apply.' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      console.log(`[POST /${jobId}/apply] Job not found.`);
      return res.status(404).json({ message: 'Job not found' });
    }
    console.log(`[POST /${jobId}/apply] Found job: ${job.title}`);

    const alreadyApplied = job.applications.some(app => app.worker.toString() === req.user.id);
    if (alreadyApplied) {
      console.log(`[POST /${jobId}/apply] Worker ${req.user.id} already applied.`);
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    job.applications.push({ worker: req.user.id, status: 'pending', appliedAt: new Date() });
    await job.save();
    console.log(`[POST /${jobId}/apply] Application submitted successfully for worker ${req.user.id}.`);

    res.json({ message: 'Application submitted successfully' });

  } catch (err) {
    console.error(`[POST /${jobId}/apply] Error applying for job:`, err.message, err.stack);
    res.status(500).json({ message: 'Error applying for job', error: err.message });
  }
});


// --- ACCEPT APPLICATION ---
router.post('/applications/:applicationId/accept', authMiddleware, async (req, res) => {
  const { applicationId } = req.params;
  console.log(`[POST /accept] Received request for application ID: ${applicationId}`);
  console.log(`[POST /accept] User performing action: ${req.user.id} (Role: ${req.user.role})`);

  // Validate applicationId format (basic check)
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      console.log(`[POST /accept] Invalid application ID format: ${applicationId}`);
      return res.status(400).json({ message: 'Invalid application ID format.' });
  }

  try {
    // Check user role
    if (req.user.role !== 'professional-body') {
      console.log('[POST /accept] Access denied: Incorrect role.');
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find the job containing the application
    // Use findOneAndUpdate for atomicity if possible, but finding first is clearer for debugging
    const job = await Job.findOne({ 'applications._id': applicationId });
    if (!job) {
      console.log(`[POST /accept] Job containing application ${applicationId} not found.`);
      return res.status(404).json({ message: 'Application or Job not found' });
    }
    console.log(`[POST /accept] Found job: ${job._id}, posted by: ${job.postedBy}`);

    // Ensure the logged-in user posted this job
    if (job.postedBy.toString() !== req.user.id) {
       console.log(`[POST /accept] Authorization failed: Job poster ${job.postedBy} !== User ${req.user.id}`);
      return res.status(403).json({ message: 'Not authorized to modify this application' });
    }

    // Find the index of the application in the array
    const appIndex = job.applications.findIndex(app => app._id.toString() === applicationId);

    if (appIndex === -1) {
       console.log(`[POST /accept] Application subdocument ${applicationId} not found within job ${job._id}.`);
      return res.status(404).json({ message: 'Application subdocument not found' });
    }
    console.log(`[POST /accept] Found application subdocument at index ${appIndex}:`, job.applications[appIndex]);

    // Check if already processed
    if (job.applications[appIndex].status !== 'pending') {
        const currentStatus = job.applications[appIndex].status;
        console.log(`[POST /accept] Application ${applicationId} already processed with status: ${currentStatus}`);
        return res.status(400).json({ message: `Application has already been ${currentStatus}.` });
    }

    // Update the status directly in the array
    job.applications[appIndex].status = 'accepted';

    // Mark the array path as modified (important for subdocument arrays)
    job.markModified('applications');

    // Save the parent Job document
    await job.save();
    console.log(`[POST /accept] Application ${applicationId} status updated to 'accepted' and job saved.`);
    res.json({ message: 'Application accepted successfully' });

  } catch (err) {
    console.error('[POST /accept] Error accepting application:', err.message, err.stack);
    res.status(500).json({ message: 'Error accepting application' }); // Keep generic error for frontend
  }
});

// --- REJECT APPLICATION ---
router.post('/applications/:applicationId/reject', authMiddleware, async (req, res) => {
  const { applicationId } = req.params;
  console.log(`[POST /reject] Received request for application ID: ${applicationId}`);
  console.log(`[POST /reject] User performing action: ${req.user.id} (Role: ${req.user.role})`);

  // Validate applicationId format
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      console.log(`[POST /reject] Invalid application ID format: ${applicationId}`);
      return res.status(400).json({ message: 'Invalid application ID format.' });
  }

  try {
    // Check user role
    if (req.user.role !== 'professional-body') {
      console.log('[POST /reject] Access denied: Incorrect role.');
      return res.status(403).json({ message: 'Access denied' });
    }

     // Find the job containing the application
    const job = await Job.findOne({ 'applications._id': applicationId });
     if (!job) {
      console.log(`[POST /reject] Job containing application ${applicationId} not found.`);
      return res.status(404).json({ message: 'Application or Job not found' });
    }
    console.log(`[POST /reject] Found job: ${job._id}, posted by: ${job.postedBy}`);

     // Ensure the logged-in user posted this job
    if (job.postedBy.toString() !== req.user.id) {
      console.log(`[POST /reject] Authorization failed: Job poster ${job.postedBy} !== User ${req.user.id}`);
      return res.status(403).json({ message: 'Not authorized to modify this application' });
    }

    // Find the index of the application in the array
    const appIndex = job.applications.findIndex(app => app._id.toString() === applicationId);

     if (appIndex === -1) {
      console.log(`[POST /reject] Application subdocument ${applicationId} not found within job ${job._id}.`);
      return res.status(404).json({ message: 'Application subdocument not found' });
    }
    console.log(`[POST /reject] Found application subdocument at index ${appIndex}:`, job.applications[appIndex]);

     // Check if already processed
    if (job.applications[appIndex].status !== 'pending') {
        const currentStatus = job.applications[appIndex].status;
        console.log(`[POST /reject] Application ${applicationId} already processed with status: ${currentStatus}`);
        return res.status(400).json({ message: `Application has already been ${currentStatus}.` });
    }

    // Update the status directly in the array
    job.applications[appIndex].status = 'rejected';

    // Mark the array path as modified
    job.markModified('applications');

    // Save the parent Job document
    await job.save();
    console.log(`[POST /reject] Application ${applicationId} status updated to 'rejected' and job saved.`);
    res.json({ message: 'Application rejected successfully' });

  } catch (err) {
    console.error('[POST /reject] Error rejecting application:', err.message, err.stack);
    res.status(500).json({ message: 'Error rejecting application' });
  }
});


module.exports = router;
