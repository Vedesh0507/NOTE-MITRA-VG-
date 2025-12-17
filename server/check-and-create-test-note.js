const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb+srv://sunkarakiranmai_db_user:Pavanvedesh%400507@notemitra.o4v7car.mongodb.net/notemitra_db?retryWrites=true&w=majority';

async function checkAndCreateTestNote() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define schemas
    const noteSchema = new mongoose.Schema({}, { strict: false, collection: 'notes' });
    const Note = mongoose.model('Note', noteSchema);

    const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
    const User = mongoose.model('User', userSchema);

    // Check existing notes
    const existingNotes = await Note.find().limit(10).lean();
    console.log(`📚 Found ${existingNotes.length} existing notes in database\n`);

    if (existingNotes.length > 0) {
      console.log('📋 Existing notes:');
      existingNotes.forEach((note, index) => {
        console.log(`\n${index + 1}. Note ID: ${note._id}`);
        console.log(`   Title: ${note.title}`);
        console.log(`   Subject: ${note.subject}`);
        console.log(`   File ID: ${note.fileId || 'NO FILE ID'}`);
        console.log(`   URL: http://localhost:3000/notes/${note._id}`);
      });

      // Test the first note's download endpoint
      const testNote = existingNotes[0];
      const testUrl = `http://localhost:5000/api/notes/${testNote._id}/download`;
      
      console.log('\n' + '='.repeat(60));
      console.log('🧪 TESTING DOWNLOAD ENDPOINT');
      console.log('='.repeat(60));
      console.log('Test URL:', testUrl);
      console.log('\nRun this command to test download:');
      console.log(`curl http://localhost:5000/api/notes/${testNote._id}/download -o test-download.pdf`);
      console.log('\nOr visit in browser:');
      console.log(`http://localhost:3000/notes/${testNote._id}`);
      console.log('='.repeat(60));
    } else {
      console.log('⚠️  No notes found in database!');
      console.log('\n💡 To fix this:');
      console.log('1. Go to http://localhost:3000');
      console.log('2. Sign in');
      console.log('3. Click "Upload" in navigation');
      console.log('4. Upload a PDF file');
      console.log('5. Then navigate to the note from Browse page');
      console.log('6. Click Download button');
      
      // Check if test user exists
      const testUser = await User.findOne({ email: 'pavanmanepalli521@gmail.com' });
      if (!testUser) {
        console.log('\n⚠️  Test user not found! Please sign up first.');
      } else {
        console.log(`\n✅ Test user found: ${testUser.name} (ID: ${testUser._id})`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Notes: ${existingNotes.length}`);
    console.log(`Total Users: ${await User.countDocuments()}`);
    
    // Check GridFS files
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    const files = await bucket.find().limit(10).toArray();
    console.log(`Total Files in GridFS: ${files.length}`);
    
    if (files.length > 0) {
      console.log('\n📁 Files in GridFS:');
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.filename} (${(file.length / 1024 / 1024).toFixed(2)} MB)`);
        console.log(`   File ID: ${file._id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
    process.exit(0);
  }
}

checkAndCreateTestNote();
