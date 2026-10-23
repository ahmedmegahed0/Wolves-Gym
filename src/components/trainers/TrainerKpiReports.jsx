import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Star, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  RefreshCw, 
  X, 
  Target, 
  MessageSquare,
  Award,
  Sparkles,
  BarChart2,
  Filter
} from 'lucide-react';
import { trainersService } from '../../services/trainersService';
import { useToast } from '../../context/ToastContext';

/**
 * TrainerKpiReports Component
 * Displays coach performance metrics:
 * 1. Summary: Overall Average + KPI Breakdown (GET /api/Trainers/{id}/kpi-evaluations)
 * 2. Daily Log: Detailed scores per day (GET /api/Trainers/{id}/kpi-evaluations/daily)
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

  const content = (
    <div dir="rtl" className="space-y-4 font-cairo">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-gold-glow">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                سجل تقارير وتقييمات الكابتن
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                #{trainerId}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              الكابتن: <span className="font-bold text-white">{trainer?.name}</span>
            </p>
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

      {/* Date Filter & Tab Switch Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-black/60 p-2.5 rounded-2xl border border-zinc-800">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>المتوسطات العامة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>التقييمات اليومية</span>
          </button>
        </div>

        {/* Date Filter Inputs */}
        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[10px] text-zinc-400 font-bold">من:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none font-mono cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[10px] text-zinc-400 font-bold">إلى:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none font-mono cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
          >
            تصفية
          </button>

          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-2 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs cursor-pointer"
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
            className="p-2 rounded-xl bg-zinc-900 text-amber-400 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            title="تحديث"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* ======================================================== */}
      {/* 1. SUMMARY TAB CONTENT                                   */}
      {/* ======================================================== */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {/* Overall Average Hero Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-black border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-gold-glow">
            <div className="flex items-center gap-4 text-center sm:text-right">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-black flex items-center justify-center font-mono font-black text-2xl shadow-gold-glow shrink-0">
                {overallAvg}
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-400 flex items-center justify-center sm:justify-start gap-1">
                  <Award className="w-3.5 h-3.5" />
                  المتوسط التراكمي الشامل (Overall Average)
                </span>
                <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                  تقييم أداء الكابتن {trainer?.name}
                </h4>
                <p className="text-xs text-zinc-400">
                  محسوب عبر جميع بنود ومؤشرات الأداء المقاسة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-amber-500/20 text-xs font-mono font-bold text-zinc-300">
                إجمالي المعايير: {kpiItems.length}
              </span>
            </div>
          </div>

          {/* Breakdown per KPI Item */}
          {loadingSummary ? (
            <div className="py-12 text-center text-zinc-400 font-bold animate-pulse text-xs">
              جاري احتساب متوسطات مؤشرات الأداء...
            </div>
          ) : kpiItems.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 text-xs bg-black/40 rounded-2xl border border-zinc-800">
              لا توجد تقييمات مسجلة لهذا الكابتن حتى الآن.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {kpiItems.map((item) => {
                const avg = Number(item.averageScore || 0).toFixed(1);
                const count = item.evaluationCount || 0;
                const percentage = Math.min(100, Math.max(0, (Number(avg) / 10) * 100));

                return (
                  <div
                    key={item.kpiId}
                    className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-amber-500/30 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <h5 className="text-xs sm:text-sm font-bold text-white">{item.name}</h5>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          عدد مرات التقييم: {count}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-900 border border-amber-500/20 text-amber-400 font-mono font-black text-xs">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{avg}</span>
                        <span className="text-[9px] text-zinc-500">/ 10</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
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

      {/* ======================================================== */}
      {/* 2. DAILY EVALUATIONS TAB CONTENT                         */}
      {/* ======================================================== */}
      {activeTab === 'daily' && (
        <div className="space-y-3">
          {loadingDaily ? (
            <div className="py-12 text-center text-zinc-400 font-bold animate-pulse text-xs">
              جاري تحميل سجلات التقييم اليومية...
            </div>
          ) : dailyData.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 text-xs bg-black/40 rounded-2xl border border-zinc-800">
              لا توجد تقييمات يومية مطابقة للفترة المحددة.
            </div>
          ) : (
            dailyData.map((day, idx) => {
              const dayAvg = Number(day.dailyAverage || 0).toFixed(1);
              const scores = Array.isArray(day.scores) ? day.scores : [];

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3"
                >
                  {/* Daily Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-mono font-bold text-white">
                        {day.date ? new Date(day.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) : 'تاريخ غير محدد'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                      <span>متوسط اليوم:</span>
                      <span className="text-sm font-black">{dayAvg}</span>
                      <span className="text-[10px] text-zinc-500">/ 10</span>
                    </div>
                  </div>

                  {/* Individual Scores List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {scores.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2.5 rounded-xl bg-black/50 border border-zinc-850 text-xs flex flex-col justify-between gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-300">{s.kpiName || `معيار #${s.kpiId}`}</span>
                          <span className="font-mono font-bold text-amber-400 bg-zinc-900 px-2 py-0.5 rounded-md">
                            {s.score} / 10
                          </span>
                        </div>
                        {s.comment && (
                          <div className="flex items-start gap-1 text-[11px] text-zinc-400 bg-zinc-900/40 p-1.5 rounded-lg">
                            <MessageSquare className="w-3 h-3 text-zinc-500 shrink-0 mt-0.5" />
                            <span className="leading-tight">{s.comment}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination Controls */}
          {dailyTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-zinc-500 font-mono">
                صفحة {dailyPageNumber} من {dailyTotalPages} ({dailyTotalCount} يوم)
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={dailyPageNumber <= 1}
                  onClick={() => setDailyPageNumber((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={dailyPageNumber >= dailyTotalPages}
                  onClick={() => setDailyPageNumber((p) => p + 1)}
                  className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md font-cairo"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="wolf-glass bg-zinc-950/95 border border-amber-500/30 rounded-3xl p-4 sm:p-7 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
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

export default TrainerKpiReports;
