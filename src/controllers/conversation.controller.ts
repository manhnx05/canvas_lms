import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getConversations = async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { id: 'desc' }, take: 1 }
      }
    });
    
    const formatted = conversations.map(c => ({
      id: c.id,
      unreadCount: c.unreadCount,
      participants: c.participants.map(p => p.user),
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
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        conversationId: req.params.id,
        timestamp: "Vừa xong"
      },
      include: { sender: true }
    });

    await prisma.conversation.update({
      where: { id: req.params.id },
      data: { unreadCount: { increment: 1 } }
    });

    res.json({
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderRole: message.sender.role,
      content: message.content,
      timestamp: message.timestamp,
      isRead: message.isRead
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi gửi tin nhắn' });
  }
};
