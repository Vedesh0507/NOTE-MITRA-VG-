import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  noteId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  message: string;
  createdAt: Date;
  editedAt?: Date;
  parentCommentId?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  isFlagged: boolean;
}

const commentSchema = new Schema<IComment>(
  {
    noteId: {
      type: Schema.Types.ObjectId,
      ref: 'Note',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userName: {
      type: String,
      required: true
    },
    userRole: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    editedAt: {
      type: Date
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    isFlagged: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
commentSchema.index({ noteId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
