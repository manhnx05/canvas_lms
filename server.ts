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
    { id: "c1", title: "Toán học", color: "bg-blue-500", icon: "Calculator", teacher: "Cô Lan", studentsCount: 35, progress: 75 },
    { id: "c2", title: "Tiếng Việt", color: "bg-rose-500", icon: "BookOpen", teacher: "Cô Lan", studentsCount: 35, progress: 60 },
    { id: "c3", title: "Tự nhiên & Xã hội", color: "bg-emerald-500", icon: "Leaf", teacher: "Thầy Minh", studentsCount: 35, progress: 90 },
    { id: "c4", title: "Mỹ thuật", color: "bg-amber-500", icon: "Palette", teacher: "Cô Hoa", studentsCount: 35, progress: 100 },
    { id: "c5", title: "Tiếng Anh", color: "bg-indigo-500", icon: "Globe", teacher: "Thầy John", studentsCount: 35, progress: 40 },
  ];

  const assignments = [
    { id: "a1", title: "Bảng cửu chương 5", courseId: "c1", courseName: "Toán học", dueDate: "Hôm nay, 20:00", starsReward: 5, status: "pending", type: "quiz" },
    { id: "a2", title: "Tập chép: Cháu nghe chú đánh đàn", courseId: "c2", courseName: "Tiếng Việt", dueDate: "Ngày mai", starsReward: 10, status: "pending", type: "writing" },
    { id: "a3", title: "Vẽ con vật em yêu thích", courseId: "c4", courseName: "Mỹ thuật", dueDate: "Thứ 6", starsReward: 15, status: "submitted", type: "drawing" },
    { id: "a4", title: "Đọc to bài thơ", courseId: "c2", courseName: "Tiếng Việt", dueDate: "Đã qua", starsReward: 5, status: "graded", type: "reading" },
  ];

  const rewards = [
    { id: "r1", title: "Chăm chỉ", description: "Hoàn thành 5 bài tập liên tiếp", icon: "Star", color: "text-amber-500 bg-amber-100", dateEarned: "15/03/2026" },
    { id: "r2", title: "Họa sĩ nhí", description: "Đạt điểm 10 môn Mỹ thuật", icon: "Palette", color: "text-rose-500 bg-rose-100", dateEarned: "10/03/2026" },
    { id: "r3", title: "Toán học gia", description: "Giải đúng bài toán khó", icon: "Trophy", color: "text-blue-500 bg-blue-100", dateEarned: "05/03/2026" },
  ];

  // Endpoints
  app.get("/api/courses", (req, res) => {
    res.json(courses);
  });

  app.get("/api/assignments", (req, res) => {
    res.json(assignments);
  });

  app.get("/api/rewards", (req, res) => {
    res.json(rewards);
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
