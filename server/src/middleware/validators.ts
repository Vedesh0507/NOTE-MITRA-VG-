import { body, param, query, ValidationChain } from 'express-validator';

// Allowed email domain for college students
const ALLOWED_EMAIL_DOMAIN = '@mictech.edu.in';

export const validateSignup: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .custom((value) => {
      if (!value.endsWith(ALLOWED_EMAIL_DOMAIN)) {
        throw new Error(`Email must end with ${ALLOWED_EMAIL_DOMAIN}`);
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('semester')
    .notEmpty()
    .withMessage('Semester is required')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  body('branch')
    .notEmpty()
    .withMessage('Branch is required')
    .isIn(['CSE', 'AIML', 'AIDS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'])
    .withMessage('Invalid branch selection'),
  body('role')
    .optional()
    .isIn(['student', 'teacher'])
    .withMessage('Role must be student or teacher'),
  body('section').optional().trim().isLength({ max: 50 })
];

export const validateLogin: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

export const validateNoteUpload: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be 3-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('semester').trim().notEmpty().withMessage('Semester is required'),
  body('module').trim().notEmpty().withMessage('Module is required'),
  body('branch').trim().notEmpty().withMessage('Branch is required'),
  body('section').optional().trim().isLength({ max: 50 })
];

export const validateComment: ValidationChain[] = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be 1-1000 characters'),
  body('parentCommentId').optional().isMongoId().withMessage('Invalid parent comment ID')
];

export const validateReport: ValidationChain[] = [
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isIn(['inappropriate', 'duplicate', 'incorrect', 'spam', 'copyright', 'other'])
    .withMessage('Invalid reason'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

export const validateNoteQuery: ValidationChain[] = [
  query('subject').optional().trim(),
  query('semester').optional().trim(),
  query('module').optional().trim(),
  query('branch').optional().trim(),
  query('uploaderRole').optional().isIn(['student', 'teacher']),
  query('sortBy')
    .optional()
    .isIn(['uploadDate', 'upvotes', 'downloads', 'views'])
    .withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100')
];

export const validateMongoId: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid ID format')
];

// Forgot Password Validation
export const validateForgotPassword: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .custom((value) => {
      if (!value.endsWith(ALLOWED_EMAIL_DOMAIN)) {
        throw new Error(`Email must end with ${ALLOWED_EMAIL_DOMAIN}`);
      }
      return true;
    })
];

// Reset Password Validation
export const validateResetPassword: ValidationChain[] = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];
