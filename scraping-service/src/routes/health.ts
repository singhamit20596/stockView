import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };

  logger.info('Health check requested', health);
  res.json(health);
});

export { router as healthRouter };
