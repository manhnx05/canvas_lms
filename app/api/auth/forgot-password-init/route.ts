import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import prisma from '@/src/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'Email không tồn tại trong hệ thống!' }, { status: 404 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({ where: { email }, data: { otp } });

    if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Canvas LMS <onboarding@resend.dev>',
            to: [email],
            subject: 'Mã khôi phục mật khẩu Canvas LMS',
            html: `<p>Mã OTP khôi phục mật khẩu của bạn là: <strong style="font-size: 24px;">${otp}</strong></p>`
        });
    }

    return NextResponse.json({ message: 'Mã khôi phục đã được gửi.' });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi gửi yêu cầu khôi phục' }, { status: 500 });
  }
}
