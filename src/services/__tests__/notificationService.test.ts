/**
 * @vitest-environment node
 *
 * UNIT TESTS — notificationService
 * Coverage: getNotifications, markAsRead, createNotification
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/prisma', () => ({
  default: {
    notification: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { notificationService } from '../notificationService';
import prisma from '@/src/lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getNotifications
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] notificationService.getNotifications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-NOTIF-001: trả về danh sách notifications theo userId', async () => {
    (prisma.notification.findMany as any).mockResolvedValue([
      { id: 'n1', userId: 'u1', title: 'Thông báo 1', content: 'Nội dung 1', isRead: false },
      { id: 'n2', userId: 'u1', title: 'Thông báo 2', content: 'Nội dung 2', isRead: true },
    ]);

    const result = await notificationService.getNotifications('u1');
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Thông báo 1');
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } })
    );
  });

  it('TC-NOTIF-002: ném HttpError 400 khi thiếu userId', async () => {
    await expect(notificationService.getNotifications('')).rejects.toMatchObject({
      status: 400,
      message: 'Missing userId',
    });
  });

  it('TC-NOTIF-003: trả về mảng rỗng khi user không có notification nào', async () => {
    (prisma.notification.findMany as any).mockResolvedValue([]);
    const result = await notificationService.getNotifications('u-no-notif');
    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — markAsRead
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] notificationService.markAsRead', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-NOTIF-004: đánh dấu notification là đã đọc', async () => {
    (prisma.notification.update as any).mockResolvedValue({
      id: 'n1',
      isRead: true,
    });

    const result = await notificationService.markAsRead('n1');
    expect(result.isRead).toBe(true);
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { isRead: true },
    });
  });

  it('TC-NOTIF-005: xử lý lỗi khi notification không tồn tại', async () => {
    (prisma.notification.update as any).mockRejectedValue(new Error('Record not found'));
    await expect(notificationService.markAsRead('invalid-id')).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — createNotification
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] notificationService.createNotification', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-NOTIF-006: tạo notification mới thành công', async () => {
    (prisma.notification.create as any).mockResolvedValue({
      id: 'n-new',
      userId: 'u1',
      title: 'Bài tập mới',
      content: 'Bạn có bài tập mới cần hoàn thành',
      isRead: false,
    });

    const result = await notificationService.createNotification({
      userId: 'u1',
      title: 'Bài tập mới',
      content: 'Bạn có bài tập mới cần hoàn thành',
    });

    expect(result.id).toBe('n-new');
    expect(result.isRead).toBe(false);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        title: 'Bài tập mới',
        content: 'Bạn có bài tập mới cần hoàn thành',
      },
    });
  });

  it('TC-NOTIF-007: tạo notification với nội dung rỗng', async () => {
    (prisma.notification.create as any).mockResolvedValue({
      id: 'n-empty',
      userId: 'u2',
      title: 'Tiêu đề',
      content: '',
      isRead: false,
    });

    const result = await notificationService.createNotification({
      userId: 'u2',
      title: 'Tiêu đề',
      content: '',
    });

    expect(result.content).toBe('');
  });
});
