import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import prisma from '@/src/lib/prisma';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'Email không tồn tại trong hệ thống!' }, { status: 404 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({ where: { email }, data: { otp } });

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
            from: `Canvas LMS <${FROM_EMAIL}>`,
            to: [email],
            subject: 'Mã khôi phục mật khẩu Canvas LMS',
            html: `<p>Mã OTP khôi phục mật khẩu của bạn là: <strong style="font-size: 24px;">${otp}</strong></p>`
        });
        if (error) {
          console.error('[Forgot Password] Lỗi từ Resend API:', JSON.stringify(error));
        } else {
          console.log('[Forgot Password] Đã gửi OTP thành công qua Resend:', data);
        }
      } catch (mailError) {
        console.error('[Forgot Password] Lỗi kết nối Resend API:', mailError);
      }
    }

    return NextResponse.json({ message: 'Mã khôi phục đã được gửi.' });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi gửi yêu cầu khôi phục' }, { status: 500 });
  }
}
