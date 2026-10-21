import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Eye, EyeOff, X, Loader2, Sparkles, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { changePassword, loading } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.currentPassword) {
      errs.currentPassword = 'برجاء إدخال كلمة المرور الحالية';
    }

    if (!formData.newPassword) {
      errs.newPassword = 'برجاء إدخال كلمة المرور الجديدة';
    } else if (formData.newPassword.length < 8) {
      errs.newPassword = 'كلمة المرور يجب أن لا تقل عن 8 أحرف';
    }

    if (!formData.confirmNewPassword) {
      errs.confirmNewPassword = 'برجاء تأكيد كلمة المرور الجديدة';
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      errs.confirmNewPassword = 'كلمتا المرور غير متطابقتين';
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

    const result = await changePassword(formData);
    if (result?.success) {
      setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-cairo">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          className="wolf-glass bg-zinc-950/95 border border-amber-500/30 rounded-3xl p-6 lg:p-7 max-w-md w-full shadow-2xl relative overflow-hidden"
        >
          {/* Accent Line */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 opacity-90" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-gold-glow">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  تغيير كلمة المرور
                </h3>
                <p className="text-xs text-zinc-400">
                  تحديث أمان حسابك الشخصي في الجيم
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="py-4 space-y-4" noValidate>
            {/* Current Password */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5 text-right">
                كلمة المرور الحالية:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4 text-amber-400/80" />
                </div>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="كلمة المرور الحالية"
                  dir="ltr"
                  className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-11 py-2.5 border font-mono tracking-wider transition-all focus:outline-none text-right ${
                    errors.currentPassword
                      ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                      : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 hover:text-amber-400"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-rose-400 mt-1 text-right font-medium">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5 text-right">
                كلمة المرور الجديدة (8+ أحرف):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4 text-amber-400/80" />
                </div>
                <input
                  type={showNew ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  dir="ltr"
                  className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-11 py-2.5 border font-mono tracking-wider transition-all focus:outline-none text-right ${
                    errors.newPassword
                      ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                      : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 hover:text-amber-400"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-rose-400 mt-1 text-right font-medium">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5 text-right">
                تأكيد كلمة المرور الجديدة:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4 text-amber-400/80" />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  dir="ltr"
                  className={`w-full bg-black/60 text-white placeholder-zinc-500 text-sm rounded-2xl pr-10 pl-11 py-2.5 border font-mono tracking-wider transition-all focus:outline-none text-right ${
                    errors.confirmNewPassword
                      ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                      : 'border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400 hover:text-amber-400"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmNewPassword && (
                <p className="text-xs text-rose-400 mt-1 text-right font-medium">{errors.confirmNewPassword}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-5 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-500 text-black transition-all shadow-gold-glow flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-black" />
                    <span>تأكيد تغيير كلمة المرور</span>
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

export default ChangePasswordModal;
