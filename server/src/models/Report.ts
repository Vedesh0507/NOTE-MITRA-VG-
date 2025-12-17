import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  noteId: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  reporterName: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    noteId: {
      type: Schema.Types.ObjectId,
      ref: 'Note',
      required: true,
      index: true
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reporterName: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'inappropriate',
        'duplicate',
        'incorrect',
        'spam',
        'copyright',
        'other'
      ]
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
reportSchema.index({ status: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);
