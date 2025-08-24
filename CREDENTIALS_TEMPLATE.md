# 🔑 Credentials Template

**Save this file and fill in your actual values as you complete each step.**

## **📊 Supabase Credentials**

```
Project URL: https://iydjcmhjvpnriklgphuq.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZGpjbWhqdnBucmlrbGdwaHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTYzMTgsImV4cCI6MjA3MTYzMjMxOH0.JtpiWPzWvHjBBTQ13ZaGpQYdgwH9VV1SMGblJSmXtY8
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZGpjbWhqdnBucmlrbGdwaHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1NjMxOCwiZXhwIjoyMDcxNjMyMzE4fQ.-VDSthFM34PeiA0fXOeKvIUDrgV__no1_AXhNa2kTzo
Database Password: SIwach@007MONU
```

## **🚂 Railway Credentials**

```
Service URL: https://stockview-production.up.railway.app
Project Name: stockview
```

## **🌐 Netlify Credentials**

```
Site URL: https://_________________.netlify.app
Site Name: _________________
```

## **🔧 Environment Variables Summary**

### **For Railway (scraping service):**
```env
SUPABASE_URL=https://iydjcmhjvpnriklgphuq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZGpjbWhqdnBucmlrbGdwaHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1NjMxOCwiZXhwIjoyMDcxNjMyMzE4fQ.-VDSthFM34PeiA0fXOeKvIUDrgV__no1_AXhNa2kTzo
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://_________________.netlify.app
LOG_LEVEL=info
```

### **For Netlify (frontend):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://_________________.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9._________________
NEXT_PUBLIC_SCRAPING_SERVICE_URL=https://_________________.up.railway.app
NEXT_PUBLIC_USE_MOCK_DATA=false
```

---

## **📝 Progress Tracker**

- [ ] **Phase 1**: Supabase project created
- [ ] **Phase 1**: Database tables created
- [ ] **Phase 1**: Credentials copied above
- [ ] **Phase 2**: Railway account created
- [ ] **Phase 2**: Scraping service deployed
- [ ] **Phase 2**: Railway credentials copied above
- [ ] **Phase 3**: Netlify environment variables set
- [ ] **Phase 4**: Database connection tested
- [ ] **Phase 4**: Scraping service tested
- [ ] **Phase 4**: All features working

---

## **⚠️ Security Notes**

1. **Never commit this file to Git** (it contains sensitive data)
2. **Keep your Service Role Key secret** (it has admin access)
3. **The Anon Key is safe** to expose (it's designed for client-side use)
4. **Database password** is only needed for direct database access

---

## **🆘 Need Help?**

If you encounter any issues:
1. Check the troubleshooting section in `PRODUCTION_SETUP_GUIDE.md`
2. Share the specific error message with me
3. I'll help you debug and fix the issue
