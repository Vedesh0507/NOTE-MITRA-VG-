const mongoose = require('mongoose');

async function testDownloadFixed() {
  try {
    await mongoose.connect('mongodb+srv://sunkarakiranmai_db_user:Pavanvedesh%400507@notemitra.o4v7car.mongodb.net/notemitra_db?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Define Note schema
    const noteSchema = new mongoose.Schema({}, { strict: false, collection: 'notes' });
    const Note = mongoose.model('Note', noteSchema);

    // Find the note we've been testing with - use exact ID
    const note = await Note.findById('6901c9bea7d0c38712a1f59f').lean();

    if (!note) {
      console.log('❌ Test note not found');
      process.exit(1);
    }

    console.log('\n📝 Note Found:');
    console.log('Note ID:', note._id.toString());
    console.log('Title:', note.title);
    console.log('fileId (raw):', note.fileId);
    console.log('fileId type:', typeof note.fileId);
    console.log('fileId is ObjectId?:', note.fileId instanceof mongoose.Types.ObjectId);

    // Convert fileId to string (this is what backend should do now)
    const fileIdString = note.fileId.toString();
    console.log('\n✅ Converted fileId:', fileIdString);

    // Test the download endpoint
    const downloadUrl = `http://localhost:5000/api/notes/download-pdf/${fileIdString}`;
    console.log('\n🔗 Testing download URL:', downloadUrl);

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(downloadUrl);

    console.log('\n📡 Response Status:', response.status);
    console.log('Response Headers:');
    console.log('  Content-Type:', response.headers.get('content-type'));
    console.log('  Content-Disposition:', response.headers.get('content-disposition'));
    console.log('  Content-Length:', response.headers.get('content-length'), 'bytes');

    if (response.ok) {
      const buffer = await response.buffer();
      console.log('\n✅ DOWNLOAD SUCCESSFUL!');
      console.log('Downloaded size:', buffer.length, 'bytes');
      
      // Verify it's a PDF
      const pdfHeader = buffer.slice(0, 4).toString();
      console.log('File header:', pdfHeader);
      if (pdfHeader === '%PDF') {
        console.log('✅ Verified: File is a valid PDF');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Download failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testDownloadFixed();
