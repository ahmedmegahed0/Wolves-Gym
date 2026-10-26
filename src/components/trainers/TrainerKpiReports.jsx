import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Star, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  RefreshCw, 
  X, 
  Target, 
  MessageSquare,
  Award,
  Sparkles,
  BarChart2,
  ShieldCheck,
  Dumbbell,
  CheckCircle2,
  AlertTriangle,
  Flame,
  User
} from 'lucide-react';
import { trainersService } from '../../services/trainersService';
import { useToast } from '../../context/ToastContext';

/**
 * Helper to determine KPI performance tier and style
 */
const getScoreTier = (score) => {
  const num = Number(score) || 0;
  if (num >= 4.5) {
    return {
      label: 'أداء استثنائي',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
      barGradient: 'from-emerald-500 to-teal-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    };
  }
  if (num >= 3.8) {
    return {
      label: 'أداء ممتاز',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      barGradient: 'from-amber-500 via-yellow-400 to-amber-300',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    };
  }
  if (num >= 3.0) {
    return {
      label: 'أداء جيد',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30',
      barGradient: 'from-yellow-500 to-amber-500',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    };
  }
  return {
    label: 'يحتاج إلى تحسين',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 border-rose-500/30',
    barGradient: 'from-rose-500 to-red-400',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  };
};

/**
 * Dynamic icon assignment based on KPI title
 */
const getKpiIcon = (name = '') => {
  const text = name.toLowerCase();
  if (text.includes('مواعيد') || text.includes('وقت') || text.includes('التزام') || text.includes('حضور')) {
    return Clock;
  }
  if (text.includes('نظافة') || text.includes('سلامة') || text.includes('أجهزة') || text.includes('صيانة')) {
    return ShieldCheck;
  }
  if (text.includes('تكنيك') || text.includes('تمرين') || text.includes('تدريب') || text.includes('عضل')) {
    return Dumbbell;
  }
  if (text.includes('سلوك') || text.includes('تعامل') || text.includes('انضباط') || text.includes('أخلاق')) {
    return Sparkles;
  }
  if (text.includes('هدف') || text.includes('تطور') || text.includes('خطة') || text.includes('أداء')) {
    return Target;
  }
  return Award;
};

/**
 * Star rating renderer (1 to 5 stars)
 */
const StarRating = ({ score, max = 5 }) => {
  const num = Number(score) || 0;
  return (
    <div className="flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = num >= star;
        const half = !filled && num >= star - 0.5;
        return (
          <Star
            key={star}
            className={`w-3.5 h-3.5 transition-colors ${
              filled
                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                : half
                ? 'text-amber-300 fill-amber-300/50'
                : 'text-zinc-700 fill-zinc-800'
            }`}
          />
        );
      })}
    </div>
  );
};

/**
 * TrainerKpiReports Component
 * Large, executive-level performance reports and KPI evaluations modal
 */
