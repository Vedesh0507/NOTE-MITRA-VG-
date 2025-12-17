# Download Fix - Testing Guide

## Changes Made

### Backend Changes (server-enhanced.js)

1. **Enhanced `/api/notes/download-pdf/:fileId` endpoint**:
   - Added robust ObjectId validation with try-catch
   - Improved error responses with detailed JSON errors
   - Added CORS-friendly headers
   - Better logging for debugging
   - Sanitized filenames for security

2. **NEW `/api/notes/:noteId/download` endpoint**:
   - Accepts note ID instead of file ID (more user-friendly)
   - Finds note first, then retrieves file
   - Works with both MongoDB (GridFS) and in-memory mode
   - Returns binary stream for GridFS
   - Returns JSON with signed URL for Supabase mode
   - Comprehensive error handling

### Frontend Changes (client/app/notes/[id]/page.tsx)

1. **Enhanced `handleDownload` function**:
   - Added detailed console logging for debugging
   - Uses note ID instead of file ID (more reliable)
   - Handles both binary responses (GridFS) and JSON responses (signed URLs)
   - 30-second timeout protection
   - Better error messages
   - Extracts filename from Content-Disposition header
   - Proper Blob URL cleanup

2. **API wrapper** (client/lib/api.ts):
   - Added `downloadNote()` method for type-safe download calls

## Testing Instructions

### Automated Test

Run the comprehensive test script:

```bash
cd C:\notemitra1\server
node test-download-comprehensive.js
```

Expected output:
- ✅ TEST 1: Download by Note ID works
- ✅ TEST 2: Download by File ID works
- ✅ TEST 3: Proper error for invalid ID
- ✅ TEST 4: Proper 404 for non-existent note

### Manual Test (Simulating Second User)

#### Setup:
1. Start both servers:
   ```bash
   # Terminal 1 - Backend
   cd C:\notemitra1\server
   npm run enhanced

   # Terminal 2 - Frontend
   cd C:\notemitra1\client
   npm run dev
   ```

2. Open browser DevTools (F12) and go to Console and Network tabs

#### Test Steps:

**As User A (Uploader):**
1. Navigate to http://localhost:3000
2. Sign in with: pavanmanepalli521@gmail.com
3. Upload a new PDF note
4. Note the note ID from the URL after upload
5. Sign out

**As User B (Downloader):**
1. Sign in with a different account (or use guest mode)
2. Navigate to browse page
3. Find the note uploaded by User A
4. Click on the note to view details
5. Open browser DevTools Console tab
6. Click the "Download PDF" button

#### Expected Behavior:

**Console Output:**
```
📥 Starting download for note: { fullNote: {...}, noteId: "...", fileId: "..." }
✅ Using note ID: 6901c9bea7d0c38712a1f59f
📡 Fetching from: http://localhost:5000/api/notes/6901c9bea7d0c38712a1f59f/download
📡 Response received: { status: 200, contentType: "application/pdf", ... }
📄 Receiving binary file data...
✅ Downloaded blob: { size: 7683641, type: "application/pdf", sizeInMB: "7.33 MB" }
📁 Using filename: "1761724862128-c_sharp_basic certificate (3).pdf"
🖱️ Triggering download...
✅ Download initiated successfully
🧹 Cleaned up download resources
```

**Network Tab:**
- Request URL: `http://localhost:5000/api/notes/{noteId}/download`
- Status: `200 OK`
- Type: `pdf`
- Size: Should match file size
- Headers:
  - Content-Type: `application/pdf`
  - Content-Disposition: `attachment; filename="..."`

**Browser Behavior:**
- File downloads automatically
- Saved to default download folder
- File opens correctly as PDF

#### Error Scenarios to Test:

1. **Invalid Note ID:**
   - Manually edit URL to `/notes/invalid-id`
   - Should show error page, not crash

2. **Non-existent Note:**
   - Use valid ObjectId format but non-existent: `/notes/507f1f77bcf86cd799439011`
   - Should show "Note not found" message

3. **Network Offline:**
   - Go offline in DevTools
   - Click download
   - Should show network error message

## Troubleshooting

### If download redirects to /notes/undefined:

**Check:**
1. Console logs for note object - is `note._id` or `note.id` present?
2. Network request URL - does it have a valid note ID?
3. Backend logs - is the request reaching the server?

**Solutions:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check if note was fetched successfully (check Network tab for `/api/notes/{id}`)

### If download returns 404:

**Check:**
1. Does the note exist in database?
2. Does the note have a `fileId` field?
3. Does the file exist in GridFS?

**Debug:**
```bash
cd C:\notemitra1\server
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://...');
mongoose.connection.once('open', async () => {
  const Note = mongoose.model('Note', new mongoose.Schema({}, {strict: false, collection: 'notes'}));
  const note = await Note.findById('YOUR_NOTE_ID').lean();
  console.log('Note:', note);
  process.exit(0);
});
"
```

### If download fails with CORS error:

**Check:**
- Is backend running?
- Is CORS middleware enabled?
- Are you using correct API URL?

**Fix:**
Add to server-enhanced.js (if missing):
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
```

## Network Request Examples

### Successful Download Request:

**Request:**
```
GET /api/notes/6901c9bea7d0c38712a1f59f/download HTTP/1.1
Host: localhost:5000
Accept: application/pdf, application/json
```

**Response:**
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="example.pdf"
Content-Length: 7683641
X-Note-Id: 6901c9bea7d0c38712a1f59f
X-File-Id: 6901c9bea7d0c38712a1f59f

<binary PDF data>
```

### Error Response:

**Request:**
```
GET /api/notes/invalid-id/download HTTP/1.1
```

**Response:**
```json
{
  "success": false,
  "message": "Invalid note ID format",
  "error": "INVALID_NOTE_ID_FORMAT",
  "receivedId": "invalid-id"
}
```

## Code Locations

- Backend download endpoints: `server/server-enhanced.js` lines 1351-1660
- Frontend download handler: `client/app/notes/[id]/page.tsx` lines 143-290
- API wrapper: `client/lib/api.ts` lines 153-169
- Test script: `server/test-download-comprehensive.js`

## Support

If issues persist:
1. Check console logs (both browser and server)
2. Run automated test script
3. Verify MongoDB connection
4. Verify file exists in GridFS
5. Check network tab for exact error
