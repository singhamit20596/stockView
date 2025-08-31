# 🆓 Browserless.io Free Plan Usage Guide

## **📋 Free Plan Limitations**

### **❌ What's NOT Available:**
- **Interactive Sessions (LiveURL)**: Cannot create shareable login links
- **Session Persistence**: No reconnection capabilities
- **Long Sessions**: Maximum 60 seconds per session
- **Concurrent Browsers**: Only 1 browser at a time
- **Advanced Features**: No captcha solving, session management

### **✅ What's Available:**
- **Basic CDP Connection**: Can connect to Browserless
- **Stealth Mode**: Available for bot detection avoidance
- **Ad Blocking**: Available for faster scraping
- **Error Screenshots**: Can capture error screenshots
- **Basic Monitoring**: Request/response monitoring

## **🚀 Solutions for Free Plan**

### **Option 1: Credential-Based Login (Recommended)**

Use the `scrapeGrowwHoldingsFree` function with your credentials:

```typescript
import { scrapeGrowwHoldingsFree } from '@/server/brokers/groww-free';

const credentials = {
  username: 'your-email@example.com',
  password: 'your-password'
};

const holdings = await scrapeGrowwHoldingsFree(credentials, onProgress);
```

**Pros:**
- ✅ Fully automated
- ✅ Works within 60-second limit
- ✅ No manual intervention needed
- ✅ Secure credential handling

**Cons:**
- ❌ Requires storing credentials
- ❌ May trigger 2FA or security measures
- ❌ Limited to 60-second sessions

### **Option 2: Manual Login with Browser Window**

Use the `scrapeGrowwHoldingsManual` function:

```typescript
import { scrapeGrowwHoldingsManual } from '@/server/brokers/groww-free';

const holdings = await scrapeGrowwHoldingsManual(onProgress);
```

**Pros:**
- ✅ No credential storage needed
- ✅ Can handle 2FA and complex login flows
- ✅ User has full control over login process
- ✅ Works with any login method

**Cons:**
- ❌ Requires manual intervention
- ❌ Limited to 60-second sessions
- ❌ User must be present during scraping

### **Option 3: Hybrid Approach (Best for Free Plan)**

Combine both approaches based on your needs:

```typescript
import { scrapeGrowwHoldingsFree, scrapeGrowwHoldingsManual } from '@/server/brokers/groww-free';

// Try credential-based first, fallback to manual
async function scrapeGrowwHoldings(credentials?: GrowwCredentials) {
  if (credentials) {
    try {
      return await scrapeGrowwHoldingsFree(credentials, onProgress);
    } catch (error) {
      console.log('Credential-based login failed, trying manual login...');
    }
  }
  
  return await scrapeGrowwHoldingsManual(onProgress);
}
```

## **⚡ Optimization Strategies for Free Plan**

### **1. Timeout Management**
```typescript
// Optimize timeouts for 60-second limit
const config = {
  timeout: 50000, // 50 seconds (leave 10s buffer)
  navigationTimeout: 15000, // 15 seconds for page loads
  extractionTimeout: 35000, // 35 seconds for data extraction
};
```

### **2. Quick Navigation**
```typescript
// Use faster navigation options
await page.goto(url, {
  waitUntil: 'domcontentloaded', // Faster than 'networkidle'
  timeout: 15000
});
```

### **3. Efficient Data Extraction**
```typescript
// Single-pass extraction (no scrolling for free plan)
const holdings = await page.evaluate(() => {
  // Extract all visible holdings in one pass
  const rows = Array.from(document.querySelectorAll('tr[data-holding-parent]'));
  return rows.map(row => {
    // Extract data from each row
  });
});
```

### **4. Network Monitoring**
```typescript
// Capture API responses for faster data extraction
page.on('response', async (response) => {
  if (response.url().includes('holdings')) {
    const data = await response.json();
    // Extract holdings from API response
  }
});
```

## **🔧 Implementation Examples**

### **Example 1: Simple Credential-Based Scraping**
```typescript
import { createBrowserlessFreeHelper } from '@/lib/browserless-free';

async function simpleScraping() {
  const helper = createBrowserlessFreeHelper({
    timeout: 50000,
    stealth: true,
    headless: true,
  });

  try {
    await helper.connect();
    const page = await helper.createPage();
    
    // Login with credentials
    await helper.loginWithCredentials('https://groww.in/login', {
      username: 'your-email@example.com',
      password: 'your-password',
      usernameSelector: '#username',
      passwordSelector: '#password',
      submitSelector: '#submit',
    });
    
    // Quick extraction
    const data = await helper.quickScrape(async () => {
      return await page.evaluate(() => {
        // Extract data
      });
    }, 40000);
    
    return data;
  } finally {
    await helper.cleanup();
  }
}
```

