import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/src/lib/env';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (in production, use Redis or similar)
const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  max?: number;
  windowMs?: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export function createRateLimit(options: RateLimitOptions = {}) {
  const env = getEnv();
  
  const {
    max = env.RATE_LIMIT_MAX,
    windowMs = env.RATE_LIMIT_WINDOW * 1000, // Convert to milliseconds
    keyGenerator = (req: NextRequest) => {
      // Use IP address as default key
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      return ip;
    },
  } = options;

  return async (req: NextRequest): Promise<NextResponse | null> => {
    const key = keyGenerator(req);
    const now = Date.now();
    const resetTime = now + windowMs;

    // Initialize or get existing record
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime,
      };
    }

    const record = store[key];

    // Check if limit exceeded
    if (record.count >= max) {
      const remainingTime = Math.ceil((record.resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          error: 'TooManyRequests',
          message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
          retryAfter: remainingTime,
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(record.resetTime / 1000).toString(),
            'Retry-After': remainingTime.toString(),
          },
        }
      );
    }

    // Increment counter
    record.count++;

    // Add rate limit headers to response (will be added by the calling route)
    const headers = {
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': Math.max(0, max - record.count).toString(),
      'X-RateLimit-Reset': Math.ceil(record.resetTime / 1000).toString(),
    };

    // Store headers in request for later use
    (req as any).rateLimitHeaders = headers;

    return null; // Continue to route handler
  };
}

// Predefined rate limiters for different endpoints
export const authRateLimit = createRateLimit({
  max: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // 15 minutes
});

export const apiRateLimit = createRateLimit({
  max: 100, // 100 requests
  windowMs: 15 * 60 * 1000, // 15 minutes
});

export const aiRateLimit = createRateLimit({
  max: 20, // 20 AI requests
  windowMs: 60 * 60 * 1000, // 1 hour
});

export const uploadRateLimit = createRateLimit({
  max: 10, // 10 uploads
  windowMs: 60 * 60 * 1000, // 1 hour
});

// Helper to apply rate limit headers to response
export function addRateLimitHeaders(response: NextResponse, req: NextRequest): NextResponse {
  const headers = (req as any).rateLimitHeaders;
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value as string);
    });
  }
  return response;
}