import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sanitizeRequestBody } from './sanitization';
import { validateRequestBody } from '@/src/lib/validations';

/**
 * API validation middleware configuration
 */
export interface ApiValidationConfig {
  body?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
  skipSanitization?: boolean;
}

/**
 * Comprehensive API validation middleware
 */
export function withApiValidation(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  config: ApiValidationConfig = {}
) {
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    const startTime = performance.now();
    
    try {
      // 1. Sanitize request body if not skipped
      let body = null;
      if (!config.skipSanitization && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        body = await sanitizeRequestBody(req);
        if (body === null && config.body) {
          return NextResponse.json(
            { error: 'Invalid request body format' },
            { status: 400 }
          );
        }
      }

      // 2. Validate request body
      if (config.body && body) {
        try {
          validateRequestBody(config.body, body);
        } catch (error: any) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }
      }

      // 3. Validate query parameters
      if (config.query) {
        const url = new URL(req.url);
        const queryParams: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });

        try {
          validateRequestBody(config.query, queryParams);
        } catch (error: any) {
          return NextResponse.json(
            { error: `Query validation failed: ${error.message}` },
            { status: 400 }
          );
        }
      }

      // 4. Validate path parameters
      if (config.params && context?.params) {
        try {
          const params = await context.params;
          validateRequestBody(config.params, params);
        } catch (error: any) {
          return NextResponse.json(
            { error: `Parameter validation failed: ${error.message}` },
            { status: 400 }
          );
        }
      }

      // 5. Execute the handler
      const response = await handler(req, context);
      
      // 6. Record performance metrics
      const duration = performance.now() - startTime;
      if (duration > 1000) {
        console.warn(`Slow API call: ${req.method} ${new URL(req.url).pathname} took ${duration}ms`);
      }

      return response;

    } catch (error: any) {
      const duration = performance.now() - startTime;
      console.error('API Validation Error:', {
        method: req.method,
        path: new URL(req.url).pathname,
        duration,
        error: error.message
      });

      return NextResponse.json(
        { 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Common validation schemas for reuse
 */
export const commonSchemas = {
  uuid: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format'),
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional()
  }),
  search: z.object({
    q: z.string().min(1).max(100).optional(),
    filter: z.string().optional()
  })
};

/**
 * Response formatting utilities
 */
export const apiResponse = {
  success: (data: any, message?: string) => NextResponse.json({
    success: true,
    data,
    ...(message && { message })
  }),

  error: (message: string, status: number = 400, details?: any) => NextResponse.json({
    success: false,
    error: message,
    ...(details && { details })
  }, { status }),

  paginated: (data: any[], total: number, page: number = 1, limit: number = 10) => NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  })
};
