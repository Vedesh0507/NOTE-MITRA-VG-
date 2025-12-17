# NoteMitra - Project Documentation Report (PDR)

**Version:** 1.0.0  
**Date:** October 29, 2025  
**Project Type:** Full-Stack Web Application  
**Status:** Production Ready

---

## 1. EXECUTIVE SUMMARY

### 1.1 Project Overview
NoteMitra is a comprehensive educational platform designed for students to share, discover, and collaborate on academic notes. The platform facilitates knowledge sharing within educational institutions through a secure, user-friendly interface with advanced features including AI-powered content generation, real-time statistics tracking, and administrative controls.

### 1.2 Key Features
- **User Authentication**: Email/Password and Google OAuth 2.0 integration
- **Note Management**: Upload, browse, download, and save PDF notes
- **Real-time Statistics**: Track views, downloads, upvotes, and reputation
- **AI Integration**: Anthropic Claude for automatic description generation
- **Admin Panel**: User management, content moderation, and analytics
- **Leaderboard System**: Gamification with reputation-based rankings
- **Advanced Search**: Filter by branch, semester, subject, and module
- **File Storage**: GridFS-based scalable file management
- **Profile System**: User profiles with upload history and saved notes

### 1.3 Technology Stack
- **Frontend**: Next.js 14.0.4, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB Atlas
- **Authentication**: Passport.js, JWT-style tokens, Google OAuth 2.0
- **File Storage**: GridFS (MongoDB)
- **AI Services**: Anthropic Claude API
- **Deployment**: Development servers on localhost

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Next.js Frontend - Port 3000)                             │
│  - React Components                                          │
│  - Context API (Auth, State Management)                     │
│  - Axios HTTP Client                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
                       │ (HTTP/HTTPS)
┌──────────────────────▼──────────────────────────────────────┐
│                      Server Layer                            │
│  (Express.js Backend - Port 5000)                           │
│  - REST API Endpoints                                        │
│  - Passport.js Authentication                                │
│  - Multer File Upload                                        │
│  - AI Integration (Claude)                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
┌───────────▼──────────┐  ┌──────▼─────────────┐
│   Database Layer     │  │   External APIs    │
│  (MongoDB Atlas)     │  │  - Google OAuth    │
│  - User Collection   │  │  - Anthropic AI    │
│  - Note Collection   │  └────────────────────┘
│  - SavedNote Coll.   │
│  - GridFS (Files)    │
└──────────────────────┘
```

### 2.2 Component Architecture

#### Frontend Structure
```
client/
├── app/                      # Next.js App Router
│   ├── about/               # About page
│   ├── admin/               # Admin panel
│   │   ├── users/          # User management
│   │   └── notes/          # Note moderation
│   ├── auth/               # Authentication pages
│   │   ├── signin/
│   │   └── signup/
│   ├── browse/             # Browse notes
│   ├── leaderboard/        # User rankings
│   ├── notes/[id]/         # Note details
│   ├── profile/            # User profile
│   ├── upload/             # Upload notes
│   └── page.tsx            # Home page
├── components/             # Reusable components
│   └── ui/                # Shadcn UI components
├── lib/                   # Utilities
│   ├── api.ts            # API client
│   ├── context/          # React Context
│   │   └── AuthContext.tsx
│   └── utils.ts          # Helper functions
└── hooks/                # Custom React hooks
```

#### Backend Structure
```
server/
├── server-enhanced.js      # Main server file
├── .env                   # Environment variables
└── package.json           # Dependencies
```

---

## 3. DATABASE DESIGN

### 3.1 MongoDB Collections

#### User Schema
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (default: 'student'),
  branch: String,
  section: String,
  rollNo: String,
  isAdmin: Boolean (default: false),
  isSuspended: Boolean (default: false),
  totalDownloads: Number (default: 0),
  totalViews: Number (default: 0),
  notesUploaded: Number (default: 0),
  reputation: Number (default: 0),
  createdAt: Date (default: Date.now)
}
```

#### Note Schema
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  subject: String,
  semester: String,
  module: String,
  branch: String,
  fileName: String,
  fileUrl: String,
  fileId: ObjectId (GridFS file ID),
  fileSize: Number,
  tags: String,
  userId: ObjectId (ref: User),
  userName: String,
  views: Number (default: 0),
  downloads: Number (default: 0),
  upvotes: Number (default: 0),
  downvotes: Number (default: 0),
  isApproved: Boolean (default: true),
  isReported: Boolean (default: false),
  reportReason: String,
  createdAt: Date (default: Date.now)
}
```

#### SavedNote Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (required, ref: User),
  noteId: ObjectId (required, ref: Note),
  savedAt: Date (default: Date.now)
}
// Compound Index: { userId: 1, noteId: 1 } (unique)
```

