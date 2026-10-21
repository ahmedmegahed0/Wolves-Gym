import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginForm = ({ onSwitchToRegister }) => {
  const { login, setActiveAuthView, googleLogin, loading } = useAuth();
  const { error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email || !email.trim()) {
      errs.email = 'أدخل البريد الإلكتروني';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errs.email = 'صيغة البريد غير صحيحة';
    }

    if (!password) {
      errs.password = 'أدخل كلمة المرور';
    } else if (password.length < 6) {
      errs.password = 'كلمة المرور أقل من 6 أحرف';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await login({ email, password });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (credentialResponse?.credential) {
      await googleLogin(credentialResponse.credential);
    } else {
      toastError('فشل الدخول بـ Google', 'لم يتم استلام رمز التحقق.');
    }
  };

  const handleGoogleError = () => {
    toastError('فشل Google', 'تعذر الاتصال بـ Google. حاول مرة أخرى.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-cairo" noValidate>
      {/* Email */}
      <div>
        <label className="text-[13px] font-semibold text-zinc-400 block mb-1.5 text-right">
          البريد الإلكتروني
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <Mail className="w-[18px] h-[18px] text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            }}
            placeholder="example@wolves.com"
            dir="ltr"
            className={`w-full bg-zinc-900/60 text-white placeholder-zinc-600 text-sm rounded-xl pr-10 pl-4 py-3 border transition-all focus:outline-none text-right font-mono tracking-wide ${
              errors.email
                ? 'border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30'
                : 'border-zinc-800/60 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 hover:border-zinc-700'
            }`}
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-[11px] text-rose-400 mt-1 text-right">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <button
            type="button"
            onClick={() => setActiveAuthView('forgot-password')}
            className="text-[11px] text-zinc-500 hover:text-amber-400 transition-colors"
          >
            نسيت كلمة المرور؟
          </button>
          <label className="text-[13px] font-semibold text-zinc-400">
            كلمة المرور
          </label>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <Lock className="w-[18px] h-[18px] text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
            }}
            placeholder="••••••••"
            dir="ltr"
            className={`w-full bg-zinc-900/60 text-white placeholder-zinc-600 text-sm rounded-xl pr-10 pl-11 py-3 border transition-all focus:outline-none text-right font-mono tracking-wider ${
              errors.password
                ? 'border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30'
                : 'border-zinc-800/60 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 hover:border-zinc-700'
            }`}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-600 hover:text-amber-400 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[11px] text-rose-400 mt-1 text-right">{errors.password}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري الدخول...</span>
          </>
        ) : (
          <>
            <ArrowLeft className="w-4 h-4" />
            <span>تسجيل الدخول</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800/50" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-zinc-950/80 px-3 text-[11px] text-zinc-600">
            أو
          </span>
        </div>
      </div>

      {/* Google OAuth */}
      <div className="w-full flex justify-center">
        <div className="w-full flex justify-center overflow-hidden rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-colors p-0.5 bg-zinc-900/30">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_black"
            shape="pill"
            size="large"
            text="continue_with"
            locale="ar"
            width="340"
          />
        </div>
      </div>

      {/* Switch to Register */}
      <p className="text-center text-[12px] text-zinc-500 pt-1">
        معندكش حساب؟{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-amber-400 font-bold hover:text-amber-300 transition-colors"
        >
          سجّل دلوقتي
        </button>
      </p>
    </form>
  );
};

export default LoginForm;
