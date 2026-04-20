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

#### **PHASE 2: Improve Validation & Logic** (Priority: MEDIUM) ✅ COMPLETED

**Task 2.1: Add Validation** ✅
- [x] Validate duplicate plickerCardId trong course
- [x] Validate cardNumber trong responses
- [x] Add error messages rõ ràng

**Task 2.2: Improve Parser** ✅
- [x] Handle multi-line questions
- [x] Validate correctAnswer format
- [x] Add more test cases

**Task 2.3: Fix Gamification** ✅
- [x] Handle students không trả lời
- [x] Add transaction rollback
- [x] Improve error handling

#### **PHASE 3: Polish & Testing** (Priority: LOW) ✅ COMPLETED

**Task 3.1: UI/UX Improvements** ✅
- [x] Optimize auto-refresh strategy (chỉ refresh khi active, giảm từ 3s xuống 5s)
- [x] Add loading states when switching questions
- [x] Move FLASK_URL to environment variable

**Task 3.2: Add Tests** ✅
- [x] Unit tests cho plickersParser (16 test cases)
- [x] Integration tests cho plickersService (14 test cases)
- [x] Coverage cho edge cases và error handling

**Task 3.3: Documentation** ✅
- [x] API documentation
- [x] Setup guide cho Flask app
- [x] User guide

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

**Phase 2 (Medium):** ✅ 100% Complete (3/3 tasks)
- Added duplicate plickerCardId validation
- Improved parser with multi-line support and answer validation
- Fixed gamification logic with proper transaction handling

**Phase 3 (Low):** ✅ 100% Complete (3/3 tasks)
- Optimized auto-refresh and added loading states
- Added 30 comprehensive unit and integration tests
- Completed full documentation (API, setup guide, user guide)

**Overall Progress:** 100% (9/9 tasks completed) ✅

---

## 📚 PLICKERS FEATURE - COMPLETE DOCUMENTATION

### 🎯 Tổng Quan

Plickers là hệ thống kiểm tra nhanh (quick assessment) sử dụng thẻ vật lý có mã QR để học sinh trả lời câu hỏi trắc nghiệm. Giáo viên quét thẻ bằng camera và hệ thống tự động chấm điểm, trao thưởng sao.

### 🏗️ Kiến Trúc Hệ Thống

#### Database Schema
```prisma
PlickersSession {
  id, courseId, teacherId, title
  status: 'idle' | 'active' | 'ended'
  currentQ: số thứ tự câu hỏi hiện tại
  showAnswer, showGraph: điều khiển màn chiếu
  questions[], responses[]
}

PlickersQuestion {
  id, sessionId, text, order
  optionA, optionB, optionC, optionD
  correctAnswer: 'A' | 'B' | 'C' | 'D'
}

PlickersResponse {
  id, sessionId, questionId
  cardNumber: 1-40
  studentId, answer
  scannedAt
}

Enrollment {
  plickerCardId: mapping học sinh với số thẻ
}
```

#### API Endpoints

**Sessions Management**
- `GET /api/plickers/sessions` - Lấy danh sách phiên
- `POST /api/plickers/sessions` - Tạo phiên mới
- `GET /api/plickers/sessions/[id]` - Chi tiết phiên
- `PATCH /api/plickers/sessions/[id]` - Cập nhật phiên
- `DELETE /api/plickers/sessions/[id]` - Xóa phiên

**Real-time & Responses**
- `GET /api/plickers/sessions/[id]/stream` - SSE real-time updates
- `POST /api/plickers/sessions/[id]/responses` - Tạo response mới

**Course Integration**
- `GET /api/courses/[id]/enrollments` - Lấy danh sách học sinh
- `PATCH /api/courses/[id]/enrollments` - Cập nhật plickerCardId

### 📖 API Documentation

#### POST /api/plickers/sessions/[id]/responses
Tạo response mới khi quét thẻ học sinh.

**Request Body:**
```json
{
  "questionId": "uuid",
  "cardNumber": 1-40,
  "answer": "A" | "B" | "C" | "D"
}
```

