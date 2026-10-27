import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Phone,
  DollarSign,
  ShieldCheck,
  Check,
  Loader2,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { EMPLOYEE_ROLES, updateEmployee, parseRoleValue } from '../../services/employeesService';
import { translateServerErrorMessage } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import ToggleSwitch from '../common/ToggleSwitch';

export const EditEmployeeModal = ({ isOpen, employee, onClose, onSuccess }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    salary: '',
    role: 6,
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        name: employee.name || '',
        phoneNumber: employee.phoneNumber || '',
        salary: employee.salary !== undefined ? employee.salary : '',
        role: parseRoleValue(employee.role),
        isActive: employee.isActive !== undefined ? Boolean(employee.isActive) : true,
      });
      setErrors({});
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

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

    if (!formData.phoneNumber.trim()) {
      errs.phoneNumber = 'يرجى إدخال رقم الهاتف';
    } else if (formData.phoneNumber.trim().length < 10) {
      errs.phoneNumber = 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل';
    }

    if (formData.salary === '' || Number(formData.salary) < 0) {
      errs.salary = 'يرجى إدخال راتب صحيح';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        salary: Number(formData.salary),
        role: Number(formData.role),
        isActive: formData.isActive,
      };

      await updateEmployee(employee.id, payload);

      toastSuccess(
        'تم تحديث البيانات',
        `تم تعديل بيانات الموظف (${formData.name}) بنجاح.`
      );

      if (onSuccess) onSuccess({ ...employee, ...payload });
      onClose();
    } catch (err) {
      console.error('Update employee error:', err);
      const data = err.response?.data;
      let errorMsg = 'تعذر تحديث بيانات الموظف.';

      if (data?.errors) {
        if (Array.isArray(data.errors)) {
          errorMsg = data.errors.map(e => translateServerErrorMessage(e.description || e)).join(' • ');
        } else if (typeof data.errors === 'object') {
          const list = Object.values(data.errors).flat().map(translateServerErrorMessage);
          errorMsg = list.join(' • ');
        }
      } else if (data?.detail || data?.title) {
        errorMsg = translateServerErrorMessage(data.detail || data.title);
      }

      toastError('فشل تعديل الموظف', errorMsg);
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
          className="relative w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Subtle Top Blue/Gold Line */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#141417]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  تعديل بيانات الموظف
                </h2>
                <p className="text-xs text-zinc-400 font-mono" dir="ltr">
                  {employee.email}
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                الاسم الكامل <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="الاسم الكامل"
                className={`w-full px-4 py-2.5 rounded-xl bg-[#141417] border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-amber-400/50'
                  }`}
              />
              {errors.name && (
                <p className="text-[11px] text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
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
                className={`w-full px-4 py-2.5 rounded-xl bg-[#141417] border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all text-left ${errors.phoneNumber ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-amber-400/50'
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
                placeholder="5000"
                className={`w-full px-4 py-2.5 rounded-xl bg-[#141417] border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${errors.salary ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-amber-400/50'
                  }`}
              />
              {errors.salary && (
                <p className="text-[11px] text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.salary}
                </p>
              )}
            </div>

            {/* IsActive Toggle Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141417] border border-white/10">
              <div>
                <p className="text-sm font-semibold text-white">حالة حساب الموظف</p>
                <p className="text-xs text-zinc-400">
                  {formData.isActive ? 'الحساب مفعّل ويمكنه العمل' : 'الحساب معطّل ولا يمكنه تسجيل الدخول'}
                </p>
              </div>
              <ToggleSwitch
                checked={Boolean(formData.isActive)}
                onChange={(val) => setFormData((prev) => ({ ...prev, isActive: val }))}
                activeColor="emerald"
                size="md"
              />
            </div>

            {/* Actions */}
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
                    <span>جاري التعديل...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>حفظ التعديلات</span>
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

export default EditEmployeeModal;
