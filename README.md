# Canvas LMS

## Giới thiệu dự án

Canvas LMS là một hệ thống quản lý học tập (Learning Management System) hiện đại tích hợp Trí tuệ Nhân tạo (AI), được lấy cảm hứng từ hệ thống Canvas gốc. Hệ thống cung cấp giải pháp toàn diện cho việc giảng dạy, học tập và đánh giá tự động.

Công nghệ sử dụng chính:
- Frontend: Next.js (App Router), React 19, Tailwind CSS.
- Backend: Next.js API Routes, Prisma ORM, PostgreSQL.
- AI Integration: Google Gemini 1.5 Pro (Vision & Text).

## Các tính năng chính

1. Quản lý Học tập và Giảng dạy:
   - Quản lý khóa học, bài tập, học sinh và giáo viên.
   - Phân quyền người dùng (Role-based access control).
   - Hệ thống thông báo và nhắn tin nội bộ.
   - Hệ thống phần thưởng và điểm danh.

2. Tích hợp Trí tuệ Nhân tạo (AI):
   - Tạo đề thi tự động: AI sinh câu hỏi dựa trên nội dung bài học.
   - Chấm bài tự động (AI Grading): Quét ảnh chụp phiếu bài tập của học sinh, nhận diện chữ viết tay và chấm điểm.
   - Trợ lý học tập (AI Chat): Hỗ trợ giải đáp thắc mắc cho giáo viên và học sinh.

## Hướng dẫn cài đặt

1. Cài đặt thư viện:
```bash
npm install
```

2. Cấu hình môi trường:
Tạo file `.env` từ `.env.example` và điền các thông số cần thiết:
- `DATABASE_URL` (Chuỗi kết nối PostgreSQL)
- `JWT_SECRET` (Khóa bí mật cho Authentication)
- `GEMINI_API_KEY` (Khóa API của Google Gemini)

3. Khởi tạo Cơ sở dữ liệu:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

4. Khởi động ứng dụng:
```bash
npm run dev
```

## Các loại kiểm thử (Testing Strategy)

Để đảm bảo chất lượng và tính ổn định của hệ thống, Canvas LMS áp dụng chiến lược kiểm thử toàn diện với nhiều tầng khác nhau:

1. Unit Testing và Integration Testing
Sử dụng Vitest và React Testing Library để kiểm tra tính đúng đắn của các hàm, hooks, component UI độc lập, và các services tương tác với cơ sở dữ liệu.

2. End-to-End (E2E) Testing
Sử dụng Playwright để mô phỏng lại toàn bộ luồng người dùng thực tế trên trình duyệt. Các kịch bản E2E bao gồm luồng đăng nhập, điều hướng khóa học, nộp bài tập và hoàn thành bài kiểm tra.

3. API Testing
Sử dụng Postman và Newman để kiểm thử các endpoint API. Đảm bảo dữ liệu đầu ra, đầu vào, cấu trúc phản hồi và các lớp bảo mật hoạt động chính xác.

4. Performance và Load Testing
Sử dụng Apache JMeter để kiểm tra hiệu năng của hệ thống khi có tải tăng đột biến (Spike Test). Kịch bản chủ yếu tập trung vào các chức năng cốt lõi có lượng truy cập đồng thời cao như Đăng nhập hoặc Nộp bài.

## Cách chạy kiểm thử (How to Run Tests)

### 1. Chạy Unit Test và Integration Test (Vitest)

Chạy tất cả các unit tests:
```bash
npm test
```

Chạy tests ở chế độ theo dõi (watch mode):
```bash
npm run test:watch
```

Chạy tests và xuất báo cáo độ phủ mã nguồn:
```bash
npm run test:coverage
```

### 2. Chạy End-to-End Test (Playwright)

Chạy toàn bộ E2E tests ở chế độ ẩn:
```bash
npm run test:e2e
```

Chạy E2E tests với giao diện trình duyệt để gỡ lỗi:
```bash
npm run test:e2e:ui
```

### 3. Chạy API Test (Postman/Newman)

Sử dụng lệnh Newman để chạy kịch bản kiểm thử tự động trên terminal:
```bash
npx newman run CanvasLMS_Postman_Collection.json -e .postman/Local_Environment.json
```

### 4. Chạy Performance Test (JMeter)

Khởi động server trước (`npm run dev`), sau đó mở terminal mới chạy script:
```cmd
cd scripts
run_jmeter_test.bat
```

Kết quả báo cáo hiệu năng sẽ tự động xuất ra thư mục `scripts/jmeter_html_report`.

## Cấu trúc thư mục cốt lõi

- `app/api/`: Các endpoint API của hệ thống (RESTful).
- `src/components/`: Các thành phần giao diện React dùng chung.
- `src/features/`: Các luồng giao diện chia theo tính năng.
- `src/services/`: Lớp xử lý nghiệp vụ và tương tác CSDL.
- `src/middleware/`: Xử lý xác thực (Auth) và giới hạn truy cập.
- `src/**/__tests__/`: Các file Unit Test đi kèm với từng tính năng.
- `e2e/`: Chứa các kịch bản kiểm thử Playwright.
- `prisma/`: Định nghĩa lược đồ CSDL và dữ liệu mẫu.
