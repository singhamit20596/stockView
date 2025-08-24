# 🚀 StockView Production Setup Guide

## **Phase 1: Supabase Setup**

### **Step 1.1: Create Supabase Project**
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub
4. Click "New Project"
5. Choose your organization
6. Set project details:
   - **Name**: `stockview`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
7. Click "Create new project"
8. Wait for setup (2-3 minutes)

### **Step 1.2: Get Supabase Credentials**
Once project is ready:
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Step 1.3: Create Database Tables**
1. Go to **SQL Editor**
2. Run this SQL script:

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

---

## **Phase 2: Railway Setup**

### **Step 2.1: Create Railway Account**
1. Go to [https://railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub
4. Complete account setup

### **Step 2.2: Deploy Scraping Service**
1. In Railway dashboard, click "New Project"
2. Choose "Deploy from GitHub repo"
3. Select your `stockView` repository
4. Set **Root Directory** to: `scraping-service`
5. Click "Deploy"

### **Step 2.3: Configure Railway Environment Variables**
1. Go to your Railway project
2. Click **Variables** tab
3. Add these environment variables:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-netlify-app.netlify.app
LOG_LEVEL=info
```

### **Step 2.4: Get Railway Service URL**
1. Go to **Settings** tab
2. Copy the **Public Domain** URL
3. It will look like: `https://your-service-name-production.up.railway.app`

---

## **Phase 3: Update Netlify Environment Variables**

### **Step 3.1: Access Netlify Dashboard**
1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Select your StockView site
3. Go to **Site settings** → **Environment variables**

### **Step 3.2: Add Production Environment Variables**
Add these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SCRAPING_SERVICE_URL=https://your-service-name-production.up.railway.app
NEXT_PUBLIC_USE_MOCK_DATA=false
```

---

## **Phase 4: Test Production Setup**

### **Step 4.1: Test Database Connection**
1. Visit your Netlify site
2. Go to **Add Account** page
3. Try creating a test account
4. Check if it appears in Supabase dashboard

### **Step 4.2: Test Scraping Service**
1. Go to **Add Account** page
2. Enter account name: "Test Account"
3. Select broker: "Groww"
4. Click "Start Scraping"
5. Check Railway logs for any errors

---

## **Phase 5: Verification Checklist**

### **✅ Supabase Setup**
- [ ] Project created
- [ ] Database tables created
- [ ] Credentials copied
- [ ] Test data inserted

### **✅ Railway Setup**
- [ ] Account created
- [ ] Service deployed
- [ ] Environment variables set
- [ ] Service URL obtained

### **✅ Netlify Setup**
- [ ] Environment variables updated
- [ ] Site redeployed
- [ ] Production mode enabled

### **✅ Testing**
- [ ] Database connection works
- [ ] Account creation works
- [ ] Scraping service responds
- [ ] All pages load correctly

---

## **🔧 Troubleshooting**

### **Common Issues:**

1. **Database Connection Error**
   - Check Supabase URL and keys
   - Verify RLS policies are set correctly

2. **Scraping Service Not Responding**
   - Check Railway logs
   - Verify environment variables
   - Check service URL is correct

3. **Netlify Build Errors**
   - Check environment variables
   - Verify all required variables are set

### **Support Resources:**
- Supabase Docs: https://supabase.com/docs
- Railway Docs: https://docs.railway.app
- Netlify Docs: https://docs.netlify.com

---

## **📞 Next Steps**

After completing each phase, update me with:
1. **Phase 1**: Supabase project URL and credentials
2. **Phase 2**: Railway service URL
3. **Phase 3**: Confirmation of Netlify variables set
4. **Phase 4**: Test results

I'll help you troubleshoot any issues and optimize the setup!
