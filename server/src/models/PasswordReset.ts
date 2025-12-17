import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IPasswordReset extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tokenHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Auto-delete expired documents
    },
    used: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
passwordResetSchema.index({ userId: 1 });
passwordResetSchema.index({ tokenHash: 1 });

// Static method to generate secure token
passwordResetSchema.statics.generateToken = function (): string {
  return crypto.randomBytes(32).toString('hex');
};

// Static method to hash token for storage
passwordResetSchema.statics.hashToken = function (token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Static method to create a password reset entry
passwordResetSchema.statics.createReset = async function (
  userId: mongoose.Types.ObjectId
): Promise<{ resetDoc: IPasswordReset; plainToken: string }> {
  // Invalidate any existing reset tokens for this user
  await this.updateMany({ userId, used: false }, { used: true });

  // Generate new token
  const plainToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

  // Create reset document (expires in 15 minutes)
  const resetDoc = await this.create({
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    used: false
  });

  return { resetDoc, plainToken };
};

// Static method to verify token
passwordResetSchema.statics.verifyToken = async function (
  token: string
): Promise<IPasswordReset | null> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const resetDoc = await this.findOne({
    tokenHash,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  return resetDoc;
};

export const PasswordReset = mongoose.model<IPasswordReset>(
  'PasswordReset',
  passwordResetSchema
);
