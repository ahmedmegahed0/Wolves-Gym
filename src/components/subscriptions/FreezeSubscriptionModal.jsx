import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Snowflake, 
  X, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { subscriptionsService } from '../../services/subscriptionsService';
import { useToast } from '../../context/ToastContext';

/**
 * FreezeSubscriptionModal Component
 * Handles freezing an active subscription with endDate and reason.
 */
export const FreezeSubscriptionModal = ({
  isOpen,
  onClose,
  subscription,
  onSuccess
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Suggested preset tags
  const QUICK_REASONS = [
    'سفر مؤقت',
    'إصابة رياضية',
    'فترة امتحانات',
    'ظروف عمل طارئة',
    'إجازة سنوية',
    'ظروف صحية'
  ];

  // Set default min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      // Default freeze for 14 days
      const defaultFreeze = new Date();
      defaultFreeze.setDate(defaultFreeze.getDate() + 14);
      setEndDate(defaultFreeze.toISOString().split('T')[0]);
      setReason('');
    }
  }, [isOpen, subscription]);

  if (!isOpen || !subscription) return null;

  const handleApplyDays = (days) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    setEndDate(target.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!endDate) {
      toastError('يرجى تحديد تاريخ انتهاء فترة التجميد');
      return;
    }

    if (new Date(endDate) <= new Date()) {
      toastError('يجب أن يكون تاريخ انتهاء التجميد تاريخاً مستقبلياً');
      return;
    }

    setLoading(true);
    try {
      const response = await subscriptionsService.freezeSubscription(subscription.id, {
        endDate,
        reason: reason.trim()
      });

      const newEnd = response?.newEndDate || response?.endDate;
      const successMsg = newEnd
        ? `تم تجميد الاشتراك بنجاح. تاريخ الانتهاء الجديد: ${new Date(newEnd).toLocaleDateString('ar-EG')}`
        : 'تم تجميد الاشتراك بنجاح وتمديد فترة العضوية.';

      toastSuccess(successMsg);

      if (onSuccess) {
        onSuccess({
          ...subscription,
          status: 2, // مجمد
          isFrozen: true,
          freezeEndDate: endDate,
          freezeReason: reason.trim(),
          ...(response || {})
        });
      }
      onClose();
    } catch (err) {
      console.error('Freeze subscription failed:', err);
      const msg = err.friendlyMessage || err.response?.data?.detail || err.response?.data?.title || 'تعذر تجميد الاشتراك حالياً.';
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const customerName = subscription.customerName || subscription.customer?.name || `العضو #${subscription.customerId}`;
  const packageName = subscription.packageName || subscription.package?.name || `باقة #${subscription.packageId}`;

  return (
    <AnimatePresence>
      <div 
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-cairo"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-[#141417] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="relative p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Snowflake className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">تجميد الاشتراك</h3>
                <p className="text-xs text-zinc-400">إيقاف مؤقت للعضوية وتمديد فترة الصلاحية</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Subscription Context Card */}
            <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">اسم العضو:</span>
                <span className="font-bold text-white">{customerName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">الباقة الحالية:</span>
                <span className="font-bold text-amber-400">{packageName}</span>
              </div>
              {subscription.expiresAt && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <span className="text-zinc-400">تاريخ الانتهاء الحالي:</span>
                  <span className="font-mono text-zinc-300">
                    {new Date(subscription.expiresAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Duration Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                مدة التجميد المقترحة:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'أسبوع (7 أيام)', days: 7 },
                  { label: 'أسبوعين (14 يوم)', days: 14 },
                  { label: 'شهر (30 يوم)', days: 30 }
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => handleApplyDays(item.days)}
                    className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-cyan-500/10 border border-zinc-800 hover:border-cyan-500/30 text-xs font-semibold text-zinc-300 hover:text-cyan-300 transition-all text-center"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* End Date Field */}
            <div className="space-y-2">
              <label htmlFor="freezeEndDate" className="block text-xs font-bold text-zinc-300">
                تاريخ انتهاء التجميد (استئناف العضوية) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="freezeEndDate"
                  type="date"
                  min={minDateStr}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              </div>
              <p className="text-[11px] text-zinc-500">
                سيتوقف حساب المشترك عن احتساب أيام الاشتراك حتى هذا التاريخ، وتُمدد نهايته تلقائياً.
              </p>
            </div>

            {/* Reason Field */}
            <div className="space-y-2">
              <label htmlFor="freezeReason" className="block text-xs font-bold text-zinc-300">
                سبب التجميد
              </label>
              <input
                id="freezeReason"
                type="text"
                placeholder="مثال: سفر، إصابة، امتحانات..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />

              {/* Quick Reason Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Snowflake className="w-4 h-4" />
                    <span>تأكيد تجميد الاشتراك</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="py-3 px-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-sm border border-zinc-800 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FreezeSubscriptionModal;
