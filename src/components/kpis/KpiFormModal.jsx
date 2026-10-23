import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  X, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Lightbulb
} from 'lucide-react';
import { kpisService, extractKpiErrorMessage } from '../../services/kpisService';
import { useToast } from '../../context/ToastContext';

// Suggested Standard Gym KPIs for quick one-click inspiration
const QUICK_SUGGESTIONS = [
  {
    name: 'الالتزام بمواعيد الحصص والورديات',
    desc: 'حضور الحصص والورديات المجدولة في الموعد المحدد دون تأخير أو غياب مفاجئ.',
  },
  {
    name: 'المتابعة البدنية وقياسات المشتركين',
    desc: 'إجراء قياسات الـ InBody الشهرية وتسجيل تطور الأعضاء وتحديث برامجهم التدريبية.',
  },
  {
    name: 'توجيه الأعضاء والتحفيز داخل الصالة',
    desc: 'التفاعل الإيجابي مع المتدربين وتصحيح الأوضاع الخاطئة أثناء أداء التمارين لضمان سلامتهم.',
  },
  {
    name: 'تجديد الاشتراكات ونسبة رضا الأعضاء',
    desc: 'معدل تجديد المتدربين لاشتراكاتهم مع الكابتن ومستوى الرضا العام والتقييمات.',
  },
  {
    name: 'معايير النظافة وسلامة الأجهزة والمعدات',
    desc: 'إعادة الأوزان والدمبلز لأماكنها والحفاظ على سلامة ونظافة منطقة التمرين.',
  },
  {
    name: 'تصميم خطط وبرامج تدريبية وتغذوية',
    desc: 'ابتكار برامج تدريبية وتغذوية متخصصة ومناسبة لأهداف كل مشترك بشكل احترافي.',
  },
];

/**
 * KpiFormModal Component
 * Handles creating new KPI (POST /api/Kpis) and editing existing KPI (PATCH /api/Kpis/{id})
 */
