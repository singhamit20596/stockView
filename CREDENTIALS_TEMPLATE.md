# 🔑 Credentials Template

**Save this file and fill in your actual values as you complete each step.**

## **📊 Supabase Credentials**

```
Project URL: https://iydjcmhjvpnriklgphuq.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZGpjbWhqdnBucmlrbGdwaHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTYzMTgsImV4cCI6MjA3MTYzMjMxOH0.JtpiWPzWvHjBBTQ13ZaGpQYdgwH9VV1SMGblJSmXtY8
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZGpjbWhqdnBucmlrbGdwaHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1NjMxOCwiZXhwIjoyMDcxNjMyMzE4fQ.-VDSthFM34PeiA0fXOeKvIUDrgV__no1_AXhNa2kTzo
Database Password: SIwach@007MONU
```

## **🚂 Render Credentials**

```
Service URL: https://stockview-6oba.onrender.com
Project Name: stockview
```

## **🌐 Netlify Credentials**

```
Site URL: https://_________________.netlify.app
Site Name: _________________
```

## **🤖 Browserless.io Credentials**

```
API Token: YOUR_BROWSERLESS_API_TOKEN_HERE
Region: production-sfo (or production-lon for Europe)
Plan: Free (for basic scraping) / Starter+ (for interactive sessions)
```

**Browserless.io Setup Steps:**
1. Sign up at https://browserless.io
2. Choose a plan (Free for basic, Starter+ for interactive sessions)
3. Get your API token from the dashboard
4. Note your plan's timeout and concurrency limits

## **📧 Groww Credentials (for automated login)**

```
Email: your-groww-email@example.com
Password: your-groww-password
PIN: your-5-digit-groww-pin
```

**Groww Setup Steps:**
1. Use your Groww login email address
2. Use your Groww account password
3. Use your 5-digit Groww PIN (required for login)
4. Keep these credentials secure

## **🔧 Environment Variables Summary**

### **For Railway (scraping service):**
```env
SUPABASE_URL=https://iydjcmhjvpnriklgphuq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZGpjbWhqdnBucmlrbGdwaHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1NjMxOCwiZXhwIjoyMDcxNjMyMzE4fQ.-VDSthFM34PeiA0fXOeKvIUDrgV__no1_AXhNa2kTzo
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://_________________.netlify.app
LOG_LEVEL=info
BROWSERLESS_TOKEN=YOUR_BROWSERLESS_API_TOKEN_HERE
BROWSERLESS_REGION=production-sfo
GROWW_USERNAME=your-groww-email@example.com
GROWW_PASSWORD=your-groww-password
GROWW_PIN=12345
```

