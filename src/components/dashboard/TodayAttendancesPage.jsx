import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ArrowRight, 
  Search, 
  RotateCw, 
  Clock, 
  KeyRound, 
  LogOut, 
  CheckCircle2, 
  Users, 
  Flame, 
  Calendar,
  Filter,
  Plus,
  Loader2,
  Copy
} from 'lucide-react';
import { attendanceService } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

/**
 * Format ISO time to 12h Arabic time string (e.g. 02:45 م)
 */
const formatTimeOnly = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
};

/**
 * Calculate session duration
 */
const getSessionDuration = (checkInIso, checkOutIso) => {
  if (!checkInIso) return '—';
  try {
    const start = new Date(checkInIso).getTime();
    const end = checkOutIso ? new Date(checkOutIso).getTime() : Date.now();
    const diffMins = Math.max(0, Math.floor((end - start) / (1000 * 60)));

    if (diffMins < 60) {
      return `${diffMins} دقيقة`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ''}`;
  } catch {
    return '—';
  }
};

/**
 * TodayAttendancesPage Component
 * Displays complete check-in/out log for today
 */
export const TodayAttendancesPage = ({ 
  onBack, 
  onCheckInNew, 
  onCheckOutSuccess 
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'inside' | 'completed'
  const [checkingOutCode, setCheckingOutCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Compute Today's starting ISO string (YYYY-MM-DDT00:00:00)
  const todayStartIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}T00:00:00`;
  }, []);

  // Today Arabic formatted string
  const todayFormattedDate = useMemo(() => {
    return new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Fetch attendances for today
  const fetchTodayAttendances = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await attendanceService.getAttendances({
        fromDate: todayStartIso,
        pageSize: 100,
      });

      const list = Array.isArray(res?.data) ? res.data : [];
      setAttendances(list);
    } catch (err) {
      console.error('Failed to load today attendances:', err);
      toastError('خطأ في التحميل', 'تعذر جلب سجلات حضور اليوم.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [todayStartIso, toastError]);

  useEffect(() => {
    fetchTodayAttendances();
  }, [fetchTodayAttendances]);

  // Handle Copy Code
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Instant Check-out for someone still inside
  const handleQuickCheckout = async (record) => {
    const code = record.attendanceCode;
    if (!code) return;

    setCheckingOutCode(code);
    try {
      await attendanceService.checkOut({ code });

      // Optimistic update
      setAttendances((prev) =>
        prev.map((item) => {
          if (item.id === record.id || item.attendanceCode === code) {
            return {
              ...item,
              isCurrentlyAttending: false,
              checkOutAt: new Date().toISOString(),
            };
          }
          return item;
        })
      );

      toastSuccess(
        'تم تسجيل خروج الوحش',
        `تم تسجيل خروج (${record.customerName || `كود ${code}`}) بنجاح.`
      );

      if (onCheckOutSuccess) {
        onCheckOutSuccess({
          code,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Check-out error:', err);
      const msg = err.friendlyMessage || err.message || 'فشل تسجيل خروج العضو.';
      toastError('فشل تسجيل الخروج', msg);
    } finally {
      setCheckingOutCode(null);
    }
  };

  // Summary Metrics
  const totalCount = attendances.length;
  const currentlyInsideCount = attendances.filter((a) => a.isCurrentlyAttending).length;
  const completedCount = totalCount - currentlyInsideCount;

  // Filtered attendances
  const filteredAttendances = useMemo(() => {
    return attendances.filter((item) => {
      // Status filter
      if (statusFilter === 'inside' && !item.isCurrentlyAttending) return false;
      if (statusFilter === 'completed' && item.isCurrentlyAttending) return false;

      // Search query
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const name = String(item.customerName || '').toLowerCase();
        const code = String(item.attendanceCode || '').toLowerCase();
        const locker = String(item.lockerNumber || item.lockerId || '');
        const phone = String(item.customerPhoneNumber || '');
        return (
          name.includes(query) ||
          code.includes(query) ||
          locker.includes(query) ||
          phone.includes(query)
        );
      }
      return true;
    });
  }, [attendances, statusFilter, search]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/80 p-4 sm:p-6 rounded-3xl border border-yellow-500/25 wolf-glass shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-500" />

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 sm:p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border border-yellow-500/30 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center cursor-pointer group"
            title="العودة للنظرة العامة"
          >
            <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                سجل دخول اليوم
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-gold-glow flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                <span>{totalCount} جلسة اليوم</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-yellow-400" />
              <span>{todayFormattedDate}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => fetchTodayAttendances(true)}
            disabled={loading || refreshing}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border border-yellow-500/30 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            title="تحديث البيانات"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">تحديث</span>
          </button>

          {onCheckInNew && (
            <button
              type="button"
              onClick={onCheckInNew}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 hover:from-yellow-400 hover:to-amber-500 text-black text-xs font-black shadow-gold-glow flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>تسجيل دخول وحش</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`wolf-glass rounded-2xl p-3.5 sm:p-4 border text-right transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'border-yellow-400/80 bg-yellow-500/10 shadow-gold-glow'
              : 'border-zinc-800 hover:border-yellow-500/30'
          }`}
        >
          <div className="text-[10px] sm:text-xs font-bold text-zinc-400">إجمالي حضور اليوم</div>
          <div className="text-lg sm:text-2xl font-black text-white font-mono mt-0.5">{totalCount}</div>
          <div className="text-[10px] text-yellow-400 font-bold mt-0.5">كل الجلسات</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('inside')}
          className={`wolf-glass rounded-2xl p-3.5 sm:p-4 border text-right transition-all cursor-pointer ${
            statusFilter === 'inside'
              ? 'border-emerald-400/80 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'border-zinc-800 hover:border-emerald-500/30'
          }`}
        >
          <div className="text-[10px] sm:text-xs font-bold text-zinc-400">موجودين الآن بالتمرين</div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">{currentlyInsideCount}</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>جلسات جارية</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`wolf-glass rounded-2xl p-3.5 sm:p-4 border text-right transition-all cursor-pointer ${
            statusFilter === 'completed'
              ? 'border-amber-400/80 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'border-zinc-800 hover:border-amber-500/30'
          }`}
        >
          <div className="text-[10px] sm:text-xs font-bold text-zinc-400">غادروا الصالة</div>
          <div className="text-lg sm:text-2xl font-black text-zinc-300 font-mono mt-0.5">{completedCount}</div>
          <div className="text-[10px] text-zinc-400 font-bold mt-0.5">جلسات منتهية</div>
        </button>
      </div>

      {/* Search Input & Status Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-950/80 p-3 sm:p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2.5 flex-1 bg-zinc-900/80 px-3 py-2 rounded-xl border border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، كود العضو، أو رقم اللوكر..."
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none font-cairo"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-xs text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-800"
            >
              مسح
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-yellow-500 text-black shadow-gold-glow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            الكل ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inside')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'inside'
                ? 'bg-emerald-500 text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            بالداخل ({currentlyInsideCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-amber-600 text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            غادروا ({completedCount})
          </button>
        </div>
      </div>

      {/* Attendances List */}
      {loading ? (
        <div className="py-20 text-center space-y-4 wolf-glass rounded-3xl border border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mx-auto" />
          <p className="text-xs sm:text-sm text-zinc-400 font-bold">جاري تحميل سجلات حضور اليوم...</p>
        </div>
      ) : filteredAttendances.length === 0 ? (
        <div className="py-20 text-center space-y-4 wolf-glass rounded-3xl border border-yellow-500/20 p-8">
          <div className="w-16 h-16 rounded-3xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center justify-center mx-auto shadow-gold-glow">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black text-white">لا توجد حركات حضور مطابقة</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              {search
                ? `لم يتم العثور على سجلات تطابق كلمة البحث "${search}"`
                : 'لم يتم تسجيل حركات حضور جديدة لليوم حتى الآن.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAttendances.map((item) => {
            const isInside = item.isCurrentlyAttending;
            const lockerNum = item.lockerNumber || item.lockerId;
            const isCheckingOutThis = checkingOutCode === item.attendanceCode;

            return (
              <motion.div
                key={item.id || `${item.attendanceCode}-${item.checkInAt}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="wolf-glass rounded-2xl p-4 sm:p-5 border border-zinc-800 hover:border-yellow-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Member Info */}
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 text-yellow-400 font-black text-sm flex items-center justify-center group-hover:border-yellow-500/40 group-hover:scale-105 transition-all">
                      {(item.customerName || 'وحش').charAt(0).toUpperCase()}
                    </div>
                    {isInside && (
                      <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black animate-pulse" title="موجود بالصالة الآن" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-black text-white group-hover:text-yellow-400 transition-colors">
                        {item.customerName || 'عضو الصالة'}
                      </h4>
                      {isInside ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>بالتمرين الآن</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-400">
                          تم المغادرة
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                      <span className="font-mono text-zinc-500">#{item.attendanceCode || '—'}</span>
                      {item.attendanceCode && (
                        <button
                          type="button"
                          onClick={() => handleCopyCode(item.attendanceCode)}
                          className="text-zinc-500 hover:text-yellow-400 transition-colors cursor-pointer"
                          title="نسخ كود الحضور"
                        >
                          {copiedCode === item.attendanceCode ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                      {item.customerPhoneNumber && (
                        <span className="text-zinc-500 font-mono hidden sm:inline">
                          | {item.customerPhoneNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Times & Session Info */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                  {/* Locker */}
                  {lockerNum ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono font-bold">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>دولاب #{lockerNum}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-lg">بدون لوكر</span>
                  )}

                  {/* Check-In */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">وقت الدخول</span>
                    <span className="font-mono font-bold text-white text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3 text-yellow-400" />
                      {formatTimeOnly(item.checkInAt)}
                    </span>
                  </div>

                  {/* Check-Out */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">وقت الخروج</span>
                    <span className="font-mono font-bold text-zinc-300 text-xs">
                      {item.checkOutAt ? formatTimeOnly(item.checkOutAt) : 'لا يزال بالصالة'}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">مدة الجلسة</span>
                    <span className={`font-mono font-black text-xs ${isInside ? 'text-amber-400' : 'text-zinc-300'}`}>
                      {getSessionDuration(item.checkInAt, item.checkOutAt)}
                    </span>
                  </div>

                  {/* Action for active users */}
                  {isInside && (
                    <button
                      type="button"
                      disabled={isCheckingOutThis}
                      onClick={() => handleQuickCheckout(item)}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                      title="تسجيل خروج فوري"
                    >
                      {isCheckingOutThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>خروج...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="w-3.5 h-3.5" />
                          <span>تسجيل خروج</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default TodayAttendancesPage;
