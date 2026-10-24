import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  X, 
  User, 
  Phone, 
  CreditCard, 
  Calendar, 
  Clock, 
  Dumbbell, 
  Crown, 
  Snowflake, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Hash,
  ShieldCheck
} from 'lucide-react';
import { 
  getSubscriptionStatusMeta, 
  getPaymentMethodMeta, 
  formatCurrency 
} from '../../services/subscriptionsService';

/**
 * SubscriptionDetailsModal Component
 * Displays complete subscription details including customer, package, trainer, payment info, and freeze/cancellation history.
 */
export const SubscriptionDetailsModal = ({
  isOpen,
  onClose,
  subscription,
  onOpenFreeze = null,
  onOpenUnfreeze = null,
  onOpenCancel = null
}) => {
  if (!isOpen || !subscription) return null;

  const statusMeta = getSubscriptionStatusMeta(subscription.status);
  const paymentMeta = getPaymentMethodMeta(subscription.paymentMethod);

  const customerName = subscription.customerName || subscription.customer?.name || `العضو #${subscription.customerId}`;
  const customerPhone = subscription.customerPhone || subscription.customer?.phoneNumber || 'غير مسجل';
  const customerCode = subscription.customerCode || subscription.customer?.code || `#${subscription.customerId}`;

  const packageName = subscription.packageName || subscription.package?.name || `باقة #${subscription.packageId}`;
  const packagePrice = subscription.packagePrice ?? subscription.package?.price ?? subscription.price ?? 0;
  const trainerName = subscription.trainerName || subscription.trainer?.name;

  const startDate = subscription.startDate || subscription.createdAt;
  const endDate = subscription.endDate || subscription.expiresAt;

  // Calculate days remaining or expired
  let daysRemaining = null;
  if (endDate) {
    const diffMs = new Date(endDate).getTime() - Date.now();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  const isStatusActive = Number(subscription.status) === 1 || String(subscription.status).toLowerCase() === 'active';
  const isStatusFrozen = Number(subscription.status) === 2 || String(subscription.status).toLowerCase() === 'frozen';

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
          className="relative w-full max-w-xl bg-[#141417] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="relative p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">تفاصيل سجل الاشتراك</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.badge}`}>
                    {statusMeta.label}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">رقم المعاملة: {subscription.id}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Customer & Package Highlight Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Customer Box */}
              <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>بيانات العضو</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">{customerName}</p>
                  <p className="text-xs text-zinc-400 font-mono flex items-center gap-1.5" dir="ltr">
                    <Phone className="w-3 h-3 text-zinc-500" />
                    <span>{customerPhone}</span>
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">كود العضو: {customerCode}</p>
                </div>
              </div>

              {/* Package Box */}
              <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>بيانات الباقة</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-300">{packageName}</p>
                  <p className="text-xs font-bold text-emerald-400 font-mono">
                    {formatCurrency(packagePrice)}
                  </p>
                  {subscription.packageDuration && (
                    <p className="text-[11px] text-zinc-400">
                      المدة: {subscription.packageDuration} يوم
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Trainer & Payment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Trainer Box */}
              <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold">
                  <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                  <span>المدرب الخاص (Personal Trainer)</span>
                </div>
                {trainerName ? (
                  <p className="text-sm font-bold text-white">{trainerName}</p>
                ) : (
                  <p className="text-xs text-zinc-500 font-medium">بدون مدرب خاص (اشتراك صالة فقط)</p>
                )}
              </div>

              {/* Payment Box */}
              <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>طريقة الدفع والخزينة</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-200">
                    {paymentMeta.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Dates & Timeline */}
            <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>فترة الصلاحية والتوقيت</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block mb-1">تاريخ البداية:</span>
                  <span className="font-mono text-zinc-200 font-bold">
                    {startDate ? new Date(startDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">تاريخ الانتهاء:</span>
                  <span className="font-mono text-zinc-200 font-bold">
                    {endDate ? new Date(endDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">الأيام المتبقية:</span>
                  {daysRemaining !== null ? (
                    <span className={`font-mono font-black ${
                      daysRemaining > 5 ? 'text-emerald-400' : daysRemaining > 0 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {daysRemaining > 0 ? `${daysRemaining} يوم` : `منتهي منذ ${Math.abs(daysRemaining)} يوم`}
                    </span>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Freeze or Cancellation Audit Logs */}
            {(isStatusFrozen || subscription.freezeEndDate || subscription.freezeReason) && (
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                  <Snowflake className="w-4 h-4" />
                  <span>معلومات التجميد الحالية</span>
                </div>
                {subscription.freezeEndDate && (
                  <p className="text-xs text-zinc-300">
                    تاريخ استئناف العضوية: <strong className="text-white font-mono">{new Date(subscription.freezeEndDate).toLocaleDateString('ar-EG')}</strong>
                  </p>
                )}
                {subscription.freezeReason && (
                  <p className="text-xs text-zinc-400">
                    سبب التجميد: <span className="text-zinc-200">{subscription.freezeReason}</span>
                  </p>
                )}
              </div>
            )}

            {subscription.cancellationReason && (
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>سبب إلغاء الاشتراك</span>
                </div>
                <p className="text-xs text-rose-200">{subscription.cancellationReason}</p>
              </div>
            )}

            {/* Notes if any */}
            {subscription.notes && (
              <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/5 space-y-1">
                <span className="text-zinc-400 text-xs font-bold block">ملاحظات الاستقبال:</span>
                <p className="text-xs text-zinc-300 whitespace-pre-wrap">{subscription.notes}</p>
              </div>
            )}
          </div>

          {/* Modal Footer with contextual action buttons */}
          <div className="p-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#101014]">
            <div className="flex items-center gap-2">
              {isStatusActive && onOpenFreeze && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFreeze(subscription);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Snowflake className="w-3.5 h-3.5" />
                  <span>تجميد الاشتراك</span>
                </button>
              )}

              {isStatusFrozen && onOpenUnfreeze && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUnfreeze(subscription);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>إلغاء التجميد واستئناف</span>
                </button>
              )}

              {(isStatusActive || isStatusFrozen) && onOpenCancel && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCancel(subscription);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>إلغاء الاشتراك</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-800 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SubscriptionDetailsModal;
