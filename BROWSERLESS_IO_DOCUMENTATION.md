# Browserless.io Documentation Reference

## Overview
This document contains comprehensive Browserless.io connection documentation, examples, and best practices for Playwright integration.

## Connection Methods

### 1. CDP Method (RECOMMENDED)
**Most reliable and recommended approach for Browserless.io**

```typescript
import { chromium } from "playwright-core";

// Connect to Browserless using CDP (recommended method)
const browser = await chromium.connectOverCDP(
  "wss://production-sfo.browserless.io/chrome?token=YOUR_API_TOKEN_HERE"
);
```

### 2. Connect Method (More Restrictive)
**Limited support for Browserless advanced features**

```typescript
import { chromium } from "playwright-core";

// Connect using Playwright's built-in protocol
const browser = await chromium.connect(
  `wss://production-sfo.browserless.io/chrome/playwright?token=${TOKEN}`
);
```

## Connection URL Patterns

### Base Pattern
```
wss://production-region.browserless.io/browser/optional?token=YOUR_API_TOKEN_HERE
```

### CDP Method URLs
- **Chrome**: `wss://production-sfo.browserless.io/chrome?token=YOUR_TOKEN`
- **Chromium**: `wss://production-sfo.browserless.io/chromium?token=YOUR_TOKEN`

### Connect Method URLs
- **Chrome**: `wss://production-sfo.browserless.io/chrome/playwright?token=YOUR_TOKEN`
- **Chromium**: `wss://production-sfo.browserless.io/chromium/playwright?token=YOUR_TOKEN`
- **Firefox**: `wss://production-sfo.browserless.io/firefox/playwright?token=YOUR_TOKEN`
- **WebKit**: `wss://production-sfo.browserless.io/webkit/playwright?token=YOUR_TOKEN`
- **Edge**: `wss://production-sfo.browserless.io/edge/playwright?token=YOUR_TOKEN`

## Launch Options Configuration

### Using Launch Parameter (RECOMMENDED)
```typescript
import { chromium } from "playwright-core";

// Define launch options
const launchOptions = {
  timeout: '180000',
  headless: false,
  args: [
    '--window-size=1920,1080', 
    '--force-color-profile=srgb'
  ]
};

// Create query parameters
const queryParams = new URLSearchParams({
  token: 'YOUR_API_TOKEN_HERE',
  proxy: 'residential',
  proxyCountry: 'us',
  proxySticky: 'true',
  launch: JSON.stringify(launchOptions)
});

const browser = await chromium.connectOverCDP(
  `wss://production-sfo.browserless.io/chrome?${queryParams.toString()}`
);
```

### Available Chrome Flags (All Plans)
```typescript
const launchOptions = {
  args: [
    '--disable-features',
    '--disable-setuid-sandbox',
    '--disable-site-isolation-trials',
    '--disable-web-security',
    '--enable-features',
    '--font-render-hinting',
    '--force-color-profile',
    '--lang',
    '--proxy-bypass-list',
    '--proxy-server',
    '--window-size'
  ]
};
```

## Browserless-Specific Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `launch` | Launch options containing Browserless-specific options and Chrome flags | `{}` |
| `token` | Authorization token for API access | `none` |
| `timeout` | Maximum session duration in milliseconds | `60000` |
| `headless` | Runs browser in headless mode | `true` |
| `stealth` | Enables stealth mode to reduce automation signals | `false` |
| `proxy` | Routes browser traffic through proxy | `none` |
| `proxyCountry` | Specifies exit node's country (ISO 3166 codes) | `none` |
| `proxySticky` | Maintains same proxy IP across session | `false` |
| `record` | Enables session recording functionality | `false` |
| `blockAds` | Enables built-in ad blocker | `false` |
| `slowMo` | Adds delays between browser actions (ms) | `0` |
| `ignoreDefaultArgs` | Controls which default arguments to ignore | `false` |
| `ignoreHTTPSErrors` | Ignores HTTPS certificate errors | `false` |

## Session Timeout Limits by Plan

| Plan | Max Session Time | Concurrent Browsers |
|------|------------------|-------------------|
| Free | 60 seconds | 1 |
| Prototyping | 15 minutes | 3 |
| Starter | 30 minutes | 20 |
| Scale | 60 minutes | 50 |
| Enterprise | Custom | Custom |

## Migration from Local Chrome to Browserless

### Before Browserless
```typescript
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
// ...
```

### After Browserless
```typescript
import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP(
  `wss://production-sfo.browserless.io/chrome?token=YOUR_API_TOKEN_HERE`
);
const page = await browser.newPage();
// ...
```

## Complete Example with All Features

```typescript
import { chromium } from "playwright-core";

