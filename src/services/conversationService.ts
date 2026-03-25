import { Resend } from 'resend';
import prisma from '@/src/lib/prisma';
import { HttpError } from '@/src/utils/errorHandler';

export const conversationService = {
  getConversations: async (userId: string) => {
    if (!userId) throw new HttpError(400, 'Missing userId');

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: String(userId) } }
      },
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { id: 'desc' }, take: 1 },
        course: true
      },
      orderBy: { id: 'desc' }
    });

    return conversations.map((c: any) => ({
      id: c.id,
      subject: c.subject,
      courseId: c.courseId,
      courseName: c.course?.title,
      unreadCount: c.unreadCount,
      participants: c.participants.filter((p: any) => p.userId !== userId).map((p: any) => p.user),
      lastMessage: c.messages[0] || null
    }));
  },

  getMessages: async (conversationId: string) => {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 }
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { id: 'asc' },
      include: { sender: true }
    });

    return messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.name,
      senderRole: m.sender.role as any,
      senderAvatar: m.sender.avatar || undefined,
      content: m.content,
      attachments: m.attachments,
      timestamp: m.createdAt.toISOString(),
      isRead: m.isRead,
      isEdited: m.isEdited,
      isDeleted: m.isDeleted
    }));
  },

  sendMessage: async (conversationId: string, data: any) => {
    const { senderId, content, attachments } = data;

    const message = await prisma.message.create({
      data: {
        content: content || '',
        attachments: attachments || null,
        senderId,
        conversationId
      },
      include: { sender: true }
    });

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { include: { user: true } }, course: true }
    });

    if (!conversation) throw new Error('Conversation not found');

    const receiverParticipants = conversation.participants.filter(
      (p: any) => String(p.userId) !== String(senderId)
    );

    if (receiverParticipants.length > 0) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCount: { increment: 1 } }
      });
    }

    const formattedMessage = {
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderRole: message.sender.role as any,
      senderAvatar: message.sender.avatar || undefined,
      content: message.content,
      attachments: message.attachments,
      timestamp: message.createdAt.toISOString(),
      isRead: message.isRead,
      conversationId: conversationId
    };

    // Send email notification to receivers
    if (receiverParticipants.length > 0 && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        await Promise.all(receiverParticipants.map((r: any) =>
          resend.emails.send({
            from: 'Canvas LMS <onboarding@resend.dev>',
            to: r.user.email,
            subject: `[Canvas LMS] Tin nhắn mới: ${conversation.subject || 'Không có tiêu đề'}`,
            html: `<div style="font-family: sans-serif; color: #333;">
                    <h2>Bạn có tin nhắn mới trên hệ thống Canvas</h2>
                    <p><strong>Khóa học:</strong> ${conversation.course?.title || 'Chung'}</p>
                    <p><strong>Từ:</strong> ${message.sender.name}</p>
                    <hr/>
                    <p><strong>Nội dung:</strong></p>
                    <p>${message.content}</p>
                    ${message.attachments ? '<p><em>(Tin nhắn có đính kèm tệp)</em></p>' : ''}
                    <br/>
                    <a href="${appUrl}/inbox" style="background:#0ea5e9; color:#fff; padding: 10px 20px; text-decoration:none; border-radius:5px;">Xem tin nhắn</a>
                   </div>`
          })
        ));
      } catch (emailError) {
        console.error("Lỗi gửi email Resend:", emailError);
      }
    }

    return formattedMessage;
  },

  createConversation: async (data: any) => {
    const { senderId, receiverId, subject, courseId, content, attachments } = data;
    if (!senderId || !receiverId) throw new HttpError(400, 'Missing users');

    let conversation = await prisma.conversation.findFirst({
      where: {
        subject: subject || null,
        courseId: courseId || null,
        AND: [
          { participants: { some: { userId: senderId } } },
          { participants: { some: { userId: receiverId } } }
        ]
      },
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { id: 'desc' }, take: 1 },
        course: true
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          subject: subject || null,
          courseId: courseId || null,
          participants: {
            create: [
              { userId: senderId },
              { userId: receiverId }
            ]
          }
        },
        include: {
          participants: { include: { user: true } },
          messages: { orderBy: { id: 'desc' }, take: 1 },
          course: true
        }
      });
    }

    if (content || attachments) {
      const message = await prisma.message.create({
        data: {
          content: content || '',
          attachments: attachments || null,
          senderId,
          conversationId: conversation.id
        },
        include: { sender: true }
      });

      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { unreadCount: { increment: 1 } },
        include: {
          participants: { include: { user: true } },
          messages: { orderBy: { id: 'desc' }, take: 1 },
          course: true
        }
      });

      // Send email notification to receiver
      const receiverP = conversation.participants.find((p: any) => p.userId === receiverId);
      if (receiverP && process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          await resend.emails.send({
            from: 'Canvas LMS <onboarding@resend.dev>',
            to: receiverP.user.email,
            subject: `[Canvas LMS] Tin nhắn mới: ${conversation.subject || 'Không có tiêu đề'}`,
            html: `<div style="font-family: sans-serif; color: #333;">
                    <h2>Bạn có tin nhắn mới trên hệ thống Canvas</h2>
                    <p><strong>Khóa học:</strong> ${conversation.course?.title || 'Chung'}</p>
                    <p><strong>Từ:</strong> ${message.sender.name}</p>
                    <hr/>
                    <p><strong>Nội dung:</strong></p>
                    <p>${message.content}</p>
                    ${message.attachments ? '<p><em>(Tin nhắn có đính kèm tệp)</em></p>' : ''}
                    <br/>
                    <a href="${appUrl}/inbox" style="background:#0ea5e9; color:#fff; padding: 10px 20px; text-decoration:none; border-radius:5px;">Xem tin nhắn</a>
                   </div>`
          });
        } catch (emailError) {
          console.error("Lỗi gửi email:", emailError);
        }
      }
    }

    return {
      id: conversation.id,
      subject: conversation.subject,
      courseId: conversation.courseId,
      courseName: conversation.course?.title,
      unreadCount: conversation.unreadCount,
      participants: conversation.participants.filter((p: any) => p.userId !== senderId).map((p: any) => p.user),
      lastMessage: conversation.messages[0] || null
    };
  },

  updateMessage: async (messageId: string, senderId: string, content: string) => {
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId }
    });
    if (!existingMessage) throw new HttpError(404, 'Message not found');
    if (existingMessage.senderId !== senderId) throw new HttpError(403, 'Cannot edit this message');
    if (existingMessage.isDeleted) throw new HttpError(400, 'Cannot edit deleted message');

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
      include: { sender: true }
    });

    return {
      id: updatedMessage.id,
      senderId: updatedMessage.senderId,
      senderName: updatedMessage.sender.name,
      senderRole: updatedMessage.sender.role as any,
      senderAvatar: updatedMessage.sender.avatar || undefined,
      content: updatedMessage.content,
      attachments: updatedMessage.attachments,
      timestamp: updatedMessage.createdAt.toISOString(),
      isRead: updatedMessage.isRead,
      isEdited: updatedMessage.isEdited,
      isDeleted: updatedMessage.isDeleted,
      conversationId: updatedMessage.conversationId
    };
  },

  deleteMessage: async (messageId: string, senderId: string) => {
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId }
    });
    if (!existingMessage) throw new HttpError(404, 'Message not found');
    if (existingMessage.senderId !== senderId) throw new HttpError(403, 'Cannot delete this message');

    const deletedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content: 'Tin nhắn đã bị thu hồi', attachments: { set: null }, isDeleted: true },
      include: { sender: true }
    });

    return {
      id: deletedMessage.id,
      senderId: deletedMessage.senderId,
      senderName: deletedMessage.sender.name,
      senderRole: deletedMessage.sender.role as any,
      senderAvatar: deletedMessage.sender.avatar || undefined,
      content: deletedMessage.content,
      attachments: deletedMessage.attachments,
      timestamp: deletedMessage.createdAt.toISOString(),
      isRead: deletedMessage.isRead,
      isEdited: deletedMessage.isEdited,
      isDeleted: deletedMessage.isDeleted,
      conversationId: deletedMessage.conversationId
    };
  }
};
