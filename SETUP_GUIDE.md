# 🚀 Production Services Setup Guide

This guide will help you set up all the production services needed for NoteMitra to function fully.

## 📋 Services Overview

1. **MongoDB Atlas** - Database (FREE Tier Available) ✅ HIGHEST PRIORITY
2. **AWS S3** - File Storage (FREE Tier: 5GB) ✅ HIGH PRIORITY
3. **Google OAuth** - Social Login (FREE) ⚠️ MEDIUM PRIORITY
4. **Claude AI** - AI Features (Paid, but has free tier) ⚠️ OPTIONAL

---

## 1. MongoDB Atlas Setup (15 minutes)

### Step 1: Create Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google or Email
3. Choose **FREE M0 Cluster** (512MB storage, perfect for development)

### Step 2: Create Cluster
1. Click **"Build a Database"**
2. Select **"Shared" (FREE)**
3. Choose **"AWS"** as cloud provider
4. Select closest region (e.g., `us-east-1` or `ap-south-1`)
5. Cluster Name: `NoteMitra-Cluster`
6. Click **"Create Cluster"** (takes 3-5 minutes)

### Step 3: Create Database User
1. Go to **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `notemitra_admin`
5. Password: Generate strong password (save it!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Whitelist IP Address
1. Go to **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - Or add your specific IP for security
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Go to **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **4.1 or later**
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://notemitra_admin:<password>@notemitra-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Replace `/` before `?` with `/notemitra` to specify database name:
   ```
   mongodb+srv://notemitra_admin:YOUR_PASSWORD@notemitra-cluster.xxxxx.mongodb.net/notemitra?retryWrites=true&w=majority
   ```

### Step 6: Update Backend Configuration
1. Open `c:\notemitra1\server\.env`
2. Replace the MONGODB_URI line with your connection string:
   ```env
   MONGODB_URI=mongodb+srv://notemitra_admin:YOUR_PASSWORD@notemitra-cluster.xxxxx.mongodb.net/notemitra?retryWrites=true&w=majority
   ```
3. Save the file
4. Restart backend server

### Verify MongoDB Connection
```powershell
# The backend logs should show:
# ✓ MongoDB connected successfully
```

---

## 2. AWS S3 Setup (20 minutes)

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com/
2. Click **"Create an AWS Account"**
3. Follow signup process (requires credit card, but won't charge for free tier)
4. Choose **"Basic Support - Free"** plan

### Step 2: Create S3 Bucket
1. Go to AWS Console: https://console.aws.amazon.com/
2. Search for **"S3"** in services
3. Click **"Create bucket"**
4. Bucket name: `notemitra-pdfs` (must be globally unique, add numbers if taken)
5. Region: Choose closest (e.g., `us-east-1` or `ap-south-1`)
6. **Uncheck** "Block all public access" (we'll use presigned URLs)
7. Acknowledge the warning
8. Click **"Create bucket"**

### Step 3: Configure CORS
1. Click on your bucket name
2. Go to **"Permissions"** tab
3. Scroll to **"Cross-origin resource sharing (CORS)"**
4. Click **"Edit"** and paste:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedOrigins": ["http://localhost:3000", "http://localhost:5000"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
5. Click **"Save changes"**

### Step 4: Create IAM User
1. Search for **"IAM"** in services
2. Click **"Users"** in left sidebar
3. Click **"Add users"**
4. User name: `notemitra-s3-user`
5. Select **"Access key - Programmatic access"**
6. Click **"Next: Permissions"**
7. Click **"Attach existing policies directly"**
8. Search and select **"AmazonS3FullAccess"**
9. Click **"Next: Tags"** (skip tags)
10. Click **"Next: Review"**
11. Click **"Create user"**

### Step 5: Save Credentials
1. **IMPORTANT**: Copy and save immediately:
   - Access key ID: `AKIAXXXXXXXXXXXXXXXX`
   - Secret access key: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
2. You can only see the secret key once!
3. Click **"Download .csv"** for backup

### Step 6: Update Backend Configuration
1. Open `c:\notemitra1\server\.env`
2. Update these lines:
   ```env
   AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=notemitra-pdfs
   ```
3. Save the file
4. Restart backend server

---

## 3. Google OAuth Setup (15 minutes)

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Click **"Select a project"** → **"New Project"**
3. Project name: `NoteMitra`
4. Click **"Create"**
5. Wait for project creation, then select it

### Step 2: Enable Google+ API
1. Go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and click **"Enable"**

### Step 3: Configure OAuth Consent Screen
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. User Type: **"External"**
3. Click **"Create"**
4. Fill in:
   - App name: `NoteMitra`
   - User support email: Your email
   - Developer contact: Your email
5. Click **"Save and Continue"**
6. Scopes: Click **"Add or Remove Scopes"**
   - Select: `.../auth/userinfo.email` and `.../auth/userinfo.profile`
7. Click **"Save and Continue"**
8. Test users: Add your email
9. Click **"Save and Continue"**

### Step 4: Create OAuth Credentials
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `NoteMitra Web Client`
5. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:5000`
6. Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
7. Click **"Create"**
8. **SAVE** the Client ID and Client Secret!

### Step 5: Update Configuration
1. Open `c:\notemitra1\server\.env`
2. Update these lines:
   ```env
   GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   ```
3. Save the file
4. Restart backend server

---

## 4. Claude AI Setup (5 minutes) - OPTIONAL

### Step 1: Get API Key
1. Go to https://console.anthropic.com/
2. Sign up for an account
3. Go to **"API Keys"**
4. Click **"Create Key"**
5. Name: `NoteMitra`
6. Copy the API key (starts with `sk-ant-...`)

### Step 2: Update Configuration
1. Open `c:\notemitra1\server\.env`
2. Update this line:
   ```env
   CLAUDE_API_KEY=sk-ant-api03-YOUR_KEY_HERE
   ```
3. Save the file
4. Restart backend server

### Features Enabled
- Auto-summary generation for uploaded PDFs
- Auto-tagging system
- Q&A bot for note content

**Note**: Claude API is paid but has a free trial. The backend will work without it.

---

## 🔄 After Setup - Switch to Full Backend

Once you have MongoDB Atlas configured, you can switch from the simple dev server to the full TypeScript backend:

1. Stop the simple server
2. Update `c:\notemitra1\server\.env` with all credentials above
3. Start full backend:
   ```powershell
   cd c:\notemitra1\server
   npm run dev
   ```

The full backend includes:
- Complete Mongoose models with validation
- ElasticSearch integration
- Socket.IO real-time features
- Advanced error handling
- Rate limiting
- Security middleware

---

## ✅ Verification Checklist

After setup, verify each service:

### MongoDB
```powershell
# Check backend logs for:
# ✓ MongoDB connected successfully
```

### AWS S3
```powershell
# Try uploading a note through /upload page
# Should see file in S3 bucket console
```

### Google OAuth
```powershell
# Click "Continue with Google" on sign-in page
# Should redirect to Google login
```

### Claude AI (Optional)
```powershell
# Upload a note
# Check if auto-summary is generated
```

---

## 💰 Cost Breakdown

| Service | Free Tier | Monthly Cost (if exceeded) |
|---------|-----------|---------------------------|
| MongoDB Atlas | 512MB forever | $9/month for 2GB |
| AWS S3 | 5GB for 12 months | $0.023/GB after |
| Google OAuth | Unlimited | FREE forever |
| Claude AI | Free trial | ~$15/month typical usage |

**Estimated Cost for Students**: **$0/month** during development with free tiers!

---

## 🆘 Troubleshooting

### MongoDB Connection Failed
- Check username/password in connection string
- Verify IP address is whitelisted
- Ensure cluster is active (not paused)

### S3 Upload Failed
- Verify AWS credentials are correct
- Check bucket name matches exactly
- Ensure IAM user has S3 permissions

### Google OAuth Not Working
- Check redirect URI matches exactly
- Verify OAuth consent screen is configured
- Add your email as test user

### Backend Won't Start
- Check all environment variables are set
- Look for error messages in terminal
- Try starting with simple server first

---

## 📞 Support

If you encounter issues:
1. Check the logs in backend terminal
2. Look for specific error messages
3. Verify all credentials are correct
4. Ensure services are active (not paused)

---

**Created**: October 26, 2025
**Last Updated**: October 26, 2025
