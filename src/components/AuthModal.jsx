import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Shield, Check, X, AlertTriangle, ExternalLink, Sliders, Sparkles } from 'lucide-react';
import { getStoredToken, setStoredToken, isDemoModeActive, setDemoMode, STORAGE_KEYS } from '../services/apiClient';
import { useToast } from '../context/ToastContext';

export const AuthModal = ({ isOpen, onClose, onTokenUpdated }) => {
  const { success: toastSuccess, info: toastInfo } = useToast();
  const [tokenInput, setTokenInput] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTokenInput(getStoredToken());
      setIsDemo(isDemoModeActive());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveToken = () => {
    setStoredToken(tokenInput.trim());
    setDemoMode(isDemo);
    toastSuccess('تم حفظ الإعدادات بنجاح', 'تم تحديث توكن المصادقة وحالة الاتصال.');
    if (onTokenUpdated) onTokenUpdated();
    onClose();
  };

  const handleClearToken = () => {
    setStoredToken('');
    setTokenInput('');
    toastInfo('تم مسح التوكن', 'تمت إزالة توكن المصادقة من المتصفح.');
    if (onTokenUpdated) onTokenUpdated();
  };

  const handleQuickDemoToggle = (checked) => {
    setIsDemo(checked);
  };

  return (
    <AnimatePresence>
      <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-cairo">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          className="wolf-glass bg-zinc-950/95 border border-amber-500/25 rounded-3xl p-6 lg:p-7 max-w-lg w-full shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  إعدادات الربط والتوكن البرمجي
                </h3>
                <p className="text-xs text-zinc-400">
                  إدارة توكن المصادقة (Bearer JWT) أو تفعيل الوضع التجريبي
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-4">
            {/* Target Server Indicator */}
            <div className="bg-black/60 rounded-2xl p-3.5 border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">سيرفر الجيم المربوط:</span>
              <a
                href="https://wolves.runasp.net"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 font-mono font-bold hover:underline flex items-center gap-1.5"
              >
                <span>wolves.runasp.net</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Demo / Sandbox Switch */}
            <div className="bg-zinc-900/60 rounded-2xl p-4 border border-amber-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  الوضع التجريبي التفاعلي (Interactive Demo Mode)
                </span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  يتيح تجربة تسجيل الدخول والخروج واللوكرات واحتساب الإشغال مباشرة بدون الحاجة لتوكن موظف معتمد.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mr-3">
                <input
                  type="checkbox"
                  checked={isDemo}
                  onChange={(e) => handleQuickDemoToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-yellow-400"></div>
              </label>
            </div>

            {/* Bearer Token Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  توكن المصادقة (Bearer JWT Token):
                </label>
                {tokenInput ? (
                  <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    <Check className="w-3 h-3" /> متصل بتوكن
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 font-mono">اختياري</span>
                )}
              </div>

              <textarea
                rows={3}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="الصق توكن الدخول هنا (e.g. eyJhbGciOiJIUzI1Ni...)"
                dir="ltr"
                className="w-full bg-black text-white placeholder-zinc-600 text-xs rounded-2xl p-3 border border-zinc-800 font-mono focus:outline-none focus:border-amber-400 resize-none text-left"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                يُحفظ في المتصفح ويتم إرساله تلقائياً في ترويسة <code>Authorization: Bearer</code>.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClearToken}
              className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              مسح التوكن
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveToken}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black transition-all shadow-gold-glow"
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
