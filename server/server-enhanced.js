// Enhanced Node.js server with MongoDB support
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const Anthropic = require('@anthropic-ai/sdk');
const multer = require('multer');
const Grid = require('gridfs-stream');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.1.35:3000',
    'http://192.168.245.192:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'notemitra-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// In-memory fallback storage
let users = [];
let notes = [];
let useMongoDB = false;
let googleAuthEnabled = false;

// GridFS variables
let gfs;
let gridfsBucket;
let upload;

// Initialize Claude AI client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Admin emails list
const ADMIN_EMAILS = [
  'pavanmanepalli521@gmail.com',
  'mohangupta16@gmail.com'
];

// MongoDB Schemas (will be used if MongoDB is available)
let User, Note, SavedNote, PasswordReset;

// Rate limiting store
const rateLimitStore = new Map();

// Allowed email domain
const ALLOWED_EMAIL_DOMAIN = '@mictech.edu.in';

// Valid branches and semesters
const VALID_BRANCHES = ['CSE', 'AIML', 'AIDS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
const VALID_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    if (useMongoDB) {
      const user = await User.findById(id);
      done(null, user);
    } else {
      const user = users.find(u => u.id === id);
      done(null, user);
    }
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
const configureGoogleAuth = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  if (!clientID || !clientSecret || clientID.includes('your_') || clientSecret.includes('your_')) {
    console.log('⚠️  Google OAuth not configured');
    console.log('   To enable Google login:');
    console.log('   1. Get credentials from https://console.cloud.google.com');
    console.log('   2. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    console.log('   3. See SETUP_GUIDE.md for detailed instructions');
    return false;
  }

  passport.use(new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const name = profile.displayName;
      let isNewUser = false;

      if (useMongoDB) {
        // MongoDB version
        let user = await User.findOne({ email });
        
        if (!user) {
          isNewUser = true;
          user = new User({
            name,
            email,
            password: 'google_oauth_' + Date.now(), // placeholder
            role: 'student',
            googleId: profile.id,
            // Leave branch, rollNo, section empty for new users to fill
          });
          await user.save();
        }
        
        return done(null, { 
          id: user._id.toString(), 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          isNewUser,
          branch: user.branch,
          rollNo: user.rollNo,
          section: user.section
        });
      } else {
        // In-memory version
        let user = users.find(u => u.email === email);
        
        if (!user) {
          isNewUser = true;
          user = {
            id: (users.length + 1).toString(),
            name,
            email,
            role: 'student',
            googleId: profile.id,
            createdAt: new Date()
          };
          users.push(user);
        }
        
        return done(null, { ...user, isNewUser });
      }
    } catch (error) {
      return done(error, null);
    }
  }));

  console.log('✅ Google OAuth configured');
  return true;
};