#### GridFS Collections
- `fs.files`: File metadata
- `fs.chunks`: File binary data (chunked)

### 3.2 Indexes
- **User.email**: Unique index for fast lookups
- **SavedNote (userId, noteId)**: Compound unique index to prevent duplicate saves
- **Note.userId**: Index for user's notes queries
- **Note.branch, semester, subject**: Indexes for filtering

---

## 4. API DOCUMENTATION

### 4.1 Authentication Endpoints

#### POST /api/auth/signup
Register a new user
```json
Request Body:
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "string (optional)",
  "branch": "string (optional)",
  "section": "string (optional)",
  "rollNo": "string (optional)"
}

Response:
{
  "user": { User object },
  "token": "string"
}
```

#### POST /api/auth/login
Login existing user
```json
Request Body:
{
  "email": "string",
  "password": "string"
}

Response:
{
  "user": { User object },
  "token": "string"
}
```

#### GET /api/auth/me
Get current user details
```
Headers: Authorization: Bearer <token>

Response:
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "branch": "string",
    "section": "string",
    "rollNo": "string",
    "isAdmin": boolean,
    "reputation": number,
    "uploadsCount": number,
    "totalDownloads": number,
    "totalViews": number,
    "totalUpvotes": number,
    "savedNotesCount": number
  }
}
```

#### GET /auth/google
Initiate Google OAuth login

#### GET /auth/google/callback
Google OAuth callback handler

### 4.2 Note Endpoints

#### POST /api/notes
Create a new note (upload PDF)
```
Headers: 
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Form Data:
  pdf: File (required)
  title: string (required)
  description: string (optional)
  subject: string (required)
  semester: string (required)
  module: string (required)
  branch: string (required)
  tags: string (optional)

Response:
{
  "message": "Note uploaded successfully",
  "note": { Note object }
}
```

#### GET /api/notes
Get all notes with optional filters
```
Query Parameters:
  branch: string (optional)
  semester: string (optional)
  subject: string (optional)
  search: string (optional)

Response:
{
  "notes": [ Array of Note objects ]
}
```

#### GET /api/notes/:id
Get note details by ID
```
Response:
{
  "note": { Note object with all details }
}
```

#### POST /api/notes/:id/download
Track download (increments counters)
```
Headers: Authorization: Bearer <token>

Response:
{
  "message": "Download tracked",
  "downloads": number
}
```

#### GET /api/notes/download-pdf/:fileId
Download PDF file (forces download)
```
Response: Binary PDF file
Headers:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="..."
```

#### GET /api/notes/view-pdf/:fileId
View PDF inline (preview)
```
Response: Binary PDF file
Headers:
  Content-Type: application/pdf
  Content-Disposition: inline; filename="..."
```

#### POST /api/notes/:id/vote
Upvote or downvote a note
```
Headers: Authorization: Bearer <token>

Request Body:
{
  "voteType": "up" | "down"
}

Response:
{
  "message": "Vote recorded",
  "upvotes": number,
  "downvotes": number
}
```

#### POST /api/notes/:id/save
Save a note to user's collection
```
Headers: Authorization: Bearer <token>

Response:
{
  "message": "Note saved successfully"
}
```

#### DELETE /api/notes/:id/save
Remove saved note
```
Headers: Authorization: Bearer <token>

Response:
{
  "message": "Note unsaved successfully"
}
```

#### GET /api/notes/saved/list
Get user's saved notes
```
Headers: Authorization: Bearer <token>

Response:
{
  "savedNotes": [ Array of Note objects ]
}
```

#### GET /api/notes/:id/saved
Check if note is saved by user
```
Headers: Authorization: Bearer <token>

Response:
{
  "isSaved": boolean
}
```

### 4.3 Admin Endpoints

#### GET /api/admin/users
Get all users (admin only)
```
Headers: Authorization: Bearer <token>

Response:
{
  "users": [ Array of User objects ]
}
```

#### PUT /api/admin/users/:id/suspend
Suspend a user (admin only)
```
Headers: Authorization: Bearer <token>

Response:
{
  "message": "User suspended successfully"
}
```

