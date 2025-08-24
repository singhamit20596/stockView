# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose organization
5. Enter project details:
   - Name: `stockview-db`
   - Database Password: Generate a strong password
   - Region: Choose closest to you (e.g., `ap-south-1` for India)
6. Click "Create new project"

## 2. Get Connection Details

After project creation, go to Settings > API:
- Project URL: `https://your-project-id.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

## 3. Create Database Schema

Go to SQL Editor and run this schema:

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

## 4. Environment Variables

Add these to your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Railway Scraping Service
NEXT_PUBLIC_SCRAPING_SERVICE_URL=https://your-scraping-service.railway.app
```

## 5. Test Connection

Run this in SQL Editor to test:

```sql
INSERT INTO accounts (name) VALUES ('Test Account');
SELECT * FROM accounts;
DELETE FROM accounts WHERE name = 'Test Account';
```
