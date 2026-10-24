import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  DollarSign, 
  Clock, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Power,
  CalendarCheck,
  UserCheck
} from 'lucide-react';
import { trainersService } from '../../services/trainersService';
import { translateServerErrorMessage } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

/**
 * CreateTrainerModal Component
 * Allows Management/SuperAdmin to create a new trainer account (POST /api/Trainers)
 * Body: { name, email, phoneNumber, password, confirmPassword, salary, yearsOfExperience, isActive, isAvailable }
 */
export const CreateTrainerModal = ({ isOpen, onClose, onSuccess }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    salary: 5000,
    yearsOfExperience: 2,
    isActive: true,
    isAvailable: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'اسم الكابتن مطلوب';
    } else if (formData.name.trim().length < 3) {
      errs.name = 'اسم الكابتن يجب أن يكون 3 أحرف على الأقل';
    } else if (!/^[\p{L}\s]+$/u.test(formData.name.trim())) {
      errs.name = 'الاسم يجب أن يحتوي على حروف ومسافات فقط (بدون أرقام أو رموز)';
    }

    if (!formData.phoneNumber.trim()) {
      errs.phoneNumber = 'رقم الهاتف مطلوب';
    }
    if (formData.password && formData.password.length < 6) {
      errs.password = 'كلمة المرور يجب أن لا تقل عن 6 أحرف';
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }
    if (Number(formData.salary) < 0) {
      errs.salary = 'الراتب يجب أن يكون رقماً موجباً';
    }
    if (Number(formData.yearsOfExperience) < 0) {
      errs.yearsOfExperience = 'سنوات الخبرة يجب أن تكون رقماً موجباً';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      await trainersService.createTrainer(formData);
      toastSuccess(
        'تمت إضافة الكابتن بنجاح',
        `تم تسجيل الكابتن (${formData.name}) في كتيبة مدربي WOLVES.`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Create trainer error:', err);
      const data = err.response?.data;
      let errorMsg = 'حدث خطأ أثناء إنشاء حساب الكابتن.';

      if (data?.errors) {
        if (Array.isArray(data.errors)) {
          errorMsg = data.errors.map((e) => translateServerErrorMessage(e.description || e)).join(' • ');
        } else if (typeof data.errors === 'object') {
          const list = Object.values(data.errors).flat().map(translateServerErrorMessage);
          errorMsg = list.join(' • ');
        }
      } else if (data?.detail || data?.title) {
        errorMsg = translateServerErrorMessage(data.detail || data.title);
      } else if (typeof data === 'string') {
        errorMsg = translateServerErrorMessage(data);
      }

      toastError('فشل إضافة الكابتن', errorMsg);
    } finally {
      setLoading(false);
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
          className="wolf-glass bg-zinc-950/95 border border-amber-500/30 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Gold Accent */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 opacity-90" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-gold-glow">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  إضافة كابتن مدرب جديد
                </h3>
                <p className="text-xs text-zinc-400">
                  تسجيل حساب وبيانات مدرب جديد في منصة WOLVES
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 px-1 py-2 gold-scrollbar">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                اسم الكابتن <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-zinc-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: كابتن حسام حسن"
                  className={`w-full pr-9 pl-4 py-2.5 rounded-xl bg-zinc-900 border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${
                    errors.name ? 'border-rose-500' : 'border-zinc-800 focus:border-amber-500/60'
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  رقم الهاتف <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-zinc-500" />
                  <input
                    type="tel"
                    dir="ltr"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="010XXXXXXXX"
                    className={`w-full pr-9 pl-4 py-2.5 rounded-xl bg-zinc-900 border text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none transition-all text-right ${
                      errors.phoneNumber ? 'border-rose-500' : 'border-zinc-800 focus:border-amber-500/60'
                    }`}
                  />
                </div>
                {errors.phoneNumber && <p className="mt-1 text-xs text-rose-400">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  البريد الإلكتروني (اختياري)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-zinc-500" />
                  <input
                    type="email"
                    dir="ltr"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="coach@wolves.com"
                    className="w-full pr-9 pl-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 text-right"
                  />
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-zinc-500" />
                  <input
                    type="password"
                    dir="ltr"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className={`w-full pr-9 pl-4 py-2.5 rounded-xl bg-zinc-900 border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-right ${
                      errors.password ? 'border-rose-500' : 'border-zinc-800 focus:border-amber-500/60'
                    }`}
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-zinc-500" />
                  <input
                    type="password"
                    dir="ltr"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className={`w-full pr-9 pl-4 py-2.5 rounded-xl bg-zinc-900 border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-right ${
                      errors.confirmPassword ? 'border-rose-500' : 'border-zinc-800 focus:border-amber-500/60'
                    }`}
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-rose-400">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Experience & Salary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  سنوات الخبرة <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-amber-500/60"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">
                    سنوات
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  الراتب الشهري (جنيه مصري) <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-amber-500/60"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-amber-400 font-bold">
                    ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* Account & Booking Status Switches (isActive vs isAvailable) */}
            <div className="space-y-3 pt-1">
              {/* 1. Account Active Status (DomainUser) */}
              <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    formData.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    <Power className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">حالة تفعيل حساب الكابتن (User)</span>
                    <span className="text-[11px] text-zinc-400">
                      {formData.isActive ? 'حساب نشط ومصرح له بتسجيل الدخول للنظام' : 'حساب معطل مؤقتاً وممنوع من الدخول'}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* 2. Trainer Booking Availability */}
              <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    formData.isAvailable ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">متاح للظهور والحجز للمشتركين</span>
                    <span className="text-[11px] text-zinc-400">
                      {formData.isAvailable ? 'متاح لاستقبال متدربين جدد والظهور في الباقات' : 'غير متاح حالياً للحجز أو الباقات الخاصة'}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-gold-glow flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>جاري إضافة الكابتن...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>تسجيل الكابتن الجديد</span>
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

export default CreateTrainerModal;
