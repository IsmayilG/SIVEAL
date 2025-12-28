const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'siveal',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }]
    }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: fileFilter
});

// Upload single image
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file uploaded'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully to Cloudinary',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                url: req.file.path, // Cloudinary URL
                publicId: req.file.filename,
                size: req.file.size,
                format: req.file.format
            }
        });

    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Upload multiple images
const uploadMultipleImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No image files uploaded'
            });
        }

        const uploadedImages = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            url: file.path,
            publicId: file.filename,
            size: file.size,
            format: file.format
        }));
        
        res.status(200).json({
            success: true,
            message: `${uploadedImages.length} images uploaded successfully to Cloudinary`,
            data: uploadedImages
        });

    } catch (error) {
        console.error('Multiple images upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Delete image from Cloudinary
const deleteImage = async (req, res) => {
    try {
        const { publicId } = req.params;
        
        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Public ID is required'
            });
        }

        // Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(`siveal/${publicId}`);
        
        if (result.result === 'ok') {
            res.status(200).json({
                success: true,
                message: 'Image deleted successfully from Cloudinary'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Image not found or already deleted'
            });
        }

    } catch (error) {
        console.error('Image delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete image',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get image info from Cloudinary
const getImageInfo = async (req, res) => {
    try {
        const { publicId } = req.params;
        
        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Public ID is required'
            });
        }

        const result = await cloudinary.api.resource(`siveal/${publicId}`);
        
        res.status(200).json({
            success: true,
            data: {
                publicId: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                size: result.bytes,
                url: result.secure_url,
                created: result.created_at
            }
        });

    } catch (error) {
        console.error('Get image info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get image info',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// List uploaded images from Cloudinary
const listImages = async (req, res) => {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'siveal/',
            max_results: 100
        });

        const images = result.resources.map(resource => ({
            publicId: resource.public_id,
            format: resource.format,
            width: resource.width,
            height: resource.height,
            size: resource.bytes,
            url: resource.secure_url,
            created: resource.created_at
        }));

        // Sort by creation date (newest first)
        images.sort((a, b) => new Date(b.created) - new Date(a.created));

        res.status(200).json({
            success: true,
            data: images
        });

    } catch (error) {
        console.error('List images error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list images',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Upload image from URL (for migrations/external sources)
const uploadFromUrl = async (req, res) => {
    try {
        const { url, filename } = req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'Image URL is required'
            });
        }

        const result = await cloudinary.uploader.upload(url, {
            folder: 'siveal',
            public_id: filename || undefined,
            transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }]
        });

        res.status(200).json({
            success: true,
            message: 'Image uploaded from URL successfully',
            data: {
                publicId: result.public_id,
                url: result.secure_url,
                format: result.format,
                width: result.width,
                height: result.height,
                size: result.bytes
            }
        });

    } catch (error) {
        console.error('Upload from URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image from URL',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    upload,
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    getImageInfo,
    listImages,
    uploadFromUrl
};
