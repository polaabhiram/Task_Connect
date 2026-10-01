const Job = require('../../models/Job');

const getAllJobs = async () => {
    return await Job.find()
        .populate('postedBy', 'name email')
        .sort({ createdAt: -1 });
};

const createJob = async (jobData) => {
    return await Job.create(jobData);
};

module.exports = {
    getAllJobs,
    createJob
};