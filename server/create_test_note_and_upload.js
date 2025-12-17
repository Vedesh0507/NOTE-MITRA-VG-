const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://sunkarakiranmai_db_user:Pavanvedesh%400507@notemitra.o4v7car.mongodb.net/notemitra_db?retryWrites=true&w=majority';

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected');

  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, { bucketName: 'fs' });

  // Minimal PDF buffer
  const pdfBuffer = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 50 150 Td (Hello) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000100 00000 n 
0000000200 00000 n 
trailer
<< /Root 1 0 R >>
startxref
300
%%EOF`);

  console.log('PDF size:', pdfBuffer.length);

  const uploadStream = bucket.openUploadStream('test-notemitra.pdf', {
    metadata: { uploadedBy: 'script' },
    contentType: 'application/pdf'
  });

  uploadStream.end(pdfBuffer, async (err) => {
    if (err) {
      console.error('Upload error', err);
      process.exit(1);
    }

    const fileId = uploadStream.id; // ObjectId
    console.log('Uploaded fileId:', fileId.toString());

    // Insert note document in notes collection
    const Note = mongoose.model('Note', new mongoose.Schema({}, { strict: false, collection: 'notes' }));

    const note = {
      title: 'Test PDF from script',
      description: 'This is a test note inserted by create_test_note_and_upload.js',
      subject: 'Test',
      semester: 1,
      module: 'TestModule',
      branch: 'CSE',
      userName: 'ScriptUser',
      userId: 9999,
      views: 0,
      downloads: 0,
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date(),
      fileId: fileId, // store ObjectId directly
      fileName: 'test-notemitra.pdf',
      fileSize: pdfBuffer.length
    };

    const created = await Note.create(note);
    console.log('Created note id:', created._id.toString());

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  });
}

run().catch(err => { console.error(err); process.exit(1); });
