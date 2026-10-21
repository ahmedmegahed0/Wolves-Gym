import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  KeyRound, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { lockerService } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

/**
 * AddLockerModal: Modal dialog for creating a new gym locker (POST /api/Lockers)
 */
export const AddLockerModal = ({
  isOpen,
  onClose,
  onLockerAdded,
  existingNumbers = [],
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Reset and auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      setNumber('');
      setError(null);
      setLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const trimmed = String(number).trim();
    if (!trimmed) {
      setError('من فضلك أدخل رقم اللوكر');
      return false;
    }

    const numVal = Number(trimmed);
    if (!Number.isInteger(numVal) || numVal <= 0) {
      setError('رقم اللوكر لازم يكون رقم صحيح وموجب أكبر من الصفر');
      return false;
    }

    // Client-side duplicate check
    if (existingNumbers.includes(numVal)) {
      setError(`اللوكر رقم #${numVal} موجود بالفعل في السيستم! اختر رقماً آخر.`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    const numVal = Number(number.trim());

    try {
      const result = await lockerService.createLocker({ number: numVal });
      
      toastSuccess(
        'تم إضافة اللوكر بنجاح',
        `تم تسجيل اللوكر رقم #${numVal} في قائمة دواليب الجيم وجاهز للاستخدام.`
      );

      if (onLockerAdded) {
        onLockerAdded(result || { id: Date.now(), number: numVal, isActive: true, isAvailable: true });
      }

      onClose();
    } catch (err) {
      console.error('Failed to create locker:', err);
      const msg = err.friendlyMessage || 'تعذر إضافة اللوكر، تأكد من أن الرقم غير مكرر.';
      setError(msg);
      toastError('فشل إضافة اللوكر', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        dir="rtl" 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md font-cairo"
        onClick={() => !loading && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto gold-scrollbar bg-gradient-to-b from-[#16161a] to-[#0c0c0e] border border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]"
        >
          {/* Subtle Top Gold Gradient Bar */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700" />

          {/* Close button */}
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
            title="إغلاق"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                إضافة لوكر جديد
                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              </h3>
              <p className="text-xs text-zinc-400">
                تسجيل دولاب إضافي ضمن منظومة اللوكرات بالصالة
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Locker Number Input */}
            <div>
              <label 
                htmlFor="locker-number-input"
                className="block text-xs font-bold text-zinc-200 mb-1.5"
              >
                رقم اللوكر المطلوب (Locker Number):
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400 font-mono font-bold text-sm">
                  #
                </div>
                <input
                  id="locker-number-input"
                  ref={inputRef}
                  type="number"
                  min="1"
                  step="1"
                  value={number}
                  onChange={(e) => {
                    setNumber(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="مثال: 105"
                  disabled={loading}
                  className={`w-full bg-black/70 text-white placeholder-zinc-500 text-base font-mono rounded-2xl pr-8 pl-4 py-3.5 border transition-all focus:outline-none ${
                    error
                      ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                      : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
                  }`}
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-rose-400 mt-2 flex items-center gap-1.5 font-semibold bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.p>
              )}

              {/* Informational Hint */}
              <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                سيتم إضافة اللوكر بحالة نشطة ومتاحة للاستخدام فوراً.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-50 text-center"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs sm:text-sm font-black shadow-gold-glow transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>جاري إضافة اللوكر...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>إضافة الدولاب</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddLockerModal;
