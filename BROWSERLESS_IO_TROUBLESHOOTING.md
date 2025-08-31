# Browserless.io Troubleshooting Documentation

## Overview
This document contains comprehensive troubleshooting guides for Browserless.io, including timeout issues, HTTP error codes, best practices, and performance optimization.

## Timeout Issues

### Types of Timeouts
- **Session Timeouts**: Maximum duration a browser session can run
- **Navigation Timeouts**: Time to wait for page navigation to complete
- **Selector Timeouts**: Time to wait for elements to appear on the page
- **Action Timeouts**: Time to wait for user actions like clicks, typing, etc.

### Global Session Timeouts by Plan

| Plan | Max Session Time | Concurrent Browsers |
|------|------------------|-------------------|
| Free | 60 seconds | 1 |
| Prototyping | 15 minutes | 3 |
| Starter | 30 minutes | 20 |
| Scale | 60 minutes | 50 |
| Enterprise | Custom | Custom |

### Overriding Session Timeouts

```typescript
import { chromium } from "playwright";

const browser = await chromium.connectOverCDP(
  `wss://production-sfo.browserless.io/chrome?token=YOUR_API_TOKEN_HERE&timeout=300000`
);
```

### Navigation Timeouts

```typescript
await page.goto('https://example.com', {
  timeout: 60000,
  waitUntil: 'networkidle'
});
```

### Selector Timeouts

```typescript
await page.waitForSelector('#my-element', {
  timeout: 60000,
  state: 'visible'
});
```

### Setting Default Timeouts

```typescript
page.setDefaultTimeout(60000);
page.setDefaultNavigationTimeout(90000);
```

## HTTP Error Codes

### Common Error Codes

#### 400 Bad Request
- Malformed JSON payload
- Invalid fields for specific API
- Timeout set to negative number or over 1800000 ms
- Argument collisions

#### 401 Unauthorized
- API key not sent properly in WebSocket endpoint
- HTTP client caching old/invalid API key
- Using endpoint not supported by your plan

#### 403 Forbidden
- Using deprecated endpoint (e.g., `https://chrome.browserless.io`)
- Incorrect regional endpoint
- API key lacks necessary permissions

#### 404 Not Found
- Requesting non-existent endpoint

#### 408 Request Timeout
- Timeout set too low
- Waiting for selector or event that doesn't exist
- Unhealthy/unresponsive dedicated workers
- Exceeding plan's maximum session time

#### 429 Too Many Requests
- Exceeding plan's concurrent browser session limit
- Not closing browser sessions properly
- "Zombie" sessions counting against limit

### Proper Browser Closure

#### Puppeteer Example
```typescript
const puppeteer = require('puppeteer-core');

async function runAutomation() {
  let browser = null;
  
  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: 'wss://production-sfo.browserless.io/chrome?token=YOUR_API_KEY&timeout=300000',
    });
    
    const page = await browser.newPage();
    await page.goto('https://example.com');
    
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    return { success: true, data: title };
  } catch (error) {
    console.error('Automation error:', error);
    return { success: false, error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
```

#### Playwright Example
```typescript
const { chromium } = require('playwright-core');

async function runAutomation() {
  let browser = null;
  
  try {
    browser = await chromium.connectOverCDP(
      'wss://production-sfo.browserless.io/chrome?token=YOUR_API_KEY&timeout=300000'
    );
    
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://example.com');
    
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    return { success: true, data: title };
  } catch (error) {
    console.error('Automation error:', error);
    return { success: false, error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
```

## Best Practices

### Optimize Page Navigation

```typescript
// Fast navigation - use when you only need DOM content
await page.goto('https://example.com', {
  waitUntil: 'domcontentloaded',
  timeout: 30000
});

// Use networkidle only when you need all resources loaded
await page.goto('https://spa-app.com', {
  waitUntil: 'networkidle',
  timeout: 60000
});
```

### Monitor Network Requests

