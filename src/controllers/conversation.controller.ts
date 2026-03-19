import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getConversations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: String(userId) } }
      },
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { id: 'desc' }, take: 1 }
      }
    });
    
    const formatted = conversations.map(c => ({
      id: c.id,
      unreadCount: c.unreadCount,
      participants: c.participants.filter(p => p.userId !== userId).map(p => p.user),
      lastMessage: c.messages[0] || null
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách tin nhắn' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      orderBy: { id: 'asc' },
      include: { sender: true }
    });
    
    const formatted = messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.name,
      senderRole: m.sender.role,
      content: m.content,
      timestamp: m.timestamp,
      isRead: m.isRead
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy chi tiết tin nhắn' });
  }
};

  export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { senderId, content } = req.body;
    const conversationId = req.params.id;

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        conversationId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      include: { sender: true }
    });

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: { increment: 1 } },
      include: { participants: true }
    });

    const formattedMessage = {
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderRole: message.sender.role,
      content: message.content,
      timestamp: message.timestamp,
      isRead: message.isRead,
      conversationId: conversationId
    };

    // Emit socket event to all participants
    const io = req.app.get('io');
    if (io) {
      conversation.participants.forEach(p => {
        io.to(p.userId).emit('newMessage', formattedMessage);
      });
    }

    res.json(formattedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi gửi tin nhắn' });
  }
};

export const createConversation = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId } = req.body;
    if (!senderId || !receiverId) return res.status(400).json({ error: 'Missing users' });

    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: senderId } } },
          { participants: { some: { userId: receiverId } } }
        ]
      }
    });

    if (existing) return res.json(existing);

    // Create new conversation with participants
    const newConv = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: senderId },
            { userId: receiverId }
          ]
        }
      },
      include: {
        participants: { include: { user: true } },
        messages: true
      }
    });

    res.json(newConv);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tạo tin nhắn mới' });
  }
};
