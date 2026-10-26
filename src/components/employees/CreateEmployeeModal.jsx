import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  Lock, 
  ShieldCheck, 
  Check, 
  Loader2, 
  Eye, 
  EyeOff, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { EMPLOYEE_ROLES, createEmployee } from '../../services/employeesService';
import { translateServerErrorMessage } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

export const CreateEmployeeModal = ({ isOpen, onClose, onSuccess }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    salary: '',
    role: 6, // Default: Reception (6)
    password: '',
    confirmPassword: '',
    isActive: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'يرجى إدخال اسم الموظف بالكامل';
    } else if (formData.name.trim().length < 3) {
      errs.name = 'اسم الموظف يجب أن يكون 3 أحرف على الأقل';
    } else if (!/^[\p{L}\s]+$/u.test(formData.name.trim())) {
      errs.name = 'الاسم يجب أن يحتوي على حروف ومسافات فقط (بدون أرقام أو رموز)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'يرجى إدخال البريد الإلكتروني';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }

    if (!formData.phoneNumber.trim()) {
      errs.phoneNumber = 'يرجى إدخال رقم الهاتف';
    } else if (formData.phoneNumber.trim().length < 10) {
      errs.phoneNumber = 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل';
    }

    if (!formData.salary || Number(formData.salary) < 0) {
      errs.salary = 'يرجى إدخال راتب صحيح (0 أو أكثر)';
    }

    if (!formData.password) {
      errs.password = 'يرجى إدخال كلمة المرور';
    } else if (formData.password.length < 8) {
      errs.password = 'كلمة المرور يجب أن لا تقل عن 8 أحرف/أرقام';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'يرجى تأكيد كلمة المرور';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await createEmployee({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        salary: formData.salary,
        role: formData.role,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        isActive: formData.isActive,
      });

      toastSuccess(
        'تم إضافة الموظف بنجاح',
        `تم تسجيل (${formData.name}) ضمن فريق عمل الجيم بنجاح.`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Create employee error:', err);
      const data = err.response?.data;
      const status = err.response?.status;

      // Extract error details to accurately differentiate between Phone and Email conflict
      const errString = JSON.stringify(data || {}).toLowerCase();
      const isPhoneConflict = 
        errString.includes('phone') || 
        errString.includes('users_phone_already_exists') || 
        errString.includes('هاتف') ||
        errString.includes('تليفون');

      const isEmailConflict = 
        errString.includes('email') || 
        errString.includes('users_email_already_exists') ||
        errString.includes('بريد');

      if (status === 409) {
        if (isPhoneConflict && !isEmailConflict) {
          toastError(
            'رقم الهاتف مسجل مسبقاً',
            'رقم الهاتف المدخل مسجل بالفعل لموظف أو مستخدم آخر بالسيستم.'
          );
          setErrors((prev) => ({ ...prev, phoneNumber: 'رقم الهاتف مسجل بالفعل' }));
          return;
        }

        if (isEmailConflict) {
          toastError(
            'البريد مسجل مسبقاً',
            'البريد الإلكتروني المدخل مسجل بالفعل لموظف أو مستخدم آخر بالسيستم.'
          );
          setErrors((prev) => ({ ...prev, email: 'البريد مسجل بالفعل' }));
          return;
        }

        // Generic 409 if neither explicitly detected
        toastError(
          'البيانات مسجلة مسبقاً',
          'رقم الهاتف أو البريد الإلكتروني مسجل بالفعل لمستخدم آخر بالسيستم.'
        );
        setErrors((prev) => ({ 
          ...prev, 
          phoneNumber: 'رقم الهاتف مسجل بالفعل',
          email: 'البريد مسجل بالفعل'
        }));
        return;
      }

      let errorMsg = 'تعذر إضافة الموظف. يرجى مراجعة البيانات المدخلة.';
      if (data?.errors) {
        if (Array.isArray(data.errors)) {
          errorMsg = data.errors.map(e => translateServerErrorMessage(e.description || e.message || e)).join(' • ');
        } else if (typeof data.errors === 'object') {
          const list = Object.values(data.errors).flat().map(translateServerErrorMessage);
          errorMsg = list.join(' • ');
        }
      } else if (data?.detail || data?.title) {
        errorMsg = translateServerErrorMessage(data.detail || data.title);
      }

      toastError('فشل إضافة الموظف', errorMsg);
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
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#0c0c0e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Subtle Top Gold Glow */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#141417]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  إضافة موظف جديد للفريق
                </h2>
                <p className="text-xs text-zinc-400">
                  تسجيل بيانات موظف جديد وتعيين صلاحياته والراتب الأساسي
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body / Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  الاسم الكامل <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: أحمد عبد الله"
                  className={`w-full px-4 py-2.5 rounded-xl bg-[#141417] border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${
                    errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-amber-400/50'
                  }`}
                />
                {errors.name && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  البريد الإلكتروني <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  dir="ltr"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="employee@wolvesgym.com"
                  className={`w-full px-4 py-2.5 rounded-xl bg-[#141417] border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-left ${
                    errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-amber-400/50'
                  }`}
                />
                {errors.email && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  رقم الهاتف <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  dir="ltr"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="01012345678"
                  className={`w-full px-4 py-2.5 rounded-xl bg-[#141417] border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-left ${
                    errors.phoneNumber ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-amber-400/50'
                  }`}
                />
                {errors.phoneNumber && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Role Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  الدور الوظيفي <span className="text-red-400">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141417] border border-white/10 text-sm text-white focus:outline-none focus:border-amber-400/50 cursor-pointer"
                >
                  {Object.entries(EMPLOYEE_ROLES).map(([id, info]) => (
                    <option key={id} value={id} className="bg-[#141417] text-white">
                      {info.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  الراتب الأساسي (ج.م) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="مثال: 5000"
                  className={`w-full px-4 py-2.5 rounded-xl bg-[#141417] border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${
                    errors.salary ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-amber-400/50'
                  }`}
                />
                {errors.salary && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.salary}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  كلمة المرور <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    dir="ltr"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2.5 pl-10 rounded-xl bg-[#141417] border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-left ${
                      errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-amber-400/50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  تأكيد كلمة المرور <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    dir="ltr"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2.5 pl-10 rounded-xl bg-[#141417] border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-left ${
                      errors.confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-amber-400/50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* IsActive Toggle Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141417] border border-white/10">
              <div>
                <p className="text-sm font-semibold text-white">تفعيل الحساب فوراً</p>
                <p className="text-xs text-zinc-400">
                  عند التفعيل، يمكن للموظف تسجيل الدخول وممارسة صلاحياته مباشرة
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Actions / Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-medium transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>حفظ الموظف</span>
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

export default CreateEmployeeModal;