**Validation:**
- `questionId` phải tồn tại trong session
- `cardNumber` phải từ 1-40
- `answer` phải là A, B, C, hoặc D
- Không cho phép duplicate (unique constraint: questionId + cardNumber)

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "sessionId": "uuid",
    "questionId": "uuid",
    "cardNumber": 5,
    "answer": "A",
    "scannedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PATCH /api/plickers/sessions/[id]
Cập nhật trạng thái phiên.

**Request Body:**
```json
{
  "status": "idle" | "active" | "ended",
  "currentQ": 0,
  "showAnswer": true,
  "showGraph": false
}
```

**Behaviors:**
- Khi `status` = "ended": Tự động trigger gamification (tính điểm, trao sao)
- Khi `currentQ` thay đổi: Reset `showAnswer` và `showGraph` về false
- `showAnswer` và `showGraph`: Điều khiển màn hình chiếu từ xa

#### GET /api/plickers/sessions/[id]/stream
Server-Sent Events (SSE) để real-time sync.

**Event Format:**
```
data: {"type":"update","session":{...}}
```

**Use Cases:**
- Live View tự động cập nhật khi giáo viên chuyển câu
- Hiển thị đáp án và biểu đồ real-time
- Sync trạng thái giữa nhiều devices

### 🎮 User Guide

#### Bước 1: Chuẩn Bị
1. Tạo khóa học và enroll học sinh
2. Gán số thẻ Plickers cho từng học sinh (1-40)
3. In thẻ Plickers từ https://plickers.com/cards

#### Bước 2: Tạo Phiên Kiểm Tra
1. Vào `/plickers`
2. Click "Tạo phiên mới"
3. Chọn khóa học
4. Nhập câu hỏi theo format:
```
Câu 1: Trái đất quay quanh mặt trời?
Đáp án: A

Câu 2: Nước sôi ở 100 độ C?
Đáp án: A
```
5. Click "Tạo phiên"

#### Bước 3: Bắt Đầu Phiên
1. Click vào phiên vừa tạo
2. Click "Bật Máy Chiếu (Live View)" - mở tab mới cho học sinh xem
3. Click "Bắt đầu" để chuyển status sang "active"

#### Bước 4: Quét Thẻ
**Option A: Camera Scanning (Production)**
1. Click "Quét Thẻ (Camera)"
2. Cho phép truy cập camera
3. Quét thẻ học sinh
4. Kết quả tự động gửi về server

**Option B: Manual Scan (Testing)**
1. Click "Manual Scan (Test)"
2. Nhập cardNumber và answer
3. Submit để test

#### Bước 5: Điều Khiển
- **Chuyển câu**: Dùng nút ◀ ▶
- **Hiển thị đáp án**: Toggle "Hiển thị đáp án trên màn chiếu"
- **Hiển thị biểu đồ**: Toggle "Hiển thị biểu đồ thống kê"

#### Bước 6: Kết Thúc
1. Click "Kết thúc phiên"
2. Hệ thống tự động:
   - Tính điểm cho từng học sinh
   - Tạo Assignment và Submission
   - Trao sao (5 sao/câu đúng)
   - Gửi thông báo cho học sinh

### 🔧 Setup Guide - Flask Camera App

#### Yêu Cầu
- Python 3.8+
- OpenCV
- Flask
- Camera/Webcam

#### Cài Đặt
```bash
# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Cài đặt dependencies
pip install flask opencv-python numpy pyzbar

# Tạo file app.py
```