// Define comprehensive launch options
const launchOptions = {
  timeout: '300000', // 5 minutes
  headless: false,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--window-size=1920,1080',
    '--force-color-profile=srgb'
  ]
};

// Create query parameters with all options
const queryParams = new URLSearchParams({
  token: 'YOUR_API_TOKEN_HERE',
  launch: JSON.stringify(launchOptions),
  stealth: 'true',
  blockAds: 'true',
  slowMo: '100'
});

// Connect using CDP method
const browser = await chromium.connectOverCDP(
  `wss://production-sfo.browserless.io/chrome?${queryParams.toString()}`
);

const context = await browser.newContext();
const page = await context.newPage();

// Navigate and perform actions
await page.goto("https://www.example.com/");
await page.screenshot({ path: "screenshot.png" });

// Clean up
await browser.close();
```

## Using Proxies

### Residential Proxy Example
```typescript
const queryParams = new URLSearchParams({
  token: 'YOUR_API_TOKEN_HERE',
  proxy: 'residential',
  proxyCountry: 'us',
  proxySticky: 'true'
});

const browser = await chromium.connectOverCDP(
  `wss://production-sfo.browserless.io/chrome?${queryParams.toString()}`
);
```

### Third Party Proxy Example
```typescript
const browser = await chromium.connectOverCDP(
  `wss://production-sfo.browserless.io/chrome?token=YOUR_API_TOKEN_HERE`
);

