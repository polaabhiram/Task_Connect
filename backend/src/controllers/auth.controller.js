const authService = require('../services/auth.service');

const registerWorker = async (req, res) => {
    try {
        const worker = await authService.registerWorker(req.body);

        res.status(201).json({
            success: true,
            message: 'Worker registered successfully',
            data: {
                id: worker._id,
                name: worker.name,
                email: worker.email,
                category: worker.category
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const registerProfessionalBody = async (req, res) => {
    try {
        const professionalBody =
            await authService.registerProfessionalBody(req.body);

        res.status(201).json({
            success: true,
            message: 'Professional body registered successfully',
            data: {
                id: professionalBody._id,
                name: professionalBody.name,
                email: professionalBody.email,
                type: professionalBody.type,
                location: professionalBody.location
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};



const loginWorker = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await authService.loginWorker(
            email,
            password
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};


const loginProfessionalBody = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result =
            await authService.loginProfessionalBody(
                email,
                password
            );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

const getCurrentUser = async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            userId: req.user.id,
            role: req.user.role
        }
    });
};

module.exports = {
    registerWorker,
    registerProfessionalBody,
    loginWorker,
    loginProfessionalBody,
    getCurrentUser
};