#### Flask App Code (app.py)
```python
from flask import Flask, render_template, Response, jsonify
import cv2
from pyzbar import pyzbar
import requests

app = Flask(__name__)
camera = cv2.VideoCapture(0)

CANVAS_API = "http://localhost:3000/api"

def scan_plickers_card(frame):
    """Quét mã QR từ thẻ Plickers"""
    barcodes = pyzbar.decode(frame)
    for barcode in barcodes:
        data = barcode.data.decode("utf-8")
        # Parse: cardNumber-answer (ví dụ: "5-A")
        parts = data.split("-")
        if len(parts) == 2:
            return {"cardNumber": int(parts[0]), "answer": parts[1]}
    return None

@app.route('/')
def index():
    return render_template('scan.html')

@app.route('/video_feed')
def video_feed():
    def generate():
        while True:
            success, frame = camera.read()
            if not success:
                break
            
            # Quét thẻ
            result = scan_plickers_card(frame)
            if result:
                # Gửi về Canvas LMS
                session_id = "current-session-id"  # Lấy từ query param
                requests.post(
                    f"{CANVAS_API}/plickers/sessions/{session_id}/responses",
                    json=result
                )
            
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

#### Chạy Flask App
```bash
# Set environment variable
export NEXT_PUBLIC_FLASK_URL=http://localhost:5000

# Chạy Flask
python app.py

# Truy cập: http://localhost:5000
```

### 🎯 Gamification Logic

#### Tính Điểm
```
scaledScore = (correctAnswers / totalQuestions) * 100
```

#### Trao Sao
```
stars = correctAnswers * 5
```

#### Xử Lý Học Sinh
1. **Tham gia và trả lời đúng**: Nhận sao + thông báo chúc mừng
2. **Tham gia nhưng sai hết**: Score 0 + thông báo động viên
3. **Không tham gia**: Score 0 + thông báo nhắc nhở

#### Transaction Safety
- Tất cả operations trong một transaction
- Rollback nếu có lỗi
- Promise.all cho parallel operations

### 🧪 Testing

#### Unit Tests (16 tests)
**plickersParser.test.ts**
- Parse basic formats
- Multi-line questions
- Answer validation
- Edge cases (empty, invalid)

#### Integration Tests (14 tests)
**plickersService.test.ts**
- processSessionEnd flow
- Score calculation
- Star rewards
- Non-participants handling
- Error handling
- Transaction rollback

#### Chạy Tests
```bash
# Tất cả Plickers tests
npm test -- plickers

# Parser tests only
npm test -- plickersParser

