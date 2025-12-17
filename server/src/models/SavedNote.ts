import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedNote extends Document {
  userId: mongoose.Types.ObjectId;
  noteId: mongoose.Types.ObjectId;
  savedAt: Date;
}

const savedNoteSchema = new Schema<ISavedNote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    noteId: {
      type: Schema.Types.ObjectId,
      ref: 'Note',
      required: true,
      index: true
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Compound index to prevent duplicates and efficient queries
savedNoteSchema.index({ userId: 1, noteId: 1 }, { unique: true });

export const SavedNote = mongoose.model<ISavedNote>('SavedNote', savedNoteSchema);
