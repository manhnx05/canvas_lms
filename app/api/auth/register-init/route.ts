import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/src/lib/prisma';
import { Resend } from 'resend';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    // Validate email format
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email không hợp lệ!' }, { status: 400 });
    }
    
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists && exists.otp === null) {
      return NextResponse.json({ error: 'Email đã được sử dụng!' }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tempPassword = await bcrypt.hash(Math.random().toString(), 10);
    
    await prisma.user.upsert({
      where: { email },
      update: { otp },
      create: {
        email,
        name: email.split('@')[0],
        role: 'student',
        password: tempPassword,
        otp,
        className: 'Lớp Tự Do'
      }
    });

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[Register] RESEND_API_KEY không được cấu hình!');
      return NextResponse.json({ 
        message: 'Mã OTP đã được tạo. (Email service chưa được cấu hình)',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      });
    }

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: `Canvas LMS <${FROM_EMAIL}>`,
        to: [email],
        subject: 'Mã xác nhận Đăng ký Canvas LMS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">Canvas LMS - Xác nhận đăng ký</h2>
            <p>Chào bạn,</p>
            <p>Mã OTP đăng ký tài khoản của bạn là:</p>
            <div style="background-color: #f0f9ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <strong style="font-size: 32px; color: #0ea5e9; letter-spacing: 4px;">${otp}</strong>
            </div>
            <p>Mã này sẽ hết hiệu lực sau 10 phút.</p>
            <p>Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">Canvas LMS - Hệ thống quản lý học tập</p>
          </div>
        `
      });
      
      if (error) {
        console.error('[Register] Lỗi từ Resend API:', JSON.stringify(error, null, 2));
        return NextResponse.json({ 
          error: 'Không thể gửi email. Vui lòng kiểm tra lại địa chỉ email.',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
        emailId: data?.id
      });
      
    } catch (mailError: any) {
      console.error('[Register] ❌ Lỗi kết nối Resend API:', mailError);
      console.error('[Register] Chi tiết lỗi:', mailError.message);
      return NextResponse.json({ 
        error: 'Lỗi kết nối dịch vụ email. Vui lòng thử lại sau.',
        details: process.env.NODE_ENV === 'development' ? mailError.message : undefined
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Register] Lỗi tổng quát:', error);
    return NextResponse.json({ 
      error: 'Lỗi gửi yêu cầu đăng ký',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
