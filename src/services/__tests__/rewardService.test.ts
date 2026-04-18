/**
 * @vitest-environment node
 *
 * UNIT TESTS — rewardService
 * Coverage: getRewards, getPoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/prisma', () => ({
  default: {
    reward: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { rewardService } from '../rewardService';
import prisma from '@/src/lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getRewards
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] rewardService.getRewards', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-REWARD-001: trả về danh sách tất cả rewards', async () => {
    (prisma.reward.findMany as any).mockResolvedValue([
      { id: 'r1', title: 'Học sinh xuất sắc', icon: '🏆', color: 'gold' },
      { id: 'r2', title: 'Hoàn thành bài tập', icon: '✅', color: 'green' },
    ]);

    const result = await rewardService.getRewards();
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Học sinh xuất sắc');
    expect(prisma.reward.findMany).toHaveBeenCalled();
  });

  it('TC-REWARD-002: trả về mảng rỗng khi không có rewards', async () => {
    (prisma.reward.findMany as any).mockResolvedValue([]);
    const result = await rewardService.getRewards();
    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getPoints
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] rewardService.getPoints', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-REWARD-003: trả về số stars của user', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ stars: 150 });
    const result = await rewardService.getPoints('u1');
    expect(result).toBe(150);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: { stars: true },
    });
  });

  it('TC-REWARD-004: trả về 0 khi user không tồn tại', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const result = await rewardService.getPoints('invalid-user');
    expect(result).toBe(0);
  });

  it('TC-REWARD-005: trả về 0 khi user có stars = 0', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ stars: 0 });
    const result = await rewardService.getPoints('u-new');
    expect(result).toBe(0);
  });

  it('TC-REWARD-006: xử lý số stars âm (edge case)', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ stars: -10 });
    const result = await rewardService.getPoints('u-negative');
    expect(result).toBe(-10);
  });
});
