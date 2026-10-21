import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  DoorOpen, 
  Clock, 
  ShieldCheck,
  X,
  Sparkles,
  Flame
} from 'lucide-react';
import { attendanceService } from '../services/apiClient';
import { useToast } from '../context/ToastContext';

export const CheckOutForm = ({ onCheckOutSuccess, recentActiveMembers = [] }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Checkout confirmation modal state
  const [exitModalData, setExitModalData] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!code || !code.trim()) {
      setError('برجاء كتابة أو اختيار كود العضو لتسجيل الخروج');
      return;
    }

    setLoading(true);
    setError(null);

    const memberCodeFormatted = code.trim().toUpperCase();

    try {
      const response = await attendanceService.checkOut({
        code: memberCodeFormatted,
      });

      // Prepare exit confirmation data with Egyptian gym tone
      const exitData = {
        code: memberCodeFormatted,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' }),
        message: response.message || 'نورتنا يا كوتش.. عاش تمرينك، نشوفك المرة الجاية أقوى!',
      };

      setExitModalData(exitData);
      toastSuccess(
        'نورتنا يا كوتش.. تم تسليم اللوكر',
        `تم تسجيل خروج العضو (${memberCodeFormatted}) بنجاح وإخلاء اللوكر.`
      );

      if (onCheckOutSuccess) {
        onCheckOutSuccess({
          code: memberCodeFormatted,
          timestamp: new Date().toISOString(),
          type: 'check-out',
        });
      }

      setCode('');
    } catch (err) {
      console.error('Check-out error:', err);
      const msg = err.friendlyMessage || 'تعذر تسجيل الخروج. تأكد من صحة كود العضو أو أنه سجل دخول بالفعل.';
      setError(msg);
      toastError('فشل تسجيل الخروج', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheckout = (quickCode) => {
    setCode(quickCode);
    setError(null);
  };

  return (
    <>
      <div className="wolf-glass rounded-3xl p-6 lg:p-7 relative overflow-hidden border border-amber-500/20 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.85)] flex flex-col justify-between">
        {/* Subtle Gold/Bronze Accent Line */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-500 opacity-90" />

        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  تسجيل خروج واستلام مفتاح
                  <span className="text-[10px] font-mono uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-lg font-bold">
                    CHECK-OUT
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  تسجيل انتهاء التمرين وإفراغ اللوكر لاستقبال وحوش جدد
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Member Code Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  كود العضو المغادر (Member Code):
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">ID / Barcode</span>
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
                    if (error) setError(null);
                  }}
                  placeholder="أدخل كود العضو المغادر"
                  className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-4 py-3 border font-mono tracking-wider transition-all focus:outline-none ${
                    error
                      ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                      : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
                  }`}
                  disabled={loading}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-semibold"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </motion.p>
              )}

              {/* Quick-action active member chips */}
              {recentActiveMembers.length > 0 && (
                <div className="mt-3">
                  <span className="text-[11px] text-zinc-400 font-bold block mb-1.5">
                    وحوش موجودين في الجيم حالياً (اضغط لاختيار فوري):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap max-h-20 overflow-y-auto pl-1">
                    {recentActiveMembers.slice(0, 8).map((m) => (
                      <button
                        key={m.code}
                        type="button"
                        onClick={() => handleQuickCheckout(m.code)}
                        className={`px-3 py-1.5 text-xs font-mono rounded-xl border transition-all flex items-center gap-1.5 ${
                          code.toUpperCase() === m.code.toUpperCase()
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                            : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                        }`}
                      >
                        <span className="font-bold">{m.code}</span>
                        {m.lockerId && (
                          <span className="text-[10px] text-amber-400/80 bg-black/40 px-1 rounded">
                            #{m.lockerId}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Check-Out CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:via-yellow-400 hover:to-amber-600 text-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>جاري تسجيل الخروج وإفراغ اللوكر...</span>
                  </>
                ) : (
                  <>
                    <DoorOpen className="w-4 h-4 text-black" />
                    <span>تسجيل خروج وتسليم اللوكر</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
          <span>المسار البرمجي: <code className="text-amber-400 font-mono">/api/Attendances/check-out</code></span>
          <span className="text-zinc-500">خصم فوري من الإشغال</span>
        </div>
      </div>

      {/* Exit Confirmation Modal with Egyptian gym tone */}
      <AnimatePresence>
        {exitModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="wolf-glass bg-zinc-950/95 border border-amber-500/35 rounded-3xl p-7 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              {/* Background accent glow */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl" />

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-white">نورتنا يا كوتش!</h4>
                </div>
                <button
                  onClick={() => setExitModalData(null)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 relative z-10 py-2">
                <div className="bg-black/80 rounded-2xl p-4 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>كود العضو:</span>
                    <span className="text-amber-400 font-bold font-mono text-sm">{exitModalData.code}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>وقت المغادرة:</span>
                    <span className="text-white font-bold font-mono">{exitModalData.time}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>التاريخ:</span>
                    <span className="text-zinc-300 font-medium">{exitModalData.date}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 pt-1 border-t border-zinc-900">
                    <span>حالة اللوكر:</span>
                    <span className="text-amber-400 font-bold">تم إخلاء اللوكر وتعقيمه</span>
                  </div>
                </div>

                <p className="text-xs text-amber-200/90 text-center font-medium leading-relaxed bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  "{exitModalData.message}"
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800/80 relative z-10">
                <button
                  onClick={() => setExitModalData(null)}
                  className="w-full py-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black transition-all shadow-gold-glow"
                >
                  إغلاق ومتابعة العمل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CheckOutForm;
