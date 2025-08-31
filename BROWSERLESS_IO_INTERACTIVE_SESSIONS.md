# Browserless.io Interactive Browser Sessions (Hybrid Automation)

## Overview
This document contains comprehensive documentation for Browserless.io's hybrid automation features, allowing human intervention in automation workflows through interactive browser sessions.

## Hybrid Automation - Human in the Loop

**INFO**: Hybrid Automation is only available on paid plans.

Hybrid automation allows you to have humans intervene in an automation workflow, or even take complete control. This is useful in case a user needs to input their credentials, handle 2FA or simply perform some actions on a website before resuming automation. This can be done with Puppeteer, Playwright and virtually any library that supports CDP connections.

## Default Behavior

When creating a `liveURL` in our Chrome Devtools API, Browserless will return a one-time link to a webpage which you can share with your end-users. No API tokens or other secretive information is shared in this link, and no additional software or third-party packages are required.

### Key Features:
- **Screen Adaptation**: Mimics the underlying browser's screen to your end users, adjusting the browser to "fit" your end-users screen
- **Interactive**: Users can click, type, scroll, touch, or tap on the page by default
- **Compressed Video Stream**: Uses compressed video to preserve bandwidth
- **Configurable Quality**: Quality option with values of 1-100 to reduce network consumption
- **Single Tab Streaming**: By default, only the relevant page is streamed
- **Multi-Tab Support**: Can stream all tabs with `showBrowserInterface: true`

## Basic Hybrid Automation Example

```typescript
import { chromium } from 'playwright-core';
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const hybrid = async () => {
  const browser = await chromium.connectOverCDP(
    'wss://production-sfo.browserless.io/chromium/stealth?token=YOUR_API_TOKEN_HERE'
  );
  const [context] = await browser.contexts();
  const page = await context.newPage();
  await page.goto('https://www.browserless.io/', {
    waitUntil: 'networkidle'
  });
  const cdpSession = await context.newCDPSession(page);
  const { liveURL } = await cdpSession.send('Browserless.liveURL', {
    // If the aspect ratio will match the end user's display or be fixed.
    resizable: true,
    // If the page will be interactable or watch-only.
    interactable: true,
    // Set quality to "50" to help with bandwidth consumption.
    quality: 50,
    // Time to allow the live stream to run for.
    timeout: 60000,
  });
  console.log('Live URL:', liveURL);
  await sleep(30000);
  // More code or scripts...
  await browser.close();
};

hybrid();
```

## How to Stream a Remote Headless Browser

Browserless communicates with the browser at a CDP layer to return the `Browserless.liveURL`, which is a fully-qualified URL that doesn't require a token, which means you can share this with the end users. The URL can be opened in a new tab or displayed as an iFrame on your website where they will be able to click, type and interact with the browser.

### Key Events:
- **`Browserless.captchaFound`**: Fired when there's a captcha on the screen
- **`Browserless.liveComplete`**: Fired when a customer has completed their automation and closed the interactive tab

### Gmail Login Example:
```typescript
import { chromium } from 'playwright-core';

const login = async () => {
  const browser = await chromium.connectOverCDP(
    'wss://production-sfo.browserless.io/chromium/stealth?token=YOUR_API_TOKEN_HERE'
  );
  const [context] = await browser.contexts();
  const page = await context.newPage();

  await page.goto('https://www.browserless.io/', {
    waitUntil: 'networkidle'
  });
  const cdpSession = await context.newCDPSession(page);
  const { liveURL } = await cdpSession.send('Browserless.liveURL');

  // Send this one-time link to your end-users.
  // This URL doesn't contain an API-token so there's no
  // secrets being leaked by doing so
  console.log(`Shareable Public URL:`, liveURL);

  //This event is fired when a captcha is found on the page.
  await new Promise((resolve) =>
    cdpSession.on('Browserless.captchaFound', () => {
      console.log('Found a captcha!');
      return resolve();
    }),
  );

  // This event is fired after a user closes the page.
  // Assuming the page is where it's supposed to be, we can
  // proceed with doing further automations
  await new Promise((r) => cdpSession.on('Browserless.liveComplete', r));

  // Implement your scraping, data collections or further automations here.

  // Don't forget to close!
  browser.close();
};

login().catch((e) => console.log(e));
```

