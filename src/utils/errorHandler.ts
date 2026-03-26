import { NextResponse } from 'next/server';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export class ValidationError extends Error {
  status: number = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends Error {
  status: number = 401;
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends Error {
  status: number = 403;
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends Error {
  status: number = 404;
  constructor(message: string = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  path?: string;
}

export function handleApiError(error: unknown, req?: Request): NextResponse<ErrorResponse> {
  // Log full error details for debugging
  console.error('=== API Error Details ===');
  console.error('Error:', error);
  console.error('Error type:', error?.constructor?.name);
  console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  console.error('Request URL:', req?.url);
  console.error('========================');

  const timestamp = new Date().toISOString();
  const path = req?.url;

  // Handle known error types
  if (error instanceof HttpError) {
    return NextResponse.json({
      error: error.name,
      message: error.message,
      timestamp,
      ...(path && { path })
    }, { status: error.status });
  }

  if (error instanceof ValidationError) {
    return NextResponse.json({
      error: 'ValidationError',
      message: error.message,
      timestamp,
      ...(path && { path })
    }, { status: 400 });
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json({
      error: 'AuthenticationError',
      message: error.message,
      timestamp,
      ...(path && { path })
    }, { status: 401 });
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json({
      error: 'AuthorizationError',
      message: error.message,
      timestamp,
      ...(path && { path })
    }, { status: 403 });
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json({
      error: 'NotFoundError',
      message: error.message,
      timestamp,
      ...(path && { path })
    }, { status: 404 });
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        return NextResponse.json({
          error: 'ConflictError',
          message: 'Dữ liệu đã tồn tại',
          timestamp,
          ...(path && { path })
        }, { status: 409 });
      
      case 'P2025':
        return NextResponse.json({
          error: 'NotFoundError',
          message: 'Không tìm thấy dữ liệu',
          timestamp,
          ...(path && { path })
        }, { status: 404 });
      
      case 'P2003':
        return NextResponse.json({
          error: 'BadRequestError',
          message: 'Dữ liệu tham chiếu không hợp lệ',
          timestamp,
          ...(path && { path })
        }, { status: 400 });
    }
  }

  // Handle validation errors from Zod
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as any;
    const messages = zodError.issues.map((issue: any) => 
      `${issue.path.join('.')}: ${issue.message}`
    );
    
    return NextResponse.json({
      error: 'ValidationError',
      message: `Validation failed: ${messages.join(', ')}`,
      timestamp,
      ...(path && { path })
    }, { status: 400 });
  }

  // Handle generic errors
  if (error instanceof Error) {
    // In production, log the full error but return a safe message
    if (process.env.NODE_ENV === 'production') {
      console.error('Production error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        path
      });
    }
    
    return NextResponse.json({
      error: 'InternalServerError',
      message: process.env.NODE_ENV === 'production' 
        ? 'Đã xảy ra lỗi hệ thống' 
        : error.message,
      timestamp,
      ...(path && { path })
    }, { status: 500 });
  }

  // Fallback for unknown errors
  return NextResponse.json({
    error: 'InternalServerError',
    message: 'Đã xảy ra lỗi không xác định',
    timestamp,
    ...(path && { path })
  }, { status: 500 });
}

// Wrapper for API route handlers with error handling
export function withErrorHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error, req);
    }
  };
}
