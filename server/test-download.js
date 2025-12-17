const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://sunkarakiranmai_db_user:Pavanvedesh%400507@notemitra.o4v7car.mongodb.net/notemitra?retryWrites=true&w=majority').then(async () => {
  const NoteSchema = new mongoose.Schema({}, { strict: false });
  const Note = mongoose.model('Note', NoteSchema, 'notes');
  
  const note = await Note.findOne({ title: /hackerrank/i }).lean();
  
  console.log('Note fileId:', note?.fileId);
  console.log('Type:', typeof note?.fileId);
  console.log('Is ObjectId?:', note?.fileId instanceof mongoose.Types.ObjectId);
  console.log('As string:', note?.fileId?.toString());
  
  const conn = mongoose.connection;
  const files = await conn.db.collection('uploads.files').findOne({ _id: note.fileId });
  
  if (files) {
    console.log('\n✅ FILE FOUND IN GRIDFS!');
    console.log('Filename:', files.filename);
    console.log('Size:', files.length);
  } else {
    console.log('\n❌ FILE NOT FOUND');
  }
  
  process.exit(0);
});
