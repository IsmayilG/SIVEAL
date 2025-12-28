const Newsletter = require('../models/Newsletter');

// Subscribe to newsletter
const subscribe = async (req, res) => {
    try {
        const { email, categories, language, frequency } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if email already exists
        const existingSubscriber = await Newsletter.findOne({ email: email.toLowerCase() });

        if (existingSubscriber) {
            if (existingSubscriber.isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already subscribed to newsletter'
                });
            } else {
                // Reactivate subscription
                existingSubscriber.isActive = true;
                existingSubscriber.subscribedAt = new Date();
                existingSubscriber.unsubscribedAt = null;
                
                if (categories) existingSubscriber.preferences.categories = categories;
                if (language) existingSubscriber.preferences.language = language;
                if (frequency) existingSubscriber.preferences.frequency = frequency;

                await existingSubscriber.save();

                return res.status(200).json({
                    success: true,
                    message: 'Welcome back! Newsletter subscription reactivated.',
                    data: {
                        email: existingSubscriber.email,
                        subscribedAt: existingSubscriber.subscribedAt,
                        preferences: existingSubscriber.preferences
                    }
                });
            }
        }

        // Create new subscription
        const newSubscriber = new Newsletter({
            email: email.toLowerCase(),
            preferences: {
                categories: categories || ['all'],
                language: language || 'en',
                frequency: frequency || 'daily'
            }
        });

        await newSubscriber.save();

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to SIVEAL newsletter!',
            data: {
                email: newSubscriber.email,
                subscribedAt: newSubscriber.subscribedAt,
                preferences: newSubscriber.preferences
            }
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email is already subscribed to newsletter'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to subscribe to newsletter',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Unsubscribe from newsletter
const unsubscribe = async (req, res) => {
    try {
        const { email, token } = req.body;

        if (!email && !token) {
            return res.status(400).json({
                success: false,
                message: 'Email or unsubscribe token is required'
            });
        }

        let subscriber;

        if (token) {
            subscriber = await Newsletter.findOne({ unsubscribeToken: token });
        } else {
            subscriber = await Newsletter.findOne({ email: email.toLowerCase() });
        }

        if (!subscriber || !subscriber.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found or already unsubscribed'
            });
        }

        // Mark as unsubscribed
        subscriber.isActive = false;
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();

        res.status(200).json({
            success: true,
            message: 'Successfully unsubscribed from newsletter'
        });

    } catch (error) {
        console.error('Newsletter unsubscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unsubscribe from newsletter',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get all active subscribers (for admin)
const getSubscribers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const category = req.query.category;
        const language = req.query.language;
        const search = req.query.search;

        // Build filter
        const filter = { isActive: true };

        if (category && category !== 'all') {
            filter['preferences.categories'] = { $in: [category, 'all'] };
        }

        if (language) {
            filter['preferences.language'] = language;
        }

        if (search) {
            filter.email = { $regex: search, $options: 'i' };
        }

        const subscribers = await Newsletter.find(filter)
            .select('-unsubscribeToken') // Don't expose unsubscribe token
            .sort({ subscribedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Newsletter.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                subscribers,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total,
                    limit
                }
            }
        });

    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscribers',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get newsletter statistics (for admin)
const getStatistics = async (req, res) => {
    try {
        const totalSubscribers = await Newsletter.countDocuments({ isActive: true });
        
        const monthlyStats = await Newsletter.aggregate([
            {
                $match: {
                    isActive: true,
                    subscribedAt: {
                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 }
                }
            }
        ]);

        const categoryStats = await Newsletter.aggregate([
            {
                $match: { isActive: true }
            },
            {
                $unwind: '$preferences.categories'
            },
            {
                $group: {
                    _id: '$preferences.categories',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const languageStats = await Newsletter.aggregate([
            {
                $match: { isActive: true }
            },
            {
                $group: {
                    _id: '$preferences.language',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalSubscribers,
                newThisMonth: monthlyStats[0]?.count || 0,
                categoryDistribution: categoryStats,
                languageDistribution: languageStats
            }
        });

    } catch (error) {
        console.error('Newsletter statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Update subscriber preferences
const updatePreferences = async (req, res) => {
    try {
        const { email } = req.params;
        const { categories, language, frequency } = req.body;

        const subscriber = await Newsletter.findOne({ 
            email: email.toLowerCase(), 
            isActive: true 
        });

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found'
            });
        }

        // Update preferences
        if (categories) subscriber.preferences.categories = categories;
        if (language) subscriber.preferences.language = language;
        if (frequency) subscriber.preferences.frequency = frequency;

        await subscriber.save();

        res.status(200).json({
            success: true,
            message: 'Preferences updated successfully',
            data: {
                email: subscriber.email,
                preferences: subscriber.preferences
            }
        });

    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update preferences',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Health check for newsletter system
const healthCheck = async (req, res) => {
    try {
        const totalActive = await Newsletter.countDocuments({ isActive: true });
        const totalInactive = await Newsletter.countDocuments({ isActive: false });

        res.status(200).json({
            success: true,
            message: 'Newsletter system is healthy',
            data: {
                activeSubscribers: totalActive,
                inactiveSubscribers: totalInactive,
                total: totalActive + totalInactive,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Newsletter health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Newsletter system health check failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    subscribe,
    unsubscribe,
    getSubscribers,
    getStatistics,
    updatePreferences,
    healthCheck
};
