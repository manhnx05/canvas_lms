import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@/src/types';
import { getEnv } from '@/src/lib/env';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    role: Role;
  };
}

export interface JWTPayload {
  id: string;
  role: Role;
  iat: number;
  exp: number;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const env = getEnv();
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function extractTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

export function createAuthMiddleware(requiredRoles?: Role[]) {
  return async (req: NextRequest) => {
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      return NextResponse.json(
        { 
          error: 'AuthenticationError',
          message: 'Token không được cung cấp',
          timestamp: new Date().toISOString()
        }, 
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { 
          error: 'AuthenticationError',
          message: 'Token không hợp lệ hoặc đã hết hạn',
          timestamp: new Date().toISOString()
        }, 
        { status: 401 }
      );
    }

    // Check if token is expired (additional check)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return NextResponse.json(
        { 
          error: 'AuthenticationError',
          message: 'Token đã hết hạn',
          timestamp: new Date().toISOString()
        }, 
        { status: 401 }
      );
    }

    // Check role authorization
    if (requiredRoles && !requiredRoles.includes(payload.role)) {
      return NextResponse.json(
        { 
          error: 'AuthorizationError',
          message: 'Không có quyền truy cập',
          timestamp: new Date().toISOString()
        }, 
        { status: 403 }
      );
    }

    // Add user info to request (for use in route handlers)
    (req as AuthenticatedRequest).user = {
      id: payload.id,
      role: payload.role
    };

    return null; // Continue to route handler
  };
}

export async function requireAuth(req: Request | NextRequest, requiredRoles?: Role[]) {
  // Convert Request to NextRequest if needed
  const nextReq = req as NextRequest;
  const authResult = await createAuthMiddleware(requiredRoles)(nextReq);
  if (authResult) {
    throw authResult; // This will be caught by the route handler
  }
  return (nextReq as AuthenticatedRequest).user!;
}

// Generate JWT token
export function generateToken(payload: { id: string; role: Role }): string {
  const env = getEnv();
  return jwt.sign(
    payload,
    env.JWT_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'canvas-lms',
      audience: 'canvas-lms-users'
    }
  );
}

// Refresh token (extend expiration)
export function refreshToken(token: string): string | null {
  const payload = verifyToken(token);
  if (!payload) return null;
  
  // Generate new token with same payload but new expiration
  return generateToken({
    id: payload.id,
    role: payload.role
  });
}