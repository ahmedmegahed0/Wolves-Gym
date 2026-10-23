import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  QrCode, 
  Calendar, 
  Clock, 
  Crown, 
  RefreshCw, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  Dumbbell,
  ShieldCheck,
  User
} from 'lucide-react';
import { trainersService } from '../../services/trainersService';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';

/**
 * TrainerCustomersList Component
 * Displays subscribed athletes/clients for a coach (GET /api/Trainers/{id}/customers)
 * Can be rendered in:
 * 1. Admin/Management View (Inside modal when clicking "عرض المتدربين" on coach row)
 * 2. Coach Portal View (TrainerMeDashboard)
 */
export const TrainerCustomersList = ({ 
  trainerId, 
  trainerName = '', 
  isOpen = true, 
  onClose = null, 
  isEmbedded = false 
}) => {
  const { error: toastError } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = useCallback(async (isManual = false) => {
    if (!trainerId) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await trainersService.getTrainerCustomers(trainerId, {
        pageNumber,
        pageSize,
        search: debouncedSearch.trim(),
      });

      setCustomers(Array.isArray(res?.data) ? res.data : []);
      setTotalCount(res?.totalCount ?? 0);
      setTotalPages(res?.totalPages ?? 1);
    } catch (err) {
      console.error('Error fetching trainer customers:', err);
      toastError('تعذر تحميل قائمة المتدربين', err.message || 'حدث خطأ أثناء جلب المشتركين.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trainerId, pageNumber, pageSize, debouncedSearch, toastError]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const content = (
    <div dir="rtl" className="space-y-4 font-cairo">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-gold-glow">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                متدربو وأبطال الكابتن
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {totalCount} لاعب
              </span>
            </div>
            {trainerName && (
              <p className="text-xs text-zinc-400">
                إشراف ومتابعة الكابتن: <span className="font-bold text-white">{trainerName}</span>
              </p>
            )}
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors self-end sm:self-auto cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search and Refresh Bar */}
      <div className="flex items-center justify-between gap-3 bg-black/60 p-2.5 rounded-2xl border border-zinc-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageNumber(1);
            }}
            placeholder="بحث باسم المتدرب، كود العضو، أو رقم الهاتف..."
            className="w-full bg-zinc-900 text-white placeholder-zinc-500 text-xs rounded-xl pr-9 pl-4 py-2 border border-zinc-800 focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={() => fetchCustomers(true)}
          disabled={refreshing}
          className="p-2 rounded-xl bg-zinc-900 text-amber-400 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer shrink-0"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Grid of Athletes */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-bold">جاري تحميل قائمة المتدربين...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="py-14 text-center space-y-3 bg-black/40 rounded-3xl border border-zinc-800/80 p-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">لا يوجد متدربين مسجلين مع هذا الكابتن</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {search ? 'لم نجد أي لاعب يطابق عبارة البحث الحالية.' : 'لم يتم تسجيل أي اشتراك تدريب خاص (Private Trainer) مع هذا الكابتن بعد.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customers.map((c) => {
            const customerId = c.customerId || c.id;
            const isActive = Boolean(c.isActive ?? true);
            const approval = Number(c.approvalStatus ?? 1);

            return (
              <div
                key={c.id || customerId}
                className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 hover:border-amber-500/30 transition-all space-y-3 relative group"
              >
                {/* Top Row: Name, Avatar, and Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm font-mono shrink-0">
                      {c.name ? c.name.slice(0, 1) : 'W'}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                        {c.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {c.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400 font-bold">
                            #{c.code}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {isActive ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {c.packageName && (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span className="truncate max-w-[120px]">{c.packageName}</span>
                    </span>
                  )}
                </div>

                {/* Contact and Subscription Details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/50 p-2.5 rounded-xl border border-zinc-850">
                  <div className="space-y-0.5">
                    <span className="text-zinc-500 text-[10px] block">رقم الهاتف:</span>
                    <span dir="ltr" className="font-mono text-zinc-300 font-bold block text-right">
                      {c.phoneNumber || '—'}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-zinc-500 text-[10px] block">مدة الباقة:</span>
                    <span className="font-mono text-amber-400 font-bold block">
                      {c.packageDuration ? `${c.packageDuration} يوم` : '—'}
                    </span>
                  </div>

                  {c.startDate && (
                    <div className="space-y-0.5 col-span-2 pt-1 border-t border-zinc-850 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>فترة الاشتراك:</span>
                      <span className="font-mono text-zinc-300">
                        {new Date(c.startDate).toLocaleDateString('ar-EG')} {c.endDate ? `إلى ${new Date(c.endDate).toLocaleDateString('ar-EG')}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-zinc-500 font-mono">
            صفحة {pageNumber} من {totalPages} ({totalCount} متدرب)
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber((p) => p + 1)}
              className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        dir="rtl" 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md font-cairo"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="wolf-glass bg-zinc-950/95 border border-amber-500/30 rounded-3xl p-4 sm:p-7 max-w-3xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Gold Accent */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 opacity-90" />
          <div className="flex-1 overflow-y-auto gold-scrollbar px-1 py-1">
            {content}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TrainerCustomersList;
