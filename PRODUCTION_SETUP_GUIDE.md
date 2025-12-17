# 🚀 Complete Setup Guide - MongoDB, AWS S3, Google OAuth

## 📋 Overview
This guide will help you set up:
1. **MongoDB Atlas** - Permanent data storage (15 min)
2. **AWS S3** - Real PDF file uploads/downloads (20 min)
3. **Google OAuth** - "Continue with Google" login (15 min)

---

## 1️⃣ MongoDB Atlas Setup (Permanent Data Storage)

### Why You Need This:
Currently using in-memory storage - data clears on server restart. MongoDB Atlas provides free permanent cloud storage.

### Step-by-Step Setup:

#### A. Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with your email (use `pavanmanepalli521@gmail.com` or `mohangupta16@gmail.com`)
3. Choose **FREE** tier (M0 Sandbox)
4. Select **AWS** as cloud provider
5. Choose closest region (e.g., Mumbai `ap-south-1` or Singapore `ap-southeast-1`)
6. Cluster name: `notemitra-cluster` (or any name)
7. Click **Create Cluster** (takes 3-5 minutes)

#### B. Create Database User
1. In left sidebar, click **Database Access**
2. Click **Add New Database User**
3. Authentication Method: **Password**
4. Username: `notemitra_admin`
5. Password: Click **Autogenerate Secure Password** (COPY THIS!)
6. Database User Privileges: **Atlas admin** (or Read/Write to any database)
7. Click **Add User**

#### C. Allow Network Access
1. In left sidebar, click **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (0.0.0.0/0)
   - For production, use specific IP addresses
   - For development, this is fine
4. Click **Confirm**

#### D. Get Connection String
1. Go back to **Database** in left sidebar
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Driver: **Node.js** / Version: **5.5 or later**
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://notemitra_admin:<password>@notemitra-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with the password you copied earlier
7. Add database name after `.net/`: `.net/notemitra?retryWrites=true`

#### E. Update Your .env File
Open `c:\notemitra1\server\.env` and update:
```env
MONGODB_URI=mongodb+srv://notemitra_admin:YOUR_PASSWORD_HERE@notemitra-cluster.xxxxx.mongodb.net/notemitra?retryWrites=true&w=majority
```

#### F. Test Connection
1. Restart your backend server
2. Look for: `✅ MongoDB connected successfully`
3. No more "using in-memory storage" warning!

---

## 2️⃣ AWS S3 Setup (Real PDF File Storage)

### Why You Need This:
Currently notes show placeholder URLs. AWS S3 provides real file storage and secure download links.

### Step-by-Step Setup:

#### A. Create AWS Account
1. Go to https://aws.amazon.com/free/
2. Click **Create a Free Account**
3. Email: Use `pavanmanepalli521@gmail.com` or `mohangupta16@gmail.com`
4. Account type: **Personal**
5. Complete registration (requires credit card but FREE tier covers this)
6. Free tier includes:
   - 5 GB storage
   - 20,000 GET requests
   - 2,000 PUT requests
   - Perfect for development!

#### B. Create S3 Bucket
1. Sign in to AWS Console: https://console.aws.amazon.com/
2. Search for **S3** in top search bar
3. Click **Create bucket**
4. Bucket name: `notemitra-pdfs` (must be globally unique, add random numbers if taken)
5. Region: Choose closest (e.g., `ap-south-1` Mumbai)
6. **Block Public Access settings**: Keep ALL checked (secure)
7. Versioning: Disabled
8. Encryption: Server-side encryption with Amazon S3 managed keys (SSE-S3)
9. Click **Create bucket**

#### C. Create IAM User for Programmatic Access
1. Search for **IAM** in AWS Console
2. Click **Users** in left sidebar
3. Click **Add users**
4. User name: `notemitra-app`
5. Select **Access key - Programmatic access**
6. Click **Next: Permissions**
7. Click **Attach existing policies directly**
8. Search and select: **AmazonS3FullAccess**
9. Click **Next: Tags** (skip tags)
10. Click **Next: Review**
11. Click **Create user**
12. **IMPORTANT**: Copy both:
    - Access key ID: `AKIAXXXXXXXXXXXXXXXX`
    - Secret access key: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - You can't see secret key again!

#### D. Configure CORS for Your Bucket
1. Go back to S3
2. Click on your bucket `notemitra-pdfs`
3. Go to **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)**
5. Click **Edit**
6. Paste this configuration:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:3000"],
        "ExposeHeaders": ["ETag"]
    }
]
```
7. Click **Save changes**

#### E. Update Your .env File
Open `c:\notemitra1\server\.env` and add:
```env
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=ap-south-1
AWS_S3_BUCKET=notemitra-pdfs
```

#### F. Install AWS SDK
Open terminal in server folder:
```powershell
cd c:\notemitra1\server
npm install aws-sdk
```

#### G. Update server-enhanced.js
I'll create the S3 integration code in the next step.

---

## 3️⃣ Google OAuth Setup (Social Login)

### Why You Need This:
Enables "Continue with Google" button for easier user registration/login.

### Step-by-Step Setup:

#### A. Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Sign in with your Google account
3. Click **Select a project** (top bar)
4. Click **New Project**
5. Project name: `NoteMitra`
6. Click **Create**
7. Wait for project creation (10-15 seconds)
8. Make sure your new project is selected in top bar

#### B. Enable Google+ API
1. In left menu, go to **APIs & Services** → **Library**
2. Search for **Google+ API**
3. Click on it
4. Click **Enable**

#### C. Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. User Type: Select **External**
3. Click **Create**
4. Fill in:
   - App name: `NoteMitra`
   - User support email: Your email
   - App logo: (optional, skip for now)
   - Application home page: `http://localhost:3000`
   - Authorized domains: Leave empty for localhost
   - Developer contact: Your email
