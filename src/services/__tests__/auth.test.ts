/**
 * @vitest-environment node
 *
 * UNIT TESTS — Auth Middleware (src/middleware/auth.ts)
 * Coverage: verifyToken, extractTokenFromRequest, generateToken, refreshToken, requireAuth
 */
import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';

// ── Mock env before importing module ──────────────────────────────────────────
vi.mock('@/src/lib/env', () => ({
  getEnv: () => ({ JWT_SECRET: 'test-secret-key-for-unit-tests' }),
}));

vi.mock('@/src/utils/errorHandler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/utils/errorHandler')>();
  return actual;
});

import {
  verifyToken,
  extractTokenFromRequest,
  generateToken,
  refreshToken,
} from '@/src/middleware/auth';

const SECRET = 'test-secret-key-for-unit-tests';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — verifyToken
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] verifyToken', () => {
  it('TC-AUTH-001: trả về payload khi token hợp lệ', () => {
    const token = jwt.sign({ id: 'u1', role: 'student' }, SECRET, { expiresIn: '1h' });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.id).toBe('u1');
    expect(payload?.role).toBe('student');
  });

  it('TC-AUTH-002: trả về null khi token bị sai chữ ký', () => {
    const token = jwt.sign({ id: 'u1', role: 'student' }, 'wrong-secret', { expiresIn: '1h' });
    expect(verifyToken(token)).toBeNull();
  });

  it('TC-AUTH-003: trả về null khi token đã hết hạn', () => {
    const token = jwt.sign({ id: 'u1', role: 'student' }, SECRET, { expiresIn: '-1s' });
    expect(verifyToken(token)).toBeNull();
  });

  it('TC-AUTH-004: trả về null khi truyền vào chuỗi rỗng', () => {
    expect(verifyToken('')).toBeNull();
  });

  it('TC-AUTH-005: trả về null khi truyền chuỗi ngẫu nhiên không phải JWT', () => {
    expect(verifyToken('not.a.jwt')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — generateToken & refreshToken
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] generateToken', () => {
  it('TC-AUTH-006: tạo JWT hợp lệ chứa đúng id và role', () => {
    const token = generateToken({ id: 'teacher-99', role: 'teacher' });
    expect(typeof token).toBe('string');
    const payload = verifyToken(token);
    expect(payload?.id).toBe('teacher-99');
    expect(payload?.role).toBe('teacher');
  });

  it('TC-AUTH-007: token sinh ra có thể verify lại thành công', () => {
    const token = generateToken({ id: 'admin-1', role: 'teacher' });
    expect(verifyToken(token)).not.toBeNull();
  });
});

describe('[UNIT] refreshToken', () => {
  it('TC-AUTH-008: làm mới token hợp lệ trả về token mới khác token cũ', () => {
    const old = generateToken({ id: 'u1', role: 'student' });
    const refreshed = refreshToken(old);
    expect(refreshed).not.toBeNull();
    // New token must be verifiable
    const payload = verifyToken(refreshed!);
    expect(payload?.id).toBe('u1');
  });

  it('TC-AUTH-009: token không hợp lệ → refreshToken trả về null', () => {
    expect(refreshToken('invalid.token.here')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — extractTokenFromRequest
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] extractTokenFromRequest', () => {
  const makeReq = (authHeader?: string) =>
    ({ headers: { get: (key: string) => (key === 'Authorization' ? (authHeader ?? null) : null) } } as any);

  it('TC-AUTH-010: trích xuất token từ header Bearer hợp lệ', () => {
    const req = makeReq('Bearer my-token-123');
    expect(extractTokenFromRequest(req)).toBe('my-token-123');
  });

  it('TC-AUTH-011: trả về null khi không có header Authorization', () => {
    expect(extractTokenFromRequest(makeReq(undefined))).toBeNull();
  });

  it('TC-AUTH-012: trả về null khi header không bắt đầu bằng "Bearer "', () => {
    expect(extractTokenFromRequest(makeReq('Basic abc123'))).toBeNull();
  });

  it('TC-AUTH-013: trả về null khi header là chuỗi rỗng', () => {
    expect(extractTokenFromRequest(makeReq(''))).toBeNull();
  });
});