// Try to connect to MongoDB
async function connectMongoDB() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI || mongoURI.includes('username:password')) {
      console.log('⚠️  MongoDB not configured - using in-memory storage');
      console.log('   To enable MongoDB, update MONGODB_URI in .env file');
      console.log('   See SETUP_GUIDE.md for instructions');
      return false;
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ MongoDB connected successfully');

    // Initialize GridFS
    const conn = mongoose.connection;
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');

    // Use memory storage for multer (simpler and more reliable)
    const storage = multer.memoryStorage();

    upload = multer({ 
      storage,
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are allowed'));
        }
      }
    });

    console.log('✅ GridFS initialized for file storage');

    // Define Schemas
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, unique: true, required: true },
      password: String,
      passwordHash: String,
      role: { type: String, default: 'student' },
      semester: { type: Number, min: 1, max: 8 },
      branch: String,
      section: String,
      rollNo: String,
      isAdmin: { type: Boolean, default: false },
      isSuspended: { type: Boolean, default: false },
      totalDownloads: { type: Number, default: 0 },
      totalViews: { type: Number, default: 0 },
      notesUploaded: { type: Number, default: 0 },
      reputation: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now }
    });

    // Password reset schema
    const passwordResetSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      tokenHash: { type: String, required: true },
      expiresAt: { type: Date, required: true },
      used: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });

    passwordResetSchema.index({ tokenHash: 1 });
    passwordResetSchema.index({ userId: 1 });

    const noteSchema = new mongoose.Schema({
      title: String,
      description: String,
      subject: String,
      semester: String,
      module: String,
      branch: String,
      fileName: String,
      fileUrl: String,
      fileId: mongoose.Schema.Types.ObjectId, // GridFS file ID
      fileSize: Number,
      tags: String,
      userId: mongoose.Schema.Types.ObjectId,
      userName: String,
      views: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
      upvotes: { type: Number, default: 0 },
      downvotes: { type: Number, default: 0 },
      isApproved: { type: Boolean, default: true },
      isReported: { type: Boolean, default: false },
      reportReason: String,
      createdAt: { type: Date, default: Date.now }
    });

    const savedNoteSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
      noteId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Note' },
      savedAt: { type: Date, default: Date.now }
    });

    // Compound index to prevent duplicate saves
    savedNoteSchema.index({ userId: 1, noteId: 1 }, { unique: true });

    User = mongoose.model('User', userSchema);
    Note = mongoose.model('Note', noteSchema);
    SavedNote = mongoose.model('SavedNote', savedNoteSchema);
    PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

    return true;
  } catch (error) {
    console.log('⚠️  MongoDB connection failed - using in-memory storage');
    console.log('   Error:', error.message);
    console.log('   See SETUP_GUIDE.md for MongoDB Atlas setup instructions');
    return false;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  try {
    const healthData = {
      status: 'ok',
      message: 'NoteMitra API is running',
      database: useMongoDB ? 'MongoDB' : 'In-Memory',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: 'operational',
        database: useMongoDB ? 'connected' : 'in-memory',
        fileStorage: useMongoDB ? 'GridFS' : 'disabled'
      }
    };
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, branch, section, semester } = req.body;
    
    // Validation: Check required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    if (!email || email.trim() === '') {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    // Validate name (no whitespace only)
    if (name.trim().length === 0) {
      return res.status(400).json({ error: 'Name cannot be only whitespace' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate email domain - MUST be college email
    if (!email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
      return res.status(400).json({ error: `Email must end with ${ALLOWED_EMAIL_DOMAIN}` });
    }
    
    // Validate password length (minimum 8 characters)
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    // Validate semester (required, must be 1-8)
    const semesterNum = parseInt(semester);
    if (!semester || isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
      return res.status(400).json({ error: 'Semester is required and must be between 1 and 8' });
    }
    
    // Validate branch (required)
    if (!branch || !VALID_BRANCHES.includes(branch)) {
      return res.status(400).json({ error: `Branch is required. Valid options: ${VALID_BRANCHES.join(', ')}` });
    }
    
    // Validate role if provided
    const validRoles = ['student', 'teacher'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be student or teacher' });
    }
    
    // Check if email is an admin
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

    if (useMongoDB) {
      // MongoDB version
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({ 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        password: hashedPassword,
        passwordHash: hashedPassword,
        role: role || 'student', 
        semester: semesterNum,
        branch, 
        section, 
        isAdmin, 
        isSuspended: false 
      });
      await user.save();

      const token = 'dev_token_' + user._id;
      res.status(201).json({
        message: 'User created successfully',
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          semester: user.semester,
          branch: user.branch, 
          section: user.section, 
          isAdmin: user.isAdmin 
        },
        token
      });
    } else {
      // In-memory version
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = {
        id: (users.length + 1).toString(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || 'student',
        semester: semesterNum,
        branch: branch || '',
        section: section || '',
        isAdmin,
        isSuspended: false,
        createdAt: new Date()
      };
      users.push(user);

      const token = 'dev_token_' + user.id;
      res.status(201).json({
        message: 'User created successfully',
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          semester: user.semester,
          branch: user.branch, 
          section: user.section, 
          isAdmin: user.isAdmin 
        },
        token
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation: Check required fields
    if (!email || email.trim() === '') {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (useMongoDB) {
      // MongoDB version - case-insensitive email search
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if user is suspended
      if (user.isSuspended) {
        return res.status(403).json({ error: 'Your account has been suspended. Please contact admin.' });
      }

      // Check password with bcrypt
      const passwordToCheck = user.passwordHash || user.password;
      const isValidPassword = await bcrypt.compare(password, passwordToCheck);
      if (!isValidPassword) {
        // Fallback for old unhashed passwords (temporary)
        if (user.password !== password) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
      }

      const token = 'dev_token_' + user._id;
      res.json({
        message: 'Login successful',
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          semester: user.semester,
          branch: user.branch, 
          section: user.section, 
          isAdmin: user.isAdmin 
        },
        token
      });
    } else {
      // In-memory version - case-insensitive email search
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if user is suspended
      if (user.isSuspended) {
        return res.status(403).json({ error: 'Your account has been suspended. Please contact admin.' });
      }

      // Check password with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = 'dev_token_' + user.id;
      res.json({
        message: 'Login successful',
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          semester: user.semester,
          branch: user.branch, 
          section: user.section, 
          isAdmin: user.isAdmin 
        },
        token
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Rate limiter middleware for forgot password
const forgotPasswordRateLimiter = (req, res, next) => {
  const email = req.body?.email?.toLowerCase() || '';
  const ip = req.ip || 'unknown';
  const key = `forgot-password:${ip}:${email}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 3;

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    entry = { count: 1, resetTime: now + windowMs };
    rateLimitStore.set(key, entry);
    return next();
  }

  entry.count++;
  
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    return res.status(429).json({
      error: 'Too many password reset requests. Please try again later.',
      retryAfter
    });
  }

  next();
};

// Email transporter setup
let emailTransporter = null;

const setupEmailTransporter = () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpUser || !smtpPass || smtpUser === 'your_email@gmail.com') {
    console.log('⚠️  Email not configured - reset links will be shown in console');
    console.log('   To enable email: Set SMTP_USER and SMTP_PASS in .env');
    return null;
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    console.log('✅ Email service configured');
    return transporter;
  } catch (error) {
    console.log('⚠️  Email setup failed:', error.message);
    return null;
  }
};

// Send password reset email function
const sendPasswordResetEmail = async (email, resetUrl, userName) => {
  if (!emailTransporter) {
    return false;
  }
  
  const mailOptions = {
    from: `"NoteMitra" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Request - NoteMitra',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">NoteMitra</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hello <strong>${userName || 'User'}</strong>,</p>
          
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Or copy this link:</p>
          <p style="word-break: break-all; color: #667eea; font-size: 14px;">${resetUrl}</p>
          
          <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              ⚠️ This link expires in <strong>15 minutes</strong>.
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${userName || 'User'},\n\nWe received a request to reset your password.\n\nReset your password here: ${resetUrl}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return false;
  }
};

// ============================
// AI CHAT ENDPOINT - GEMINI API
// ============================

// Rate limiter store for AI chat
const aiChatRateLimitStore = new Map();

// AI Chat rate limiter middleware
const aiChatRateLimiter = (req, res, next) => {
  const userId = req.body?.userId || req.ip || 'anonymous';
  const key = `ai-chat:${userId}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour window
  const maxRequests = 30; // 30 requests per hour
  const cooldownMs = 10 * 1000; // 10 second cooldown between messages

  let entry = aiChatRateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    entry = { 
      count: 1, 
      resetTime: now + windowMs,
      lastRequest: now 
    };
    aiChatRateLimitStore.set(key, entry);
    return next();
  }

  // Check cooldown
  if (now - entry.lastRequest < cooldownMs) {
    const waitTime = Math.ceil((cooldownMs - (now - entry.lastRequest)) / 1000);
    return res.status(429).json({
      error: 'Please wait before sending another message.',
      retryAfter: waitTime,
      type: 'cooldown'
    });
  }

  entry.count++;
  entry.lastRequest = now;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000 / 60);
    return res.status(429).json({
      error: `Rate limit exceeded. You have used all ${maxRequests} AI queries this hour.`,
      retryAfter: retryAfter,
      type: 'hourly_limit',
      remaining: 0
    });
  }

  // Add remaining queries to response
  res.locals.aiRateLimit = {
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime
  };

  next();
};

// Gemini API call function
const callGeminiAPI = async (message, pageText, conversationHistory = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Build system context
  let systemContext = '';
  if (pageText && pageText.trim().length > 50) {
    systemContext = `You are a helpful study assistant integrated into a PDF reader application. 
The student is currently reading a PDF document. Here is the relevant content from the current page:

---PDF CONTENT START---
${pageText.substring(0, 4000)}
---PDF CONTENT END---

Instructions:
1. Answer the student's question using the PDF content above when relevant
2. If the question is related to the PDF content, cite specific parts of it
3. If the question is not covered in the PDF, provide a general academic explanation
4. Be concise, clear, and educational
5. Use examples when helpful
6. Format your response with bullet points or numbered lists when appropriate`;
  } else {
    systemContext = `You are a helpful study assistant for college students.
Note: You don't have access to specific PDF content right now. The student may be asking a general academic question.

Instructions:
1. Provide clear, educational answers
2. Be concise and helpful
3. Use examples when appropriate
4. If you're unsure about something specific to their course material, let them know
5. Format your response with bullet points or numbered lists when appropriate`;
  }

  // Build conversation for context
  const contents = [];
  
  // Add system context as first user message
  contents.push({
    role: 'user',
    parts: [{ text: systemContext + '\n\nStudent question: ' + message }]
  });

  // Gemini API endpoint - Using gemini-2.0-flash (gemini-1.5-flash is deprecated)
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  console.log(`🤖 Calling Gemini API with model: ${modelName}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('❌ Gemini API error - Status:', response.status);
    console.error('❌ Gemini API error - Response:', errorData);
    
    // Parse error for better messaging
    try {
      const errorJson = JSON.parse(errorData);
      if (response.status === 429) {
        const retryMatch = errorData.match(/retry in ([\d.]+)s/i);
        const retryAfter = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
        const error = new Error('AI service rate limit exceeded. Please try again later.');
        error.code = 'RATE_LIMIT';
        error.retryAfter = retryAfter;
        throw error;
      } else if (response.status === 404) {
        const error = new Error(`AI model "${modelName}" not found. Please check configuration.`);
        error.code = 'MODEL_NOT_FOUND';
        throw error;
      } else if (response.status === 400) {
        const error = new Error('Invalid request to AI service.');
        error.code = 'BAD_REQUEST';
        throw error;
      } else if (response.status === 403) {
        const error = new Error('AI API key is invalid or expired.');
        error.code = 'UNAUTHORIZED';
        throw error;
      }
    } catch (parseError) {
      if (parseError.code) throw parseError; // Re-throw our custom errors
    }
    
    throw new Error('AI service temporarily unavailable');
  }

  const data = await response.json();
  
  // Check for blocked content
  if (data.promptFeedback?.blockReason) {
    console.warn('⚠️ Gemini blocked the request:', data.promptFeedback.blockReason);
    const error = new Error('Your question was blocked by content filters. Please rephrase it.');
    error.code = 'CONTENT_BLOCKED';
    throw error;
  }
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    console.error('❌ Invalid Gemini response structure:', JSON.stringify(data, null, 2));
    throw new Error('Invalid response from AI service');
  }

  console.log('✅ Gemini API response received successfully');
  return data.candidates[0].content.parts[0].text;
};

// AI Chat endpoint
app.post('/api/ai/chat', aiChatRateLimiter, async (req, res) => {
  try {
    const { message, pageText, userId, noteId } = req.body;

    // Validate message
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (trimmedMessage.length > 2000) {
      return res.status(400).json({ error: 'Message is too long (max 2000 characters)' });
    }

    // Check if Gemini API is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ 
        error: 'AI service not configured',
        fallback: true,
        response: 'I apologize, but the AI service is currently not configured. Please contact support.'
      });
    }

    console.log(`🤖 AI Chat request from ${userId || 'anonymous'}: "${trimmedMessage.substring(0, 50)}..."`);

    // Call Gemini API
    const aiResponse = await callGeminiAPI(trimmedMessage, pageText);

    // Log successful response
    console.log(`✅ AI response generated (${aiResponse.length} chars)`);

    // Return response with rate limit info
    res.json({
      response: aiResponse,
      hasContext: !!(pageText && pageText.trim().length > 50),
      rateLimit: res.locals.aiRateLimit
    });

  } catch (error) {
    console.error('❌ AI Chat error:', error.message);
    console.error('❌ Error code:', error.code || 'UNKNOWN');
    
    // Build specific error response based on error type
    let statusCode = 500;
    let errorMessage = 'I apologize, but I encountered an error processing your request. Please try again in a moment.';
    let errorType = 'unknown';
    
    if (error.code === 'RATE_LIMIT') {
      statusCode = 429;
      errorMessage = `The AI service is currently busy. Please wait ${error.retryAfter || 60} seconds and try again.`;
      errorType = 'rate_limit';
    } else if (error.code === 'MODEL_NOT_FOUND') {
      statusCode = 503;
      errorMessage = 'The AI model is currently unavailable. Please contact support.';
      errorType = 'model_error';
    } else if (error.code === 'UNAUTHORIZED') {
      statusCode = 503;
      errorMessage = 'AI service authentication failed. Please contact support.';
      errorType = 'auth_error';
    } else if (error.code === 'CONTENT_BLOCKED') {
      statusCode = 400;
      errorMessage = error.message;
      errorType = 'content_blocked';
    } else if (error.code === 'BAD_REQUEST') {
      statusCode = 400;
      errorMessage = 'There was an issue with your request. Please try rephrasing your question.';
      errorType = 'bad_request';
    }
    
    // Return detailed error response
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to get AI response',
      errorType: errorType,
      message: errorMessage,
      fallback: true,
      response: errorMessage,
      retryAfter: error.retryAfter || null
    });
  }
});

