# StockView Deployment Guide

Complete guide to deploy StockView with Supabase and Railway.

## 🗄️ Phase 1: Supabase Setup

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose organization
5. Enter project details:
   - **Name**: `stockview-db`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to you (e.g., `ap-south-1` for India)
6. Click "Create new project"

### 2. Get Connection Details

After project creation:
1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

### 3. Create Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Run this complete schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  invested_value DECIMAL(15,2) DEFAULT 0,
  current_value DECIMAL(15,2) DEFAULT 0,
  pnl DECIMAL(15,2) DEFAULT 0,
  pnl_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stocks table
CREATE TABLE stocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  stock_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  avg_price DECIMAL(10,2) NOT NULL,
  market_price DECIMAL(10,2) NOT NULL,
  invested_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  pnl DECIMAL(15,2) NOT NULL,
  pnl_percent DECIMAL(5,2) NOT NULL,
  sector TEXT,
  subsector TEXT,
  market_cap TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Views table
CREATE TABLE views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- View Accounts (many-to-many)
CREATE TABLE view_accounts (
  view_id UUID REFERENCES views(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (view_id, account_id)
);

-- Scrape Sessions table
CREATE TABLE scrape_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_name TEXT NOT NULL,
  broker_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress JSONB DEFAULT '{"percent": 0, "stage": "queued"}',
  preview JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_stocks_account_id ON stocks(account_id);
CREATE INDEX idx_stocks_stock_name ON stocks(stock_name);
CREATE INDEX idx_scrape_sessions_status ON scrape_sessions(status);
CREATE INDEX idx_scrape_sessions_account_name ON scrape_sessions(account_name);

-- Enable Row Level Security (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all operations - you can restrict later)
CREATE POLICY "Allow all operations on accounts" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on stocks" ON stocks FOR ALL USING (true);
CREATE POLICY "Allow all operations on views" ON views FOR ALL USING (true);
CREATE POLICY "Allow all operations on view_accounts" ON view_accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on scrape_sessions" ON scrape_sessions FOR ALL USING (true);
```

### 4. Test Database Connection

Run this in SQL Editor to test:

```sql
INSERT INTO accounts (name) VALUES ('Test Account');
SELECT * FROM accounts;
DELETE FROM accounts WHERE name = 'Test Account';
```

## 🚂 Phase 2: Railway Scraping Service

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

### 3. Deploy Scraping Service

```bash
# Navigate to scraping service directory
cd scraping-service

# Install dependencies
npm install

# Initialize Railway project
railway init

# Set environment variables
railway variables set SUPABASE_URL=https://your-project-id.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
railway variables set FRONTEND_URL=https://your-netlify-app.netlify.app
railway variables set NODE_ENV=production

# Deploy
railway up
```

### 4. Get Railway Service URL

After deployment, Railway will provide a URL like:
`https://your-service-name.railway.app`

Copy this URL for the next step.

## 🌐 Phase 3: Netlify Frontend

### 1. Update Environment Variables

Add these to your Netlify environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Railway Scraping Service
NEXT_PUBLIC_SCRAPING_SERVICE_URL=https://your-service-name.railway.app
```

### 2. Deploy to Netlify

```bash
# Build the project
npm run build

# Deploy to Netlify (if using Netlify CLI)
netlify deploy --prod
```

Or push to GitHub and let Netlify auto-deploy.

## 🔧 Phase 4: Configuration

### 1. Frontend Environment Variables

Create `.env.local` in your project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Railway Scraping Service
NEXT_PUBLIC_SCRAPING_SERVICE_URL=https://your-service-name.railway.app
```

### 2. Test the Setup

1. **Test Database Connection**:
   ```bash
   npm run dev
   # Visit http://localhost:3000
   # Try to add an account
   ```

2. **Test Scraping Service**:
   ```bash
   # Check Railway service health
   curl https://your-service-name.railway.app/api/health
   ```

3. **Test End-to-End Flow**:
   - Add an account
   - Start scraping
   - Monitor progress
   - Confirm and save

## 🔍 Phase 5: Monitoring & Troubleshooting

### 1. Railway Monitoring

```bash
# Check service logs
railway logs

# Check service status
railway status

# View environment variables
railway variables
```

### 2. Supabase Monitoring

- Go to Supabase Dashboard
- Check **Database** > **Logs**
- Monitor **API** usage

### 3. Netlify Monitoring

- Check Netlify Dashboard
- View **Functions** logs
- Monitor build status

### 4. Common Issues

#### Database Connection Issues
```bash
# Check Supabase URL and keys
# Verify RLS policies
# Test connection in SQL Editor
```

#### Scraping Service Issues
```bash
# Check Railway logs
railway logs

# Verify environment variables
railway variables

# Test service health
curl https://your-service-name.railway.app/api/health
```

#### Frontend Issues
```bash
# Check browser console
# Verify environment variables
# Test API endpoints
```

## 📊 Phase 6: Production Optimization

### 1. Security Enhancements

1. **Add API Key Authentication**:
   ```typescript
   // Add to scraping service
   const API_KEY = process.env.API_KEY;
   if (req.headers['x-api-key'] !== API_KEY) {
     return res.status(401).json({ error: 'Unauthorized' });
   }
   ```

2. **Restrict CORS**:
   ```typescript
   // Update CORS configuration
   cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   })
   ```

3. **Add Rate Limiting**:
   ```bash
   npm install express-rate-limit
   ```

### 2. Performance Optimization

1. **Database Indexes**: Already added in schema
2. **Caching**: Consider Redis for caching
3. **CDN**: Netlify provides CDN automatically

### 3. Monitoring Setup

1. **Error Tracking**: Add Sentry
2. **Analytics**: Add Google Analytics
3. **Uptime Monitoring**: Use UptimeRobot

## 🎉 Success!

Your StockView application is now deployed with:
- ✅ **Frontend**: Netlify
- ✅ **Database**: Supabase
- ✅ **Scraping Service**: Railway
- ✅ **Real-time Scraping**: Working
- ✅ **Persistent Data**: PostgreSQL
- ✅ **Scalable Architecture**: Microservices

## 📞 Support

If you encounter issues:

1. Check the logs in each service
2. Verify environment variables
3. Test each component individually
4. Check the troubleshooting section above

## 🔄 Updates

To update the application:

1. **Frontend**: Push to GitHub, Netlify auto-deploys
2. **Scraping Service**: `railway up` in scraping-service directory
3. **Database**: Run migrations in Supabase SQL Editor