export const TrainerKpiReports = ({ 
  trainer, 
  isOpen = true, 
  onClose = null, 
  isEmbedded = false 
}) => {
  const { error: toastError } = useToast();

  const trainerId = trainer?.id || trainer?.trainerId;

  // View switch: 'summary' or 'daily'
  const [activeTab, setActiveTab] = useState('summary');

  // Summary state
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Daily evaluations state
  const [dailyData, setDailyData] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [dailyPageNumber, setDailyPageNumber] = useState(1);
  const [dailyTotalPages, setDailyTotalPages] = useState(1);
  const [dailyTotalCount, setDailyTotalCount] = useState(0);

  // Date filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch KPI Summary
  const fetchSummary = useCallback(async (isManual = false) => {
    if (!trainerId) return;
    if (isManual) setRefreshing(true);
    else setLoadingSummary(true);

    try {
      const res = await trainersService.getTrainerKpiEvaluations(trainerId, {
        from: fromDate,
        to: toDate,
      });
      setSummaryData(res || null);
    } catch (err) {
      console.error('Error fetching KPI summary:', err);
      toastError('تعذر تحميل ملخص التقييمات', err.message || 'حدث خطأ أثناء جلب ملخص الأداء.');
    } finally {
      setLoadingSummary(false);
      setRefreshing(false);
    }
  }, [trainerId, fromDate, toDate, toastError]);

  // Fetch Daily Evaluations
  const fetchDailyEvaluations = useCallback(async (isManual = false) => {
    if (!trainerId) return;
    if (isManual) setRefreshing(true);
    else setLoadingDaily(true);

    try {
      const res = await trainersService.getTrainerDailyKpiEvaluations(trainerId, {
        from: fromDate,
        to: toDate,
        pageNumber: dailyPageNumber,
        pageSize: 6,
      });
      setDailyData(Array.isArray(res?.data) ? res.data : []);
      setDailyTotalPages(res?.totalPages ?? 1);
      setDailyTotalCount(res?.totalCount ?? 0);
    } catch (err) {
      console.error('Error fetching daily evaluations:', err);
      toastError('تعذر تحميل سجل التقييم اليومي', err.message || 'حدث خطأ أثناء جلب السجل.');
    } finally {
      setLoadingDaily(false);
      setRefreshing(false);
    }
  }, [trainerId, fromDate, toDate, dailyPageNumber, toastError]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyEvaluations();
    }
  }, [activeTab, fetchDailyEvaluations]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchSummary();
    if (activeTab === 'daily') {
      setDailyPageNumber(1);
      fetchDailyEvaluations();
    }
  };

  const handleResetFilter = () => {
    setFromDate('');
    setToDate('');
  };

  const overallAvg = summaryData?.overallAverage !== undefined 
    ? Number(summaryData.overallAverage).toFixed(1) 
    : '—';
  const kpiItems = Array.isArray(summaryData?.kpis) ? summaryData.kpis : [];
  const tier = getScoreTier(overallAvg);

  // Total evaluations count across all items
  const totalEvaluationsCount = useMemo(() => {
    return kpiItems.reduce((acc, item) => acc + (Number(item.evaluationCount) || 0), 0);
  }, [kpiItems]);

  const initial = trainer?.name 
    ? trainer.name.replace(/كابتن\s*/g, '').slice(0, 1).toUpperCase() 
    : 'W';

  const content = (
    <div dir="rtl" className="space-y-6 font-tajawal">
      {/* ============================================================== */}
      {/* 1. MODAL HEADER WITH TRAINER HERO PROFILE                       */}
      {/* ============================================================== */}
      <div className="relative pb-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Glow accent */}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          {/* Coach Avatar Ring */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border-2 border-amber-500/50 flex items-center justify-center text-amber-400 font-bold text-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] shrink-0 overflow-hidden">
              {trainer?.imageUrl ? (
                <img src={trainer.imageUrl} alt={trainer.name} className="w-full h-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                سجل تقارير وتقييمات الكابتن
              </h3>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                ID #{trainerId}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>الكابتن:</span>
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 text-sm sm:text-base">
                {trainer?.name}
              </span>
              {trainer?.specialty && (
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800 font-medium">
                  {trainer.specialty}
                </span>
              )}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-zinc-900/90 hover:bg-rose-500/20 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 transition-all flex items-center justify-center self-end sm:self-auto cursor-pointer shadow-md"
            title="إغلاق التقرير"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. TAB CONTROLS & DATE FILTER BAR                               */}
      {/* ============================================================== */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-gradient-to-r from-[#121216] via-[#0d0d10] to-[#09090b] p-3 rounded-2xl border border-amber-500/20 shadow-lg">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black scale-[1.02]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>المتوسطات العامة (Overview)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black scale-[1.02]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>التقييمات اليومية (Daily Logs)</span>
          </button>
        </div>

        {/* Date Filter Inputs */}
        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-black/60 border border-zinc-800 hover:border-amber-500/30 rounded-xl px-3 py-1.5 transition-colors">
            <span className="text-xs text-zinc-400 font-bold">من:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none font-mono cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-black/60 border border-zinc-800 hover:border-amber-500/30 rounded-xl px-3 py-1.5 transition-colors">
            <span className="text-xs text-zinc-400 font-bold">إلى:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none font-mono cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500 hover:to-yellow-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            تصفية
          </button>

          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-bold cursor-pointer transition-colors"
            >
              إلغاء
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (activeTab === 'summary') fetchSummary(true);
              else fetchDailyEvaluations(true);
            }}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-zinc-900 text-amber-400 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/30 transition-all cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* ============================================================== */}
      {/* 3. TAB 1: OVERALL SUMMARY & BREAKDOWN                           */}
      {/* ============================================================== */}
      {activeTab === 'summary' && (
        <div className="space-y-5">
          {/* Overall Average Luxury Hero Card */}
          <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#18160f] via-[#101014] to-[#08080a] border border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.15)] flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-right relative z-10">
              {/* Massive Score Gauge Pill */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 text-black flex flex-col items-center justify-center font-mono shadow-[0_0_30px_rgba(245,158,11,0.4)] shrink-0">
                  <span className="text-3xl sm:text-4xl font-black leading-none">{overallAvg}</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/75 mt-0.5">من 5 نجوم</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className={`text-xs font-black px-3 py-1 rounded-full border ${tier.badgeBg}`}>
                    {tier.label}
                  </span>
                  <StarRating score={overallAvg} />
                </div>

                <h4 className="text-lg sm:text-xl font-black text-white">
                  المتوسط التراكمي الشامل لأداء الكابتن
                </h4>

                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                  محسوب تلقائياً عبر نظام KPIs المعتمد لتقييم الالتزام والانضباط الرياضي ومستوى التدريب.
                </p>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex sm:flex-col gap-2.5 shrink-0 w-full sm:w-auto relative z-10">
              <div className="flex-1 sm:flex-initial p-3 rounded-2xl bg-black/60 border border-zinc-800 text-center sm:text-right">
                <span className="text-[10px] text-zinc-500 block font-medium">إجمالي المعايير</span>
                <span className="text-base sm:text-lg font-mono font-black text-amber-400">
                  {kpiItems.length} معايير
                </span>
              </div>

              <div className="flex-1 sm:flex-initial p-3 rounded-2xl bg-black/60 border border-zinc-800 text-center sm:text-right">
                <span className="text-[10px] text-zinc-500 block font-medium">سجلات التقييم</span>
                <span className="text-base sm:text-lg font-mono font-black text-white">
                  {totalEvaluationsCount} تقييم
                </span>
              </div>
            </div>
          </div>

          {/* Section Subtitle */}
          <div className="flex items-center justify-between pt-2">
            <h5 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>تفصيل تقييم مؤشرات الأداء (KPI Breakdown)</span>
            </h5>
            <span className="text-xs text-zinc-500">مقياس من 1 إلى 5 نجوم</span>
          </div>

          {/* Breakdown per KPI Item Grid */}
          {loadingSummary ? (
            <div className="py-16 text-center text-zinc-400 font-bold animate-pulse text-sm bg-zinc-950/40 rounded-3xl border border-zinc-800/80">
              جاري احتساب متوسطات مؤشرات الأداء واستخراج النتائج...
            </div>
          ) : kpiItems.length === 0 ? (
            <div className="py-14 text-center text-zinc-500 text-sm bg-zinc-950/40 rounded-3xl border border-zinc-800 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500/50 mx-auto" />
              <p className="font-bold text-zinc-300">لا توجد تقييمات مسجلة لهذا الكابتن حتى الآن.</p>
              <p className="text-xs text-zinc-500">يمكنك تقييم أداء الكابتن عبر زر "تقييم أداء (KPIs)" في جدول الإدارة.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kpiItems.map((item) => {
                const avg = Number(item.averageScore || 0).toFixed(1);
                const count = item.evaluationCount || 0;
                const percentage = Math.min(100, Math.max(0, (Number(avg) / 5) * 100));
                const itemTier = getScoreTier(avg);
                const KpiIcon = getKpiIcon(item.name);

                return (
                  <div
                    key={item.kpiId}
                    className="p-5 rounded-2xl bg-gradient-to-b from-[#131317] to-[#0a0a0d] border border-zinc-800/90 hover:border-amber-500/40 transition-all duration-300 space-y-3.5 shadow-md hover:shadow-lg group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <KpiIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h6 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                            {item.name}
                          </h6>
                          <span className="text-[11px] text-zinc-500 font-mono block mt-0.5">
                            عدد مرات التقييم: {count}
                          </span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="text-left shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/80 border border-amber-500/30 text-amber-300 font-mono font-black text-sm shadow-sm">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{avg}</span>
                          <span className="text-[10px] text-zinc-500">/ 5</span>
                        </div>
                      </div>
                    </div>

                    {/* Star row & Level */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <StarRating score={avg} />
                      <span className={`text-[11px] font-bold ${itemTier.color}`}>
                        {itemTier.label} ({percentage.toFixed(0)}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800/60">
                      <div
                        className={`h-full bg-gradient-to-r ${itemTier.barGradient} rounded-full transition-all duration-700 shadow-sm`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. TAB 2: DAILY EVALUATIONS LOG                                 */}
      {/* ============================================================== */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {loadingDaily ? (
            <div className="py-16 text-center text-zinc-400 font-bold animate-pulse text-sm bg-zinc-950/40 rounded-3xl border border-zinc-800/80">
              جاري تحميل سجلات التقييم اليومية للكابتن...
            </div>
          ) : dailyData.length === 0 ? (
            <div className="py-14 text-center text-zinc-500 text-sm bg-zinc-950/40 rounded-3xl border border-zinc-800 space-y-2">
              <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="font-bold text-zinc-300">لا توجد تقييمات يومية مطابقة للفترة المحددة.</p>
              <p className="text-xs text-zinc-500">جرب توسيع نطاق التاريخ أو إزالة الفلترة لعرض كافة السجلات.</p>
            </div>
          ) : (
            dailyData.map((day, idx) => {
              const dayAvg = Number(day.dailyAverage || 0).toFixed(1);
              const scores = Array.isArray(day.scores) ? day.scores : [];
              const dayTier = getScoreTier(dayAvg);

              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-gradient-to-b from-[#131317] to-[#09090c] border border-zinc-800/90 hover:border-amber-500/30 transition-all space-y-3.5 shadow-md"
                >
                  {/* Daily Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800/80 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-mono font-bold text-white block">
                          {day.date ? new Date(day.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) : 'تاريخ غير محدد'}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {scores.length} معايير تم تقييمها في هذا اليوم
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${dayTier.badgeBg}`}>
                        {dayTier.label}
                      </span>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-black">
                        <span>متوسط اليوم:</span>
                        <span className="text-sm">{dayAvg}</span>
                        <span className="text-[10px] text-zinc-500">/ 5</span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Scores List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {scores.map((s, sIdx) => {
                      const scoreTier = getScoreTier(s.score);
                      const KpiIcon = getKpiIcon(s.kpiName);
                      return (
                        <div
                          key={sIdx}
                          className="p-3.5 rounded-xl bg-black/60 border border-zinc-850 text-xs flex flex-col justify-between gap-2 hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <KpiIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="font-bold text-zinc-200">{s.kpiName || `معيار #${s.kpiId}`}</span>
                            </div>
                            <span className="font-mono font-black text-amber-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-lg shrink-0">
                              ⭐ {s.score} / 5
                            </span>
                          </div>

                          {s.comment && (
                            <div className="flex items-start gap-1.5 text-[11px] text-zinc-300 bg-zinc-900/70 p-2 rounded-lg border border-zinc-800/50">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-400/70 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{s.comment}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination Controls */}
          {dailyTotalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
              <span className="text-xs text-zinc-500 font-mono">
                صفحة {dailyPageNumber} من {dailyTotalPages} ({dailyTotalCount} يوم)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={dailyPageNumber <= 1}
                  onClick={() => setDailyPageNumber((p) => Math.max(1, p - 1))}
                  className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-amber-500/30 disabled:opacity-30 cursor-pointer transition-colors"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={dailyPageNumber >= dailyTotalPages}
                  onClick={() => setDailyPageNumber((p) => p + 1)}
                  className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-amber-500/30 disabled:opacity-30 cursor-pointer transition-colors"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md font-tajawal overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="wolf-glass bg-zinc-950/95 border border-amber-500/40 rounded-3xl p-5 sm:p-8 max-w-4xl lg:max-w-5xl w-full shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden flex flex-col max-h-[92vh] my-auto"
        >
          {/* Top Gold Ambient Accent */}
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 opacity-95 shadow-[0_0_15px_rgba(245,158,11,0.8)]" />

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto gold-scrollbar px-1 py-1">
            {content}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TrainerKpiReports;
