import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, RefreshCw, LogOut, Sparkles, ShieldCheck, Phone, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import wolfLogo from '../../assets/logo.png';
import gymBg from '../../assets/gym-bg.jpg';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { customerService } from '../../services/apiClient';

export const PendingApprovalPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { success: toastSuccess, info: toastInfo } = useToast();

  const [loading, setLoading] = useState(false);
  const [memberData, setMemberData] = useState(null);

  // Check current customer approval status
  const checkStatus = async (showToast = false) => {
    setLoading(true);
    try {
      const data = await customerService.getCustomerMe();
      setMemberData(data);
      const status = data?.approvalStatus !== undefined ? Number(data.approvalStatus) : 0;

      if (status === 1) {
        toastSuccess('مبروك يا بطل! تم تفعيل عضويتك', 'تم اعتماد حسابك في كتيبة الذئاب بنجاح.');
        navigate('/dashboard/customer', { replace: true });
        return;
      }

      if (showToast) {
        toastInfo('حالة الحساب', 'طلبك ما زال قيد المراجعة لدى كباتن وموظفي الاستقبال.');
      }
    } catch (err) {
      console.warn('Error checking status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus(false);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-[#070707] text-white font-cairo flex items-center justify-center p-4 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Background Image with dark overlay */}
      <div className="fixed inset-0 pointer-events-none">
        <img src={gymBg} alt="" className="w-full h-full object-cover opacity-25 filter grayscale contrast-125" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl relative z-10 wolf-glass rounded-3xl p-6 sm:p-10 border border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.12)] text-center"
      >
        {/* Top Gold Accent Line */}
        <div className="absolute top-0 right-8 left-8 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-black/90 border border-amber-500/40 p-2 shadow-gold-glow mb-3">
            <img src={wolfLogo} alt="BE THE WOLF" className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
            BE THE WOLF
          </h1>
          <span className="text-[11px] text-zinc-400 font-semibold mt-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            بوابة المشتركين والوحوش
          </span>
        </div>

        {/* Pending Icon */}
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 shadow-gold-glow">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-black animate-ping" />
          </span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-3">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          طلب الاشتراك قيد المراجعة
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white mb-3">
          أهلاً بك في كتيبة الذئاب يا {memberData?.name || user?.name || 'بطل'}!
        </h2>

        <p className="text-sm text-zinc-300 leading-relaxed max-w-md mx-auto mb-6">
          تم استلام طلب اشتراكك بنجاح، ويقوم كباتن وموظفو الاستقبال بمراجعة بياناتك واعتماد عضويتك حالياً.
          بمجرد تفعيل الحساب ستتمكن من تسجيل الدخول واستلام كود الوحش الخاص بك وبدء التمرين فوراً.
        </p>

        {/* Member Details Summary */}
        <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 text-right space-y-2.5 mb-6 text-xs sm:text-sm">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              اسم العضو:
            </span>
            <span className="text-white font-bold">{memberData?.name || user?.name || 'عضو جديد'}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              رقم الهاتف:
            </span>
            <span className="text-white font-mono">{memberData?.phoneNumber || user?.phoneNumber || 'غير مسجل'}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              البريد الإلكتروني:
            </span>
            <span className="text-white font-mono">{user?.email || memberData?.email}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => checkStatus(true)}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-bold shadow-gold-glow flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'جاري الفحص...' : 'فحص حالة التفعيل الآن'}</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PendingApprovalPage;