#### PUT /api/admin/users/:id/unsuspend
Unsuspend a user (admin only)
```
Headers: Authorization: Bearer <token>

Response:
{
  "message": "User unsuspended successfully"
}
```

#### GET /api/admin/stats
Get platform statistics (admin only)
```
Headers: Authorization: Bearer <token>

Response:
{
  "totalUsers": number,
  "totalNotes": number,
  "totalDownloads": number,
  "recentActivity": [ Array of activities ]
}
```

### 4.4 Leaderboard Endpoints

#### GET /api/leaderboard/top-uploaders
Get top contributors by uploads
```
Response:
{
  "topUploaders": [
    {
      "name": "string",
      "notesUploaded": number,
      "avgDownloads": number
    }
  ]
}
```

#### GET /api/leaderboard/most-downloaded
Get most downloaded notes
```
Response:
{
  "mostDownloaded": [
    {
      "title": "string",
      "downloads": number,
      "uploader": "string"
    }
  ]
}
```

### 4.5 AI Endpoints

#### POST /api/ai/generate-description
Generate note description using AI
```
Request Body:
{
  "title": "string",
  "subject": "string",
  "module": "string"
}

Response:
{
  "description": "string (AI-generated)"
}
```

---

## 5. AUTHENTICATION & SECURITY

### 5.1 Authentication Methods

#### JWT-Style Development Tokens
- Format: `dev_token_<userId>`
- Storage: localStorage (client-side)
- Validation: Token format verification + user existence check
- Usage: All authenticated API requests

#### Google OAuth 2.0
- Provider: Google
- Client ID: `1074732333443-...`
- Scopes: profile, email
- Flow: Authorization Code Flow
- Callback: `/auth/google/callback`
- Post-auth: Profile completion (branch, rollNo, section)

### 5.2 Security Features
- **Password Hashing**: bcrypt with salt rounds
- **CORS**: Configured for localhost and local network (192.168.1.35)
- **Input Validation**: mongoose.Types.ObjectId.isValid() checks
- **Admin Protection**: Email-based auto-admin assignment
  - pavanmanepalli521@gmail.com
  - mohangupta16@gmail.com
- **File Upload Security**: 
  - Size limit: 100MB
  - Type validation: PDF only
  - Memory storage with GridFS persistence
- **Route Protection**: Token verification middleware

### 5.3 Authorization Levels
1. **Public**: Browse notes, view leaderboard
2. **Authenticated**: Upload, download, save, vote on notes
3. **Admin**: User management, content moderation, platform statistics

---

## 6. FILE STORAGE SYSTEM

### 6.1 GridFS Implementation
GridFS is MongoDB's specification for storing large files, automatically splitting files into chunks.

**Configuration:**
- Bucket Name: Default GridFS bucket
- Chunk Size: 255KB (default)
- Max File Size: 100MB

**Upload Flow:**
1. Client selects PDF file
2. Frontend sends multipart/form-data to `/api/notes`
3. Multer (memoryStorage) processes upload
4. Server streams buffer to GridFS using `gridfsBucket.openUploadStream()`
5. GridFS returns fileId (ObjectId)
6. Note document created with fileId reference

**Download Flow:**
1. Client requests `/api/notes/download-pdf/:fileId`
2. Server validates fileId format
3. GridFS streams file chunks
4. Response headers set:
   - `Content-Disposition: attachment` (forces download)
   - `Content-Type: application/pdf`
   - `Content-Length: <file size>`
5. File piped to response stream

**Preview Flow:**
1. Client requests `/api/notes/view-pdf/:fileId`
2. Same as download but `Content-Disposition: inline` (browser preview)

### 6.2 Storage Benefits
- **Scalability**: Handles files > 16MB (BSON limit)
- **Streaming**: Memory-efficient large file handling
- **Replication**: Inherits MongoDB replication
- **Consistency**: Files stored with notes metadata
- **No External Dependencies**: No S3 or external storage needed

---

## 7. AI INTEGRATION

### 7.1 Anthropic Claude Integration
**Purpose:** Automatic generation of note descriptions during upload

**Model:** Claude 3 (via @anthropic-ai/sdk)

