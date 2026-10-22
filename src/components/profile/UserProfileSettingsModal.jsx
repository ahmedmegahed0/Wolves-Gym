import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  QrCode, 
  Key, 
  X, 
  Check, 
  Loader2, 
  Sparkles, 
  Lock,
  Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usersService } from '../../services/usersService';
import { getRoleMeta, trainerService } from '../../services/apiClient';

/**
 * UserProfileSettingsModal
 * Edit Name & Phone (PATCH /api/Users/me) + View Account Info & Role.
 */
export const UserProfileSettingsModal = ({ isOpen, onClose }) => {
  const { user, updateCurrentUser, setIsChangePasswordModalOpen } = useAuth();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const roleMeta = getRoleMeta(user?.role);

  // Sync with current user info whenever modal opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
      });
      setErrors({});

      // If user is a trainer and phoneNumber is missing, sync from /api/Trainers/me
      if (user.role === 'Trainer' && !user.phoneNumber) {
        trainerService
          .getTrainerMe()
          .then((t) => {
            if (t?.phoneNumber) {
              setFormData((prev) => ({
                ...prev,
                name: prev.name || t.name || '',
                phoneNumber: t.phoneNumber || prev.phoneNumber,
              }));
              updateCurrentUser({ phoneNumber: t.phoneNumber });
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, user, updateCurrentUser]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'يرجى إدخال الاسم بالكامل';
    } else if (formData.name.trim().length < 3) {
      errs.name = 'الاسم يجب أن يكون 3 أحرف على الأقل';
    }

    if (!formData.phoneNumber.trim()) {
      errs.phoneNumber = 'يرجى إدخال رقم الهاتف';
    } else if (formData.phoneNumber.trim().length < 10) {
      errs.phoneNumber = 'رقم الهاتف غير صحيح (أقل من 10 أرقام)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const updatedData = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
      };

      await usersService.updateMyProfile(updatedData);

      // Instantly update context so header & all cards refresh without page reload
      updateCurrentUser(updatedData);

      toastSuccess(
        'تم تحديث بياناتك بنجاح يا وحش 🐺🔥',
        'تم حفظ تعديلات الاسم ورقم الهاتف وتحديث حسابك فورياً.'
      );

      if (onClose) onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      const isConflict = err.status === 409 || err.message?.includes('مسجل بالفعل') || err.message?.includes('Conflict') || err.message?.includes('رقم الهاتف');
      if (isConflict) {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: 'رقم الهاتف مسجل بالفعل لحساب مستخدم آخر بالصالة. أدخل رقماً آخر.',
        }));
      }
      toastError('فشل تحديث البيانات', err.message || 'حدث خطأ أثناء تعديل بيانات الحساب.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChangePassword = () => {
    if (onClose) onClose();
    if (setIsChangePasswordModalOpen) {
      setIsChangePasswordModalOpen(true);
    }
  };

  if (!isOpen) return null;

  const initial = formData.name ? formData.name.slice(0, 1).toUpperCase() : (user?.name?.slice(0, 1).toUpperCase() || 'W');

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-cairo"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-lg mx-3 sm:mx-4 max-h-[90vh] overflow-y-auto gold-scrollbar bg-gradient-to-b from-[#141419] to-[#0c0c0e] border border-amber-500/30 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] z-10 my-auto"
        >
          {/* Subtle Ambient Gold Flare */}
          <div className="absolute top-0 right-0 left-0 h-28 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent pointer-events-none" />

          {/* Modal Header */}
          <div className="relative z-10 flex items-center justify-between p-5 sm:p-6 border-b border-amber-500/15">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-black flex items-center justify-center shadow-gold-glow font-black text-lg font-mono shrink-0">
                {initial}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    إعدادات الحساب والبيانات الشخصية
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  تحديث الاسم ورقم الهاتف ومراجعة الصلاحيات
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-xl bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="relative z-10 p-5 sm:p-6 space-y-4">
            
            {/* Account Badges Row: Role + Email */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">نوع الصلاحية / الدور:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{roleMeta.label}</span>
                </span>
              </div>

              {/* Registered Email (Read-only) */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/60">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>البريد المسجل:</span>
                </span>
                <div className="flex items-center gap-1.5 font-mono text-zinc-200" dir="ltr">
                  <span>{user?.email || 'user@wolves.com'}</span>
                  <Lock className="w-3 h-3 text-zinc-500" title="لا يمكن تعديل البريد المسجل" />
                </div>
              </div>

              {/* Member Code if exists */}
              {user?.code && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/60">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>كود العضوية الرقمي:</span>
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{user.code}</span>
                </div>
              )}
            </div>

            {/* 1. Full Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 block text-right">
                الاسم بالكامل (Name)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-zinc-500 group-focus-within:text-amber-400 transition-colors" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: أحمد مجاهد"
                  className={`w-full pl-4 pr-10 py-2.5 rounded-2xl bg-zinc-900/90 border text-sm text-white placeholder-zinc-500 outline-none transition-all ${
                    errors.name
                      ? 'border-rose-500/60 focus:border-rose-400'
                      : 'border-zinc-800 focus:border-amber-500 shadow-inner'
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-rose-400 text-right">{errors.name}</p>
              )}
            </div>

            {/* 2. Phone Number Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 block text-right">
                رقم الموبايل / الهاتف (Phone Number)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-zinc-500 group-focus-within:text-amber-400 transition-colors" />
                </div>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="01012345678"
                  dir="ltr"
                  className={`w-full pl-4 pr-10 py-2.5 rounded-2xl bg-zinc-900/90 border font-mono text-sm text-white placeholder-zinc-500 outline-none transition-all text-right ${
                    errors.phoneNumber
                      ? 'border-rose-500/60 focus:border-rose-400'
                      : 'border-zinc-800 focus:border-amber-500 shadow-inner'
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-[11px] text-rose-400 text-right">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Change Password Shortcut Banner */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenChangePassword}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/30 text-zinc-300 hover:text-amber-400 text-xs font-bold transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>تغيير كلمة المرور وتأمين الحساب</span>
                </div>
                <span className="text-[10px] text-zinc-500 group-hover:text-amber-400 transition-colors font-mono">
                  Change Password →
                </span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 pt-3 border-t border-amber-500/15">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:flex-1 py-3 rounded-2xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer text-center"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black text-xs font-black shadow-gold-glow hover:scale-[1.02] sm:hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                    <span>جاري تحديث البيانات...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>تحديث البيانات الشخصية</span>
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

export default UserProfileSettingsModal;
