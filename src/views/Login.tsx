import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import apiClient from '@/src/lib/apiClient';

type FlowState = 'LOGIN' | 'REGISTER_INIT' | 'REGISTER_CONFIRM' | 'FORGOT_INIT' | 'FORGOT_CONFIRM';

export function Login({ onLogin }: { onLogin: (user: any, token: string) => void }) {
  const [flow, setFlow] = useState<FlowState>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleError = (err: any) => {
    console.error("Login Error Handler:", err);
    if (typeof err === 'string') setError(err);
    else if (err?.message) setError(err.message);
    else if (err?.error) setError(err.error);
    else setError('Có lỗi xảy ra');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const token = res.data.token;
      localStorage.setItem('canvas_token', token);
      onLogin(res.data.user, token);
    } catch (err: any) { handleError(err.response?.data || err); }
    finally { setLoading(false); }
  };

  const handleRegisterInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await apiClient.post('/auth/register', { email });
      setSuccessMsg(res.data.message);
      setFlow('REGISTER_CONFIRM');
    } catch (err: any) { handleError(err.response?.data || err); }
    finally { setLoading(false); }
  };

  const handleRegisterConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await apiClient.post('/auth/register/confirm', { email, otp, password, name, role: 'student' });
      const token = res.data.token;
      localStorage.setItem('canvas_token', token);
      onLogin(res.data.user, token);
    } catch (err: any) { handleError(err.response?.data || err); }
    finally { setLoading(false); }
  };

  const handleForgotInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      setSuccessMsg(res.data.message);
      setFlow('FORGOT_CONFIRM');
    } catch (err: any) { handleError(err.response?.data || err); }
    finally { setLoading(false); }
  };

  const handleForgotConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await apiClient.post('/auth/forgot-password/confirm', { email, otp, newPassword: password });
      setSuccessMsg(res.data.message);
      setFlow('LOGIN');
      setPassword('');
      setOtp('');
    } catch (err: any) { handleError(err.response?.data || err); }
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
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 pr-10 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
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
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 pr-10 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
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
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 pr-10 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
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
