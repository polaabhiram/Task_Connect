const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true
        },

        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Worker',
            required: true
        },

        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

applicationSchema.index(
    { job: 1, worker: 1 },
    { unique: true }
);

applicationSchema.index({ worker: 1 });
applicationSchema.index({ job: 1 });
applicationSchema.index({ status: 1 });

module.exports = mongoose.model(
    'Application',
    applicationSchema
);