```typescript
// Monitor failed requests
page.on('requestfailed', request => {
  console.error(`Request failed: ${request.url()} - ${request.failure()}`);
});

// Monitor response errors
page.on('response', response => {
  if (!response.ok()) {
    console.error(`Response error: ${response.url()} - ${response.status()}`);
  }
});

// Monitor page errors
page.on('pageerror', error => {
  console.error(`Page error: ${error.message}`);
});
```

### Handle Browser Disconnections

```typescript
// Monitor browser disconnection
browser.on('disconnected', () => {
  console.error('Browser disconnected unexpectedly');
  // Implement reconnection logic or graceful shutdown
});

try {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  // Your automation logic here
} catch (error) {
  console.error('Automation failed:', error.message);
} finally {
  if (browser.isConnected()) {
    await browser.close();
  }
}
```

### BrowserlessHelper Class

```typescript
class BrowserlessHelper {
  constructor(token, region = 'production-sfo') {
    this.token = token;
    this.region = region;
    this.browser = null;
    this.page = null;
  }

  async connect() {
    this.browser = await chromium.connectOverCDP(
      `wss://${this.region}.browserless.io/chrome?token=${this.token}`
    );

    this.setupBrowserMonitoring();
    return this.browser;
  }

  async createPage() {
    if (!this.browser) {
      throw new Error('Browser not connected. Call connect() first.');
    }

    this.page = await this.browser.newPage();
    this.setupPageMonitoring();
    return this.page;
  }

  setupBrowserMonitoring() {
    this.browser.on('disconnected', () => {
      console.error('Browser disconnected unexpectedly');
    });
  }

  setupPageMonitoring() {
    this.page.on('requestfailed', request => {
      console.error(`Request failed: ${request.url()} - ${request.failure()}`);
    });

    this.page.on('response', response => {
      if (!response.ok()) {
        console.error(`Response error: ${response.url()} - ${response.status()}`);
      }
    });

    this.page.on('pageerror', error => {
      console.error(`Page error: ${error.message}`);
    });
  }

  async navigateWithRetry(url, options = {}) {
    const defaultOptions = {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
      ...options
    };

    const maxRetries = 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.goto(url, defaultOptions);
        return;
      } catch (error) {
        lastError = error;
        console.warn(`Navigation attempt ${i + 1} failed: ${error.message}`);
        
        if (i < maxRetries - 1) {
          await this.delay(1000 * (i + 1)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  async cleanup() {
    try {
      if (this.browser && this.browser.isConnected()) {
        await this.browser.close();
      }
    } catch (error) {
      console.error('Error during cleanup:', error.message);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Security Best Practices

```typescript
// Block dangerous requests
await page.route('**/*', route => {
  const url = route.request().url();
  
  // Block file:// protocol requests
  if (url.startsWith('file://')) {
    console.warn(`Blocked file:// request: ${url}`);
    route.abort();
    return;
  }
  
  // Block localhost and private IP ranges
  const dangerousPatterns = [
    /^https?:\/\/localhost/,
    /^https?:\/\/127\./,
    /^https?:\/\/10\./,
    /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./,
    /^https?:\/\/192\.168\./,
    /^https?:\/\/169\.254\./ // Link-local addresses
  ];
  
  const isDangerous = dangerousPatterns.some(pattern => pattern.test(url));
  
  if (isDangerous) {
    console.warn(`Blocked potentially dangerous request: ${url}`);
    route.abort();
    return;
  }
  
  route.continue();
});
```

### Environment-Based Browser Connection

```typescript
const createBrowser = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return await chromium.connectOverCDP(
      `wss://production-sfo.browserless.io/chrome?token=${process.env.BROWSERLESS_TOKEN}`
    );
  } else {
    return await chromium.launch({
      headless: false,
      devtools: true,
      slowMo: 100,
    });
  }
};
```

### Screenshot on Error

```typescript
class ScreenshotManager {
  constructor(screenshotDir = './screenshots') {
    this.screenshotDir = screenshotDir;
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  generateFilename(prefix = 'error') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(this.screenshotDir, `${prefix}-${timestamp}.png`);
  }