// Health check endpoint for AI service
app.get('/api/ai/status', (req, res) => {
  const hasGeminiKey = !!(process.env.GEMINI_API_KEY);
  res.json({
    configured: hasGeminiKey,
    service: 'Gemini',
    rateLimit: {
      maxPerHour: 30,
      cooldownSeconds: 10
    }
  });
});

// Forgot Password route
app.post('/api/auth/forgot-password', forgotPasswordRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Always return success to prevent email enumeration
    const successMessage = 'If an account with that email exists, a password reset link has been sent.';
    
    if (!email || email.trim() === '') {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate email domain
    if (!email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
      return res.status(400).json({ error: `Email must end with ${ALLOWED_EMAIL_DOMAIN}` });
    }

    if (!useMongoDB) {
      return res.json({ message: successMessage });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ message: successMessage });
    }

    // Generate secure reset token
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

    // Invalidate existing reset tokens
    await PasswordReset.updateMany({ userId: user._id, used: false }, { used: true });

    // Create new password reset entry (expires in 15 minutes)
    await PasswordReset.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${plainToken}`;
    
    // Try to send email
    const emailSent = await sendPasswordResetEmail(email, resetUrl, user.name);
    
    // Always log to console for development
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📧 PASSWORD RESET REQUEST');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Email: ${email}`);
    console.log(`   User: ${user.name}`);
    console.log(`   Email Sent: ${emailSent ? 'Yes ✅' : 'No (check SMTP config)'}`);
    console.log('');
    console.log('   🔗 RESET URL (copy this link):');
    console.log(`   ${resetUrl}`);
    console.log('');
    console.log('   ⏰ Expires in 15 minutes');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // In development mode, also return the reset URL for testing
    // Since email is not configured, always return the URL for now
    if (!emailSent) {
      return res.json({ 
        message: successMessage,
        // Include resetUrl when email fails so user can still reset password
        _dev_resetUrl: resetUrl,
        _dev_note: 'Email not configured. Use this URL to reset password.'
      });
    }

    res.json({ message: successMessage });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Verify Reset Token route
app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || token.length !== 64) {
      return res.status(400).json({ valid: false, error: 'Invalid token format' });
    }

    if (!useMongoDB) {
      return res.status(400).json({ valid: false, error: 'Feature not available' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await PasswordReset.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({ valid: false, error: 'Invalid or expired reset token' });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ valid: false, error: 'Failed to verify token' });
  }
});

