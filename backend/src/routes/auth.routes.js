const express = require('express');

const {
    registerWorker,
    registerProfessionalBody,
    loginWorker,
    loginProfessionalBody,
    getCurrentUser
} = require('../controllers/auth.controller');

const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register/worker', registerWorker);
router.post('/register/professional-body', registerProfessionalBody);

router.post('/login/worker', loginWorker);
router.post('/login/professional-body', loginProfessionalBody);

router.get('/me', authenticate, getCurrentUser);

module.exports = router;