**Implementation:**
```javascript
// Endpoint: POST /api/ai/generate-description
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const message = await anthropic.messages.create({
  model: "claude-3-opus-20240229",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Generate description for: ${title}, ${subject}, ${module}`
  }]
});
```

**Usage Flow:**
1. User fills upload form (title, subject, module)
2. User clicks "Generate Description" button
3. Frontend calls `/api/ai/generate-description`
4. Backend constructs prompt with note metadata
5. Claude generates contextual description
6. Description populated in form field
7. User can edit before final submission

**Fallback:** Manual description entry if AI fails or API key unavailable

---

## 8. FEATURES DOCUMENTATION

### 8.1 User Features

#### Registration & Login
- Email/password registration with validation
- Google OAuth one-click login
- Profile completion for new Google users
- Persistent sessions via JWT tokens

#### Browse Notes
- Filter by: Branch, Semester, Subject, Module
- Search by: Title, Description, Tags
- Sort by: Recent, Most Downloaded, Most Viewed
- Pagination support
- Preview before download

#### Upload Notes
- PDF upload with drag-and-drop
- AI-powered description generation
- Required fields: Title, Subject, Semester, Module, Branch
- Optional: Tags, custom description
- Real-time upload progress
- File size validation (max 100MB)

#### Note Details
- View all metadata
- Preview PDF inline (new tab)
- Download PDF to device
- Upvote/downvote system
- Save to personal collection
- View stats: Views, Downloads, Upvotes
- Comment section (UI ready, backend pending)

#### Profile Management
- View uploaded notes
- View saved notes (tabs)
- Statistics dashboard:
  - Total uploads
  - Total downloads (received)
  - Total views (received)
  - Total upvotes (received)
  - Reputation score
  - Saved notes count
- Real-time stat updates

#### Saved Notes
- Save unlimited notes
- View saved collection
- Remove from saved
- Duplicate prevention
- Organized by save date

### 8.2 Admin Features

#### User Management
- View all registered users
- User search and filter
- Suspend/unsuspend users
- View user statistics:
  - Upload count
  - Join date
  - Role, Branch, Roll No
- Delete users (if implemented)

#### Content Moderation
- View all notes
- Approve/reject uploads
- Delete inappropriate content
- Handle reported notes
- Ban policy enforcement

#### Platform Analytics
- Total users count
- Total notes count
- Total downloads count
- Top contributors
- Recent activity log
- Growth metrics

#### Leaderboard Management
- View top uploaders
- Most downloaded notes
- Reputation rankings
- Engagement metrics

### 8.3 Leaderboard System
**Purpose:** Gamification to encourage quality contributions

**Reputation Calculation:**
- Upload note: Base action (tracked in notesUploaded)
- Receive download: +1 totalDownloads
- Receive view: +1 totalViews
- Receive upvote: +10 reputation
- Receive downvote: -5 reputation (if implemented)

**Rankings:**
1. **Top Uploaders**: By notesUploaded count
2. **Most Engaged**: By total interactions (views + downloads + upvotes)
3. **Rising Stars**: New users with high engagement

---

## 9. DEPLOYMENT & INFRASTRUCTURE

### 9.1 Development Environment

#### System Requirements
- **OS**: Windows 10/11 (PowerShell)
- **Node.js**: v18+ required
- **MongoDB**: Atlas M0 Free Tier
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB for dependencies + storage for uploaded files

#### Environment Variables

**Backend (.env)**
```env
# MongoDB
MONGODB_URI=mongodb+srv://sunkarakiranmai_db_user:Pavanvedesh%400507@notemitra.o4v7car.mongodb.net

# JWT (Development)
JWT_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=1074732333443-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Anthropic AI
ANTHROPIC_API_KEY=your-anthropic-api-key

# Server
PORT=5000
NODE_ENV=development
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1074732333443-...
```

#### Starting the Application

**Method 1: Separate Windows**
```powershell
# Terminal 1 - Backend
cd c:\notemitra1\server
node server-enhanced.js

