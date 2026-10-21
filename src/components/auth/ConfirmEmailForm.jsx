import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2, RotateCw, ArrowRight, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ConfirmEmailForm = ({ onSwitchToLogin }) => {
  const { 
    pendingConfirmationEmail, 
    confirmEmail, 
    resendConfirmation, 
    loading 
  } = useAuth();

  const [email, setEmail] = useState(pendingConfirmationEmail || '');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState(null);

  const inputRefs = useRef([]);

  // Countdown timer for resending code
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle single digit typing & auto-focus next
  const handleDigitChange = (index, value) => {
    if (error) setError(null);
    const cleaned = value.replace(/[^0-9]/g, '');

    // If pasted multiple digits
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      const newDigits = [...codeDigits];
      chars.forEach((c, i) => {
        if (i < 6) newDigits[i] = c;
      });
      setCodeDigits(newDigits);
      const nextIndex = Math.min(chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...codeDigits];
    newDigits[index] = cleaned;
    setCodeDigits(newDigits);

    // Auto focus next box if typed
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullCode = codeDigits.join('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('برجاء كتابة البريد الإلكتروني للتأكيد');
      return;
    }
    if (fullCode.length < 6) {
      setError('برجاء إدخال كود التفعيل المكون من 6 أرقام بالكامل');
      return;
    }

    const result = await confirmEmail({ email: email.trim(), code: fullCode });
    if (!result.success) {
      setError(result.error || 'تعذر تأكيد الحساب. تأكد من صحة الكود.');
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending || !email.trim()) return;
    setIsResending(true);
    const result = await resendConfirmation(email.trim());
    setIsResending(false);
    if (result.success) {
      setResendCooldown(60);
      setCanResend(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-cairo" noValidate>
      <div className="text-right mb-2">
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          تأكيد الحساب وتفعيل العضوية
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
            OTP VERIFY
          </span>
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          تم إرسال كود التحقق المكون من 6 أرقام إلى بريدك الإلكتروني
        </p>
      </div>

      {/* Target Email display / editable */}
      <div>
        <label className="text-xs font-bold text-zinc-300 block mb-1.5 text-right">
          البريد الإلكتروني المراد تفعيله:
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
            <Mail className="w-4 h-4 text-amber-400/80" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@wolves.com"
            dir="ltr"
            className="w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-4 py-2.5 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner font-mono text-right"
            disabled={loading}
          />
        </div>
      </div>

      {/* 6-Digit OTP Boxes */}
      <div className="py-2">
        <label className="text-xs font-bold text-zinc-300 block mb-2 text-right">
          أدخل كود التفعيل (6 أرقام):
        </label>

        <div className="flex items-center justify-between gap-2" dir="ltr">
          {codeDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-12 h-14 text-center text-xl font-mono font-black text-amber-300 bg-black/80 rounded-2xl border transition-all focus:outline-none ${
                digit
                  ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] bg-amber-500/10'
                  : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
              }`}
              disabled={loading}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-400 mt-2 text-right font-semibold">
            {error}
          </p>
        )}
      </div>

      {/* Primary CTA Confirm Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading || fullCode.length < 6}
          className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-500 text-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>جاري التحقق من كود التفعيل...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-black" />
              <span>تأكيد الحساب وتفعيل العضوية</span>
            </>
          )}
        </button>
      </div>

      {/* Resend Code Action */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || isResending}
          className={`flex items-center gap-1.5 font-bold transition-colors ${
            canResend && !isResending
              ? 'text-amber-400 hover:text-amber-300 underline cursor-pointer'
              : 'text-zinc-500 cursor-not-allowed'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
          <span>
            {canResend
              ? 'إعادة إرسال كود التفعيل الآن'
              : `إعادة الإرسال بعد (${resendCooldown} ثانية)`}
          </span>
        </button>

        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة للدخول</span>
        </button>
      </div>
    </form>
  );
};

export default ConfirmEmailForm;
