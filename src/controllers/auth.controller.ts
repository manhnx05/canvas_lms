import { Request, Response } from 'express';
import { Resend } from 'resend';
import prisma from '../lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const login = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Tài khoản Email không tồn tại trong hệ thống!' });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to DB
    await prisma.user.update({
      where: { email },
      data: { otp }
    });

    // Send email via Resend
    await resend.emails.send({
      from: 'Canvas LMS <onboarding@resend.dev>',
      to: [email],
      subject: 'Mã xác nhận đăng nhập Canvas LMS',
      html: `<p>Xin chào ${user.name},</p><p>Mã OTP đăng nhập của bạn là: <strong style="font-size: 24px;">${otp}</strong></p><p>Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>`
    });

    res.json({ message: 'Mã OTP đã được gửi đến email của bạn.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi hệ thống khi gửi email xác nhận' });
  }
};

export const verify = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otp !== otp) return res.status(401).json({ error: 'Mã OTP không chính xác!' });

    // Clear OTP and map login response
    const loggedInUser = await prisma.user.update({
      where: { email },
      data: { otp: null }
    });

    res.json({
      message: 'Đăng nhập thành công!',
      user: {
        id: loggedInUser.id,
        name: loggedInUser.name,
        email: loggedInUser.email,
        role: loggedInUser.role,
        avatar: loggedInUser.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi kiểm tra mã xác nhận' });
  }
};
