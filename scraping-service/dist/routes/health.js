"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.healthRouter = router;
router.get('/', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    };
    logger_1.logger.info('Health check requested', health);
    res.json(health);
});
//# sourceMappingURL=health.js.map