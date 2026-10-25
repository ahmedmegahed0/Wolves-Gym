import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  KeyRound, 
  ArrowRight, 
  Search, 
  RotateCw, 
  LogOut, 
  Clock, 
  User, 
  Phone, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  ShieldAlert,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { lockerService, attendanceService } from '../../services/apiClient';
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
 * Format duration of locker usage
 */
const getLockerUsageDuration = (checkInIso) => {
  if (!checkInIso) return '—';
  try {
    const start = new Date(checkInIso).getTime();
    const diffMins = Math.max(0, Math.floor((Date.now() - start) / (1000 * 60)));

    if (diffMins < 60) return `${diffMins} دقيقة`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} س ${mins > 0 ? `و ${mins} د` : ''}`;
  } catch {
    return '—';
  }
};

/**
 * OccupiedLockersPage Component
 * Displays currently occupied lockers with assigned member details and instant release/checkout
 */
export const OccupiedLockersPage = ({ 
  onBack, 
  onNavigateLockers, 
  onCheckOutSuccess 
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [lockers, setLockers] = useState([]);
  const [activeAttendances, setActiveAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [freeingLockerCode, setFreeingLockerCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Fetch Lockers and Active Attendees
  const fetchLockersData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [lockersRes, attendancesRes] = await Promise.allSettled([
        lockerService.getLockers(),
        attendanceService.getAttendances({ isCurrentlyAttending: true, pageSize: 100 }),
      ]);

      const lockersList = lockersRes.status === 'fulfilled' && Array.isArray(lockersRes.value)
        ? lockersRes.value
        : [];

      const attendeesList = attendancesRes.status === 'fulfilled' && Array.isArray(attendancesRes.value?.data)
        ? attendancesRes.value.data
        : [];

      setLockers(lockersList);
      setActiveAttendances(attendeesList);
    } catch (err) {
      console.error('Failed to load lockers and attendees:', err);
      toastError('خطأ في التحميل', 'تعذر تحميل بيانات اللوكرات.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchLockersData();
  }, [fetchLockersData]);

  // Combine occupied lockers with member information
  const occupiedLockerItems = useMemo(() => {
    // 1. Map active attendances that have lockers
    const mapByLockerNum = new Map();
    activeAttendances.forEach((att) => {
      const num = att.lockerNumber || att.lockerId;
      if (num) {
        mapByLockerNum.set(Number(num), att);
      }
    });

    // 2. Identify all lockers that are not available or mapped to active attendee
    const occupied = [];

    // From actual locker entity list
    lockers.forEach((locker) => {
      const num = Number(locker.number);
      const attendee = mapByLockerNum.get(num);

      if (!locker.isAvailable || attendee) {
        occupied.push({
          lockerId: locker.id,
          lockerNumber: locker.number,
          isActive: locker.isActive,
          customerName: attendee?.customerName || 'عضو الصالة (لوكر مشغول)',
          attendanceCode: attendee?.attendanceCode || null,
          customerPhoneNumber: attendee?.customerPhoneNumber || null,
          checkInAt: attendee?.checkInAt || locker.updatedAt || locker.createdAt,
        });
        mapByLockerNum.delete(num); // avoid double inclusion
      }
    });

    // Any attendees with locker not in locker table
    mapByLockerNum.forEach((attendee, num) => {
      occupied.push({
        lockerId: attendee.lockerId || num,
        lockerNumber: num,
        isActive: true,
        customerName: attendee.customerName || 'عضو الصالة',
        attendanceCode: attendee.attendanceCode,
        customerPhoneNumber: attendee.customerPhoneNumber,
        checkInAt: attendee.checkInAt,
      });
    });

    // Sort by locker number
    return occupied.sort((a, b) => Number(a.lockerNumber) - Number(b.lockerNumber));
  }, [lockers, activeAttendances]);

  // Handle Copy Member Code
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Instant Release / Checkout
  const handleFreeLocker = async (item) => {
    const code = item.attendanceCode;
    if (!code) {
      toastError('كود غير متاح', 'يمكن إخلاء اللوكر من شاشة إدارة اللوكرات بالكامل.');
      if (onNavigateLockers) onNavigateLockers();
      return;
    }

    setFreeingLockerCode(code);
    try {
      await attendanceService.checkOut({ code });

      // Optimistic update
      setActiveAttendances((prev) => prev.filter((a) => a.attendanceCode !== code));
      setLockers((prev) =>
        prev.map((l) => (Number(l.number) === Number(item.lockerNumber) ? { ...l, isAvailable: true } : l))
      );

      toastSuccess(
        'تم إخلاء الدولاب بنجاح 🔑',
        `تم تسجيل خروج العضو وإخلاء لوكر #${item.lockerNumber} وأصبح متاحاً للأعضاء الآن.`
      );

      if (onCheckOutSuccess) {
        onCheckOutSuccess({
          code,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Free locker checkout error:', err);
      const msg = err.friendlyMessage || err.message || 'فشل إخلاء اللوكر.';
      toastError('فشل إخلاء اللوكر', msg);
    } finally {
      setFreeingLockerCode(null);
    }
  };

  // Filtered list
  const filteredOccupiedLockers = useMemo(() => {
    if (!search.trim()) return occupiedLockerItems;
    const query = search.trim().toLowerCase();
    return occupiedLockerItems.filter((item) => {
      const num = String(item.lockerNumber || '');
      const name = String(item.customerName || '').toLowerCase();
      const code = String(item.attendanceCode || '').toLowerCase();
      const phone = String(item.customerPhoneNumber || '');
      return num.includes(query) || name.includes(query) || code.includes(query) || phone.includes(query);
    });
  }, [occupiedLockerItems, search]);

  const totalLockersCount = lockers.length || occupiedLockerItems.length;
  const occupiedCount = occupiedLockerItems.length;
  const availableCount = Math.max(0, totalLockersCount - occupiedCount);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/80 p-4 sm:p-6 rounded-3xl border border-amber-500/25 wolf-glass shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700" />

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 sm:p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center cursor-pointer group"
            title="العودة للنظرة العامة"
          >
            <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                اللوكرات المشغولة حالياً
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow flex items-center gap-1 font-mono">
                <KeyRound className="w-3.5 h-3.5" />
                <span>{occupiedCount} دولاب مشغول</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              تفاصيل الدواليب المسلمة للأعضاء مع أوقات الاستلام وإمكانية الإخلاء الفوري بنقرة واحدة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => fetchLockersData(true)}
            disabled={loading || refreshing}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            title="تحديث البيانات"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">تحديث</span>
          </button>

          {onNavigateLockers && (
            <button
              type="button"
              onClick={onNavigateLockers}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-gold-glow flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>خريطة اللوكرات بالكامل</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="wolf-glass rounded-2xl p-3.5 sm:p-4 border border-amber-500/30 bg-amber-500/5">
          <div className="text-[10px] sm:text-xs font-bold text-zinc-400">الدواليب المشغولة</div>
          <div className="text-lg sm:text-2xl font-black text-amber-400 font-mono mt-0.5">{occupiedCount}</div>
          <div className="text-[10px] text-amber-400 font-bold mt-0.5">مسلمة للأعضاء</div>
        </div>

        <div className="wolf-glass rounded-2xl p-3.5 sm:p-4 border border-zinc-800">
          <div className="text-[10px] sm:text-xs font-bold text-zinc-400">الدواليب الشاغرة</div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">{availableCount}</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-0.5">متاحة للاستلام</div>
        </div>

        <div className="wolf-glass rounded-2xl p-3.5 sm:p-4 border border-zinc-800">
          <div className="text-[10px] sm:text-xs font-bold text-zinc-400">إجمالي سعة اللوكرات</div>
          <div className="text-lg sm:text-2xl font-black text-white font-mono mt-0.5">{totalLockersCount}</div>
          <div className="text-[10px] text-zinc-400 font-bold mt-0.5">دولاب بالصالة</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-zinc-950/80 p-3 sm:p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-zinc-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث برقم الدولاب، اسم العضو، كود الحضور، أو الهاتف..."
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

      {/* Main Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-4 wolf-glass rounded-3xl border border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
          <p className="text-xs sm:text-sm text-zinc-400 font-bold">جاري فحص حالة اللوكرات المشغولة...</p>
        </div>
      ) : filteredOccupiedLockers.length === 0 ? (
        <div className="py-20 text-center space-y-4 wolf-glass rounded-3xl border border-amber-500/20 p-8">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-gold-glow">
            <KeyRound className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black text-white">
              {search ? 'لا توجد نتائج مطابقة' : 'جميع اللوكرات شاغرة ومتاحة!'}
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              {search
                ? `لم يتم العثور على لوكر مطابق للبحث "${search}"`
                : 'لا توجد دواليب مشغولة حالياً، جميع دواليب الصالة جاهزة للتسليم للأعضاء الجدد.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOccupiedLockers.map((item) => {
            const isFreeingThis = freeingLockerCode === item.attendanceCode;

            return (
              <motion.div
                key={`locker-${item.lockerNumber}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="wolf-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-amber-500/25 hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                {/* Top Badge & Number */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-400 flex flex-col items-center justify-center shadow-gold-glow group-hover:scale-105 transition-transform">
                      <KeyRound className="w-5 h-5 mb-0.5" />
                      <span className="text-xs font-mono font-black">#{item.lockerNumber}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                        دولاب مسلم
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {item.customerName}
                      </h4>
                      {item.attendanceCode && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-mono text-zinc-400">
                            #{item.attendanceCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(item.attendanceCode)}
                            className="p-0.5 text-zinc-500 hover:text-amber-400 transition-colors"
                            title="نسخ كود العضو"
                          >
                            {copiedCode === item.attendanceCode ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                    مشغول
                  </span>
                </div>

                {/* Usage Time Breakdown */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/50 border border-zinc-800 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">وقت الاستلام:</span>
                    <span className="font-mono font-bold text-zinc-300 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {formatTimeOnly(item.checkInAt)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">مدة الاستخدام:</span>
                    <span className="font-mono font-black text-amber-400 text-[11px]">
                      {getLockerUsageDuration(item.checkInAt)}
                    </span>
                  </div>

                  {item.customerPhoneNumber && (
                    <div className="col-span-2 pt-1.5 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span className="font-mono">{item.customerPhoneNumber}</span>
                      </span>
                      <a
                        href={`tel:${item.customerPhoneNumber}`}
                        className="text-amber-400 hover:underline text-[10px]"
                      >
                        اتصال
                      </a>
                    </div>
                  )}
                </div>

                {/* Action: Free Locker / Checkout */}
                <button
                  type="button"
                  disabled={isFreeingThis}
                  onClick={() => handleFreeLocker(item)}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  title="إخلاء اللوكر وتسجيل خروج العضو"
                >
                  {isFreeingThis ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري إخلاء اللوكر...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>إخلاء اللوكر وتسجيل خروج</span>
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default OccupiedLockersPage;