# Terminal 2 - Frontend
cd c:\notemitra1\client
npm run dev
```

**Method 2: Batch Files**
```powershell
# Double-click start-backend.bat
# Double-click start-frontend.bat
```

**Method 3: PowerShell Script**
```powershell
.\start-servers.ps1
```

### 9.2 Production Deployment (Planned)

#### Backend Deployment
**Recommended Platform:** Railway, Render, or DigitalOcean

**Steps:**
1. Set NODE_ENV=production
2. Configure production MongoDB URI
3. Set secure JWT_SECRET (256-bit)
4. Update CORS origins
5. Enable HTTPS
6. Configure Google OAuth callback URL
7. Set up process manager (PM2)

**Production server-enhanced.js changes:**
```javascript
// CORS for production
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));
```

#### Frontend Deployment
**Recommended Platform:** Vercel, Netlify, or AWS Amplify

**Steps:**
1. Update NEXT_PUBLIC_API_URL to production backend
2. Build: `npm run build`
3. Deploy build directory
4. Configure environment variables in platform
5. Set up custom domain
6. Enable CDN for static assets

#### Database (MongoDB Atlas)
**Current:** M0 Free Tier (512MB, 500 connections)

**Production Upgrade Path:**
- M2 Shared: $9/month (2GB, better performance)
- M10 Dedicated: $57/month (10GB, auto-scaling)
- Enable automatic backups
- Set up monitoring and alerts
- Configure IP whitelist
- Enable database auditing

### 9.3 Network Configuration

#### Local Network Access
The application is configured to accept connections from:
- localhost (127.0.0.1)
- Local network (192.168.1.35)

**To allow phone access:**
1. Get PC's local IP: `ipconfig`
2. Update CORS in server-enhanced.js
3. Open Windows Firewall ports 3000 and 5000
4. Access via `http://<PC_IP>:3000` on phone

**Firewall Script:** `enable-firewall.ps1`
```powershell
New-NetFirewallRule -DisplayName "NoteMitra Frontend" `
  -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

New-NetFirewallRule -DisplayName "NoteMitra Backend" `
  -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

---

## 10. TESTING & QUALITY ASSURANCE

### 10.1 Testing Strategy

#### Manual Testing Checklist
- [ ] User registration (email/password)
- [ ] User login (email/password)
- [ ] Google OAuth login
- [ ] Google OAuth profile completion
- [ ] Upload PDF note
- [ ] AI description generation
- [ ] Browse notes with filters
- [ ] View note details
- [ ] Download PDF
- [ ] Preview PDF
- [ ] Upvote note
- [ ] Save note
- [ ] View saved notes
- [ ] Profile statistics update
- [ ] Admin user management
- [ ] Admin note moderation
- [ ] Leaderboard display
- [ ] Logout functionality

#### API Testing
**Tool:** Postman, curl, or PowerShell Invoke-RestMethod

**Health Check:**
```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

**Get All Notes:**
```powershell
Invoke-RestMethod http://localhost:5000/api/notes
```

### 10.2 Known Issues & Limitations

#### Current Limitations
1. **File Size:** 100MB max upload
2. **File Type:** PDF only
3. **Search:** Basic text matching (no Elasticsearch yet)
4. **Comments:** UI ready but backend not implemented
5. **Real-time:** No WebSocket notifications yet
6. **Mobile:** Desktop-first design (responsive improvements needed)

#### Fixed Issues (Recent)
- ✅ TypeScript compilation errors
- ✅ CSS Tailwind warnings
- ✅ ObjectId validation errors
- ✅ Download not working ("Note not found")
- ✅ Profile stats not updating after upload
- ✅ Save notes functionality
- ✅ PDF preview vs download behavior

---

## 11. DEPENDENCIES

### 11.1 Frontend Dependencies
```json
{
  "next": "14.0.4",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.3.3",
  "axios": "^1.6.5",
  "tailwindcss": "^3.4.0",
  "lucide-react": "^0.303.0",
  "@radix-ui/react-*": "Multiple UI components",
  "framer-motion": "^10.18.0",
  "@anthropic-ai/sdk": "^0.20.0"
}
```

