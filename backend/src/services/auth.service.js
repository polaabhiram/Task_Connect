const bcrypt = require('bcryptjs');

const Worker = require('../../models/Worker');
const ProfessionalBody = require('../../models/ProfessionalBody');
const { generateToken } = require('../utils/jwt');


const registerWorker = async (workerData) => {
    const { name, email, password, category, skills, experience, availability } = workerData;

    const existingWorker = await Worker.findOne({ email });

    if (existingWorker) {
        throw new Error('Worker with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const worker = await Worker.create({
        name,
        email,
        password: hashedPassword,
        category,
        skills,
        experience,
        availability
    });

    return worker;
};

const registerProfessionalBody = async (bodyData) => {
    const { name, email, password, type, location, description } = bodyData;

    const existingBody = await ProfessionalBody.findOne({ email });

    if (existingBody) {
        throw new Error('Professional body with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const professionalBody = await ProfessionalBody.create({
        name,
        email,
        password: hashedPassword,
        type,
        location,
        description
    });

    return professionalBody;
};

const loginWorker = async (email, password) => {
    const worker = await Worker.findOne({ email });
    // console.log('Worker found:', worker); // Debugging line

    if (!worker) {
        throw new Error('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(
        password,
        worker.password
    );

    if (!passwordMatch) {
        throw new Error('Invalid email or password');
    }

    const token = generateToken({
        id: worker._id,
        role: 'worker'
    });

    return {
        token,
        user: {
            id: worker._id,
            name: worker.name,
            email: worker.email,
            role: 'worker'
        }
    };
};

const loginProfessionalBody = async (email, password) => {
    const professionalBody = await ProfessionalBody.findOne({ email });

    if (!professionalBody) {
        throw new Error('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(
        password,
        professionalBody.password
    );

    if (!passwordMatch) {
        throw new Error('Invalid email or password');
    }

    const token = generateToken({
        id: professionalBody._id,
        role: 'professional-body'
    });

    return {
        token,
        user: {
            id: professionalBody._id,
            name: professionalBody.name,
            email: professionalBody.email,
            role: 'professional-body'
        }
    };
};

module.exports = {
    registerWorker,
    registerProfessionalBody,
    loginWorker,
    loginProfessionalBody
};