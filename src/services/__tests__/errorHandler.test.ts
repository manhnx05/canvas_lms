/**
 * @vitest-environment node
 *
 * UNIT TESTS — errorHandler utility
 * Smoke + Sanity + Regression Tests — API error shape contract
 *
 * Coverage: HttpError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError,
 *           handleApiError (Prisma P2002/P2025/P2003), withErrorHandler wrapper
 */
import { describe, it, expect, vi } from 'vitest';

// Mock next/server before import
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: any, init: any) => ({ body, status: init?.status ?? 200 })),
  },
}));

import {
  HttpError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  handleApiError,
  withErrorHandler,
} from '@/src/utils/errorHandler';

// ─────────────────────────────────────────────────────────────────────────────
// SMOKE — Kiểm tra các Error class tồn tại và có đúng shape
// ─────────────────────────────────────────────────────────────────────────────
describe('[SMOKE] Error Classes tồn tại và cơ bản hoạt động', () => {
  it('TC-ERR-001: HttpError có status và message đúng', () => {
    const e = new HttpError(422, 'Dữ liệu không hợp lệ');
    expect(e.status).toBe(422);
    expect(e.message).toBe('Dữ liệu không hợp lệ');
    expect(e instanceof Error).toBe(true);
  });

  it('TC-ERR-002: ValidationError có status = 400', () => {
    const e = new ValidationError('Thiếu trường bắt buộc');
    expect(e.status).toBe(400);
    expect(e instanceof ValidationError).toBe(true);
  });

  it('TC-ERR-003: AuthenticationError có status = 401', () => {
    expect(new AuthenticationError().status).toBe(401);
  });

  it('TC-ERR-004: AuthorizationError có status = 403', () => {
    expect(new AuthorizationError().status).toBe(403);
  });

  it('TC-ERR-005: NotFoundError có status = 404', () => {
    expect(new NotFoundError().status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — handleApiError — error type mapping
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] handleApiError — error response mapping', () => {
  it('TC-ERR-006: HttpError → response với đúng status code', () => {
    const res = handleApiError(new HttpError(404, 'Không tìm thấy')) as any;
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('HttpError');
    expect(res.body.message).toBe('Không tìm thấy');
  });

  it('TC-ERR-007: ValidationError → 400', () => {
    const res = handleApiError(new ValidationError('Invalid input')) as any;
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });

  it('TC-ERR-008: AuthenticationError → 401', () => {
    const res = handleApiError(new AuthenticationError('Unauthorized')) as any;
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AuthenticationError');
  });

  it('TC-ERR-009: AuthorizationError → 403', () => {
    const res = handleApiError(new AuthorizationError('Forbidden')) as any;
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('AuthorizationError');
  });

  it('TC-ERR-010: NotFoundError → 404', () => {
    const res = handleApiError(new NotFoundError('Resource gone')) as any;
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NotFoundError');
  });

  it('TC-ERR-011: Prisma P2002 (duplicate) → 409 ConflictError', () => {
    const prismaErr = { code: 'P2002', message: 'Unique constraint failed' };
    const res = handleApiError(prismaErr) as any;
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ConflictError');
  });

  it('TC-ERR-012: Prisma P2025 (not found) → 404 NotFoundError', () => {
    const res = handleApiError({ code: 'P2025' }) as any;
    expect(res.status).toBe(404);
  });

  it('TC-ERR-013: Prisma P2003 (FK violation) → 400 BadRequestError', () => {
    const res = handleApiError({ code: 'P2003' }) as any;
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('BadRequestError');
  });

  it('TC-ERR-014: Error thông thường → 500 InternalServerError', () => {
    const res = handleApiError(new Error('Something crashed')) as any;
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('InternalServerError');
  });

  it('TC-ERR-015: Lỗi unknown (số nguyên) → 500 fallback', () => {
    const res = handleApiError(42) as any;
    expect(res.status).toBe(500);
  });

  it('TC-ERR-016: response luôn có trường timestamp là ISO string hợp lệ', () => {
    const res = handleApiError(new HttpError(400, 'test')) as any;
    expect(() => new Date(res.body.timestamp)).not.toThrow();
    expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — withErrorHandler wrapper
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] withErrorHandler wrapper', () => {
  it('TC-ERR-017: handler không lỗi → trả về đúng response', async () => {
    const mockReq = new Request('http://localhost/api/test');
    const handler = vi.fn().mockResolvedValue({ body: 'ok', status: 200 });
    const wrapped = withErrorHandler(handler);
    const result = await wrapped(mockReq);
    expect(handler).toHaveBeenCalledWith(mockReq, undefined);
    expect(result).toEqual({ body: 'ok', status: 200 });
  });

  it('TC-ERR-018: handler ném HttpError → withErrorHandler trả về error response', async () => {
    const mockReq = new Request('http://localhost/api/test');
    const handler = vi.fn().mockRejectedValue(new HttpError(403, 'Forbidden'));
    const wrapped = withErrorHandler(handler);
    const result = await wrapped(mockReq) as any;
    expect(result.status).toBe(403);
  });

  it('TC-ERR-019: handler ném Error thường → withErrorHandler trả về 500', async () => {
    const mockReq = new Request('http://localhost/api/test');
    const handler = vi.fn().mockRejectedValue(new Error('DB crash'));
    const wrapped = withErrorHandler(handler);
    const result = await wrapped(mockReq) as any;
    expect(result.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// REGRESSION — Đảm bảo instanceof chain hoạt động đúng (prototype fix)
// ─────────────────────────────────────────────────────────────────────────────
describe('[REGRESSION] instanceof checks sau setPrototypeOf', () => {
  it('TC-ERR-020: HttpError instanceof HttpError = true', () => {
    expect(new HttpError(500, 'x') instanceof HttpError).toBe(true);
  });

  it('TC-ERR-021: AuthenticationError instanceof AuthenticationError = true', () => {
    expect(new AuthenticationError() instanceof AuthenticationError).toBe(true);
  });

  it('TC-ERR-022: ValidationError instanceof ValidationError = true', () => {
    expect(new ValidationError('x') instanceof ValidationError).toBe(true);
  });
});