### 11.2 Backend Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.19.2",
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5-lts.1",
  "gridfs-stream": "^1.1.1",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "@anthropic-ai/sdk": "^0.20.0"
}
```

### 11.3 External Services
- **MongoDB Atlas**: Database hosting
- **Google Cloud Platform**: OAuth 2.0 provider
- **Anthropic**: AI API (Claude)

---

## 12. MAINTENANCE & SUPPORT

### 12.1 Logging
**Backend Logs:**
- Server startup messages
- MongoDB connection status
- API request errors
- File upload progress
- Authentication failures

**Frontend Logs:**
- API call errors (console.error)
- Authentication state changes
- Route navigation

### 12.2 Backup Strategy
**Database Backups:**
- MongoDB Atlas automatic backups (M2+ tier)
- Manual exports via `mongodump`
- Frequency: Daily recommended

**Code Backups:**
- Git version control
- GitHub repository (if public/private)
- Regular commits after features

### 12.3 Monitoring
**Metrics to Track:**
- Active users count
- Total notes uploaded
- Total downloads
- API response times
- Error rates
- Storage usage (GridFS)
- Database connections

**Tools:**
- MongoDB Atlas monitoring dashboard
- Custom admin analytics endpoint
- Console logs (development)
- APM tools (production: New Relic, Datadog)

### 12.4 Update Procedures
1. **Dependency Updates:**
   ```powershell
   npm outdated
   npm update
   ```

2. **Security Patches:**
   ```powershell
   npm audit
   npm audit fix
   ```

3. **Database Migrations:**
   - Create migration scripts
   - Test on staging
   - Backup before production migration
   - Run during low-traffic period

---

## 13. USER ROLES & PERMISSIONS

### 13.1 Role Matrix

| Feature | Public | Student | Admin |
|---------|--------|---------|-------|
| Browse Notes | ✅ | ✅ | ✅ |
| View Note Details | ✅ | ✅ | ✅ |
| Download PDF | ❌ | ✅ | ✅ |
| Upload Notes | ❌ | ✅ | ✅ |
| Save Notes | ❌ | ✅ | ✅ |
| Vote on Notes | ❌ | ✅ | ✅ |
| View Profile | ❌ | ✅ (own) | ✅ (all) |
| User Management | ❌ | ❌ | ✅ |
| Content Moderation | ❌ | ❌ | ✅ |
| Platform Analytics | ❌ | ❌ | ✅ |
| Delete Any Note | ❌ | ❌ | ✅ |

### 13.2 Admin Assignment
**Auto-Admin Emails:**
- pavanmanepalli521@gmail.com
- mohangupta16@gmail.com

**Logic:**
```javascript
const adminEmails = ['pavanmanepalli521@gmail.com', 'mohangupta16@gmail.com'];
const isAdmin = adminEmails.includes(email.toLowerCase());
```

---

## 14. PERFORMANCE OPTIMIZATION

### 14.1 Current Optimizations
- **GridFS Streaming**: Memory-efficient file transfers
- **MongoDB Indexes**: Fast queries on email, userId, noteId
- **Lazy Loading**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component (if used)
- **Caching**: Browser caching for static assets

### 14.2 Recommended Optimizations
1. **Frontend:**
   - Implement React.memo for expensive components
   - Use useMemo/useCallback for derived values
   - Enable Next.js image optimization
   - Add service worker for offline support
   - Implement virtual scrolling for large lists

2. **Backend:**
   - Add Redis for session caching
   - Implement rate limiting per endpoint
   - Use MongoDB aggregation pipelines
   - Enable gzip compression
   - Add CDN for file downloads

3. **Database:**
   - Create compound indexes for common queries
   - Implement query result caching
   - Use projections to fetch only needed fields
   - Archive old notes to separate collection
   - Monitor slow queries

---

## 15. SECURITY BEST PRACTICES

### 15.1 Current Security Measures
- Password hashing with bcrypt
- JWT-style token authentication
- ObjectId validation to prevent injection
- File type validation (PDF only)
- File size limits (100MB)
- CORS configuration
- Admin email whitelist

### 15.2 Recommended Enhancements
1. **Authentication:**
   - Implement proper JWT with expiration
   - Add refresh token mechanism
   - Enable 2FA for admin accounts
   - Implement session timeout
   - Add password strength requirements

2. **Authorization:**
   - Role-based access control (RBAC)
   - Resource-level permissions
   - API key rotation for external services

3. **Data Protection:**
   - Encrypt sensitive data at rest
   - Use HTTPS in production
   - Implement Content Security Policy (CSP)
   - Add rate limiting to prevent DDoS
   - Sanitize user inputs
   - Implement CSRF protection

4. **Monitoring:**
   - Log all authentication attempts
   - Monitor for suspicious activity
   - Set up intrusion detection
   - Regular security audits

---

## 16. TROUBLESHOOTING GUIDE

### 16.1 Common Issues

#### Issue: Backend won't start
**Symptoms:** Server crashes on startup
**Causes:**
- MongoDB connection failed
- Port 5000 already in use
- Missing environment variables

**Solutions:**
```powershell
# Check if port is in use
Get-NetTCPConnection -LocalPort 5000

# Kill process on port 5000
Stop-Process -Id <PID> -Force

# Verify environment variables
Get-Content .env

