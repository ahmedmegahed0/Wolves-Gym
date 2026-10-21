import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RegisterForm = ({ onSwitchToLogin }) => {
  const { register, loading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'برجاء كتابة الاسم بالكامل';
    } else if (formData.name.trim().length < 3) {
      errs.name = 'الاسم يجب أن لا يقل عن 3 حروف';
    }

    if (!formData.email.trim()) {
      errs.email = 'برجاء إدخال البريد الإلكتروني';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errs.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }

    if (!formData.phoneNumber.trim()) {
      errs.phoneNumber = 'برجاء إدخال رقم التليفون';
    } else if (formData.phoneNumber.trim().length < 10) {
      errs.phoneNumber = 'رقم التليفون يجب أن لا يقل عن 10 أرقام';
    }

    if (!formData.password) {
      errs.password = 'برجاء تحديد كلمة المرور';
    } else if (formData.password.length < 8) {
      errs.password = 'كلمة المرور يجب أن لا تقل عن 8 أحرف';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'برجاء تأكيد كلمة المرور';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await register(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 font-cairo" noValidate>
      <div className="text-right mb-2">
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          انضم لكتيبة الذئاب
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
            REGISTER
          </span>
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          أنشئ حسابك الجديد وابدأ رحلتك التدريبية معنا
        </p>
      </div>

      {/* Name Input */}
      <div>
        <label className="text-xs font-bold text-zinc-300 block mb-1 text-right">
          الاسم بالكامل (كابتن):
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
            <User className="w-4 h-4 text-amber-400/80" />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="مثال: أحمد مصطفى"
            className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-4 py-2.5 border transition-all focus:outline-none text-right ${
              errors.name
                ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
            }`}
            disabled={loading}
          />
        </div>
        {errors.name && (
          <p className="text-xs text-rose-400 mt-1 text-right font-medium">{errors.name}</p>
        )}
      </div>

      {/* Email Input */}
      <div>
        <label className="text-xs font-bold text-zinc-300 block mb-1 text-right">
          البريد الإلكتروني:
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
            <Mail className="w-4 h-4 text-amber-400/80" />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@wolves.com"
            dir="ltr"
            className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-4 py-2.5 border font-mono tracking-wider transition-all focus:outline-none text-right ${
              errors.email
                ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
            }`}
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-rose-400 mt-1 text-right font-medium">{errors.email}</p>
        )}
      </div>

      {/* Phone Number Input */}
      <div>
        <label className="text-xs font-bold text-zinc-300 block mb-1 text-right">
          رقم التليفون:
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
            <Phone className="w-4 h-4 text-amber-400/80" />
          </div>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="01012345678"
            dir="ltr"
            className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-4 py-2.5 border font-mono tracking-wider transition-all focus:outline-none text-right ${
              errors.phoneNumber
                ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
            }`}
            disabled={loading}
          />
        </div>
        {errors.phoneNumber && (
          <p className="text-xs text-rose-400 mt-1 text-right font-medium">{errors.phoneNumber}</p>
        )}
      </div>

      {/* Password & Confirm Password Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Password */}
        <div>
          <label className="text-xs font-bold text-zinc-300 block mb-1 text-right">
            كلمة المرور (8+ أحرف):
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
              <Lock className="w-4 h-4 text-amber-400/80" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              dir="ltr"
              className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-9 py-2.5 border font-mono tracking-wider transition-all focus:outline-none text-right ${
                errors.password
                  ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                  : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
              }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 hover:text-amber-400"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-400 mt-1 text-right font-medium">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-xs font-bold text-zinc-300 block mb-1 text-right">
            تأكيد كلمة المرور:
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
              <Lock className="w-4 h-4 text-amber-400/80" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              dir="ltr"
              className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-9 py-2.5 border font-mono tracking-wider transition-all focus:outline-none text-right ${
                errors.confirmPassword
                  ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                  : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
              }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 hover:text-amber-400"
            >
              {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[11px] text-rose-400 mt-1 text-right font-medium">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Primary CTA Register Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-500 text-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>جاري إنشاء الحساب وإرسال كود التفعيل...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 text-black" />
              <span>إنشاء الحساب وتأكيد العضوية</span>
            </>
          )}
        </button>
      </div>

      {/* Switch to Login link */}
      <div className="text-center pt-2">
        <p className="text-xs text-zinc-400">
          لديك حساب بالفعل في الجيم؟{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-amber-400 font-bold hover:underline"
          >
            تسجيل الدخول الآن
          </button>
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;
