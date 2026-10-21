import React, { useState, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  RotateCw, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  Sliders,
  CheckCircle2,
  Clock,
  Dumbbell
} from 'lucide-react';
import { attendanceService } from '../services/apiClient';
import { useToast } from '../context/ToastContext';

export const OccupancyCard = ({ onOccupancyUpdated, refreshTrigger }) => {
  const { error: toastError, info: toastInfo } = useToast();
  const gradientId = useId();

  const [occupancy, setOccupancy] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(() => {
    const saved = localStorage.getItem('gym_max_capacity');
    return saved ? parseInt(saved, 10) : 100;
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // seconds: 0 = off, 10, 30, 60
  const [secondsUntilNext, setSecondsUntilNext] = useState(30);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [tempCapacity, setTempCapacity] = useState(maxCapacity);

  // Fetch current occupancy from GET /api/Attendances/current-occupancy
  const fetchOccupancy = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
    }
    try {
      const data = await attendanceService.getCurrentOccupancy();
      const count = typeof data?.count === 'number' ? data.count : 0;
      setOccupancy(count);
      setLastUpdated(new Date());
      setSecondsUntilNext(autoRefreshInterval);
      if (onOccupancyUpdated) {
        onOccupancyUpdated(count);
      }
    } catch (err) {
      console.error('Error fetching occupancy:', err);
      if (isManual) {
        toastError('تعذر جلب العدد المباشر', err.friendlyMessage || 'تأكد من الاتصال بالسيرفر وحاول مجدداً.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [autoRefreshInterval, onOccupancyUpdated, toastError]);

  // Initial fetch and manual refresh triggers
  useEffect(() => {
    fetchOccupancy();
  }, [fetchOccupancy, refreshTrigger]);

  // Auto-refresh countdown & timer
  useEffect(() => {
    if (autoRefreshInterval === 0) return;

    setSecondsUntilNext(autoRefreshInterval);
    const intervalTimer = setInterval(() => {
      setSecondsUntilNext((prev) => {
        if (prev <= 1) {
          fetchOccupancy(false);
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [autoRefreshInterval, fetchOccupancy]);

  // Calculate percentage and status
  const percentage = Math.min(100, Math.round((occupancy / maxCapacity) * 100)) || 0;
  const availableSlots = Math.max(0, maxCapacity - occupancy);

  const getStatusInfo = () => {
    if (percentage >= 90) {
      return {
        label: 'الجيم زحمة جداً وعلى آخره',
        sub: 'طاقة استيعابية شبه كاملة',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/30',
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]',
        strokeGradient: ['#F43F5E', '#BE123C'],
        statusDot: 'bg-rose-500',
        badgeText: 'أقصى ضغط',
      };
    }
    if (percentage >= 70) {
      return {
        label: 'الجيم شغال نار والوحوش كتير',
        sub: 'وقت الذروة الحماسي',
        color: 'text-amber-400',
        bg: 'bg-amber-500/15 border-amber-500/35',
        glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
        strokeGradient: ['#F59E0B', '#D97706'],
        statusDot: 'bg-amber-400',
        badgeText: 'ذروة التمرين',
      };
    }
    if (percentage >= 40) {
      return {
        label: 'الزحمة متوسطة ومناسبة للتمرين',
        sub: 'تدفق أجهزة ممتاز',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        glow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
        strokeGradient: ['#FBBF24', '#F59E0B'],
        statusDot: 'bg-yellow-400',
        badgeText: 'متوسط ومتوازن',
      };
    }
    return {
      label: 'الجيم هادي ورايق',
      sub: 'أفضل وقت للتمرين براحتك',
      color: 'text-amber-300',
      bg: 'bg-amber-400/10 border-amber-400/30',
      glow: 'shadow-[0_0_25px_rgba(251,191,36,0.2)]',
      strokeGradient: ['#FDE68A', '#F59E0B'],
      statusDot: 'bg-amber-400',
      badgeText: 'رايق وهادي',
    };
  };

  const status = getStatusInfo();

  // Circular gauge calculations
  const size = 210;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleSaveCapacity = () => {
    const val = Math.max(10, Math.min(1000, Number(tempCapacity) || 100));
    setMaxCapacity(val);
    localStorage.setItem('gym_max_capacity', String(val));
    setShowCapacityModal(false);
    toastInfo('تم تعديل السعة', `تم تحديث سعة الجيم القصوى إلى ${val} وحش.`);
  };

  return (
    <div className="wolf-glass rounded-3xl p-6 lg:p-7 relative overflow-hidden border border-amber-500/20 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.85)] flex flex-col justify-between">
      {/* Decorative Golden Ambient Glow */}
      <div 
        className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700"
        style={{ background: status.strokeGradient[1] }}
      />
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 opacity-80" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Flame className="w-5 h-5 fill-amber-400/20" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              الإشغال المباشر في الجيم
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.statusDot}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.statusDot}`} />
              </span>
            </h2>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-500/70" />
              آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Action button: Auto-refresh & Manual trigger */}
        <div className="flex items-center gap-2">
          {/* Refresh interval dropdown pill */}
          <div className="relative">
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              aria-label="مدة التحديث التلقائي"
              className="bg-zinc-950 text-zinc-300 text-xs rounded-xl px-3 py-2 border border-zinc-800 focus:outline-none focus:border-amber-400 appearance-none cursor-pointer pr-3 pl-7 hover:border-amber-500/40 transition-colors font-medium"
            >
              <option value={10}>كل 10 ثوانٍ</option>
              <option value={30}>كل 30 ثانية</option>
              <option value={60}>كل دقيقة</option>
              <option value={0}>تحديث يدوي</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-zinc-400">
              <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Quick Manual Refresh Icon */}
          <button
            onClick={() => fetchOccupancy(true)}
            disabled={refreshing}
            title="تحديث العدد الآن"
            className="p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-amber-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-[0_0_12px_rgba(245,158,11,0.1)] group"
          >
            <RotateCw className={`w-4 h-4 transition-transform group-hover:rotate-180 duration-500 ${refreshing ? 'animate-spin text-yellow-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Hero Radial Gauge in Metallic Amber/Gold */}
      <div className="my-3 py-2 flex flex-col items-center justify-center relative">
        <div className="relative flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={status.strokeGradient[0]} />
                <stop offset="100%" stopColor={status.strokeGradient[1]} />
              </linearGradient>
            </defs>

            {/* Background track circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#18181B"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="opacity-90"
            />

            {/* Animated Progress Circle in Gold Gradient */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>

          {/* Center Info in the Radial Bar */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-10 w-16 bg-zinc-800 rounded-xl mx-auto" />
                <div className="h-3 w-20 bg-zinc-800 rounded mx-auto" />
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-amber-200 tracking-tight font-mono">
                    {occupancy}
                  </span>
                  <span className="text-sm text-zinc-400 font-bold">
                    /{maxCapacity}
                  </span>
                </div>
                <div className="text-xs font-bold text-amber-400 tracking-wide mt-1">
                  عدد الوحوش في الجيم دلوقتي
                </div>
                <div className={`text-xs font-bold font-mono mt-1.5 px-2.5 py-0.5 rounded-full border ${status.bg} ${status.color} shadow-sm`}>
                  {percentage}% نسبة الإشغال
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Dynamic Status Text Badge */}
        <div className="mt-5 flex items-center justify-center">
          <motion.div
            key={status.label}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold ${status.bg} ${status.color} ${status.glow} backdrop-blur-md`}
          >
            <span className={`w-2 h-2 rounded-full ${status.statusDot} animate-pulse`} />
            <span className="text-white font-extrabold">{status.label}</span>
            <span className="text-amber-500/40">|</span>
            <span className="text-zinc-300 font-medium">
              {status.sub}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Real-time stats footer bar */}
      <div className="mt-5 pt-4 border-t border-zinc-800/80 grid grid-cols-3 gap-2.5 text-center">
        <div className="bg-zinc-950/80 rounded-2xl p-3 border border-zinc-800/80 hover:border-amber-500/30 transition-colors">
          <div className="text-[11px] font-bold text-zinc-400">مكان فاضي</div>
          <div className="text-lg font-black text-amber-400 font-mono mt-0.5">{availableSlots}</div>
        </div>

        <div className="bg-zinc-950/80 rounded-2xl p-3 border border-zinc-800/80 hover:border-amber-500/30 transition-colors">
          <div className="text-[11px] font-bold text-zinc-400">سعة الجيم</div>
          <div className="text-lg font-black text-white font-mono mt-0.5 flex items-center justify-center gap-1">
            {maxCapacity}
            <button
              onClick={() => {
                setTempCapacity(maxCapacity);
                setShowCapacityModal(true);
              }}
              className="text-zinc-500 hover:text-amber-400 transition-colors p-0.5"
              title="تعديل السعة القصوى"
            >
              <Sliders className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-zinc-950/80 rounded-2xl p-3 border border-zinc-800/80 hover:border-amber-500/30 transition-colors">
          <div className="text-[11px] font-bold text-zinc-400">تحديث بعد</div>
          <div className="text-lg font-black text-yellow-500 font-mono mt-0.5">
            {autoRefreshInterval > 0 ? `${secondsUntilNext} ث` : 'يدوي'}
          </div>
        </div>
      </div>

      {/* Capacity Settings Modal */}
      <AnimatePresence>
        {showCapacityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="wolf-glass bg-zinc-950/95 border border-amber-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  تعديل سعة الجيم القصوى
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                حدد الحد الأقصى لاستيعاب الجيم لحساب نسبة الإشغال وحالة الزحمة بدقة.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    العدد الأقصى المستهدف (وحوش):
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={tempCapacity}
                    onChange={(e) => setTempCapacity(e.target.value)}
                    className="w-full bg-black text-white rounded-xl px-4 py-3 border border-zinc-800 focus:outline-none focus:border-amber-400 font-mono font-bold text-lg text-center"
                  />
                </div>

                <div className="flex gap-2">
                  {[50, 100, 150, 200].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTempCapacity(preset)}
                      className={`flex-1 py-1.5 text-xs rounded-xl font-mono font-bold border transition-colors ${
                        tempCapacity == preset
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCapacityModal(false)}
                    className="flex-1 px-4 py-2.5 text-xs font-bold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCapacity}
                    className="flex-1 px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-gold-glow transition-all"
                  >
                    حفظ التغيير
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OccupancyCard;
