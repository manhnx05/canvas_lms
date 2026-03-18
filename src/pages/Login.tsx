import React, { useState } from 'react';

type FlowState = 'LOGIN' | 'REGISTER_INIT' | 'REGISTER_CONFIRM' | 'FORGOT_INIT' | 'FORGOT_CONFIRM';

export function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [flow, setFlow] = useState<FlowState>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleError = (err: any) => setError(err.message || 'Có lỗi xảy ra');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.user);
    } catch (err: any) { handleError(err); }
    finally { setLoading(false); }
  };

  const handleRegisterInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg(data.message);
      setFlow('REGISTER_CONFIRM');
    } catch (err: any) { handleError(err); }
    finally { setLoading(false); }
  };

  const handleRegisterConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/register/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password, name, role: 'student' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.user);
    } catch (err: any) { handleError(err); }
    finally { setLoading(false); }
  };

  const handleForgotInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg(data.message);
      setFlow('FORGOT_CONFIRM');
    } catch (err: any) { handleError(err); }
    finally { setLoading(false); }
  };

  const handleForgotConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/forgot-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg(data.message);
      setFlow('LOGIN');
      setPassword('');
      setOtp('');
    } catch (err: any) { handleError(err); }
    finally { setLoading(false); }
  };

  const renderForm = () => {
    switch (flow) {
      case 'LOGIN':
        return (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500" placeholder="vidu@gmail.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500" placeholder="••••••••" />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => { setFlow('FORGOT_INIT'); setError(''); setSuccessMsg(''); setPassword(''); setOtp(''); }} className="text-sm font-medium text-sky-600 hover:text-sky-800">Quên mật khẩu?</button>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-4 shadow-lg shadow-sky-500/30 hover:opacity-90">{loading ? 'Đang xử lý...' : 'Đăng Nhập'}</button>
            <div className="text-center mt-4">
              <span className="text-sm text-slate-500">Chưa có tài khoản? </span>
              <button type="button" onClick={() => { setFlow('REGISTER_INIT'); setError(''); setSuccessMsg(''); setPassword(''); setOtp(''); }} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Đăng ký ngay</button>
            </div>
          </form>
        );
      case 'REGISTER_INIT':
        return (
          <form onSubmit={handleRegisterInit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email đăng ký</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500" placeholder="vidu@gmail.com" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 shadow-lg shadow-sky-500/30 hover:opacity-90">{loading ? 'Đang xử lý...' : 'Nhận mã xác nhận (OTP)'}</button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => setFlow('LOGIN')} className="text-sm font-medium text-slate-500 hover:text-slate-800">Quay lại Đăng nhập</button>
            </div>
          </form>
        );
      case 'REGISTER_CONFIRM':
        return (
          <form onSubmit={handleRegisterConfirm} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mã xác nhận OTP (từ email)</label>
              <input type="text" required maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500 text-center tracking-widest font-mono text-lg" placeholder="123456" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và tên</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tạo mật khẩu</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 shadow-lg shadow-emerald-500/30 hover:bg-emerald-600">{loading ? 'Đang xử lý...' : 'Hoàn tất Đăng ký'}</button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => setFlow('REGISTER_INIT')} className="text-sm font-medium text-slate-500 hover:text-slate-800">Quay lại</button>
            </div>
          </form>
        );
      case 'FORGOT_INIT':
        return (
          <form onSubmit={handleForgotInit} className="space-y-4">
             <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nhập Email cần khôi phục</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500" placeholder="vidu@gmail.com" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-rose-400 to-rose-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 shadow-lg shadow-rose-500/30 hover:opacity-90">{loading ? 'Đang tìm...' : 'Gửi mã khôi phục'}</button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => setFlow('LOGIN')} className="text-sm font-medium text-slate-500 hover:text-slate-800">Quay lại Đăng nhập</button>
            </div>
          </form>
        );
      case 'FORGOT_CONFIRM':
        return (
          <form onSubmit={handleForgotConfirm} className="space-y-4">
             <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mã xác nhận OTP</label>
              <input type="text" required maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500 text-center tracking-widest font-mono text-lg" placeholder="123456" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu mới</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-rose-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 shadow-lg shadow-rose-500/30 hover:bg-rose-600">{loading ? 'Đang xử lý...' : 'Xác nhận Đổi mật khẩu'}</button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 transition-all duration-300">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-sky-500/30 mb-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => setFlow('LOGIN')}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">LớpHọc<span className="text-amber-500">Vui</span></h1>
          <p className="text-slate-500 text-sm mt-1">Nền tảng Quản lý Học tập Trực tuyến</p>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm border flex items-center">{error}</div>}
        {successMsg && <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl mb-6 text-sm border flex items-center">{successMsg}</div>}

        {renderForm()}
      </div>
    </div>
  );
}
