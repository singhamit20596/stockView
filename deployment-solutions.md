# Netlify Deployment Solutions for StockView

## Problem Summary
- Playwright scraping doesn't work on Netlify serverless functions
- File-based storage incompatible with serverless environment
- Long-running scraping processes exceed function time limits

## Solution 1: Separate Scraping Service (Recommended)

### Architecture
```
Frontend (Netlify) → API Gateway → Scraping Service (Railway/Render) → Database (Supabase)
```

### Implementation Steps

#### 1. Set up Supabase Database
```bash
# Create Supabase project
# Use the schema from database-migration-plan.md
```

#### 2. Create Separate Scraping Service
```typescript
// scraping-service/src/index.ts
import express from 'express';
import { scrapeGrowwHoldingsLive } from './scrapers/groww';
import { createClient } from '@supabase/supabase-js';

const app = express();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

app.post('/api/scrape', async (req, res) => {
  const { accountName, brokerId } = req.body;
  
  try {
    const holdings = await scrapeGrowwHoldingsLive((progress) => {
      // Update progress in database
    });
    
    // Save to Supabase
    await supabase.from('stocks').insert(holdings);
    
    res.json({ success: true, holdings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

#### 3. Deploy Scraping Service
- **Railway**: `railway up`
- **Render**: Connect GitHub repo
- **DigitalOcean App Platform**: Deploy container

#### 4. Update Frontend API Calls
```typescript
// Replace local scraping with API calls
const scrapeAccount = async (accountName: string, brokerId: string) => {
  const response = await fetch('https://your-scraping-service.railway.app/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountName, brokerId })
  });
  return response.json();
};
```

### Benefits
- ✅ Works on Netlify
- ✅ Persistent data storage
- ✅ No time limits for scraping
- ✅ Scalable architecture

## Solution 2: Headless Browser Service

### Use Browserless.io or Similar
```typescript
// Replace Playwright with browserless
const scrapeWithBrowserless = async () => {
  const response = await fetch('https://chrome.browserless.io/content', {
    method: 'POST',
    headers: { 'Cache-Control': 'no-cache' },
    body: JSON.stringify({
      code: `
        // Your scraping JavaScript
        const holdings = document.querySelectorAll('.holding-row');
        return Array.from(holdings).map(row => ({
          stockName: row.querySelector('.stock-name').textContent,
          quantity: row.querySelector('.quantity').textContent,
          // ... other fields
        }));
      `,
      context: { url: 'https://groww.in/stocks/user/holdings' }
    })
  });
  return response.json();
};
```

### Benefits
- ✅ No browser dependencies
- ✅ Works on serverless
- ❌ Requires external service (cost)

## Solution 3: API-Based Data Import

### Replace Scraping with Manual Import
```typescript
// Add CSV/Excel upload functionality
const importHoldings = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/import-holdings', {
    method: 'POST',
    body: formData
  });
  return response.json();
};
```

### Benefits
- ✅ Simple implementation
- ✅ Works on Netlify
- ❌ Requires manual data entry

## Solution 4: Hybrid Approach

### Keep Scraping Local, Sync to Cloud
```typescript
// Local development: Use Playwright
// Production: Use API import or external service
const scrapeHoldings = async (accountName: string, brokerId: string) => {
  if (process.env.NODE_ENV === 'development') {
    // Use local Playwright scraping
    return await scrapeGrowwHoldingsLive();
  } else {
    // Use external service or manual import
    return await importFromExternalService();
  }
};
```

## Recommended Implementation Plan

### Phase 1: Database Migration
1. Set up Supabase project
2. Create database schema
3. Migrate existing data
4. Update API routes to use Supabase

### Phase 2: Scraping Service
1. Create separate scraping service
2. Deploy to Railway/Render
3. Update frontend to call external API
4. Test end-to-end flow

### Phase 3: Optimization
1. Add caching layer
2. Implement retry logic
3. Add monitoring and logging
4. Optimize performance

## Environment Variables Needed

### Frontend (Netlify)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SCRAPING_SERVICE_URL=https://your-scraping-service.railway.app
```

### Scraping Service
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=3000
```

## Cost Estimation

### Supabase (Free Tier)
- Database: 500MB
- API calls: 50,000/month
- **Cost**: $0/month

### Railway/Render (Free Tier)
- Scraping service: 750 hours/month
- **Cost**: $0/month

### Total Monthly Cost
- **Free tier**: $0
- **Pro tier**: ~$20-50/month

## Migration Checklist

- [ ] Set up Supabase project
- [ ] Create database schema
- [ ] Migrate existing data
- [ ] Create scraping service
- [ ] Deploy scraping service
- [ ] Update frontend API calls
- [ ] Test scraping flow
- [ ] Update deployment configuration
- [ ] Monitor and optimize
