import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/src/lib/prisma';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
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

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
          from: 'Canvas LMS <onboarding@resend.dev>',
          to: [email],
          subject: 'Mã xác nhận Đăng ký Canvas LMS',
          html: `<p>Mã OTP đăng ký tài khoản của bạn là: <strong style="font-size: 24px;">${otp}</strong></p>`
        });
        if (error) {
          console.error('[Register] Lỗi từ Resend API:', JSON.stringify(error));
        } else {
          console.log('[Register] Đã gửi OTP thành công qua Resend:', data);
        }
      } catch (mailError) {
        console.error('[Register] Lỗi kết nối Resend API:', mailError);
      }
    }

    return NextResponse.json({ message: 'Mã OTP đã được gửi đến email.' });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi gửi yêu cầu đăng ký' }, { status: 500 });
  }
}
