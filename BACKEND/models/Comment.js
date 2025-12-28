const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    articleId: {
        type: Number,
        required: true,
        ref: 'News'
    },
    author: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    authorEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    parentId: {
        type: Number,
        default: null,
        ref: 'Comment'
    },
    likes: {
        type: Number,
        default: 0
    },
    dislikes: {
        type: Number,
        default: 0
    },
    isApproved: {
        type: Boolean,
        default: true
    },
    isSpam: {
        type: Boolean,
        default: false
    },
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    reportedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: {
            type: String,
            trim: true,
            maxlength: 500
        },
        reportedAt: {
            type: Date,
            default: Date.now
        }
    }],
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Indexes for better performance
commentSchema.index({ articleId: 1 });
commentSchema.index({ parentId: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ isApproved: 1, createdAt: -1 });
commentSchema.index({ createdAt: -1 });

// Virtual for like/dislike ratio
commentSchema.virtual('likeRatio').get(function() {
    const total = this.likes + this.dislikes;
    return total > 0 ? (this.likes / total) * 100 : 0;
});

// Virtual for reply count
commentSchema.virtual('replyCount', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentId',
    count: true
});

// Method to soft delete
commentSchema.methods.softDelete = function(deletedBy = null) {
    this.deleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

// Method to restore
commentSchema.methods.restore = function() {
    this.deleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

// Method to edit comment
commentSchema.methods.editContent = function(newContent) {
    this.content = newContent;
    this.edited = true;
    this.editedAt = new Date();
    return this.save();
};

// Method to like/unlike
commentSchema.methods.toggleLike = function(userId, isLike = true) {
    // TODO: Implement user-specific like tracking
    if (isLike) {
        this.likes += 1;
    } else {
        this.dislikes += 1;
    }
    return this.save();
};

// Static method to get comments with replies
commentSchema.statics.getCommentsWithReplies = async function(articleId) {
    const comments = await this.find({ 
        articleId, 
        parentId: null, 
        deleted: false,
        isApproved: true 
    })
    .populate('authorId', 'username avatar')
    .sort({ createdAt: -1 });

    const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
            const replies = await this.find({
                articleId,
                parentId: comment.id,
                deleted: false,
                isApproved: true
            })
            .populate('authorId', 'username avatar')
            .sort({ createdAt: 1 });
            
            return {
                ...comment.toObject(),
                replies
            };
        })
    );

    return commentsWithReplies;
};

module.exports = mongoose.model('Comment', commentSchema);