## Multiple Tab Workflows

For workflows that involve multiple tabs or separate windows, you can enable the `showBrowserInterface` option when creating the liveURL. This will allow you to stream all tabs in the browser, enabling your end users to switch between them as needed.

```typescript
import { chromium } from 'playwright-core';
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const hybrid = async () => {
  const browser = await chromium.connectOverCDP(
    'wss://production-sfo.browserless.io/chromium/stealth?token=YOUR_API_TOKEN_HERE'
  );
  const [context] = await browser.contexts();
  const page = await context.newPage();
  await page.goto('https://www.browserless.io/', {
    waitUntil: 'networkidle'
  });
  const cdpSession = await context.newCDPSession(page);
  const { liveURL } = await cdpSession.send('Browserless.liveURL', {
    // Enable the browser interface to show all tabs.
    showBrowserInterface: true,
    // Set quality to "50" to help with bandwidth consumption.
    quality: 50,
    // Time to allow the live stream to run for.
    timeout: 60000,
  });
  console.log('Live URL:', liveURL);
  await sleep(30000);
  // More code or scripts...
  await browser.close();
};

hybrid();
```

## Reusing the Session After Login

If you're using the hybrid automation for logging into a platform, you can reutilize the cookies, session and cache on subsequent browser sessions by using the Sessions workflow.

## Advanced Hybrid Automation Workflows

### Multiple LiveURL Sessions, Captcha Solving and More

The hybrid automation features can be combined to create more sophisticated workflows. Here's an example that demonstrates:

- Generating a LiveURL for user interaction
- Adding a countdown timer to show session limits
- Detecting and handling captchas
- Creating multiple LiveURL sessions in sequence
- Adding UI overlays to guide user behavior

```typescript
import { chromium } from 'playwright-core';
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Configuration for timeouts
// BROWSER_TIMEOUT: Total time the browser session can run (6 minutes)
// LIVE_URL_TIMEOUT: Time each LiveURL session can run (2 minutes)
const BROWSER_TIMEOUT = 6*60*1000; // 6 minutes in milliseconds
const LIVE_URL_TIMEOUT = 2*60*1000; // 2 minutes in milliseconds

const queryParams = new URLSearchParams({
  token: "YOUR_API_TOKEN_HERE",
  timeout: BROWSER_TIMEOUT,
  headless: true,
}).toString();

// Main automation function
(async() => {
  let browser = null;
  let sessionStartTime = null; // Tracks when each LiveURL session starts
  let browserStartTime = null; // Tracks when the browser session starts

  try {
    browser = await chromium.connectOverCDP(
      `wss://production-sfo.browserless.io/chromium/stealth?${queryParams}`
    );
    console.log('Connected to browserless.io!');

    const [context] = await browser.contexts();
    const page = await context.newPage();

    // Reinject banner after page navigation to maintain countdown
    page.on('load', async () => {
      if (sessionStartTime) {
        await injectTimeoutBanner(page, sessionStartTime, browserStartTime);
      }
    });

    // Initial page navigation and banner setup
    await page.goto('https://www.google.com', {
      waitUntil: 'networkidle'
    });
    console.log('Navigated');

    // Record start times and inject initial banner with the timer countdown so users know how much time they have left
    browserStartTime = Date.now();
    sessionStartTime = Date.now();
    await injectTimeoutBanner(page, sessionStartTime, browserStartTime);

    // Create first LiveURL session
    const cdpSession = await context.newCDPSession(page);
    const { liveURL } = await cdpSession.send('Browserless.liveURL', {
      timeout: LIVE_URL_TIMEOUT
    });
    //You can embed this liveURL in your website or send it to the user via email or text message
    console.log('Click for live experience:', liveURL);

    // Wait for CAPTCHA detection
    let captchaFound = false;
    await new Promise((resolve) =>
      cdpSession.on('Browserless.captchaFound', () => {
        console.log('Found a captcha!');
        captchaFound = true;
        return resolve();
      }),
    );

    // Only handle CAPTCHA if one was found
    if (captchaFound) {
      // Add full-screen overlay and notification when CAPTCHA is detected so the user can't interact with the page while it's being solved
      await addCaptchaOverlay(page);

      // Wait for user to close the live URL
      await new Promise((r) => cdpSession.on('Browserless.liveComplete', r));
      console.log(`Live URL closed on page: ${page.url()}`);

      // Solve the CAPTCHA
      const { solved, error } = await cdpSession.send('Browserless.solveCaptcha', {
        appearTimeout: 20000
      });

      await page.waitForNavigation({ waitUntil: 'networkidle' });
      console.log({
        solved,
        error,
      });
    }

    // Create second LiveURL session
    const { liveURL: newLiveURL } = await cdpSession.send('Browserless.liveURL', {
      timeout: LIVE_URL_TIMEOUT
    });
    console.log('Click for live experience:', newLiveURL);

    // Reset session timer for new LiveURL session
    sessionStartTime = Date.now();
    await injectTimeoutBanner(page, sessionStartTime, browserStartTime);

    // Wait for user to close the new live URL
    await new Promise((r) => cdpSession.on('Browserless.liveComplete', r));
    console.log(`Live URL closed on page: ${page.url()}`);


  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Ensure browser is always closed
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed successfully');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
})().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});

