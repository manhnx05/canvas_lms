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

