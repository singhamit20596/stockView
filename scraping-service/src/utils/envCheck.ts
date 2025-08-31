import { logger } from './logger';

export interface EnvironmentCheck {
  USE_BROWSERLESS: boolean;
  BROWSERLESS_TOKEN: boolean;
  BROWSERLESS_REGION: boolean;
  allSet: boolean;
  missing: string[];
}

export function checkBrowserlessEnvironment(): EnvironmentCheck {
  const USE_BROWSERLESS = process.env.USE_BROWSERLESS?.toLowerCase() === 'true';
  const BROWSERLESS_TOKEN = !!process.env.BROWSERLESS_TOKEN;
  const BROWSERLESS_REGION = !!process.env.BROWSERLESS_REGION;

  const missing: string[] = [];
  
  if (!USE_BROWSERLESS) missing.push('USE_BROWSERLESS=true');
  if (!BROWSERLESS_TOKEN) missing.push('BROWSERLESS_TOKEN');
  if (!BROWSERLESS_REGION) missing.push('BROWSERLESS_REGION');

  const allSet = missing.length === 0;

  const check: EnvironmentCheck = {
    USE_BROWSERLESS,
    BROWSERLESS_TOKEN,
    BROWSERLESS_REGION,
    allSet,
    missing
  };

  logger.info('🔍 ENVIRONMENT CHECK', {
    service: 'ENV_CHECK',
    stage: 'BROWSERLESS_CONFIG',
    flow: 'ENVIRONMENT',
    check,
    environment: {
      USE_BROWSERLESS: process.env.USE_BROWSERLESS,
      BROWSERLESS_TOKEN: BROWSERLESS_TOKEN ? 'SET' : 'NOT_SET',
      BROWSERLESS_REGION: process.env.BROWSERLESS_REGION || 'production-sfo (default)'
    }
  });

  if (!allSet) {
    logger.warn('⚠️ BROWSERLESS.IO ENVIRONMENT INCOMPLETE', {
      service: 'ENV_CHECK',
      stage: 'MISSING_VARS',
      flow: 'ENVIRONMENT',
      missing,
      instructions: [
        'Add these environment variables to Railway:',
        'USE_BROWSERLESS=true',
        'BROWSERLESS_TOKEN=your_actual_token',
        'BROWSERLESS_REGION=production-sfo'
      ]
    });
  }

  return check;
}

export function logEnvironmentStatus(): void {
  const check = checkBrowserlessEnvironment();
  
  if (check.allSet) {
    logger.info('✅ BROWSERLESS.IO ENVIRONMENT READY', {
      service: 'ENV_CHECK',
      stage: 'READY',
      flow: 'ENVIRONMENT'
    });
  } else {
    logger.error('❌ BROWSERLESS.IO ENVIRONMENT INCOMPLETE', {
      service: 'ENV_CHECK',
      stage: 'INCOMPLETE',
      flow: 'ENVIRONMENT',
      missing: check.missing,
      willUseLocalBrowser: true
    });
  }
}
