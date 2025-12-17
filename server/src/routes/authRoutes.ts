import { Router } from 'express';
import passport from 'passport';
import {
  signup,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser,
  googleCallback,
  forgotPassword,
  resetPassword,
  verifyResetToken
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { 
  validateSignup, 
  validateLogin, 
  validateForgotPassword, 
  validateResetPassword 
} from '../middleware/validators';
import { forgotPasswordLimiter, loginLimiter } from '../middleware/rateLimiter';

const router = Router();

// Email/password auth
router.post('/signup', validateSignup, signup);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

// Password reset
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

// Get current user
router.get('/me', authenticate, getCurrentUser);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

export default router;
