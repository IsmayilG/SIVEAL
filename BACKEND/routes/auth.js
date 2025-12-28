const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authRateLimit } = require('../middleware/security');

// Auth routes with rate limiting
router.post('/auth/login', authRateLimit, authController.login);
router.post('/auth/register', authRateLimit, authController.register);
router.post('/auth/logout', authController.logout);
router.get('/auth/status', authController.authenticateToken, authController.getStatus);

// Profile routes
router.get('/profile', authController.authenticateToken, authController.getProfile);
router.put('/profile', authController.authenticateToken, authController.updateProfile);

// Admin routes
router.get('/users', authController.authenticateToken, authController.getUsers);
router.delete('/users/:id', authController.authenticateToken, authController.deleteUser);
router.get('/admin/stats', authController.authenticateToken, authController.getAdminStats);

module.exports = router;