const context = await browser.newContext({
  proxy: {
    server: "http://domain:port",
    username: "username",
    password: "password",
  },
});
```

## Error Handling Best Practices

### Common Error Codes
- **400 Bad Request**: Malformed request or invalid parameters
- **401 Unauthorized**: Invalid authentication credentials
- **403 Forbidden**: Server refuses to authorize request
- **408 Request Timeout**: Request took too long to process
- **429 Too Many Requests**: Rate limit exceeded

### Recommended Error Handling
```typescript
try {
  const browser = await chromium.connectOverCDP(
    `wss://production-sfo.browserless.io/chrome?token=${TOKEN}`
  );
  // ... your code
} catch (error) {
  if (error.message.includes('401')) {
    console.error('Invalid API token');
  } else if (error.message.includes('429')) {
    console.error('Rate limit exceeded');
  } else if (error.message.includes('timeout')) {
    console.error('Session timeout');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

## Performance Optimization Tips

1. **Use `playwright-core`** instead of full `playwright` package
2. **Use CDP method** for better reliability
3. **Set appropriate timeouts** based on your plan
4. **Use stealth mode** for anti-bot detection
5. **Enable ad blocking** for faster scraping
6. **Use residential proxies** for better success rates

## Troubleshooting

### Connection Issues
- Verify API token is valid
- Check regional endpoint selection
- Ensure proper URL format with `/chrome` path
- Verify plan limits and concurrent sessions

### Session Issues
- Check session timeout limits
- Verify launch options format
- Ensure proper browser cleanup
- Monitor concurrent session usage

### Performance Issues
- Use appropriate regional endpoints
- Enable stealth mode for complex sites
- Use residential proxies for better success
- Optimize launch options for your use case

---

# Session Management

## Session Management Approaches

Browserless offers two methods for managing persistent browser sessions:

### 1. Browser Sessions
Use the `Browserless.reconnect` CDP command to maintain state between connections. This approach works with all automation libraries and automatically manages session lifecycle through browser process persistence.

### 2. Session API
Provides explicit programmatic control over session creation and deletion through dedicated REST endpoints. This approach is designed for advanced use cases requiring precise lifecycle management.

## When to Use Each Approach

### Use Browser Sessions When:
- Working with existing automation scripts
- Need simple session persistence with minimal setup
- Want maximum compatibility across automation libraries
- Session lifetime is managed by your application logic
- You prefer CDP-based session management

### Use Session API When:
- Need explicit session lifecycle control through HTTP endpoints
- Building advanced session management workflows
- Want programmatic session creation/deletion capabilities
- Need session monitoring and metadata access
- Integrating with larger automation platforms or microservices

## Browser Sessions

### How Reconnection Works
When you use the `Browserless.reconnect` command, Browserless:
- Keeps the browser alive for the specified reconnection timeout duration after you disconnect
- Maintains browser state including cookies, localStorage, sessionStorage, and cache
- Allows reconnection to the same browser instance within the reconnection timeout window
- Automatically cleans up the browser instance after the reconnection timeout expires

### Creating a Browser Session
```typescript
import { chromium } from "playwright";

// Connect to browser with your API token
const browser = await chromium.connectOverCDP(
  "wss://production-sfo.browserless.io/chrome?token=YOUR_API_TOKEN",
);

const page = await browser.newPage();
const cdpSession = await page.context().newCDPSession(page); // Create CDP session for reconnection
await page.goto("https://example.com");

// Set up session state that will persist across reconnections
await page.evaluate(() => {
  localStorage.setItem("myData", "persistent-value");
});

// Enable reconnection with 60 second timeout (must be within plan limits)
const { error, browserWSEndpoint } = await cdpSession.send(
  "Browserless.reconnect",
  {
    timeout: 60000, // Browser stays alive for 60 seconds after disconnect
  },
);

if (error) throw new Error(error);
console.log("Reconnection endpoint:", browserWSEndpoint);

// Use disconnect() instead of close() to keep browser alive for reconnection
await browser.disconnect(); // Browser remains alive for 60 seconds
```

### Reconnection TTL Limitations by Plan

| Plan | Maximum Reconnection TTL | Overall Session Timeout |
|------|-------------------------|------------------------|
| Free | 10 seconds (10,000ms) | 60 seconds |
| Prototyping/Starter | 1 minute (60,000ms) | 15-30 minutes |
| Scale | 5 minutes (300,000ms) | 60 minutes |

### Reconnecting to Browser Sessions
```typescript
import { chromium } from 'playwright';

const queryParams = new URLSearchParams({
  token: 'YOUR_API_TOKEN',
  timeout: 60000,
}).toString();

console.log('Starting up the first browser and logging in...');
const browser1 = await chromium.connectOverCDP(
  `wss://production-sfo.browserless.io/chrome?${queryParams}`
);

const page1 = await browser1.newPage();
const cdpSession = await page1.context().newCDPSession(page1);

await page1.goto('https://practicetestautomation.com/practice-test-login/', {
  waitUntil: 'networkidle',
  timeout: 60000
});
await page1.fill('#username', 'student');
await page1.fill('#password', 'Password123');
await page1.click('#submit');

const { browserWSEndpoint } = await cdpSession.send('Browserless.reconnect', {
  timeout: 60000,
});
console.log('Login successful! Enabling reconnection, the browser will remain active for 60 seconds after disconnect. browserWSEndpoint:', browserWSEndpoint);

await browser1.disconnect(); // Browser must be disconnected, not closed.

const browser2 = await chromium.connectOverCDP(
  `${browserWSEndpoint}?${queryParams}`
);

// Get all pages and find the one that's not the about:blank page
const pages = await browser2.pages();
const page2 = pages.find(p => !p.url().startsWith('about:blank'));
const title = await page2.title();
await browser2.close();
console.log('Second browser closed - Demo complete! Page 2 title:', title);
```

## Session API

### Creating a Session via REST API
```typescript
// Configure session with explicit timeout and browser options
const sessionConfig = {
  ttl: 180000, // Session timeout: 3 minutes (180,000ms)
  stealth: true, // Enable stealth mode for bot detection bypass
  headless: false, // Run in headed mode for debugging
  args: [
    "--no-sandbox", // Required for containerized environments
    "--disable-dev-shm-usage", // Prevent shared memory issues
    "--disable-background-timer-throttling", // Maintain performance
  ],
};

// Create session via REST API
const response = await fetch(
  "https://production-sfo.browserless.io/session?token=YOUR_API_TOKEN",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionConfig),
  },
);