// Reset Password route
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!useMongoDB) {
      return res.status(400).json({ error: 'Feature not available' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await PasswordReset.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset token. Please request a new password reset.' });
    }

    // Find user
    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    user.password = hashedPassword;
    user.passwordHash = hashedPassword;
    await user.save();

    // Mark token as used
    resetRecord.used = true;
    await resetRecord.save();

    console.log(`✅ Password reset successful for: ${user.email}`);

    res.json({ message: 'Password has been reset successfully. Please log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Google OAuth routes
app.get('/api/auth/google', (req, res, next) => {
  if (!googleAuthEnabled) {
    return res.status(503).send(`
      <html>
        <head>
          <title>Google OAuth Not Configured</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            h1 { color: #d32f2f; }
            .info { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .steps { background: #e3f2fd; padding: 15px; border-radius: 5px; }
            code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
            a { color: #1976d2; }
          </style>
        </head>
        <body>
          <h1>⚠️ Google OAuth Not Configured</h1>
          <div class="info">
            <p><strong>The "Continue with Google" feature requires Google OAuth credentials.</strong></p>
            <p>You can still use email/password login, which works perfectly!</p>
          </div>
          
          <h2>🔧 To Enable Google Login:</h2>
          <div class="steps">
            <ol>
              <li>Go to <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
              <li>Create a new project called "NoteMitra"</li>
              <li>Enable Google+ API</li>
              <li>Create OAuth 2.0 credentials:
                <ul>
                  <li>Type: Web application</li>
                  <li>Redirect URI: <code>http://localhost:5000/api/auth/google/callback</code></li>
                </ul>
              </li>
              <li>Copy your Client ID and Client Secret</li>
              <li>Update <code>server/.env</code> file:
                <pre>GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here</pre>
              </li>
              <li>Restart the server</li>
            </ol>
          </div>
          
          <p><strong>Detailed guide:</strong> Check <code>GOOGLE_OAUTH_SETUP.md</code> in your project folder.</p>
          
          <p><a href="http://localhost:3000/auth/signin">← Back to Sign In</a></p>
        </body>
      </html>
    `);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get('/api/auth/google/callback', (req, res, next) => {
  if (!googleAuthEnabled) {
    return res.redirect('http://localhost:3000/auth/signin?error=google_not_configured');
  }
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/signin?error=google_auth_failed` 
  })(req, res, next);
}, (req, res) => {
  // Successful authentication
  const user = req.user;
  const token = 'dev_token_' + user.id;
  
  // Check if new user needs to complete profile
  if (user.isNewUser || !user.branch || !user.rollNo) {
    // Redirect to profile completion page
    const redirectURL = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/google-callback?token=${token}&newUser=true&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`;
    res.redirect(redirectURL);
  } else {
    // Existing user with complete profile - redirect to browse
    const redirectURL = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/google-callback?token=${token}&newUser=false`;
    res.redirect(redirectURL);
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // Validate token presence
    if (!token || token.trim() === '') {
      return res.status(401).json({ message: 'No authorization token provided' });
    }
    
    if (!token.startsWith('dev_token_')) {
      return res.status(401).json({ message: 'Invalid authorization token format' });
    }

    const userId = token.replace('dev_token_', '');
    
    if (!userId || userId.trim() === '') {
      return res.status(401).json({ message: 'Invalid user ID in token' });
    }

    if (useMongoDB) {
      // MongoDB version - validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({ message: 'Invalid user ID format in token' });
      }

      const user = await User.findById(userId).select('-password').lean();
      if (!user) {
        return res.status(404).json({ message: 'User not found. Your account may have been deleted' });
      }

      // Get user's notes count
      const notesCount = await Note.countDocuments({ userId: user._id });

      // Get total views and upvotes from user's notes
      const userNotes = await Note.find({ userId: user._id }).select('views upvotes downloads').lean();
      const totalViews = userNotes.reduce((sum, note) => sum + (note.views || 0), 0);
      const totalUpvotes = userNotes.reduce((sum, note) => sum + (note.upvotes || 0), 0);

      // Get saved notes count
      const savedNotesCount = await SavedNote.countDocuments({ userId: user._id });

      res.json({
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          branch: user.branch, 
          section: user.section,
          rollNo: user.rollNo,
          isAdmin: user.isAdmin,
          reputation: user.reputation || 0,
          uploadsCount: notesCount,
          totalDownloads: user.totalDownloads || 0,
          totalViews: totalViews,
          totalUpvotes: totalUpvotes,
          savedNotesCount: savedNotesCount
        }
      });
    } else {
      // In-memory version
      const user = users.find(u => u.id === userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      res.json({
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          branch: user.branch, 
          section: user.section, 
          isAdmin: user.isAdmin,
          uploadsCount: user.notesUploaded || 0,
          reputation: 0
        }
      });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Update Google user details (for new users completing profile)
app.post('/api/auth/update-google-user', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('dev_token_')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = token.replace('dev_token_', '');
    const { branch, rollNo, section } = req.body;

    if (!branch || !rollNo) {
      return res.status(400).json({ message: 'Branch and Roll No are required' });
    }

    if (useMongoDB) {
      // MongoDB version
      const user = await User.findByIdAndUpdate(
        userId,
        { branch, rollNo, section },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        message: 'Profile updated successfully',
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          branch: user.branch, 
          rollNo: user.rollNo,
          section: user.section, 
          isAdmin: user.isAdmin 
        }
      });
    } else {
      // In-memory version
      const user = users.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.branch = branch;
      user.rollNo = rollNo;
      user.section = section;

      res.json({
        message: 'Profile updated successfully',
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          branch: user.branch, 
          rollNo: user.rollNo,
          section: user.section, 
          isAdmin: user.isAdmin 
        }
      });
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Middleware
const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const userId = token.replace('dev_token_', '');

    if (useMongoDB) {
      const user = await User.findById(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }
      req.user = user;
    } else {
      const user = users.find(u => u.id === userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }
      req.user = user;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin Routes
// Get platform statistics
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    if (useMongoDB) {
      const totalUsers = await User.countDocuments();
      const totalNotes = await Note.countDocuments();
      const totalDownloads = await Note.aggregate([
        { $group: { _id: null, total: { $sum: '$downloads' } } }
      ]);
      const totalViews = await Note.aggregate([
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]);
      const suspendedUsers = await User.countDocuments({ isSuspended: true });
      const reportedNotes = await Note.countDocuments({ isReported: true });

      res.json({
        totalUsers,
        totalNotes,
        totalDownloads: totalDownloads[0]?.total || 0,
        totalViews: totalViews[0]?.total || 0,
        suspendedUsers,
        reportedNotes
      });
    } else {
      const totalDownloads = notes.reduce((sum, note) => sum + (note.downloads || 0), 0);
      const totalViews = notes.reduce((sum, note) => sum + (note.views || 0), 0);
      const suspendedUsers = users.filter(u => u.isSuspended).length;
      const reportedNotes = notes.filter(n => n.isReported).length;

      res.json({
        totalUsers: users.length,
        totalNotes: notes.length,
        totalDownloads,
        totalViews,
        suspendedUsers,
        reportedNotes
      });
    }
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    if (useMongoDB) {
      const allUsers = await User.find().select('-password').sort({ createdAt: -1 }).lean();
      
      // Get upload counts for each user
      const usersWithStats = await Promise.all(allUsers.map(async (user) => {
        const uploadCount = await Note.countDocuments({ userId: user._id });
        return {
          ...user,
          notesUploaded: uploadCount
        };
      }));
      
      res.json({ users: usersWithStats });
    } else {
      const allUsers = users.map(u => ({ ...u, password: undefined }));
      res.json({ users: allUsers });
    }
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Suspend user
app.put('/api/admin/users/:userId/suspend', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (useMongoDB) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.isAdmin) {
        return res.status(400).json({ message: 'Cannot suspend admin users' });
      }
      user.isSuspended = true;
      await user.save();
      res.json({ message: 'User suspended successfully', user });
    } else {
      const user = users.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.isAdmin) {
        return res.status(400).json({ message: 'Cannot suspend admin users' });
      }
      user.isSuspended = true;
      res.json({ message: 'User suspended successfully', user: { ...user, password: undefined } });
    }
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unsuspend user
app.put('/api/admin/users/:userId/unsuspend', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (useMongoDB) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.isSuspended = false;
      await user.save();
      res.json({ message: 'User unsuspended successfully', user });
    } else {
      const user = users.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.isSuspended = false;
      res.json({ message: 'User unsuspended successfully', user: { ...user, password: undefined } });
    }
  } catch (error) {
    console.error('Unsuspend user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
app.delete('/api/admin/users/:userId', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (useMongoDB) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.isAdmin) {
        return res.status(400).json({ message: 'Cannot delete admin users' });
      }
      await User.findByIdAndDelete(userId);
      await Note.deleteMany({ userId });
      res.json({ message: 'User and their notes deleted successfully' });
    } else {
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (users[userIndex].isAdmin) {
        return res.status(400).json({ message: 'Cannot delete admin users' });
      }
      users.splice(userIndex, 1);
      notes = notes.filter(n => n.userId !== userId);
      res.json({ message: 'User and their notes deleted successfully' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all notes (admin view)
app.get('/api/admin/notes', adminMiddleware, async (req, res) => {
  try {
    if (useMongoDB) {
      const allNotes = await Note.find().sort({ createdAt: -1 }).lean();
      res.json({ notes: allNotes });
    } else {
      res.json({ notes });
    }
  } catch (error) {
    console.error('Get all notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete note (admin)
app.delete('/api/admin/notes/:noteId', adminMiddleware, async (req, res) => {
  try {
    const { noteId } = req.params;

    if (useMongoDB) {
      await Note.findByIdAndDelete(noteId);
      res.json({ message: 'Note deleted successfully' });
    } else {
      notes = notes.filter(n => n.id !== noteId);
      res.json({ message: 'Note deleted successfully' });
    }
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report note
app.post('/api/notes/:noteId/report', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { reason } = req.body;

    if (useMongoDB) {
      const note = await Note.findById(noteId);
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }
      note.isReported = true;
      note.reportReason = reason;
      await note.save();
      res.json({ message: 'Note reported successfully' });
    } else {
      const note = notes.find(n => n.id === noteId);
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }
      note.isReported = true;
      note.reportReason = reason;
      res.json({ message: 'Note reported successfully' });
    }
  } catch (error) {
    console.error('Report note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reported notes
app.get('/api/admin/reports', adminMiddleware, async (req, res) => {
  try {
    if (useMongoDB) {
      const reportedNotes = await Note.find({ isReported: true }).sort({ createdAt: -1 }).lean();
      res.json({ reports: reportedNotes });
    } else {
      const reportedNotes = notes.filter(n => n.isReported);
      res.json({ reports: reportedNotes });
    }
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resolve report (dismiss)
app.put('/api/admin/reports/:noteId/resolve', adminMiddleware, async (req, res) => {
  try {
    const { noteId } = req.params;

    if (useMongoDB) {
      const note = await Note.findById(noteId);
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }
      note.isReported = false;
      note.reportReason = '';
      await note.save();
      res.json({ message: 'Report resolved successfully' });
    } else {
      const note = notes.find(n => n.id === noteId);
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }
      note.isReported = false;
      note.reportReason = '';
      res.json({ message: 'Report resolved successfully' });
    }
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Notes routes
app.get('/api/notes', async (req, res) => {
  try {
    const { subject, semester, branch, page = 1, limit = 50 } = req.query;
    
    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ message: 'Invalid page number. Must be a positive integer' });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ message: 'Invalid limit. Must be between 1 and 100' });
    }
    
    if (useMongoDB) {
      // Build filter query
      const filter = {};
      
      if (subject) {
        filter.subject = subject.trim();
      }
      
      if (semester) {
        const semesterNum = parseInt(semester);
        if (isNaN(semesterNum)) {
          return res.status(400).json({ message: 'Invalid semester parameter' });
        }
        filter.semester = semesterNum;
      }
      
      if (branch) {
        filter.branch = branch.trim();
      }
      
      // Calculate skip for pagination
      const skip = (pageNum - 1) * limitNum;
      
      // Get total count
      const total = await Note.countDocuments(filter);
      
      // Get filtered notes
      const allNotes = await Note.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
      
      // CRITICAL: Convert fileId to string for all notes
      // This ensures frontend receives clean strings, not ObjectId objects
      allNotes.forEach(note => {
        if (note.fileId) {
          note.fileId = note.fileId.toString();
        }
        // Convert _id to id for frontend compatibility
        if (note._id) {
          note.id = note._id.toString();
        }
        // Convert userId to string if it exists
        if (note.userId) {
          note.userId = note.userId.toString();
        }
      });
      
      res.json({ 
        notes: allNotes, 
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } else {
      // In-memory version with filtering
      let filteredNotes = [...notes];
      
      if (subject) {
        filteredNotes = filteredNotes.filter(n => n.subject === subject.trim());
      }
      
      if (semester) {
        const semesterNum = parseInt(semester);
        if (!isNaN(semesterNum)) {
          filteredNotes = filteredNotes.filter(n => n.semester === semesterNum);
        }
      }
      
      if (branch) {
        filteredNotes = filteredNotes.filter(n => n.branch === branch.trim());
      }
      
      // Apply pagination
      const skip = (pageNum - 1) * limitNum;
      const paginatedNotes = filteredNotes.slice(skip, skip + limitNum);
      
      res.json({ 
        notes: paginatedNotes, 
        total: filteredNotes.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(filteredNotes.length / limitNum)
      });
    }
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Server error fetching notes' });
  }
});

// Helper function to generate fallback description
function generateFallbackDescription(title, subject, pdfText) {
  const templates = [
    `Comprehensive study notes covering ${subject}${title ? ' - ' + title : ''}. Essential concepts and key points for exam preparation.`,
    `Detailed ${subject} notes${title ? ' on ' + title : ''}. Perfect for understanding core topics and revision.`,
    `Complete study material for ${subject}${title ? ': ' + title : ''}. Covers important concepts with clear explanations.`,
    `Well-organized notes for ${subject}${title ? ' - ' + title : ''}. Great resource for students to master the subject.`,
    `In-depth coverage of ${subject}${title ? ' focusing on ' + title : ''}. Includes key topics and practice questions.`
  ];
  
  // Pick a random template for variety
  return templates[Math.floor(Math.random() * templates.length)];
}

// AI Description Generation endpoint
app.post('/api/notes/generate-description', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('dev_token_')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { pdfText, title, subject } = req.body;

    if (!pdfText || pdfText.trim().length < 50) {
      return res.status(400).json({ message: 'PDF text is too short to generate a description' });
    }

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      // Generate a smart fallback description without AI
      const fallbackDesc = generateFallbackDescription(title, subject, pdfText);
      return res.json({ description: fallbackDesc });
    }

    try {
      // Truncate PDF text if too long (max ~3000 chars for summary)
      const truncatedText = pdfText.substring(0, 3000);

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `You are helping students share study notes. Based on the following PDF content, generate a SHORT, clear 1-2 sentence description (max 150 chars) that describes what topics/concepts these notes cover.

Title: ${title || 'Not provided'}
Subject: ${subject || 'Not provided'}

PDF Content (first part):
${truncatedText}

Generate ONLY the description, no extra text:`
        }]
      });

      const description = message.content[0].text.trim();

      res.json({ description });
    } catch (aiError) {
      console.error('Claude AI error:', aiError);
      // Fallback description if AI fails
      res.json({ 
        description: `Study notes for ${subject || 'course'}${title ? ': ' + title : ''}`
      });
    }
  } catch (error) {
    console.error('Generate description error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PDF Upload endpoint using GridFS
app.post('/api/notes/upload-pdf', (req, res) => {
  console.log('📤 Upload request received at', new Date().toISOString());
  
  if (!useMongoDB) {
    console.log('❌ MongoDB not connected');
    return res.status(503).json({ 
      message: 'File upload requires MongoDB. Currently using in-memory storage.',
      fileId: 'temp_file_' + Date.now()
    });
  }

  if (!upload) {
    console.log('❌ Multer upload not initialized');
    return res.status(503).json({ 
      message: 'File upload system not initialized. Please restart the server.'
    });
  }

  console.log('🔄 Processing file with multer...');
  
  // Use multer middleware for this specific route
  upload.single('pdf')(req, res, async (err) => {
    if (err) {
      console.error('❌ Multer error:', err.message);
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ message: 'No PDF file provided. Please include a file with field name "pdf"' });
    }

    try {
      console.log('✅ File received:', req.file.originalname, req.file.size, 'bytes');
      console.log('📄 MIME type:', req.file.mimetype);
      
      // Validate file type - must be PDF
      if (req.file.mimetype !== 'application/pdf') {
        console.log('❌ Invalid file type:', req.file.mimetype);
        return res.status(400).json({ 
          message: 'Only PDF files are allowed. Please upload a PDF file.' 
        });
      }
      
      // Validate file is not empty
      if (req.file.size === 0) {
        console.log('❌ Empty file uploaded');
        return res.status(400).json({ 
          message: 'Uploaded file is empty. Please upload a valid PDF file.' 
        });
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        console.log('❌ File too large:', req.file.size);
        return res.status(400).json({ 
          message: `File size exceeds the 10MB limit. Your file is ${(req.file.size / (1024 * 1024)).toFixed(2)}MB` 
        });
      }
      
      // Create upload stream to GridFS
      const filename = `${Date.now()}-${req.file.originalname}`;
      const uploadStream = gridfsBucket.openUploadStream(filename, {
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname,
          uploadDate: new Date()
        }
      });

      // Write buffer to GridFS
      uploadStream.end(req.file.buffer);

      uploadStream.on('finish', () => {
        console.log('✅ File uploaded to GridFS successfully');
        console.log('🆔 File ID:', uploadStream.id);
        console.log('🆔 File ID type:', typeof uploadStream.id);
        console.log('🆔 File ID toString:', uploadStream.id.toString());
        
        res.json({
          message: 'File uploaded successfully',
          fileId: uploadStream.id.toString(), // Convert ObjectId to string
          filename: filename,
          size: req.file.size
        });
      });

      uploadStream.on('error', (error) => {
        console.error('❌ GridFS upload error:', error);
        res.status(500).json({ message: 'Error uploading file to storage' });
      });

    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({ message: 'Error processing upload' });
    }
  });
});

// Download PDF from GridFS
// View PDF inline (for preview)
app.get('/api/notes/view-pdf/:fileId', async (req, res) => {
  try {
    console.log('👁️ Preview request for fileId:', req.params.fileId);
    
    if (!useMongoDB) {
      return res.status(503).json({ message: 'File preview requires MongoDB' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      console.log('❌ Invalid ObjectId format:', req.params.fileId);
      return res.status(400).json({ message: 'Invalid file ID format' });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    // Find the file in GridFS
    const files = await gfs.files.findOne({ _id: fileId });
    
    if (!files) {
      console.log('❌ File not found for preview:', fileId);
      return res.status(404).json({ message: 'File not found' });
    }

    console.log('✅ File found for preview:', files.filename);

    // Set proper headers for PDF inline viewing
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${files.filename}"`,
      'Content-Length': files.length,
      'Cache-Control': 'public, max-age=31536000',
      'Accept-Ranges': 'bytes'
    });

    // Stream the file
    const readstream = gridfsBucket.openDownloadStream(fileId);
    
    readstream.on('error', (error) => {
      console.error('❌ Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file' });
      }
    });

    readstream.pipe(res);
  } catch (error) {
    console.error('❌ View PDF error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error viewing file', error: error.message });
    }
  }
});

