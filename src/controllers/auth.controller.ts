import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY!);

// 1. Password Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Tài khoản không tồn tại!' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Mật khẩu không chính xác!' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'canvas_secret_key', { expiresIn: '7d' });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xử lý đăng nhập' });
  }
};

// 2. Register Init (Send OTP)
export const registerInit = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    // Check if user already registered and HAS a non-dummy password (i.e. they finished setting up).
    // Or just check if they exist and don't have an active OTP mapping to a dummy state.
    const exists = await prisma.user.findUnique({ where: { email } });
    // If they exist and have no OTP, it means they are fully registered.
    if (exists && exists.otp === null) return res.status(400).json({ error: 'Email đã được sử dụng!' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tempPassword = await bcrypt.hash(Math.random().toString(), 10);
    
    // Upsert to handle both strictly new user and user who requested OTP but didn't finish
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

    await resend.emails.send({
      from: 'Canvas LMS <onboarding@resend.dev>',
      to: [email],
      subject: 'Mã xác nhận Đăng ký Canvas LMS',
      html: `<p>Mã OTP đăng ký tài khoản của bạn là: <strong style="font-size: 24px;">${otp}</strong></p>`
    });

    res.json({ message: 'Mã OTP đã được gửi đến email.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi gửi yêu cầu đăng ký' });
  }
};

// 3. Register Confirm
export const registerConfirm = async (req: Request, res: Response) => {
  try {
    const { email, otp, password, name, role } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otp !== otp) return res.status(401).json({ error: 'Mã OTP không hợp lệ!' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, otp: null, name: name || user.name, role: role || user.role }
    });

    const token = jwt.sign({ id: updated.id, role: updated.role }, process.env.JWT_SECRET || 'canvas_secret_key', { expiresIn: '7d' });

    res.json({ 
      message: 'Đăng ký thành công!', 
      token,
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, avatar: updated.avatar }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xác nhận đăng ký' });
  }
};

// 4. Forgot Password Init
export const forgotPasswordInit = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Email không tồn tại trong hệ thống!' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({ where: { email }, data: { otp } });

    await resend.emails.send({
      from: 'Canvas LMS <onboarding@resend.dev>',
      to: [email],
      subject: 'Mã khôi phục mật khẩu Canvas LMS',
      html: `<p>Mã OTP khôi phục mật khẩu của bạn là: <strong style="font-size: 24px;">${otp}</strong></p>`
    });

    res.json({ message: 'Mã khôi phục đã được gửi.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi gửi yêu cầu khôi phục' });
  }
};

// 5. Forgot Password Confirm
export const forgotPasswordConfirm = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otp !== otp) return res.status(401).json({ error: 'Mã OTP không hợp lệ!' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, otp: null }
    });

    res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xác nhận đổi mật khẩu' });
  }
};

// 6. Update Profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { email, name, avatar, className } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    const updated = await prisma.user.update({
      where: { email },
      data: { name, avatar, className }
    });

    res.json({
      message: 'Cập nhật thành công',
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, avatar: updated.avatar, className: updated.className }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật hồ sơ' });
  }
};