// Handle session creation errors
if (!response.ok) {
  throw new Error(
    `Failed to create session: ${response.status} "${await response.text()}"`,
  );
}

// Extract WebSocket connection URL for automation libraries
const session = await response.json();
console.log("Session created, browserWSEndpoint:", session.connect);
```

### Session Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| ttl | number | 300000 | Time-to-live in milliseconds (max 30 minutes) |
| stealth | boolean | false | Enable stealth mode to avoid detection |
| headless | boolean | true | Run browser in headless mode |
| args | string[] | [] | Additional Chrome launch arguments |
| proxy | object | null | Proxy configuration |

### Connecting to Session API
```typescript
import { chromium } from "playwright-core";

// Use the WebSocket URL returned from session creation
const connect = "wss://production-sfo.browserless.io/e/53...21/session/connect/b9..7b?token=25df...";

// Connect to the existing session
const browser = await chromium.connectOverCDP(connect);

const context = browser.contexts()[0]; // Use existing browser context
const page = await context.newPage();
await page.goto("https://example.com");
console.log(await page.url());

// Check if session state persists from previous connections
const foo = await page.evaluate(() => {
  return window.localStorage.getItem("foo");
});
if (foo) {
  console.log("LocalStorage foo exists:", foo); // State persisted
} else {
  console.log("LocalStorage foo does not exist, this is the first run");
}

// Session state is maintained by the Session API across connections
await page.evaluate(() => {
  localStorage.setItem("foo", "bar"); // This will persist for future connections
});

// Session remains active even after closing browser connection
await browser.close(); // Session continues running until TTL expires
```

## Session State Persistence

### Browser Sessions State Persistence
```typescript
// Browser sessions persist state using Browserless.reconnect and the browser process stays alive
const browser = await chromium.connectOverCDP(
  'wss://production-sfo.browserless.io/chrome?token=YOUR_API_TOKEN'
);

const page = await browser.newPage();
const cdpSession = await page.context().newCDPSession(page);
await page.goto('https://example.com');

// Set various types of state
await page.evaluate(() => {
  // Local storage persists
  localStorage.setItem('user_pref', 'dark_mode');

  // Session storage persists
  sessionStorage.setItem('temp_data', 'workflow_state');

  // IndexedDB persists
  const request = indexedDB.open('myDB', 1);
  // ... IndexedDB operations
});

// Cookies are automatically saved
await page.setCookie({
  name: 'session_token',
  value: 'abc123',
  domain: 'example.com'
});

// Set up reconnection before closing
const { browserWSEndpoint } = await cdpSession.send('Browserless.reconnect', {
  timeout: 60000,
});

await browser.disconnect();

// All state is preserved for reconnection within timeout window
// Use browserWSEndpoint for reconnection
```

### Session API State Persistence
```typescript
// Session API maintains state through explicit session management
const connect = 'wss://production-sfo.browserless.io/e/53...21/session/connect/b9..7b?token=25df...';

const browser = await chromium.connectOverCDP(connect);

const page = await browser.newPage();
await page.goto('https://example.com');

// State is preserved within the session's timeout period
await page.evaluate(() => {
  localStorage.setItem('api_session_data', 'preserved_value');
});

await browser.close();

// Reconnect to the same session
const browser2 = await chromium.connectOverCDP(connect);

const page2 = await browser2.newPage();
const data = await page2.evaluate(() =>
  localStorage.getItem('api_session_data')
); // Returns 'preserved_value'

await browser2.close();
```

## Closing Sessions

### Browser Session Cleanup
Browser sessions using `Browserless.reconnect` are automatically managed by Browserless. Sessions expire when their timeout period elapses.

#### Manual Cleanup (Optional)
```typescript
import { chromium } from 'playwright-core';

