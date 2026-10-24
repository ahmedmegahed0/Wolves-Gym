import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayCircle, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Calendar
} from 'lucide-react';
import { subscriptionsService } from '../../services/subscriptionsService';
import { useToast } from '../../context/ToastContext';

/**
 * UnfreezeModal Component
 * Fast confirmation modal to resume frozen membership immediately.
 */
export const UnfreezeModal = ({
  isOpen,
  onClose,
  subscription,
  onSuccess
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !subscription) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await subscriptionsService.unfreezeSubscription(subscription.id);
      
      const newEnd = response?.newEndDate || response?.endDate;
      const successMsg = newEnd 
        ? `تم استئناف الاشتراك بنجاح. تاريخ الانتهاء الجديد: ${new Date(newEnd).toLocaleDateString('ar-EG')}`
        : 'تم إلغاء تجميد الاشتراك واستئناف العضوية فوراً.';

      toastSuccess(successMsg);

      if (onSuccess) {
        onSuccess({
          ...subscription,
          status: 1, // نشط
          isFrozen: false,
          freezeEndDate: null,
          ...(response || {})
        });
      }
      onClose();
    } catch (err) {
      console.error('Unfreeze subscription failed:', err);
      const msg = err.friendlyMessage || err.response?.data?.detail || err.response?.data?.title || 'تعذر استئناف الاشتراك حالياً.';
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
          className="relative w-full max-w-md bg-[#141417] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Glow */}
          <div className="absolute top-0 right-0 w-48 h-24 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon & Title */}
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <PlayCircle className="w-6 h-6" />
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
            <h3 className="text-lg font-black text-white">إلغاء تجميد واستئناف الاشتراك</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              هل أنت متأكد من رغبتك في استئناف اشتراك العضو الآن؟ سيتم تحويل حالة الاشتراك إلى نشط وإعادة احتساب تاريخ الصلاحية.
            </p>
          </div>

          {/* Context Card */}
          <div className="mt-5 p-4 rounded-2xl bg-[#0c0c0e] border border-white/5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">اسم العضو:</span>
              <span className="font-bold text-white">{customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">الباقة:</span>
              <span className="font-bold text-amber-400">{packageName}</span>
            </div>
            {subscription.freezeEndDate && (
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-zinc-400">تاريخ الانتهاء المجدول للتجميد:</span>
                <span className="text-cyan-400 font-mono">
                  {new Date(subscription.freezeEndDate).toLocaleDateString('ar-EG')}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>استئناف الاشتراك فوراً</span>
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UnfreezeModal;