### **For Netlify (frontend):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://iydjcmhjvpnriklgphuq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZGpjbWhqdnBucmlrbGdwaHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTYzMTgsImV4cCI6MjA3MTYzMjMxOH0.JtpiWPzWvHjBBTQ13ZaGpQYdgwH9VV1SMGblJSmXtY8
NEXT_PUBLIC_SCRAPING_SERVICE_URL=https://stockview-6oba.onrender.com
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### **For Local Development:**
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://iydjcmhjvpnriklgphuq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZGpjbWhqdnBucmlrbGdwaHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTYzMTgsImV4cCI6MjA3MTYzMjMxOH0.JtpiWPzWvHjBBTQ13ZaGpQYdgwH9VV1SMGblJSmXtY8
NEXT_PUBLIC_SCRAPING_SERVICE_URL=http://localhost:3000
NEXT_PUBLIC_USE_MOCK_DATA=false
BROWSERLESS_TOKEN=YOUR_BROWSERLESS_API_TOKEN_HERE
BROWSERLESS_REGION=production-sfo
GROWW_USERNAME=your-groww-email@example.com
GROWW_PASSWORD=your-groww-password
GROWW_PIN=12345
```

---

## **📝 Progress Tracker**

- [ ] **Phase 1**: Supabase project created
- [ ] **Phase 1**: Database tables created
- [ ] **Phase 1**: Credentials copied above
- [x] **Phase 2**: Render account created
- [x] **Phase 2**: Scraping service deployed
- [x] **Phase 2**: Render credentials copied above
- [x] **Phase 3**: Netlify environment variables set
- [ ] **Phase 4**: Browserless.io account created
- [ ] **Phase 4**: Browserless.io API token obtained
- [ ] **Phase 4**: Browserless.io environment variables set
- [ ] **Phase 5**: Groww credentials configured
- [ ] **Phase 5**: Database connection tested
- [ ] **Phase 5**: Scraping service tested with Browserless
- [ ] **Phase 5**: Automated login tested
- [ ] **Phase 5**: OTP handling tested
- [ ] **Phase 5**: All features working

---

## **⚠️ Security Notes**

1. **Never commit this file to Git** (it contains sensitive data)
2. **Keep your Service Role Key secret** (it has admin access)
3. **Keep your Browserless.io API token secret** (it has billing access)
4. **Keep your Groww credentials secure** (email, password, PIN)
5. **The Anon Key is safe** to expose (it's designed for client-side use)
6. **Database password** is only needed for direct database access

---

## **🤖 Browserless.io Plan Requirements**

### **For Interactive Sessions (Hybrid Automation):**
- **Starter Plan**: 30-minute sessions, 20 concurrent browsers
- **Scale Plan**: 60-minute sessions, 50 concurrent browsers  
- **Enterprise Plan**: Custom limits

### **For Free Plan (Basic Scraping):**
- **Free Plan**: 60-second sessions, 1 concurrent browser
- **Features**: Basic CDP connection, stealth mode, ad blocking
- **Limitations**: No interactive sessions, no session persistence

### **Features Available:**
- ✅ **Automated Login**: Credential-based login with OTP handling
- ✅ **Manual Login**: Browser window for manual login
- ✅ **Captcha Detection**: Screenshot capture for manual solving
- ✅ **Session Management**: Basic session handling
- ✅ **Stealth Mode**: Reduce bot detection
- ✅ **Ad Blocking**: Faster scraping
- ✅ **Regional Endpoints**: Lower latency

### **Free Plan Limitations:**
- ❌ **No Interactive Sessions**: Cannot use LiveURL features
- ❌ **60-second timeout**: Very limited for scraping
- ❌ **1 concurrent browser**: No parallel processing
- ❌ **No session persistence**: No reconnection capabilities

---

## **🔐 OTP Handling for Free Plan**

Since the free plan doesn't support interactive sessions (LiveURL), OTP handling works as follows:

### **Automated OTP Handling:**
1. **Screenshot Capture**: When OTP is required, a screenshot is saved
2. **Console Notification**: User is notified via console about OTP requirement
3. **Manual Input**: User provides OTP through the OTP handler
4. **Automatic Continuation**: Scraper continues automatically after OTP input

### **OTP Input Methods:**
```typescript
// Method 1: Using OTP handler
import { provideOTP } from '@/lib/otpHandler';

// Provide OTP for a session
provideOTP('session-id', '123456');

// Method 2: Using callback
const onOTPRequest = async (otp: string) => {
  // Handle OTP input
  console.log('OTP required:', otp);
};
```

---

## **🆘 Need Help?**

If you encounter any issues:
1. Check the troubleshooting section in `PRODUCTION_SETUP_GUIDE.md`
2. Review Browserless.io documentation in the project files
3. Check the free plan usage guide in `FREE_PLAN_USAGE_GUIDE.md`
4. Share the specific error message with me
5. I'll help you debug and fix the issue

---

## **🔗 Useful Links**

- **Browserless.io Dashboard**: https://browserless.io/dashboard
- **Browserless.io Documentation**: See project files for comprehensive docs
- **Supabase Dashboard**: https://app.supabase.com
- **Render Dashboard**: https://dashboard.render.com
- **Netlify Dashboard**: https://app.netlify.com
- **Groww Login**: https://groww.in/login
