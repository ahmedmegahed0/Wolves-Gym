import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ForgotPasswordWizard = ({ onSwitchToLogin }) => {
  const { 
    sendResetPasswordEmail, 
    validateResetPasswordCode, 
    resetPassword, 
    loading 
  } = useAuth();

  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3
  const [email, setEmail] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const otpRefs = useRef([]);

  // Calculate password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: 'أدخل كلمة المرور', color: 'bg-zinc-800' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score === 1) return { score: 1, text: 'ضعيفة', color: 'bg-rose-500', bar: 'w-1/3' };
    if (score === 2) return { score: 2, text: 'متوسطة ومناسبة', color: 'bg-amber-400', bar: 'w-2/3' };
    return { score: 3, text: 'قوية جداً (وحش)!', color: 'bg-gradient-to-r from-amber-400 to-yellow-300', bar: 'w-full' };
  };

  const strength = getPasswordStrength(newPassword);

  // STEP 1: Send Reset Email
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setErrors({ email: 'برجاء كتابة البريد الإلكتروني المسجل' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setErrors({ email: 'صيغة البريد الإلكتروني غير صحيحة' });
      return;
    }
    setErrors({});

    const result = await sendResetPasswordEmail(email.trim());
    if (result.success) {
      setCurrentStep(2);
    }
  };

  // STEP 2: Validate OTP Code
  const handleOtpChange = (index, value) => {
    if (errors.code) setErrors((prev) => ({ ...prev, code: null }));
    const cleaned = value.replace(/[^0-9]/g, '');

    // Handle paste
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      const newDigits = [...codeDigits];
      chars.forEach((c, i) => {
        if (i < 6) newDigits[i] = c;
      });
      setCodeDigits(newDigits);
      const nextIdx = Math.min(chars.length, 5);
      otpRefs.current[nextIdx]?.focus();
      return;
    }

    const newDigits = [...codeDigits];
    newDigits[index] = cleaned;
    setCodeDigits(newDigits);

    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const fullCode = codeDigits.join('');

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (fullCode.length < 6) {
      setErrors({ code: 'برجاء إدخال كود التحقق المكون من 6 أرقام بالكامل' });
      return;
    }
    setErrors({});

    const result = await validateResetPasswordCode({ email: email.trim(), code: fullCode });
    if (result.success) {
      setCurrentStep(3);
    }
  };

  // STEP 3: Reset Password
  const handleStep3Submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!newPassword) {
      errs.newPassword = 'برجاء إدخال كلمة المرور الجديدة';
    } else if (newPassword.length < 8) {
      errs.newPassword = 'كلمة المرور يجب أن لا تقل عن 8 أحرف';
    }

    if (!confirmNewPassword) {
      errs.confirmNewPassword = 'برجاء تأكيد كلمة المرور الجديدة';
    } else if (newPassword !== confirmNewPassword) {
      errs.confirmNewPassword = 'كلمتا المرور غير متطابقتين';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    await resetPassword({
      email: email.trim(),
      code: fullCode,
      newPassword,
      confirmNewPassword,
    });
  };

  return (
    <div className="font-cairo">
      {/* Header with Title */}
      <div className="text-right mb-4">
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          استعادة كلمة المرور
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
            RESET WIZARD
          </span>
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          اتبع الخطوات لاستعادة الوصول لحسابك وتعيين باسورد جديد
        </p>
      </div>

      {/* Golden Step Progress Indicator */}
      <div className="py-2 mb-6">
        <div className="flex items-center justify-between relative">
          {/* Progress bar line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />
          <motion.div
            layout
            className="absolute top-1/2 right-0 h-0.5 bg-gradient-to-l from-amber-500 to-yellow-400 -translate-y-1/2 z-0"
            style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            transition={{ duration: 0.35 }}
          />

          {/* Steps */}
          {[
            { step: 1, title: 'طلب الكود' },
            { step: 2, title: 'التحقق' },
            { step: 3, title: 'كلمة السر' },
          ].map((s) => {
            const isPassed = currentStep > s.step;
            const isCurrent = currentStep === s.step;

            return (
              <div key={s.step} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow scale-110 font-black'
                      : isPassed
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4 text-amber-400" /> : s.step}
                </div>
                <span
                  className={`text-[10px] font-bold mt-1.5 transition-colors ${
                    isCurrent ? 'text-amber-400' : isPassed ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Wizard Content */}
      <AnimatePresence mode="wait">
        {/* STEP 1: Email Form */}
        {currentStep === 1 && (
          <motion.form
            key="step-1"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleStep1Submit}
            className="space-y-4"
            noValidate
          >
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5 text-right">
                البريد الإلكتروني المسجل:
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
                    if (errors.email) setErrors({});
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-500 text-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>جاري إرسال الكود...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-black" />
                  <span>إرسال كود الاستعادة</span>
                </>
              )}
            </button>
          </motion.form>
        )}

        {/* STEP 2: Code Validation */}
        {currentStep === 2 && (
          <motion.form
            key="step-2"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleStep2Submit}
            className="space-y-4"
            noValidate
          >
            <div className="bg-black/60 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">الكود مرسل إلى:</span>
              <span className="text-amber-400 font-mono font-bold">{email}</span>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-2 text-right">
                أدخل رمز التحقق (6 أرقام):
              </label>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2" dir="ltr">
                {codeDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-9 sm:w-12 h-11 sm:h-14 text-center text-lg sm:text-xl font-mono font-black text-amber-300 bg-black/80 rounded-xl sm:rounded-2xl border transition-all focus:outline-none ${
                      digit
                        ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] bg-amber-500/10'
                        : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                    }`}
                    disabled={loading}
                  />
                ))}
              </div>

              {errors.code && (
                <p className="text-xs text-rose-400 mt-2 text-right font-medium">
                  {errors.code}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-3.5 rounded-2xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
              >
                رجوع
              </button>
              <button
                type="submit"
                disabled={loading || fullCode.length < 6}
                className="flex-1 py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>جاري التحقق من الكود...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-black" />
                    <span>تأكيد الكود والمتابعة</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}

        {/* STEP 3: Reset New Password */}
        {currentStep === 3 && (
          <motion.form
            key="step-3"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleStep3Submit}
            className="space-y-4"
            noValidate
          >
            {/* New Password */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1 text-right">
                كلمة المرور الجديدة (8+ أحرف):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4 text-amber-400/80" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: null }));
                  }}
                  placeholder="••••••••"
                  dir="ltr"
                  className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-11 py-3 border font-mono tracking-wider transition-all focus:outline-none text-right ${
                    errors.newPassword
                      ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                      : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 hover:text-amber-400"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color} ${strength.bar}`} />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>قوة كلمة المرور:</span>
                    <span className="font-bold text-amber-400">{strength.text}</span>
                  </div>
                </div>
              )}

              {errors.newPassword && (
                <p className="text-xs text-rose-400 mt-1 text-right font-medium">
                  {errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1 text-right">
                تأكيد كلمة المرور الجديدة:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4 text-amber-400/80" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    if (errors.confirmNewPassword) setErrors((prev) => ({ ...prev, confirmNewPassword: null }));
                  }}
                  placeholder="••••••••"
                  dir="ltr"
                  className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-11 py-3 border font-mono tracking-wider transition-all focus:outline-none text-right ${
                    errors.confirmNewPassword
                      ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                      : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 hover:text-amber-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmNewPassword && (
                <p className="text-xs text-rose-400 mt-1 text-right font-medium">
                  {errors.confirmNewPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-500 text-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>جاري تعيين كلمة المرور الجديدة...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>حفظ كلمة المرور والدخول للعرين</span>
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Return to Login link */}
      <div className="text-center pt-4 border-t border-zinc-800/80 mt-4">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors font-bold"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>تذكرت كلمة المرور؟ العودة لتسجيل الدخول</span>
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordWizard;
