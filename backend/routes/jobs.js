const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name');
    const sanitizedJobs = jobs.map(job => ({
      ...job.toObject(),
      postedBy: job.postedBy ? { name: job.postedBy.name || 'Unknown' } : { name: 'Unknown' }
    }));
    res.json(sanitizedJobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

router.get('/available', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching available jobs for user:', req.user);
    if (req.user.role !== 'worker') {
      console.log('Access denied: User role is not worker');
      return res.status(403).json({ message: 'Access denied' });
    }
    const appliedJobIds = (await Job.find({ 'applications.worker': req.user.id })).map(j => j._id);
    const jobs = await Job.find({ _id: { $nin: appliedJobIds }, postedBy: { $ne: req.user.id } })
      .populate('postedBy', 'name')
      .lean();
    console.log('Available jobs:', jobs);
    const categorizedJobs = jobs.reduce((acc, job) => {
      (acc[job.category] = acc[job.category] || []).push(job);
      return acc;
    }, {});
    res.json(categorizedJobs);
  } catch (err) {
    console.error('Error fetching available jobs:', err.message);
    res.status(500).json({ message: 'Error fetching available jobs', error: err.message });
  }
});

router.get('/applications', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching applications for user:', req.user);
    if (req.user.role === 'professional-body') {
      console.log('Querying jobs with postedBy:', req.user.id);
      const jobs = await Job.find({ postedBy: req.user.id }).populate({
        path: 'applications.worker',
        select: 'name email category'
      });
      const applications = jobs.flatMap(job =>
        job.applications.map(app => ({
          _id: app._id,
          job: { _id: job._id, title: job.title },
          worker: app.worker,
          appliedAt: app.appliedAt,
          status: app.status
        }))
      );
      const categorizedApps = {
        pending: applications.filter(a => a.status === 'pending'),
        accepted: applications.filter(a => a.status === 'accepted'),
        rejected: applications.filter(a => a.status === 'rejected')
      };
      res.json(categorizedApps);
    } else if (req.user.role === 'worker') {
      console.log('Fetching worker applications for:', req.user.id);
      const jobs = await Job.find({ 'applications.worker': req.user.id }).populate({
        path: 'applications.worker',
        match: { _id: req.user.id },
        select: 'name email category'
      });
      const applications = jobs.flatMap(job =>
        job.applications
          .filter(app => app.worker._id.toString() === req.user.id)
          .map(app => ({
            _id: app._id,
            job: { _id: job._id, title: job.title, description: job.description, category: job.category, location: job.location, budget: job.budget },
            worker: app.worker,
            appliedAt: app.appliedAt,
            status: app.status
          }))
      );
      const categorizedApps = applications.reduce((acc, app) => {
        (acc[app.job.category] = acc[app.job.category] || []).push(app);
        return acc;
      }, {});
      res.json(categorizedApps);
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch (err) {
    console.error('Error fetching applications:', err.message, err.stack);
    res.status(500).json({ message: 'Error fetching applications', error: err.message });
  }
});

router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    console.log('Apply request received for job ID:', req.params.id);
    console.log('Authenticated user:', req.user);
    if (req.user.role !== 'worker') {
      console.log('Access denied: User role is not worker');
      return res.status(403).json({ message: 'Access denied' });
    }

    const job = await Job.findById(req.params.id);
    console.log('Found job:', job);
    if (!job) {
      console.log('Job not found');
      return res.status(404).json({ message: 'Job not found' });
    }

    const alreadyApplied = job.applications.some(app => app.worker.toString() === req.user.id);
    if (alreadyApplied) {
      console.log('Already applied');
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    job.applications.push({ worker: req.user.id });
    await job.save();
    console.log('Job after save:', await Job.findById(req.params.id).populate('applications.worker'));

    const applications = await Job.find({ 'applications.worker': req.user.id })
      .populate('applications.worker', 'name email category');
    const workerApplications = applications.flatMap(job =>
      job.applications
        .filter(app => app.worker._id.toString() === req.user.id)
        .map(app => ({
          _id: app._id,
          job: { _id: job._id, title: job.title, description: job.description, category: job.category, location: job.location, budget: job.budget },
          worker: app.worker,
          appliedAt: app.appliedAt,
          status: app.status
        }))
    );
    const appliedJobIds = [req.params.id, ...applications.map(j => j._id)];
    const availableJobs = await Job.find({ _id: { $nin: appliedJobIds }, postedBy: { $ne: req.user.id } })
      .populate('postedBy', 'name')
      .lean();
    const categorizedAvailableJobs = availableJobs.reduce((acc, job) => {
      (acc[job.category] = acc[job.category] || []).push(job);
      return acc;
    }, {});

    res.json({
      message: 'Application submitted successfully',
      applications: workerApplications.reduce((acc, app) => {
        (acc[app.job.category] = acc[app.job.category] || []).push(app);
        return acc;
      }, {}),
      availableJobs: categorizedAvailableJobs
    });
  } catch (err) {
    console.error('Error applying for job:', err.message, err.stack);
    res.status(500).json({ message: 'Error applying for job', error: err.message });
  }
});

