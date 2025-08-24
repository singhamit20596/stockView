# Database Migration Plan for Netlify Deployment

## Current Issues
- File-based storage doesn't work on Netlify
- Playwright scraping needs persistent environment
- Long-running processes exceed serverless limits

## Recommended Solution: Supabase Integration

### 1. Database Schema
```sql
-- Accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  invested_value DECIMAL(15,2) DEFAULT 0,
  current_value DECIMAL(15,2) DEFAULT 0,
  pnl DECIMAL(15,2) DEFAULT 0,
  pnl_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stocks table
CREATE TABLE stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Views table
CREATE TABLE views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- View Accounts (many-to-many)
CREATE TABLE view_accounts (
  view_id UUID REFERENCES views(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (view_id, account_id)
);
```

### 2. Migration Steps
1. Set up Supabase project
2. Create database schema
3. Replace filedb.ts with Supabase client
4. Update all API routes to use database
5. Deploy scraping service separately

### 3. Scraping Service Architecture
```
Frontend (Netlify) → API → Scraping Service (Railway) → Supabase Database
```

### 4. Benefits
- ✅ Works on Netlify
- ✅ Persistent data storage
- ✅ Real-time updates
- ✅ Better scalability
- ✅ Proper data relationships
