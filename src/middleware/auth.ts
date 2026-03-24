import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@/src/types';

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
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'canvas_secret_key'
    ) as JWTPayload;
    return decoded;
  } catch (error) {
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
        { error: 'Token không được cung cấp' }, 
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token không hợp lệ hoặc đã hết hạn' }, 
        { status: 401 }
      );
    }

    // Check role authorization
    if (requiredRoles && !requiredRoles.includes(payload.role)) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' }, 
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

export async function requireAuth(req: NextRequest, requiredRoles?: Role[]) {
  const authResult = await createAuthMiddleware(requiredRoles)(req);
  if (authResult) {
    throw authResult; // This will be caught by the route handler
  }
  return (req as AuthenticatedRequest).user!;
}