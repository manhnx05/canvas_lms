import { Resend } from 'resend';
import prisma from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';

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
      senderRole: m.sender.role,
      senderAvatar: m.sender.avatar,
      content: m.content,
      attachments: m.attachments,
      timestamp: m.timestamp,
      isRead: m.isRead
    }));
  },

  sendMessage: async (conversationId: string, data: any, io: any) => {
    const { senderId, content, attachments } = data;

    const message = await prisma.message.create({
      data: {
        content: content || '',
        attachments: attachments || null,
        senderId,
        conversationId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      include: { sender: true }
    });

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: { increment: 1 } },
      include: { participants: { include: { user: true } }, course: true }
    });

    const formattedMessage = {
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderRole: message.sender.role,
      senderAvatar: message.sender.avatar,
      content: message.content,
      attachments: message.attachments,
      timestamp: message.timestamp,
      isRead: message.isRead,
      conversationId: conversationId
    };

    if (io) {
      conversation.participants.forEach((p: any) => {
        io.to(p.userId).emit('newMessage', formattedMessage);
      });
    }

    const receivers = conversation.participants.filter((p: any) => p.userId !== senderId);
    if (receivers.length > 0 && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await Promise.all(receivers.map((r: any) =>
          resend.emails.send({
            from: 'Canvas LMS <onboarding@resend.dev>',
            to: r.user.email,
            subject: `[Canvas LMS] Thông báo tin nhắn mới: ${conversation.subject || 'Không có tiêu đề'}`,
            html: `<div style="font-family: sans-serif; color: #333;">
                    <h2>Bạn có tin nhắn mới trên hệ thống Canvas</h2>
                    <p><strong>Khóa học:</strong> ${conversation.course?.title || 'Chung'}</p>
                    <p><strong>Từ:</strong> ${message.sender.name}</p>
                    <hr/>
                    <p><strong>Nội dung:</strong></p>
                    <p>${message.content}</p>
                    ${message.attachments ? '<p><em>(Tin nhắn có đính kèm tệp)</em></p>' : ''}
                    <br/>
                    <a href="http://localhost:3000/inbox" style="background:#0ea5e9; color:#fff; padding: 10px 20px; text-decoration:none; border-radius:5px;">Xem tin nhắn</a>
                   </div>`
          })
        ));
      } catch (emailError) {
        console.error("Lỗi gửi email Resend:", emailError);
      }
    }

    return formattedMessage;
  },

  createConversation: async (data: any, io: any) => {
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
          conversationId: conversation.id,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

      const formattedMessage = {
        id: message.id,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderRole: message.sender.role,
        senderAvatar: message.sender.avatar,
        content: message.content,
        attachments: message.attachments,
        timestamp: message.timestamp,
        isRead: message.isRead,
        conversationId: conversation.id
      };

      if (io) {
        conversation.participants.forEach((p: any) => {
          io.to(p.userId).emit('newMessage', formattedMessage);
          io.to(p.userId).emit('newConversation', { conversationId: conversation.id });
        });
      }

      const receiverP = conversation.participants.find((p: any) => p.userId === receiverId);
      if (receiverP && process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'Canvas LMS <onboarding@resend.dev>',
            to: receiverP.user.email,
            subject: `[Canvas LMS] Thông báo tin nhắn mới: ${conversation.subject || 'Không có tiêu đề'}`,
            html: `<div style="font-family: sans-serif; color: #333;">
                    <h2>Bạn có tin nhắn mới trên hệ thống Canvas</h2>
                    <p><strong>Khóa học:</strong> ${conversation.course?.title || 'Chung'}</p>
                    <p><strong>Từ:</strong> ${message.sender.name}</p>
                    <hr/>
                    <p><strong>Nội dung:</strong></p>
                    <p>${message.content}</p>
                    ${message.attachments ? '<p><em>(Tin nhắn có đính kèm tệp)</em></p>' : ''}
                    <br/>
                    <a href="http://localhost:3000/inbox" style="background:#0ea5e9; color:#fff; padding: 10px 20px; text-decoration:none; border-radius:5px;">Xem tin nhắn</a>
                   </div>`
          });
        } catch (emailError) { }
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
  }
};
