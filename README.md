# Canvas LMS

AI-powered Learning Management System inspired by Canvas. Kết hợp UI hiện đại với tính năng tạo đề thi, chấm điểm và hỗ trợ AI để nâng cao trải nghiệm giảng dạy và học tập.

## 🚀 Bắt đầu nhanh

1. **Cài đặt phụ thuộc**
   ```bash
   npm install
   ```

2. **Cài đặt biến môi trường**
   Copy `.env.example` sang `.env` và điền giá trị phù hợp.

3. **Khởi tạo cơ sở dữ liệu**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. **Chạy server development**
   ```bash
   npm run dev
   ```
   Mở `http://localhost:3000`

---

## 📁 Cấu trúc dự án

### Thư mục chính

- `app/`
  - `api/` - API routes của Next.js
    - `ai/` - endpoint AI (chat, generate quiz, evaluate submission)
    - `assignments/` - quản lý assignment
    - `auth/` - đăng nhập, đăng ký, mật khẩu
    - `conversations/` - hội thoại, chat
    - `courses/` - dữ liệu khóa học
    - `debug/` - kiểm tra hệ thống
    - `exams/` - tạo và quản lý đề thi
    - `health/` - kiểm tra trạng thái
    - `notifications/` - thông báo
    - `rewards/` - phần thưởng
    - `teacher/` - chức năng giáo viên
    - `test-email/` - gửi email thử
    - `upload/` - upload file
    - `users/` - quản lý người dùng

- `src/`
  - `components/` - thành phần giao diện tái sử dụng
    - `quiz/`, `shared/`, `stats/`
  - `context/` - React context (`AuthContext.tsx`)
  - `features/` - UI theo tính năng cụ thể
    - `assignments/`, `course/`, `inbox/`
  - `hooks/` - custom hooks và API hooks
    - `api/`, `useAssignments.ts`, `useAuth.ts`, `useCourseDetail.ts`, `useDashboardData.ts`, `useSocket.ts`
  - `lib/` - helper, client, cấu hình chung
    - `apiClient.ts`, `env.ts`, `exam.ai.service.ts`, `gemini.ts`, `prisma.ts`, `queryClient.ts`, `validations.ts`
  - `middleware/` - middleware phía server
    - `auth.ts`, `rateLimit.ts`, `security.ts`
  - `sections/` - section trang landing và feature
    - `AiChatSection.tsx`, `ComparisonSection.tsx`, `HeroSection.tsx`
  - `services/` - business logic
    - `aiService.ts`, `assignmentService.ts`, `conversationService.ts`, `courseService.ts`, `examService.ts`, `notificationService.ts`, `rewardService.ts`, `teacherService.ts`, `userService.ts`
  - `utils/` - helper chung
    - `errorHandler.ts`, `format.ts`
  - `views/` - page-level screens
    - `AiChat.tsx`, `AssignmentDetail.tsx`, `Assignments.tsx`, `CourseDetail.tsx`, `Courses.tsx`, `Dashboard.tsx`, `EvaluationHub.tsx`, `ExamGenerator.tsx`, `ExamList.tsx`, `ExamTaking.tsx`, `ExamViewer.tsx`, `Inbox.tsx`, `Login.tsx`, `Notifications.tsx`, `Profile.tsx`, `Rewards.tsx`, `Students.tsx`
  - `types/` - định nghĩa kiểu TypeScript (`index.ts`)

- `prisma/`
  - `schema.prisma` - định nghĩa database schema
  - `migrations/` - migration history
  - `seed.ts` - seed dữ liệu mẫu

- `public/`
  - `textbooks/` - sách giáo khoa mẫu
  - `uploads/` - file được upload
  - `test-email.html`

- `scripts/`
  - `cleanup-courses.ts`
  - `create-missing-course.ts`
  - `sync-teacher-courses.ts`

- `CanvasLMS_Postman_Collection.json` - bộ sưu tập Postman

---

## 🧩 Các tính năng chính

- Quản lý khóa học, assignment, đề thi, học sinh và giáo viên
- Authentication JWT, phân quyền người dùng
- Gửi email qua Resend
- AI: tạo đề thi, chat AI, chấm bài
- Next.js App Router + React 19 + Tailwind CSS
- Prisma ORM + PostgreSQL

---

## 🤖 Module Chấm Bài AI

### Tổng Quan
Module **Chấm Bài AI** sử dụng Google Gemini Vision AI để tự động chấm điểm phiếu bài tập của học sinh. Dành riêng cho giáo viên với giao diện chat hiện đại.

### Chức Năng Chính

#### 1. Tải Lên và Phân Tích Phiếu Bài Tập
- Upload nhiều ảnh cùng lúc hoặc chụp trực tiếp từ camera
- Hỗ trợ tất cả định dạng ảnh phổ biến (JPG, PNG, HEIC)
- Tự động nén ảnh để tối ưu tốc độ xử lý
- Xem trước tất cả ảnh trước khi gửi
- AI phân tích toàn diện từ nhiều ảnh

#### 2. Trích Xuất Thông Tin Tự Động
AI tự động đọc từ phiếu bài tập:
- Tên học sinh (nhận dạng chữ viết tay)
- Lớp học
- Ngày sinh (nếu có)
- Nội dung bài làm

#### 3. Chấm Điểm Thông Minh
- **Thang điểm 10**: Tự động chấm theo thang điểm 10
- **Dựa trên Khung Năng Lực Khoa Học**:
  - Nhận thức khoa học (1.1-1.4)
  - Tìm hiểu môi trường tự nhiên & xã hội (2.5-2.7)
  - Vận dụng kiến thức, kĩ năng (3.8-3.10)
