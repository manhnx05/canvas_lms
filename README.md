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

## 🧪 Testing

### Test Coverage

Dự án có **198 unit tests** toàn diện với coverage cao cho tất cả các services và middleware:

#### Services Tests (158 test cases)
- ✅ **userService** (12 tests) - Quản lý người dùng, authentication
- ✅ **courseService** (16 tests) - Quản lý khóa học, modules, announcements
- ✅ **examService** (13 tests) - Tạo đề thi, làm bài, chấm điểm
- ✅ **assignmentService** (tests) - Quản lý bài tập, nộp bài
- ✅ **aiService** (tests) - AI chat, generate quiz, evaluate submission
- ✅ **notificationService** (7 tests) - Thông báo người dùng
- ✅ **conversationService** (19 tests) - Chat, tin nhắn, conversations
- ✅ **rewardService** (6 tests) - Phần thưởng, điểm thưởng
- ✅ **teacherService** (13 tests) - Thống kê giáo viên, học sinh
- ✅ **aiGradingService** (13 tests) - Chấm bài AI, phân tích worksheet

#### Middleware Tests (22 test cases)
- ✅ **auth middleware** (22 tests) - JWT verification, token management, authorization

#### System Tests
- ✅ **errorHandler** - Error handling và logging
- ✅ **system** - Health checks và system status

### Chạy Tests

```bash
# Chạy tất cả tests
npm test

# Chạy tests với watch mode (tự động chạy lại khi có thay đổi)
npm run test:watch

# Chạy tests cho một file cụ thể
npm test -- src/services/__tests__/userService.test.ts

# Chạy tests với coverage report
npm test -- --coverage
```

### Test Structure

Mỗi test file tuân theo cấu trúc:
- **Test ID**: TC-[SERVICE]-[NUMBER] (ví dụ: TC-USER-001)
- **Mô tả rõ ràng**: Mô tả chức năng được test
- **Mock dependencies**: Mock Prisma, external APIs
- **Edge cases**: Test các trường hợp biên, lỗi
- **Logging**: Console logs để debug

### Test Technologies

- **Vitest** - Fast unit test framework
- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - Custom matchers
- **jsdom** - DOM environment cho tests

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
- **Test Coverage**: 198 unit tests covering services, middleware, và system components.
- **Code Quality**: ESLint configured với TypeScript strict mode.
- **Type Safety**: Full TypeScript support với strict type checking.

---

## 🎯 Quality Assurance

### Testing Strategy
- **Unit Tests**: Mỗi service và middleware có test coverage đầy đủ
- **Mock Strategy**: Mock Prisma, external APIs (Gemini, Resend)
- **Edge Cases**: Test các trường hợp lỗi, validation, authorization
- **Continuous Testing**: Tests chạy tự động trước mỗi commit

### Code Standards
- TypeScript strict mode enabled
- ESLint với rules chặt chẽ
- Prettier cho code formatting
- Conventional commits cho git messages

### Security
- JWT authentication với token expiration
- Role-based access control (RBAC)
- Rate limiting cho API endpoints
- Input validation và sanitization
- SQL injection prevention
- XSS protection headers

---

## 📋 PLICKERS FEATURE - ANALYSIS & FIX PLAN

### 🔍 PHÂN TÍCH TỔNG QUAN

#### Chức năng Plickers hiện tại:
Plickers là hệ thống kiểm tra nhanh sử dụng thẻ vật lý (QR code cards) để học sinh trả lời câu hỏi trắc nghiệm. Giáo viên quét thẻ bằng camera và hệ thống tự động chấm điểm.

#### Các thành phần chính:

**1. Database Schema (Prisma)**
- ✅ `PlickersSession` - Phiên kiểm tra
- ✅ `PlickersQuestion` - Câu hỏi trong phiên
- ✅ `PlickersResponse` - Câu trả lời của học sinh
- ✅ `Enrollment.plickerCardId` - Mapping học sinh với số thẻ

**2. Backend API**
- ✅ `GET /api/plickers/sessions` - Lấy danh sách phiên
- ✅ `POST /api/plickers/sessions` - Tạo phiên mới
- ✅ `GET /api/plickers/sessions/[id]` - Chi tiết phiên
- ✅ `PATCH /api/plickers/sessions/[id]` - Cập nhật phiên (status, currentQ)
- ✅ `DELETE /api/plickers/sessions/[id]` - Xóa phiên
- ✅ `GET /api/plickers/sessions/[id]/stream` - SSE real-time updates
- ✅ `GET /api/courses/[id]/enrollments` - Lấy danh sách học sinh
- ✅ `PATCH /api/courses/[id]/enrollments` - Cập nhật plickerCardId

**3. Frontend Views**
- ✅ `Plickers.tsx` - Danh sách phiên, tạo phiên mới
- ✅ `PlickersSession.tsx` - Chi tiết phiên, thống kê, điều khiển
- ✅ `PlickersLiveView.tsx` - Màn hình chiếu cho học sinh
- ✅ `PlickersCardTab.tsx` - Quản lý mapping thẻ trong course

