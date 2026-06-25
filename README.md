# Canvas LMS

Hệ thống Quản lý Học tập (Learning Management System) hiện đại tích hợp Trí tuệ Nhân tạo (AI), được lấy cảm hứng từ Canvas. Hệ thống cung cấp giải pháp toàn diện cho việc giảng dạy, học tập và đánh giá tự động.

## Công nghệ sử dụng

- **Frontend:** Next.js (App Router), React 19, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL
- **AI Integration:** Google Gemini 1.5 Pro (Vision & Text)
- **Kiểm thử (Testing):** Vitest (Unit/Integration Test), Playwright (E2E Test)

## Các tính năng chính

1. **Quản lý Học tập và Giảng dạy:**
   - Quản lý khóa học, bài tập, học sinh và giáo viên.
   - Phân quyền người dùng (Role-based access control).
   - Hệ thống thông báo và nhắn tin nội bộ (Inbox).
   - Hệ thống phần thưởng và điểm danh (Gamification/Rewards).

2. **Tích hợp Trí tuệ Nhân tạo (AI):**
   - **Tạo đề thi tự động:** AI sinh câu hỏi dựa trên nội dung bài học.
   - **Chấm bài tự động (AI Grading):** Quét ảnh chụp phiếu bài tập của học sinh, nhận diện chữ viết tay và chấm điểm theo khung năng lực chuẩn. Tự động đưa ra nhận xét chi tiết và lưu trữ phiên chấm điểm.
   - **Trợ lý học tập (AI Chat):** Hỗ trợ giải đáp thắc mắc cho giáo viên và học sinh.

## Hướng dẫn cài đặt

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Cấu hình môi trường:**
   Tạo file `.env` từ `.env.example` và điền các thông số cần thiết:
   - `DATABASE_URL` (Chuỗi kết nối PostgreSQL)
   - `JWT_SECRET` (Khóa bí mật cho Authentication)
   - `GEMINI_API_KEY` (Khóa API của Google Gemini)
   
3. **Khởi tạo Cơ sở dữ liệu:**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. **Khởi động ứng dụng:**
   ```bash
   npm run dev
   ```
   Truy cập ứng dụng tại địa chỉ: `http://localhost:3000`

## Lệnh kiểm thử (Testing)

Dự án được thiết lập hệ thống kiểm thử tự động chặt chẽ với hàng trăm kịch bản kiểm thử:

- **Chạy Unit và Integration Tests:**
  ```bash
  npm run test
  ```
- **Chạy Unit Tests và xuất báo cáo độ bao phủ (Coverage Report):**
  ```bash
  npm run test:coverage
  ```
  *(Báo cáo định dạng HTML sẽ được tạo tự động tại `coverage/index.html`)*
- **Chạy End-to-End Tests (Kiểm thử luồng người dùng thực tế):**
  ```bash
  npm run test:e2e
  ```

## Cấu trúc thư mục cốt lõi

- `app/api/`: Các endpoint API của hệ thống (RESTful).
- `src/components/`: Các thành phần giao diện React dùng chung (Components).
- `src/features/`: Các luồng giao diện chia theo tính năng (Course, Assignments...).
- `src/services/`: Lớp xử lý nghiệp vụ (Business Logic) và tương tác CSDL.
- `src/middleware/`: Xử lý xác thực (Auth) và giới hạn truy cập (Rate Limit).
- `src/**/__tests__/`: Các file Unit Test đi kèm với từng tính năng.
- `e2e/`: Chứa các kịch bản kiểm thử Playwright.
- `prisma/`: Định nghĩa lược đồ CSDL và dữ liệu mẫu (Seed).

---
