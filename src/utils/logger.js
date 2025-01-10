const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Default format for file logging
  ),
  transports: [
    // Console transport with human-readable format
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Adds colors for levels
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Custom timestamp
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `[${timestamp}] ${level}: ${message} ${metaString}`;
        })
      ),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
    }),
    // File transport for all combined logs
    new winston.transports.File({
      filename: 'combined.log',
    }),
  ],
});

module.exports = logger;
