const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { newsletterRateLimit } = require('../middleware/security');
const { authenticateToken, requireAdmin } = require('../controllers/authController');

// Newsletter subscription routes with rate limiting (public)
router.post('/newsletter/subscribe', newsletterRateLimit, newsletterController.subscribe);
router.post('/newsletter/unsubscribe', newsletterController.unsubscribe);

// Admin routes (protected)
router.get('/newsletter/subscribers', authenticateToken, requireAdmin, newsletterController.getSubscribers);
router.get('/newsletter/statistics', authenticateToken, requireAdmin, newsletterController.getStatistics);
router.put('/newsletter/preferences/:email', authenticateToken, requireAdmin, newsletterController.updatePreferences);

// Health check (public)
router.get('/newsletter/health', newsletterController.healthCheck);

module.exports = router;
