# StockView Scraping Service

A dedicated scraping service for the StockView application, deployed on Railway.

## Features

- **Groww Integration**: Automated scraping of holdings from Groww
- **Real-time Progress**: Track scraping progress in real-time
- **Database Integration**: Direct integration with Supabase
- **Error Handling**: Robust error handling and logging
- **Scalable**: Designed for Railway deployment

## API Endpoints

### Health Check
```
GET /api/health
```

### Start Scraping
```
POST /api/scrape/start
Content-Type: application/json

{
  "accountName": "My Account",
  "brokerId": "groww"
}
```

### Get Scraping Status
```
GET /api/scrape/status/:sessionId
```

### Get Scraping Results
```
GET /api/scrape/results/:sessionId
```

### Cancel Scraping
```
POST /api/scrape/cancel/:sessionId
```

## Environment Variables

Copy `env.example` to `.env` and fill in your values:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://your-netlify-app.netlify.app

# Logging
LOG_LEVEL=info
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment on Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize Railway Project**:
   ```bash
   railway init
   ```

4. **Set Environment Variables**:
   ```bash
   railway variables set SUPABASE_URL=your-supabase-url
   railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-key
   railway variables set FRONTEND_URL=your-frontend-url
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

## Architecture

```
Frontend (Netlify) → API Gateway → Scraping Service (Railway) → Supabase Database
```

## Monitoring

- **Health Check**: `/api/health`
- **Logs**: Railway dashboard
- **Metrics**: Railway provides built-in monitoring

## Troubleshooting

### Common Issues

1. **Browser Launch Failures**: Ensure all required dependencies are installed
2. **Database Connection**: Verify Supabase credentials
3. **CORS Issues**: Check FRONTEND_URL configuration
4. **Memory Issues**: Monitor Railway resource usage

### Logs

Check Railway logs for detailed error information:

```bash
railway logs
```

## Security

- **CORS**: Configured for specific frontend domain
- **Helmet**: Security headers enabled
- **Rate Limiting**: Consider adding rate limiting for production
- **Authentication**: Consider adding API key authentication