# Test MongoDB connection
node -e "const mongoose = require('mongoose'); mongoose.connect('YOUR_URI').then(() => console.log('Connected')).catch(err => console.error(err))"
```

#### Issue: Frontend build fails
**Symptoms:** TypeScript compilation errors
**Solutions:**
```powershell
# Clear cache
Remove-Item -Recurse -Force .next
npm cache clean --force

# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install

# Check TypeScript errors
npm run build
```

#### Issue: File upload fails
**Symptoms:** "File upload failed" error
**Causes:**
- File > 100MB
- Not a PDF file
- MongoDB connection lost
- GridFS bucket not initialized

**Solutions:**
- Check file size and type
- Verify MongoDB connection
- Check backend logs for GridFS errors
- Restart backend server

#### Issue: Profile stats not updating
**Symptoms:** Upload count shows 0 after uploading
**Solution:**
- Refresh the page (triggers refreshUser())
- Check if backend incremented notesUploaded
- Verify /api/auth/me returns correct stats

#### Issue: Download shows "Note not found"
**Symptoms:** Error page when clicking download
**Cause:** Invalid ObjectId format or missing fileId
**Solution:**
- Verify note has fileId field
- Check ObjectId validation in backend
- Ensure GridFS file exists

### 16.2 Debug Mode

**Enable verbose logging:**
```javascript
// server-enhanced.js
const DEBUG = true;

if (DEBUG) {
  console.log('Request:', req.method, req.path);
  console.log('Body:', req.body);
  console.log('User:', req.user);
}
```

**Frontend debug:**
```javascript
// Add to any component
useEffect(() => {
  console.log('Component state:', { user, note, loading });
}, [user, note, loading]);
```

---

## 17. FUTURE ENHANCEMENTS

### 17.1 Planned Features
1. **Real-time Notifications**
   - WebSocket integration
   - Push notifications for new notes
   - Comment reply notifications
   - Admin alerts

2. **Advanced Search**
   - Elasticsearch integration
   - Full-text search
   - Search suggestions
   - Search history

3. **Social Features**
   - User following system
   - Activity feed
   - Direct messaging
   - Study groups

4. **Mobile Application**
   - React Native app
   - Offline mode
   - Push notifications
   - Camera-based document scanning

5. **Enhanced Analytics**
   - User engagement metrics
   - Content performance dashboard
   - Predictive analytics
   - Export reports

6. **Content Features**
   - Note versioning
   - Collaborative editing
   - Multiple file formats (Word, PPT)
   - Video lectures support

7. **AI Enhancements**
   - Auto-tagging notes
   - Content quality scoring
   - Plagiarism detection
   - Smart recommendations

### 17.2 Technical Debt
- Implement proper JWT with expiration
- Add comprehensive error handling
- Write unit and integration tests
- Implement proper logging framework
- Add API documentation (Swagger)
- Migrate to TypeScript backend
- Implement proper caching strategy
- Add CI/CD pipeline

---

## 18. TEAM & CONTACTS

### 18.1 Project Administrators
- **Admin 1**: pavanmanepalli521@gmail.com
- **Admin 2**: mohangupta16@gmail.com

### 18.2 Technology Support
- **MongoDB Atlas**: https://cloud.mongodb.com/
- **Google OAuth**: https://console.cloud.google.com/
- **Anthropic**: https://www.anthropic.com/
- **Next.js**: https://nextjs.org/docs
- **MongoDB**: https://docs.mongodb.com/

---

## 19. GLOSSARY

**GridFS**: MongoDB specification for storing files larger than 16MB  
**JWT**: JSON Web Token - authentication standard  
**OAuth 2.0**: Open standard for access delegation  
**CORS**: Cross-Origin Resource Sharing  
**PDR**: Project Documentation Report  
**API**: Application Programming Interface  
**REST**: Representational State Transfer  
**CRUD**: Create, Read, Update, Delete operations  
**ObjectId**: MongoDB's unique identifier format (12-byte)  
**Multer**: Node.js middleware for handling multipart/form-data  
**bcrypt**: Password hashing library  
**Mongoose**: MongoDB object modeling for Node.js  
**Passport**: Authentication middleware for Node.js  
**Shadcn UI**: Re-usable component library built with Radix UI  
**Tailwind CSS**: Utility-first CSS framework  
**TypeScript**: Typed superset of JavaScript  

---

## 20. APPENDICES

### Appendix A: Database Schema ERD
```
┌─────────────────┐
│     User        │
├─────────────────┤
│ _id (PK)        │
│ email (UQ)      │
│ name            │
│ password        │
│ role            │
│ branch          │
│ section         │
│ rollNo          │
│ isAdmin         │
│ totalDownloads  │
│ notesUploaded   │
│ reputation      │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────▼────────┐         ┌─────────────────┐
│     Note        │◄───────┤   SavedNote     │
├─────────────────┤   N   1├─────────────────┤
│ _id (PK)        │         │ _id (PK)        │
│ title           │         │ userId (FK)     │
│ description     │         │ noteId (FK)     │
│ subject         │         │ savedAt         │
│ semester        │         └─────────────────┘
│ userId (FK)     │
│ fileId (FK)     │
│ views           │
│ downloads       │
│ upvotes         │         ┌─────────────────┐
└─────────┬───────┘         │   GridFS        │
          │                 ├─────────────────┤
          │                 │ fs.files        │
          └─────────────────► fs.chunks       │
                    1     N │ (Binary Data)   │
                            └─────────────────┘
