import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Star, 
  MessageSquare, 
  Save, 
  X, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck
} from 'lucide-react';
import { kpisService, extractKpiErrorMessage } from '../../services/kpisService';
import { trainersService } from '../../services/trainersService';
import { useToast } from '../../context/ToastContext';

/**
 * TrainerKpiEvaluationModal Component
 * Restricted to Operations Manager / Management.
 * Dynamically loads active KPIs from GET /api/Kpis?IsActive=true
 * Allows scoring (1-10 Slider / Star-like rating) + comment for each KPI item
 * Submits to POST /api/Trainers/{id}/kpi-evaluations (or PUT if evaluated today)
 */
export const TrainerKpiEvaluationModal = ({ 
  isOpen, 
  onClose, 
  trainer, 
  onSuccess 
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [kpis, setKpis] = useState([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isExistingToday, setIsExistingToday] = useState(false);
  const [existingDate, setExistingDate] = useState('');
  
  // Evaluation entries keyed by kpiId: { score: number, comment: string }
  const [evaluations, setEvaluations] = useState({});
  const [hoveredStars, setHoveredStars] = useState({});
  const [generalError, setGeneralError] = useState('');

  const trainerId = trainer?.trainerId || trainer?.id;

  const getTodayIso = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Load Active KPIs and check today's evaluation whenever modal opens
  useEffect(() => {
    if (!isOpen || !trainerId) return;

    let isMounted = true;
    const fetchActiveKpisAndDaily = async () => {
      setLoadingKpis(true);
      setGeneralError('');
      setIsExistingToday(false);

      const todayStr = getTodayIso();
      setExistingDate(todayStr);

      try {
        const [kpisRes, todayDailyRes] = await Promise.allSettled([
          kpisService.getKpis({ isActive: true, pageSize: 50 }),
          trainersService.getTrainerDailyKpiEvaluations(trainerId, { date: todayStr }),
        ]);

        const list = kpisRes.status === 'fulfilled' && Array.isArray(kpisRes.value?.data) 
          ? kpisRes.value.data 
          : [];

        let existingScoresMap = {};
        let foundToday = false;

        if (todayDailyRes.status === 'fulfilled' && todayDailyRes.value) {
          const dailyData = Array.isArray(todayDailyRes.value?.data)
            ? todayDailyRes.value.data
            : Array.isArray(todayDailyRes.value)
              ? todayDailyRes.value
              : [];

          const match = dailyData.find((d) => d.date?.startsWith(todayStr));
          if (match && Array.isArray(match.scores) && match.scores.length > 0) {
            foundToday = true;
            match.scores.forEach((s) => {
              existingScoresMap[s.kpiId] = {
                score: Math.min(5, Math.max(1, Number(s.score) || 5)),
                comment: s.comment || '',
              };
            });
          }
        }

        if (isMounted) {
          setKpis(list);
          setIsExistingToday(foundToday);

          // Initialize scores with existing scores if today was evaluated, or default 5/5
          const initialMap = {};
          list.forEach((kpi) => {
            if (existingScoresMap[kpi.id]) {
              initialMap[kpi.id] = existingScoresMap[kpi.id];
            } else {
              initialMap[kpi.id] = {
                score: 5,
                comment: '',
              };
            }
          });
          setEvaluations(initialMap);
        }
      } catch (err) {
        console.error('Failed to load active KPIs or existing evaluation:', err);
        if (isMounted) {
          setGeneralError('تعذر جلب معايير التقييم النشطة من السيرفر.');
          toastError('فشل تحميل مؤشرات الأداء', 'يرجى التأكد من تفعيل معايير التقييم أولاً.');
        }
      } finally {
        if (isMounted) setLoadingKpis(false);
      }
    };

    fetchActiveKpisAndDaily();

    return () => {
      isMounted = false;
    };
  }, [isOpen, trainerId, toastError]);

  if (!isOpen || !trainer) return null;

  const handleScoreChange = (kpiId, score) => {
    setEvaluations((prev) => ({
      ...prev,
      [kpiId]: {
        ...(prev[kpiId] || {}),
        score: Number(score),
      },
    }));
  };

  const handleCommentChange = (kpiId, comment) => {
    setEvaluations((prev) => ({
      ...prev,
      [kpiId]: {
        ...(prev[kpiId] || {}),
        comment,
      },
    }));
  };

  // Calculate current average score across all KPIs
  const scoresArray = Object.values(evaluations).map((e) => Number(e.score) || 0);
  const currentAverage = scoresArray.length > 0 
    ? (scoresArray.reduce((acc, curr) => acc + curr, 0) / scoresArray.length).toFixed(1)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (kpis.length === 0) {
      toastError('لا توجد معايير', 'لا توجد مؤشرات أداء نشطة حالياً لتسجيل التقييم.');
      return;
    }

    setSubmitting(true);
    setGeneralError('');
    const todayStr = existingDate || getTodayIso();

    try {
      const scoresPayload = kpis.map((kpi) => {
        const item = evaluations[kpi.id] || { score: 5, comment: '' };
        return {
          kpiId: Number(kpi.id),
          score: Math.min(5, Math.max(1, Number(item.score) || 5)),
          comment: item.comment && String(item.comment).trim() ? String(item.comment).trim() : null,
        };
      });

      if (isExistingToday) {
        // Update existing evaluation via PUT
        await trainersService.updateTrainerKpiEvaluations(trainerId, {
          date: todayStr,
          scores: scoresPayload,
        });

        toastSuccess(
          'تم تحديث تقييم الكابتن بنجاح',
          `تم تعديل وتحديث تقييم مؤشرات الأداء للكابتن (${trainer.name}) بمتوسط ${currentAverage}/5`
        );
      } else {
        // Submit new evaluation via POST
        try {
          await trainersService.submitTrainerKpiEvaluations(trainerId, {
            scores: scoresPayload,
          });

          toastSuccess(
            'تم تسجيل تقييم الكابتن بنجاح',
            `تم حفظ تقييم مؤشرات الأداء للكابتن (${trainer.name}) بمتوسط ${currentAverage}/5`
          );
        } catch (postErr) {
          const resData = postErr.response?.data;
          const status = postErr.response?.status;
          const errDetail = JSON.stringify(resData || {}).toLowerCase() + ' ' + (postErr.message || '').toLowerCase();

          // If server rejected with 409 or duplicate error because an evaluation already exists today, fallback to PUT
          const isAlreadyExists = 
            status === 409 ||
            (status === 400 && (
              errDetail.includes('already') ||
              errDetail.includes('exist') ||
              errDetail.includes('today') ||
              errDetail.includes('duplicate') ||
              errDetail.includes('يوم') ||
              errDetail.includes('مسبق') ||
              errDetail.includes('بالفعل')
            ) && !errDetail.includes('inclusivebetweenvalidator'));

          console.info('POST evaluation result: status =', status, 'isAlreadyExists =', isAlreadyExists, 'errDetail =', errDetail);

          // Attempt PUT fallback only if today has already been evaluated
          if (isAlreadyExists) {
            console.info('Attempting PUT update fallback for date:', todayStr);
            try {
              await trainersService.updateTrainerKpiEvaluations(trainerId, {
                date: todayStr,
                scores: scoresPayload,
              });

              setIsExistingToday(true);
              toastSuccess(
                'تم تحديث تقييم الكابتن بنجاح',
                `تم تعديل وتحديث تقييم مؤشرات الأداء للكابتن (${trainer.name}) بمتوسط ${currentAverage}/5`
              );
            } catch (putErr) {
              console.error('PUT fallback also failed:', putErr);
              // If PUT fails too, throw original or PUT error
              throw putErr;
            }
          } else {
            throw postErr;
          }
        }
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Submit KPI Evaluation error:', err);
      // Extract exact server error descriptions
      const serverData = err.response?.data;
      let rawServerErrors = [];
      if (Array.isArray(serverData?.errors)) {
        rawServerErrors = serverData.errors.map(e => e.description || e.message || (typeof e === 'string' ? e : JSON.stringify(e)));
      } else if (typeof serverData?.errors === 'object' && serverData?.errors) {
        rawServerErrors = Object.values(serverData.errors).flat().map(e => (typeof e === 'string' ? e : e.description || e.message || JSON.stringify(e)));
      }

      const msg = 
        (rawServerErrors.length > 0 ? rawServerErrors.join(' • ') : null) ||
        serverData?.detail ||
        serverData?.message ||
        err.friendlyMessage || 
        extractKpiErrorMessage(err) ||
        serverData?.title ||
        err.message || 
        'حدث خطأ أثناء إرسال التقييم للسيرفر.';

      setGeneralError(msg);
      toastError('فشل حفظ التقييم', msg);
    } finally {
      setSubmitting(false);
    }
  };

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

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-gold-glow">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    تقييم أداء الكابتن (KPIs)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    خاص بالإدارة
                  </span>
                </div>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-white">{trainer.name}</span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-500 font-mono">#{trainerId}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Evaluation Score Preview */}
          <div className="my-3.5 p-3 rounded-2xl bg-zinc-900/80 border border-amber-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-zinc-300">
                {isExistingToday ? 'المتوسط المعدل لتقييم اليوم:' : 'المتوسط الحالي لجلسة التقييم:'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-lg font-black text-amber-400 font-mono">{currentAverage}</span>
              <span className="text-xs text-zinc-500 font-mono">/ 5 نجوم</span>
            </div>
          </div>

          {/* Existing Today Notice */}
          {isExistingToday && (
            <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>يوجد تقييم مسجل للكابتن اليوم ({existingDate}). يمكنك تعديل الدرجات وحفظ التحديثات مباشرة.</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                تحديث
              </span>
            </div>
          )}

          {/* Error Notice */}
          {generalError && (
            <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Content Body: Scrollable KPI items */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 px-1 py-1 gold-scrollbar">
            {loadingKpis ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
                <p className="text-xs text-zinc-400 font-bold">جاري تحميل معايير التقييم النشطة...</p>
              </div>
            ) : kpis.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">لا توجد معايير تقييم نشطة</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  يرجى تفعيل مؤشرات الأداء من شاشة الـ KPIs أولاً ليتسنى تقييم المدربين.
                </p>
              </div>
            ) : (
              kpis.map((kpi, idx) => {
                const evalData = evaluations[kpi.id] || { score: 5, comment: '' };
                const scoreValue = Math.min(5, Math.max(1, Number(evalData.score) || 5));

                return (
                  <div
                    key={kpi.id}
                    className="p-4 rounded-2xl bg-black/60 border border-zinc-800 hover:border-amber-500/30 transition-all space-y-3"
                  >
                    {/* KPI Title & Score Indicator */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-zinc-900 border border-zinc-700 text-amber-400 text-[10px] font-mono font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-white">
                            {kpi.name}
                          </h4>
                        </div>
                        {kpi.description && (
                          <p className="text-[11px] text-zinc-400 pr-7 leading-relaxed">
                            {kpi.description}
                          </p>
                        )}
                      </div>

                      {/* Score Badge */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-amber-500/30 text-amber-400 shrink-0 font-mono">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-black text-sm">{scoreValue}</span>
                        <span className="text-[10px] text-zinc-400">من 5</span>
                      </div>
                    </div>

                    {/* Interactive 5-Stars Rating Component */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1 px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                      <div className="flex items-center gap-2" dir="ltr">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (hoveredStars[kpi.id] || scoreValue);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleScoreChange(kpi.id, star)}
                              onMouseEnter={() => setHoveredStars((prev) => ({ ...prev, [kpi.id]: star }))}
                              onMouseLeave={() => setHoveredStars((prev) => ({ ...prev, [kpi.id]: 0 }))}
                              className="p-1 rounded-lg transition-transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-none"
                              title={`${star} من 5 نجوم`}
                            >
                              <Star
                                className={`w-6 h-6 sm:w-7 sm:h-7 transition-all duration-150 ${
                                  isFilled
                                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                    : 'text-zinc-700 hover:text-zinc-500 fill-zinc-900/50'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300 font-cairo">
                          {((hoveredStars[kpi.id] || scoreValue) === 5) && '⭐⭐⭐⭐⭐ ممتاز (5 نجوم)'}
                          {((hoveredStars[kpi.id] || scoreValue) === 4) && '⭐⭐⭐⭐ جيد جداً (4 نجوم)'}
                          {((hoveredStars[kpi.id] || scoreValue) === 3) && '⭐⭐⭐ جيد (3 نجوم)'}
                          {((hoveredStars[kpi.id] || scoreValue) === 2) && '⭐⭐ مقبول (نجمتان)'}
                          {((hoveredStars[kpi.id] || scoreValue) === 1) && '⭐ ضعيف (نجمة واحدة)'}
                        </span>
                      </div>
                    </div>

                    {/* Optional Comment Input */}
                    <div className="relative pt-1">
                      <div className="absolute top-3.5 right-3 text-zinc-500 pointer-events-none">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={evalData.comment || ''}
                        onChange={(e) => handleCommentChange(kpi.id, e.target.value)}
                        placeholder="ملاحظة أو توجيه للكابتن بهذا البند (اختياري)..."
                        className="w-full bg-zinc-900/80 text-white placeholder-zinc-500 text-xs rounded-xl pr-9 pl-3 py-2 border border-zinc-800 focus:border-amber-400 focus:outline-none font-cairo transition-colors"
                      />
                    </div>
                  </div>
                );
              })
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-zinc-800/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-500">
                تسجيل التقييم يوثق بالسيرفر مع التاريخ الحالي ويحتسب في تقارير الأداء.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={submitting || loadingKpis || kpis.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-gold-glow flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>جاري حفظ التقييم...</span>
                    </>
                  ) : isExistingToday ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>تحديث وحفظ تقييم اليوم</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>اعتماد وحفظ التقييم</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TrainerKpiEvaluationModal;
