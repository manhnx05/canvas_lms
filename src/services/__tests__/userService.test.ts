/**
 * @vitest-environment node
 *
 * UNIT TESTS — userService
 * Coverage: getUserProfile, getUsers, createUser, updateUser, deleteUser
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('$hashed$') },
}));

import { userService } from '../userService';
import prisma from '@/src/lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getUserProfile
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] userService.getUserProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-USER-001: trả về profile user theo id', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1', name: 'Nguyễn An', email: 'an@school.vn', role: 'student',
    });
    const result = await userService.getUserProfile('u1');
    expect(result?.name).toBe('Nguyễn An');
  });

  it('TC-USER-002: trả về null nếu user không tồn tại', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const result = await userService.getUserProfile('ghost');
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getUsers
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] userService.getUsers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-USER-003: lọc users theo role', async () => {
    (prisma.user.findMany as any).mockResolvedValue([
      { id: 'u1', role: 'student' },
    ]);
    await userService.getUsers({ role: 'student' });
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: 'student' } })
    );
  });

  it('TC-USER-004: loại trừ user theo excludeId', async () => {
    (prisma.user.findMany as any).mockResolvedValue([]);
    await userService.getUsers({ excludeId: 'u-exclude' });
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { not: 'u-exclude' } },
      })
    );
  });

  it('TC-USER-005: không có filter → trả về tất cả users', async () => {
    (prisma.user.findMany as any).mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    const result = await userService.getUsers({});
    expect(result).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — createUser
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] userService.createUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-USER-006: tạo user mới thành công, mật khẩu được hash', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({
      id: 'u-new',
      name: 'Trần B',
      email: 'b@school.vn',
      role: 'student',
    });

    const result = await userService.createUser({
      name: 'Trần B', email: 'b@school.vn', role: 'student',
    });
    expect(result.email).toBe('b@school.vn');
    // Đảm bảo password được hash
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ password: '$hashed$' }) })
    );
  });

  it('TC-USER-007: ném HttpError 400 khi email đã tồn tại', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'existing' });
    await expect(
      userService.createUser({ name: 'X', email: 'dup@school.vn' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('TC-USER-008: role mặc định là "student" khi không truyền', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockImplementation((args: any) =>
      Promise.resolve({ role: args.data.role })
    );
    const result = await userService.createUser({ name: 'C', email: 'c@school.vn' });
    expect(result.role).toBe('student');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — updateUser
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] userService.updateUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-USER-009: cập nhật tên user thành công', async () => {
    (prisma.user.update as any).mockResolvedValue({ id: 'u1', name: 'Tên Mới' });
    const result = await userService.updateUser('u1', { name: 'Tên Mới' });
    expect(result.name).toBe('Tên Mới');
  });

  it('TC-USER-010: ném 400 nếu email mới đã thuộc về user khác', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'other-user' });
    await expect(
      userService.updateUser('u1', { email: 'taken@school.vn' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('TC-USER-011: cho phép cập nhật email nếu email thuộc chính user đó', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1' }); // same id
    (prisma.user.update as any).mockResolvedValue({ id: 'u1', email: 'same@school.vn' });
    const result = await userService.updateUser('u1', { email: 'same@school.vn' });
    expect(result.email).toBe('same@school.vn');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — deleteUser
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] userService.deleteUser', () => {
  it('TC-USER-012: xóa user theo id', async () => {
    (prisma.user.delete as any).mockResolvedValue({ id: 'u1' });
    const result = await userService.deleteUser('u1');
    expect(result.id).toBe('u1');
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });
});
