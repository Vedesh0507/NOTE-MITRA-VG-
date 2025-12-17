import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
  title: string;
  description?: string;
  subject: string;
  semester: string;
  module: string;
  branch: string;
  section?: string;
  uploaderId: mongoose.Types.ObjectId;
  uploaderName: string;
  uploaderRole: 'student' | 'teacher';
  uploadDate: Date;
  fileUrl: string;
  fileSize: number;
  pages?: number;
  summary?: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  downloads: number;
  views: number;
  aiSummary?: string;
  aiTags: string[];
  isFlagged: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    semester: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    module: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    branch: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    section: {
      type: String,
      trim: true,
      maxlength: 50
    },
    uploaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    uploaderName: {
      type: String,
      required: true
    },
    uploaderRole: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
      index: true
    },
    uploadDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0
    },
    pages: {
      type: Number,
      min: 0
    },
    summary: {
      type: String,
      maxlength: 500
    },
    tags: {
      type: [String],
      default: []
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0
    },
    downvotes: {
      type: Number,
      default: 0,
      min: 0
    },
    downloads: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    aiSummary: {
      type: String,
      maxlength: 1000
    },
    aiTags: {
      type: [String],
      default: []
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true
    },
    isApproved: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient filtering
noteSchema.index({ subject: 1, semester: 1, branch: 1 });
noteSchema.index({ upvotes: -1, downloads: -1 });
noteSchema.index({ uploadDate: -1 });

// Text index for search
noteSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Note = mongoose.model<INote>('Note', noteSchema);
