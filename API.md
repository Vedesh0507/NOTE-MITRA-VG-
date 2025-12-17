# NoteMitra API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 🔐 Auth Endpoints

### POST /auth/signup
Register a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "section": "A",
  "branch": "Computer Science"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "section": "A",
    "branch": "Computer Science",
    "profilePic": ""
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

### POST /auth/login
Login existing user

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { ...user_object },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

### POST /auth/refresh
Refresh access token

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "accessToken": "new_jwt_access_token"
}
```

### POST /auth/logout
Logout user

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

### GET /auth/me
Get current user (requires authentication)

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "reputation": 150,
    "uploadsCount": 5,
    "isVerified": true
  }
}
```

### GET /auth/google
Initiate Google OAuth login (redirects to Google)

### GET /auth/google/callback
Google OAuth callback (handled automatically)

---

## 📝 Notes Endpoints

### POST /notes/upload-url
Get presigned S3 URL for file upload (requires authentication)

**Request Body:**
```json
{
  "fileName": "module1-notes.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000
}
```

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/presigned-url",
  "fileKey": "notes/uuid-filename.pdf",
  "fileUrl": "https://s3.amazonaws.com/permanent-url"
}
```

### POST /notes
Create new note (requires authentication)

**Request Body:**
```json
{
  "title": "Data Structures Module 1",
  "description": "Complete notes on arrays and linked lists",
  "subject": "Data Structures",
  "semester": "3",
  "module": "1",
  "branch": "Computer Science",
  "section": "A",
  "fileUrl": "https://s3.amazonaws.com/file-url",
  "fileSize": 1024000,
  "pages": 25
}
```

**Response:**
```json
{
  "message": "Note created successfully",
  "note": {
    "id": "note_id",
    "title": "Data Structures Module 1",
    "subject": "Data Structures",
    "aiSummary": "AI-generated summary...",
    "aiTags": ["arrays", "linked-lists", "data-structures"],
    "uploadDate": "2025-01-15T10:30:00Z"
  }
}
```

### GET /notes
Get all notes with filters

**Query Parameters:**
- `subject` (optional): Filter by subject
- `semester` (optional): Filter by semester
- `module` (optional): Filter by module
- `branch` (optional): Filter by branch
- `uploaderRole` (optional): "student" or "teacher"
- `sortBy` (optional): "uploadDate", "upvotes", "downloads", "views"
- `sortOrder` (optional): "asc" or "desc"
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `search` (optional): Search query

**Example:**
```
GET /notes?subject=Mathematics&semester=3&sortBy=upvotes&sortOrder=desc&page=1&limit=20
```

**Response:**
```json
{
  "notes": [
    {
      "id": "note_id",
      "title": "Calculus Module 1",
      "description": "...",
      "subject": "Mathematics",
      "semester": "3",
      "module": "1",
      "branch": "Computer Science",
      "uploaderName": "John Doe",
      "uploaderRole": "student",
      "upvotes": 45,
      "downloads": 120,
      "views": 350,
      "uploadDate": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### GET /notes/:id
Get single note by ID

**Response:**
```json
{
  "note": {
    "id": "note_id",
    "title": "Data Structures Module 1",
    "description": "Complete notes...",
    "subject": "Data Structures",
    "semester": "3",
    "module": "1",
    "branch": "Computer Science",
    "section": "A",
    "uploaderId": "user_id",
    "uploaderName": "John Doe",
    "uploaderRole": "student",
    "fileUrl": "https://s3.amazonaws.com/file-url",
    "fileSize": 1024000,
    "pages": 25,
    "aiSummary": "AI summary...",
    "aiTags": ["arrays", "linked-lists"],
    "upvotes": 45,
    "downvotes": 2,
    "downloads": 120,
    "views": 350,
    "uploadDate": "2025-01-15T10:30:00Z"
  }
}
```

### GET /notes/:id/download
Get presigned download URL

**Response:**
```json
{
  "downloadUrl": "https://s3.amazonaws.com/presigned-download-url"
}
```

### POST /notes/:id/vote
Vote on a note (requires authentication)

**Request Body:**
```json
{
  "voteType": "upvote"
}
```

**Response:**
```json
{
  "message": "Vote recorded",
  "upvotes": 46,
  "downvotes": 2
}
```

### POST /notes/:id/save
Save/unsave note (requires authentication)

**Response:**
```json
{
  "message": "Note saved",
  "saved": true
}
```

### DELETE /notes/:id
Delete note (requires authentication, owner or moderator only)

**Response:**
```json
{
  "message": "Note deleted successfully"
}
```

---

## 🔍 Search Endpoints

### GET /search
Search notes (ElasticSearch powered)

**Query Parameters:**
- `q`: Search query
- `subject`: Filter by subject
- `semester`: Filter by semester
- `module`: Filter by module
- `branch`: Filter by branch
- `limit`: Results limit (default: 20)

**Example:**
```
GET /search?q=calculus&subject=Mathematics&limit=10
```

**Response:**
```json
{
  "results": [
    {
      "noteId": "note_id",
      "title": "Calculus Module 1",
      "description": "...",
      "subject": "Mathematics",
      "score": 0.95
    }
  ]
}
```

---

## 💬 Comments Endpoints

### POST /notes/:id/comments
Add comment (requires authentication)

**Request Body:**
```json
{
  "message": "Great notes! Very helpful",
  "parentCommentId": null
}
```

### GET /notes/:id/comments
Get all comments for a note

---

## 🚨 Reports Endpoints

### POST /notes/:id/report
Report a note (requires authentication)

**Request Body:**
```json
{
  "reason": "inappropriate",
  "description": "Contains offensive content"
}
```

### GET /admin/reports
Get all reports (moderator/admin only)

### PATCH /admin/reports/:id
Resolve report (moderator/admin only)

---

## 📊 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## 🔌 WebSocket Events (Socket.IO)

Connect to: `http://localhost:5000`

### Client Events (Emit)

#### join_note
Join a note's chat room
```javascript
socket.emit('join_note', noteId);
```

#### leave_note
Leave a note's chat room
```javascript
socket.emit('leave_note', noteId);
```

#### new_comment
Send new comment
```javascript
socket.emit('new_comment', {
  noteId: 'note_id',
  userId: 'user_id',
  userName: 'John Doe',
  message: 'Great notes!'
});
```

#### edit_comment
Edit existing comment
```javascript
socket.emit('edit_comment', {
  noteId: 'note_id',
  commentId: 'comment_id',
  message: 'Updated message'
});
```

#### delete_comment
Delete comment
```javascript
socket.emit('delete_comment', {
  noteId: 'note_id',
  commentId: 'comment_id'
});
```

### Server Events (Listen)

#### comment_added
New comment received
```javascript
socket.on('comment_added', (data) => {
  console.log('New comment:', data);
});
```

#### comment_edited
Comment edited
```javascript
socket.on('comment_edited', (data) => {
  console.log('Comment edited:', data);
});
```

#### comment_deleted
Comment deleted
```javascript
socket.on('comment_deleted', (data) => {
  console.log('Comment deleted:', data);
});
```

---

## 📝 Example Usage (JavaScript)

```javascript
// Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { accessToken, user } = await response.json();

// Get notes with authentication
const notesResponse = await fetch('http://localhost:5000/api/notes', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { notes } = await notesResponse.json();
```

---

## 🛡️ Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Upload endpoints: May have additional restrictions
- Exceeding limits returns 429 status code

---

For more details, refer to the controller implementations in `server/src/controllers/`.