const cleanupSession = async (reconnectEndpoint) => {
  const browser = await chromium.connectOverCDP(
    reconnectEndpoint || 'wss://production-sfo.browserless.io/chrome?token=YOUR_API_TOKEN'
  );

  const page = await browser.newPage();

  try {
    // Perform logout to clear server-side sessions
    await page.goto('https://app.example.com/logout');
    await page.waitForNavigation();

    // Clear local storage and cookies
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Clear all cookies
    const cookies = await page.cookies();
    await page.deleteCookie(...cookies);

    console.log('Session cleaned up successfully');
  } catch (error) {
    console.error('Cleanup error:', error);
  } finally {
    await browser.close(); // Automatic cleanup when browser closes
  }
};

// Use in your workflow
await cleanupSession();
```

### Session API Stopping
```typescript
const stopSession = async (sessionCloseURL) => {
  try {
    const response = await fetch(
      // https://production-sfo.browserless.io/e/123456/session/123456?token=YOUR_API_TOKEN
      sessionCloseURL,
      {
        method: 'DELETE',
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log(`Session ${sessionCloseURL} stopped:`, result);
      return true;
    } else {
      console.error(`Failed to stop session ${sessionCloseURL}:`, response.status);
      return false;
    }
  } catch (error) {
    console.error(`Error stopping session ${sessionCloseURL}:`, error);
    return false;
  }
};

// Usage
await stopSession('https://production-sfo.browserless.io/e/123456/session/123456?token=YOUR_API_TOKEN');
```

## Session Management Best Practices

### Session Lifecycle Management
```typescript
// Implement session lifecycle tracking
class SessionManager {
  constructor() {
    this.activeSessions = new Map();
  }

  async createSession(params) {
    const response = await fetch('https://production-sfo.browserless.io/session?token=YOUR_API_TOKEN', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const { id, connect, stop } = await response.json();
    this.activeSessions.set(id, {
      created: Date.now(),
      ttl: params.ttl,
      params,
      connect,
      stop,
    });

    return id;
  }

  async deleteSession(id) {
    const session = this.activeSessions.get(id);
    if (session) {
      await fetch(
        session.stop,
        { method: 'DELETE' }
      );
      this.activeSessions.delete(id);
    }
  }

  async cleanupExpiredSessions() {
    const now = Date.now();
    for (const [id, info] of this.activeSessions) {
      if (now - info.created > info.ttl) {
        await this.deleteSession(id);
      }
    }
  }

  async shutdown() {
    // Clean up all active sessions
    const deletePromises = Array.from(this.activeSessions.keys()).map(
      id => this.deleteSession(id)
    );
    await Promise.all(deletePromises);
  }
}
```

### Browser Session Timeout Management
```typescript
// Dynamically adjust timeout based on workflow complexity
const getOptimalTimeout = (workflowType) => {
  const timeoutPresets = {
    'simple-scrape': 30000,    // 30 seconds
    'form-submission': 60000,   // 1 minute
    'multi-page-flow': 180000,  // 3 minutes
    'complex-automation': 300000 // 5 minutes
  };

  return timeoutPresets[workflowType] || 60000; // Default 1 minute
};

const createOptimizedSession = async (workflowType) => {
  const timeout = getOptimalTimeout(workflowType);

  const browser = await chromium.connectOverCDP(
    'wss://production-sfo.browserless.io/chrome?token=YOUR_API_TOKEN'
  );

  const page = await browser.newPage();
  const cdpSession = await page.context().newCDPSession(page);

  // Set up reconnection with optimized timeout
  const { browserWSEndpoint } = await cdpSession.send('Browserless.reconnect', {
    timeout,
  });

  return { browser, page, reconnectEndpoint: browserWSEndpoint, timeout };
};
```

### Connection Retry Logic
```typescript
// Retry session connection with exponential backoff
const connectWithRetry = async (endpoint, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const browser = await chromium.connectOverCDP(endpoint);

      // Test connection
      await browser.newPage();
      return browser;

    } catch (error) {
      console.log(`Connection attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw new Error(`Failed to connect after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff
      const delay = 1000 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

### Resource Optimization
```typescript
// Track session costs and usage
const trackSessionUsage = async (sessionId) => {
  const startTime = Date.now();

  // Your session operations here

  const endTime = Date.now();
  const durationMinutes = (endTime - startTime) / 60000;

  console.log(`Session ${sessionId} active for ${durationMinutes.toFixed(2)} minutes`);

  // Estimated cost calculation (adjust based on your plan)
  const costPerMinute = 0.01; // Example rate
  const estimatedCost = durationMinutes * costPerMinute;

  console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`);
};

// Comprehensive cleanup to prevent memory leaks
const performCleanup = async (page) => {
  try {
    // Clear large objects from memory
    await page.evaluate(() => {
      // Clear intervals and timeouts
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
        clearInterval(i);
      }

      // Clear large variables
      window.largeDataStructures = null;
      window.cachedResults = null;

      // Force garbage collection (if available)
      if (window.gc) {
        window.gc();
      }
    });

    // Clear browser cache
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCache');
    await client.send('Network.clearBrowserCookies');

  } catch (error) {
    console.warn('Cleanup error (non-critical):', error.message);
  }
};
```

### Security Best Practices
```typescript
// Secure handling of sensitive session data
const secureSessionCleanup = async (page) => {
  await page.evaluate(() => {
    // Clear sensitive data from localStorage
    const sensitiveKeys = [
      'authToken', 'accessToken', 'refreshToken',
      'password', 'creditCard', 'ssn',
      'userCredentials', 'paymentInfo', 'personalData'
    ];

    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Clear form data
    document.querySelectorAll('input[type="password"], input[type="email"]').forEach(input => {
      input.value = '';
    });

    // Clear any global variables that might contain sensitive data
    if (window.userData) window.userData = null;
    if (window.sessionData) window.sessionData = null;
  });

  // Clear cookies containing sensitive data
  const cookies = await page.cookies();
  const sensitiveCookies = cookies.filter(cookie =>
    /auth|token|session|login/i.test(cookie.name)
  );

  if (sensitiveCookies.length > 0) {
    await page.deleteCookie(...sensitiveCookies);
  }
};
```

### Monitoring and Alerting
```typescript
// Monitor session health
const performHealthCheck = async (sessionId) => {
  try {
    const response = await fetch(
      `https://production-sfo.browserless.io/session/${sessionId}?token=YOUR_API_TOKEN`
    );

    if (response.ok) {
      const sessionInfo = await response.json();
      return {
        healthy: true,
        sessionInfo,
        uptime: Date.now() - new Date(sessionInfo.created).getTime()
      };
    } else {
      return {
        healthy: false,
        status: response.status,
        message: response.statusText
      };
    }
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    };
  }
};