**4. Services & Utils**
- ✅ `plickersService.ts` - Business logic (processSessionEnd)
- ✅ `plickersParser.ts` - Parse câu hỏi từ text

**5. External Integration**
- ⚠️ Flask App (http://localhost:5000) - Camera scanning (KHÔNG CÓ TRONG CODE)

---

### 🐛 CÁC VẤN ĐỀ PHÁT HIỆN

#### **CRITICAL ISSUES**

**1. Missing Flask Application**
- ❌ Frontend references `http://localhost:5000` nhưng không có Flask app trong codebase
- ❌ Không có API để nhận responses từ camera scanning
- ❌ Không có endpoint để Flask app gửi scanned data về

**2. Missing Response Creation API**
- ❌ Không có API endpoint để tạo `PlickersResponse` khi quét thẻ
- ❌ Frontend chỉ đọc responses nhưng không có cách tạo mới

**3. Incomplete Live View Integration**
- ⚠️ `PlickersLiveView` có toggle `showAnswer` local nhưng không sync với server
- ⚠️ Server có fields `showAnswer` và `showGraph` nhưng frontend không sử dụng đúng

#### **MEDIUM ISSUES**

**4. Parser Logic Issues**
- ⚠️ `plickersParser.ts` không handle multi-line questions tốt
- ⚠️ Không validate correctAnswer phải là A/B/C/D

**5. Missing Validation**
- ⚠️ Không validate duplicate plickerCardId trong cùng course
- ⚠️ Không validate cardNumber trong PlickersResponse phải match với enrolled students

**6. Gamification Logic**
- ⚠️ `processSessionEnd` tính điểm nhưng không handle trường hợp học sinh không trả lời
- ⚠️ Không có rollback mechanism nếu tạo Assignment thành công nhưng Submission fail

#### **MINOR ISSUES**

**7. UI/UX Issues**
- ⚠️ PlickersSession auto-refresh mỗi 3s có thể gây lag
- ⚠️ Không có loading state khi chuyển câu hỏi
- ⚠️ Hardcoded FLASK_URL không có env variable

**8. Type Safety**
- ⚠️ Một số type assertions không an toàn (`as const`, `as any`)
- ⚠️ Missing error boundaries

---

### 📝 KẾ HOẠCH TRIỂN KHAI

#### **PHASE 1: Fix Critical Issues** (Priority: HIGH) ✅ COMPLETED

**Task 1.1: Create PlickersResponse API** ✅
- [x] Tạo `POST /api/plickers/sessions/[id]/responses`
- [x] Validate cardNumber, questionId, answer
- [x] Check duplicate responses (unique constraint)
- [x] Return updated session data

**Task 1.2: Mock Flask Integration** ✅
- [x] Tạo PlickersManualScan view để simulate camera scanning
- [x] UI manual input để test without camera
- [x] Add route `/plickers/:id/scan`

**Task 1.3: Fix Live View Sync** ✅
- [x] Sử dụng `showAnswer` và `showGraph` từ SSE stream
- [x] Remove local state, sync với server
- [x] Add toggle buttons trong PlickersSession

#### **PHASE 2: Improve Validation & Logic** (Priority: MEDIUM) - IN PROGRESS

**Task 2.1: Add Validation**
- [ ] Validate duplicate plickerCardId trong course
- [ ] Validate cardNumber trong responses
- [ ] Add error messages rõ ràng

**Task 2.2: Improve Parser**
- [ ] Handle multi-line questions
- [ ] Validate correctAnswer format
- [ ] Add more test cases

**Task 2.3: Fix Gamification**
- [ ] Handle students không trả lời
- [ ] Add transaction rollback
- [ ] Improve error handling

#### **PHASE 3: Polish & Testing** (Priority: LOW)

**Task 3.1: UI/UX Improvements**
- [ ] Optimize auto-refresh strategy
- [ ] Add loading states
- [ ] Move FLASK_URL to env variable

**Task 3.2: Add Tests**
- [ ] Unit tests cho plickersParser
- [ ] Integration tests cho API endpoints
- [ ] E2E tests cho full flow

**Task 3.3: Documentation**
- [ ] API documentation
- [ ] Setup guide cho Flask app
- [ ] User guide

---

### 🚀 TRIỂN KHAI

Mỗi task sẽ được implement, test, commit và push riêng biệt theo quy tắc:
- ✅ Commit message bắt đầu bằng động từ
- ✅ Mỗi thay đổi một commit
- ✅ Push lên nhánh `manhdev`
- ✅ Chỉ cập nhật README.md, không tạo file .md mới

### 📊 PROGRESS SUMMARY

**Phase 1 (Critical):** ✅ 100% Complete (3/3 tasks)
- Created PlickersResponse API with full validation
- Built manual scan interface for testing
- Fixed Live View real-time sync

**Phase 2 (Medium):** 🔄 0% Complete (0/3 tasks)

**Phase 3 (Low):** 🔄 0% Complete (0/3 tasks)

**Overall Progress:** 33% (3/9 tasks completed)

