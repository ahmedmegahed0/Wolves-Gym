import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  CalendarDays,
  History,
  Info,
  Check,
  Ban,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import { 
  getSubscriptionStatusMeta, 
  getPaymentMethodMeta, 
  formatCurrency,
  subscriptionsService
} from '../../services/subscriptionsService';

/**
 * Format ISO string to readable Arabic date and time
 */
const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '—';
  }
};

/**
 * Format ISO string to Arabic date only
 */
const formatDateOnly = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '—';
  }
};

/**
 * SubscriptionDetailsModal Component
 * Displays the complete subscription entity according to the backend response specification:
 * - Basic IDs, customer details, package details (name, price, duration, description)
 * - Dates: start, end, created, cancelled
 * - Status, cancellation reason, receptionist notes
 * - Complete freezes history list (active freeze banner, past freezes table/cards with days, dates, reasons)
 */
export const SubscriptionDetailsModal = ({
  isOpen,
  onClose,
  subscription: initialSubscription,
  onOpenFreeze = null,
  onOpenUnfreeze = null,
  onOpenCancel = null
}) => {
  const [details, setDetails] = useState(initialSubscription);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // If initialSubscription provided, fetch full subscription by ID to ensure freezes array & all fields are fully populated
  useEffect(() => {
    let isMounted = true;
    if (isOpen && initialSubscription?.id) {
      setDetails(initialSubscription);
      // Fetch full details from backend if freezes not present or to get latest
      const fetchFull = async () => {
        try {
          setLoadingDetails(true);
          const full = await subscriptionsService.getSubscriptionById(initialSubscription.id);
          if (isMounted && full) {
            setDetails(full);
          }
        } catch (err) {
          console.warn('Could not fetch extra subscription details, using current object:', err);
        } finally {
          if (isMounted) setLoadingDetails(false);
        }
      };
      fetchFull();
    } else {
      setDetails(initialSubscription);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, initialSubscription]);

  if (!isOpen || !details) return null;

  const statusMeta = getSubscriptionStatusMeta(details.status);
  const paymentMeta = getPaymentMethodMeta(details.paymentMethod);

  const customerName = details.customerName || details.customer?.name || `العضو #${details.customerId}`;
  const customerPhone = details.customerPhone || details.customer?.phoneNumber || 'غير مسجل';
  const customerId = details.customerId || details.customer?.id;

  const packageName = details.packageName || details.package?.name || `باقة #${details.packageId}`;
  const packagePrice = details.packagePrice ?? details.package?.price ?? details.price ?? 0;
  const packageDuration = details.packageDuration ?? details.package?.duration;
  const packageDescription = details.packageDescription || details.package?.description;
  const trainerName = details.trainerName || details.trainer?.name;

  const startDate = details.startDate || details.createdAt;
  const endDate = details.endDate || details.expiresAt;
  const createdAt = details.createdAt;
  const notes = details.notes;
  const isCancelled = details.isCancelled || Number(details.status) === 4;
  const cancelledAt = details.cancelledAt;
  const cancellationReason = details.cancellationReason;

  const freezes = Array.isArray(details.freezes) ? details.freezes : [];
  const activeFreeze = freezes.find((f) => f.isActive);

  // Calculate days remaining or expired
  let daysRemaining = null;
  if (endDate) {
    const diffMs = new Date(endDate).getTime() - Date.now();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  const isStatusActive = Number(details.status) === 1 || String(details.status).toLowerCase() === 'active';
  const isStatusFrozen = Number(details.status) === 2 || String(details.status).toLowerCase() === 'frozen' || Boolean(activeFreeze);

  return (
    <AnimatePresence>
      <div 
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto font-cairo"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-[#141418] via-[#0f0f13] to-black border border-amber-500/30 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.15)] overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="relative p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-gold-glow">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-white">تفاصيل الاشتراك الكاملة</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusMeta.badge}`}>
                    {statusMeta.label}
                  </span>
                  {activeFreeze && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                      <Snowflake className="w-3 h-3" />
                      <span>تجميد ساري</span>
                    </span>
                  )}
                  {loadingDetails && (
                    <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  معرف الاشتراك: #{details.id} {createdAt && `• تم الإنشاء: ${formatDateOnly(createdAt)}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto gold-scrollbar text-xs sm:text-sm">
            
            {/* 1. Member & Package Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Member Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>بيانات العضو المشترك</span>
                  </div>
                  {customerId && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                      ID #{customerId}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-black text-white">{customerName}</p>
                  <p className="text-xs text-zinc-300 font-mono flex items-center gap-1.5" dir="ltr">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{customerPhone}</span>
                  </p>
                </div>
              </div>

              {/* Package Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>تفاصيل باقة التدريب</span>
                  </div>
                  {details.packageId && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-amber-400">
                      باقة #{details.packageId}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-black text-amber-300">{packageName}</p>
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {formatCurrency(packagePrice)}
                    </span>
                    {packageDuration && (
                      <span className="text-xs font-bold text-zinc-300 font-mono bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-700/60">
                        ⏱️ {packageDuration} يوماً
                      </span>
                    )}
                  </div>
                  {packageDescription && (
                    <p className="text-[11px] text-zinc-400 pt-1 line-clamp-2">
                      {packageDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Trainer, Payment & Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Trainer Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold">
                  <Dumbbell className="w-4 h-4 text-amber-400" />
                  <span>المدرب الخاص (Trainer)</span>
                </div>
                {trainerName ? (
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{trainerName}</span>
                      {details.trainerId && (
                        <span className="text-[10px] font-mono text-zinc-500">#{details.trainerId}</span>
                      )}
                    </p>
                    <span className="text-[10px] text-amber-400">تدريب برايفت مخصص</span>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 font-medium">بدون كابتن خاص (عضوية صالة عامة)</p>
                )}
              </div>

              {/* Payment Method Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>طريقة الدفع والخزينة</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">
                    {paymentMeta.label}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                    كود {details.paymentMethod ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Dates & Validity Bar */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-bold border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>فترة الصلاحية والتوقيت</span>
                </div>
                {createdAt && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    تاريخ التسجيل: {formatDateTime(createdAt)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block mb-1">تاريخ البداية:</span>
                  <span className="font-mono text-zinc-200 font-bold">
                    {formatDateOnly(startDate)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">تاريخ الانتهاء:</span>
                  <span className="font-mono text-zinc-200 font-bold">
                    {formatDateOnly(endDate)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">الأيام المتبقية:</span>
                  {daysRemaining !== null ? (
                    <span className={`font-mono font-black ${
                      daysRemaining > 5 ? 'text-emerald-400' : daysRemaining > 0 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {daysRemaining > 0 ? `${daysRemaining} يوم متبقي` : `منتهي منذ ${Math.abs(daysRemaining)} يوم`}
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Active Freeze Alert (if any) */}
            {activeFreeze && (
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between text-cyan-400 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-4 h-4 animate-spin-slow" />
                    <span>تجميد ساري حالياً (Active Freeze #{activeFreeze.id})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                    {activeFreeze.days} أيام تجميد
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div>
                    <span className="text-zinc-400">بداية التجميد: </span>
                    <strong className="text-white font-mono">{formatDateOnly(activeFreeze.startDate)}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">تاريخ الاستئناف: </span>
                    <strong className="text-white font-mono">{formatDateOnly(activeFreeze.endDate)}</strong>
                  </div>
                </div>
                {activeFreeze.reason && (
                  <p className="text-xs text-zinc-400 pt-1">
                    السبب: <span className="text-cyan-200">{activeFreeze.reason}</span>
                  </p>
                )}
              </div>
            )}

            {/* 5. Cancellation Banner (if cancelled) */}
            {(isCancelled || cancellationReason) && (
              <div className="p-4 rounded-2xl bg-rose-950/25 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between text-rose-400 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4" />
                    <span>تم إلغاء هذا الاشتراك</span>
                  </div>
                  {cancelledAt && (
                    <span className="text-[10px] font-mono text-rose-300">
                      {formatDateTime(cancelledAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-200">
                  سبب الإلغاء: {cancellationReason || 'لم يتم تسجيل سبب محدد'}
                </p>
              </div>
            )}

            {/* 6. Complete Freezes History List (سجل حركات التجميد) */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>سجل حركات التجميد (Freezes History)</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-cyan-300 font-mono text-xs font-bold">
                  {freezes.length} {freezes.length === 1 ? 'حركة' : 'حركات'}
                </span>
              </div>

              {freezes.length === 0 ? (
                <div className="py-4 text-center text-zinc-500 text-xs">
                  لا توجد حركات تجميد سابقة على هذا الاشتراك.
                </div>
              ) : (
                <div className="space-y-2">
                  {freezes.map((freeze, idx) => (
                    <div 
                      key={freeze.id || idx}
                      className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                        freeze.isActive 
                          ? 'bg-cyan-950/20 border-cyan-500/30' 
                          : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          freeze.isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          <Snowflake className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                              تجميد #{freeze.id}
                            </span>
                            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              freeze.isActive 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {freeze.isActive ? 'نشط حالياً' : 'مكتمل / منتهي'}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">
                            المدة: <strong className="text-amber-400 font-mono">{freeze.days || 1} يوم</strong> {freeze.reason && `• ${freeze.reason}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end text-[11px] font-mono text-zinc-400 shrink-0">
                        <span>من: {formatDateOnly(freeze.startDate)}</span>
                        <span>إلى: {formatDateOnly(freeze.endDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Receptionist Notes */}
            {notes && (
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                <span className="text-zinc-400 text-xs font-bold block">ملاحظات الاستقبال (Notes):</span>
                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{notes}</p>
              </div>
            )}
          </div>

          {/* Modal Footer with Actions */}
          <div className="p-4 sm:p-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#101014]">
            <div className="flex items-center gap-2 flex-wrap">
              {isStatusActive && onOpenFreeze && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFreeze(details);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
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
                    onOpenUnfreeze(details);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>إلغاء التجميد واستئناف</span>
                </button>
              )}

              {(isStatusActive || isStatusFrozen) && onOpenCancel && !isCancelled && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCancel(details);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>إلغاء الاشتراك</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-800 transition-colors cursor-pointer"
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