// Function to create and update the timeout banner
async function injectTimeoutBanner(page, startTime, browserStartTime) {
  // Wait 1 second to ensure page is fully loaded
  await sleep(1000);

  await page.evaluate((liveTimeoutMs, browserTimeoutMs, startTime, browserStartTime) => {
    // Remove existing banner if it exists
    const existingBanner = document.getElementById('timeout-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    // Create timeout banner with styling
    const banner = document.createElement('div');
    banner.id = 'timeout-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #333;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      z-index: 9999;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      font-size: 14px;
    `;

    // Function to update the countdown display
    const updateCountdown = () => {
      const elapsed = Date.now() - startTime;
      const browserElapsed = Date.now() - browserStartTime;
      const liveRemaining = Math.max(0, liveTimeoutMs - elapsed);
      const browserRemaining = Math.max(0, browserTimeoutMs - browserElapsed);
      const remaining = Math.min(liveRemaining, browserRemaining);

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      banner.textContent = `Session timeout in: ${minutes}:${seconds.toString().padStart(2, '0')}`;

      if (remaining <= 0) {
        banner.style.backgroundColor = '#ff0000';
        banner.textContent = 'Session expired!';
      } else if (remaining <= 30000) { // Last 30 seconds
        banner.style.backgroundColor = '#ff9900';
      }
    };

    // Initial update and set up interval for countdown
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    window.timeoutBannerInterval = intervalId;

    document.body.appendChild(banner);
  }, LIVE_URL_TIMEOUT, BROWSER_TIMEOUT, startTime, browserStartTime);
}

// Function to add overlay and notification when CAPTCHA is detected
async function addCaptchaOverlay(page) {
  await page.evaluate(() => {
    // Create full-screen overlay to block interaction
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      cursor: not-allowed;
    `;
    document.body.appendChild(overlay);

    // Create notification message
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #ff4444;
      color: white;
      padding: 15px 30px;
      border-radius: 5px;
      z-index: 9999;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;

    notification.textContent = 'Please close this tab so that we can perform some tasks (solve captcha in this case)';
    document.body.appendChild(notification);
  });
}
```

## LiveURL Configuration Options

### Basic Options
```typescript
const { liveURL } = await cdpSession.send('Browserless.liveURL', {
  // If the aspect ratio will match the end user's display or be fixed.
  resizable: true,
  // If the page will be interactable or watch-only.
  interactable: true,
  // Set quality to "50" to help with bandwidth consumption.
  quality: 50,
  // Time to allow the live stream to run for.
  timeout: 60000,
  // Enable the browser interface to show all tabs.
  showBrowserInterface: false,
});
```

### Advanced Options
```typescript
const { liveURL } = await cdpSession.send('Browserless.liveURL', {
  // Screen adaptation
  resizable: true, // Adjust browser to fit user's screen
  
  // Interaction settings
  interactable: true, // Allow user interaction
  
  // Quality and performance
  quality: 50, // Video quality (1-100)
  
  // Timeout settings
  timeout: 60000, // LiveURL session timeout
  
  // Multi-tab support
  showBrowserInterface: true, // Show all browser tabs
  
  // Custom styling
  customCSS: `
    body { 
      background-color: #f0f0f0; 
    }
  `,
});
```

## Event Handling

### Captcha Detection
```typescript
// Listen for captcha detection
cdpSession.on('Browserless.captchaFound', () => {
  console.log('Captcha detected on the page!');
  // Handle captcha - could trigger automated solving or user notification
});

// Wait for captcha detection
await new Promise((resolve) =>
  cdpSession.on('Browserless.captchaFound', () => {
    console.log('Found a captcha!');
    return resolve();
  }),
);
```

### Session Completion
```typescript
// Listen for session completion
cdpSession.on('Browserless.liveComplete', () => {
  console.log('User has closed the interactive session');
  // Resume automation or perform cleanup
});

// Wait for session completion
await new Promise((r) => cdpSession.on('Browserless.liveComplete', r));
```

## Use Cases and Best Practices

### 1. User Authentication Workflows
```typescript
const handleUserLogin = async () => {
  const browser = await chromium.connectOverCDP(
    'wss://production-sfo.browserless.io/chromium/stealth?token=YOUR_API_TOKEN'
  );
  const page = await browser.newPage();
  
  // Navigate to login page
  await page.goto('https://example.com/login');
  
  // Create interactive session for user login
  const cdpSession = await page.context().newCDPSession(page);
  const { liveURL } = await cdpSession.send('Browserless.liveURL', {
    timeout: 300000, // 5 minutes for login
    quality: 80, // Higher quality for login forms
  });
  
  console.log('Share this URL with user for login:', liveURL);
  
  // Wait for user to complete login
  await new Promise((r) => cdpSession.on('Browserless.liveComplete', r));
  
  // Verify login success
  const isLoggedIn = await page.$('.user-dashboard') !== null;
  
  if (isLoggedIn) {
    console.log('User successfully logged in');
    // Continue with automated tasks
  } else {
    console.log('Login failed or incomplete');
  }
  
  await browser.close();
};
```

### 2. Multi-Step Workflows
```typescript
const multiStepWorkflow = async () => {
  const browser = await chromium.connectOverCDP(
    'wss://production-sfo.browserless.io/chromium/stealth?token=YOUR_API_TOKEN'
  );
  const page = await browser.newPage();
  const cdpSession = await page.context().newCDPSession(page);
  
  // Step 1: User setup
  await page.goto('https://example.com/setup');
  const { liveURL: setupURL } = await cdpSession.send('Browserless.liveURL', {
    timeout: 180000,
    showBrowserInterface: true, // Allow tab switching
  });
  
  console.log('Step 1 - Setup:', setupURL);
  await new Promise((r) => cdpSession.on('Browserless.liveComplete', r));
  
  // Step 2: Configuration
  await page.goto('https://example.com/configure');
  const { liveURL: configURL } = await cdpSession.send('Browserless.liveURL', {
    timeout: 120000,
  });
  
  console.log('Step 2 - Configuration:', configURL);
  await new Promise((r) => cdpSession.on('Browserless.liveComplete', r));
  
  // Step 3: Verification
  await page.goto('https://example.com/verify');
  const { liveURL: verifyURL } = await cdpSession.send('Browserless.liveURL', {
    timeout: 60000,
  });
  
  console.log('Step 3 - Verification:', verifyURL);
  await new Promise((r) => cdpSession.on('Browserless.liveComplete', r));
  
  await browser.close();
};
```

### 3. Captcha Handling
```typescript
const handleCaptchaWorkflow = async () => {
  const browser = await chromium.connectOverCDP(
    'wss://production-sfo.browserless.io/chromium/stealth?token=YOUR_API_TOKEN'
  );
  const page = await browser.newPage();
  const cdpSession = await page.context().newCDPSession(page);
  
  await page.goto('https://example.com/protected-page');
  
  // Create interactive session
  const { liveURL } = await cdpSession.send('Browserless.liveURL', {
    timeout: 300000,
  });
  
  console.log('Interactive session:', liveURL);
  
  // Listen for captcha detection
  let captchaDetected = false;
  cdpSession.on('Browserless.captchaFound', () => {
    console.log('Captcha detected!');
    captchaDetected = true;
  });
  
  // Wait for user interaction
  await new Promise((r) => cdpSession.on('Browserless.liveComplete', r));
  
  if (captchaDetected) {
    // Attempt automated captcha solving
    const { solved, error } = await cdpSession.send('Browserless.solveCaptcha', {
      appearTimeout: 30000,
    });
    
    if (solved) {
      console.log('Captcha solved automatically');
    } else {
      console.log('Captcha solving failed:', error);
      // Could create another interactive session for manual solving
    }
  }
  
  await browser.close();
};
```

## Security Considerations

### URL Security
- LiveURLs are one-time use and don't contain API tokens
- URLs expire after the specified timeout
- No sensitive information is exposed in the URL

### Session Isolation
- Each LiveURL session is isolated from others
- User interactions are sandboxed to the specific session
- No access to underlying automation code or tokens

### Best Practices
```typescript
// Secure LiveURL generation
const createSecureLiveURL = async (page, options = {}) => {
  const cdpSession = await page.context().newCDPSession(page);
  
  const secureOptions = {
    timeout: 300000, // 5 minutes max
    quality: 50, // Balanced quality
    interactable: true,
    resizable: true,
    showBrowserInterface: false, // Disable multi-tab for security
    ...options
  };
  
  const { liveURL } = await cdpSession.send('Browserless.liveURL', secureOptions);
  
  // Log for audit purposes
  console.log(`LiveURL created at ${new Date().toISOString()}`);
  
  return { liveURL, cdpSession };
};
```

## Performance Optimization

### Bandwidth Management
```typescript
// Optimize for mobile devices
const mobileOptimizedLiveURL = async (page) => {
  const cdpSession = await page.context().newCDPSession(page);
  
  const { liveURL } = await cdpSession.send('Browserless.liveURL', {
    quality: 30, // Lower quality for mobile
    timeout: 180000, // 3 minutes
    resizable: true, // Adapt to mobile screen
  });
  
  return { liveURL, cdpSession };
};

// High-quality for desktop
const desktopOptimizedLiveURL = async (page) => {
  const cdpSession = await page.context().newCDPSession(page);
  
  const { liveURL } = await cdpSession.send('Browserless.liveURL', {
    quality: 80, // Higher quality for desktop
    timeout: 600000, // 10 minutes
    resizable: true,
  });
  
  return { liveURL, cdpSession };
};
```

### Timeout Management
```typescript
// Dynamic timeout based on workflow complexity
const getOptimalTimeout = (workflowType) => {
  const timeouts = {
    'login': 300000, // 5 minutes
    'setup': 600000, // 10 minutes
    'verification': 180000, // 3 minutes
    'captcha': 120000, // 2 minutes
  };
  
  return timeouts[workflowType] || 300000; // Default 5 minutes
};

const createWorkflowLiveURL = async (page, workflowType) => {
  const timeout = getOptimalTimeout(workflowType);
  const cdpSession = await page.context().newCDPSession(page);
  
  const { liveURL } = await cdpSession.send('Browserless.liveURL', {
    timeout,
    quality: 60,
    interactable: true,
  });
  
  return { liveURL, cdpSession, timeout };
};
```

## Error Handling

### Robust Error Handling
```typescript
const createLiveURLWithErrorHandling = async (page, options = {}) => {
  try {
    const cdpSession = await page.context().newCDPSession(page);
    
    const { liveURL } = await cdpSession.send('Browserless.liveURL', {
      timeout: 300000,
      quality: 50,
      interactable: true,
      ...options
    });
    
    return { liveURL, cdpSession, success: true };
    
  } catch (error) {
    console.error('Failed to create LiveURL:', error);
    
    // Fallback to basic session
    return {
      liveURL: null,
      cdpSession: null,
      success: false,
      error: error.message
    };
  }
};

// Usage with error handling
const { liveURL, cdpSession, success } = await createLiveURLWithErrorHandling(page);

if (success) {
  console.log('LiveURL created:', liveURL);
  // Continue with workflow
} else {
  console.log('Failed to create LiveURL, using fallback approach');
  // Implement fallback logic
}
```

## Integration Patterns

### Web Application Integration
```typescript
// Express.js endpoint to create LiveURL
app.post('/api/create-live-session', async (req, res) => {
  try {
    const { workflowType, targetUrl } = req.body;
    
    const browser = await chromium.connectOverCDP(
      'wss://production-sfo.browserless.io/chromium/stealth?token=YOUR_API_TOKEN'
    );
    const page = await browser.newPage();
    
    await page.goto(targetUrl);
    
    const { liveURL, cdpSession } = await createWorkflowLiveURL(page, workflowType);
    
    // Store session info for later use
    const sessionId = generateSessionId();
    activeSessions.set(sessionId, { browser, cdpSession, page });
    
    res.json({
      success: true,
      sessionId,
      liveURL,
      expiresAt: new Date(Date.now() + 300000).toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// WebSocket endpoint for real-time updates
app.ws('/api/session-updates/:sessionId', (ws, req) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);
  
  if (session) {
    session.cdpSession.on('Browserless.liveComplete', () => {
      ws.send(JSON.stringify({ type: 'session_completed' }));
    });
    
    session.cdpSession.on('Browserless.captchaFound', () => {
      ws.send(JSON.stringify({ type: 'captcha_detected' }));
    });
  }
});
```

### Mobile App Integration
```typescript
// React Native example
const createMobileLiveSession = async (targetUrl) => {
  const response = await fetch('https://your-api.com/api/create-live-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflowType: 'mobile_login',
      targetUrl
    })
  });
  
  const { liveURL, sessionId } = await response.json();
  
  // Open LiveURL in WebView or external browser
  Linking.openURL(liveURL);
  
  return { sessionId, liveURL };
};
```

## Troubleshooting

### Common Issues and Solutions

#### 1. LiveURL Not Loading
```typescript
// Check if browser is still connected
const checkBrowserConnection = async (browser) => {
  try {
    await browser.newPage();
    return true;
  } catch (error) {
    console.error('Browser connection lost:', error);
    return false;
  }
};

// Recreate LiveURL if needed
const recreateLiveURL = async (page) => {
  const isConnected = await checkBrowserConnection(page.context().browser());
  
  if (!isConnected) {
    throw new Error('Browser connection lost, cannot create LiveURL');
  }
  
  return await createLiveURLWithErrorHandling(page);
};
```

#### 2. Session Timeout Issues
```typescript
// Monitor session health
const monitorSessionHealth = (cdpSession, timeout) => {
  const startTime = Date.now();
  
  const healthCheck = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = timeout - elapsed;
    
    if (remaining <= 0) {
      console.warn('Session timeout approaching');
      clearInterval(healthCheck);
    } else if (remaining <= 30000) { // 30 seconds remaining
      console.log(`Session expires in ${Math.floor(remaining / 1000)} seconds`);
    }
  }, 10000); // Check every 10 seconds
  
  return healthCheck;
};
```

#### 3. Captcha Handling Failures
```typescript
// Fallback captcha handling
const handleCaptchaWithFallback = async (cdpSession, page) => {
  try {
    // Attempt automated solving
    const { solved, error } = await cdpSession.send('Browserless.solveCaptcha', {
      appearTimeout: 30000,
    });
    
    if (solved) {
      return { success: true, method: 'automated' };
    }
    
    // Fallback to manual solving
    console.log('Automated solving failed, creating manual session');
    const { liveURL } = await cdpSession.send('Browserless.liveURL', {
      timeout: 300000, // 5 minutes for manual solving
      quality: 80,
    });
    
    return { success: true, method: 'manual', liveURL };
    
  } catch (error) {
    console.error('Captcha handling failed:', error);
    return { success: false, error: error.message };
  }
};
```

## Best Practices Summary

### 1. Security
- Use appropriate timeouts for different workflows
- Disable `showBrowserInterface` when not needed
- Monitor session usage and implement rate limiting
- Log all LiveURL creations for audit purposes

### 2. Performance
- Adjust quality settings based on target device
- Use appropriate timeouts to prevent resource waste
- Implement proper cleanup of browser sessions
- Monitor bandwidth usage and optimize accordingly

### 3. User Experience
- Provide clear instructions to users
- Use countdown timers to show session limits
- Implement proper error handling and fallbacks
- Create intuitive UI overlays for guidance

### 4. Reliability
- Implement retry logic for failed LiveURL creation
- Monitor session health and implement recovery
- Handle edge cases like network disconnections
- Provide fallback mechanisms for critical workflows

### 5. Integration
- Design APIs for easy integration with web/mobile apps
- Implement WebSocket connections for real-time updates
- Use proper session management and cleanup
- Provide comprehensive error reporting and logging
