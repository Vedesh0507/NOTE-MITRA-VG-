import mongoose, { Document, Schema } from 'mongoose';

export interface IVote extends Document {
  userId: mongoose.Types.ObjectId;
  noteId: mongoose.Types.ObjectId;
  voteType: 'upvote' | 'downvote';
  createdAt: Date;
}

const voteSchema = new Schema<IVote>(
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
    voteType: {
      type: String,
      enum: ['upvote', 'downvote'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Compound index to prevent duplicate votes and efficient queries
voteSchema.index({ userId: 1, noteId: 1 }, { unique: true });

export const Vote = mongoose.model<IVote>('Vote', voteSchema);
