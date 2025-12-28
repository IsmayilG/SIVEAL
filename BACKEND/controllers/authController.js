const jwt = require('jsonwebtoken');
const User = require('../models/User');
const News = require('../models/News');
const Comment = require('../models/Comment');
const { validateEmail, validatePassword, validateUsername } = require('../middleware/security');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file.');
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findOne({ username, isActive: true });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            await user.incLoginAttempts();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Reset login attempts and update last login
        await user.updateLastLogin();

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function register(req, res) {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate input
        if (!validateUsername(username)) {
            return res.status(400).json({ error: 'Invalid username format' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be 8-128 characters and contain uppercase, lowercase, and number' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Generate unique ID
        const lastUser = await User.findOne().sort({ id: -1 });
        const newId = lastUser ? lastUser.id + 1 : 1;

        const newUser = new User({
            id: newId,
            username,
            email,
            password,
            firstName,
            lastName
        });

        const savedUser = await newUser.save();

        const token = jwt.sign(
            { id: savedUser.id, username: savedUser.username, role: savedUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: savedUser.id,
                username: savedUser.username,
                email: savedUser.email,
                role: savedUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

function logout(req, res) {
    // In a stateless JWT system, logout is handled on the client side
    // by removing the token from localStorage
    res.json({ success: true, message: 'Logged out successfully' });
}

function getStatus(req, res) {
    res.json({
        isLoggedIn: true,
        user: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        }
    });
}

async function getProfile(req, res) {
    try {
        const user = await User.findOne({ id: req.user.id }).select('-password -loginAttempts -lockUntil');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function updateProfile(req, res) {
    try {
        const { email, currentPassword, newPassword, firstName, lastName, bio, location, website } = req.body;
        const userId = req.user.id;

        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If changing password, verify current password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to change password' });
            }

            const isValidCurrentPassword = await user.comparePassword(currentPassword);
            if (!isValidCurrentPassword) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'New password must be at least 6 characters' });
            }

            user.password = newPassword; // Will be hashed by pre-save hook
        }

        // Update email if provided
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, id: { $ne: userId } });
            if (existingUser) {
                return res.status(409).json({ error: 'Email already exists' });
            }
            user.email = email;
        }

        // Update other fields
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (bio !== undefined) user.bio = bio;
        if (location !== undefined) user.location = location;
        if (website !== undefined) user.website = website;

        await user.save();

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                location: user.location,
                website: user.website
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getUsers(req, res) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const users = await User.find({}).select('-password -loginAttempts -lockUntil');
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getAdminStats(req, res) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const [totalUsers, totalArticles, totalComments] = await Promise.all([
            User.countDocuments(),
            News.countDocuments(),
            Comment.countDocuments({ deleted: false })
        ]);

        const totalViewsResult = await News.aggregate([
            { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ]);

        const totalViews = totalViewsResult[0]?.totalViews || 0;

        res.json({
            totalUsers,
            totalArticles,
            totalComments,
            totalViews
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function deleteUser(req, res) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const userId = parseInt(req.params.id);

        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Don't allow deleting admin users
        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot delete admin users' });
        }

        await User.findOneAndDelete({ id: userId });

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Admin check middleware
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

module.exports = {
    authenticateToken,
    requireAdmin,
    login,
    register,
    logout,
    getStatus,
    getProfile,
    updateProfile,
    getUsers,
    getAdminStats,
    deleteUser
};