  async captureError(page, error, context = '') {
    const filename = this.generateFilename('error');
    
    try {
      await page.screenshot({
        path: filename,
        fullPage: true,
        type: 'png'
      });

      console.error(`Error occurred${context ? ` in ${context}` : ''}: ${error.message}`);
      console.log(`Screenshot saved: ${filename}`);
      
      return filename;
    } catch (screenshotError) {
      console.error('Failed to capture error screenshot:', screenshotError.message);
      return null;
    }
  }
}
```

## Version Compatibility

### Current Versions (February 24, 2025)

- **Puppeteer**: 24.2.1
- **Playwright**: 1.50.1, 1.49.1, 1.48.2, 1.47.2, 1.46.1, 1.45.3, 1.44.1, 1.43.1, 1.42.1, 1.41.2
- **Chromium**: 133.0.6943.16
- **Chrome**: 133.0.6943.127
- **Firefox**: 134.0
- **Webkit**: 18.2

### Browser Binary Differences

**Default path (Chromium):**
```
wss://production-sfo.browserless.io?token=YOUR_TOKEN
```

**Chrome path (with enhanced codec support):**
```
wss://production-sfo.browserless.io/chrome?token=YOUR_TOKEN
```

### When to Use Chrome Binaries

- You see "browser not currently supported" error messages
- Working with streaming platforms (Twitch, YouTube, Netflix, etc.)
- Sites that require proprietary codecs
- Video conferencing platforms that need specific media capabilities

## Performance Optimization

### Regional Endpoint Selection

| Your Location | Recommended Endpoint |
|---------------|---------------------|
| North America, South America | production-sfo.browserless.io |
| Europe, Africa, Middle East | production-lon.browserless.io |
| Europe (alternative) | production-ams.browserless.io |

### Connection Optimization

```typescript
// Choose the region closest to your application
const regions = {
  'us-west': 'production-sfo.browserless.io',
  'us-east': 'production-nyc.browserless.io',
  'europe': 'production-lon.browserless.io'
};

const browser = await chromium.connectOverCDP(
  `wss://${regions['us-west']}/chrome?token=YOUR_API_TOKEN_HERE&timeout=300000`
);
```

### Reduce Network Round-trips

```typescript
// DON'T DO - Multiple round-trips
const button = await page.locator('.buy-now');
const buttonText = await button.textContent();
const isVisible = await button.isVisible();
await button.click();

// DO - Single round-trip
const result = await page.evaluate(() => {
  const button = document.querySelector('.buy-now');
  const buttonText = button.textContent;
  const isVisible = button.offsetParent !== null;
  button.click();
  
  return { buttonText, isVisible, clicked: true };
});
```

## IP Whitelisting

### Cloud-Subscription Plans (Shared Fleet)

**Date of last update: March/28/2025**

Current IP Addresses (partial list):
```
146.190.53.75, 146.190.53.72, 146.190.175.184, 147.182.250.161
164.92.125.142, 164.92.125.134, 146.190.143.216, 146.190.127.114
146.190.143.212, 24.199.123.163, 24.199.111.199, 146.190.159.230
146.190.159.176, 24.199.103.126, 159.223.205.248, 137.184.226.226
146.190.159.171, 24.144.81.223, 137.184.235.213, 146.190.139.82
164.92.125.23, 159.223.205.48, 146.190.159.67, 164.92.125.19
```

## Getting Help

If you continue to experience issues after following this guide:

- Check your plan's timeout limits in your account dashboard
- Contact Browserless support for assistance
- For free plan users experiencing frequent timeouts, we recommend upgrading to a paid plan for longer session durations and better performance

## Related Documentation

- **Timeout Issues** - Comprehensive timeout configuration guide
- **Slow Response Times** - Performance optimization strategies
- **Session Management** - Managing browser sessions effectively
- **Connection URLs** - Optimizing connection parameters
