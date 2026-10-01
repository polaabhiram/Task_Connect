const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        skills: {
            type: [String],
            default: []
        },

        experience: {
            type: Number,
            min: 0,
            default: 0
        },

        availability: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Worker', workerSchema);