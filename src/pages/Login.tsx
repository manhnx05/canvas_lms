import React, { useState } from 'react';

export function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-sky-500/30 mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">Canvas LMS</h1>
          <p className="text-slate-500 mt-2">Nền tảng học tập trực tuyến</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Đăng Nhập</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="vidu@gmail.com"
                className="w-full px-5 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-sky-500/30 disabled:opacity-50"
            >
              {loading ? 'Đang gửi mã...' : 'Tiếp tục'}
            </button>
            <div className="text-center text-sm text-slate-500">
              Mã xác nhận (OTP) sẽ được gửi đến email của bạn qua hệ thống Resend.
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mã Xác Nhận (OTP)</label>
              <input 
                type="text" 
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                placeholder="123456"
                maxLength={6}
                className="w-full px-5 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all text-center tracking-[0.5em] font-mono text-xl"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-sky-500/30 disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
            </button>
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sky-600 font-semibold text-sm hover:underline"
            >
              Quay lại dùng Email khác
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
