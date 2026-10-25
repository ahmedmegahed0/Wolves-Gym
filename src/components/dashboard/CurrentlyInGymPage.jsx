import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ArrowRight, 
  Search, 
  RotateCw, 
  LogOut, 
  Clock, 
  KeyRound, 
  Phone, 
  Plus, 
  CheckCircle2, 
  Copy, 
  Flame, 
  Loader2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { attendanceService } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

/**
 * Format minutes elapsed from ISO time string to Arabic string
 */
const getDurationString = (checkInIso) => {
  if (!checkInIso) return '—';
  try {
    const start = new Date(checkInIso).getTime();
    const now = Date.now();
    const diffMins = Math.max(0, Math.floor((now - start) / (1000 * 60)));
    
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
 * CurrentlyInGymPage Component
 * Displays live table of all members currently inside the gym (isCurrentlyAttending = true)
 * Includes real-time table layout, pagination, search, and 1-click Check-Out
 */
export const CurrentlyInGymPage = ({ 
  onBack, 
  onCheckInNew, 
  onCheckOutSuccess 
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [checkingOutCode, setCheckingOutCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Pagination State
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch live attendees
  const fetchCurrentAttendees = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await attendanceService.getAttendances({
        isCurrentlyAttending: true,
        pageSize: 100,
      });

      const list = Array.isArray(res?.data) ? res.data : [];
      setAttendees(list);
    } catch (err) {
      console.error('Failed to load current gym attendees:', err);
      toastError('خطأ في التحميل', 'تعذر تحميل قائمة الأعضاء في الجيم حالياً.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchCurrentAttendees();
    // Auto-refresh every 20 seconds to keep durations accurate
    const interval = setInterval(() => {
      fetchCurrentAttendees(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchCurrentAttendees]);

  // Handle Copy Member Code
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Handle Instant 1-Click Check-Out
  const handleQuickCheckout = async (attendee) => {
    const memberCode = attendee.attendanceCode;
    if (!memberCode) {
      toastError('كود غير متوفر', 'كود العضو غير متاح لتسجيل الخروج.');
      return;
    }

    setCheckingOutCode(memberCode);
    try {
      await attendanceService.checkOut({ code: memberCode });

      // Optimistic local state update
      setAttendees((prev) => prev.filter((a) => a.id !== attendee.id && a.attendanceCode !== memberCode));

      toastSuccess(
        'تم تسجيل خروج الوحش 🏁',
        `تم تسجيل خروج (${attendee.customerName || `كود ${memberCode}`}) وإخلاء دولاب #${attendee.lockerNumber || attendee.lockerId || '—'} بنجاح.`
      );

      if (onCheckOutSuccess) {
        onCheckOutSuccess({
          code: memberCode,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Check-out error:', err);
      const msg = err.friendlyMessage || err.response?.data?.detail || err.message || 'فشل تسجيل خروج العضو.';
      toastError('فشل تسجيل الخروج', msg);
    } finally {
      setCheckingOutCode(null);
    }
  };

  // Filtered attendees by search
  const filteredAttendees = useMemo(() => {
    if (!search.trim()) return attendees;
    const query = search.trim().toLowerCase();
    return attendees.filter((a) => {
      const name = String(a.customerName || '').toLowerCase();
      const code = String(a.attendanceCode || '').toLowerCase();
      const locker = String(a.lockerNumber || a.lockerId || '');
      const phone = String(a.customerPhoneNumber || '');
      return (
        name.includes(query) ||
        code.includes(query) ||
        locker.includes(query) ||
        phone.includes(query)
      );
    });
  }, [attendees, search]);

  // Reset pageNumber when search query or list size changes
  useEffect(() => {
    setPageNumber(1);
  }, [search, pageSize]);

  // Pagination Calculations
  const totalCount = filteredAttendees.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const paginatedAttendees = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filteredAttendees.slice(start, start + pageSize);
  }, [filteredAttendees, pageNumber, pageSize]);

  const totalOccupiedLockers = useMemo(() => {
    return attendees.filter((a) => a.lockerNumber || a.lockerId).length;
  }, [attendees]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.25 }}
      dir="rtl"
      className="space-y-6 font-cairo"
    >
      {/* Top Header & Breadcrumb */}
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
                الوحوش في الجيم الآن
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-black" />
                <span>{attendees.length} بالتمرين</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              جدول تفصيلي مباشر لجميع الأعضاء المتواجدين في صالة التمرين مع أرقام اللوكرات وخيار الخروج الفوري
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => fetchCurrentAttendees(true)}
            disabled={loading || refreshing}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            title="تحديث القائمة الآن"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">تحديث</span>
          </button>

          {onCheckInNew && (
            <button
              type="button"
              onClick={onCheckInNew}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-gold-glow flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>تسجيل دخول وحش</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="wolf-glass rounded-2xl p-3.5 sm:p-4 border border-amber-500/20 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-zinc-400">إجمالي الموجودين</div>
            <div className="text-lg sm:text-2xl font-black text-white font-mono">{attendees.length}</div>
          </div>
        </div>

        <div className="wolf-glass rounded-2xl p-3.5 sm:p-4 border border-amber-500/20 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-zinc-400">لوكرات مستلمة</div>
            <div className="text-lg sm:text-2xl font-black text-white font-mono">{totalOccupiedLockers}</div>
          </div>
        </div>

        <div className="wolf-glass rounded-2xl p-3.5 sm:p-4 border border-amber-500/20 col-span-2 sm:col-span-1 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-zinc-400">حالة الصالة</div>
            <div className="text-xs sm:text-sm font-black text-emerald-400">جلسات نشطة الآن</div>
          </div>
        </div>
      </div>

      {/* Search Input & Page Size Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950/80 p-3 sm:p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3 flex-1">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم العضو، كود الحضور، رقم اللوكر، أو رقم الهاتف..."
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none font-cairo"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-lg bg-zinc-900 shrink-0"
            >
              مسح
            </button>
          )}
        </div>

        {/* Page Size Options */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs">
          <span className="text-zinc-500 font-bold">عرض بالصفحة:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-800 text-amber-400 font-bold rounded-xl px-2.5 py-1.5 focus:outline-none font-mono cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="py-20 text-center space-y-4 wolf-glass rounded-3xl border border-zinc-800">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
          <p className="text-xs sm:text-sm text-zinc-400 font-bold">جاري تحميل جدول الوحوش في الجيم الآن...</p>
        </div>
      ) : filteredAttendees.length === 0 ? (
        <div className="py-20 text-center space-y-4 wolf-glass rounded-3xl border border-amber-500/20 p-8">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-gold-glow">
            <Users className="w-8 h-8" />
          </div>
          {search ? (
            <div>
              <h4 className="text-base font-black text-white">لا توجد نتائج مطابقة</h4>
              <p className="text-xs text-zinc-400 mt-1">لم يتم العثور على أعضاء مطابقين لكلمة البحث "{search}"</p>
            </div>
          ) : (
            <div>
              <h4 className="text-base sm:text-lg font-black text-white">لا يوجد أعضاء في الصالة حالياً</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                الصالة شاغرة وجاهزة لاستقبال الوحوش. يمكنك تسجيل دخول عضو جديد واستلام لوكر بنقرة واحدة.
              </p>
              {onCheckInNew && (
                <button
                  type="button"
                  onClick={onCheckInNew}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-black shadow-gold-glow inline-flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>تسجيل دخول وحش الآن</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="wolf-glass rounded-2xl sm:rounded-3xl border border-amber-500/25 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto gold-scrollbar">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-zinc-950/90 border-b border-zinc-800 text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3.5 px-3 sm:px-4 text-center w-12">#</th>
                    <th className="py-3.5 px-3 sm:px-4">العضو</th>
                    <th className="py-3.5 px-3 sm:px-4 text-center">كود الحضور</th>
                    <th className="py-3.5 px-3 sm:px-4 text-center">اللوكر</th>
                    <th className="py-3.5 px-3 sm:px-4 text-center">وقت الدخول</th>
                    <th className="py-3.5 px-3 sm:px-4 text-center">مدة التمرين</th>
                    <th className="py-3.5 px-3 sm:px-4 text-center">رقم الهاتف</th>
                    <th className="py-3.5 px-3 sm:px-4 text-center">إجراء الخروج</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/80 text-xs sm:text-sm">
                  {paginatedAttendees.map((attendee, index) => {
                    const rowNumber = (pageNumber - 1) * pageSize + index + 1;
                    const isCheckingOutThis = checkingOutCode === attendee.attendanceCode;
                    const lockerNum = attendee.lockerNumber || attendee.lockerId;

                    return (
                      <tr 
                        key={attendee.id || attendee.attendanceCode || index}
                        className="hover:bg-amber-500/5 transition-colors group"
                      >
                        {/* Index */}
                        <td className="py-3.5 px-3 sm:px-4 text-center font-mono text-zinc-500 text-xs">
                          {rowNumber}
                        </td>

                        {/* Member Name & Avatar */}
                        <td className="py-3.5 px-3 sm:px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900 border border-amber-500/30 text-amber-400 font-black text-xs sm:text-sm flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                {(attendee.customerName || 'وحش').charAt(0).toUpperCase()}
                              </div>
                              <span 
                                className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black animate-pulse" 
                                title="بالتمرين حالياً" 
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-black text-white group-hover:text-amber-400 transition-colors line-clamp-1 text-xs sm:text-sm">
                                {attendee.customerName || 'عضو الصالة'}
                              </div>
                              <span className="text-[10px] text-zinc-500 block">
                                وحش الصالة
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Attendance Code with Copy */}
                        <td className="py-3.5 px-3 sm:px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs font-bold">
                            <span>#{attendee.attendanceCode || '—'}</span>
                            {attendee.attendanceCode && (
                              <button
                                type="button"
                                onClick={() => handleCopyCode(attendee.attendanceCode)}
                                className="text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
                                title="نسخ الكود"
                              >
                                {copiedCode === attendee.attendanceCode ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Locker Number */}
                        <td className="py-3.5 px-3 sm:px-4 text-center">
                          {lockerNum ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 font-mono text-xs font-black shadow-sm">
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>دولاب #{lockerNum}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md">
                              بدون لوكر
                            </span>
                          )}
                        </td>

                        {/* Check-In Time */}
                        <td className="py-3.5 px-3 sm:px-4 text-center font-mono font-bold text-zinc-300 text-xs">
                          <div className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>{formatTimeOnly(attendee.checkInAt)}</span>
                          </div>
                        </td>

                        {/* Duration Elapsed */}
                        <td className="py-3.5 px-3 sm:px-4 text-center font-mono font-black text-amber-400 text-xs">
                          <div className="inline-flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                            <span>{getDurationString(attendee.checkInAt)}</span>
                          </div>
                        </td>

                        {/* Phone Number */}
                        <td className="py-3.5 px-3 sm:px-4 text-center">
                          {attendee.customerPhoneNumber ? (
                            <a
                              href={`tel:${attendee.customerPhoneNumber}`}
                              className="inline-flex items-center gap-1 text-zinc-300 hover:text-amber-400 font-mono text-xs"
                              title="اتصال بالعضو"
                            >
                              <Phone className="w-3 h-3 text-zinc-500" />
                              <span>{attendee.customerPhoneNumber}</span>
                            </a>
                          ) : (
                            <span className="text-zinc-600 font-mono text-xs">—</span>
                          )}
                        </td>

                        {/* Instant Check-Out Action Button */}
                        <td className="py-3.5 px-3 sm:px-4 text-center">
                          <button
                            type="button"
                            disabled={isCheckingOutThis}
                            onClick={() => handleQuickCheckout(attendee)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-black transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                            title="تسجيل خروج فوري وإخلاء الدولاب"
                          >
                            {isCheckingOutThis ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>جاري الخروج...</span>
                              </>
                            ) : (
                              <>
                                <LogOut className="w-3.5 h-3.5" />
                                <span>تسجيل خروج</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Bar */}
          <div className="wolf-glass rounded-2xl p-3 sm:p-4 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-zinc-500 text-[11px] sm:text-xs">
              عرض {((pageNumber - 1) * pageSize) + 1} - {Math.min(pageNumber * pageSize, totalCount)} من إجمالي {totalCount} وحش بالتمرين
            </span>

            <div className="flex items-center gap-2">
              {/* Prev Button */}
              <button
                type="button"
                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                disabled={pageNumber === 1}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-800 hover:border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer font-bold"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">السابق</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 font-mono font-bold">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - pageNumber) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="text-zinc-600 px-1">...</span>}
                        <button
                          type="button"
                          onClick={() => setPageNumber(p)}
                          className={`w-8 h-8 rounded-xl font-black text-xs transition-all cursor-pointer ${
                            pageNumber === p
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))}
                disabled={pageNumber === totalPages}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-800 hover:border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer font-bold"
                title="الصفحة التالية"
              >
                <span className="hidden sm:inline">التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CurrentlyInGymPage;
