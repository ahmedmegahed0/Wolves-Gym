import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Dumbbell, 
  Award, 
  Clock, 
  DollarSign, 
  Phone, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Sparkles, 
  Crown,
  Key,
  Users,
  Target
} from 'lucide-react';
import { trainerService } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import wolfLogo from '../../assets/logo.png';

/**
 * TrainerMeProfile Component
 * Displays the statistics and profile of the currently logged-in trainer (GET /api/Trainers/me)
 */
export const TrainerMeProfile = () => {
  const { user, setIsChangePasswordModalOpen } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await trainerService.getTrainerMe();
      setProfile(data);
    } catch (err) {
      console.warn('Failed to load /api/Trainers/me:', err);
      toastError('تعذر تحميل الملف الشخصي للكابتن', err.message || 'يرجى التأكد من تسجيل الدخول بحساب مدرب.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div dir="rtl" className="w-full max-w-4xl mx-auto p-4 sm:p-6 font-cairo animate-pulse space-y-6">
        <div className="h-44 bg-zinc-900/60 rounded-3xl border border-zinc-800" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-900/50 rounded-2xl border border-zinc-850" />
          ))}
        </div>
      </div>
    );
  }

  const trainerName = profile?.name || user?.name || 'كابتن كتيبة الذئاب';
  const isActive = Boolean(profile?.isActive ?? profile?.isTrainerActive ?? true);
  const isAvailable = Boolean(profile?.isAvailable ?? true);
  const years = profile?.yearsOfExperience ?? 1;
  const salary = profile?.salary ?? 0;

  return (
    <div dir="rtl" className="w-full max-w-4xl mx-auto space-y-6 font-cairo">
      {/* Hero Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#18150f] via-[#111116] to-black border border-amber-500/30 p-6 sm:p-8 shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-right">
            {/* Coach Avatar */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-3xl blur-md opacity-50 group-hover:opacity-75 transition duration-300" />
              <div className="relative w-24 h-24 rounded-3xl bg-black border-2 border-amber-500/60 flex items-center justify-center text-amber-400 font-mono font-black text-3xl shadow-2xl">
                {trainerName.slice(0, 1)}
                <span className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full border-2 border-black ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">{trainerName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  كابتن مدرب معتمد
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span>{isActive ? 'حساب مفعل' : 'حساب معطل'}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    isAvailable
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-amber-400' : 'bg-zinc-500'}`} />
                  <span>{isAvailable ? 'متاح للحجز' : 'غير متاح حالياً'}</span>
                </span>
              </div>

              <p className="text-xs text-zinc-400 flex items-center justify-center sm:justify-start gap-3 flex-wrap font-mono">
                {profile?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>{profile.email}</span>
                  </span>
                )}
                {profile?.phoneNumber && (
                  <span className="flex items-center gap-1" dir="ltr">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>{profile.phoneNumber}</span>
                  </span>
                )}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300">
                  رقم المدرب #{profile?.id || profile?.trainerId || '1'}
                </span>
                <span className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300">
                  كود الموظف #{profile?.employeeId || '1'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchProfile(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-zinc-900 text-amber-400 border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>تغيير كلمة المرور</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Experience */}
        <div className="bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-400 block truncate">سنوات الخبرة</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {years} <span className="text-xs font-cairo font-normal">سنوات</span>
            </span>
          </div>
        </div>

        {/* Salary */}
        <div className="bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-400 block truncate">الراتب الأساسي</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {salary.toLocaleString('ar-EG')}{' '}
              <span className="text-xs font-cairo font-normal text-zinc-400">ج.م</span>
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-emerald-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-400 block truncate">حالة الكابتن</span>
            <span className="text-base sm:text-lg font-black text-emerald-400">
              {isActive ? 'معتمد ونشط' : 'متوقف مؤقتاً'}
            </span>
          </div>
        </div>

        {/* Role Badge */}
        <div className="bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-sky-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-400 block truncate">الرتبة الرياضية</span>
            <span className="text-base sm:text-lg font-black text-sky-300">
              كابتن تدريب PT
            </span>
          </div>
        </div>
      </div>

      {/* Responsibilities & Quick Actions */}
      <div className="bg-gradient-to-b from-[#121216] to-[#09090b] border border-amber-500/20 rounded-3xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>مهام وصلاحيات الكابتن بصالة الذئاب</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <h4 className="text-xs font-bold text-amber-300">متابعة المتدربين (PT)</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              الإشراف على الوحوش المشتركين في الباقات الخاصة والمشتركة وإعداد برامج التدريب المناسبة.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <h4 className="text-xs font-bold text-amber-300">قياسات الـ InBody</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              متابعة القياسات البدنية ونسب الدهون والعضلات وتحديثها في ملفات الأعضاء.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <h4 className="text-xs font-bold text-amber-300">التدريب الآمن</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              توجيه الأعضاء على الأداء الصحيح للأوزان والآلات الرياضية لتجنب الإصابات.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerMeProfile;