# Service tests only
npm test -- plickersService
```

### 🎨 UI Components

#### PlickersSession.tsx
- Danh sách phiên
- Tạo phiên mới
- Import câu hỏi

#### PlickersSession.tsx
- Chi tiết phiên
- Thống kê real-time
- Điều khiển (chuyển câu, toggle answer/graph)
- Advanced analytics (câu khó nhất, học sinh yếu)

#### PlickersLiveView.tsx
- Màn hình chiếu cho học sinh
- Hiển thị câu hỏi hiện tại
- Biểu đồ kết quả real-time
- Sync với server qua SSE

#### PlickersManualScan.tsx
- Test interface không cần camera
- Manual input cardNumber + answer
- Validation và feedback

#### PlickersCardTab.tsx
- Quản lý mapping thẻ
- Gán số thẻ cho học sinh
- Validation duplicate

### 🔒 Security & Validation

#### API Level
- JWT authentication required
- Teacher role check
- Course ownership validation
- Input sanitization

#### Business Logic
- Duplicate response prevention (unique constraint)
- Card number range validation (1-40)
- Answer format validation (A/B/C/D only)
- Session status validation

#### Error Handling
- Comprehensive try-catch blocks
- Detailed error logging
- User-friendly error messages
- Transaction rollback on failure

### 🚀 Performance Optimizations

#### Auto-refresh Strategy
- Chỉ refresh khi session active
- Interval: 5 seconds (giảm từ 3s)
- Conditional loading states

#### Database
- Proper indexes on foreign keys
- Efficient queries with includes
- Transaction batching

#### Real-time
- SSE thay vì polling
- Selective updates
- Connection management

### 📊 Analytics Features

#### Session Statistics
- Tổng số câu hỏi
- Số học sinh tham gia
- Tổng lượt phản hồi
- Tỷ lệ đúng/sai mỗi câu

#### Advanced Analytics
- **Điểm Mù Kiến Thức**: Câu hỏi có tỷ lệ sai cao nhất
- **Nhóm Học Sinh Mất Gốc**: Học sinh đúng < 50%
- Biểu đồ phân bố đáp án
- Danh sách chi tiết từng học sinh

### 🎓 Best Practices

#### Giáo Viên
1. Test phiên trước khi dùng thật (dùng Manual Scan)
2. Kiểm tra mapping thẻ trước khi bắt đầu
3. Mở Live View trên máy chiếu trước
4. Giải thích rõ cách học sinh giơ thẻ
5. Chuyển câu từ từ, đợi học sinh sẵn sàng

#### Học Sinh
1. Giơ thẻ cao, hướng về camera
2. Giữ thẻ thẳng, không bị nghiêng
3. Đợi giáo viên xác nhận đã quét
4. Theo dõi màn chiếu để biết kết quả

### 🐛 Troubleshooting

#### Camera không hoạt động
- Kiểm tra quyền truy cập camera
- Thử browser khác (Chrome recommended)
- Restart Flask app

#### Thẻ không được quét
- Kiểm tra ánh sáng (cần đủ sáng)
- Thẻ phải in rõ nét
- Giữ thẻ cách camera 30-50cm

#### Kết quả không cập nhật
- Kiểm tra kết nối mạng
- Refresh trang Live View
- Kiểm tra session status (phải là "active")

#### Học sinh không nhận được sao
- Kiểm tra session đã "ended" chưa
- Xem logs trong console
- Kiểm tra mapping thẻ đúng chưa

### 🔮 Future Enhancements

- [ ] Mobile app cho camera scanning
- [ ] Offline mode với sync sau
- [ ] Export kết quả ra Excel/PDF
- [ ] Thống kê theo thời gian
- [ ] Tích hợp với Assignment module
- [ ] Chấm bài hàng loạt (batch grading)
- [ ] So sánh năng lực học sinh
- [ ] AI suggestions cho câu hỏi khó

---

## 🔍 PHÂN TÍCH SÂU & KẾ HOẠCH KIỂM TRA PLICKERS

### 📊 So Sánh Với Yêu Cầu Chuẩn Plickers

#### A. CHỨC NĂNG CỐT LÕI

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| **1. Roster Management** | ✅ HOÀN THÀNH | |
| - Gắn học sinh với thẻ 1-40 | ✅ | `Enrollment.plickerCardId` (1-40) |
| - Validation duplicate | ✅ | API `/api/courses/[id]/enrollments` |
| - UI quản lý mapping | ✅ | `PlickersCardTab.tsx` |
| **2. Content Management** | ✅ HOÀN THÀNH | |
| - Tạo câu hỏi trắc nghiệm A/B/C/D | ✅ | `PlickersQuestion` schema |
| - Đúng/Sai (2 options) | ✅ | Dùng A/B |
| - Import tự động | ✅ | `plickersParser.ts` |
| - CRUD câu hỏi | ✅ | API `/api/plickers/sessions` |
| **3. Live View** | ✅ HOÀN THÀNH | |
| - Hiển thị câu hỏi real-time | ✅ | `PlickersLiveView.tsx` |
| - Cập nhật ai đã trả lời | ✅ | SSE stream |
| - Sync với teacher dashboard | ✅ | WebSocket-like SSE |
| **4. Reports/Scoresheet** | ✅ HOÀN THÀNH | |
| - Thống kê đúng/sai | ✅ | `PlickersSession.tsx` analytics |
| - Xuất dữ liệu | ⚠️ | Chưa có export Excel/PDF |

#### B. FRONTEND

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| **1. Mobile App (Camera)** | ⚠️ THIẾU | |
| - Camera API | ❌ | Chưa implement |
| - Computer Vision | ❌ | Cần ArUco/QR detection |
| - Nhận diện góc xoay thẻ | ❌ | Cần thuật toán CV |
| - Gửi kết quả real-time | ⚠️ | API có sẵn nhưng chưa có app |
| **2. Web Dashboard** | ✅ HOÀN THÀNH | |
| - React framework | ✅ | React 19 + TypeScript |
| - Live View | ✅ | `PlickersLiveView.tsx` |
| - WebSocket connection | ✅ | SSE (tương đương) |
| - Real-time updates | ✅ | 1.5s polling via SSE |
| - Teacher controls | ✅ | `PlickersSession.tsx` |

#### C. BACKEND

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| **1. RESTful APIs** | ✅ HOÀN THÀNH | |
| - CRUD câu hỏi | ✅ | `/api/plickers/sessions` |
| - CRUD lớp học | ✅ | `/api/courses` |
| - CRUD tài khoản | ✅ | `/api/auth` |
| - Response creation | ✅ | `/api/plickers/sessions/[id]/responses` |
| **2. WebSocket Server** | ✅ HOÀN THÀNH | |
| - Real-time sync | ✅ | SSE implementation |
| - Room management | ✅ | Session-based |
| - Bi-directional comm | ⚠️ | SSE là one-way (server→client) |
| **3. Message Queue** | ❌ THIẾU | |
| - Hàng đợi xử lý | ❌ | Chưa có Redis/RabbitMQ |
| - Tránh quá tải DB | ❌ | Direct DB writes |
| - Batch processing | ❌ | Chưa optimize |

### 🎯 ĐÁNH GIÁ TỔNG QUAN

#### ✅ ĐIỂM MẠNH

1. **Database Schema Hoàn Chỉnh**
   - PlickersSession, PlickersQuestion, PlickersResponse
   - Enrollment với plickerCardId mapping
   - Proper indexes và relationships

2. **API Layer Chất Lượng Cao**
   - RESTful design chuẩn
   - Validation đầy đủ
   - Error handling tốt
   - JWT authentication

3. **Real-time Sync Tốt**
   - SSE implementation ổn định
   - Auto-reconnect
   - 1.5s latency chấp nhận được

4. **UI/UX Hiện Đại**
   - Responsive design
   - Loading states
   - Real-time feedback
   - Advanced analytics

5. **Gamification Hoàn Chỉnh**
   - Tính điểm tự động
   - Trao sao
   - Notifications
   - Transaction safety

6. **Test Coverage Cao**
   - 30 tests cho Plickers
   - Unit + Integration tests
   - Edge cases covered

#### ⚠️ ĐIỂM YẾU & THIẾU SÓT

1. **CRITICAL: Thiếu Mobile Camera App**
   - Không có ứng dụng quét thẻ
   - Chưa có Computer Vision
   - Chỉ có Manual Scan (test only)
   - **Impact**: Không thể sử dụng thẻ vật lý thực tế

2. **CRITICAL: Thiếu Message Queue**
   - Direct DB writes
   - Không scale với nhiều requests
   - Risk: Database overload
   - **Impact**: Performance issues với lớp đông

3. **MEDIUM: SSE Limitations**
   - One-way communication only
   - Không có true WebSocket
   - 1.5s polling có thể lag
   - **Impact**: Không real-time 100%

4. **MEDIUM: Thiếu Export Features**
   - Không export Excel
   - Không export PDF
   - Không có batch reports
   - **Impact**: Giáo viên khó lưu trữ

5. **LOW: Thiếu Offline Mode**
   - Phụ thuộc internet
   - Không có local cache
   - **Impact**: Không dùng được khi mất mạng

### 📋 KẾ HOẠCH KIỂM TRA CHI TIẾT

#### PHASE 1: Kiểm Tra Chức Năng Hiện Tại (1-2 ngày)

**1.1. Roster Management**
- [ ] Test gán thẻ 1-40 cho học sinh
- [ ] Test validation duplicate cardId
- [ ] Test update/remove cardId
- [ ] Test với nhiều courses
- [ ] Test edge cases (cardId = 0, 41, -1, null)

**1.2. Content Management**
- [ ] Test tạo session với câu hỏi
- [ ] Test import tự động (parser)
- [ ] Test CRUD operations
- [ ] Test với 1, 10, 50, 100 câu hỏi
- [ ] Test special characters trong câu hỏi

**1.3. Live View**
- [ ] Test SSE connection
- [ ] Test real-time updates
- [ ] Test với nhiều clients
- [ ] Test reconnection
- [ ] Test fullscreen mode
- [ ] Test showAnswer/showGraph sync

**1.4. Reports**
- [ ] Test statistics accuracy
- [ ] Test với nhiều students
- [ ] Test advanced analytics
- [ ] Test performance với large dataset

**1.5. Gamification**
- [ ] Test score calculation
- [ ] Test star rewards
- [ ] Test notifications
- [ ] Test non-participants handling
- [ ] Test transaction rollback

#### PHASE 2: Performance & Load Testing (2-3 ngày)

**2.1. Database Performance**
- [ ] Test với 100 students
- [ ] Test với 1000 responses
- [ ] Test concurrent writes
- [ ] Measure query times
- [ ] Identify slow queries

**2.2. API Performance**
- [ ] Load test với 50 concurrent users
- [ ] Stress test với 200 requests/second
- [ ] Test response times
- [ ] Test rate limiting
- [ ] Test error rates

**2.3. SSE Performance**
- [ ] Test với 50 concurrent connections
- [ ] Test memory usage
- [ ] Test connection stability
- [ ] Test bandwidth usage
- [ ] Test với slow networks

**2.4. Frontend Performance**
- [ ] Test render times
- [ ] Test với large datasets
- [ ] Test memory leaks
- [ ] Test mobile browsers
- [ ] Lighthouse scores

#### PHASE 3: Security Testing (1-2 ngày)

**3.1. Authentication**
- [ ] Test JWT validation
- [ ] Test token expiration
- [ ] Test role-based access
- [ ] Test unauthorized access
- [ ] Test session hijacking

**3.2. Input Validation**
- [ ] Test SQL injection
- [ ] Test XSS attacks
- [ ] Test CSRF protection
- [ ] Test file upload (nếu có)
- [ ] Test parameter tampering

**3.3. API Security**
- [ ] Test rate limiting
- [ ] Test CORS policies
- [ ] Test sensitive data exposure
- [ ] Test error messages
- [ ] Test API abuse

#### PHASE 4: Integration Testing (2-3 ngày)

**4.1. End-to-End Flows**
- [ ] Complete session flow (create → active → end)
- [ ] Student enrollment → card mapping → response
- [ ] Teacher dashboard → Live View sync
- [ ] Gamification trigger → rewards → notifications
- [ ] Multi-session concurrent usage

**4.2. Cross-Browser Testing**
- [ ] Chrome (desktop + mobile)
- [ ] Firefox
- [ ] Safari (desktop + mobile)
- [ ] Edge
- [ ] Test SSE compatibility

**4.3. Mobile Testing**
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive design
- [ ] Touch interactions
- [ ] Performance on low-end devices

#### PHASE 5: User Acceptance Testing (3-5 ngày)

**5.1. Teacher Workflow**
- [ ] Tạo session dễ dàng
- [ ] Import câu hỏi nhanh
- [ ] Điều khiển Live View
- [ ] Xem reports
- [ ] Quản lý students

**5.2. Student Experience**
- [ ] Live View rõ ràng
- [ ] Real-time feedback
- [ ] Notifications
- [ ] Rewards visibility

**5.3. Edge Cases**
- [ ] Network interruption
- [ ] Browser refresh
- [ ] Multiple tabs
- [ ] Concurrent sessions
- [ ] Large classes (100+ students)

### 🚀 KẾ HOẠCH PHÁT TRIỂN THIẾU SÓT

#### PRIORITY 1: Camera Scanning App (CRITICAL)

**Option A: Mobile App (React Native)**
```
Timeline: 2-3 tuần
Tech Stack:
- React Native
- Expo Camera
- OpenCV.js hoặc TensorFlow.js
- ArUco marker detection

