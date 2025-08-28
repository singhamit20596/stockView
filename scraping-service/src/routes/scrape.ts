import { Router } from 'express';
import { chromium } from 'playwright';
import { scrapeGrowwHoldings } from '../services/growwScraper';
import { updateScrapeSession, createScrapeSession, getScrapeSession } from '../services/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Browserless.io configuration
const USE_BROWSERLESS = process.env.USE_BROWSERLESS?.toLowerCase() === 'true';
const BROWSERLESS_URL = process.env.BROWSERLESS_URL || 'wss://production-sfo.browserless.io';
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;

const router = Router();

// Start scraping
router.post('/start', async (req, res) => {
  try {
    logger.info('🚀 SCRAPE START REQUEST RECEIVED', { 
      service: 'RAILWAY_API', 
      stage: 'REQUEST_RECEIVED', 
      flow: 'SCRAPE_START',
      body: req.body 
    });

    const { accountName, brokerId } = req.body;

    if (!accountName || !brokerId) {
      logger.error('❌ MISSING REQUIRED FIELDS', { 
        service: 'RAILWAY_API', 
        stage: 'VALIDATION_FAILED', 
        flow: 'SCRAPE_START',
        accountName, 
        brokerId 
      });
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'accountName and brokerId are required'
      });
    }

    logger.info('✅ VALIDATION PASSED', { 
      service: 'RAILWAY_API', 
      stage: 'VALIDATION_PASSED', 
      flow: 'SCRAPE_START',
      accountName, 
      brokerId 
    });

    // Create scrape session
    const sessionId = uuidv4();
    logger.info('🆔 SESSION ID GENERATED', { 
      service: 'RAILWAY_API', 
      stage: 'SESSION_CREATED', 
      flow: 'SCRAPE_START',
      sessionId 
    });

    const session = await createScrapeSession({
      id: sessionId,
      account_name: accountName,
      broker_id: brokerId,
      status: 'pending',
      progress: { percent: 0, stage: 'Initializing...' }
    });

    logger.info('💾 SESSION SAVED TO SUPABASE', { 
      service: 'RAILWAY_API', 
      stage: 'SESSION_SAVED', 
      flow: 'SCRAPE_START',
      sessionId, 
      accountName, 
      brokerId,
      session 
    });

    // Start scraping in background
    logger.info('🔄 STARTING BACKGROUND SCRAPING', { 
      service: 'RAILWAY_API', 
      stage: 'BACKGROUND_START', 
      flow: 'SCRAPE_START',
      sessionId 
    });

    scrapeGrowwHoldings(sessionId, accountName, brokerId).catch(error => {
      logger.error('💥 BACKGROUND SCRAPING FAILED', { 
        service: 'RAILWAY_API', 
        stage: 'BACKGROUND_ERROR', 
        flow: 'SCRAPE_START',
        sessionId, 
        error: error.message,
        stack: error.stack 
      });
    });

    logger.info('✅ SCRAPE START RESPONSE SENT', { 
      service: 'RAILWAY_API', 
      stage: 'RESPONSE_SENT', 
      flow: 'SCRAPE_START',
      sessionId 
    });

    res.json({
      success: true,
      sessionId,
      message: 'Scraping started'
    });

  } catch (error) {
    logger.error('💥 SCRAPE START ENDPOINT ERROR', { 
      service: 'RAILWAY_API', 
      stage: 'ENDPOINT_ERROR', 
      flow: 'SCRAPE_START',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    });
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
    
    logger.info('📊 STATUS REQUEST RECEIVED', { 
      service: 'RAILWAY_API', 
      stage: 'STATUS_REQUEST', 
      flow: 'STATUS_CHECK',
      sessionId 
    });

    // Fetch from database
    const session = await getScrapeSession(sessionId);
    
    if (!session) {
      logger.warn('⚠️ SESSION NOT FOUND', { 
        service: 'RAILWAY_API', 
        stage: 'SESSION_NOT_FOUND', 
        flow: 'STATUS_CHECK',
        sessionId 
      });
      return res.status(404).json({
        error: 'Session not found',
        sessionId
      });
    }

    logger.info('✅ STATUS RESPONSE SENT', { 
      service: 'RAILWAY_API', 
      stage: 'STATUS_RESPONSE', 
      flow: 'STATUS_CHECK',
      sessionId,
      status: session.status,
      progress: session.progress 
    });

    res.json({
      sessionId,
      status: session.status,
      progress: session.progress,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('💥 STATUS ENDPOINT ERROR', { 
      service: 'RAILWAY_API', 
      stage: 'STATUS_ERROR', 
      flow: 'STATUS_CHECK',
      sessionId: req.params.sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    });
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

// Test Browserless.io connection
router.get('/test-browserless', async (req, res) => {
  try {
    logger.info('🧪 TESTING BROWSERLESS.IO CONNECTION', { 
      service: 'RAILWAY_API', 
      stage: 'BROWSERLESS_TEST', 
      flow: 'CONNECTION_TEST',
      BROWSERLESS_URL,
      hasToken: !!BROWSERLESS_TOKEN 
    });

    const browserWSEndpoint = `${BROWSERLESS_URL}?token=${BROWSERLESS_TOKEN}`;
    
    // Test connection with shorter timeout
    const browser = await chromium.connect({ 
      wsEndpoint: browserWSEndpoint,
      timeout: 10000 // 10 seconds timeout for testing
    });

    await browser.close();
    
    logger.info('✅ BROWSERLESS.IO TEST SUCCESSFUL', { 
      service: 'RAILWAY_API', 
      stage: 'BROWSERLESS_TEST_SUCCESS', 
      flow: 'CONNECTION_TEST'
    });

    res.json({ 
      success: true, 
      message: 'Browserless.io connection test successful',
      endpoint: browserWSEndpoint 
    });

  } catch (error) {
    logger.error('💥 BROWSERLESS.IO TEST FAILED', { 
      service: 'RAILWAY_API', 
      stage: 'BROWSERLESS_TEST_FAILED', 
      flow: 'CONNECTION_TEST',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    });

    res.status(500).json({ 
      success: false, 
      error: 'Browserless.io connection test failed',
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
