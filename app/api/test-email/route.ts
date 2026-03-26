import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Vui lòng cung cấp email để test' 
      }, { status: 400 });
    }

    // Check environment variables
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    console.log('=== TEST EMAIL CONFIGURATION ===');
    console.log('RESEND_API_KEY exists:', !!apiKey);
    console.log('RESEND_API_KEY length:', apiKey?.length || 0);
    console.log('RESEND_API_KEY starts with re_:', apiKey?.startsWith('re_'));
    console.log('FROM_EMAIL:', fromEmail);
    console.log('TO_EMAIL:', email);
    console.log('================================');

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'RESEND_API_KEY không được cấu hình trong file .env',
        hint: 'Vui lòng thêm RESEND_API_KEY vào file .env và khởi động lại server'
      }, { status: 500 });
    }

    if (!apiKey.startsWith('re_')) {
      return NextResponse.json({ 
        error: 'RESEND_API_KEY không hợp lệ (phải bắt đầu với "re_")',
        hint: 'Kiểm tra lại API key từ https://resend.com/api-keys'
      }, { status: 500 });
    }

    // Initialize Resend
    const resend = new Resend(apiKey);
    
    // Generate test OTP
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log('Đang gửi test email...');
    console.log('Test OTP:', testOTP);

    // Send test email
    const { data, error } = await resend.emails.send({
      from: `Canvas LMS Test <${fromEmail}>`,
      to: [email],
      subject: '🧪 Test Email - Canvas LMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🧪 Test Email</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Canvas LMS Email Service</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              ✅ <strong>Email service đang hoạt động tốt!</strong>
            </p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <p style="margin: 0 0 10px 0; color: #0369a1; font-weight: bold;">Test OTP Code:</p>
              <div style="text-align: center; font-size: 36px; font-weight: bold; color: #0ea5e9; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${testOTP}
              </div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <strong>Thông tin kỹ thuật:</strong><br>
                📧 Gửi từ: ${fromEmail}<br>
                📬 Gửi đến: ${email}<br>
                ⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}<br>
                🔑 API: Resend
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Nếu bạn nhận được email này, có nghĩa là cấu hình Resend đã hoạt động chính xác! 🎉
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Canvas LMS - AI-Powered Learning Management System<br>
              Đây là email test tự động
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('❌ Lỗi từ Resend API:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Không thể gửi email',
        details: error,
        troubleshooting: {
          message: 'Kiểm tra các vấn đề sau:',
          checks: [
            'API key có đúng không? (phải bắt đầu với re_)',
            'Email nhận có được verify trong Resend không? (với free tier)',
            'Domain có được verify không? (nếu dùng custom domain)',
            'Đã hết quota chưa? (free: 100 emails/day)'
          ]
        }
      }, { status: 500 });
    }

    console.log('✅ Gửi email thành công!');
    console.log('Email ID:', data?.id);

    return NextResponse.json({ 
      success: true,
      message: '✅ Email đã được gửi thành công!',
      data: {
        emailId: data?.id,
        from: fromEmail,
        to: email,
        testOTP: testOTP,
        timestamp: new Date().toISOString()
      },
      nextSteps: [
        '1. Kiểm tra hộp thư của bạn (inbox hoặc spam)',
        '2. Nếu không thấy email, kiểm tra Resend Dashboard > Logs',
        '3. Với free tier, chỉ gửi được đến email đã đăng ký Resend'
      ]
    });

  } catch (error: any) {
    console.error('❌ Lỗi nghiêm trọng:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Lỗi hệ thống',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Email API',
    usage: 'POST /api/test-email với body: { "email": "your@email.com" }',
    example: {
      method: 'POST',
      body: {
        email: 'test@example.com'
      }
    }
  });
}
