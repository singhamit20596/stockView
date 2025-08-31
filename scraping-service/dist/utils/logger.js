"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleLogger = exports.logger = void 0;
const winston_1 = require("winston");
const { combine, timestamp, printf, colorize } = winston_1.format;
// Global sequence counter for tracking flow
let sequenceCounter = 0;
const getSequenceNumber = () => ++sequenceCounter;
// Enhanced custom format with sequence numbers and service tracking
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
    const seq = getSequenceNumber();
    const service = metadata.service || 'RAILWAY';
    const sessionId = metadata.sessionId || 'NO_SESSION';
    const stage = metadata.stage || 'NO_STAGE';
    const flow = metadata.flow || 'NO_FLOW';
    let msg = `[SEQ:${seq.toString().padStart(3, '0')}] [${service}] [${sessionId}] [${stage}] [${flow}] ${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(metadata).length > 4) {
        const cleanMetadata = { ...metadata };
        delete cleanMetadata.service;
        delete cleanMetadata.sessionId;
        delete cleanMetadata.stage;
        delete cleanMetadata.flow;
        if (Object.keys(cleanMetadata).length > 0) {
            msg += ` ${JSON.stringify(cleanMetadata)}`;
        }
    }
    return msg;
});
// Create logger
exports.logger = (0, winston_1.createLogger)({
    level: 'debug', // Set to debug for maximum visibility
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    transports: [
        // Console transport
        new winston_1.transports.Console({
            format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat)
        }),
        // File transport for production
        new winston_1.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston_1.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});
// Create a simple logger for development
exports.simpleLogger = {
    info: (message, meta) => {
        console.log(`[INFO] ${message}`, meta || '');
    },
    error: (message, meta) => {
        console.error(`[ERROR] ${message}`, meta || '');
    },
    warn: (message, meta) => {
        console.warn(`[WARN] ${message}`, meta || '');
    },
    debug: (message, meta) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${message}`, meta || '');
        }
    }
};
//# sourceMappingURL=logger.js.map