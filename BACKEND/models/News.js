const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    summary: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    time: {
        type: Date,
        default: Date.now
    },
    views: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    published: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    metaTitle: {
        type: String,
        trim: true,
        maxlength: 60
    },
    metaDescription: {
        type: String,
        trim: true,
        maxlength: 160
    },
    // Multi-language support fields
    title_tr: {
        type: String,
        trim: true,
        maxlength: 500
    },
    summary_tr: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    content_tr: {
        type: String,
        trim: true
    },
    title_az: {
        type: String,
        trim: true,
        maxlength: 500
    },
    summary_az: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    content_az: {
        type: String,
        trim: true
    },
    title_ru: {
        type: String,
        trim: true,
        maxlength: 500
    },
    summary_ru: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    content_ru: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for better performance
newsSchema.index({ category: 1 });
newsSchema.index({ published: 1, time: -1 });
newsSchema.index({ featured: 1, time: -1 });
newsSchema.index({ title: 'text', summary: 'text', content: 'text' });

// Virtual for URL-friendly slug
newsSchema.virtual('slug').get(function() {
    return this.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
});

module.exports = mongoose.model('News', newsSchema);
