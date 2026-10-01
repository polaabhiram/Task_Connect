const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        budget: {
            type: Number,
            required: true,
            min: 0
        },

        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProfessionalBody',
            required: true
        }
    },
    {
        timestamps: true
    }
);

jobSchema.index({ category: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ postedBy: 1 });

module.exports = mongoose.model('Job', jobSchema);