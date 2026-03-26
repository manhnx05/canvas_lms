# Hướng dẫn cấu hình Resend Email Service

## Bước 1: Tạo tài khoản Resend

1. Truy cập: https://resend.com/
2. Đăng ký tài khoản miễn phí (Free tier: 100 emails/day, 3,000 emails/month)
3. Xác nhận email đăng ký

## Bước 2: Lấy API Key

1. Đăng nhập vào Resend Dashboard: https://resend.com/api-keys
2. Click "Create API Key"
3. Đặt tên cho API key (ví dụ: "Canvas LMS Development")
4. Chọn quyền: "Sending access"
5. Click "Add" và copy API key (bắt đầu với `re_`)

## Bước 3: Cấu hình trong dự án

### Development (Môi trường phát triển)

Thêm vào file `.env`:

```env
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="onboarding@resend.dev"
```

**Lưu ý:** Với tài khoản miễn phí, bạn chỉ có thể gửi email đến địa chỉ email đã đăng ký tài khoản Resend.

**Ví dụ:** Nếu bạn đăng ký Resend với email `nguyenxuanmanh918@gmail.com`, thì chỉ email này mới nhận được OTP khi test. Để gửi đến bất kỳ email nào, bạn cần verify domain (xem phần Production bên dưới).

### Production (Môi trường production)

1. **Verify Domain (Xác thực tên miền):**
   - Vào Resend Dashboard > Domains
   - Click "Add Domain"
   - Nhập tên miền của bạn (ví dụ: `yourdomain.com`)
   - Thêm các DNS records theo hướng dẫn:
     - SPF record
     - DKIM record
     - DMARC record (optional)
   - Đợi xác thực (có thể mất vài phút đến vài giờ)

2. **Cập nhật .env:**

```env
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

## Bước 4: Test gửi email

1. Khởi động lại server:
```bash
npm run dev
```

2. Thử đăng ký tài khoản mới với email của bạn
3. Kiểm tra console log để xem thông báo gửi email
4. Kiểm tra hộp thư (inbox hoặc spam folder)

## Troubleshooting (Xử lý lỗi)

### Lỗi: "API key not found"
- Kiểm tra lại API key trong file `.env`
- Đảm bảo không có khoảng trắng thừa
- API key phải bắt đầu bằng `re_`

### Lỗi: "Email not verified"
- Trong development: Chỉ gửi được đến email đã đăng ký Resend
- Trong production: Phải verify domain trước

### Lỗi: "Rate limit exceeded"
- Free tier: 100 emails/day, 3,000 emails/month
- Nâng cấp lên paid plan nếu cần gửi nhiều hơn

### Email không đến hộp thư
1. Kiểm tra spam folder
2. Kiểm tra console log xem có lỗi không
3. Vào Resend Dashboard > Logs để xem trạng thái email
4. Đảm bảo domain đã được verify (production)

## Giới hạn Free Tier

- **100 emails/day**
- **3,000 emails/month**
- Chỉ gửi đến email đã verify (development)
- Cần verify domain để gửi đến bất kỳ email nào (production)

## Nâng cấp (Optional)

Nếu cần gửi nhiều email hơn:
- Pro Plan: $20/month - 50,000 emails/month
- Business Plan: Custom pricing

## Tài liệu tham khảo

- Resend Documentation: https://resend.com/docs
- API Reference: https://resend.com/docs/api-reference
- Domain Verification: https://resend.com/docs/dashboard/domains/introduction
- Node.js SDK: https://resend.com/docs/send-with-nodejs

## Kiểm tra cấu hình

Sau khi cấu hình xong, bạn có thể test bằng cách:

1. Mở browser console khi đăng ký
2. Xem server logs trong terminal
3. Kiểm tra Resend Dashboard > Logs

Nếu thấy log `✅ Đã gửi OTP thành công qua Resend` thì đã cấu hình đúng!