// Download PDF by fileId (forces download) - GridFS version
app.get('/api/notes/download-pdf/:fileId', async (req, res) => {
  try {
    const fileIdParam = req.params.fileId;
    console.log('📥 Download request for fileId:', fileIdParam);
    console.log('📥 Request headers:', { origin: req.headers.origin, referer: req.headers.referer });
    
    if (!useMongoDB) {
      console.log('❌ MongoDB not available');
      return res.status(503).json({ 
        success: false,
        message: 'File download requires MongoDB',
        error: 'SERVICE_UNAVAILABLE' 
      });
    }

    // Validate fileId is provided
    if (!fileIdParam || fileIdParam.trim() === '') {
      console.log('❌ Missing fileId parameter');
      return res.status(400).json({ 
        success: false,
        message: 'File ID is required',
        error: 'MISSING_FILE_ID' 
      });
    }

    // Safely convert string to ObjectId with try-catch
    let fileId;
    try {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(fileIdParam)) {
        console.log('❌ Invalid ObjectId format:', fileIdParam);
        return res.status(400).json({ 
          success: false,
          message: 'Invalid file ID format. Must be a 24-character hexadecimal string.',
          error: 'INVALID_FILE_ID_FORMAT',
          receivedId: fileIdParam
        });
      }
      
      fileId = new mongoose.Types.ObjectId(fileIdParam);
      console.log('✅ Valid ObjectId created:', fileId);
    } catch (error) {
      console.log('❌ Error converting to ObjectId:', error.message);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid file ID format',
        error: 'INVALID_OBJECT_ID',
        details: error.message
      });
    }

    // Find the file in GridFS
    const files = await gfs.files.findOne({ _id: fileId });
    
    if (!files) {
      console.log('❌ File not found in GridFS:', fileId);
      // List recent files for debugging
      const recentFiles = await gfs.files.find().limit(10).toArray();
      console.log('📂 Recent files in GridFS:', recentFiles.map(f => ({ 
        id: f._id.toString(), 
        name: f.filename,
        uploadDate: f.uploadDate 
      })));
      return res.status(404).json({ 
        success: false,
        message: 'File not found in storage',
        error: 'FILE_NOT_FOUND',
        fileId: fileId.toString(),
        hint: 'The file may have been deleted or never uploaded'
      });
    }

    console.log('✅ File found:', { 
      id: files._id.toString(), 
      name: files.filename, 
      size: files.length,
      uploadDate: files.uploadDate,
      contentType: files.contentType
    });

    // Sanitize filename for Content-Disposition header
    const sanitizedFilename = files.filename.replace(/[^\w\s.-]/gi, '_');

    // Set proper headers for PDF download (attachment forces download)
    res.set({
      'Content-Type': files.contentType || 'application/pdf',
      'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
      'Content-Length': files.length,
      'Cache-Control': 'public, max-age=31536000',
      'Accept-Ranges': 'bytes',
      'X-File-Id': files._id.toString(),
      'X-File-Name': sanitizedFilename
    });

    // Stream the file from GridFS
    const readstream = gridfsBucket.openDownloadStream(fileId);
    
    readstream.on('error', (error) => {
      console.error('❌ Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false,
          message: 'Error streaming file from storage',
          error: 'STREAM_ERROR',
          details: error.message 
        });
      }
    });

    readstream.on('end', () => {
      console.log('✅ File download stream completed successfully');
    });

    readstream.pipe(res);
  } catch (error) {
    console.error('❌ Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        message: 'Error downloading file', 
        error: 'INTERNAL_ERROR',
        details: error.message 
      });
    }
  }
});

