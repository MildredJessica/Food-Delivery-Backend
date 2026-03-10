import {rateLimit,ipKeyGenerator} from 'express-rate-limit';

// General rate limiter for all routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth rate limiter - stricter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Order rate limiter
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 orders per hour
  message: {
    success: false,
    message: 'Too many orders. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment rate limiter
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 payment attempts per windowMs
  message: {
    success: false,
    message: 'Too many payment attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API key rate limiter (for external API calls)
export const apiKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Limit each API key to 1000 requests per hour
  keyGenerator: ipKeyGenerator,
  message: {
    success: false,
    message: 'API rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});


