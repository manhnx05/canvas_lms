/**
 * @vitest-environment node
 *
 * UNIT TESTS — auth middleware
 * Coverage: verifyToken, extractTokenFromRequest, generateToken, refreshToken, requireAuth
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

vi.mock('@/src/lib/env', () => ({
  getEnv: () => ({
    JWT_SECRET: 'test-secret-key-for-testing',
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW: 900,
  }),
  isProduction: () => false,
}));

import {
  verifyToken,
  extractTokenFromRequest,
  generateToken,
  refreshToken,
  requireAuth,
  createAuthMiddleware,
} from '../auth';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — verifyToken
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] auth.verifyToken', () => {
  const JWT_SECRET = 'test-secret-key-for-testing';

  it('TC-AUTH-001: verify token hợp lệ thành công', () => {
    const payload = { id: 'user-1', role: 'student' as const };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const result = verifyToken(token);
    expect(result).toBeTruthy();
    expect(result?.id).toBe('user-1');
    expect(result?.role).toBe('student');
  });

  it('TC-AUTH-002: trả về null khi token không hợp lệ', () => {
    const result = verifyToken('invalid-token');
    expect(result).toBeNull();
  });

  it('TC-AUTH-003: trả về null khi token đã hết hạn', () => {
    const payload = { id: 'user-1', role: 'student' as const };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' }); // Expired

    const result = verifyToken(token);
    expect(result).toBeNull();
  });

  it('TC-AUTH-004: trả về null khi token có secret sai', () => {
    const payload = { id: 'user-1', role: 'student' as const };
    const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });

    const result = verifyToken(token);
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — extractTokenFromRequest
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] auth.extractTokenFromRequest', () => {
  it('TC-AUTH-005: extract token từ Authorization header', () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { Authorization: 'Bearer test-token-123' },
    });

    const result = extractTokenFromRequest(req);
    expect(result).toBe('test-token-123');
  });

  it('TC-AUTH-006: trả về null khi không có Authorization header', () => {
    const req = new NextRequest('http://localhost:3000/api/test');
    const result = extractTokenFromRequest(req);
    expect(result).toBeNull();
  });

  it('TC-AUTH-007: trả về null khi Authorization header không có Bearer', () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });

    const result = extractTokenFromRequest(req);
    expect(result).toBeNull();
  });

  it('TC-AUTH-008: trả về null khi Authorization header chỉ có "Bearer"', () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { Authorization: 'Bearer' },
    });

    const result = extractTokenFromRequest(req);
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — generateToken
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] auth.generateToken', () => {
  it('TC-AUTH-009: generate token thành công', () => {
    const payload = { id: 'user-1', role: 'teacher' as const };
    const token = generateToken(payload);

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded?.id).toBe('user-1');
    expect(decoded?.role).toBe('teacher');
  });

  it('TC-AUTH-010: token có expiration time', () => {
    const payload = { id: 'user-2', role: 'student' as const };
    const token = generateToken(payload);

    const decoded = verifyToken(token);
    expect(decoded?.exp).toBeTruthy();
    expect(decoded!.exp > Math.floor(Date.now() / 1000)).toBe(true);
  });

  it('TC-AUTH-011: token có issuer và audience', () => {
    const JWT_SECRET = 'test-secret-key-for-testing';
    const payload = { id: 'user-3', role: 'student' as const };
    const token = generateToken(payload);

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.iss).toBe('canvas-lms');
    expect(decoded.aud).toBe('canvas-lms-users');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — refreshToken
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] auth.refreshToken', () => {
  it('TC-AUTH-012: refresh token hợp lệ thành công', () => {
    const payload = { id: 'user-1', role: 'student' as const };
    const oldToken = generateToken(payload);

    const newToken = refreshToken(oldToken);
    expect(newToken).toBeTruthy();
    // Note: Token might be same if generated in same second, just verify it's valid
    expect(typeof newToken).toBe('string');

    const decoded = verifyToken(newToken!);
    expect(decoded?.id).toBe('user-1');
    expect(decoded?.role).toBe('student');
  });

  it('TC-AUTH-013: trả về null khi token không hợp lệ', () => {
    const result = refreshToken('invalid-token');
    expect(result).toBeNull();
  });

  it('TC-AUTH-014: trả về null khi token đã hết hạn', () => {
    const JWT_SECRET = 'test-secret-key-for-testing';
    const payload = { id: 'user-1', role: 'student' as const };
    const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' });

    const result = refreshToken(expiredToken);
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — requireAuth
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] auth.requireAuth', () => {
  it('TC-AUTH-015: authenticate user thành công', async () => {
    const payload = { id: 'user-1', role: 'student' as const };
    const token = generateToken(payload);

    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = await requireAuth(req);
    expect(user.id).toBe('user-1');
    expect(user.role).toBe('student');
  });

  it('TC-AUTH-016: ném AuthenticationError khi thiếu token', async () => {
    const req = new NextRequest('http://localhost:3000/api/test');

    await expect(requireAuth(req)).rejects.toThrow('Token không được cung cấp');
  });

  it('TC-AUTH-017: ném AuthenticationError khi token không hợp lệ', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { Authorization: 'Bearer invalid-token' },
    });

    await expect(requireAuth(req)).rejects.toThrow('Token không hợp lệ hoặc đã hết hạn');
  });

  it('TC-AUTH-018: ném AuthorizationError khi role không đủ quyền', async () => {
    const payload = { id: 'user-1', role: 'student' as const };
    const token = generateToken(payload);

    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    await expect(requireAuth(req, ['teacher'])).rejects.toThrow(
      'Bạn không có quyền thực hiện thao tác này'
    );
  });

  it('TC-AUTH-019: cho phép truy cập khi role phù hợp', async () => {
    const payload = { id: 'teacher-1', role: 'teacher' as const };
    const token = generateToken(payload);

    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = await requireAuth(req, ['teacher']);
    expect(user.role).toBe('teacher');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — createAuthMiddleware
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] auth.createAuthMiddleware', () => {
  it('TC-AUTH-020: middleware trả về 401 khi thiếu token', async () => {
    const middleware = createAuthMiddleware();
    const req = new NextRequest('http://localhost:3000/api/test');

    const response = await middleware(req);
    expect(response).toBeTruthy();
    expect(response!.status).toBe(401);

    const body = await response!.json();
    expect(body.error).toBe('AuthenticationError');
  });

  it('TC-AUTH-021: middleware trả về 403 khi role không đủ quyền', async () => {
    const payload = { id: 'user-1', role: 'student' as const };
    const token = generateToken(payload);

    const middleware = createAuthMiddleware(['teacher']);
    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const response = await middleware(req);
    expect(response).toBeTruthy();
    expect(response!.status).toBe(403);

    const body = await response!.json();
    expect(body.error).toBe('AuthorizationError');
  });

  it('TC-AUTH-022: middleware trả về null khi authentication thành công', async () => {
    const payload = { id: 'teacher-1', role: 'teacher' as const };
    const token = generateToken(payload);

    const middleware = createAuthMiddleware(['teacher']);
    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const response = await middleware(req);
    expect(response).toBeNull();
  });
});
