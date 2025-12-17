import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import { User, RefreshToken, PasswordReset } from '../models';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/jwt';
import { sendPasswordResetEmail } from '../utils/email';

/**
 * Register new user
 * POST /api/auth/signup
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password, role, section, branch, semester } = req.body;

    // Double-check email domain on server side (defense in depth)
    if (!email.endsWith('@mictech.edu.in')) {
      res.status(400).json({ error: 'Email must be a valid college email (@mictech.edu.in)' });
      return;
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: role || 'student',
      section,
      branch,
      semester: parseInt(semester)
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        section: user.section,
        branch: user.branch,
        semester: user.semester,
        profilePic: user.profilePic
      },
      accessToken,
      refreshToken
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        section: user.section,
        branch: user.branch,
        profilePic: user.profilePic,
        reputation: user.reputation
      },
      accessToken,
      refreshToken
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshAccessToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      userId: payload.userId
    });

    if (!storedToken) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Check if token expired
    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      res.status(401).json({ error: 'Refresh token expired' });
      return;
    }

    // Get user
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({ accessToken });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    res.json({ message: 'Logout successful' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        section: req.user.section,
        branch: req.user.branch,
        profilePic: req.user.profilePic,
        reputation: req.user.reputation,
        uploadsCount: req.user.uploadsCount,
        isVerified: req.user.isVerified
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

/**
 * Google OAuth callback
 * GET /api/auth/google/callback
 */
export const googleCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      return;
    }

    const user = req.user as any;

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Redirect to frontend with tokens
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error: any) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

/**
 * Forgot Password
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email } = req.body;

    // Always return success message to prevent email enumeration
    const successMessage = 'If an account with that email exists, a password reset link has been sent.';

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if email exists or not
      res.json({ message: successMessage });
      return;
    }

    // Check if user registered with Google (no password)
    if (user.googleId && !user.passwordHash) {
      // Don't reveal this information
      res.json({ message: successMessage });
      return;
    }

    // Generate secure reset token
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

    // Invalidate any existing reset tokens for this user
    await PasswordReset.updateMany(
      { userId: user._id, used: false },
      { used: true }
    );

    // Create new password reset entry (expires in 15 minutes)
    await PasswordReset.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      used: false
    });

    // Send password reset email
    await sendPasswordResetEmail(email, plainToken, user.name);

    res.json({ message: successMessage });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
};

/**
 * Reset Password
 * POST /api/auth/reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { token, password } = req.body;

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetRecord = await PasswordReset.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      res.status(400).json({ 
        error: 'Invalid or expired reset token. Please request a new password reset.' 
      });
      return;
    }

    // Find the user
    const user = await User.findById(resetRecord.userId);
    if (!user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    // Update password (will be hashed by pre-save hook)
    user.passwordHash = password;
    await user.save();

    // Mark token as used (prevent reuse)
    resetRecord.used = true;
    await resetRecord.save();

    // Invalidate all existing refresh tokens for security
    await RefreshToken.deleteMany({ userId: user._id });

    res.json({ 
      message: 'Password has been reset successfully. Please log in with your new password.' 
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
};

/**
 * Verify Reset Token
 * GET /api/auth/verify-reset-token/:token
 */
export const verifyResetToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token || token.length !== 64) {
      res.status(400).json({ valid: false, error: 'Invalid token format' });
      return;
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetRecord = await PasswordReset.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      res.status(400).json({ 
        valid: false, 
        error: 'Invalid or expired reset token' 
      });
      return;
    }

    res.json({ valid: true });
  } catch (error: any) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ valid: false, error: 'Failed to verify token' });
  }
};
