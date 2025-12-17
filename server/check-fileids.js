const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://sunkarakiranmai_db_user:Pavanvedesh%400507@notemitra.o4v7car.mongodb.net/notemitra?retryWrites=true&w=majority').then(async () => {
  console.log('Connected to MongoDB');
  
  const NoteSchema = new mongoose.Schema({}, { strict: false });
  const Note = mongoose.model('Note', NoteSchema, 'notes');
  
  const note = await Note.findOne({ title: /hackerrank/i }).lean();
  console.log('\n📝 Note found:');
  console.log('  Title:', note?.title);
  console.log('  FileId:', note?.fileId);
  console.log('  FileId type:', typeof note?.fileId);
  
  const conn = mongoose.connection;
  const files = await conn.db.collection('uploads.files').find().sort({ uploadDate: -1 }).limit(5).toArray();
  
  console.log('\n📂 Recent GridFS files:');
  files.forEach((f, i) => {
    console.log(`  ${i + 1}. ID: ${f._id.toString()}`);
    console.log(`     Name: ${f.filename}`);
    console.log(`     Size: ${f.length} bytes`);
  });
  
  console.log('\n🔍 FileId Match Check:');
  const match = files.find(f => f._id.toString() === note?.fileId);
  if (match) {
    console.log('  ✅ MATCH FOUND!');
  } else {
    console.log('  ❌ NO MATCH - This is why download fails!');
    console.log('  Note fileId:', note?.fileId);
    console.log('  Available file IDs:', files.map(f => f._id.toString()));
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
