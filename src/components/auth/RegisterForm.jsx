import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
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
      errs.name = 'أدخل الاسم';
    } else if (formData.name.trim().length < 3) {
      errs.name = 'الاسم أقل من 3 حروف';
    }

    if (!formData.email.trim()) {
      errs.email = 'أدخل البريد الإلكتروني';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errs.email = 'صيغة البريد غير صحيحة';
    }

    if (!formData.phoneNumber.trim()) {
      errs.phoneNumber = 'أدخل رقم الموبايل';
    } else if (formData.phoneNumber.trim().length < 10) {
      errs.phoneNumber = 'الرقم أقل من 10 أرقام';
    }

    if (!formData.password) {
      errs.password = 'أدخل كلمة المرور';
    } else if (formData.password.length < 8) {
      errs.password = 'أقل من 8 أحرف';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'أكد كلمة المرور';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'غير متطابقة';
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

  const inputClass = (field) =>
    `w-full bg-zinc-900/60 text-white placeholder-zinc-600 text-sm rounded-xl pr-10 pl-4 py-2.5 border transition-all focus:outline-none text-right ${
      errors[field]
        ? 'border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30'
        : 'border-zinc-800/60 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 hover:border-zinc-700'
    }`;

  const passwordInputClass = (field) =>
    `w-full bg-zinc-900/60 text-white placeholder-zinc-600 text-sm rounded-xl pr-10 pl-9 py-2.5 border font-mono tracking-wider transition-all focus:outline-none text-right ${
      errors[field]
        ? 'border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30'
        : 'border-zinc-800/60 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 hover:border-zinc-700'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 font-cairo" noValidate>
      {/* Name */}
      <div>
        <label className="text-[13px] font-semibold text-zinc-400 block mb-1 text-right">الاسم</label>
        <div className="relative group">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <User className="w-[18px] h-[18px] text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="الاسم بالكامل"
            className={inputClass('name')}
            disabled={loading}
          />
        </div>
        {errors.name && <p className="text-[11px] text-rose-400 mt-0.5 text-right">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="text-[13px] font-semibold text-zinc-400 block mb-1 text-right">البريد الإلكتروني</label>
        <div className="relative group">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <Mail className="w-[18px] h-[18px] text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@wolves.com"
            dir="ltr"
            className={`${inputClass('email')} font-mono tracking-wide`}
            disabled={loading}
          />
        </div>
        {errors.email && <p className="text-[11px] text-rose-400 mt-0.5 text-right">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="text-[13px] font-semibold text-zinc-400 block mb-1 text-right">رقم الموبايل</label>
        <div className="relative group">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <Phone className="w-[18px] h-[18px] text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
          </div>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="01012345678"
            dir="ltr"
            className={`${inputClass('phoneNumber')} font-mono tracking-wide`}
            disabled={loading}
          />
        </div>
        {errors.phoneNumber && <p className="text-[11px] text-rose-400 mt-0.5 text-right">{errors.phoneNumber}</p>}
      </div>

      {/* Passwords Row */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Password */}
        <div>
          <label className="text-[13px] font-semibold text-zinc-400 block mb-1 text-right">كلمة المرور</label>
          <div className="relative group">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Lock className="w-4 h-4 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              dir="ltr"
              className={passwordInputClass('password')}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-600 hover:text-amber-400"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {errors.password && <p className="text-[10px] text-rose-400 mt-0.5 text-right">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-[13px] font-semibold text-zinc-400 block mb-1 text-right">تأكيد المرور</label>
          <div className="relative group">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Lock className="w-4 h-4 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              dir="ltr"
              className={passwordInputClass('confirmPassword')}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-600 hover:text-amber-400"
            >
              {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-[10px] text-rose-400 mt-0.5 text-right">{errors.confirmPassword}</p>}
        </div>
      </div>

      {/* Submit */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري التسجيل...</span>
            </>
          ) : (
            <>
              <ArrowLeft className="w-4 h-4" />
              <span>إنشاء حساب</span>
            </>
          )}
        </button>
      </div>

      {/* Switch */}
      <p className="text-center text-[12px] text-zinc-500 pt-1">
        عندك حساب بالفعل؟{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-amber-400 font-bold hover:text-amber-300 transition-colors"
        >
          سجّل دخول
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;