Features:
- Camera preview
- Real-time card detection
- Angle/rotation recognition
- Auto-send to API
- Offline queue
```

**Option B: Progressive Web App (PWA)**
```
Timeline: 1-2 tuần
Tech Stack:
- React PWA
- MediaDevices API
- jsQR hoặc ZXing
- Service Workers

Features:
- Camera access via browser
- QR code scanning
- Works on iOS/Android
- No app store needed
```

**Option C: Desktop App (Electron)**
```
Timeline: 1 tuần
Tech Stack:
- Electron
- Node.js
- OpenCV
- USB camera support

Features:
- Desktop camera app
- Better performance
- Easier CV processing
```

**Recommendation**: Option B (PWA) - Fastest, no app store, works everywhere

#### PRIORITY 2: Message Queue (HIGH)

**Implementation Plan**
```typescript
// 1. Add Redis
npm install ioredis bull

// 2. Create queue service
// src/services/queueService.ts
import Queue from 'bull';

export const responseQueue = new Queue('plickers-responses', {
  redis: process.env.REDIS_URL
});

responseQueue.process(async (job) => {
  const { sessionId, questionId, cardNumber, answer } = job.data;
  
  await prisma.plickersResponse.create({
    data: { sessionId, questionId, cardNumber, answer }
  });
});

