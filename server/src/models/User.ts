import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: 'student' | 'teacher' | 'moderator' | 'admin';
  semester?: number;
  section?: string;
  branch?: string;
  profilePic?: string;
  uploadsCount: number;
  reputation: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    passwordHash: {
      type: String,
      minlength: 6
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'moderator', 'admin'],
      default: 'student'
    },
    semester: {
      type: Number,
      min: 1,
      max: 8
    },
    section: {
      type: String,
      trim: true,
      maxlength: 50
    },
    branch: {
      type: String,
      trim: true,
      maxlength: 100
    },
    profilePic: {
      type: String,
      default: ''
    },
    uploadsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    reputation: {
      type: Number,
      default: 0,
      min: 0
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ reputation: -1 });

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

export const User = mongoose.model<IUser>('User', userSchema);