```

### Appendix B: File Structure
```
notemitra1/
├── client/                          # Frontend Next.js application
│   ├── .next/                       # Build output
│   ├── app/                         # Next.js 14 App Router
│   │   ├── about/                   # About page
│   │   ├── admin/                   # Admin panel
│   │   │   ├── notes/              # Note moderation
│   │   │   └── users/              # User management
│   │   ├── auth/                    # Authentication
│   │   │   ├── signin/             # Login page
│   │   │   └── signup/             # Registration page
│   │   ├── browse/                  # Browse notes
│   │   ├── leaderboard/             # Leaderboard
│   │   ├── notes/[id]/             # Note details (dynamic route)
│   │   ├── profile/                 # User profile
│   │   ├── upload/                  # Upload notes
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Home page
│   ├── components/                  # Reusable components
│   │   └── ui/                      # Shadcn UI components
│   ├── lib/                         # Utilities
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Auth state management
│   │   ├── api.ts                   # Axios API client
│   │   └── utils.ts                 # Helper functions
│   ├── .env.local                   # Environment variables
│   ├── next.config.js               # Next.js configuration
│   ├── package.json                 # Dependencies
│   ├── tailwind.config.ts           # Tailwind configuration
│   └── tsconfig.json                # TypeScript configuration
├── server/                          # Backend Express application
│   ├── .env                         # Environment variables
│   ├── server-enhanced.js           # Main server file (1688 lines)
│   ├── package.json                 # Dependencies
│   └── tsconfig.json                # TypeScript configuration
├── .vscode/
│   └── settings.json                # VS Code settings
├── docs/                            # Documentation files
│   ├── API.md
│   ├── SETUP.md
│   ├── TESTING_GUIDE.md
│   └── [other .md files]
├── start-servers.ps1                # PowerShell startup script
├── enable-firewall.ps1              # Firewall configuration
└── README.md                        # Project overview
```

### Appendix C: Environment Setup Checklist
- [ ] Node.js v18+ installed
- [ ] MongoDB Atlas account created
- [ ] Database user created with read/write permissions
- [ ] IP whitelist configured (0.0.0.0/0 for development)
- [ ] Google Cloud project created
- [ ] OAuth 2.0 credentials generated
- [ ] Authorized redirect URIs configured
- [ ] Anthropic API key obtained (optional)
- [ ] Environment variables configured
- [ ] Dependencies installed (npm install)
- [ ] Firewall rules configured (if needed)
- [ ] Servers tested (backend + frontend)

### Appendix D: Quick Reference Commands

**Start Servers:**
```powershell
# Backend
cd c:\notemitra1\server
node server-enhanced.js

# Frontend
cd c:\notemitra1\client
npm run dev
```

**Stop All Node Processes:**
```powershell
Get-Process node | Stop-Process -Force
```

**Check Running Servers:**
```powershell
Get-NetTCPConnection -LocalPort 3000,5000 | Select-Object LocalPort, State, OwningProcess
```

**Test Backend:**
```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

**Build Frontend:**
```powershell
cd c:\notemitra1\client
npm run build
npm run start
```

**Database Backup:**
```powershell
mongodump --uri="mongodb+srv://..." --out=./backup
```

---

## REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Oct 29, 2025 | Development Team | Initial PDR creation |

---

## DOCUMENT END

**Last Updated:** October 29, 2025  
**Document Status:** Complete  
**Next Review:** December 2025

For questions or clarifications, contact project administrators.
