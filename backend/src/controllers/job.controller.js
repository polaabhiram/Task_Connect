const jobService = require('../services/job.service');

const getJobs = async (req, res) => {
    try {
        const jobs = await jobService.getAllJobs();

        res.status(200).json({
            success: true,
            data: jobs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const createJob = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            location,
            budget
        } = req.body;

        const job = await jobService.createJob({
            title,
            description,
            category,
            location,
            budget,
            postedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: job
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getJobs,
    createJob
};