- **3 Mức độ đánh giá**:
  - Mức 1 (1 điểm): Chưa đạt
  - Mức 2 (2 điểm): Đạt nhưng chưa hoàn thiện
  - Mức 3 (3 điểm): Đạt hoàn toàn

#### 4. Nhận Xét Chi Tiết
- Phân tích từng năng lực (Mức 1, 2, 3)
- Giải thích đúng/sai
- Lời khuyên cụ thể để cải thiện
- Định dạng Markdown đẹp mắt

#### 5. Quản Lý Phiên Chấm Bài
- Lưu trữ tự động mỗi lần chấm
- Sidebar hiển thị danh sách phiên với tên, ngày, điểm
- Truy cập nhanh các phiên đã chấm

#### 6. Chat với AI
- Hỏi đáp về bài làm sau khi chấm
- AI nhớ toàn bộ ngữ cảnh
- Ví dụ câu hỏi:
  - "Giải thích thêm về câu 3"
  - "Đề xuất bài tập bổ sung"
  - "Phân tích sâu hơn về năng lực"

### Giao Diện

**Sidebar (Trái)**
- Nút "Chấm bài mới"
- Danh sách phiên đã chấm (sắp xếp theo thời gian)
- Highlight phiên hiện tại

**Khu vực Chat (Giữa)**
- Header: Tên, lớp, điểm học sinh
- Tin nhắn người dùng (phải, màu xanh)
- Tin nhắn AI (trái, màu xám, icon robot)
- Hiển thị ảnh phiếu bài tập
- Markdown support

**Khu vực Input (Dưới)**
- Nút upload ảnh
- Ô nhập tin nhắn
- Nút gửi
- Preview ảnh đã chọn

### Luồng Hoạt Động

**Chấm Bài Mới:**
1. Click "Chấm bài mới"
2. Upload/chụp ảnh phiếu bài tập
3. (Tùy chọn) Nhập ghi chú
4. Click "Gửi"
5. AI phân tích (5-10 giây)
6. Hiển thị: tên, lớp, điểm, nhận xét
7. Phiên mới lưu vào sidebar

**Chat về Bài Đã Chấm:**
1. Chọn phiên từ sidebar
2. Xem lại thông tin
3. Nhập câu hỏi
4. AI trả lời dựa trên ngữ cảnh
5. Hỏi nhiều câu liên tiếp

### API Endpoints

**POST /api/ai-grading**
- Tạo phiên chấm bài mới
- Input: multipart/form-data (file + message)
- Output: session + analysis

**GET /api/ai-grading**
- Lấy danh sách tất cả phiên chấm bài
- Output: sessions[]

**POST /api/ai-grading/[sessionId]**
- Chat trong phiên đã tồn tại
- Input: { message }
- Output: { reply }

### Công Nghệ

**Frontend:** React, TypeScript, Tailwind CSS, Lucide Icons, React Markdown, React Hot Toast

**Backend:** Next.js API Routes, Prisma ORM, Google Gemini 1.5 Pro, JWT Authentication

**Database Schema:**
```prisma
model AIGradingSession {
  id            String
  teacherId     String
  studentName   String?
  studentClass  String?
  studentDob    String?
  score         Float?
  feedback      String
  messages      AIGradingMessage[]
  createdAt     DateTime
  updatedAt     DateTime
}

model AIGradingMessage {
  id        String
  sessionId String
  role      String  // 'user' hoặc 'model'
  content   String
  imageUrl  String?
  createdAt DateTime
}
```

### Bảo Mật
- ✅ Yêu cầu JWT authentication
- ✅ Chỉ giáo viên truy cập
- ✅ Giáo viên chỉ xem phiên của mình
- ✅ Validation đầu vào
- ✅ Error handling toàn diện

### Ưu Điểm
- Tiết kiệm thời gian (chấm trong vài giây)
- Nhất quán theo tiêu chuẩn khoa học
- Nhận xét chi tiết từng năng lực
- Tương tác qua chat
- Lưu trữ và quản lý phiên
- Responsive (mobile + desktop)
- Hỗ trợ upload nhiều ảnh cùng lúc
- Tự động nén ảnh tối ưu

### Hạn Chế
- Yêu cầu ảnh rõ nét
- Hiện chỉ hỗ trợ môn Tự nhiên và Xã hội lớp 3
- Cần kết nối internet
- Phụ thuộc chất lượng chữ viết tay

### Kế Hoạch Phát Triển
- [ ] Hỗ trợ nhiều môn học và lớp
- [ ] Export PDF
- [ ] Thống kê năng lực theo thời gian
- [ ] Tích hợp module Assignment
- [ ] Chấm bài hàng loạt
- [ ] So sánh năng lực học sinh

---

## 🛠️ Lệnh thường dùng

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
npm run lint:fix
npm run test
npm run test:watch
npm run type-check
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
npm run db:studio
npm run db:reset
```

---

## 🔧 Biến môi trường quan trọng

Điền các biến sau vào file `.env`:

- `DATABASE_URL`
- `DATABASE_POOL_SIZE`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_VERIFIED_EMAIL`
- `NODE_ENV`
- `FRONTEND_URL`
- `LOG_LEVEL`
- `RATE_LIMIT_MAX`
- `RATE_LIMIT_WINDOW`

---

## 📌 Ghi chú

- Dự án sử dụng `next dev` cho môi trường development và `next start` cho production.
- `prisma generate` tự động chạy sau khi cài đặt và khi build.
- API route được đặt trong `app/api` theo Next.js App Router.