5. Click **Save and Continue**
6. Scopes: Click **Add or Remove Scopes**
   - Select: `userinfo.email`
   - Select: `userinfo.profile`
   - Click **Update**
   - Click **Save and Continue**
7. Test users: Click **Add Users**
   - Add: `pavanmanepalli521@gmail.com`
   - Add: `mohangupta16@gmail.com`
   - Click **Save and Continue**
8. Review and click **Back to Dashboard**

#### D. Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `NoteMitra Web Client`
5. Authorized JavaScript origins:
   - Click **Add URI**
   - Enter: `http://localhost:3000`
6. Authorized redirect URIs:
   - Click **Add URI**
   - Enter: `http://localhost:5000/api/auth/google/callback`
7. Click **Create**
8. **COPY BOTH**:
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `xxxxxxxxxxxxxxxxx`
9. Click **OK**

#### E. Update Your .env File
Open `c:\notemitra1\server\.env` and update:
```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

#### F. Test Google OAuth
1. Restart your backend server
2. Go to http://localhost:3000/auth/signin
3. Click **Continue with Google**
4. Should redirect to Google login
5. After login, should redirect back to your app

---

## 🔍 Verification Checklist

### MongoDB Atlas ✅
- [ ] Cluster created and running
- [ ] Database user created
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string in .env
- [ ] Backend shows "MongoDB connected successfully"
- [ ] Data persists after server restart

### AWS S3 ✅
- [ ] S3 bucket created
- [ ] IAM user created with S3 access
- [ ] Access keys copied
- [ ] CORS configured
- [ ] Credentials in .env
- [ ] aws-sdk installed
- [ ] Can upload PDFs successfully
- [ ] Can download PDFs with signed URLs

### Google OAuth ✅
- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth client credentials created
- [ ] Redirect URI configured correctly
- [ ] Credentials in .env
- [ ] "Continue with Google" button works
- [ ] Can login with Google account

---

## 🎯 Your Complete .env File Should Look Like:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://notemitra_admin:YOUR_PASSWORD@notemitra-cluster.xxxxx.mongodb.net/notemitra?retryWrites=true&w=majority

# AWS S3
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=ap-south-1
AWS_S3_BUCKET=notemitra-pdfs

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Session Secret
SESSION_SECRET=notemitra-secret-key-change-in-production-use-random-string
```

---

## 🚨 Common Issues & Solutions

### MongoDB Connection Failed
- **Issue**: `ECONNREFUSED ::1:27017`
- **Solution**: Double-check connection string, ensure `<password>` is replaced, verify network access allows 0.0.0.0/0

### AWS S3 Upload Failed
- **Issue**: `Access Denied` or `SignatureDoesNotMatch`
- **Solution**: Verify IAM user has S3FullAccess, check access keys are correct in .env

### Google OAuth Not Working
- **Issue**: Redirect URI mismatch
- **Solution**: Ensure redirect URI in Google Console exactly matches: `http://localhost:5000/api/auth/google/callback`

### CORS Errors
- **Issue**: Browser blocks requests
- **Solution**: 
  - S3: Check CORS configuration allows your origin
  - Backend: Ensure CORS allows `http://localhost:3000`

---

## 📱 Quick Start Commands

After configuring all services:

```powershell
# Terminal 1 - Backend
cd c:\notemitra1\server
node server-enhanced.js

# Terminal 2 - Frontend  
cd c:\notemitra1\client
npm run dev
```

Check console for:
- ✅ MongoDB connected successfully
- ✅ Google OAuth: Enabled
- ✅ AWS S3: Ready

---

## 🎉 Success!

Once all three are configured:
1. **MongoDB Atlas**: Your data persists forever (no more losing data on restart)
2. **AWS S3**: Real PDF uploads and secure downloads
3. **Google OAuth**: Users can sign in with Google

Your NoteMitra platform is now production-ready! 🚀

---

## 💡 Pro Tips

1. **MongoDB Atlas**: Set up automated backups in cluster settings
2. **AWS S3**: Enable CloudFront CDN for faster downloads (advanced)
3. **Google OAuth**: Add more scopes for profile pictures
4. **Security**: For production, use specific IP addresses for MongoDB, add rate limiting
5. **Monitoring**: Use MongoDB Atlas monitoring, AWS CloudWatch for S3, Google Analytics

---

## 📞 Need Help?

If you encounter issues:
1. Check server console for error messages
2. Verify all credentials in .env are correct
3. Ensure no extra spaces in .env values
4. Restart servers after .env changes
5. Check firewall isn't blocking connections

Happy coding! 🎯
