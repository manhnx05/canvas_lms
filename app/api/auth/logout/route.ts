import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Đăng xuất thành công' });
  
  // Clear the auth cookie by setting it to expire immediately
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/',
  });

  return response;
}