router.get('/report', authMiddleware, async (req, res) => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  try {
    console.log('GENAI_API_KEY:', process.env.GENAI_API_KEY);
    console.log('Generating website-wide report with Gemini API');
    const jobs = await Job.find().populate('postedBy', 'name');
    const allApplications = jobs.flatMap(job => job.applications.map(app => ({
      _id: app._id,
      job: { _id: job._id, title: job.title },
      worker: app.worker,
      appliedAt: app.appliedAt,
      status: app.status
    })));

    const now = new Date();
    const weeklyJobs = jobs.filter(j => j.createdAt >= new Date(now - 7 * 24 * 60 * 60 * 1000));
    const monthlyJobs = jobs.filter(j => j.createdAt >= new Date(now - 30 * 24 * 60 * 60 * 1000));
    const annualJobs = jobs.filter(j => j.createdAt >= new Date(now - 365 * 24 * 60 * 60 * 1000));
    const weeklyApps = allApplications.filter(a => a.appliedAt >= new Date(now - 7 * 24 * 60 * 60 * 1000));
    const monthlyApps = allApplications.filter(a => a.appliedAt >= new Date(now - 30 * 24 * 60 * 60 * 1000));
    const annualApps = allApplications.filter(a => a.appliedAt >= new Date(now - 365 * 24 * 60 * 60 * 1000));

    const prompt = `Generate a professional report summarizing job and application data for the website. Include:
    - Total jobs posted and applications overall.
    - Weekly breakdown (last 7 days): number of jobs posted and applications with status distribution.
    - Monthly breakdown (last 30 days): number of jobs posted and applications with status distribution.
    - Annual breakdown (last 365 days): number of jobs posted and applications with status distribution.
    Data: Total jobs: ${jobs.length}, Total applications: ${allApplications.length}, Weekly jobs: ${weeklyJobs.length}, Weekly applications: ${weeklyApps.length}, Monthly jobs: ${monthlyJobs.length}, Monthly applications: ${monthlyApps.length}, Annual jobs: ${annualJobs.length}, Annual applications: ${annualApps.length}. Status counts to infer: Pending, Accepted, Rejected. Current date: ${now.toLocaleString()}.`;

    const genAI = new GoogleGenerativeAI(process.env.GENAI_API_KEY);
    console.log('GenAI instance created');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('Model selected:', model);
    const result = await model.generateContent(prompt);
    console.log('Generation result:', result);
    let report = result.response.text();

    // Remove all stars (***, **, *) from the report
    report = report.replace(/(\*{1,3})/g, '').trim();

    console.log('Generated report (stars removed):', report);
    res.json({ report });
  } catch (err) {
    console.error('Error generating report:', err.message, err.stack);
    res.status(500).json({ message: 'Error generating report', error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'professional-body') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const job = new Job({ ...req.body, postedBy: req.user.id, createdAt: new Date() });
    await job.save();
    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (err) {
    res.status(500).json({ message: 'Error posting job' });
  }
});

router.post('/applications/:applicationId/accept', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'professional-body') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { applicationId } = req.params;
    const job = await Job.findOne({ 'applications._id': applicationId });
    if (!job) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    application.status = 'accepted';
    await job.save();
    res.json({ message: 'Application accepted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error accepting application' });
  }
});

router.post('/applications/:applicationId/reject', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'professional-body') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { applicationId } = req.params;
    const job = await Job.findOne({ 'applications._id': applicationId });
    if (!job) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    application.status = 'rejected';
    await job.save();
    res.json({ message: 'Application rejected successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error rejecting application' });
  }
});

module.exports = router;