// 3. Update API to use queue
// app/api/plickers/sessions/[id]/responses/route.ts
await responseQueue.add({
  sessionId, questionId, cardNumber, answer
}, {
  attempts: 3,
  backoff: 1000
});
```

**Benefits**:
- Handle 1000+ concurrent scans
- Retry failed operations
- Better error handling
- Scalable architecture

#### PRIORITY 3: True WebSocket (MEDIUM)

**Implementation Plan**
```typescript
// 1. Add Socket.IO
npm install socket.io

// 2. Create WebSocket server
// app/api/socket/route.ts
import { Server } from 'socket.io';

export function GET(req: Request) {
  const io = new Server(server);
  
  io.on('connection', (socket) => {
    socket.on('join-session', (sessionId) => {
      socket.join(`session-${sessionId}`);
    });
  });
}

// 3. Emit events
io.to(`session-${sessionId}`).emit('response-added', data);
```

**Benefits**:
- True bi-directional communication
- Instant updates (no 1.5s delay)
- Lower bandwidth
- Better scalability

#### PRIORITY 4: Export Features (MEDIUM)

**Implementation Plan**
```typescript
// 1. Add libraries
npm install exceljs jspdf

// 2. Create export service
// src/services/exportService.ts
export async function exportToExcel(sessionId: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Results');
  
  // Add data
  worksheet.columns = [
    { header: 'Student', key: 'student' },
    { header: 'Score', key: 'score' },
    { header: 'Correct', key: 'correct' }
  ];
  
  return await workbook.xlsx.writeBuffer();
}

