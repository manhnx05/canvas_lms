# Canvas LMS

## Giới thiệu dự án

Canvas LMS là một hệ thống quản lý học tập (Learning Management System) được tích hợp trí tuệ nhân tạo (AI), lấy cảm hứng từ hệ thống Canvas. Dự án kết hợp giao diện người dùng hiện đại cùng với các tính năng vượt trội như: quản lý khóa học, tạo đề thi tự động, chấm bài thông minh và hỗ trợ AI chat nhằm nâng cao trải nghiệm giảng dạy và học tập.

Công nghệ sử dụng chính:
- Frontend: React 19, Next.js, Tailwind CSS.
- Backend: Next.js API Routes, Prisma ORM, PostgreSQL.
- AI Integration: Google Generative AI (Gemini).

## Các loại kiểm thử (Testing Strategy)

Để đảm bảo chất lượng và tính ổn định của hệ thống, Canvas LMS áp dụng chiến lược kiểm thử toàn diện với nhiều tầng khác nhau:

1. Unit Testing và Integration Testing
Sử dụng Vitest và React Testing Library để kiểm tra tính đúng đắn của các hàm (functions), hooks, component UI độc lập, và các services tương tác với cơ sở dữ liệu.

2. End-to-End (E2E) Testing
Sử dụng Playwright để mô phỏng lại toàn bộ luồng người dùng thực tế trên trình duyệt. Các kịch bản E2E bao gồm luồng đăng nhập, điều hướng khóa học, nộp bài tập và hoàn thành bài kiểm tra.

3. API Testing
Sử dụng Postman và Newman để kiểm thử các endpoint API. Đảm bảo dữ liệu đầu ra, đầu vào, cấu trúc phản hồi và các lớp bảo mật (JWT, Rate Limiting) hoạt động chính xác.

4. Performance và Load Testing
Sử dụng Apache JMeter để kiểm tra hiệu năng của hệ thống khi có tải tăng đột biến (Spike Test). Kịch bản chủ yếu tập trung vào các chức năng cốt lõi có lượng truy cập đồng thời cao như Đăng nhập hoặc Nộp bài.

## Cách chạy kiểm thử (How to Run Tests)

Trước khi chạy bất kỳ bài kiểm thử nào, hãy đảm bảo bạn đã cài đặt đầy đủ các thư viện phụ thuộc bằng lệnh `npm install` và đã cấu hình biến môi trường trong file `.env` chính xác.

### 1. Chạy Unit Test và Integration Test (Vitest)

Chạy tất cả các unit tests:
```bash
npm test
```

Chạy tests ở chế độ theo dõi (watch mode):
```bash
npm run test:watch
```

Chạy tests và xuất báo cáo độ phủ mã nguồn (coverage report):
```bash
npm run test:coverage
```

### 2. Chạy End-to-End Test (Playwright)

Chạy toàn bộ E2E tests ở chế độ ẩn (headless):
```bash
npm run test:e2e
```

Chạy E2E tests với giao diện trình duyệt để dễ dàng theo dõi và gỡ lỗi:
```bash
npm run test:e2e:ui
```

### 3. Chạy API Test (Postman/Newman)

Sử dụng lệnh Newman để chạy kịch bản kiểm thử tự động trên terminal:
```bash
npx newman run CanvasLMS_Postman_Collection.json -e .postman/Local_Environment.json
```

### 4. Chạy Performance Test (JMeter)

Khởi động server của ứng dụng trước:
```bash
npm run dev
```

Mở terminal mới, di chuyển vào thư mục scripts và chạy file thực thi:
```cmd
cd scripts
run_jmeter_test.bat
```

Kết quả báo cáo hiệu năng (HTML Report) sẽ được tự động xuất ra thư mục `scripts/jmeter_html_report`. Bạn có thể mở file `index.html` trong thư mục này bằng trình duyệt để xem các biểu đồ chi tiết.
