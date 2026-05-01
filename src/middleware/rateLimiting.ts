import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const ip = getClientIP(req);
    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();
    
    // Initialize or get existing rate limit data
    if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }
    
    const rateLimitData = rateLimitStore[key];
    
    // Check if limit exceeded
    if (rateLimitData.count >= config.maxRequests) {
      const resetTimeSeconds = Math.ceil((rateLimitData.resetTime - now) / 1000);
      
      return NextResponse.json({
        error: 'RateLimitExceeded',
        message: config.message || 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        retryAfter: resetTimeSeconds,
        timestamp: new Date().toISOString()
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitData.resetTime.toString(),
          'Retry-After': resetTimeSeconds.toString()
        }
      });
    }
    
    // Increment counter
    rateLimitData.count++;
    
    return null; // Continue to next middleware/handler
  };
}

/**
 * Get client IP address from request
 */
function getClientIP(req: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to connection remote address
  return (req as any).ip || 'unknown';
}

/**
 * Common rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict rate limiting for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
  },
  
  // Moderate rate limiting for API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Quá nhiều yêu cầu API. Vui lòng thử lại sau.'
  },
  
  // Lenient rate limiting for general endpoints
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
  },
  
  // Very strict for sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
    message: 'Quá nhiều lần thực hiện thao tác nhạy cảm. Vui lòng thử lại sau 1 giờ.'
  }
};

/**
 * Wrapper function to apply rate limiting to API routes
 */
export function withRateLimit(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(config)(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Continue to handler
    return handler(req, context);
  };
}