// NEW: Download PDF by note ID (user-friendly endpoint)
app.get('/api/notes/:noteId/download', async (req, res) => {
  try {
    const noteIdParam = req.params.noteId;
    console.log('📥 Download request for note ID:', noteIdParam);
    
    if (!noteIdParam || noteIdParam.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Note ID is required',
        error: 'MISSING_NOTE_ID' 
      });
    }

    if (useMongoDB) {
      // Validate ObjectId format for MongoDB
      if (!mongoose.Types.ObjectId.isValid(noteIdParam)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid note ID format',
          error: 'INVALID_NOTE_ID_FORMAT',
          receivedId: noteIdParam
        });
      }

      // Find the note
      const note = await Note.findById(noteIdParam).lean();
      
      if (!note) {
        return res.status(404).json({ 
          success: false,
          message: 'Note not found',
          error: 'NOTE_NOT_FOUND',
          noteId: noteIdParam
        });
      }

      // Check if note has a fileId
      if (!note.fileId) {
        return res.status(404).json({ 
          success: false,
          message: 'No file associated with this note',
          error: 'NO_FILE_ID',
          noteId: noteIdParam
        });
      }

      // Convert fileId to ObjectId
      const fileId = new mongoose.Types.ObjectId(note.fileId);
      console.log('✅ Found note with fileId:', fileId.toString());

      // Find file in GridFS
      const files = await gfs.files.findOne({ _id: fileId });
      
      if (!files) {
        return res.status(404).json({ 
          success: false,
          message: 'File not found in storage',
          error: 'FILE_NOT_FOUND',
          fileId: fileId.toString()
        });
      }

      console.log('✅ File found for download:', { 
        noteId: noteIdParam,
        fileId: files._id.toString(), 
        filename: files.filename,
        size: files.length
      });

      // Sanitize filename
      const sanitizedFilename = files.filename.replace(/[^\w\s.-]/gi, '_');

      // Set download headers
      res.set({
        'Content-Type': files.contentType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
        'Content-Length': files.length,
        'Cache-Control': 'public, max-age=31536000',
        'X-Note-Id': noteIdParam,
        'X-File-Id': files._id.toString()
      });

      // Stream the file
      const readstream = gridfsBucket.openDownloadStream(fileId);
      
      readstream.on('error', (error) => {
        console.error('❌ Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false,
            message: 'Error streaming file',
            error: 'STREAM_ERROR',
            details: error.message 
          });
        }
      });

      readstream.pipe(res);
    } else {
      // In-memory version
      const noteIdNum = parseInt(noteIdParam);
      if (isNaN(noteIdNum)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid note ID format',
          error: 'INVALID_NOTE_ID' 
        });
      }
      
      const note = notes.find(n => n.id === noteIdNum);
      if (!note) {
        return res.status(404).json({ 
          success: false,
          message: 'Note not found',
          error: 'NOTE_NOT_FOUND' 
        });
      }

      if (!note.fileUrl) {
        return res.status(404).json({ 
          success: false,
          message: 'No file associated with this note',
          error: 'NO_FILE_URL' 
        });
      }

      // Return JSON with download URL for in-memory mode
      res.json({ 
        success: true,
        downloadUrl: note.fileUrl,
        fileName: note.fileName || `${note.title}.pdf`
      });
    }
  } catch (error) {
    console.error('❌ Download by note ID error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        message: 'Error downloading file',
        error: 'INTERNAL_ERROR',
        details: error.message 
      });
    }
  }
});

