/**
 * @vitest-environment node
 *
 * UNIT TESTS — conversationService
 * Coverage: getConversations, getMessages, sendMessage, createConversation,
 *           updateMessage, deleteMessage
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/lib/prisma', () => ({
  default: {
    conversation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'email-sent' }),
    },
  })),
}));

import { conversationService } from '../conversationService';
import prisma from '@/src/lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getConversations
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] conversationService.getConversations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-CONV-001: trả về danh sách conversations của user', async () => {
    (prisma.conversation.findMany as any).mockResolvedValue([
      {
        id: 'conv1',
        subject: 'Hỏi bài tập',
        courseId: 'c1',
        unreadCount: 2,
        course: { title: 'Toán 3' },
        participants: [
          { userId: 'u1', user: { id: 'u1', name: 'An' } },
          { userId: 'u2', user: { id: 'u2', name: 'Bình' } },
        ],
        messages: [{ id: 'm1', content: 'Tin nhắn cuối' }],
      },
    ]);

    const result = await conversationService.getConversations('u1');
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe('Hỏi bài tập');
    expect(result[0].participants).toHaveLength(1); // Loại trừ chính user u1
    expect(result[0].participants[0].name).toBe('Bình');
  });

  it('TC-CONV-002: ném HttpError 400 khi thiếu userId', async () => {
    await expect(conversationService.getConversations('')).rejects.toMatchObject({
      status: 400,
      message: 'Missing userId',
    });
  });

  it('TC-CONV-003: trả về mảng rỗng khi user không có conversation nào', async () => {
    (prisma.conversation.findMany as any).mockResolvedValue([]);
    const result = await conversationService.getConversations('u-no-conv');
    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — getMessages
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] conversationService.getMessages', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-CONV-004: trả về danh sách messages và reset unreadCount', async () => {
    (prisma.conversation.update as any).mockResolvedValue({});
    (prisma.message.findMany as any).mockResolvedValue([
      {
        id: 'm1',
        senderId: 's1',
        sender: { name: 'An', role: 'student', avatar: null },
        content: 'Xin chào',
        attachments: null,
        createdAt: new Date('2024-01-01'),
        isRead: false,
        isEdited: false,
        isDeleted: false,
      },
    ]);

    const result = await conversationService.getMessages('conv1');
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Xin chào');
    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv1' },
      data: { unreadCount: 0 },
    });
  });

  it('TC-CONV-005: format messages với đầy đủ thông tin sender', async () => {
    (prisma.conversation.update as any).mockResolvedValue({});
    (prisma.message.findMany as any).mockResolvedValue([
      {
        id: 'm2',
        senderId: 's2',
        sender: { name: 'Giáo viên', role: 'teacher', avatar: '/avatar.png' },
        content: 'Bài tập đã chấm',
        attachments: { files: ['file1.pdf'] },
        createdAt: new Date('2024-01-02'),
        isRead: true,
        isEdited: true,
        isDeleted: false,
      },
    ]);

    const result = await conversationService.getMessages('conv2');
    expect(result[0].senderName).toBe('Giáo viên');
    expect(result[0].senderRole).toBe('teacher');
    expect(result[0].senderAvatar).toBe('/avatar.png');
    expect(result[0].isEdited).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — sendMessage
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] conversationService.sendMessage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-CONV-006: gửi message thành công và tăng unreadCount', async () => {
    (prisma.message.create as any).mockResolvedValue({
      id: 'm-new',
      senderId: 's1',
      sender: { name: 'An', role: 'student', avatar: null },
      content: 'Tin nhắn mới',
      attachments: null,
      createdAt: new Date(),
      isRead: false,
      conversationId: 'conv1',
    });

    (prisma.conversation.findUnique as any).mockResolvedValue({
      id: 'conv1',
      participants: [
        { userId: 's1', user: { email: 'sender@test.com' } },
        { userId: 'r1', user: { email: 'receiver@test.com' } },
      ],
      course: { title: 'Toán' },
    });

    (prisma.conversation.update as any).mockResolvedValue({});

    const result = await conversationService.sendMessage('conv1', {
      senderId: 's1',
      content: 'Tin nhắn mới',
    });

    expect(result.content).toBe('Tin nhắn mới');
    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv1' },
      data: { unreadCount: { increment: 1 } },
    });
  });

  it('TC-CONV-007: gửi message với attachments', async () => {
    (prisma.message.create as any).mockResolvedValue({
      id: 'm-attach',
      senderId: 's1',
      sender: { name: 'An', role: 'student', avatar: null },
      content: 'File đính kèm',
      attachments: { files: ['doc.pdf'] },
      createdAt: new Date(),
      isRead: false,
      conversationId: 'conv1',
    });

    (prisma.conversation.findUnique as any).mockResolvedValue({
      id: 'conv1',
      participants: [{ userId: 's1', user: { email: 's@test.com' } }],
      course: null,
    });

    const result = await conversationService.sendMessage('conv1', {
      senderId: 's1',
      content: 'File đính kèm',
      attachments: { files: ['doc.pdf'] },
    });

    expect(result.attachments).toEqual({ files: ['doc.pdf'] });
  });

  it('TC-CONV-008: ném error khi conversation không tồn tại', async () => {
    (prisma.message.create as any).mockResolvedValue({
      id: 'm1',
      senderId: 's1',
      sender: { name: 'An' },
      createdAt: new Date(),
    });
    (prisma.conversation.findUnique as any).mockResolvedValue(null);

    await expect(
      conversationService.sendMessage('invalid-conv', { senderId: 's1', content: 'Test' })
    ).rejects.toThrow('Conversation not found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — createConversation
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] conversationService.createConversation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-CONV-009: tạo conversation mới khi chưa tồn tại', async () => {
    (prisma.conversation.findFirst as any).mockResolvedValue(null);
    (prisma.conversation.create as any).mockResolvedValue({
      id: 'conv-new',
      subject: 'Hỏi bài',
      courseId: 'c1',
      unreadCount: 0,
      participants: [
        { userId: 'u1', user: { id: 'u1', name: 'An' } },
        { userId: 'u2', user: { id: 'u2', name: 'Bình' } },
      ],
      messages: [],
      course: { title: 'Toán' },
    });

    const result = await conversationService.createConversation({
      senderId: 'u1',
      receiverId: 'u2',
      subject: 'Hỏi bài',
      courseId: 'c1',
    });

    expect(result.id).toBe('conv-new');
    expect(result.subject).toBe('Hỏi bài');
  });

  it('TC-CONV-010: sử dụng conversation đã tồn tại thay vì tạo mới', async () => {
    (prisma.conversation.findFirst as any).mockResolvedValue({
      id: 'conv-existing',
      subject: 'Đã có',
      courseId: 'c1',
      unreadCount: 0,
      participants: [
        { userId: 'u1', user: { id: 'u1', name: 'An' } },
        { userId: 'u2', user: { id: 'u2', name: 'Bình' } },
      ],
      messages: [],
      course: { title: 'Toán' },
    });

    const result = await conversationService.createConversation({
      senderId: 'u1',
      receiverId: 'u2',
      subject: 'Đã có',
      courseId: 'c1',
    });

    expect(result.id).toBe('conv-existing');
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('TC-CONV-011: ném HttpError 400 khi thiếu senderId hoặc receiverId', async () => {
    await expect(
      conversationService.createConversation({ senderId: '', receiverId: 'u2' })
    ).rejects.toMatchObject({ status: 400, message: 'Missing users' });

    await expect(
      conversationService.createConversation({ senderId: 'u1', receiverId: '' })
    ).rejects.toMatchObject({ status: 400, message: 'Missing users' });
  });

  it('TC-CONV-012: tạo conversation và gửi message đầu tiên', async () => {
    (prisma.conversation.findFirst as any).mockResolvedValue(null);
    (prisma.conversation.create as any).mockResolvedValue({
      id: 'conv-with-msg',
      subject: 'Test',
      courseId: null,
      unreadCount: 0,
      participants: [
        { userId: 'u1', user: { id: 'u1', name: 'An', email: 'an@test.com' } },
        { userId: 'u2', user: { id: 'u2', name: 'Bình', email: 'binh@test.com' } },
      ],
      messages: [],
      course: null,
    });

    (prisma.message.create as any).mockResolvedValue({
      id: 'm-first',
      senderId: 'u1',
      sender: { name: 'An', role: 'student', avatar: null },
      content: 'Xin chào',
      createdAt: new Date(),
    });

    (prisma.conversation.update as any).mockResolvedValue({
      id: 'conv-with-msg',
      unreadCount: 1,
      participants: [
        { userId: 'u1', user: { id: 'u1', name: 'An', email: 'an@test.com' } },
        { userId: 'u2', user: { id: 'u2', name: 'Bình', email: 'binh@test.com' } },
      ],
      messages: [{ id: 'm-first', content: 'Xin chào' }],
      course: null,
    });

    const result = await conversationService.createConversation({
      senderId: 'u1',
      receiverId: 'u2',
      subject: 'Test',
      content: 'Xin chào',
    });

    expect(result.unreadCount).toBe(1);
    expect(prisma.message.create).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — updateMessage
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] conversationService.updateMessage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-CONV-013: cập nhật message thành công', async () => {
    (prisma.message.findUnique as any).mockResolvedValue({
      id: 'm1',
      senderId: 's1',
      content: 'Nội dung cũ',
      isDeleted: false,
    });

    (prisma.message.update as any).mockResolvedValue({
      id: 'm1',
      senderId: 's1',
      sender: { name: 'An', role: 'student', avatar: null },
      content: 'Nội dung mới',
      attachments: null,
      createdAt: new Date(),
      isRead: false,
      isEdited: true,
      isDeleted: false,
      conversationId: 'conv1',
    });

    const result = await conversationService.updateMessage('m1', 's1', 'Nội dung mới');
    expect(result.content).toBe('Nội dung mới');
    expect(result.isEdited).toBe(true);
  });

  it('TC-CONV-014: ném HttpError 404 khi message không tồn tại', async () => {
    (prisma.message.findUnique as any).mockResolvedValue(null);
    await expect(
      conversationService.updateMessage('invalid-m', 's1', 'Test')
    ).rejects.toMatchObject({ status: 404, message: 'Message not found' });
  });

  it('TC-CONV-015: ném HttpError 403 khi user không phải là sender', async () => {
    (prisma.message.findUnique as any).mockResolvedValue({
      id: 'm1',
      senderId: 's1',
      isDeleted: false,
    });

    await expect(
      conversationService.updateMessage('m1', 's2', 'Hack')
    ).rejects.toMatchObject({ status: 403, message: 'Cannot edit this message' });
  });

  it('TC-CONV-016: ném HttpError 400 khi message đã bị xóa', async () => {
    (prisma.message.findUnique as any).mockResolvedValue({
      id: 'm1',
      senderId: 's1',
      isDeleted: true,
    });

    await expect(
      conversationService.updateMessage('m1', 's1', 'Edit')
    ).rejects.toMatchObject({ status: 400, message: 'Cannot edit deleted message' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIT — deleteMessage
// ─────────────────────────────────────────────────────────────────────────────
describe('[UNIT] conversationService.deleteMessage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-CONV-017: xóa message thành công (soft delete)', async () => {
    (prisma.message.findUnique as any).mockResolvedValue({
      id: 'm1',
      senderId: 's1',
    });

    (prisma.message.update as any).mockResolvedValue({
      id: 'm1',
      senderId: 's1',
      sender: { name: 'An', role: 'student', avatar: null },
      content: 'Tin nhắn đã bị thu hồi',
      attachments: null,
      createdAt: new Date(),
      isRead: false,
      isEdited: false,
      isDeleted: true,
      conversationId: 'conv1',
    });

    const result = await conversationService.deleteMessage('m1', 's1');
    expect(result.content).toBe('Tin nhắn đã bị thu hồi');
    expect(result.isDeleted).toBe(true);
    expect(result.attachments).toBeNull();
  });

  it('TC-CONV-018: ném HttpError 404 khi message không tồn tại', async () => {
    (prisma.message.findUnique as any).mockResolvedValue(null);
    await expect(
      conversationService.deleteMessage('invalid-m', 's1')
    ).rejects.toMatchObject({ status: 404, message: 'Message not found' });
  });

  it('TC-CONV-019: ném HttpError 403 khi user không phải là sender', async () => {
    (prisma.message.findUnique as any).mockResolvedValue({
      id: 'm1',
      senderId: 's1',
    });

    await expect(
      conversationService.deleteMessage('m1', 's2')
    ).rejects.toMatchObject({ status: 403, message: 'Cannot delete this message' });
  });
});
