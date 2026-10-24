import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  X, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react';
import { subscriptionsService } from '../../services/subscriptionsService';
import { useToast } from '../../context/ToastContext';

/**
 * CancelSubscriptionModal Component
 * Warning confirmation modal requesting cancellation reason.
 */
export const CancelSubscriptionModal = ({
  isOpen,
  onClose,
  subscription,
  onSuccess
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const QUICK_CANCEL_REASONS = [
    'طلب العضو استرداد أو إيقاف نهائي',
    'عدم التزام بقواعد ولوائح الجيم',
    'انتقال وسفر دائم خارج المدينة',
    'ظرف صحي مانع لممارسة الرياضة',
    'خطأ في تسجيل الاشتراك'
  ];

  if (!isOpen || !subscription) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toastError('يرجى كتابة سبب إلغاء الاشتراك للتوثيق');
      return;
    }

    setLoading(true);
    try {
      const response = await subscriptionsService.cancelSubscription(subscription.id, {
        reason: reason.trim()
      });

      toastSuccess('تم إلغاء الاشتراك بنجاح.');

      if (onSuccess) {
        onSuccess({
          ...subscription,
          status: 4, // ملغي
          isCancelled: true,
          cancellationReason: reason.trim(),
          ...(response || {})
        });
      }
      onClose();
    } catch (err) {
      console.error('Cancel subscription failed:', err);
      const msg = err.friendlyMessage || err.response?.data?.detail || err.response?.data?.title || 'تعذر إلغاء الاشتراك حالياً.';
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
          className="relative w-full max-w-md bg-[#141417] border border-rose-500/30 rounded-3xl shadow-2xl overflow-hidden p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Glow */}
          <div className="absolute top-0 right-0 w-48 h-24 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Icon & Title */}
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
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

          <div className="mt-4 space-y-2">
            <h3 className="text-lg font-black text-white">إلغاء الاشتراك نهائياً</h3>
            <p className="text-xs text-rose-400/90 leading-relaxed font-semibold">
              تحذير: سيتم إيقاف صلاحية الدخول تماماً وإلغاء الاشتراك من النظام.
            </p>
          </div>

          {/* Context Card */}
          <div className="mt-4 p-4 rounded-2xl bg-[#0c0c0e] border border-white/5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">العضو:</span>
              <span className="font-bold text-white">{customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">الباقة:</span>
              <span className="font-bold text-amber-400">{packageName}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="cancelReason" className="block text-xs font-bold text-zinc-300">
                سبب الإلغاء <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="cancelReason"
                rows={3}
                required
                placeholder="اكتب سبب إلغاء الاشتراك بالتفصيل..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/50 transition-colors resize-none"
              />

              {/* Quick Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_CANCEL_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-rose-500/30 text-zinc-400 hover:text-white transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>تأكيد الإلغاء النهائي</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="py-3 px-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-sm border border-zinc-800 transition-colors"
              >
                تراجع
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CancelSubscriptionModal;