// Track note download
app.post('/api/notes/:id/download', async (req, res) => {
  try {
    const noteId = req.params.id;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (useMongoDB) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(noteId)) {
        return res.status(400).json({ message: 'Invalid note ID format' });
      }

      // Increment download count for the note
      const note = await Note.findByIdAndUpdate(
        noteId,
        { $inc: { downloads: 1 } },
        { new: true }
      ).lean();

      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }

      // Update uploader's totalDownloads
      if (note.userId) {
        await User.findByIdAndUpdate(
          note.userId,
          { $inc: { totalDownloads: 1 } }
        );
      }

      res.json({ message: 'Download tracked', downloads: note.downloads });
    } else {
      const note = notes.find(n => n.id === parseInt(noteId));
      if (note) {
        note.downloads = (note.downloads || 0) + 1;
      }
      res.json({ message: 'Download tracked' });
    }
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    console.log('📝 Creating note with data:', JSON.stringify(req.body, null, 2));
    console.log('📎 fileId in request:', req.body.fileId, 'type:', typeof req.body.fileId);
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('dev_token_')) {
      return res.status(401).json({ message: 'Not authenticated. Please provide a valid authorization token.' });
    }

    const userId = token.replace('dev_token_', '');
    
    // Validate required fields
    const { title, description, subject, semester, fileId } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    if (!description || description.trim() === '') {
      return res.status(400).json({ message: 'Description is required' });
    }
    
    if (!subject || subject.trim() === '') {
      return res.status(400).json({ message: 'Subject is required' });
    }
    
    if (!semester) {
      return res.status(400).json({ message: 'Semester is required' });
    }
    
    // Validate semester is numeric
    if (isNaN(semester) || semester < 1 || semester > 8) {
      return res.status(400).json({ message: 'Invalid semester. Must be a number between 1 and 8' });
    }
    
    if (!fileId || fileId.trim() === '') {
      return res.status(400).json({ message: 'File ID is required. Please upload a PDF first' });
    }

    if (useMongoDB) {
      // MongoDB version
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const note = new Note({
        ...req.body,
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        userId: user._id,
        userName: user.name,
        views: 0,
        downloads: 0,
        upvotes: 0,
        downvotes: 0
      });
      
      console.log('💾 Saving note with fileId:', note.fileId);
      await note.save();
      console.log('✅ Note saved with ID:', note._id, 'fileId:', note.fileId);

      // Increment user's notesUploaded count
      await User.findByIdAndUpdate(userId, { $inc: { notesUploaded: 1 } });

      res.status(201).json({ message: 'Note created successfully', note });
    } else {
      // In-memory version
      const user = users.find(u => u.id === userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const note = {
        id: notes.length + 1,
        ...req.body,
        userId: user.id,
        userName: user.name,
        createdAt: new Date(),
        views: 0,
        downloads: 0,
        upvotes: 0,
        downvotes: 0
      };
      notes.push(note);

      // Increment user's notesUploaded count
      if (!user.notesUploaded) user.notesUploaded = 0;
      user.notesUploaded += 1;

      res.status(201).json({ message: 'Note created successfully', note });
    }
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single note by ID
app.get('/api/notes/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    
    if (!noteId || noteId.trim() === '') {
      return res.status(400).json({ message: 'Note ID is required' });
    }

    if (useMongoDB) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(noteId)) {
        return res.status(400).json({ message: 'Invalid note ID format. Must be a valid MongoDB ObjectId' });
      }

      // MongoDB version
      const note = await Note.findByIdAndUpdate(
        noteId,
        { $inc: { views: 1 } },
        { new: true }
      ).lean();

      if (!note) {
        return res.status(404).json({ message: 'Note not found with the provided ID' });
      }

      // Update user's total views
      if (note.userId) {
        await User.findByIdAndUpdate(note.userId, { $inc: { totalViews: 1 } });
      }

      // CRITICAL: Convert ObjectIds to strings for frontend
      // MongoDB returns ObjectIds which need to be converted to strings
      if (note.fileId) {
        note.fileId = note.fileId.toString();
      }
      
      // Convert _id to string and also add as 'id' for compatibility
      if (note._id) {
        note._id = note._id.toString();
        note.id = note._id; // Add id field for frontend compatibility
      }
      
      // Convert userId to string if it's an ObjectId
      if (note.userId && typeof note.userId === 'object') {
        note.userId = note.userId.toString();
      }

      console.log('✅ Returning note:', {
        id: note.id || note._id,
        _id: note._id,
        title: note.title,
        fileId: note.fileId,
        hasFileId: !!note.fileId
      });

      res.json({ note });
    } else {
      // In-memory version
      const noteIdNum = parseInt(noteId);
      if (isNaN(noteIdNum)) {
        return res.status(400).json({ message: 'Invalid note ID format' });
      }
      
      const note = notes.find(n => n.id === noteIdNum);
      if (!note) {
        return res.status(404).json({ message: 'Note not found with the provided ID' });
      }

      note.views += 1;
      res.json({ note });
    }
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ message: 'Server error fetching note', error: error.message });
  }
});

// Vote on a note
app.post('/api/notes/:id/vote', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('dev_token_')) {
      return res.status(401).json({ message: 'Not authenticated. Please provide a valid authorization token' });
    }

    const noteId = req.params.id;
    const { voteType } = req.body;
    
    // Validate noteId
    if (!noteId || noteId.trim() === '') {
      return res.status(400).json({ message: 'Note ID is required' });
    }
    
    // Validate voteType
    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type. Must be "upvote" or "downvote"' });
    }

    if (useMongoDB) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(noteId)) {
        return res.status(400).json({ message: 'Invalid note ID format. Must be a valid MongoDB ObjectId' });
      }

      // Check if note exists first
      const existingNote = await Note.findById(noteId);
      if (!existingNote) {
        return res.status(404).json({ message: 'Note not found with the provided ID' });
      }

      // MongoDB version
      const update = voteType === 'upvote' 
        ? { $inc: { upvotes: 1 } }
        : { $inc: { downvotes: 1 } };

      const note = await Note.findByIdAndUpdate(noteId, update, { new: true }).lean();

      // Update uploader's reputation (upvote = +10 points)
      if (voteType === 'upvote' && note.userId) {
        await User.findByIdAndUpdate(note.userId, { $inc: { reputation: 10 } });
      }

      res.json({ message: `${voteType === 'upvote' ? 'Upvote' : 'Downvote'} recorded successfully`, note });
    } else {
      // In-memory version
      const noteIdNum = parseInt(noteId);
      if (isNaN(noteIdNum)) {
        return res.status(400).json({ message: 'Invalid note ID format' });
      }
      
      const note = notes.find(n => n.id === noteIdNum);
      if (!note) {
        return res.status(404).json({ message: 'Note not found with the provided ID' });
      }

      if (voteType === 'upvote') {
        note.upvotes += 1;
      } else if (voteType === 'downvote') {
        note.downvotes += 1;
      }

      res.json({ message: `${voteType === 'upvote' ? 'Upvote' : 'Downvote'} recorded successfully`, note });
    }
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Server error processing vote', error: error.message });
  }
});