export const KpiFormModal = ({ isOpen, onClose, kpi = null, onSuccess }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const isEditMode = Boolean(kpi && (kpi.id !== undefined));

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Sync form state when modal opens or target kpi changes
  useEffect(() => {
    if (isOpen) {
      if (kpi) {
        setFormData({
          name: kpi.name || '',
          description: kpi.description || '',
          isActive: kpi.isActive !== undefined ? Boolean(kpi.isActive) : true,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          isActive: true,
        });
      }
      setErrors({});
      setServerError('');
    }
  }, [isOpen, kpi]);

  // Client-side validation in Arabic
  const validate = () => {
    const newErrors = {};

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'يرجى إدخال اسم مؤشر الأداء.';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'اسم المؤشر يجب أن يتكون من حرفين على الأقل.';
    } else if (trimmedName.length > 150) {
      newErrors.name = 'اسم المؤشر طويل جداً (الحد الأقصى 150 حرفاً).';
    }

    const trimmedDesc = formData.description.trim();
    if (!trimmedDesc) {
      newErrors.description = 'يرجى إدخال وصف المؤشر ومعايير القياس.';
    } else if (trimmedDesc.length < 5) {
      newErrors.description = 'وصف المؤشر يجب أن يكون مفصلاً (5 أحرف على الأقل).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Quick suggestion click handler
  const handleApplySuggestion = (sug) => {
    setFormData((prev) => ({
      ...prev,
      name: sug.name,
      description: sug.desc,
    }));
    setErrors({});
    setServerError('');
  };

  // Form submit handler (POST or PATCH)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);

    try {
      if (isEditMode) {
        // PATCH /api/Kpis/{id}
        const payload = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: Boolean(formData.isActive),
        };
        await kpisService.updateKpi(kpi.id, payload);
        toastSuccess('تم التعديل بنجاح', `تم تحديث بيانات مؤشر الأداء "${payload.name}" بنجاح.`);
      } else {
        // POST /api/Kpis
        const payload = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: Boolean(formData.isActive),
        };
        await kpisService.createKpi(payload);
        toastSuccess('تمت الإضافة بنجاح', `تم اعتماد مؤشر الأداء الجديد "${payload.name}" بنجاح.`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('KPI save error:', err);
      const friendlyMsg = extractKpiErrorMessage(
        err,
        isEditMode ? 'فشل تعديل مؤشر الأداء.' : 'فشل إضافة مؤشر الأداء الجديد.'
      );
      setServerError(friendlyMsg);
      toastError(isEditMode ? 'خطأ في التعديل' : 'خطأ في الإضافة', friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto font-cairo"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl mx-auto bg-gradient-to-b from-[#141419] via-[#0f0f13] to-black rounded-3xl border border-amber-500/30 p-5 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.2)] my-auto max-h-[90vh] overflow-y-auto gold-scrollbar"
        >
          {/* Header Accent Bar */}
          <div className="absolute top-0 right-10 left-10 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-amber-500/15">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm shadow-gold-glow">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  {isEditMode ? 'تعديل مؤشر الأداء' : 'إضافة مؤشر أداء جديد'}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    KPIs
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isEditMode
                    ? `تعديل مسميات ومعايير تقييم المؤشر #${kpi?.id}`
                    : 'اعتماد معيار تقييم جديد في لوحة الإدارة ومدير العمليات'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Server Error Alert Banner */}
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{serverError}</span>
            </motion.div>
          )}

          {/* Quick Suggestions (Only in Create Mode) */}
          {!isEditMode && (
            <div className="mb-5 p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-500/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2.5">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>اقتراحات سريعة لمؤشرات تقييم الكباتن المعتمدة:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplySuggestion(sug)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-zinc-900 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 transition-all cursor-pointer"
                  >
                    + {sug.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* KPI Name Field */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                اسم مؤشر الأداء <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                    if (serverError) setServerError('');
                  }}
                  placeholder="مثال: الالتزام بمواعيد الحصص، المتابعة البدنية للمشتركين..."
                  maxLength={150}
                  className={`w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border text-white text-sm placeholder:text-zinc-500 focus:outline-none transition-all ${
                    errors.name
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                  disabled={loading}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500">
                  {formData.name.length}/150
                </span>
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* KPI Description Field */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                وصف المؤشر ومعايير القياس <span className="text-amber-400">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description) setErrors({ ...errors, description: null });
                  if (serverError) setServerError('');
                }}
                placeholder="اشرح آلية التقييم وكيفية احتساب الدرجة للكابتن بناءً على هذا المؤشر..."
                className={`w-full px-4 py-3 rounded-2xl bg-zinc-900/90 border text-white text-sm placeholder:text-zinc-500 focus:outline-none transition-all resize-none ${
                  errors.description
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
                disabled={loading}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.description}
                </p>
              )}
              <p className="mt-1 text-[11px] text-zinc-500">
                يظهر هذا الوصف لمدير العمليات والكباتن لتوضيح متطلبات النجاح في التقييم.
              </p>
            </div>

            {/* IsActive Switch Field */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                حالة تفعيل المؤشر
              </label>
              <div 
                onClick={() => !loading && setFormData({ ...formData, isActive: !formData.isActive })}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  formData.isActive
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-zinc-900/80 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    formData.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {formData.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className={`text-xs font-bold block ${formData.isActive ? 'text-emerald-300' : 'text-zinc-400'}`}>
                      {formData.isActive ? 'مؤشر نشط ومعتمد (Active)' : 'مؤشر متوقف / معطل (Inactive)'}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {formData.isActive
                        ? 'يظهر في استمارات تقييم الكباتن الشهرية واليومية'
                        : 'معطل ومخفي مؤقتاً من استمارات التقييم'}
                    </span>
                  </div>
                </div>

                {/* Custom Animated Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isActive}
                  disabled={loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData({ ...formData, isActive: !formData.isActive });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isActive ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formData.isActive ? '-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-gold-glow flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-black" />
                    <span>{isEditMode ? 'حفظ التعديلات' : 'اعتماد المؤشر'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default KpiFormModal;
