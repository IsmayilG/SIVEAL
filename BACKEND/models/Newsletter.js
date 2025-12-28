const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    preferences: {
        categories: {
            type: [String],
            default: ['all'] // all, AI & Robotics, Enterprise, Crypto, Science
        },
        language: {
            type: String,
            default: 'en',
            enum: ['en', 'tr', 'az', 'ru']
        },
        frequency: {
            type: String,
            default: 'daily',
            enum: ['daily', 'weekly', 'monthly']
        }
    },
    unsubscribedAt: {
        type: Date,
        default: null
    },
    unsubscribeToken: {
        type: String,
        unique: true,
        sparse: true
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Index for performance
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ isActive: 1 });
newsletterSchema.index({ subscribedAt: -1 });

// Generate unsubscribe token before saving
newsletterSchema.pre('save', function(next) {
    if (!this.unsubscribeToken) {
        this.unsubscribeToken = require('crypto').randomBytes(32).toString('hex');
    }
    next();
});

module.exports = mongoose.model('Newsletter', newsletterSchema);
