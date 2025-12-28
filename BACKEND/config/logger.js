const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
    })
);

// Define log format for JSON (production)
const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create transports based on environment
const transports = [];

// Console transport (always enabled)
transports.push(
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            logFormat
        )
    })
);

// File transports (production only)
if (process.env.NODE_ENV === 'production') {
    // Error log file
    transports.push(
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            format: jsonFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );

    // Combined log file
    transports.push(
        new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            format: jsonFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );
}

// Custom log levels (add http level)
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'blue'
    }
};

winston.addColors(customLevels.colors);

// Create logger instance
const logger = winston.createLogger({
    levels: customLevels.levels,
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    transports
});

// Create stream for Morgan HTTP logging
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

module.exports = logger;
