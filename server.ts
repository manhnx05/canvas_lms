import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mock Data
  const courses = [
    { id: "c1", title: "Toán học", color: "bg-blue-500", icon: "Calculator", teacher: "Cô Lan", studentsCount: 35, progress: 75, description: "Học đếm, các phép tính cơ bản và hình học." },
    { id: "c2", title: "Tiếng Việt", color: "bg-rose-500", icon: "BookOpen", teacher: "Cô Lan", studentsCount: 35, progress: 60, description: "Học chữ cái, đánh vần, tập đọc và viết chính tả." },
    { id: "c3", title: "Tự nhiên & Xã hội", color: "bg-emerald-500", icon: "Leaf", teacher: "Thầy Minh", studentsCount: 35, progress: 90, description: "Khám phá thế giới xung quanh, động vật và thực vật, nhận biết các biểu tượng thời tiết." },
    { id: "c4", title: "Mỹ thuật", color: "bg-amber-500", icon: "Palette", teacher: "Cô Hoa", studentsCount: 35, progress: 100, description: "Phát huy khả năng sáng tạo qua màu sắc và các hình khối cơ bản." },
    { id: "c5", title: "Tiếng Anh", color: "bg-indigo-500", icon: "Globe", teacher: "Thầy John", studentsCount: 35, progress: 40, description: "Làm quen với tiếng Anh cơ bản, học từ vựng qua bài hát." },
  ];

  const assignments = [
    { id: "a1", title: "Bảng cửu chương 5", courseId: "c1", courseName: "Toán học", dueDate: "Hôm nay, 20:00", starsReward: 5, status: "pending", type: "quiz", description: "Bé hãy ôn tập và làm bài kiểm tra nhanh về bảng của chương 5 nhé. Các câu hỏi đều xoay quanh các ví dụ thực tế." },
    { id: "a2", title: "Tập chép: Cháu nghe chú đánh đàn", courseId: "c2", courseName: "Tiếng Việt", dueDate: "Ngày mai", starsReward: 10, status: "pending", type: "writing", description: "Bé luyện chữ đẹp bài thơ vào vở ô ly. Sau đó nhờ ba mẹ chụp ảnh và nộp lên hệ thống." },
    { id: "a3", title: "Vẽ con vật em yêu thích", courseId: "c4", courseName: "Mỹ thuật", dueDate: "Thứ 6", starsReward: 15, status: "submitted", type: "drawing", description: "Sử dụng bút sáp màu và sự sáng tạo của bé để vẽ một bức tranh về con vật bé thích nhất." },
    { id: "a4", title: "Đọc to bài thơ", courseId: "c2", courseName: "Tiếng Việt", dueDate: "Đã qua", starsReward: 5, status: "graded", type: "reading", description: "Quay video bé đọc to rõ ràng bài thơ và gửi lên hệ thống." },
  ];

  const rewards = [
    { id: "r1", title: "Chăm chỉ", description: "Hoàn thành 5 bài tập liên tiếp", icon: "Star", color: "text-amber-500 bg-amber-100", dateEarned: "15/03/2026" },
    { id: "r2", title: "Họa sĩ nhí", description: "Đạt điểm 10 môn Mỹ thuật", icon: "Palette", color: "text-rose-500 bg-rose-100", dateEarned: "10/03/2026" },
    { id: "r3", title: "Toán học gia", description: "Giải đúng bài toán khó", icon: "Trophy", color: "text-blue-500 bg-blue-100", dateEarned: "05/03/2026" },
  ];

  const conversations = [
    { 
      id: "conv1", 
      participants: [{ id: "t1", name: "Cô Lan", role: "teacher", avatar: "" }],
      lastMessage: { id: "m1", senderId: "t1", senderName: "Cô Lan", senderRole: "teacher", content: "Bé An nhớ làm bài toán cộng nhé!", timestamp: "10:30 Hôm nay", isRead: false },
      unreadCount: 1
    },
    { 
      id: "conv2", 
      participants: [{ id: "t2", name: "Thầy Minh", role: "teacher", avatar: "" }],
      lastMessage: { id: "m2", senderId: "stu1", senderName: "Bé An (Bạn)", senderRole: "student", content: "Dạ vâng ạ.", timestamp: "Hôm qua", isRead: true },
      unreadCount: 0
    }
  ];

  const messagesData: Record<string, any[]> = {
    "conv1": [
      { id: "m0", senderId: "stu1", senderName: "Bé An (Bạn)", senderRole: "student", content: "Cô ơi bài 2 sửa thế nào ạ?", timestamp: "10:00 Hôm nay", isRead: true },
      { id: "m1", senderId: "t1", senderName: "Cô Lan", senderRole: "teacher", content: "Bé An nhớ làm bài toán cộng trước nhé, rồi mới trừ!", timestamp: "10:30 Hôm nay", isRead: false }
    ],
    "conv2": [
      { id: "m2", senderId: "t2", senderName: "Thầy Minh", senderRole: "teacher", content: "Tuần sau lớp mình đi dã ngoại nhé.", timestamp: "Hôm qua", isRead: true },
      { id: "m3", senderId: "stu1", senderName: "Bé An (Bạn)", senderRole: "student", content: "Dạ vâng ạ. Con sẽ nhắc mẹ chuẩn bị.", timestamp: "Hôm qua", isRead: true },
    ]
  };

  // Endpoints
  app.get("/api/courses", (req, res) => res.json(courses));
  
  app.get("/api/courses/:id", (req, res) => {
    const course = courses.find(c => c.id === req.params.id);
    if (!course) return res.status(404).json({ error: "Not found" });
    const courseAssignments = assignments.filter(a => a.courseId === course.id);
    res.json({ ...course, assignments: courseAssignments });
  });

  app.get("/api/assignments", (req, res) => res.json(assignments));

  app.get("/api/assignments/:id", (req, res) => {
    const assignment = assignments.find(a => a.id === req.params.id);
    if (!assignment) return res.status(404).json({ error: "Not found" });
    res.json(assignment);
  });

  app.get("/api/rewards", (req, res) => res.json(rewards));

  app.get("/api/conversations", (req, res) => res.json(conversations));

  app.get("/api/conversations/:id/messages", (req, res) => {
    const msgs = messagesData[req.params.id] || [];
    res.json(msgs);
  });

  app.get("/api/teacher/stats", (req, res) => {
    res.json({
      totalStudents: 35,
      pendingGrading: 12,
      averageAttendance: 98,
      upcomingClasses: 3
    });
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

startServer();
