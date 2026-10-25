import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  RotateCw, 
  Check, 
  X, 
  User, 
  Phone, 
  Mail, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Sparkles,
  UserCheck,
  UserX,
  Copy
} from 'lucide-react';
import { customerService } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

/**
 * Format Date to readable Arabic format
 */
const formatDateArabic = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

/**
 * PendingSubscriptionsPage Component
 * Displays pending customer accounts and subscription requests (approvalStatus: 0)
 * Allows 1-click Approve or Reject directly with real-time UI updates
 */
export const PendingSubscriptionsPage = ({ 
  onBack, 
  onPendingCountChange 
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [copiedCode, setCopiedCode] = useState(null);

  // Fetch Pending Customers (approvalStatus: 0)
  const fetchPendingMembers = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await customerService.getCustomers({
        approvalStatus: 0,
        pageSize: 50,
      });

      const list = Array.isArray(res?.data) ? res.data : [];
      setPendingMembers(list);

      if (onPendingCountChange) {
        onPendingCountChange(res.totalCount || list.length);
      }
    } catch (err) {
      console.error('Failed to load pending members:', err);
      toastError('خطأ في التحميل', 'تعذر جلب طلبات الاشتراكات المعلقة.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError, onPendingCountChange]);

  useEffect(() => {
    fetchPendingMembers();
  }, [fetchPendingMembers]);

  // Handle Copy Member Code
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 1-Click Approve (Status 1)
  const handleApprove = async (member) => {
    setProcessingId(member.id);
    setActionType('approve');

    try {
      await customerService.updateApprovalStatus(member.id, 1);

      // Optimistic update
      const updated = pendingMembers.filter((m) => m.id !== member.id);
      setPendingMembers(updated);
      if (onPendingCountChange) onPendingCountChange(updated.length);

      toastSuccess(
        'تمت الموافقة وتفعيل العضوية! 🐺',
        `أصبح حساب العضو (${member.name || `كود ${member.code}`}) مفعلاً ومصرحاً له بالحضور والاشتراكات.`
      );
    } catch (err) {
      console.error('Approval error:', err);
      const msg = err.friendlyMessage || err.message || 'فشل قبول وتفعيل العضوية.';
      toastError('فشل التفعيل', msg);
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  // 1-Click Reject (Status 2)
  const handleReject = async (member) => {
    setProcessingId(member.id);
    setActionType('reject');

    try {
      await customerService.updateApprovalStatus(member.id, 2);

      // Optimistic update
      const updated = pendingMembers.filter((m) => m.id !== member.id);
      setPendingMembers(updated);
      if (onPendingCountChange) onPendingCountChange(updated.length);

      toastSuccess(
        'تم رفض الطلب',
        `تم رفض طلب التسجيل للعضو (${member.name || 'العضو'}) بنجاح.`
      );
    } catch (err) {
      console.error('Rejection error:', err);
      const msg = err.friendlyMessage || err.message || 'فشل رفض الطلب.';
      toastError('فشل الرفض', msg);
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  // Filtered members by search
  const filteredMembers = useMemo(() => {
    if (!search.trim()) return pendingMembers;
    const query = search.trim().toLowerCase();
    return pendingMembers.filter((m) => {
      const name = String(m.name || '').toLowerCase();
      const code = String(m.code || '').toLowerCase();
      const phone = String(m.phoneNumber || '');
      const email = String(m.email || '').toLowerCase();
      return name.includes(query) || code.includes(query) || phone.includes(query) || email.includes(query);
    });
  }, [pendingMembers, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.25 }}
      dir="rtl"
      className="space-y-6 font-cairo"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/80 p-4 sm:p-6 rounded-3xl border border-emerald-500/25 wolf-glass shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-700" />

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 sm:p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center cursor-pointer group"
            title="العودة للنظرة العامة"
          >
            <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                الاشتراكات والطلبات المعلقة
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-gold-glow flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{pendingMembers.length} في انتظار الموافقة</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              مراجعة وتفعيل حسابات الأعضاء الجدد والاشتراكات المعلقة بنقرة واحدة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchPendingMembers(true)}
          disabled={loading || refreshing}
          className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 self-end sm:self-auto"
          title="تحديث القائمة"
        >
          <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      {/* Metrics Notice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="wolf-glass rounded-2xl p-4 border border-emerald-500/25 bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-300">طلبات العضوية الجديدة</div>
              <div className="text-xs text-zinc-500 mt-0.5">الحسابات المعلقة بانتظار تفعيل الاستقبال</div>
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{pendingMembers.length}</div>
        </div>

        <div className="wolf-glass rounded-2xl p-4 border border-zinc-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-400">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-xs text-zinc-400 leading-relaxed">
            بمجرد الضغط على <strong className="text-emerald-400">موافقة وتفعيل</strong>، يتم إرسال إشعار للنظام ويتمكن العضو من تسجيل الدخول واستلام لوكر.
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-zinc-950/80 p-3 sm:p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-zinc-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم العضو، كود العضوية، الهاتف، أو البريد الإلكتروني..."
          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none font-cairo"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-lg bg-zinc-900"
          >
            مسح
          </button>
        )}
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-20 text-center space-y-4 wolf-glass rounded-3xl border border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p className="text-xs sm:text-sm text-zinc-400 font-bold">جاري تحميل طلبات الحسابات المعلقة...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-20 text-center space-y-4 wolf-glass rounded-3xl border border-emerald-500/20 p-8">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black text-white">
              {search ? 'لا توجد نتائج مطابقة' : 'لا توجد اشتراكات أو طلبات معلقة! 🎉'}
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              {search
                ? `لم يتم العثور على طلبات تطابق كلمة البحث "${search}"`
                : 'جميع حسابات واشتراكات الأعضاء معتمدة ومفعلة بنجاح.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.map((member) => {
            const isProcessingThis = processingId === member.id;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="wolf-glass rounded-2xl sm:rounded-3xl p-5 border border-emerald-500/25 hover:border-emerald-500/60 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                {/* Top Accent Line */}
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 opacity-60" />

                {/* Member Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-emerald-500/30 text-emerald-400 font-black text-base flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:scale-105 transition-transform">
                      {(member.name || 'عضو').charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {member.name || 'عضو جديد'}
                      </h4>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-zinc-400 font-bold">
                          #{member.code || member.id}
                        </span>
                        {member.code && (
                          <button
                            type="button"
                            onClick={() => handleCopyCode(member.code)}
                            className="p-0.5 text-zinc-500 hover:text-emerald-400 transition-colors"
                            title="نسخ كود العضو"
                          >
                            {copiedCode === member.code ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          بانتظار الموافقة
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Member Details */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/50 border border-zinc-800 text-xs">
                  {member.phoneNumber && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-zinc-500 block">رقم الهاتف</span>
                      <a
                        href={`tel:${member.phoneNumber}`}
                        className="font-mono font-bold text-zinc-300 text-[11px] hover:text-emerald-400 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{member.phoneNumber}</span>
                      </a>
                    </div>
                  )}

                  {member.createdAt && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-zinc-500 block">تاريخ التسجيل</span>
                      <span className="font-mono text-zinc-300 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        <span>{formatDateArabic(member.createdAt)}</span>
                      </span>
                    </div>
                  )}

                  {member.email && (
                    <div className="col-span-2 pt-1 border-t border-zinc-850 text-[11px] text-zinc-400 flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="font-mono truncate">{member.email}</span>
                    </div>
                  )}
                </div>

                {/* 1-Click Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isProcessingThis}
                    onClick={() => handleApprove(member)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-black text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                    title="الموافقة وتفعيل حساب العضو"
                  >
                    {isProcessingThis && actionType === 'approve' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري التفعيل...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>موافقة وتفعيل</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingThis}
                    onClick={() => handleReject(member)}
                    className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                    title="رفض الطلب"
                  >
                    {isProcessingThis && actionType === 'reject' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>رفض</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default PendingSubscriptionsPage;
