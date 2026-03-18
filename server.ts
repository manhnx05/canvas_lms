import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Endpoints
  app.get("/api/courses", async (req, res) => {
    const courses = await prisma.course.findMany();
    res.json(courses);
  });
  
  app.get("/api/courses/:id", async (req, res) => {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { assignments: true }
    });
    if (!course) return res.status(404).json({ error: "Not found" });
    res.json(course);
  });

  app.get("/api/assignments", async (req, res) => {
    const assignments = await prisma.assignment.findMany();
    res.json(assignments);
  });

  app.get("/api/assignments/:id", async (req, res) => {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id }
    });
    if (!assignment) return res.status(404).json({ error: "Not found" });
    res.json(assignment);
  });

  app.get("/api/rewards", async (req, res) => {
    const rewards = await prisma.reward.findMany();
    res.json(rewards);
  });

  app.get("/api/conversations", async (req, res) => {
    const conversations = await prisma.conversation.findMany({
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { id: 'desc' }, take: 1 } // order by id assuming sequential or timestamp
      }
    });
    
    // Transform into the frontend shape
    const formatted = conversations.map(c => ({
      id: c.id,
      unreadCount: c.unreadCount,
      participants: c.participants.map(p => p.user),
      lastMessage: c.messages[0] || null
    }));
    
    res.json(formatted);
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
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
  });

  app.get("/api/teacher/stats", async (req, res) => {
    const pendingGradingCount = await prisma.assignment.count({
      where: { status: 'submitted' }
    });
    
    res.json({
      totalStudents: 35,
      pendingGrading: pendingGradingCount,
      averageAttendance: 98,
      upcomingClasses: 3
    });
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
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
  });

  app.post("/api/assignments/:id/submit", async (req, res) => {
    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: { status: 'submitted' }
    });
    res.json(assignment);
  });

  app.post("/api/assignments/:id/grade", async (req, res) => {
    const { stars } = req.body;
    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: { 
        status: 'graded',
        starsReward: parseInt(stars) || 0
      }
    });
    res.json(assignment);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
