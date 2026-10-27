import React, { useState, useEffect, useCallback, useId, useRef } from 'react';
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

export const OccupancyCard = React.memo(({ onOccupancyUpdated, refreshTrigger }) => {
  const { error: toastError, info: toastInfo } = useToast();
  const gradientId = useId();

  const [occupancy, setOccupancy] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Store callbacks & toast handlers in refs to prevent dependency loops
  const onOccupancyUpdatedRef = useRef(onOccupancyUpdated);
  useEffect(() => {
    onOccupancyUpdatedRef.current = onOccupancyUpdated;
  }, [onOccupancyUpdated]);

  const toastErrorRef = useRef(toastError);
  useEffect(() => {
    toastErrorRef.current = toastError;
  }, [toastError]);

  const isFetchingRef = useRef(false);

  // Fetch current occupancy from GET /api/Attendances/current-occupancy
  const fetchOccupancy = useCallback(async (isManual = false) => {
    // Prevent duplicate in-flight requests
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManual) {
      setRefreshing(true);
    }

    try {
      const data = await attendanceService.getCurrentOccupancy();
      const count = typeof data?.count === 'number' ? data.count : (typeof data?.currentOccupancy === 'number' ? data.currentOccupancy : 0);
      setOccupancy(count);
      setLastUpdated(new Date());

      if (onOccupancyUpdatedRef.current) {
        onOccupancyUpdatedRef.current(count);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      console.warn('Error fetching occupancy:', err);
      if (isManual && toastErrorRef.current) {
        toastErrorRef.current('تعذر جلب العدد المباشر', err.friendlyMessage || 'تأكد من الاتصال بالسيرفر وحاول مجدداً.');
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // Completely stable with zero changing dependencies

  // Initial fetch on mount, and re-fetch only when check-in/out occurs or user clicks refresh
  useEffect(() => {
    fetchOccupancy(false);
  }, [refreshTrigger, fetchOccupancy]);

  const getStatusInfo = () => {
    if (occupancy >= 50) {
      return {
        label: 'وقت الذروة والحماس',
        sub: 'الجيم شغال بأعلى طاقة وحيوية',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/30',
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]',
        strokeGradient: ['#F43F5E', '#BE123C'],
        statusDot: 'bg-rose-500',
        badgeText: 'ذروة التمرين',
      };
    }
    if (occupancy >= 20) {
      return {
        label: 'حماس ونشاط في الصالة',
        sub: 'أجواء رياضية ممتازة وتدفق متوازن',
        color: 'text-amber-400',
        bg: 'bg-amber-500/15 border-amber-500/35',
        glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
        strokeGradient: ['#F59E0B', '#D97706'],
        statusDot: 'bg-amber-400',
        badgeText: 'نشاط وحيوية',
      };
    }
    if (occupancy > 0) {
      return {
        label: 'أجواء ممتازة ومناسبة للتمرين',
        sub: 'تدفق مريح وكافة الأجهزة متاحة',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
        strokeGradient: ['#10B981', '#059669'],
        statusDot: 'bg-emerald-400',
        badgeText: 'إشغال هادئ',
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
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="wolf-glass rounded-3xl p-4 sm:p-6 lg:p-7 relative overflow-hidden border border-amber-500/20 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.85)] flex flex-col justify-between">
      {/* Decorative Golden Ambient Glow */}
      <div 
        className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700"
        style={{ background: status.strokeGradient[1] }}
      />
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 opacity-80" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 mb-3 sm:mb-4 relative z-10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400/20" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5 sm:gap-2">
              الإشغال المباشر في الجيم
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.statusDot}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.statusDot}`} />
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-500/70" />
              آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Quick Manual Refresh Icon */}
        <button
          onClick={() => fetchOccupancy(true)}
          disabled={refreshing}
          title="تحديث عدد الحضور يدوياً"
          className="p-2 sm:p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-amber-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-[0_0_12px_rgba(245,158,11,0.1)] group cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:rotate-180 duration-500 ${refreshing ? 'animate-spin text-yellow-400' : ''}`} />
        </button>
      </div>

      {/* Main Hero Radial Gauge in Metallic Amber/Gold */}
      <div className="my-2 sm:my-3 py-1 sm:py-2 flex flex-col items-center justify-center relative">
        <div className="relative flex items-center justify-center">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-44 h-44 sm:w-52 sm:h-52 transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]"
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

            {/* Animated Golden Live Ring */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference * 0.4 }}
              animate={{ 
                strokeDashoffset: occupancy > 0 
                  ? [circumference * 0.25, circumference * 0.1, circumference * 0.25] 
                  : [circumference * 0.6, circumference * 0.5, circumference * 0.6] 
              }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
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
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-amber-200 tracking-tight font-mono">
                    {occupancy}
                  </span>
                </div>
                <div className="text-xs font-bold text-amber-400 tracking-wide mt-1">
                  عدد الوحوش في الجيم دلوقتي
                </div>
                <div className={`text-xs font-bold font-mono mt-1.5 px-3 py-0.5 rounded-full border ${status.bg} ${status.color} shadow-sm flex items-center gap-1.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.statusDot} animate-ping`} />
                  <span>{status.badgeText}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Dynamic Status Text Banner */}
        <div className="mt-3 sm:mt-5 flex items-center justify-center px-1">
          <motion.div
            key={status.label}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`inline-flex flex-wrap items-center justify-center text-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl border text-[11px] sm:text-xs font-bold ${status.bg} ${status.color} ${status.glow} backdrop-blur-md max-w-full`}
          >
            <span className={`w-2 h-2 rounded-full ${status.statusDot} animate-pulse flex-shrink-0`} />
            <span className="text-white font-extrabold">{status.label}</span>
            <span className="text-amber-500/40 hidden sm:inline">|</span>
            <span className="text-zinc-300 font-medium">
              {status.sub}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Real-time stats footer bar */}
      <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-zinc-800/80 grid grid-cols-3 gap-1.5 sm:gap-2.5 text-center">
        <div className="bg-zinc-950/80 rounded-2xl p-2 sm:p-3 border border-zinc-800/80 hover:border-amber-500/30 transition-colors">
          <div className="text-[10px] sm:text-[11px] font-bold text-zinc-400">حالة الصالة</div>
          <div className="text-xs sm:text-sm font-black text-amber-400 font-cairo mt-1">
            {occupancy > 0 ? 'نشاط مستمر' : 'صالة رايقة'}
          </div>
        </div>

        <div className="bg-zinc-950/80 rounded-2xl p-2 sm:p-3 border border-zinc-800/80 hover:border-amber-500/30 transition-colors">
          <div className="text-[10px] sm:text-[11px] font-bold text-zinc-400">الوحوش المتواجدة</div>
          <div className="text-base sm:text-lg font-black text-white font-mono mt-0.5">
            {occupancy}
          </div>
        </div>

        <div className="bg-zinc-950/80 rounded-2xl p-2 sm:p-3 border border-zinc-800/80 hover:border-amber-500/30 transition-colors">
          <div className="text-[10px] sm:text-[11px] font-bold text-zinc-400">آخر تحديث</div>
          <div className="text-xs sm:text-sm font-black text-amber-400 font-mono mt-1">
            {lastUpdated ? lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
          </div>
        </div>
      </div>
    </div>
  );
});

export default OccupancyCard;
