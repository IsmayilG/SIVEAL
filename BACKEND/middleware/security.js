const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const validator = require('validator');

// Content Security Policy Configuration
const cspConfig = {
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://www.googletagmanager.com",
            "https://www.google-analytics.com",
            "https://cdnjs.cloudflare.com",
            "https://fonts.googleapis.com",
            "https://images.unsplash.com"
        ],
        styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdnjs.cloudflare.com"
        ],
        imgSrc: [
            "'self'",
            "data:",
            "https:",
            "http:",
            "blob:",
            "https://images.unsplash.com",
            "https://source.unsplash.com",
            "https://picsum.photos",
            "https://cdn.pixabay.com"
        ],
        fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://cdnjs.cloudflare.com"
        ],
        connectSrc: [
            "'self'",
            "https://api.siveal.com",
            "https://siveal-backend.onrender.com",
            "http://localhost:3000",
            "https://www.google-analytics.com",
            "wss:",
            "ws:"
        ],
        frameSrc: [
            "'self'",
            "https://www.youtube.com",
            "https://player.vimeo.com"
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https:", "http:"],
        childSrc: ["'self'", "https://www.youtube.com"],
        workerSrc: ["'self'", "blob:"],
        manifestSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    },
    reportOnly: process.env.NODE_ENV !== 'production'
};

// Helmet Security Middleware
const helmetMiddleware = helmet({
    contentSecurityPolicy: cspConfig,
    crossOriginEmbedderPolicy: false, // Disable for better compatibility
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: true },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
});

// Rate Limiting Configuration
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            console.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
            res.status(429).json({
                error: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

// Different rate limits for different endpoints
const generalRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many requests from this IP, please try again later.'
);

const authRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 auth requests per windowMs
    'Too many authentication attempts, please try again later.'
);

const apiRateLimit = createRateLimit(
    1 * 60 * 1000, // 1 minute
    60, // limit each IP to 60 requests per minute
    'Too many API requests, please slow down.'
);

const commentRateLimit = createRateLimit(
    60 * 1000, // 1 minute
    3, // limit each IP to 3 comments per minute
    'Too many comments, please wait before posting again.'
);

const newsletterRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hour
    5, // limit each IP to 5 newsletter subscriptions per hour
    'Too many newsletter subscriptions, please try again later.'
);

// Speed limiter for aggressive clients
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per windowMs without delay
    delayMs: 500, // add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // maximum delay of 20 seconds
    skipFailedRequests: true, // don't delay failed requests
    skipSuccessfulRequests: false
});

// Input validation middleware
const validateInput = (req, res, next) => {
    const errors = [];

    // Sanitize common fields
    const sanitizeField = (field, value, maxLength = 1000) => {
        if (typeof value === 'string') {
            // Remove potentially dangerous characters
            let sanitized = value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<[^>]+>/g, '')
                .trim();
            
            // Validate length
            if (sanitized.length > maxLength) {
                errors.push(`${field} exceeds maximum length of ${maxLength} characters`);
                return null;
            }
            
            return sanitized;
        }
        return value;
    };

    // Sanitize request body
    if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string') {
                req.body[key] = sanitizeField(key, value);
            }
        }
    }

    // Sanitize query parameters
    if (req.query) {
        for (const [key, value] of Object.entries(req.query)) {
            if (typeof value === 'string') {
                req.query[key] = sanitizeField(key, value);
            }
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Invalid input data',
            details: errors
        });
    }

    next();
};

// Specific validation functions
const validateEmail = (email) => {
    return validator.isEmail(email) && validator.isLength(email, { max: 255 });
};

const validatePassword = (password) => {
    return validator.isLength(password, { min: 8, max: 128 }) &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password);
};

const validateUsername = (username) => {
    return validator.isLength(username, { min: 3, max: 30 }) &&
           /^[a-zA-Z0-9_]+$/.test(username);
};

const validateComment = (comment) => {
    return validator.isLength(comment, { min: 1, max: 1000 }) &&
           !validator.contains(comment, '<script');
};

const validateNewsletterEmail = (email) => {
    return validateEmail(email);
};

// Request logging for security monitoring
const securityLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Log suspicious requests
    const isSuspicious = (
        req.headers['user-agent']?.includes('bot') ||
        req.headers['user-agent']?.includes('crawler') ||
        req.ip.startsWith('192.168.') ||
        req.ip.startsWith('10.') ||
        req.ip.startsWith('172.')
    );

    if (isSuspicious) {
        console.log(`[SECURITY] Suspicious request: ${req.method} ${req.path} from IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
    }

    // Log request
    res.on('finish', () => {
        const duration = Date.now() - startTime;

        if (res.statusCode >= 400 || duration > 5000) {
            console.log(`[SECURITY] ${req.path} - ${req.method} ${res.statusCode} - ${duration}ms - IP: ${req.ip}`);
        }
    });

    next();
};

// IP whitelist checker (for admin endpoints)
const ipWhitelist = process.env.ADMIN_IP_WHITELIST ? 
    process.env.ADMIN_IP_WHITELIST.split(',').map(ip => ip.trim()) : [];

const checkIPWhitelist = (req, res, next) => {
    if (ipWhitelist.length === 0) {
        return next(); // No whitelist configured, allow all
    }

    if (!ipWhitelist.includes(req.ip)) {
        console.warn(`[SECURITY] Unauthorized IP attempt: ${req.ip} for ${req.path}`);
        return res.status(403).json({
            error: 'Access denied from this IP address'
        });
    }

    next();
};

// CORS security headers
const corsSecurityHeaders = (req, res, next) => {
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
};

// Error handling for security middleware
const securityErrorHandler = (err, req, res, next) => {
    console.error('[SECURITY ERROR]', err);
    
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            error: 'Request entity too large'
        });
    }
    
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'Invalid JSON payload'
        });
    }
    
    res.status(500).json({
        error: 'Security check failed'
    });
};

module.exports = {
    helmetMiddleware,
    generalRateLimit,
    authRateLimit,
    apiRateLimit,
    commentRateLimit,
    newsletterRateLimit,
    speedLimiter,
    validateInput,
    validateEmail,
    validatePassword,
    validateUsername,
    validateComment,
    validateNewsletterEmail,
    securityLogger,
    checkIPWhitelist,
    corsSecurityHeaders,
    securityErrorHandler
};