// Automated health monitoring
const startHealthMonitoring = (sessionIds, intervalMs = 30000) => {
  const healthChecks = sessionIds.map(sessionId => {
    return setInterval(async () => {
      const health = await performHealthCheck(sessionId);

      if (!health.healthy) {
        console.warn(`Session ${sessionId} unhealthy:`, health);
        // Trigger alerts or remediation
      }
    }, intervalMs);
  });

  return () => healthChecks.forEach(clearInterval);
};
```

## Optimization Guidelines

### When to Use Browser Sessions vs Session API

| Scenario | Recommendation | Reason |
|----------|----------------|--------|
| Simple scraping workflows | Browser Sessions | Automatic cleanup, simpler setup |
| Short-duration tasks (< 5 min) | Browser Sessions | Reconnection timeout handles lifecycle efficiently |
| Multi-step workflows | Session API | Better control over session state |
| Production applications | Session API | Explicit lifecycle management |
| Batch processing | Session API | Programmatic session control |
| Development/testing | Browser Sessions | Faster iteration, less complexity |

### Timeout Optimization
- **Conservative approach**: Start with shorter timeouts and increase as needed
- **Monitor actual usage**: Track how long sessions are actually needed
- **Plan-based limits**: Respect your plan's maximum timeout limits
- **Workflow-based**: Different timeouts for different workflow types

### Resource Management
- Delete sessions immediately after workflow completion to free resources
- Set appropriate timeouts based on actual workflow duration
- Monitor session usage to optimize costs and performance
- Implement cleanup routines for application shutdown

### Security Guidelines
- Clear sensitive data before ending sessions
- Rotate session identifiers regularly for long-running applications
- Log session deletions for audit trails
- Handle deletion failures gracefully to prevent resource leaks
