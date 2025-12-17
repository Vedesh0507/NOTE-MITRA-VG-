// Test script for download functionality
// Run this with: node test-download-comprehensive.js

const mongoose = require('mongoose');
const fetch = require('node-fetch');

const MONGODB_URI = 'mongodb+srv://sunkarakiranmai_db_user:Pavanvedesh%400507@notemitra.o4v7car.mongodb.net/notemitra_db?retryWrites=true&w=majority';
const API_URL = 'http://localhost:5000';

async function testDownload() {
  console.log('🧪 Starting comprehensive download test\n');
  console.log('='.repeat(60));
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define Note schema
    const noteSchema = new mongoose.Schema({}, { strict: false, collection: 'notes' });
    const Note = mongoose.model('Note', noteSchema);

    // Find a note with fileId
    console.log('🔍 Finding a note with fileId...');
    const note = await Note.findOne({ fileId: { $exists: true } }).lean();

    if (!note) {
      console.log('❌ No notes with fileId found in database');
      console.log('💡 Upload a PDF file first using the web interface\n');
      process.exit(1);
    }

    console.log('✅ Found test note:', {
      noteId: note._id.toString(),
      title: note.title,
      fileId: note.fileId ? note.fileId.toString() : 'null',
      fileName: note.fileName,
      subject: note.subject,
      semester: note.semester
    });
    console.log('');

    const noteId = note._id.toString();
    const fileId = note.fileId ? note.fileId.toString() : null;

    // Test 1: Download by note ID (NEW ENDPOINT)
    console.log('='.repeat(60));
    console.log('TEST 1: Download by Note ID (Preferred Method)');
    console.log('='.repeat(60));
    
    const downloadByNoteUrl = `${API_URL}/api/notes/${noteId}/download`;
    console.log('📡 GET', downloadByNoteUrl);
    
    try {
      const response1 = await fetch(downloadByNoteUrl);
      console.log('📡 Response Status:', response1.status, response1.statusText);
      console.log('📡 Content-Type:', response1.headers.get('content-type'));
      console.log('📡 Content-Length:', response1.headers.get('content-length'), 'bytes');
      console.log('📡 Content-Disposition:', response1.headers.get('content-disposition'));
      
      if (response1.ok) {
        const contentType = response1.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const jsonData = await response1.json();
          console.log('✅ Received JSON response:', jsonData);
        } else {
          const buffer = await response1.buffer();
          console.log('✅ Received binary file, size:', buffer.length, 'bytes');
          console.log('✅ TEST 1 PASSED: Download by Note ID works!');
        }
      } else {
        const errorText = await response1.text();
        console.log('❌ TEST 1 FAILED:', errorText);
      }
    } catch (error) {
      console.log('❌ TEST 1 ERROR:', error.message);
    }
    
    console.log('');

    // Test 2: Download by file ID (DIRECT METHOD)
    if (fileId) {
      console.log('='.repeat(60));
      console.log('TEST 2: Download by File ID (Direct Method)');
      console.log('='.repeat(60));
      
      const downloadByFileUrl = `${API_URL}/api/notes/download-pdf/${fileId}`;
      console.log('📡 GET', downloadByFileUrl);
      
      try {
        const response2 = await fetch(downloadByFileUrl);
        console.log('📡 Response Status:', response2.status, response2.statusText);
        console.log('📡 Content-Type:', response2.headers.get('content-type'));
        console.log('📡 Content-Length:', response2.headers.get('content-length'), 'bytes');
        console.log('📡 Content-Disposition:', response2.headers.get('content-disposition'));
        
        if (response2.ok) {
          const buffer = await response2.buffer();
          console.log('✅ Received file, size:', buffer.length, 'bytes');
          
          // Verify PDF header
          const pdfHeader = buffer.slice(0, 4).toString();
          if (pdfHeader === '%PDF') {
            console.log('✅ Verified: File is a valid PDF');
          } else {
            console.log('⚠️  Warning: File header is not PDF:', pdfHeader);
          }
          
          console.log('✅ TEST 2 PASSED: Download by File ID works!');
        } else {
          const errorText = await response2.text();
          console.log('❌ TEST 2 FAILED:', errorText);
        }
      } catch (error) {
        console.log('❌ TEST 2 ERROR:', error.message);
      }
      
      console.log('');
    }

    // Test 3: Error handling - Invalid note ID
    console.log('='.repeat(60));
    console.log('TEST 3: Error Handling - Invalid Note ID');
    console.log('='.repeat(60));
    
    const invalidNoteUrl = `${API_URL}/api/notes/invalid-id-123/download`;
    console.log('📡 GET', invalidNoteUrl);
    
    try {
      const response3 = await fetch(invalidNoteUrl);
      console.log('📡 Response Status:', response3.status, response3.statusText);
      
      if (!response3.ok) {
        const errorData = await response3.json();
        console.log('✅ TEST 3 PASSED: Proper error response:', errorData);
      } else {
        console.log('❌ TEST 3 FAILED: Should return error for invalid ID');
      }
    } catch (error) {
      console.log('❌ TEST 3 ERROR:', error.message);
    }
    
    console.log('');

    // Test 4: Error handling - Non-existent note ID
    console.log('='.repeat(60));
    console.log('TEST 4: Error Handling - Non-existent Note ID');
    console.log('='.repeat(60));
    
    const fakeNoteId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but doesn't exist
    const fakeNoteUrl = `${API_URL}/api/notes/${fakeNoteId}/download`;
    console.log('📡 GET', fakeNoteUrl);
    
    try {
      const response4 = await fetch(fakeNoteUrl);
      console.log('📡 Response Status:', response4.status, response4.statusText);
      
      if (response4.status === 404) {
        const errorData = await response4.json();
        console.log('✅ TEST 4 PASSED: Proper 404 response:', errorData);
      } else {
        console.log('❌ TEST 4 FAILED: Should return 404 for non-existent note');
      }
    } catch (error) {
      console.log('❌ TEST 4 ERROR:', error.message);
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ All critical tests completed');
    console.log('💡 Check the output above for any failures');
    console.log('💡 Test from browser: http://localhost:3000/notes/' + noteId);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run tests
testDownload();
