require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const morgan = require('morgan');
const logger = require('./config/logger');
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const newsletterRoutes = require('./routes/newsletter');
const imageRoutes = require('./routes/image');
const newsController = require('./controllers/newsController');
const connectDB = require('./config/database');

// Security middleware imports
const {
    helmetMiddleware,
    generalRateLimit,
    apiRateLimit,
    authRateLimit,
    commentRateLimit,
    newsletterRateLimit,
    speedLimiter,
    validateInput,
    securityLogger,
    corsSecurityHeaders,
    securityErrorHandler
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// HTTP Request Logging
app.use(morgan('combined', { stream: logger.stream }));

// Security Middleware - Apply before other middleware
app.use(helmetMiddleware);
app.use(securityLogger);
app.use(corsSecurityHeaders);
app.use(generalRateLimit);
app.use(speedLimiter);
app.use(validateInput);

// CORS Configuration - Security Enhancement
const allowedOrigins = [
    process.env.FRONTEND_URL || 'https://siveal.vercel.app',
    process.env.PRODUCTION_URL || 'https://siveal-backend.onrender.com',
    'http://127.0.0.1:5500', // VS Code Live Server
    'http://localhost:5500',  // Alternative Live Server
    'http://localhost:3000',  // Local development
    'https://siveal-frontend.netlify.app' // Netlify production (example)
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent XSS attacks
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// API endpoints only - frontend served separately by Vercel/Netlify
app.get('/', (req, res) => {
    res.json({ 
        message: 'SIVEAL Backend API with MongoDB', 
        status: 'running',
        database: 'MongoDB',
        timestamp: new Date().toISOString()
    });
});

// Simple test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API is working with MongoDB!', 
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

// RSS route
app.get('/rss.xml', newsController.getRSS);

// Comments routes with rate limiting
app.get('/api/comments/:articleId', newsController.getComments);
app.post('/api/comments/:articleId', commentRateLimit, newsController.createComment);

// Use routes
app.use('/api', authRoutes);
app.use('/api', newsRoutes);
app.use('/api', newsletterRoutes);
app.use('/api', imageRoutes);

// Health check endpoint for MongoDB
app.get('/api/health', async (req, res) => {
    const mongoose = require('mongoose');
    res.json({
        status: 'healthy',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Security error handling
app.use(securityErrorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// General error handling middleware
app.use((err, req, res, next) => {
    logger.error('Server error:', err);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
    logger.info(`Frontend: ${process.env.FRONTEND_URL}`);
    logger.info(`MongoDB: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