// 3. Add API endpoint
// app/api/plickers/sessions/[id]/export/route.ts
export async function GET(req, { params }) {
  const buffer = await exportToExcel(params.id);
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=results.xlsx'
    }
  });
}
```

### 📊 TIMELINE TỔNG THỂ

```
Week 1-2: Testing hiện tại + Bug fixes
Week 3-4: Camera Scanning App (PWA)
Week 5: Message Queue + WebSocket
Week 6: Export Features + Polish
Week 7: Final testing + Documentation
Week 8: Production deployment
```

### ✅ CHECKLIST HOÀN THIỆN

**Must Have (Để production-ready)**
- [x] Database schema
- [x] API endpoints
- [x] Authentication
- [x] Real-time sync (SSE)
- [x] UI/UX
- [x] Gamification
- [x] Tests
- [ ] Camera scanning app
- [ ] Message queue
- [ ] Load testing
- [ ] Security audit

**Should Have (Để competitive)**
- [ ] True WebSocket
- [ ] Export Excel/PDF
- [ ] Offline mode
- [ ] Mobile optimization
- [ ] Advanced analytics
- [ ] Batch operations

**Nice to Have (Future)**
- [ ] AI question suggestions
- [ ] Voice commands
- [ ] Multi-language
- [ ] Accessibility features
- [ ] Integration với LMS khác

---

