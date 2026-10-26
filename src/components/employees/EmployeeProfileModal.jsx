import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  ShieldCheck, 
  Loader2, 
  Briefcase, 
  CheckCircle2, 
  XCircle,
  Calendar
} from 'lucide-react';
import { EMPLOYEE_ROLES, getEmployeeRoleInfo, getEmployeeMe } from '../../services/employeesService';

export const EmployeeProfileModal = ({ isOpen, onClose }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      getEmployeeMe()
        .then((data) => {
          setEmployee(data);
        })
        .catch((err) => {
          console.error('Fetch employee me error:', err);
          setError('تعذر تحميل بيانات الملف الوظيفي');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const roleInfo = getEmployeeRoleInfo(employee?.role);

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
          className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Top Gold Gradient */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#141417]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">ملف الموظف الوظيفي</h2>
                <p className="text-xs text-zinc-400">البيانات الوظيفية الرسمية المعتمدة</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                <p className="text-sm">جاري جلب الملف الوظيفي...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-400 text-sm">
                {error}
              </div>
            ) : employee ? (
              <div className="space-y-4">
                {/* Avatar & Name */}
                <div className="p-4 rounded-2xl bg-[#141417] border border-white/10 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                    {employee.name ? employee.name.charAt(0).toUpperCase() : 'W'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{employee.name}</h3>
                    <p className="text-xs text-zinc-400 font-mono" dir="ltr">
                      {employee.email}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${roleInfo?.badge || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                        {roleInfo?.name || 'موظف'}
                      </span>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        employee.isActive 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      }`}>
                        {employee.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {employee.isActive ? 'حساب مفعّل' : 'حساب معطّل'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#141417]/80 border border-white/5 space-y-1">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      رقم الهاتف
                    </span>
                    <p className="text-white font-mono font-medium text-sm" dir="ltr">
                      {employee.phoneNumber || '—'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#141417]/80 border border-white/5 space-y-1">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      الراتب الأساسي
                    </span>
                    <p className="text-amber-400 font-mono font-bold text-sm">
                      {employee.salary ? `${Number(employee.salary).toLocaleString()} ج.م` : 'غير محدد'}
                    </p>
                  </div>

                  {employee.createdAt && (
                    <div className="p-3.5 rounded-xl bg-[#141417]/80 border border-white/5 space-y-1 col-span-2">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        تاريخ التعيين في النظام
                      </span>
                      <p className="text-zinc-300 font-medium">
                        {new Date(employee.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-medium transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EmployeeProfileModal;
