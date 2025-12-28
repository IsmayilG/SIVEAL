const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { authenticateToken, requireAdmin } = require('../controllers/authController');

// Image upload routes (admin only)
router.post('/upload/single', authenticateToken, requireAdmin, imageController.upload.single('image'), imageController.uploadImage);
router.post('/upload/multiple', authenticateToken, requireAdmin, imageController.upload.array('images', 10), imageController.uploadMultipleImages);
router.post('/upload/url', authenticateToken, requireAdmin, imageController.uploadFromUrl);

// Image management routes
router.get('/images', authenticateToken, imageController.listImages);
router.get('/images/:publicId', imageController.getImageInfo);
router.delete('/images/:publicId', authenticateToken, requireAdmin, imageController.deleteImage);

module.exports = router;