### **Example 2: Manual Login with Progress Updates**
```typescript
import { scrapeGrowwHoldingsManual } from '@/server/brokers/groww-free';

async function manualScraping() {
  const onProgress = (stage: { percent: number; stage: string }) => {
    console.log(`${stage.percent}% - ${stage.stage}`);
  };
  
  try {
    const holdings = await scrapeGrowwHoldingsManual(onProgress);
    console.log(`Extracted ${holdings.length} holdings`);
    return holdings;
  } catch (error) {
    console.error('Scraping failed:', error);
    throw error;
  }
}
```

## **🛠️ Troubleshooting Free Plan Issues**

### **1. Session Timeout Errors**
```typescript
// Error: Session timeout after 60 seconds
// Solution: Reduce timeouts and optimize operations
const config = {
  timeout: 50000, // Under 60 seconds
  navigationTimeout: 10000, // Quick navigation
  extractionTimeout: 30000, // Fast extraction
};
```

### **2. Connection Failures**
```typescript
// Error: Failed to connect to Browserless
// Solution: Check API token and region
const helper = createBrowserlessFreeHelper({
  token: process.env.BROWSERLESS_TOKEN,
  region: 'production-sfo', // or 'production-lon'
});
```

### **3. Login Failures**
```typescript
// Error: Login verification failed
// Solution: Use manual login or check selectors
const selectors = {
  username: '#username, input[name="username"]',
  password: '#password, input[name="password"]',
  submit: '#submit, button[type="submit"]',
};
```

### **4. Captcha Detection**
```typescript
// Error: Captcha detected
// Solution: Manual solving with screenshots
const captchaDetected = await helper.handleCaptchaBasic();
if (captchaDetected) {
  console.log('🔒 Captcha detected - check screenshot for manual solving');
  // Wait for manual solving
  await page.waitForTimeout(30000);
}
```

## **📊 Performance Tips**

### **1. Minimize Network Requests**
```typescript
// Block unnecessary resources
await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => {
  route.abort();
});
```

### **2. Use Efficient Selectors**
```typescript
// Use specific selectors for faster extraction
const holdings = await page.$$eval('tr[data-holding-parent]', rows => {
  return rows.map(row => {
    const name = row.querySelector('.stock-name')?.textContent;
    const qty = row.querySelector('.quantity')?.textContent;
    return { name, qty };
  });
});
```

### **3. Optimize Data Processing**
```typescript
// Process data efficiently
const cleanData = (data: any[]) => {
  return data
    .filter(item => item.name && item.qty)
    .map(item => ({
      stockName: item.name.trim(),
      quantity: item.qty.replace(/[^0-9]/g, ''),
    }));
};
```

## **🔒 Security Considerations**

### **1. Credential Storage**
```typescript
// Store credentials securely
const credentials = {
  username: process.env.GROWW_USERNAME,
  password: process.env.GROWW_PASSWORD,
};
```

### **2. Environment Variables**
```env
# .env.local
BROWSERLESS_TOKEN=your_browserless_token
GROWW_USERNAME=your_groww_email
GROWW_PASSWORD=your_groww_password
```

### **3. Error Handling**
```typescript
// Don't log sensitive information
try {
  await helper.loginWithCredentials(loginUrl, credentials);
} catch (error) {
  log('[error]', 'Login failed', { error: error.message });
  // Don't log credentials
}
```

## **📈 When to Upgrade to Paid Plan**

### **Upgrade if you need:**
- ✅ **Interactive Sessions**: Shareable login links
- ✅ **Longer Sessions**: 30+ minutes for complex scraping
- ✅ **Session Persistence**: Maintain login state
- ✅ **Concurrent Browsers**: Multiple simultaneous sessions
- ✅ **Advanced Features**: Captcha solving, session management

### **Free Plan is sufficient for:**
- ✅ **Simple Scraping**: Basic data extraction
- ✅ **Testing**: Development and testing
- ✅ **Low Volume**: Occasional scraping needs
- ✅ **Manual Login**: When user can be present

## **🎯 Recommended Workflow for Free Plan**

1. **Start with Manual Login**: Use `scrapeGrowwHoldingsManual` for testing
2. **Add Credential-Based**: Use `scrapeGrowwHoldingsFree` for automation
3. **Optimize Timeouts**: Ensure all operations complete within 60 seconds
4. **Monitor Performance**: Track success rates and timing
5. **Upgrade When Needed**: Move to paid plan for production use

## **🔗 Useful Resources**

- **Browserless.io Dashboard**: https://browserless.io/dashboard
- **Free Plan Documentation**: See project files
- **Upgrade Options**: https://browserless.io/pricing
- **Support**: https://browserless.io/support

---

**The free plan can work for basic scraping needs, but consider upgrading for production use!** 🚀
