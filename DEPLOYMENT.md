# NoteMitra - Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying NoteMitra to production using modern cloud platforms.

### Recommended Stack:
- **Frontend**: Vercel (or Netlify)
- **Backend**: Render (or Railway/AWS EC2)
- **Database**: MongoDB Atlas
- **Storage**: AWS S3
- **Search**: Elastic Cloud (optional)

---

## 📦 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Production MongoDB database created
- [ ] AWS S3 bucket setup with CORS
- [ ] Google OAuth production credentials
- [ ] Domain names purchased (optional)
- [ ] SSL certificates ready
- [ ] Rate limiting configured
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics configured

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

```powershell
cd client
npm run build
```

Verify build succeeds locally.

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd client
vercel

# Follow prompts
```

#### Option B: GitHub Integration

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Configure Environment Variables

In Vercel dashboard, add:

```
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-api-domain.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_production_google_client_id
```

### Step 4: Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

---

## 🖥️ Backend Deployment (Render)

### Step 1: Prepare Backend

1. Create `Procfile` in `server/` directory:

```
web: npm start
```

2. Ensure `package.json` has start script:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc"
  }
}
```

### Step 2: Deploy to Render

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name**: notemitra-api
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or upgrade)

### Step 3: Environment Variables

Add all production environment variables in Render dashboard:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=production_secret_key_here
JWT_REFRESH_SECRET=production_refresh_secret_here
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://your-api-domain.com/api/auth/google/callback
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=notemitra-pdfs-production
FRONTEND_URL=https://your-frontend-domain.com
CLAUDE_API_KEY=...
ELASTICSEARCH_URL=...
```

### Step 4: Custom Domain (Optional)

1. Go to Settings → Custom Domains
2. Add your API subdomain (e.g., `api.notemitra.com`)
3. Configure DNS CNAME record

---

## 🗄️ MongoDB Atlas Configuration

### Production Database Setup

1. **Create Production Cluster**
   - Go to MongoDB Atlas
   - Create new cluster (M0 free tier or paid)
   - Name: `notemitra-production`

2. **Create Database User**
   - Database Access → Add New User
   - Username: `notemitra_prod`
   - Strong password
   - Built-in Role: Read and write to any database

3. **Network Access**
   - Add IP: `0.0.0.0/0` (allow from anywhere)
   - Or whitelist Render/Vercel IP addresses

4. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` and `<dbname>`
   - Add to backend environment variables

---

## ☁️ AWS S3 Configuration

### Production Bucket Setup

1. **Create Production Bucket**
   ```
   Name: notemitra-pdfs-production
   Region: us-east-1 (or your preferred region)
   Block all public access: OFF (configure carefully)
   ```

2. **Configure CORS**

   Add CORS configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": [
         "https://your-frontend-domain.com",
         "https://your-api-domain.com"
       ],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

3. **Bucket Policy (for public read access to files)**

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::notemitra-pdfs-production/*"
       }
     ]
   }
   ```

4. **IAM User**
   - Create IAM user with S3 access
   - Attach policy: `AmazonS3FullAccess` (or more restrictive)
   - Generate access keys
   - Add to backend environment variables

---

## 🔍 ElasticSearch Cloud (Optional)

### Setup Elastic Cloud

1. Go to [cloud.elastic.co](https://cloud.elastic.co)
2. Create deployment (free trial available)
3. Get Cloud ID and API key
4. Add to backend environment variables:
   ```
   ELASTICSEARCH_URL=https://your-deployment.es.cloud.com
   ELASTICSEARCH_API_KEY=your_api_key
   ```

---

## 🔑 Google OAuth Production

### Update OAuth Credentials

1. **Google Cloud Console**
   - Select your project
   - APIs & Services → Credentials

2. **Update OAuth Client**
   - Add authorized redirect URIs:
     ```
     https://your-api-domain.com/api/auth/google/callback
     ```
   - Add authorized JavaScript origins:
     ```
     https://your-frontend-domain.com
     ```

3. **Update Environment Variables**
   - Backend: `GOOGLE_CALLBACK_URL`
   - Frontend: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

---

## 🔐 Security Hardening

### SSL/HTTPS
- ✅ Vercel provides automatic HTTPS
- ✅ Render provides automatic HTTPS
- Configure custom domains with SSL

### Environment Variables
- Never commit `.env` files
- Use platform secret management
- Rotate secrets regularly

### CORS Configuration
- Set specific origins (not `*`)
- Update backend CORS settings:

```typescript
app.use(cors({
  origin: [
    'https://your-frontend-domain.com',
    'https://www.your-frontend-domain.com'
  ],
  credentials: true
}));
```

### Rate Limiting
- Adjust limits for production
- Consider DDoS protection (Cloudflare)

### Database Security
- Use strong passwords
- Enable encryption at rest
- Regular backups
- IP whitelist

---

## 📊 Monitoring & Analytics

### Error Tracking (Sentry)

1. Create Sentry account
2. Create projects for frontend and backend
3. Install Sentry SDKs:

```powershell
# Backend
npm install @sentry/node

# Frontend
npm install @sentry/nextjs
```

4. Initialize in code:

```typescript
// Backend - server/src/index.ts
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: "your-dsn" });

// Frontend - client/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";
Sentry.init({ dsn: "your-dsn" });
```

### Application Monitoring

Consider adding:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Performance**: New Relic, Datadog
- **Analytics**: Google Analytics, Plausible

---

## 🔄 CI/CD with GitHub Actions

### Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          cd client
          npm install
          npm run build
          npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          cd server
          npm install
          npm run build
          # Render auto-deploys on push
```

---

## 🧪 Testing Production

### Pre-Launch Checklist

- [ ] All pages load correctly
- [ ] Authentication works (email + Google)
- [ ] File upload works
- [ ] File download works
- [ ] Search functionality works
- [ ] Socket.IO real-time features work
- [ ] Mobile responsive design verified
- [ ] All API endpoints tested
- [ ] Error pages display correctly
- [ ] SSL certificates valid

### Load Testing

```powershell
# Install Artillery
npm install -g artillery

# Create load test config
# test-load.yml
```

```yaml
config:
  target: "https://your-api-domain.com"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - get:
          url: "/api/notes"
```

```powershell
artillery run test-load.yml
```

---

## 📱 PWA Configuration

### Add `manifest.json` in `client/public/`:

```json
{
  "name": "NoteMitra",
  "short_name": "NoteMitra",
  "description": "Student Notes Sharing Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🚨 Rollback Plan

If deployment fails:

### Frontend (Vercel)
1. Go to Deployments tab
2. Find previous working deployment
3. Click "Promote to Production"

### Backend (Render)
1. Suspend current service
2. Redeploy previous commit
3. Or use Render's rollback feature

---

## 📈 Post-Deployment

### Day 1
- Monitor error rates
- Check server resource usage
- Verify all features working
- Monitor database performance

### Week 1
- Analyze user behavior
- Check for performance bottlenecks
- Review error logs
- Gather user feedback

### Ongoing
- Regular security updates
- Database backups
- Performance optimization
- Feature improvements

---

## 🎉 Launch Checklist

- [ ] Domain DNS propagated
- [ ] SSL certificates active
- [ ] All environment variables set
- [ ] Database indexed and optimized
- [ ] Error monitoring active
- [ ] Analytics tracking
- [ ] Social media sharing configured
- [ ] SEO meta tags configured
- [ ] Sitemap generated
- [ ] robots.txt configured

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **AWS S3 Docs**: https://docs.aws.amazon.com/s3

---

**Congratulations! Your NoteMitra application is now live! 🎉**
