# 🚀 Real-Time Scraping Setup Guide

This guide will help you set up and run real-time scraping with your new credentials management system.

## **📋 Prerequisites**

1. ✅ **Database Table Created** - Run the SQL script in Supabase
2. ✅ **Environment Variables Set** - Supabase and Browserless.io configured
3. ✅ **Credentials Added** - At least one account in the credentials table

## **🗄️ Step 1: Create Database Table**

Run this SQL in your **Supabase SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS credentials (
    account_name TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    pin TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credentials_email ON credentials(email);
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own credentials" ON credentials
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_credentials_updated_at 
    BEFORE UPDATE ON credentials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## **🔐 Step 2: Add Credentials**

1. **Start the dev server**: `npm run dev`
2. **Navigate to**: `http://localhost:3000/credentials`
3. **Add your credentials**:
   - **Account Name**: `groww_main` (or any name you prefer)
   - **Email**: Your Groww email
   - **Password**: Your Groww password
   - **PIN**: Your 5-digit Groww PIN

## **🚀 Step 3: Start Real-Time Scraping**

### **Quick Start (30-minute intervals)**
```bash
npm run scrape:realtime groww_main
```

### **Custom Intervals**
```bash
# Scrape every 15 minutes
npm run scrape:realtime groww_main 15

# Scrape every 30 minutes with 5 retries
npm run scrape:realtime groww_main 30 5

# Scrape every hour
npm run scrape:realtime groww_main 60
```

### **Test Run (1-minute interval, 1 retry)**
```bash
npm run scrape:test
```

### **Single Scrape**
```bash
npm run scrape:once
```

## **🔐 Step 4: Handle OTP (When Required)**

When the scraper asks for OTP:

### **Method 1: Using NPM Script**
```bash
npm run otp:provide 123456
```

### **Method 2: Using Node.js**
```bash
node -e "
const { provideOTP } = require('./src/lib/otpHandler');
provideOTP('groww-session', '123456');
"
```

### **Check OTP Status**
```bash
npm run otp:status
```

## **📊 Step 5: Monitor Scraping**

The real-time scraper will:

- ✅ **Log progress** with timestamps
- ✅ **Show holdings summary** after each scrape
- ✅ **Calculate total portfolio value**
- ✅ **Handle errors gracefully** with retries
- ✅ **Wait for OTP input** when required

### **Sample Output**
```
[realtime-scraper] Starting real-time scraping for account: groww_main
[realtime-scraper] Interval: 30 minutes
[realtime-scraper] Max retries: 3
[realtime-scraper] Starting scrape at 2024-01-15T10:30:00.000Z
[realtime-scraper] Progress: 15% - connecting to browserless (free plan)
[realtime-scraper] Progress: 40% - login successful, navigating to holdings
[realtime-scraper] Progress: 90% - extraction complete - 25 holdings found
[realtime-scraper] ✅ Scrape completed successfully!
[realtime-scraper] 📊 Holdings found: 25
[realtime-scraper] ⏱️ Duration: 45.23 seconds
[realtime-scraper] 💰 Total value: ₹8,71,665
[realtime-scraper] 📋 Holdings Summary:
[realtime-scraper]   1. TCS: 100 shares @ ₹3,850 = ₹3,85,000
[realtime-scraper]   2. Infosys: 200 shares @ ₹1,500 = ₹3,00,000
[realtime-scraper] Waiting 30 minutes until next scrape...
```

## **🛠️ Troubleshooting**

### **Common Issues**

#### **1. "No credentials found"**
- ✅ Check if credentials are added in `/credentials` page
- ✅ Verify account name matches exactly
- ✅ Check database connection

#### **2. "OTP timeout"**
- ✅ Provide OTP within 60 seconds
- ✅ Use `npm run otp:provide <otp>` command
- ✅ Check if OTP is correct

#### **3. "Browserless connection failed"**
- ✅ Verify `BROWSERLESS_TOKEN` is set
- ✅ Check Browserless.io account status
- ✅ Ensure free plan limits aren't exceeded

#### **4. "Database connection error"**
- ✅ Verify Supabase environment variables
- ✅ Check if credentials table exists
- ✅ Ensure RLS policies are correct

### **Debug Commands**

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
echo $BROWSERLESS_TOKEN

# Test database connection
npm run scrape:once

# Check OTP status
npm run otp:status

# View logs
tail -f logs/scraping.log
```

## **⚙️ Configuration Options**

### **Scraping Intervals**
- **Frequent**: 15 minutes (for active trading)
- **Standard**: 30 minutes (recommended)
- **Conservative**: 60 minutes (for long-term tracking)

### **Retry Settings**
- **Conservative**: 3 retries (default)
- **Aggressive**: 5 retries (for unstable connections)
- **Minimal**: 1 retry (for testing)

### **OTP Handling**
- **Automatic**: Set `enableOTPHandling: true` (default)
- **Manual**: Set `enableOTPHandling: false` (for headless operation)

## **🔒 Security Notes**

- ✅ **Credentials encrypted** in database
- ✅ **No credential logging** in console
- ✅ **Secure API routes** with validation
- ✅ **Row-level security** enabled
- ✅ **Environment variables** for sensitive data

## **📈 Performance Tips**

1. **Optimal Intervals**: 30 minutes for most use cases
2. **Retry Strategy**: 3 retries with exponential backoff
3. **Resource Management**: Automatic cleanup after each scrape
4. **Error Handling**: Graceful degradation on failures

## **🚀 Production Deployment**

For production deployment:

1. **Set environment variables** in your hosting platform
2. **Use PM2 or similar** for process management
3. **Set up monitoring** for scraping health
4. **Configure logging** for debugging
5. **Set up alerts** for failures

### **PM2 Example**
```bash
npm install -g pm2
pm2 start "npm run scrape:realtime groww_main 30" --name "groww-scraper"
pm2 save
pm2 startup
```

## **📞 Support**

If you encounter issues:

1. **Check logs** for detailed error messages
2. **Verify setup** using the troubleshooting guide
3. **Test components** individually
4. **Review documentation** in project files

**Happy Scraping! 🎉**
