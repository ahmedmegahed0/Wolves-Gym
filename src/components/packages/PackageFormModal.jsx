import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Power,
  Zap,
  CheckCircle2,
  Users,
  UserCheck,
  Shield,
  Layers
} from 'lucide-react';
import { packageService, trainerService, PACKAGE_TYPES, getPackageTypeMeta } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

/**
 * PackageFormModal Component
 * Handles creating a new gym package (POST /api/Packages)
 * and editing an existing package (PATCH /api/Packages/{id}).
 * 
 * Supports Package Types:
 * - 0: Regular (عادية / عامة) -> TrainerId: null
 * - 1: Private (خاصة بكابتن محدد) -> TrainerId: mandatory from GET /api/Trainers
 * - 2: SharedPrivate (خاصة مشتركة بين كباتن الجيم) -> TrainerId: null
 */
export const PackageFormModal = ({
  isOpen,
  onClose,
  packageToEdit = null,
  onSuccess,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const isEditing = Boolean(packageToEdit && packageToEdit.id);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: 30,
    description: '',
    isActive: true,
    type: PACKAGE_TYPES.REGULAR,
    trainerId: null,
  });

  const [trainers, setTrainers] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Quick chips for duration
  const DURATION_PRESETS = [
    { label: 'شهر (30 يوم)', days: 30 },
    { label: '3 شهور (90 يوم)', days: 90 },
    { label: '6 شهور (180 يوم)', days: 180 },
    { label: 'سنة (365 يوم)', days: 365 },
  ];

  // Quick chips for popular prices
  const PRICE_PRESETS = [650, 1200, 1750, 3200, 5800];

  // Fetch trainers for Private Package selection
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setLoadingTrainers(true);
      trainerService
        .getAllTrainers()
        .then((list) => {
          if (isMounted) {
            setTrainers(Array.isArray(list) ? list : []);
          }
        })
        .catch((err) => {
          console.warn('Failed to load trainers for package modal:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingTrainers(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (packageToEdit) {
        const initialType = Number(packageToEdit.type ?? PACKAGE_TYPES.REGULAR);
        setFormData({
          name: packageToEdit.name || '',
          price: packageToEdit.price !== undefined ? String(packageToEdit.price) : '',
          duration: packageToEdit.duration || 30,
          description: packageToEdit.description || '',
          isActive: packageToEdit.isActive !== false,
          type: initialType,
          trainerId: initialType === PACKAGE_TYPES.PRIVATE ? (packageToEdit.trainerId ?? null) : null,
        });
      } else {
        setFormData({
          name: '',
          price: '',
          duration: 30,
          description: 'دخول غير محدود لصالة التدريب\nاستخدام اللوكرات وغرفة التبديل\nمتابعة دورية وقياس InBody',
          isActive: true,
          type: PACKAGE_TYPES.REGULAR,
          trainerId: null,
        });
      }
      setErrors({});
    }
  }, [isOpen, packageToEdit]);

  // Handle Type Change
  const handleTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      // If switching away from Private, reset trainerId to null
      trainerId: newType === PACKAGE_TYPES.PRIVATE ? prev.trainerId : null,
    }));
    // Clear trainer error if switching away from Private
    if (newType !== PACKAGE_TYPES.PRIVATE && errors.trainerId) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.trainerId;
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'برجاء كتابة اسم الباقة (مثلاً: اشتراك الذئب الذهبي)';
    }
    const numPrice = Number(formData.price);
    if (!formData.price || isNaN(numPrice) || numPrice <= 0) {
      errs.price = 'برجاء تحديد سعر صحيح أكبر من الصفر';
    }
    const numDuration = Number(formData.duration);
    if (!formData.duration || isNaN(numDuration) || numDuration < 1) {
      errs.duration = 'مدة الاشتراك يجب أن تكون 1 يوم على الأقل';
    }

    // Mandatory trainer for Private Package (type 1)
    if (Number(formData.type) === PACKAGE_TYPES.PRIVATE) {
      if (!formData.trainerId) {
        errs.trainerId = 'برجاء اختيار الكابتن المخصص لهذه الباقة الخاصة';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const pkgType = Number(formData.type);
      const payload = {
        name: formData.name.trim(),
        price: Number(formData.price),
        duration: Number(formData.duration),
        description: formData.description.trim(),
        isActive: Boolean(formData.isActive),
        type: pkgType,
        trainerId: pkgType === PACKAGE_TYPES.PRIVATE && formData.trainerId ? Number(formData.trainerId) : null,
      };

      if (isEditing) {
        await packageService.updatePackage(packageToEdit.id, payload);
        toastSuccess('تم التعديل بنجاح', `تم تحديث بيانات باقة "${payload.name}" بنجاح.`);
      } else {
        await packageService.createPackage(payload);
        toastSuccess('تمت الإضافة بنجاح', `تم إضافة باقة "${payload.name}" إلى كتيبة الباقات.`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.title || err.message || 'حدث خطأ أثناء حفظ الباقة';
      toastError(isEditing ? 'فشل التعديل' : 'فشل إضافة الباقة', msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md sm:max-w-xl mx-4 max-h-[92vh] overflow-y-auto gold-scrollbar bg-gradient-to-b from-[#121216] via-[#0d0d10] to-black rounded-3xl border border-amber-500/30 p-5 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.2)] my-auto font-cairo"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-amber-500/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 p-0.5 shadow-gold-glow flex items-center justify-center text-black">
                <Crown className="w-5 h-5 fill-black" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {isEditing ? 'تعديل باقة التدريب' : 'إضافة باقة رياضية جديدة'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {isEditing ? `تحديث تفاصيل الباقة #${packageToEdit.id}` : 'حدد نوع وسعر ومدة ومميزات الباقة للمشتركين'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Package Type Selection (Enum: 0 Regular, 1 Private, 2 SharedPrivate) */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2 flex items-center justify-between">
                <span>نوع الباقة التدريبية <span className="text-amber-400">*</span></span>
                <span className="text-[10px] text-amber-400/80 font-mono">Package Type</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 0: Regular */}
                <button
                  type="button"
                  onClick={() => handleTypeChange(PACKAGE_TYPES.REGULAR)}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    formData.type === PACKAGE_TYPES.REGULAR
                      ? 'bg-sky-500/15 border-sky-500/60 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.2)]'
                      : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-black text-white">عادية / عامة</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">0</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    تدريب حر لكافة الأعضاء بدون كابتن خاص
                  </p>
                </button>

                {/* 1: Private */}
                <button
                  type="button"
                  onClick={() => handleTypeChange(PACKAGE_TYPES.PRIVATE)}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    formData.type === PACKAGE_TYPES.PRIVATE
                      ? 'bg-amber-500/20 border-amber-500/70 text-amber-300 shadow-gold-glow'
                      : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-black text-white">برايفت</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">1</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    تدريب فردي (PT) مخصص مع كابتن محدد
                  </p>
                </button>

                {/* 2: SharedPrivate */}
                <button
                  type="button"
                  onClick={() => handleTypeChange(PACKAGE_TYPES.SHARED_PRIVATE)}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    formData.type === PACKAGE_TYPES.SHARED_PRIVATE
                      ? 'bg-purple-500/20 border-purple-500/70 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                      : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-black text-white">خاصة مشتركة</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">2</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    خاصة مشتركة، يختار العضو كابتنه عند الاشتراك
                  </p>
                </button>
              </div>
            </div>

            {/* Conditional Trainer Selection (Shown ONLY when type === 1 Private) */}
            <AnimatePresence>
              {formData.type === PACKAGE_TYPES.PRIVATE && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-amber-300 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-amber-400" />
                        <span>الكابتن المسؤول عن الباقة <span className="text-amber-400">*</span></span>
                      </label>
                      <span className="text-[10px] font-mono text-amber-400/80">TrainerId (مطلوب)</span>
                    </div>

                    {loadingTrainers ? (
                      <div className="p-3 bg-zinc-900/80 rounded-xl text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <span>جاري تحميل قائمة الكباتن...</span>
                      </div>
                    ) : (
                      <select
                        value={formData.trainerId || ''}
                        onChange={(e) => setFormData({ ...formData, trainerId: e.target.value ? Number(e.target.value) : null })}
                        className={`w-full px-4 py-2.5 rounded-xl bg-zinc-900 border text-xs sm:text-sm text-white focus:outline-none transition-all cursor-pointer ${
                          errors.trainerId ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-amber-500/40 focus:border-amber-400'
                        }`}
                      >
                        <option value="" className="bg-zinc-900 text-zinc-400">
                          -- اختر الكابتن المخصص للباقة --
                        </option>
                        {trainers.map((t) => (
                          <option key={t.id || t.trainerId} value={t.id || t.trainerId} className="bg-zinc-900 text-white">
                            {t.name} (خبرة {t.yearsOfExperience || 1} سنوات) {t.phoneNumber ? ` - ${t.phoneNumber}` : ''}
                          </option>
                        ))}
                      </select>
                    )}

                    {errors.trainerId && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.trainerId}</span>
                      </p>
                    )}

                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      💡 ملحوظة: في الباقة الخاصة بكابتن (Private)، يتم ربط الباقة مباشرة بكابتن الصالة، وسيقوم النظام بتسجيله تلقائيًا عند اشتراك العضو.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Package Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                اسم الباقة <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: اشتراك الذئب الذهبي - تدريب خاص"
                className={`w-full px-4 py-3 rounded-xl bg-zinc-900/90 border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${
                  errors.name ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-zinc-800 focus:border-amber-500/60'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-400 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Price & Duration (2 Cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  السعر (جنيه مصري) <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="مثال: 1500"
                    className={`w-full px-4 py-3 rounded-xl bg-zinc-900/90 border text-sm text-white font-mono placeholder-zinc-500 focus:outline-none transition-all ${
                      errors.price ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-zinc-800 focus:border-amber-500/60'
                    }`}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400 font-cairo">
                    ج.م
                  </span>
                </div>
                {errors.price && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.price}</span>
                  </p>
                )}

                {/* Quick Price Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRICE_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, price: String(p) })}
                      className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-mono text-zinc-300 border border-zinc-800 hover:border-amber-500/30 transition-all cursor-pointer"
                    >
                      {p} ج.م
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration in Days */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  مدة الاشتراك (بالأيام) <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    placeholder="30"
                    className={`w-full px-4 py-3 rounded-xl bg-zinc-900/90 border text-sm text-white font-mono placeholder-zinc-500 focus:outline-none transition-all ${
                      errors.duration ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-zinc-800 focus:border-amber-500/60'
                    }`}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 font-cairo">
                    يوماً
                  </span>
                </div>
                {errors.duration && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.duration}</span>
                  </p>
                )}

                {/* Quick Duration Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {DURATION_PRESETS.map((pre) => (
                    <button
                      key={pre.days}
                      type="button"
                      onClick={() => setFormData({ ...formData, duration: pre.days })}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        Number(formData.duration) === pre.days
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {pre.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description & Features */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>وصف ومميزات الباقة</span>
                <span className="text-[10px] text-zinc-500">اكتب كل ميزة في سطر منفصل</span>
              </label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="دخول غير محدود لصالة التدريب&#10;استخدام اللوكرات اليومية وغرفة التبديل&#10;جلسة تقييم بدني مجانية (InBody)"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Active Status Switch */}
            <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    formData.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  <Power className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">حالة تفعيل الباقة</span>
                  <span className="text-[10px] text-zinc-400">
                    {formData.isActive ? 'الباقة ظاهرة للمشتركين ومتاحة للاشتراك الفوري' : 'الباقة متوقفة مؤقتاً ومخفية عن العملاء'}
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                  formData.isActive ? 'bg-amber-500' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black shadow-md transition-transform duration-200 ${
                    formData.isActive ? 'translate-x-6 bg-black' : 'translate-x-0 bg-zinc-400'
                  }`}
                />
              </button>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer text-center"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs sm:text-sm font-black shadow-gold-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isEditing ? 'حفظ تعديلات الباقة' : 'إنشاء وتفعيل الباقة الآن'}</span>
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

export default PackageFormModal;
