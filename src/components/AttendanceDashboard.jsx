import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Flame, 
  Clock, 
  Activity, 
  Users, 
  KeyRound, 
  Columns, 
  Maximize2,
  User,
  LogOut,
  Key,
  Menu,
  X,
  Crown
} from 'lucide-react';
import wolfLogo from '../assets/logo.png';
import OccupancyCard from './OccupancyCard';
import CheckInForm from './CheckInForm';
import CheckOutForm from './CheckOutForm';
import RecentActivityFeed from './RecentActivityFeed';
import ChangePasswordModal from './auth/ChangePasswordModal';
import CustomersList from './customers/CustomersList';
import CustomerProfileCard from './customers/CustomerProfileCard';
import CustomerDashboard from './customers/CustomerDashboard';
import LockersDashboard from './lockers/LockersDashboard';
import { STORAGE_KEYS, customerService, getRoleMeta } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

export const AttendanceDashboard = ({ initialSection }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { 
    isAuthenticated, 
    user, 
    logout, 
    setActiveAuthView,
    isChangePasswordModalOpen,
    setIsChangePasswordModalOpen
  } = useAuth();

  const roleMeta = getRoleMeta(user?.role);
  const isCustomer = roleMeta.role === 'Customer';
  const isTrainer = roleMeta.role === 'Trainer';
  const isGator = roleMeta.role === 'Gator';
  const isReception = roleMeta.role === 'Reception';
  const isManager = roleMeta.role === 'Manager';
  const isSuperAdmin = roleMeta.role === 'SuperAdmin';

  // Navigation main module tab: 'attendance' vs 'lockers' vs 'customers'
  const [mainTab, setMainTab] = useState(() => {
    if (isTrainer) return 'customers';
    if (isGator) return 'attendance';
    if (initialSection) return initialSection;
    if (location.pathname === '/customers') return 'customers';
    if (location.pathname.includes('/lockers')) return 'lockers';
    return 'attendance';
  });

  const [pendingCount, setPendingCount] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Sync with route changes & enforce strict role-based dashboard segregation
  useEffect(() => {
    if (isTrainer || isManager || isSuperAdmin) {
      navigate('/dashboard/under-construction', { replace: true });
      return;
    }
    if (initialSection) {
      setMainTab(initialSection);
    }
  }, [initialSection, isTrainer, isManager, isSuperAdmin, navigate]);

  // Periodic check for pending subscription requests
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await customerService.getCustomers({ approvalStatus: 0, pageSize: 1 });
        setPendingCount(res.totalCount || 0);
      } catch (e) {
        console.warn('Pending badge fetch error:', e);
      }
    };
    fetchPending();
    const timer = setInterval(fetchPending, 30000);
    return () => clearInterval(timer);
  }, []);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // On mobile, always use 'tabs' view mode
  const [activeTab, setActiveTab] = useState('check-in');
  const [viewMode, setViewMode] = useState('split');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Activity stream
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track active members inside currently
  const [activeMembers, setActiveMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('gym_active_members');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save activities to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(activities.slice(0, 50)));
      localStorage.setItem('gym_active_members', JSON.stringify(activeMembers));
    } catch (e) {
      console.error('Failed to sync storage:', e);
    }
  }, [activities, activeMembers]);

  // Handler for successful Check-In
  const handleCheckInSuccess = (eventData) => {
    const newActivity = {
      id: Date.now() + Math.random().toString(36).substring(2, 6),
      code: eventData.code,
      lockerId: eventData.lockerId,
      timestamp: eventData.timestamp,
      type: 'check-in',
    };
    setActivities((prev) => [newActivity, ...prev]);

    setActiveMembers((prev) => {
      const filtered = prev.filter((m) => m.code !== eventData.code);
      return [{ code: eventData.code, lockerId: eventData.lockerId, checkInTime: eventData.timestamp }, ...filtered];
    });

    setRefreshTrigger((prev) => prev + 1);
  };

  // Handler for successful Check-Out
  const handleCheckOutSuccess = (eventData) => {
    const newActivity = {
      id: Date.now() + Math.random().toString(36).substring(2, 6),
      code: eventData.code,
      timestamp: eventData.timestamp,
      type: 'check-out',
    };
    setActivities((prev) => [newActivity, ...prev]);

    setActiveMembers((prev) => prev.filter((m) => m.code !== eventData.code));

    setRefreshTrigger((prev) => prev + 1);
  };

  const handleClearActivities = () => {
    setActivities([]);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOG);
  };

  const handleSelectMemberForCheckout = (memberCode) => {
    setActiveTab('check-out');
    const checkoutEl = document.getElementById('checkout-panel');
    if (checkoutEl) {
      checkoutEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Stats calculation
  const totalCheckInsToday = activities.filter((a) => a.type === 'check-in').length;
  const occupiedLockerCount = activeMembers.filter((m) => m.lockerId).length;

  return (
    <div dir="rtl" className="min-h-screen bg-black bg-wolf-mesh text-zinc-100 pb-8 sm:pb-20 font-cairo">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 wolf-glass bg-zinc-950/90 border-b border-amber-500/20 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <div className="relative group flex-shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl sm:rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-black border border-amber-500/50 shadow-gold-glow overflow-hidden p-1">
                <img
                  src={wolfLogo}
                  alt="BE THE WOLF"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                />
              </div>
            </div>

            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 m-0 truncate">
                BE THE WOLF
              </h1>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-semibold tracking-wide mt-0.5 hidden sm:block">
                {isTrainer
                  ? 'منظومة كابتن التدريب ومتابعة الوحوش'
                  : isGator
                  ? 'بوابة أمن الدخول ومراقبة الإشغال المباشر'
                  : isReception
                  ? 'لوحة إدارة الاستقبال واللوكرات'
                  : 'لوحة القيادة والتحكم الإداري'}
              </p>
            </div>
          </div>

          {/* Center Navigation Modules Switcher - Role-Aware */}
          {isTrainer ? (
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl bg-zinc-900/90 border border-sky-500/30 text-sky-400 font-bold text-xs shadow-sm">
              <Users className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">لوحة الكابتن: إدارة الوحوش والقياسات البدنية</span>
              <span className="sm:hidden">إدارة الوحوش</span>
              {pendingCount > 0 && (
                <span className="bg-amber-400 text-black text-[10px] font-mono px-2 py-0.5 rounded-full font-black animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                  {pendingCount} طلب معلق
                </span>
              )}
            </div>
          ) : isGator ? (
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl bg-zinc-900/90 border border-orange-500/30 text-orange-400 font-bold text-xs shadow-sm">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">بوابة الجيم: الحضور والإشغال المباشر</span>
              <span className="sm:hidden">بوابة الدخول</span>
            </div>
          ) : (
            <nav aria-label="أقسام النظام" className="flex items-center gap-1 sm:gap-1.5 p-1 bg-black/60 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setMainTab('attendance')}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1.5 ${
                  mainTab === 'attendance'
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-gold-glow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الحضور والإشغال</span>
                <span className="sm:hidden">الإشغال</span>
              </button>

              <button
                type="button"
                onClick={() => setMainTab('lockers')}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1.5 ${
                  mainTab === 'lockers'
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-gold-glow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">إدارة اللوكرات</span>
                <span className="sm:hidden">اللوكرات</span>
              </button>

              <button
                type="button"
                onClick={() => setMainTab('customers')}
                className={`relative px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1.5 ${
                  mainTab === 'customers'
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-gold-glow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">إدارة الوحوش والاشتراكات</span>
                <span className="sm:hidden">المشتركين</span>
                {pendingCount > 0 && (
                  <span className="bg-amber-400 text-black text-[9px] font-mono px-1.5 py-0.2 rounded-full font-black animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                    {pendingCount}
                  </span>
                )}
              </button>
            </nav>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Digital Clock - hidden on small mobile */}
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-cairo font-bold">
                {currentTime.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-amber-400 font-black">
                {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Compact time on tablet */}
            <div className="hidden sm:flex lg:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-amber-400 font-bold">
              <Clock className="w-3.5 h-3.5" />
              {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Account Profile / Logout */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1 sm:gap-2 bg-zinc-900/90 border border-amber-500/30 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 sm:pr-3 sm:pl-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 group text-right"
                  title="عرض الملف الرياضي والصحي للعضو"
                >
                  <div className="w-7 h-7 rounded-lg sm:rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs font-mono group-hover:scale-105 transition-transform">
                    {user?.name ? user.name.slice(0, 1).toUpperCase() : 'W'}
                  </div>
                  <div className="text-right hidden md:block">
                    <span className="text-xs font-bold text-white block leading-none group-hover:text-amber-400 transition-colors">
                      {user?.name || roleMeta.label}
                    </span>
                    <span className={`text-[10px] font-mono flex items-center gap-1 ${roleMeta.textColor}`}>
                      {roleMeta.badge}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors hidden sm:flex"
                  title="تغيير كلمة المرور"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveAuthView('login')}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-gold-glow transition-all hover:scale-105 active:scale-95"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">تسجيل الدخول</span>
                <span className="sm:hidden">دخول</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 space-y-4 sm:space-y-8">
        <AnimatePresence mode="wait">
          {mainTab === 'customers' ? (
            <motion.div
              key="customers-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <CustomersList />
            </motion.div>
          ) : mainTab === 'lockers' ? (
            <motion.div
              key="lockers-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <LockersDashboard isEmbedded={true} />
            </motion.div>
          ) : (
            <motion.div
              key="attendance-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 sm:space-y-8"
            >
              {/* Metric Quick Stats Bar */}
              <section aria-label="إحصائيات الجيم" className="grid grid-cols-3 gap-2 sm:gap-5">
                {/* Stat 1 */}
                <div className="wolf-glass rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 group text-center sm:text-right">
                  <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs font-bold text-zinc-400 hidden sm:block">
                      في الجيم الآن
                    </div>
                    <div className="text-lg sm:text-2xl font-black text-white font-mono">
                      {currentOccupancy}
                    </div>
                    <div className="text-[9px] sm:text-xs text-amber-400 font-cairo sm:hidden">في الجيم</div>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="wolf-glass rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 group text-center sm:text-right">
                  <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-900 border border-yellow-500/30 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)] group-hover:scale-110 transition-transform">
                    <Activity className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs font-bold text-zinc-400 hidden sm:block">
                      دخول اليوم
                    </div>
                    <div className="text-lg sm:text-2xl font-black text-white font-mono">
                      {totalCheckInsToday}
                    </div>
                    <div className="text-[9px] sm:text-xs text-yellow-400 font-cairo sm:hidden">تمرينة</div>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="wolf-glass rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 group text-center sm:text-right">
                  <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-900 border border-amber-600/30 text-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.2)] group-hover:scale-110 transition-transform">
                    <KeyRound className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs font-bold text-zinc-400 hidden sm:block">
                      لوكرات مشغولة
                    </div>
                    <div className="text-lg sm:text-2xl font-black text-white font-mono">
                      {occupiedLockerCount}
                    </div>
                    <div className="text-[9px] sm:text-xs text-amber-400 font-cairo sm:hidden">لوكر</div>
                  </div>
                </div>
              </section>

              {/* Section Title & View Switcher */}
              <div className="flex items-center justify-between pb-1 sm:pb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400/20" />
                  <h2 className="text-sm sm:text-lg font-black text-white tracking-tight">
                    {isGator ? 'بوابة الدخول ومراقبة الإشغال المباشر' : 'الاستقبال والتحكم وتسليم اللوكرات'}
                  </h2>
                </div>

                {/* Toggle between Side-by-Side and Tabbed on desktop */}
                <div className="hidden md:flex items-center gap-1 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      viewMode === 'split'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-gold-glow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    متجاور
                  </button>
                  <button
                    onClick={() => setViewMode('tabs')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      viewMode === 'tabs'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-gold-glow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    تبويبات
                  </button>
                </div>
              </div>

              {/* Primary Operations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
                {/* Left Column: Live Occupancy Radial Widget */}
                <div className="lg:col-span-5 w-full">
                  <OccupancyCard
                    refreshTrigger={refreshTrigger}
                    onOccupancyUpdated={(count) => setCurrentOccupancy(count)}
                  />
                </div>

                {/* Right Column: Check-In & Check-Out Forms */}
                <div className="lg:col-span-7 w-full space-y-4 sm:space-y-6">
                  {/* Mobile: always tabs. Desktop: respect viewMode */}
                  <div className="md:hidden space-y-3">
                    {/* Mobile Tab Switch */}
                    <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
                      <button
                        onClick={() => setActiveTab('check-in')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          activeTab === 'check-in'
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        تسجيل دخول
                      </button>
                      <button
                        onClick={() => setActiveTab('check-out')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          activeTab === 'check-out'
                            ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-gold-glow'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        تسجيل خروج
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {activeTab === 'check-in' ? (
                        <motion.div key="m-checkin" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}>
                          <CheckInForm onCheckInSuccess={handleCheckInSuccess} />
                        </motion.div>
                      ) : (
                        <motion.div key="m-checkout" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                          <CheckOutForm onCheckOutSuccess={handleCheckOutSuccess} recentActiveMembers={activeMembers} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Desktop: viewMode-based */}
                  <div className="hidden md:block">
                    {viewMode === 'tabs' ? (
                      <div className="space-y-4">
                        <div className="flex rounded-2xl bg-zinc-950 p-1.5 border border-zinc-800">
                          <button
                            onClick={() => setActiveTab('check-in')}
                            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                              activeTab === 'check-in'
                                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-gold-glow'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            تسجيل دخول واستلام لوكر
                          </button>
                          <button
                            onClick={() => setActiveTab('check-out')}
                            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                              activeTab === 'check-out'
                                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black shadow-gold-glow'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            تسجيل خروج وتسليم لوكر
                          </button>
                        </div>

                        <AnimatePresence mode="wait">
                          {activeTab === 'check-in' ? (
                            <motion.div key="check-in-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                              <CheckInForm onCheckInSuccess={handleCheckInSuccess} />
                            </motion.div>
                          ) : (
                            <motion.div key="check-out-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                              <CheckOutForm onCheckOutSuccess={handleCheckOutSuccess} recentActiveMembers={activeMembers} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <CheckInForm onCheckInSuccess={handleCheckInSuccess} />
                        <div id="checkout-panel">
                          <CheckOutForm onCheckOutSuccess={handleCheckOutSuccess} recentActiveMembers={activeMembers} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Real-Time Attendance Stream Log */}
              <section aria-label="سجل حركات الحضور">
                <RecentActivityFeed
                  activities={activities}
                  onClearActivities={handleClearActivities}
                  onSelectMember={handleSelectMemberForCheckout}
                />
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Customer Fitness Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-cairo">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              className="max-w-lg w-full relative"
            >
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 left-4 z-20 p-2 rounded-xl bg-black/80 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
              <CustomerProfileCard onRefresh={() => setRefreshTrigger((p) => p + 1)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default AttendanceDashboard;
