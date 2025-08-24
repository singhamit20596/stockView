#!/bin/bash

echo "🚀 StockView Environment Setup"
echo "=============================="

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOF
# Supabase Configuration (Replace with your actual values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Railway Scraping Service (Replace with your actual Railway URL)
NEXT_PUBLIC_SCRAPING_SERVICE_URL=https://your-service-name.railway.app

# For development, you can use mock data if services aren't set up yet
NEXT_PUBLIC_USE_MOCK_DATA=true
EOF
    echo "✅ Created .env.local file"
else
    echo "✅ .env.local file already exists"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Edit .env.local with your actual Supabase and Railway URLs"
echo "2. Set NEXT_PUBLIC_USE_MOCK_DATA=false when you have real services configured"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "🔧 For production deployment:"
echo "1. Follow the DEPLOYMENT_GUIDE.md"
echo "2. Set up Supabase database"
echo "3. Deploy scraping service to Railway"
echo "4. Deploy frontend to Netlify"
echo ""
echo "🎉 Your StockView app is ready to run!"
