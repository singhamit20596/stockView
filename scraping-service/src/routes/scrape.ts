import { Router } from 'express';
import { scrapeGrowwHoldings } from '../services/growwScraper';
import { updateScrapeSession, createScrapeSession, getScrapeSession } from '../services/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Start scraping
router.post('/start', async (req, res) => {
  try {
    const { accountName, brokerId } = req.body;

    if (!accountName || !brokerId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'accountName and brokerId are required'
      });
    }

    // Create scrape session
    const sessionId = uuidv4();
    const session = await createScrapeSession({
      id: sessionId,
      account_name: accountName,
      broker_id: brokerId,
      status: 'pending',
      progress: { percent: 0, stage: 'Initializing...' }
    });

    logger.info('Scraping session created', { sessionId, accountName, brokerId });

    // Start scraping in background
    scrapeGrowwHoldings(sessionId, accountName, brokerId).catch(error => {
      logger.error('Background scraping failed', { sessionId, error: error.message });
    });

    res.json({
      success: true,
      sessionId,
      message: 'Scraping started'
    });

  } catch (error) {
    logger.error('Failed to start scraping', error);
    res.status(500).json({
      error: 'Failed to start scraping',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get scraping status
router.get('/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // This would typically fetch from database
    // For now, return a mock response
    res.json({
      sessionId,
      status: 'running',
      progress: { percent: 50, stage: 'Extracting holdings...' },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get scraping status', error);
    res.status(500).json({
      error: 'Failed to get scraping status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get scraping results
router.get('/results/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // This would typically fetch from database
    // For now, return a mock response
    res.json({
      sessionId,
      status: 'completed',
      holdings: [
        {
          stockName: 'HDFC Bank',
          quantity: 100,
          avgPrice: 1500.50,
          marketPrice: 1520.75,
          sector: 'Banking',
          subsector: 'Private Banks'
        }
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get scraping results', error);
    res.status(500).json({
      error: 'Failed to get scraping results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get browser debug URL for active sessions
router.get('/browser/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getScrapeSession(sessionId);
    
    if (!session || session.status !== 'running') {
      return res.status(404).json({ error: 'No active session found' });
    }
    
    // Return the browser debug URL
    const debugUrl = `http://localhost:9222`;
    res.json({ debugUrl, sessionId });
  } catch (error) {
    logger.error('Failed to get browser URL', { error });
    res.status(500).json({ error: 'Failed to get browser URL' });
  }
});

// Cancel scraping
router.post('/cancel/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Update session status to cancelled
    await updateScrapeSession(sessionId, {
      status: 'cancelled',
      progress: { percent: 0, stage: 'Cancelled by user' }
    });

    logger.info('Scraping cancelled', { sessionId });

    res.json({
      success: true,
      sessionId,
      message: 'Scraping cancelled'
    });

  } catch (error) {
    logger.error('Failed to cancel scraping', error);
    res.status(500).json({
      error: 'Failed to cancel scraping',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as scrapeRouter };
