import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Info,
  Home,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import wolfLogo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { customerService, attendanceService } from '../../services/apiClient';
import { customersService } from '../../services/customersService';
import PackagesPricingGrid from '../packages/PackagesPricingGrid';
import TrainersSection from '../trainers/TrainersSection';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import UserProfileSettingsModal from '../profile/UserProfileSettingsModal';
import CustomerAttendanceCalendar from './CustomerAttendanceCalendar';

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { 
    user, 
    logout, 
    isChangePasswordModalOpen, 
    setIsChangePasswordModalOpen,
    isProfileSettingsModalOpen,
    setIsProfileSettingsModalOpen
  } = useAuth();
  const { success: toastSuccess } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'packages' | 'trainers'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.user-dropdown-container')) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [userMenuOpen]);

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

  // Fetch Member Profile, Live Occupancy, and Active Attendance/Locker
  const loadMemberData = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const now = new Date();
      const [profileRes, occupancyRes, activeGymAttRes] = await Promise.allSettled([
        customerService.getCustomerMe(),
        attendanceService.getCurrentOccupancy(),
        attendanceService.getAttendances({ isCurrentlyAttending: true, pageSize: 100 }),
      ]);

      let normalized = null;

      if (profileRes.status === 'fulfilled' && profileRes.value) {
        const raw = profileRes.value;
        normalized = {
          ...raw,
          id: raw.id || raw.customerId || raw.Id,
          name: raw.name || raw.Name || user?.name || 'عضو الجيم',
          phoneNumber: raw.phoneNumber || raw.PhoneNumber || user?.phoneNumber || '',
          code: raw.code || raw.Code || user?.code || null,
          height: (raw.height && Number(raw.height) > 0) ? Number(raw.height) : ((raw.Height && Number(raw.Height) > 0) ? Number(raw.Height) : null),
          weight: (raw.weight && Number(raw.weight) > 0) ? Number(raw.weight) : ((raw.Weight && Number(raw.Weight) > 0) ? Number(raw.Weight) : null),
          musclePercentage: (raw.musclePercentage && Number(raw.musclePercentage) > 0) ? Number(raw.musclePercentage) : ((raw.MusclePercentage && Number(raw.MusclePercentage) > 0) ? Number(raw.MusclePercentage) : null),
          fatPercentage: (raw.fatPercentage && Number(raw.fatPercentage) > 0) ? Number(raw.fatPercentage) : ((raw.FatPercentage && Number(raw.FatPercentage) > 0) ? Number(raw.FatPercentage) : null),
          injuries: raw.injuries || raw.Injuries || '',
          chronicDiseases: raw.chronicDiseases || raw.ChronicDiseases || '',
          notes: raw.notes || raw.Notes || '',
          approvalStatus: raw.approvalStatus !== undefined 
            ? Number(raw.approvalStatus) 
            : (raw.ApprovalStatus !== undefined ? Number(raw.ApprovalStatus) : 1),
          isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : (raw.IsActive !== undefined ? Boolean(raw.IsActive) : true),
          createdAt: raw.createdAt || raw.CreatedAt || null,
        };
        setProfile(normalized);
      } else {
        normalized = {
          id: user?.id,
          name: user?.name || 'عضو الجيم',
          phoneNumber: user?.phoneNumber || '',
          code: user?.code || null,
          height: null,
          weight: null,
          musclePercentage: null,
          fatPercentage: null,
          approvalStatus: 1,
          isActive: true,
          createdAt: user?.createdAt || null,
        };
        setProfile(normalized);
      }

      // Check Real-Time Attendance & Locker Assignment
      let currentSession = null;
      const targetId = normalized?.id || user?.id;

      // 1. Check member attendances for this month directly from backend API
      if (targetId) {
        try {
          const myAttendances = await customersService.getCustomerAttendances(
            targetId,
            now.getMonth() + 1,
            now.getFullYear()
          );
          const attList = Array.isArray(myAttendances?.attendances) ? myAttendances.attendances : [];
          const activeItem = attList.find((a) => a.isCurrentlyAttending || !a.checkOutAt);
          if (activeItem) {
            currentSession = {
              isInside: true,
              checkInTime: activeItem.checkInAt,
              lockerId: activeItem.lockerId,
              lockerNumber: activeItem.lockerNumber || activeItem.lockerId,
              attendanceCode: activeItem.attendanceCode || normalized.code,
            };
          }
        } catch (myAttErr) {
          console.warn('Could not fetch customer personal attendances for active session:', myAttErr);
        }
      }

      // 2. Cross-check with general active attendances from gym
      if (!currentSession && activeGymAttRes.status === 'fulfilled' && activeGymAttRes.value) {
        const gData = activeGymAttRes.value;
        const gList = Array.isArray(gData?.data) ? gData.data : (Array.isArray(gData) ? gData : []);
        const match = gList.find(
          (a) =>
            (targetId && (Number(a.customerId) === Number(targetId) || Number(a.id) === Number(targetId))) ||
            (normalized?.code && a.attendanceCode && String(a.attendanceCode).toLowerCase() === String(normalized.code).toLowerCase()) ||
            (normalized?.email && a.customerEmail && a.customerEmail.toLowerCase() === normalized.email.toLowerCase())
        );
        if (match) {
          currentSession = {
            isInside: true,
            checkInTime: match.checkInAt,
            lockerId: match.lockerId,
            lockerNumber: match.lockerNumber || match.lockerId,
            attendanceCode: match.attendanceCode || normalized.code,
          };
        }
      }

      // 3. Fallback to localStorage active members
      if (!currentSession) {
        try {
          const activeList = JSON.parse(localStorage.getItem('gym_active_members') || '[]');
          const memberCode = normalized?.code || (targetId ? `ID-${targetId}` : null);
          const inside = activeList.find(
            (m) =>
              (memberCode && m.code === memberCode) ||
              (normalized?.code && String(m.code).toLowerCase() === String(normalized.code).toLowerCase())
          );
          if (inside) {
            currentSession = {
              isInside: true,
              checkInTime: inside.checkInTime || inside.timestamp,
              lockerId: inside.lockerId,
              lockerNumber: inside.lockerNumber || inside.lockerId,
              attendanceCode: inside.code,
            };
          }
        } catch {}
      }

      setActiveSession(currentSession);

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
    // Auto refresh every 30s to keep locker status in real-time sync
    const interval = setInterval(loadMemberData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadMemberData();
  };

  const memberCode = (profile?.code && String(profile.code).trim() && !String(profile.code).startsWith('ID-')) 
    ? String(profile.code).trim() 
    : (user?.code && String(user.code).trim() && !String(user.code).startsWith('ID-'))
    ? String(user.code).trim()
    : null;

  const handleCopyCode = () => {
    if (memberCode) {
      navigator.clipboard.writeText(memberCode);
      setCopiedCode(true);
      toastSuccess('تم نسخ الكود!', `كود الوحش الخاص بك: ${memberCode}`);
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
    <div dir="rtl" className="min-h-screen bg-[#0a0a0a] text-white font-cairo flex flex-col selection:bg-amber-500 selection:text-black overflow-x-hidden">
      {/* Top Luxury Navbar */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-amber-500/15 px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Brand */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group/logo flex-shrink-0"
            title="العودة للصفحة الرئيسية"
          >
            <div className="relative group">
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl p-0.5 bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-700 shadow-gold-glow flex items-center justify-center">
                <img
                  src={wolfLogo}
                  alt="WOLVES"
                  className="w-full h-full object-contain rounded-xl sm:rounded-2xl bg-black p-0.5 sm:p-1"
                />
              </div>
            </div>

            <div>
              <h1 className="text-sm sm:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 leading-none group-hover/logo:text-amber-300">
                WOLVES
              </h1>
              <p className="text-[9px] sm:text-xs text-zinc-400 font-semibold mt-0.5 sm:mt-1 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                <span className="truncate max-w-[120px] sm:max-w-none">بوابة المشتركين والوحوش</span>
              </p>
            </div>
          </div>

          {/* Desktop Right Controls: Clock + Refresh + Avatar Profile Dropdown */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Live Clock on desktop */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 rounded-xl border border-zinc-800/80 transition-colors cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* User Avatar & Dropdown Menu */}
            <div className="relative user-dropdown-container">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border transition-all cursor-pointer group ${
                  userMenuOpen 
                    ? 'bg-zinc-800/90 border-amber-500/60 shadow-gold-glow' 
                    : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 hover:border-amber-500/40'
                }`}
                title="قائمة الحساب"
              >
                <div className="text-right">
                  <span className="font-bold text-white block text-xs leading-tight group-hover:text-amber-300 transition-colors">
                    {profile?.name || user?.name || 'عضو الجيم'}
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-mono">
                    {memberCode || 'عضو Wolves'}
                  </span>
                </div>

                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-black font-black flex items-center justify-center font-mono text-sm shadow-sm group-hover:scale-105 transition-transform">
                    {profile?.name ? profile.name.slice(0, 1).toUpperCase() : (user?.name ? user.name.slice(0, 1).toUpperCase() : 'W')}
                  </div>
                  {activeSession && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" title="متواجد بالجيم حالياً" />
                  )}
                </div>

                <ChevronDown className={`w-4 h-4 text-zinc-400 group-hover:text-amber-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-amber-400' : ''}`} />
              </button>

              {/* User Dropdown Popup */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-64 bg-zinc-950/95 backdrop-blur-2xl border border-amber-500/30 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden font-cairo"
                  >
                    {/* Header info */}
                    <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-black font-black flex items-center justify-center font-mono text-base shadow-sm">
                          {profile?.name ? profile.name.slice(0, 1).toUpperCase() : 'W'}
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-black text-white truncate">
                            {profile?.name || user?.name || 'عضو الجيم'}
                          </h4>
                          <span className="text-[10px] text-zinc-400 block font-mono">
                            {user?.email || profile?.phoneNumber || 'عضوية معتمدة'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400">حالة التواجد:</span>
                        {activeSession ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            في الجيم (لوكر #{activeSession.lockerNumber || activeSession.lockerId})
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-medium">خارج الجيم</span>
                        )}
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('profile');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-200 hover:text-amber-400 hover:bg-zinc-900/90 rounded-xl transition-all text-right cursor-pointer"
                      >
                        <User className="w-4 h-4 text-amber-400" />
                        <span>الملف الشخصي والقياسات</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsChangePasswordModalOpen(true);
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-200 hover:text-amber-400 hover:bg-zinc-900/90 rounded-xl transition-all text-right cursor-pointer"
                      >
                        <Key className="w-4 h-4 text-amber-400" />
                        <span>تغيير كلمة المرور</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigate('/');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-200 hover:text-amber-400 hover:bg-zinc-900/90 rounded-xl transition-all text-right cursor-pointer"
                      >
                        <Home className="w-4 h-4 text-amber-400" />
                        <span>الرئيسية للجيم</span>
                      </button>
                    </div>

                    {/* Logout button */}
                    <div className="pt-2 mt-1 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all text-right cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Right Controls: Refresh + Avatar Trigger */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-2 text-zinc-400 hover:text-amber-400 bg-zinc-900/90 rounded-xl border border-zinc-800 active:scale-95 transition-all"
              title="تحديث"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative p-1 rounded-xl bg-zinc-900 border border-amber-500/30 flex items-center gap-1.5 active:scale-95 transition-all"
              title="القائمة والحساب"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 text-black font-black flex items-center justify-center font-mono text-xs">
                {profile?.name ? profile.name.slice(0, 1).toUpperCase() : 'W'}
              </div>
              <Menu className="w-3.5 h-3.5 text-amber-400 ml-1" />
              {activeSession && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu with Framer Motion */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden border-t border-amber-500/20 mt-2.5 pt-3 space-y-2 bg-black/95 backdrop-blur-2xl rounded-2xl p-3 border border-zinc-800 font-cairo"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center font-mono text-xs">
                    {profile?.name ? profile.name.slice(0, 1).toUpperCase() : 'W'}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{profile?.name || user?.name || 'عضو الجيم'}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{memberCode || 'عضو Wolves'}</span>
                  </div>
                </div>
                {activeSession && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    داخل الجيم (#{activeSession.lockerNumber || activeSession.lockerId})
                  </span>
                )}
              </div>

              <div className="space-y-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900 text-xs font-bold text-zinc-200 border border-zinc-800 active:scale-95 text-right"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>الملف الشخصي والقياسات</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900 text-xs font-bold text-zinc-200 border border-zinc-800 active:scale-95 text-right"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>تغيير كلمة المرور</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900 text-xs font-bold text-zinc-200 border border-zinc-800 active:scale-95 text-right"
                >
                  <Home className="w-3.5 h-3.5 text-amber-400" />
                  <span>الصفحة الرئيسية للجيم</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold active:scale-95 transition-all mt-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-8 space-y-4 sm:space-y-6">
        
        {/* ============================================================== */}
        {/* CASE 1: PENDING APPROVAL (طلب قيد المراجعة) */}
        {/* ============================================================== */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="wolf-glass rounded-3xl p-5 sm:p-10 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden text-center max-w-2xl mx-auto my-4 sm:my-8"
          >
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
            
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 sm:mb-5 shadow-gold-glow animate-pulse">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center gap-1.5 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              حسابك قيد المراجعة والاعتماد
            </span>

            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white mb-2 sm:mb-3">
              أهلاً بك في كتيبة الذئاب يا {profile?.name || user?.name || 'بطل'}!
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-zinc-300 leading-relaxed max-w-lg mx-auto mb-5 sm:mb-6">
              تم استلام طلب اشتراكك بنجاح، ويقوم كباتن وموظفو الاستقبال بمراجعة بياناتك واعتماد عضويتك حالياً. 
              بمجرد التفعيل ستتمكن من مسح كود الدخول الخاص بك واستخدام اللوكر وبدء التمارين فوراً.
            </p>

            <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800 text-right space-y-2 mb-5 sm:mb-6 max-w-md mx-auto text-xs sm:text-sm">
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
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-xs sm:text-sm shadow-gold-glow hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
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
            className="wolf-glass rounded-3xl p-5 sm:p-10 border border-rose-500/30 text-center max-w-2xl mx-auto my-4 sm:my-8"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
              <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-white mb-2">
              العضوية غير مفعلة حالياً
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed">
              نعتذر منك، لم يتم تفعيل حسابك أو تم تعليق الاشتراك مؤقتاً. يرجى التوجه لمكتب استقبال الجيم للاستفسار وتحديث بياناتك.
            </p>

            <button
              onClick={handleManualRefresh}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold cursor-pointer"
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
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-zinc-900/50 to-zinc-900/30 border border-amber-500/20 rounded-2xl p-3.5 sm:p-5"
            >
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5" />
                  {getGreeting()}
                </span>
                <h2 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight">
                  مرحباً يا بطل، <span className="text-amber-400">{profile?.name || user?.name || 'الوحش'}</span> 🐺
                </h2>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-black flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  عضو نشط ومعتمد
                </span>
              </div>
            </motion.div>

            {/* Responsive Navigation Tabs for Customer */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2 bg-zinc-950/90 p-1.5 rounded-2xl border border-amber-500/20 w-full max-w-3xl">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">ملفي والكارت</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">البروفايل والقياسات</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                  activeTab === 'calendar'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">سجل الحضور</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('packages')}
                className={`py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                  activeTab === 'packages'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Crown className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">الباقات</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('trainers')}
                className={`py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                  activeTab === 'trainers'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">الكباتن</span>
              </button>
            </div>

            {activeTab === 'profile' ? (
              <motion.div
                key="customer-profile-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 pt-2 max-w-5xl mx-auto w-full font-cairo"
              >
                {/* 1. Member Profile Hero Card */}
                <div className="wolf-glass rounded-3xl p-5 sm:p-7 border border-amber-500/30 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 text-black font-black flex items-center justify-center font-mono text-2xl sm:text-3xl shadow-gold-glow shrink-0">
                        {profile?.name ? profile.name.slice(0, 1).toUpperCase() : (user?.name ? user.name.slice(0, 1).toUpperCase() : 'W')}
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-lg sm:text-2xl font-black text-white">
                            {profile?.name || user?.name || 'عضو الجيم'}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            عضو نشط ومعتمد
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                          {profile?.phoneNumber && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3.5 h-3.5 text-amber-400" />
                              {profile.phoneNumber}
                            </span>
                          )}
                          {user?.email && (
                            <span className="text-zinc-500 font-mono">
                              {user.email}
                            </span>
                          )}
                        </div>

                        {/* Code Status Badge */}
                        <div className="pt-1">
                          {memberCode ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/70 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                              <span>كود الوحش للدخول:</span>
                              <span className="text-sm font-black text-white">{memberCode}</span>
                              <button
                                type="button"
                                onClick={handleCopyCode}
                                className="p-1 hover:text-white transition-colors cursor-pointer"
                                title="نسخ الكود"
                              >
                                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold">
                              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              في انتظار تخصيص كود الدخول من موظف الاستقبال
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
                      <button
                        type="button"
                        onClick={() => setIsProfileSettingsModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <User className="w-4 h-4 text-amber-400" />
                        <span>تعديل الاسم والهاتف</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsChangePasswordModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Key className="w-4 h-4 text-amber-400" />
                        <span>تغيير كلمة المرور</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Physical Metrics & BMI Hero */}
                <div className="wolf-glass rounded-3xl p-5 sm:p-7 border border-amber-500/20 relative space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-gold-glow">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-white">
                          مؤشرات اللياقة والقياسات البدنية
                        </h3>
                        <p className="text-xs text-zinc-400">
                          الوزن، الطول، مؤشر كتلة الجسم (BMI)، ونسب العضلات والدهون
                        </p>
                      </div>
                    </div>

                    {bmi ? (
                      <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-amber-500/30 flex items-center gap-2 self-start sm:self-auto font-mono">
                        <span className="text-xs text-zinc-400">BMI:</span>
                        <span className="text-base font-black text-amber-400">{bmi}</span>
                        <span className={`text-xs font-bold ${bmiStatus.color}`}>({bmiStatus.label})</span>
                      </div>
                    ) : (
                      <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        <span>لم يتم تسجيل القياسات بعد</span>
                      </div>
                    )}
                  </div>

                  {/* 4 Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {/* Weight */}
                    <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-500/30 transition-all space-y-2">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs">
                        <Scale className="w-4 h-4 text-amber-400" />
                        <span>الوزن الحالي</span>
                      </div>
                      {profile?.weight ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black font-mono text-white">{profile.weight}</span>
                          <span className="text-xs text-zinc-400">كجم</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500 font-bold block pt-1">قيد التسجيل</span>
                      )}
                    </div>

                    {/* Height */}
                    <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-500/30 transition-all space-y-2">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs">
                        <Ruler className="w-4 h-4 text-amber-400" />
                        <span>الطول</span>
                      </div>
                      {profile?.height ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black font-mono text-white">{profile.height}</span>
                          <span className="text-xs text-zinc-400">سم</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500 font-bold block pt-1">قيد التسجيل</span>
                      )}
                    </div>

                    {/* Muscle % */}
                    <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-500/30 transition-all space-y-2">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs">
                        <Flame className="w-4 h-4 text-emerald-400" />
                        <span>نسبة العضلات</span>
                      </div>
                      {profile?.musclePercentage ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">{profile.musclePercentage}</span>
                          <span className="text-xs text-emerald-400">%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500 font-bold block pt-1">قيد التسجيل</span>
                      )}
                    </div>

                    {/* Fat % */}
                    <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-500/30 transition-all space-y-2">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs">
                        <Activity className="w-4 h-4 text-amber-400" />
                        <span>نسبة الدهون</span>
                      </div>
                      {profile?.fatPercentage ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black font-mono text-white">{profile.fatPercentage}</span>
                          <span className="text-xs text-amber-400">%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500 font-bold block pt-1">قيد التسجيل</span>
                      )}
                    </div>
                  </div>

                  {/* Health and Injuries Notes */}
                  <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                      <HeartPulse className="w-4 h-4" />
                      <span>السجل الصحي والإصابات المعتمد للكباتن:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-850">
                        <span className="text-zinc-400 text-[11px] block mb-1">الإصابات والعمليات السابقة:</span>
                        <p className="text-zinc-200 font-medium">
                          {profile?.injuries || 'لا توجد إصابات مسجلة (سليم رياضياً)'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-850">
                        <span className="text-zinc-400 text-[11px] block mb-1">الأمراض المزمنة والمحاذير:</span>
                        <p className="text-zinc-200 font-medium">
                          {profile?.chronicDiseases || 'لا توجد أمراض مزمنة أو محاذير مسجلة'}
                        </p>
                      </div>
                    </div>

                    {profile?.notes && (
                      <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-850 text-xs">
                        <span className="text-zinc-400 text-[11px] block mb-1">ملاحظات الكابتن والاستقبال:</span>
                        <p className="text-zinc-200">{profile.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Link to Attendance Calendar */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-black border border-amber-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">سجل وتمارين الحضور الشهري</h4>
                      <p className="text-[11px] text-zinc-400">تابع أيام حضورك للجيم ومواعيد الحصص وأرقام اللوكرات</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('calendar')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    عرض سجل الحضور
                  </button>
                </div>
              </motion.div>
            ) : activeTab === 'calendar' ? (
              <motion.div
                key="customer-calendar-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="pt-2 max-w-4xl mx-auto"
              >
                <CustomerAttendanceCalendar
                  customerId={profile?.id || profile?.customerId || user?.id}
                  customerName={profile?.name || user?.name}
                  joinedAt={profile?.createdAt || user?.createdAt}
                />
              </motion.div>
            ) : activeTab === 'packages' ? (
              <motion.div
                key="customer-packages-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="pt-2"
              >
                <PackagesPricingGrid isEmbedded={true} />
              </motion.div>
            ) : activeTab === 'trainers' ? (
              <motion.div
                key="customer-trainers-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="pt-2"
              >
                <TrainersSection isEmbedded={true} />
              </motion.div>
            ) : (
              <>
                {/* Quick Overview Grid: Digital Pass + Gym Occupancy */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              
              {/* 1. Digital Member Pass (بطاقة الوحش الرقمية المتجاوبة تماماً) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-amber-600/30 via-zinc-900 to-black border-2 border-amber-500/40 shadow-gold-glow flex flex-col justify-between overflow-hidden group w-full"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-black border border-amber-500/40 p-1 flex items-center justify-center">
                        <img src={wolfLogo} alt="Wolf" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-xs font-black tracking-wider text-amber-400">WOLVES PASS</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                      VIP MEMBER
                    </span>
                  </div>

                  <div className="space-y-1 mb-4">
                    <span className="text-[10px] sm:text-[11px] text-zinc-400">اسم الوحش:</span>
                    <h3 className="text-base sm:text-lg font-black text-white truncate">{profile?.name || user?.name}</h3>
                  </div>

                  {/* Member Code Barcode Simulator */}
                  <div className="bg-black/80 rounded-2xl p-3 sm:p-4 border border-amber-500/30 text-center space-y-2">
                    <span className="text-[10px] text-zinc-400 block">كود الوحش للدخول والاستقبال:</span>
                    {memberCode ? (
                      <>
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          <span className="text-lg sm:text-2xl font-mono font-black text-amber-400 tracking-wider sm:tracking-widest truncate">
                            {memberCode}
                          </span>
                          <button
                            onClick={handleCopyCode}
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-amber-400 hover:bg-zinc-700 transition-colors flex-shrink-0 cursor-pointer"
                            title="نسخ الكود"
                          >
                            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Barcode Lines Graphics - Flexible and Responsive */}
                        <div className="flex justify-center items-center gap-0.5 sm:gap-1 pt-1 opacity-75 overflow-hidden">
                          {[4, 2, 6, 3, 5, 2, 4, 6, 2, 5, 3, 4, 6, 2, 5, 4, 2, 6].map((h, i) => (
                            <div
                              key={i}
                              style={{ height: `${h * 3.5}px` }}
                              className={`w-0.5 sm:w-1 rounded-sm ${i % 2 === 0 ? 'bg-amber-400' : 'bg-zinc-600'}`}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-amber-300 font-bold text-xs sm:text-sm">
                          <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                          <span>في انتظار تخصيص كود الدخول</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-tight">
                          لم يُسجل كود دخول بعد • يرجى مراجعة موظف الاستقبال لتخصيص كود العضوية
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-500 border-t border-zinc-800/80">
                  <span>امسح الكود عند الريسبشن</span>
                  <span className="font-mono text-amber-400/80">Wolves Gym System</span>
                </div>
              </motion.div>

              {/* 2. Live Gym Occupancy Radar (رادار إشغال الجيم) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                className="wolf-glass rounded-3xl p-4 sm:p-6 border border-zinc-800 flex flex-col justify-between w-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                        <Activity className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white">نسبة إشغال الجيم الحالية</h3>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      مباشر
                    </span>
                  </div>

                  <div className="py-2 text-center">
                    <div className="relative inline-flex items-center justify-center my-1 sm:my-2">
                      {/* Circular Progress Indicator */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-zinc-800 flex items-center justify-center relative">
                        <div
                          className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"
                          style={{ animationDuration: '8s' }}
                        />
                        <div className="text-center">
                          <span className="text-xl sm:text-2xl font-mono font-black text-amber-400">
                            {occupancyData.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-1 sm:mt-2 space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {occupancyData.percentage < 40 && 'الجيم رايق وجاهز للتمرين 🔥'}
                        {occupancyData.percentage >= 40 && occupancyData.percentage < 75 && 'إشغال متوسط ومناسب للتمرين 💪'}
                        {occupancyData.percentage >= 75 && 'وقت ذروة (الجيم مليان طاقة) ⚡'}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-zinc-400 font-mono">
                        {occupancyData.currentOccupancy} وحش يتمرنون الآن من أصل {occupancyData.maxCapacity}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] sm:text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
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
              className="wolf-glass rounded-3xl p-4 sm:p-7 border border-amber-500/20 relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-black text-white">
                      مؤشرات اللياقة والقياسات البدنية
                    </h3>
                    <p className="text-[11px] sm:text-xs text-zinc-400">
                      بياناتك المسجلة لمتابعة تطور لياقتك وكتلتك العضلية
                    </p>
                  </div>
                </div>

                {bmi ? (
                  <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs text-zinc-400">مؤشر BMI:</span>
                    <span className="text-sm font-black font-mono text-amber-400">{bmi}</span>
                    <span className={`text-xs font-bold ${bmiStatus.color}`}>({bmiStatus.label})</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
                    <Info className="w-3.5 h-3.5" />
                    <span>يرجى تسجيل القياسات لحساب BMI</span>
                  </div>
                )}
              </div>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
                {/* Weight */}
                <div className="bg-zinc-900/80 rounded-2xl p-3 sm:p-4 border border-zinc-800/80 hover:border-amber-500/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400 text-xs mb-1.5 sm:mb-2">
                    <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                    <span className="text-[11px] sm:text-xs">الوزن الحالي</span>
                  </div>
                  {profile?.weight ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-white">
                        {profile.weight}
                      </span>
                      <span className="text-[10px] sm:text-xs text-zinc-500 font-bold">كجم</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 w-fit">
                      <span>--</span>
                      <span className="text-[10px] text-zinc-400">يرجى تسجيل القياسات</span>
                    </div>
                  )}
                </div>

                {/* Height */}
                <div className="bg-zinc-900/80 rounded-2xl p-3 sm:p-4 border border-zinc-800/80 hover:border-amber-500/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400 text-xs mb-1.5 sm:mb-2">
                    <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                    <span className="text-[11px] sm:text-xs">الطول</span>
                  </div>
                  {profile?.height ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-white">
                        {profile.height}
                      </span>
                      <span className="text-[10px] sm:text-xs text-zinc-500 font-bold">سم</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 w-fit">
                      <span>--</span>
                      <span className="text-[10px] text-zinc-400">يرجى تسجيل القياسات</span>
                    </div>
                  )}
                </div>

                {/* Muscle Percentage */}
                <div className="bg-zinc-900/80 rounded-2xl p-3 sm:p-4 border border-zinc-800/80 hover:border-amber-500/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400 text-xs mb-1.5 sm:mb-2">
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    <span className="text-[11px] sm:text-xs">نسبة العضلات</span>
                  </div>
                  {profile?.musclePercentage ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                        {profile.musclePercentage}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 w-fit">
                      <span>--</span>
                      <span className="text-[10px] text-zinc-400">يرجى تسجيل القياسات</span>
                    </div>
                  )}
                </div>

                {/* Fat Percentage */}
                <div className="bg-zinc-900/80 rounded-2xl p-3 sm:p-4 border border-zinc-800/80 hover:border-amber-500/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400 text-xs mb-1.5 sm:mb-2">
                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                    <span className="text-[11px] sm:text-xs">نسبة الدهون</span>
                  </div>
                  {profile?.fatPercentage ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-white">
                        {profile.fatPercentage}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 w-fit">
                      <span>--</span>
                      <span className="text-[10px] text-zinc-400">يرجى تسجيل القياسات</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Health Notes & Injuries alert */}
              {(profile?.injuries || profile?.chronicDiseases || profile?.notes) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 sm:p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <HeartPulse className="w-4 h-4" />
                    <span>الملف الصحي والرياضي المعتمد للكباتن:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs text-zinc-300">
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

      {/* User Profile Settings Modal */}
      <UserProfileSettingsModal
        isOpen={isProfileSettingsModalOpen}
        onClose={() => setIsProfileSettingsModalOpen(false)}
      />
    </div>
  );
};

export default CustomerDashboard;