// Save/Bookmark a note
app.post('/api/notes/:id/save', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('dev_token_')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = token.replace('dev_token_', '');
    const noteId = req.params.id;

    if (useMongoDB) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(noteId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }

      // Check if already saved
      const existingSave = await SavedNote.findOne({ userId, noteId });
      if (existingSave) {
        return res.status(400).json({ message: 'Note already saved', saved: true });
      }

      // Save the note
      const savedNote = new SavedNote({ userId, noteId });
      await savedNote.save();

      res.json({ message: 'Note saved successfully', saved: true });
    } else {
      res.json({ message: 'Note saved successfully', saved: true });
    }
  } catch (error) {
    console.error('Save note error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unsave/Remove bookmark from a note
app.delete('/api/notes/:id/save', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('dev_token_')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = token.replace('dev_token_', '');
    const noteId = req.params.id;

    if (useMongoDB) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(noteId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }

      await SavedNote.deleteOne({ userId, noteId });
      res.json({ message: 'Note unsaved successfully', saved: false });
    } else {
      res.json({ message: 'Note unsaved successfully', saved: false });
    }
  } catch (error) {
    console.error('Unsave note error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get saved notes for current user
app.get('/api/notes/saved/list', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('dev_token_')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = token.replace('dev_token_', '');

    if (useMongoDB) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }

      const savedNotes = await SavedNote.find({ userId })
        .populate('noteId')
        .sort({ savedAt: -1 })
        .lean();

      const notes = savedNotes.map(sn => sn.noteId).filter(n => n !== null);
      res.json({ notes });
    } else {
      res.json({ notes: [] });
    }
  } catch (error) {
    console.error('Get saved notes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if note is saved
app.get('/api/notes/:id/saved', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('dev_token_')) {
      return res.json({ saved: false });
    }

    const userId = token.replace('dev_token_', '');
    const noteId = req.params.id;

    if (useMongoDB) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(noteId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.json({ saved: false });
      }

      const savedNote = await SavedNote.findOne({ userId, noteId });
      res.json({ saved: !!savedNote });
    } else {
      res.json({ saved: false });
    }
  } catch (error) {
    console.error('Check saved error:', error);
    res.json({ saved: false });
  }
});

// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    if (useMongoDB) {
      // MongoDB version
      const leaderboard = await User.find({ 
        notesUploaded: { $gt: 0 } // Only users who have uploaded notes
      })
      .select('name totalDownloads notesUploaded createdAt')
      .lean();

      // Calculate average and sort
      const rankedUsers = leaderboard
        .map(user => ({
          name: user.name,
          totalDownloads: user.totalDownloads || 0,
          notesUploaded: user.notesUploaded || 0,
          avgDownloads: user.notesUploaded > 0 ? (user.totalDownloads || 0) / user.notesUploaded : 0,
          joinDate: user.createdAt
        }))
        .sort((a, b) => {
          // Sort by total downloads (descending)
          if (b.totalDownloads !== a.totalDownloads) {
            return b.totalDownloads - a.totalDownloads;
          }
          // If equal, sort by average downloads (descending)
          if (b.avgDownloads !== a.avgDownloads) {
            return b.avgDownloads - a.avgDownloads;
          }
          // If still equal, sort by join date (earlier first)
          return new Date(a.joinDate) - new Date(b.joinDate);
        });

      res.json({ leaderboard: rankedUsers });
    } else {
      // In-memory version
      const leaderboard = users
        .filter(user => (user.notesUploaded || 0) > 0)
        .map(user => ({
          name: user.name,
          totalDownloads: user.totalDownloads || 0,
          notesUploaded: user.notesUploaded || 0,
          avgDownloads: (user.notesUploaded || 0) > 0 ? (user.totalDownloads || 0) / (user.notesUploaded || 0) : 0,
          joinDate: user.createdAt
        }))
        .sort((a, b) => {
          // Sort by total downloads (descending)
          if (b.totalDownloads !== a.totalDownloads) {
            return b.totalDownloads - a.totalDownloads;
          }
          // If equal, sort by average downloads (descending)
          if (b.avgDownloads !== a.avgDownloads) {
            return b.avgDownloads - a.avgDownloads;
          }
          // If still equal, sort by join date (earlier first)
          return new Date(a.joinDate) - new Date(b.joinDate);
        });

      res.json({ leaderboard });
    }
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/notes/:id/download', async (req, res) => {
  try {
    const noteId = req.params.id;

    if (useMongoDB) {
      // MongoDB version
      const note = await Note.findByIdAndUpdate(
        noteId,
        { $inc: { downloads: 1 } },
        { new: true }
      );

      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }

      // Increment the note uploader's totalDownloads
      await User.findByIdAndUpdate(note.userId, { $inc: { totalDownloads: 1 } });

      // If note has fileId (GridFS), provide download endpoint, otherwise use fileUrl
      if (note.fileId) {
        res.json({ downloadUrl: `/api/notes/download-pdf/${note.fileId}`, useGridFS: true });
      } else {
        res.json({ downloadUrl: note.fileUrl || '/sample.pdf', useGridFS: false });
      }
    } else {
      // In-memory version
      const note = notes.find(n => n.id === parseInt(noteId));
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }

      note.downloads += 1;

      // Increment the note uploader's totalDownloads
      const uploader = users.find(u => u.id === note.userId);
      if (uploader) {
        if (!uploader.totalDownloads) uploader.totalDownloads = 0;
        uploader.totalDownloads += 1;
      }

      res.json({ downloadUrl: note.fileUrl || '/sample.pdf' });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Global error handler
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.log('✅ Server continues running...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  console.log('✅ Server continues running...');
});

// Start server
async function startServer() {
  try {
    console.log('[DEBUG] Starting server function...');
    // Try MongoDB connection first
    useMongoDB = await connectMongoDB();
    console.log('[DEBUG] MongoDB connection result:', useMongoDB);
    
    // Configure Google OAuth
    googleAuthEnabled = configureGoogleAuth();
    console.log('[DEBUG] Google Auth configured:', googleAuthEnabled);

    // Setup email transporter
    emailTransporter = setupEmailTransporter();

    console.log('[DEBUG] Starting Express server on port', PORT);
    
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(60));
      console.log('✅ NOTEMITRA BACKEND SERVER RUNNING');
      console.log('='.repeat(60));
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
      console.log(`💾 Database: ${useMongoDB ? 'MongoDB (Persistent)' : 'In-Memory (Temporary)'}`);
      console.log(`� Google OAuth: ${googleAuthEnabled ? 'Enabled ✅' : 'Disabled (Not Configured)'}`);
      console.log(`�📝 Users: ${useMongoDB ? 'Stored in MongoDB' : users.length + ' in memory'}`);
      console.log(`📚 Notes: ${useMongoDB ? 'Stored in MongoDB' : notes.length + ' in memory'}`);
      console.log('='.repeat(60));
      console.log('');
      if (!useMongoDB) {
        console.log('💡 TIP: Setup MongoDB Atlas for data persistence');
        console.log('   See SETUP_GUIDE.md for step-by-step instructions');
        console.log('');
      }
      if (!googleAuthEnabled) {
        console.log('💡 TIP: Setup Google OAuth for social login');
        console.log('   See SETUP_GUIDE.md for Google Cloud setup');
        console.log('');
      }
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${PORT} is busy, retrying in 2 seconds...`);
        setTimeout(startServer, 2000);
      } else {
        console.error('❌ Server error:', err);
        console.log('🔄 Retrying in 5 seconds...');
        setTimeout(startServer, 5000);
      }
    });

    // Keep alive with status updates
    setInterval(() => {
      const userCount = useMongoDB ? 'MongoDB' : users.length;
      const noteCount = useMongoDB ? 'MongoDB' : notes.length;
      console.log(`[${new Date().toLocaleTimeString()}] ✅ Server healthy - Users: ${userCount}, Notes: ${noteCount}`);
    }, 300000); // Every 5 minutes
    
    // Return a promise that never resolves to keep the async function alive
    return new Promise(() => {});
  } catch (err) {
    console.error('[ERROR] Server startup failed:', err);
    console.error('[ERROR] Stack:', err.stack);
    process.exit(1);
  }
}

// Start the server
console.log('🚀 Starting NoteMitra backend server...');
startServer();
