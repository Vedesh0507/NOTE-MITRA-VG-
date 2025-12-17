import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production for scaling)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in the window
  message?: string; // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key generator
}

/**
 * Create a rate limiter middleware
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests. Please try again later.',
    keyGenerator = (req: Request) => req.ip || 'unknown'
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // If no entry or window has expired, create new entry
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, entry);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - 1).toString());
      res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());
      
      return next();
    }

    // Increment count
    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      
      res.status(429).json({
        error: message,
        retryAfter
      });
      return;
    }

    next();
  };
};

/**
 * Rate limiter for forgot password endpoint
 * Allows 3 requests per 15 minutes per IP
 */
export const forgotPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 3,
  message: 'Too many password reset requests. Please try again in 15 minutes.',
  keyGenerator: (req: Request) => {
    // Use combination of IP and email for more targeted limiting
    const email = req.body?.email?.toLowerCase() || '';
    const ip = req.ip || 'unknown';
    return `forgot-password:${ip}:${email}`;
  }
});

/**
 * Rate limiter for login endpoint
 * Allows 5 failed attempts per 15 minutes per IP/email combo
 */
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  keyGenerator: (req: Request) => {
    const email = req.body?.email?.toLowerCase() || '';
    const ip = req.ip || 'unknown';
    return `login:${ip}:${email}`;
  }
});

/**
 * General API rate limiter
 * Allows 100 requests per minute per IP
 */
export const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Too many requests. Please slow down.'
});
