import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Key
} from 'lucide-react';
import wolfLogo from '../assets/logo.png';
import OccupancyCard from './OccupancyCard';
import CheckInForm from './CheckInForm';
import CheckOutForm from './CheckOutForm';
import RecentActivityFeed from './RecentActivityFeed';
import ChangePasswordModal from './auth/ChangePasswordModal';
import { STORAGE_KEYS } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

export const AttendanceDashboard = () => {
  const { 
    isAuthenticated, 
    user, 
    logout, 
    setActiveAuthView,
    isChangePasswordModalOpen,
    setIsChangePasswordModalOpen
  } = useAuth();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // View mode for Check-in / Check-out: 'split' or 'tabs'
  const [activeTab, setActiveTab] = useState('check-in'); // 'check-in' | 'check-out'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'tabs'

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
    <div dir="rtl" className="min-h-screen bg-black bg-wolf-mesh text-zinc-100 pb-20 font-cairo">
      {/* Sleek Navigation Bar with Golden "BE THE WOLF" Branding & Auth Actions */}
      <header className="sticky top-0 z-40 wolf-glass bg-zinc-950/90 border-b border-amber-500/20 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between gap-4">
          
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
              <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-black border border-amber-500/50 shadow-gold-glow overflow-hidden p-1">
                <img
                  src={wolfLogo}
                  alt="BE THE WOLF"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 m-0">
                BE THE WOLF
              </h1>
              <p className="text-xs text-zinc-400 font-semibold tracking-wide mt-0.5">
                لوحة إدارة الحضور واللوكرات وتتبع الإشغال اللحظي
              </p>
            </div>
          </div>

          {/* Right Controls: Live Clock & Account Action Button */}
          <div className="flex items-center gap-3">
            {/* Live Digital Clock */}
            <div className="hidden md:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300 shadow-inner">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-cairo font-bold">
                {currentTime.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-amber-400 font-black">
                {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Account Profile / Logout OR Login Trigger */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-1.5 pr-3 pl-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs font-mono">
                    {user?.name ? user.name.slice(0, 1).toUpperCase() : 'W'}
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold text-white block leading-none">
                      {user?.name || 'كابتن الجيم'}
                    </span>
                    <span className="text-[10px] text-amber-400/90 font-mono">عضوية نشطة</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-xl transition-colors"
                  title="تغيير كلمة المرور"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-xl transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveAuthView('login')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-gold-glow transition-all hover:scale-105 active:scale-95"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">تسجيل الدخول / الحساب</span>
                <span className="sm:hidden">دخول</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Metric Quick Stats Bar: 3 Clean Useful Cards */}
        <section aria-label="إحصائيات الوحوش في الجيم" className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="wolf-glass rounded-3xl p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center gap-4 group">
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400">
                الوحوش في الجيم الآن
              </div>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {currentOccupancy} <span className="text-xs font-normal text-amber-400 font-cairo">وحش</span>
              </div>
            </div>
          </div>

          <div className="wolf-glass rounded-3xl p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center gap-4 group">
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-yellow-500/30 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)] group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400">
                إجمالي حركات دخول اليوم
              </div>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {totalCheckInsToday} <span className="text-xs font-normal text-yellow-400 font-cairo">تمرينة</span>
              </div>
            </div>
          </div>

          <div className="wolf-glass rounded-3xl p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center gap-4 group">
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-amber-600/30 text-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.2)] group-hover:scale-110 transition-transform">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400">
                اللوكرات المشغولة حالياً
              </div>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {occupiedLockerCount} <span className="text-xs font-normal text-amber-400 font-cairo">لوكر نشط</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section Title & View Switcher */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            <h2 className="text-lg font-black text-white tracking-tight">
              منطقة الاستقبال والتحكم في الحضور
            </h2>
          </div>

          {/* Toggle between Side-by-Side and Tabbed on desktop */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'split'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-gold-glow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              عرض متجاور
            </button>
            <button
              onClick={() => setViewMode('tabs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'tabs'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-gold-glow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              عرض تبويبات
            </button>
          </div>
        </div>

        {/* Primary Operations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Live Occupancy Radial Widget (Hero Card, 5 columns) */}
          <div className="lg:col-span-5 w-full">
            <OccupancyCard
              refreshTrigger={refreshTrigger}
              onOccupancyUpdated={(count) => setCurrentOccupancy(count)}
            />
          </div>

          {/* Right Column: Check-In & Check-Out Forms (7 columns) */}
          <div className="lg:col-span-7 w-full space-y-6">
            {viewMode === 'tabs' ? (
              <div className="space-y-4">
                {/* Tab switch pills */}
                <div className="flex rounded-2xl bg-zinc-950 p-1.5 border border-zinc-800">
                  <button
                    onClick={() => setActiveTab('check-in')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'check-in'
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-gold-glow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>تسجيل دخول واستلام لوكر</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('check-out')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'check-out'
                        ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black shadow-gold-glow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>تسجيل خروج وتسليم لوكر</span>
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'check-in' ? (
                    <motion.div
                      key="check-in-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CheckInForm onCheckInSuccess={handleCheckInSuccess} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="check-out-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CheckOutForm
                        onCheckOutSuccess={handleCheckOutSuccess}
                        recentActiveMembers={activeMembers}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Side-by-Side (Split) View */
              <div className="space-y-6">
                <CheckInForm onCheckInSuccess={handleCheckInSuccess} />
                <div id="checkout-panel">
                  <CheckOutForm
                    onCheckOutSuccess={handleCheckOutSuccess}
                    recentActiveMembers={activeMembers}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Attendance Stream Log */}
        <section aria-label="سجل حركات الحضور اللحظي">
          <RecentActivityFeed
            activities={activities}
            onClearActivities={handleClearActivities}
            onSelectMember={handleSelectMemberForCheckout}
          />
        </section>
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default AttendanceDashboard;
