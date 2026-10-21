import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Activity, 
  Clock, 
  KeyRound, 
  ShieldCheck, 
  Scale, 
  Ruler, 
  HeartPulse, 
  QrCode, 
  Copy, 
  Check, 
  LogOut, 
  Key, 
  RefreshCw, 
  AlertCircle, 
  Calendar, 
  Zap, 
  TrendingUp, 
  Dumbbell, 
  Lock, 
  User,
  Crown,
  Sparkles,
  Phone,
  Info
} from 'lucide-react';
import wolfLogo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { customerService, attendanceService, STORAGE_KEYS } from '../../services/apiClient';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import PackagesPricingGrid from '../packages/PackagesPricingGrid';

export const CustomerDashboard = () => {
  const { user, logout, isChangePasswordModalOpen, setIsChangePasswordModalOpen } = useAuth();
  const { success: toastSuccess, info: toastInfo } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'packages'

  // Live gym occupancy
  const [occupancyData, setOccupancyData] = useState({
    currentOccupancy: 0,
    maxCapacity: 100,
    percentage: 0,
  });

  // Current session status (whether member is checked in right now)
  const [activeSession, setActiveSession] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Member Profile and Live Occupancy
  const loadMemberData = async () => {
    try {
      const [profileRes, occupancyRes] = await Promise.allSettled([
        customerService.getCustomerMe(),
        attendanceService.getCurrentOccupancy(),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value) {
        const raw = profileRes.value;
        const normalized = {
          ...raw,
          name: raw.name || raw.Name || user?.name || 'وحش الجيم',
          phoneNumber: raw.phoneNumber || raw.PhoneNumber || user?.phoneNumber || '',
          code: raw.code || raw.Code || 'WOLF-MEMBER',
          height: Number(raw.height || raw.Height || 180),
          weight: Number(raw.weight || raw.Weight || 82),
          musclePercentage: Number(raw.musclePercentage || raw.MusclePercentage || 45),
          fatPercentage: Number(raw.fatPercentage || raw.FatPercentage || 14),
          injuries: raw.injuries || raw.Injuries || '',
          chronicDiseases: raw.chronicDiseases || raw.ChronicDiseases || '',
          notes: raw.notes || raw.Notes || '',
          approvalStatus: raw.approvalStatus !== undefined 
            ? Number(raw.approvalStatus) 
            : (raw.ApprovalStatus !== undefined ? Number(raw.ApprovalStatus) : 1),
          isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : (raw.IsActive !== undefined ? Boolean(raw.IsActive) : true),
        };
        setProfile(normalized);
        
        // Check if member is currently inside (from active members in localStorage)
        try {
          const activeList = JSON.parse(localStorage.getItem('gym_active_members') || '[]');
          const memberCode = normalized.code;
          const inside = activeList.find((m) => m.code === memberCode);
          setActiveSession(inside || null);
        } catch {
          setActiveSession(null);
        }
      } else {
        // Fallback for member view
        setProfile({
          name: user?.name || 'Customer User',
          phoneNumber: user?.phoneNumber || '01234567892',
          code: 'WOLF-MEMBER',
          height: 180,
          weight: 82,
          musclePercentage: 45.0,
          fatPercentage: 14.0,
          approvalStatus: 1,
          isActive: true,
        });
      }

      if (occupancyRes.status === 'fulfilled' && occupancyRes.value) {
        const occ = occupancyRes.value;
        const current = Number(occ.currentOccupancy || occ.count || 0);
        const max = Number(occ.maxCapacity || 100);
        const pct = Math.min(100, Math.round((current / max) * 100));
        setOccupancyData({
          currentOccupancy: current,
          maxCapacity: max,
          percentage: pct,
        });
      }
    } catch (err) {
      console.warn('Failed to load member data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMemberData();
    // Auto refresh every 45s
    const interval = setInterval(loadMemberData, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadMemberData();
  };

  const handleCopyCode = () => {
    if (profile?.code) {
      navigator.clipboard.writeText(profile.code);
      setCopiedCode(true);
      toastSuccess('تم نسخ الكود!', `كود الوحش الخاص بك: ${profile.code}`);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // Safe metrics calculations
  const heightMeters = Number(profile?.height || 0) / 100;
  const weight = Number(profile?.weight || 0);
  const bmi =
    heightMeters > 0 && weight > 0
      ? (weight / (heightMeters * heightMeters)).toFixed(1)
      : null;

  const getBmiStatus = (val) => {
    if (!val) return { label: 'غير مسجل', color: 'text-zinc-500' };
    const num = parseFloat(val);
    if (num < 18.5) return { label: 'نحافة بدنية', color: 'text-blue-400' };
    if (num < 25) return { label: 'وزن مثالي رياضي', color: 'text-emerald-400' };
    if (num < 30) return { label: 'كتلة عضلية / وزن زائد', color: 'text-amber-400' };
    return { label: 'سمنة بدنية', color: 'text-rose-400' };
  };

  const bmiStatus = getBmiStatus(bmi);

  // Time-based greeting
  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours >= 5 && hours < 12) return 'صباح النشاط والعزيمة يا بطل!';
    if (hours >= 12 && hours < 17) return 'يومك قوة وتمرين يا وحش!';
    return 'مساء الحديد والبطولة يا كابتن!';
  };

  // Determine Approval State
  const approvalStatus = profile?.approvalStatus !== undefined ? Number(profile.approvalStatus) : 1;
  const isPending = approvalStatus === 0;
  const isRejected = approvalStatus === 2;
  const isApproved = approvalStatus === 1;

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center font-cairo p-4">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
          <div className="absolute inset-0 rounded-full blur-md bg-amber-400/20" />
        </div>
        <p className="text-zinc-400 text-sm font-semibold animate-pulse">
          جاري تجهيز لوحة تحكم الوحش...
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0a0a0a] text-white font-cairo flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Top Luxury Navbar */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-amber-500/15 px-3 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative group cursor-pointer">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl p-0.5 bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-700 shadow-gold-glow flex items-center justify-center">
                <img
                  src={wolfLogo}
                  alt="BE THE WOLF"
                  className="w-full h-full object-contain rounded-xl sm:rounded-2xl bg-black p-1"
                />
              </div>
            </div>

            <div>
              <h1 className="text-base sm:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 leading-none">
                BE THE WOLF
              </h1>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-semibold mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                بوابة المشتركين والوحوش
              </p>
            </div>
          </div>

          {/* User Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock on desktop */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 rounded-xl border border-zinc-800/80 transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 rounded-xl border border-zinc-800/80 transition-colors hidden sm:flex"
              title="تغيير كلمة المرور"
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'packages' ? 'overview' : 'packages')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'packages'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>باقات واشتراكات</span>
            </button>

            <div className="flex items-center gap-2 bg-zinc-900/80 border border-amber-500/20 rounded-xl px-2.5 py-1.5 text-xs">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center font-mono text-[11px]">
                {profile?.name ? profile.name.slice(0, 1).toUpperCase() : (user?.name ? user.name.slice(0, 1).toUpperCase() : 'W')}
              </div>
              <div className="text-right hidden sm:block">
                <span className="font-bold text-white block text-[11px] leading-tight">
                  {profile?.name || user?.name || 'عضو الجيم'}
                </span>
                <span className="text-[9px] text-amber-400 font-mono flex items-center gap-0.5">
                  🐺 وحش الجيم
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 space-y-6">
        
        {/* ============================================================== */}
        {/* CASE 1: PENDING APPROVAL (طلب قيد المراجعة) */}
        {/* ============================================================== */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="wolf-glass rounded-3xl p-6 sm:p-10 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden text-center max-w-2xl mx-auto my-8"
          >
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
            
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-5 shadow-gold-glow animate-pulse">
              <Clock className="w-10 h-10" />
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center gap-1.5 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              حسابك قيد المراجعة والاعتماد
            </span>

            <h2 className="text-xl sm:text-3xl font-black text-white mb-3">
              أهلاً بك في كتيبة الذئاب يا {profile?.name || user?.name || 'بطل'}!
            </h2>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-lg mx-auto mb-6">
              تم استلام طلب اشتراكك بنجاح، ويقوم كباتن وموظفو الاستقبال بمراجعة بياناتك واعتماد عضويتك حالياً. 
              بمجرد التفعيل ستتمكن من مسح كود الدخول الخاص بك واستخدام اللوكر وبدء التمارين فوراً.
            </p>

            <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800 text-right space-y-2 mb-6 max-w-md mx-auto text-xs sm:text-sm">
              <div className="flex justify-between items-center text-zinc-400">
                <span>اسم العضو:</span>
                <span className="text-white font-bold">{profile?.name || user?.name}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>رقم الهاتف:</span>
                <span className="text-white font-mono">{profile?.phoneNumber || user?.phoneNumber || 'غير مسجل'}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>البريد الإلكتروني:</span>
                <span className="text-white font-mono">{user?.email}</span>
              </div>
            </div>

            <button
              onClick={handleManualRefresh}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm shadow-gold-glow hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>فحص حالة التفعيل الآن</span>
            </button>
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* CASE 2: REJECTED APPROVAL (طلب مرفوض أو معلق) */}
        {/* ============================================================== */}
        {isRejected && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="wolf-glass rounded-3xl p-6 sm:p-10 border border-rose-500/30 text-center max-w-2xl mx-auto my-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
              العضوية غير مفعلة حالياً
            </h2>

            <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">
              نعتذر منك، لم يتم تفعيل حسابك أو تم تعليق الاشتراك مؤقتاً. يرجى التوجه لمكتب استقبال الجيم للاستفسار وتحديث بياناتك.
            </p>

            <button
              onClick={handleManualRefresh}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold"
            >
              إعادة التحقق
            </button>
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* CASE 3: APPROVED (العضو النشط والداشبورد الكاملة) */}
        {/* ============================================================== */}
        {isApproved && (
          <>
            {/* Welcome Banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-zinc-900/50 to-zinc-900/30 border border-amber-500/20 rounded-2xl p-4 sm:p-5"
            >
              <div>
                <span className="text-[11px] sm:text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5" />
                  {getGreeting()}
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  مرحباً يا بطل، <span className="text-amber-400">{profile?.name || user?.name || 'الوحش'}</span> 🐺
                </h2>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  عضو نشط ومعتمد
                </span>
              </div>
            </motion.div>

            {/* Top Navigation Tabs for Customer: Profile & Pass vs Packages */}
            <div className="flex items-center gap-2 bg-zinc-950/90 p-1.5 rounded-2xl border border-amber-500/20 max-w-md">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>ملفي الرياضي والكارت</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('packages')}
                className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'packages'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>باقات وعضويات التدريب</span>
              </button>
            </div>

            {activeTab === 'packages' ? (
              <motion.div
                key="customer-packages-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="pt-2"
              >
                <PackagesPricingGrid isEmbedded={true} />
              </motion.div>
            ) : (
              <>
                {/* Quick Overview Grid: Digital Pass + Current Session + Gym Occupancy */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* 1. Digital Member Pass (بطاقة الوحش الرقمية) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-3xl p-6 bg-gradient-to-br from-amber-600/30 via-zinc-900 to-black border-2 border-amber-500/40 shadow-gold-glow flex flex-col justify-between overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-black border border-amber-500/40 p-1 flex items-center justify-center">
                        <img src={wolfLogo} alt="Wolf" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-xs font-black tracking-wider text-amber-400">BE THE WOLF PASS</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                      VIP MEMBER
                    </span>
                  </div>

                  <div className="space-y-1 mb-5">
                    <span className="text-[11px] text-zinc-400">اسم الوحش:</span>
                    <h3 className="text-lg font-black text-white">{profile?.name || user?.name}</h3>
                  </div>

                  {/* Member Code Barcode Simulator */}
                  <div className="bg-black/80 rounded-2xl p-4 border border-amber-500/30 text-center space-y-2">
                    <span className="text-[10px] text-zinc-400 block">كود الوحش للدخول والاستقبال:</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 tracking-widest">
                        {profile?.code || 'WOLF-MEMBER'}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-amber-400 hover:bg-zinc-700 transition-colors"
                        title="نسخ الكود"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Barcode Lines Graphics */}
                    <div className="flex justify-center items-center gap-1 pt-1 opacity-75">
                      {[4, 2, 6, 3, 5, 2, 4, 6, 2, 5, 3, 4, 6, 2, 5, 4, 2, 6].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h * 4}px` }}
                          className={`w-1 rounded-sm ${i % 2 === 0 ? 'bg-amber-400' : 'bg-zinc-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800/80">
                  <span>امسح الكود عند الريسبشن</span>
                  <span className="font-mono text-amber-400/80">Wolves Gym System</span>
                </div>
              </motion.div>

              {/* 2. Active Workout / Locker Status (حالة التواجد الحالية واللوكر) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                className="wolf-glass rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white">حالة التواجد واللوكر</h3>
                    </div>
                    {activeSession ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                        داخل الجيم الآن 🔥
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400">
                        خارج الجيم
                      </span>
                    )}
                  </div>

                  {activeSession ? (
                    <div className="space-y-4 my-2">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
                        <span className="text-xs text-zinc-400 block mb-1">لوكر التمارين المخصص لك:</span>
                        <span className="text-3xl font-mono font-black text-amber-400 tracking-wider">
                          #{activeSession.lockerId}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 space-y-1">
                        <div className="flex justify-between">
                          <span>وقت تسجيل الدخول:</span>
                          <span className="font-mono text-white">
                            {new Date(activeSession.checkInTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-400/90 pt-1">
                          عاش يا بطل! متنساش تعمل تسجيل خروج عند الريسبشن لما تخلص تمرينتك وتسلم مفتاح اللوكر.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
                        <Dumbbell className="w-6 h-6 text-amber-400/70" />
                      </div>
                      <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                        أنت مش مسجل دخول في الجيم دلوقتي. 
                        أول ما توصل للجيم، أظهر كود الوحش الخاص بك لمسؤول الاستقبال لاستلام اللوكر وبدء التمرين.
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span>أمان اللوكرات مضمون</span>
                  <span className="text-amber-400 font-bold">Wolves Safety</span>
                </div>
              </motion.div>

              {/* 3. Live Gym Occupancy Radar (رادار إشغال الجيم) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="wolf-glass rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                        <Activity className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white">نسبة إشغال الجيم الحالية</h3>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      مباشر
                    </span>
                  </div>

                  <div className="py-2 text-center">
                    <div className="relative inline-flex items-center justify-center my-2">
                      {/* Circular Progress Indicator */}
                      <div className="w-24 h-24 rounded-full border-4 border-zinc-800 flex items-center justify-center relative">
                        <div
                          className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"
                          style={{ animationDuration: '8s' }}
                        />
                        <div className="text-center">
                          <span className="text-2xl font-mono font-black text-amber-400">
                            {occupancyData.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      <h4 className="text-sm font-bold text-white">
                        {occupancyData.percentage < 40 && 'الجيم رايق وجاهز للتمرين 🔥'}
                        {occupancyData.percentage >= 40 && occupancyData.percentage < 75 && 'إشغال متوسط ومناسب للتمرين 💪'}
                        {occupancyData.percentage >= 75 && 'وقت ذروة (الجيم مليان طاقة) ⚡'}
                      </h4>
                      <p className="text-xs text-zinc-400 font-mono">
                        {occupancyData.currentOccupancy} وحش يتمرنون الآن من أصل {occupancyData.maxCapacity}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span>تحديث حي كل 45 ثانية</span>
                  <span className="text-amber-400 font-bold">Live Tracker</span>
                </div>
              </motion.div>
            </div>

            {/* Physical Metrics & Health Profile (القياسات البدنية والملف الصحي) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="wolf-glass rounded-3xl p-6 sm:p-7 border border-amber-500/20 relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      مؤشرات اللياقة والقياسات البدنية
                    </h3>
                    <p className="text-xs text-zinc-400">
                      بياناتك المسجلة لمتابعة تطور لياقتك وكتلتك العضلية
                    </p>
                  </div>
                </div>

                {bmi && (
                  <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
                    <span className="text-xs text-zinc-400">مؤشر BMI:</span>
                    <span className="text-sm font-black font-mono text-amber-400">{bmi}</span>
                    <span className={`text-xs font-bold ${bmiStatus.color}`}>({bmiStatus.label})</span>
                  </div>
                )}
              </div>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
                {/* Weight */}
                <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800/80 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span>الوزن الحالي</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-white">
                      {profile?.weight || '--'}
                    </span>
                    <span className="text-xs text-zinc-500 font-bold">كجم</span>
                  </div>
                </div>

                {/* Height */}
                <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800/80 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                    <Ruler className="w-4 h-4 text-amber-400" />
                    <span>الطول</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-white">
                      {profile?.height || '--'}
                    </span>
                    <span className="text-xs text-zinc-500 font-bold">سم</span>
                  </div>
                </div>

                {/* Muscle Percentage */}
                <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800/80 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    <span>نسبة العضلات</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {profile?.musclePercentage ? `${profile.musclePercentage}%` : '--'}
                    </span>
                  </div>
                </div>

                {/* Fat Percentage */}
                <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800/80 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>نسبة الدهون</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-white">
                      {profile?.fatPercentage ? `${profile.fatPercentage}%` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Health Notes & Injuries alert */}
              {(profile?.injuries || profile?.chronicDiseases || profile?.notes) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <HeartPulse className="w-4 h-4" />
                    <span>الملف الصحي والرياضي المعتمد للكباتن:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
                    {profile?.injuries && (
                      <div>
                        <span className="text-zinc-500 block">إصابات سابقة:</span>
                        <p className="font-semibold text-rose-300">{profile.injuries}</p>
                      </div>
                    )}
                    {profile?.chronicDiseases && (
                      <div>
                        <span className="text-zinc-500 block">أمراض مزمنة أو محاذير:</span>
                        <p className="font-semibold text-amber-300">{profile.chronicDiseases}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

                {/* Packages & Membership Plans Section */}
                <div className="pt-6 border-t border-amber-500/20">
                  <PackagesPricingGrid isEmbedded={true} />
                </div>
              </motion.div>
            </>
          )}
        </>
      )}
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default CustomerDashboard;
