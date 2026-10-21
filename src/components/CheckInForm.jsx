import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LogIn, 
  QrCode, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Zap,
  Grid,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { attendanceService } from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import LockerModal from './LockerModal';

export const CheckInForm = ({ onCheckInSuccess }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [code, setCode] = useState('');
  const [lockerId, setLockerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLockerModalOpen, setIsLockerModalOpen] = useState(false);

  // Form validation
  const validate = () => {
    const errs = {};
    if (!code || !code.trim()) {
      errs.code = 'برجاء إدخال كود العضو أو مسح الباركود';
    } else if (code.trim().length < 2) {
      errs.code = 'الكود لازم يكون حرفين على الأقل';
    }

    if (lockerId === '' || lockerId === null || lockerId === undefined) {
      errs.lockerId = 'برجاء تحديد رقم لوكر للعضو';
    } else if (isNaN(Number(lockerId)) || Number(lockerId) <= 0) {
      errs.lockerId = 'رقم اللوكر لازم يكون رقم صحيح وموجب';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await attendanceService.checkIn({
        code: code.trim(),
        lockerId: Number(lockerId),
      });

      // Trigger Confetti in gold/amber tones
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#F59E0B', '#FBBF24', '#FDE68A', '#D97706', '#FFFFFF']
      });

      setIsSuccess(true);
      toastSuccess(
        'تم تسجيل الدخول بنجاح.. عاش يا وحش!',
        `تم تسليم اللوكر رقم #${lockerId} للكابتن (${code.trim().toUpperCase()}). تمرين موفق!`
      );

      if (onCheckInSuccess) {
        onCheckInSuccess({
          code: code.trim().toUpperCase(),
          lockerId: Number(lockerId),
          timestamp: new Date().toISOString(),
          type: 'check-in',
        });
      }

      // Reset form after short success animation
      setTimeout(() => {
        setCode('');
        setLockerId('');
        setIsSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Check-in error:', err);
      toastError(
        'فشل تسجيل الدخول',
        err.friendlyMessage || 'تأكد من كود العضو وتوفر اللوكر، أو تحقق من صلاحية الدخول.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="wolf-glass rounded-3xl p-4 sm:p-6 lg:p-7 relative overflow-hidden border border-amber-500/20 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.85)] flex flex-col justify-between">
        {/* Subtle Gold Accent Line */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 opacity-90" />

        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5 sm:gap-2">
                  تسجيل دخول وحش جديد
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 sm:px-2 py-0.5 rounded-lg font-bold">
                    CHECK-IN
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-400">
                  امسح الباركود أو أدخل كود العضو وسلمه لوكر التمرين
                </p>
              </div>
            </div>
            
            {/* Quick reset */}
            {(code || lockerId) && (
              <button
                type="button"
                onClick={() => {
                  setCode('');
                  setLockerId('');
                  setErrors({});
                }}
                className="text-zinc-400 hover:text-amber-400 p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
                title="تفريغ الحقول"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Member Code Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  كود العضو (Member Code):
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Barcode / ID</span>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                  <QrCode className="w-4 h-4 text-amber-400/80" />
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (errors.code) setErrors((prev) => ({ ...prev, code: null }));
                  }}
                  placeholder="أدخل كود العضو أو امسح الباركود"
                  className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-4 py-3 border font-mono tracking-wider transition-all focus:outline-none ${
                    errors.code
                      ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                      : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
                  }`}
                  disabled={loading}
                />
              </div>

              {errors.code && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-semibold"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.code}
                </motion.p>
              )}
            </div>

            {/* Locker ID Field with interactive picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  رقم اللوكر (Locker Number):
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Locker #</span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                    <KeyRound className="w-4 h-4 text-amber-400/80" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={lockerId}
                    onChange={(e) => {
                      setLockerId(e.target.value);
                      if (errors.lockerId) setErrors((prev) => ({ ...prev, lockerId: null }));
                    }}
                    placeholder="رقم اللوكر المخصص"
                    className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-4 py-3 border font-mono transition-all focus:outline-none ${
                      errors.lockerId
                        ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                        : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
                    }`}
                    disabled={loading}
                  />
                </div>

                {/* Locker Bay Selector trigger */}
                <button
                  type="button"
                  onClick={() => setIsLockerModalOpen(true)}
                  className="px-2.5 sm:px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/25 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.1)] whitespace-nowrap"
                  title="فتح خريطة اللوكرات الذكية"
                >
                  <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>اللوكرات</span>
                </button>
              </div>

              {errors.lockerId && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-semibold"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.lockerId}
                </motion.p>
              )}
            </div>

            {/* Action CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
                  isSuccess
                    ? 'bg-amber-400 text-black shadow-gold-glow'
                    : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-500 text-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98]'
                } disabled:opacity-50 disabled:pointer-events-none`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>جاري تأكيد الدخول وتخصيص اللوكر...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-black animate-bounce" />
                    <span>عاش يا وحش! تم تسجيل الدخول</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-black" />
                    <span>تسجيل دخول واستلام لوكر</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>


      </div>

      {/* Visual Locker Selection Modal */}
      <LockerModal
        isOpen={isLockerModalOpen}
        onClose={() => setIsLockerModalOpen(false)}
        selectedLockerId={Number(lockerId)}
        onSelectLocker={(id) => {
          setLockerId(id);
          if (errors.lockerId) setErrors((prev) => ({ ...prev, lockerId: null }));
        }}
      />
    </>
  );
};

export default CheckInForm;
