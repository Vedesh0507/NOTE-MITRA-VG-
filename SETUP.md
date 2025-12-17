# NoteMitra - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- AWS S3 bucket (or Firebase Storage)
- Google OAuth credentials
- (Optional) ElasticSearch instance
- (Optional) Claude API key

### 1. Clone and Setup

```powershell
# Navigate to project
cd c:\notemitra1

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Backend Configuration

#### Create `.env` file in `server/` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notemitra?retryWrites=true&w=majority

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=notemitra-pdfs

# ElasticSearch (Optional - can skip for MVP)
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_API_KEY=your_elasticsearch_api_key

# Claude AI (Optional - will use fallbacks if not set)
CLAUDE_API_KEY=sk-ant-your-claude-api-key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload Limits
MAX_FILE_SIZE=104857600
ALLOWED_FILE_TYPES=application/pdf
```

### 3. Frontend Configuration

#### Create `.env.local` file in `client/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 4. MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or 0.0.0.0/0 for development)
5. Get connection string and add to `MONGODB_URI`

### 5. AWS S3 Setup

1. Create an S3 bucket named `notemitra-pdfs`
2. Create IAM user with S3 access
3. Add credentials to `.env`
4. Enable CORS on bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 6. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `https://your-api-domain.com/api/auth/google/callback`
6. Add credentials to both backend and frontend `.env` files

### 7. Run the Application

#### Terminal 1 - Backend:
```powershell
cd server
npm run dev
```

Server will run on http://localhost:5000

#### Terminal 2 - Frontend:
```powershell
cd client
npm run dev
```

Frontend will run on http://localhost:3000

### 8. Test the Application

1. Open http://localhost:3000
2. Create an account or login with Google
3. Upload a test PDF note
4. Browse and download notes

## 📦 Production Build

### Backend Production

```powershell
cd server
npm run build
npm start
```

### Frontend Production

```powershell
cd client
npm run build
npm start
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Check if IP is whitelisted in MongoDB Atlas
- Verify connection string format
- Ensure database user has proper permissions

### S3 Upload Fails
- Verify AWS credentials
- Check bucket CORS configuration
- Ensure bucket policy allows uploads

### Google OAuth Not Working
- Verify redirect URIs match exactly
- Check if Google+ API is enabled
- Confirm client ID and secret are correct

### Port Already in Use
```powershell
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

## 🔐 Security Checklist

- [ ] Change all default secrets in production
- [ ] Enable rate limiting
- [ ] Setup HTTPS/SSL certificates
- [ ] Configure proper CORS origins
- [ ] Implement file virus scanning
- [ ] Setup monitoring and logging
- [ ] Regular security updates
- [ ] Backup database regularly

## 📊 Optional Services

### ElasticSearch (Advanced Search)

1. Deploy ElasticSearch on Elastic Cloud or self-host
2. Add URL and API key to `.env`
3. Backend will automatically sync notes

### Claude AI (Enhanced Features)

1. Get API key from Anthropic
2. Add to `CLAUDE_API_KEY` in `.env`
3. Features enabled:
   - Auto-summaries for uploads
   - AI tagging
   - Content moderation
   - Q&A bot in chat

## 📝 Next Steps

1. Customize branding and colors in `client/app/globals.css`
2. Add your college-specific subjects and branches
3. Setup email verification (optional)
4. Configure CDN for static assets
5. Setup analytics (Google Analytics, etc.)
6. Add monitoring (Sentry, LogRocket, etc.)

## 🎓 Development Tips

- Use `npm run lint` to check code quality
- Backend hot-reloads with nodemon
- Frontend hot-reloads automatically
- Check browser console for errors
- Use MongoDB Compass for database inspection
- Test uploads with small PDFs first

## 📞 Support

For issues or questions:
- Check the README.md
- Review API documentation
- Check TypeScript errors in VS Code
- Verify environment variables

Happy coding! 🚀
