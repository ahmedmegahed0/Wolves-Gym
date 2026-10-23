import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Flame, 
  KeyRound, 
  RotateCw, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Activity,
  Layers,
  Info
} from 'lucide-react';
import { customersService } from '../../services/customersService';
import { useToast } from '../../context/ToastContext';

// Arabic Month Names
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Days of Week in Arabic (Starting Sunday)
const WEEK_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/**
 * CustomerAttendanceCalendar Component
 * Integrates:
 * - GET /api/customers/{id}/attendances?Month={m}&Year={y}
 * Features:
 * - Month & Year selectors
 * - Full interactive Arabic monthly calendar grid
 * - Total attendances badge
 * - Session details card on date click (checkInAt, checkOutAt, duration, lockerNumber)
 */
export const CustomerAttendanceCalendar = ({ customerId, customerName = '' }) => {
  const { error: toastError } = useToast();

  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(() => today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => today.getMonth() + 1); // 1-12
  
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDaySessions, setSelectedDaySessions] = useState(null); // array of sessions for clicked day
  const [selectedDayNumber, setSelectedDayNumber] = useState(null);

  // Fetch Attendance
  const fetchAttendance = useCallback(async (isManual = false, signal = null) => {
    if (!customerId) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await customersService.getCustomerAttendances(
        customerId,
        selectedMonth,
        selectedYear,
        { signal }
      );
      setAttendanceData(data);
      setSelectedDaySessions(null);
      setSelectedDayNumber(null);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      console.error('Failed to load attendance calendar:', err);
      toastError('تعذر جلب سجل الحضور', err.friendlyMessage || 'حدث خطأ أثناء تحميل سجل الشهر.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId, selectedMonth, selectedYear, toastError]);

  useEffect(() => {
    const controller = new AbortController();
    fetchAttendance(false, controller.signal);
    return () => controller.abort();
  }, [fetchAttendance]);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Group attendance records by Day of the Month (1..31)
  const attendancesByDay = useMemo(() => {
    const map = new Map();
    const list = attendanceData?.attendances || [];
    list.forEach((item) => {
      if (!item.checkInAt) return;
      try {
        const d = new Date(item.checkInAt);
        const dayNum = d.getDate();
        if (!map.has(dayNum)) map.set(dayNum, []);
        map.get(dayNum).push(item);
      } catch {}
    });
    return map;
  }, [attendanceData]);

  // Calendar Geometry calculations
  const calendarDays = useMemo(() => {
    // 0-indexed month in JS Date: selectedMonth - 1
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    const days = [];
    // Padding before first day
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, isPadding: true });
    }
    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const sessions = attendancesByDay.get(d) || [];
      const isToday =
        today.getFullYear() === selectedYear &&
        today.getMonth() + 1 === selectedMonth &&
        today.getDate() === d;

      days.push({
        dayNumber: d,
        sessions,
        hasAttendance: sessions.length > 0,
        count: sessions.length,
        isToday,
        isPadding: false,
      });
    }
    return days;
  }, [selectedYear, selectedMonth, attendancesByDay, today]);

  // Format single date time
  const formatTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const totalMonthlyAttendances = attendanceData?.totalAttendances ?? (attendanceData?.attendances?.length || 0);

  return (
    <div dir="rtl" className="space-y-4 font-cairo">
      {/* Top Header Card: Month Navigator & Summary Stats */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-zinc-950/80 border border-amber-500/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Month & Year Title with Controls */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-gold-glow">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base sm:text-lg font-black text-white">
                تقويم وسجل الحضور الشهري
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {selectedYear}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              متابعة الأيام وجلسات التمرين وتفاصيل اللوكرات لكل حصة
            </p>
          </div>
        </div>

        {/* Controls: Prev / Current Month Picker / Next */}
        <div className="flex items-center gap-2 self-center sm:self-auto">
          {/* Previous Month Button (In RTL, ChevronRight goes backward in time) */}
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 transition-all cursor-pointer"
            title="الشهر السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-1.5 bg-black/80 px-3 py-1.5 rounded-xl border border-zinc-800">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-amber-400 font-bold text-xs focus:outline-none cursor-pointer"
            >
              {ARABIC_MONTHS.map((name, idx) => (
                <option key={idx} value={idx + 1} className="bg-zinc-950 text-white">
                  {name}
                </option>
              ))}
            </select>

            <span className="text-zinc-600">/</span>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-zinc-200 font-bold font-mono text-xs focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr} className="bg-zinc-950 text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Next Month Button */}
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 transition-all cursor-pointer"
            title="الشهر القادم"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchAttendance(true)}
            disabled={refreshing || loading}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800 transition-all cursor-pointer mr-1"
            title="تحديث البيانات"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Monthly Attendance Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-950 to-black border border-amber-500/30">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>تمرينات هذا الشهر</span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {totalMonthlyAttendances}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            حصة تمرين مسجلة
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>الشهر المحدد</span>
            <CalendarIcon className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-sm sm:text-base font-bold text-white">
            {ARABIC_MONTHS[selectedMonth - 1]} {selectedYear}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
            {calendarDays.filter((d) => !d.isPadding).length} يوماً في الشهر
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>أيام النشاط الفعلي</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {attendancesByDay.size}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            أيام زار فيها الجيم
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>معدل الالتزام</span>
            <Award className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-yellow-400 font-mono">
            {Math.round((attendancesByDay.size / 30) * 100)}%
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            من أيام الشهر
          </div>
        </div>
      </div>

      {/* Interactive Calendar Grid */}
      <div className="wolf-glass rounded-3xl p-4 sm:p-6 border border-amber-500/20 shadow-xl overflow-hidden">
        {loading && !refreshing ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
            <p className="text-xs text-zinc-400">جاري قراءة سجلات الحضور من الخادم...</p>
          </div>
        ) : (
          <>
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-bold text-amber-400/90 pb-3 border-b border-zinc-800">
              {WEEK_DAYS.map((dayName, idx) => (
                <div key={idx} className="py-1 text-[11px] sm:text-xs">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Days Grid Cells */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-3">
              {calendarDays.map((cell, idx) => {
                if (cell.isPadding) {
                  return (
                    <div
                      key={`pad-${idx}`}
                      className="aspect-square rounded-2xl bg-zinc-950/20 border border-transparent opacity-20 pointer-events-none"
                    />
                  );
                }

                const isSelected = selectedDayNumber === cell.dayNumber;

                return (
                  <button
                    key={`day-${cell.dayNumber}`}
                    type="button"
                    onClick={() => {
                      if (cell.hasAttendance) {
                        setSelectedDaySessions(cell.sessions);
                        setSelectedDayNumber(cell.dayNumber);
                      } else {
                        setSelectedDaySessions([]);
                        setSelectedDayNumber(cell.dayNumber);
                      }
                    }}
                    className={`aspect-square rounded-2xl p-1.5 sm:p-2.5 flex flex-col justify-between transition-all cursor-pointer relative group text-right ${
                      cell.hasAttendance
                        ? 'bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border-2 border-amber-500/50 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700'
                    } ${cell.isToday ? 'ring-2 ring-yellow-400' : ''} ${
                      isSelected ? 'ring-2 ring-amber-400 scale-[1.03] z-10' : ''
                    }`}
                  >
                    {/* Top Row: Day Number + Today Badge */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs sm:text-sm font-black font-mono ${
                          cell.hasAttendance ? 'text-amber-400' : 'text-zinc-400'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {cell.isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                      )}
                    </div>

                    {/* Bottom Indicator */}
                    {cell.hasAttendance ? (
                      <div className="flex items-center justify-between w-full mt-auto">
                        <div className="p-0.5 sm:p-1 rounded-md bg-amber-500 text-black shadow-sm">
                          <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-black" />
                        </div>
                        {cell.count > 1 && (
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-300">
                            {cell.count}x
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-zinc-800 self-center" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Selected Day Details Card (Expandable on Day Click) */}
      <AnimatePresence>
        {selectedDayNumber !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#181820] via-zinc-950 to-black border border-amber-500/40 shadow-gold-glow space-y-3"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
                  {selectedDayNumber}
                </div>
                <div>
                  <h5 className="text-xs sm:text-sm font-black text-white">
                    تفاصيل يوم {selectedDayNumber} {ARABIC_MONTHS[selectedMonth - 1]} {selectedYear}
                  </h5>
                  <span className="text-[11px] text-zinc-400">
                    {selectedDaySessions?.length > 0
                      ? `تم تسجيل ${selectedDaySessions.length} جلسة تمرين في هذا اليوم`
                      : 'لم يتم تسجيل أي حضور في هذا اليوم'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDayNumber(null);
                  setSelectedDaySessions(null);
                }}
                className="text-xs text-zinc-500 hover:text-white"
              >
                إغلاق
              </button>
            </div>

            {selectedDaySessions?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {selectedDaySessions.map((session, sIdx) => (
                  <div
                    key={session.id || sIdx}
                    className="p-3.5 rounded-xl bg-black/70 border border-zinc-800/90 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" />
                        جلسة تمرين #{sIdx + 1}
                      </span>
                      {session.isCurrentlyAttending ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                          بالجيم الآن
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400">
                          مكتملة
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-zinc-300">
                      <div>
                        <span className="text-zinc-500 text-[10px] block">وقت الدخول:</span>
                        <span className="font-mono text-white font-bold">
                          {formatTime(session.checkInAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block">وقت الخروج:</span>
                        <span className="font-mono text-white font-bold">
                          {formatTime(session.checkOutAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-900 text-zinc-400 text-[11px]">
                      <div className="flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-amber-500" />
                        <span>
                          اللوكر المستلم:{' '}
                          <strong className="text-white font-mono">
                            {session.lockerNumber ? `#${session.lockerNumber}` : 'بدون لوكر'}
                          </strong>
                        </span>
                      </div>

                      {session.duration && (
                        <div className="flex items-center gap-1 font-mono text-zinc-300">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{session.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-2">
                لم يسجل الكابتن حضوراً للجيم في هذا اليوم المحدد.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerAttendanceCalendar;
