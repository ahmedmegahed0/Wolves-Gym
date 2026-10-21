import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
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
      errs.email = 'برجاء كتابة البريد الإلكتروني';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errs.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }

    if (!password) {
      errs.password = 'برجاء إدخال كلمة المرور';
    } else if (password.length < 6) {
      errs.password = 'كلمة المرور يجب أن لا تقل عن 6 أحرف';
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
      toastError('فشل الدخول بـ Google', 'لم يتم استلام رمز التحقق من حساب Google.');
    }
  };

  const handleGoogleError = () => {
    toastError(
      'فشل تسجيل الدخول بـ Google',
      'تعذر الاتصال بنافذة Google أو تم إلغاء العملية. يرجى المحاولة مرة أخرى.'
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-cairo" noValidate>
      <div className="text-right mb-2">
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          تسجيل دخول الوحوش
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
            LOGIN
          </span>
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          أدخل بياناتك المسجلة للوصول إلى حسابك ولوحة الجيم
        </p>
      </div>

      {/* Email Input */}
      <div>
        <label className="text-xs font-bold text-zinc-300 block mb-1.5 text-right">
          البريد الإلكتروني:
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
            <Mail className="w-4 h-4 text-amber-400/80" />
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
            className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-4 py-3 border font-mono tracking-wider transition-all focus:outline-none text-right ${
              errors.email
                ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
            }`}
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-rose-400 mt-1 text-right font-medium">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-zinc-300">
            كلمة المرور:
          </label>
          <button
            type="button"
            onClick={() => setActiveAuthView('forgot-password')}
            className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-bold"
          >
            نسيت كلمة المرور؟
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
            <Lock className="w-4 h-4 text-amber-400/80" />
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
            className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-11 py-3 border font-mono tracking-wider transition-all focus:outline-none text-right ${
              errors.password
                ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
            }`}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 hover:text-amber-400 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-rose-400 mt-1 text-right font-medium">
            {errors.password}
          </p>
        )}
      </div>

      {/* Primary CTA Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-500 text-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>جاري التحقق والدخول...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 text-black" />
              <span>تسجيل الدخول للعرين</span>
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-zinc-950 px-3 text-zinc-500 font-bold">
            أو عبر الدخول السريع
          </span>
        </div>
      </div>

      {/* Official Google OAuth Sign-in Popup Component */}
      <div className="w-full flex justify-center py-1">
        <div className="w-full flex justify-center overflow-hidden rounded-2xl border border-zinc-800 hover:border-amber-500/30 transition-colors p-1 bg-black/40">
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

      {/* Switch to Register link */}
      <div className="text-center pt-2">
        <p className="text-xs text-zinc-400">
          لسه معندكش حساب في الجيم؟{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-amber-400 font-bold hover:underline"
          >
            انضم لكتيبة الذئاب الآن
          </button>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
