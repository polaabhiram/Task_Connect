const express = require('express');

const {
    getJobs,
    createJob
} = require('../controllers/job.controller');

const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/', getJobs);

router.post(
    '/',
    authenticate,
    authorize('professional-body'),
    createJob
);

module.exports = router;