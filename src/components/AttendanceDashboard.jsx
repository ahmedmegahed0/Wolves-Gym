import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  Flame, 
  KeyRound, 
  Users, 
  Clock, 
  Activity, 
  Columns, 
  Maximize2,
  User,
  LogOut,
  Key,
  Menu,
  X,
  Crown,
  Sparkles,
  LogIn,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  Plus
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
import PackagesDashboard from './packages/PackagesDashboard';
import CreateSubscriptionModal from './subscriptions/CreateSubscriptionModal';
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

  // Navigation main module tab: 'cards' | 'attendance' | 'lockers' | 'customers'
  // Default is 'cards' as requested (الاولى من فوق خالص للكاردز)
  const [mainTab, setMainTab] = useState(() => {
    if (isTrainer) return 'customers';
    if (isGator) return 'attendance';
    if (initialSection) return initialSection;
    if (location.pathname === '/customers') return 'customers';
    if (location.pathname.includes('/lockers')) return 'lockers';
    if (location.pathname.includes('/packages')) return 'packages';
    if (location.pathname.includes('/attendance')) return 'attendance';
    return 'cards';
  });

  // Collapsible sidebar state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('gym_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gym_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const [pendingCount, setPendingCount] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // New Subscription Modal States
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionModalCustomer, setSubscriptionModalCustomer] = useState(null);
  const [subscriptionModalPackage, setSubscriptionModalPackage] = useState(null);

  const handleOpenNewSubscription = (customer = null, pkg = null) => {
    setSubscriptionModalCustomer(customer);
    setSubscriptionModalPackage(pkg);
    setIsSubscriptionModalOpen(true);
  };

  // Sync with route changes
  useEffect(() => {
    if (initialSection) {
      setMainTab(initialSection);
    }
  }, [initialSection]);

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
    setMainTab('attendance');
    setActiveTab('check-out');
    setTimeout(() => {
      const checkoutEl = document.getElementById('checkout-panel');
      if (checkoutEl) {
        checkoutEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Stats calculation
  const totalCheckInsToday = activities.filter((a) => a.type === 'check-in').length;
  const occupiedLockerCount = activeMembers.filter((m) => m.lockerId).length;

  // Streamlined Sidebar Navigation Items (Reduced wording & Clean Aesthetics)
  const navItems = [
    {
      id: 'cards',
      label: 'نظرة عامة',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'attendance',
      label: 'تسجيل الحضور',
      icon: Flame,
      badge: currentOccupancy > 0 ? `${currentOccupancy}` : null,
      badgeColor: 'bg-amber-400 text-black',
    },
    {
      id: 'lockers',
      label: 'إدارة اللوكرات',
      icon: KeyRound,
      badge: null,
    },
    {
      id: 'packages',
      label: 'باقات واشتراكات',
      icon: Crown,
      badge: null,
    },
    {
      id: 'customers',
      label: 'إدارة الوحوش',
      icon: Users,
      badge: pendingCount > 0 ? `${pendingCount}` : null,
      badgeColor: 'bg-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse',
    },
  ];

  const activeNavItem = navItems.find((item) => item.id === mainTab) || navItems[0];

  return (
    <div dir="rtl" className="min-h-screen bg-black bg-wolf-mesh text-zinc-100 font-cairo flex relative overflow-x-hidden">
      
      {/* ============================================================== */}
      {/* 1. RIGHT SIDEBAR (الشريط الجانبي الأيمن الفاخر - Desktop)       */}
      {/* ============================================================== */}
      <aside 
        className={`hidden md:flex fixed inset-y-0 right-0 z-40 bg-[#09090c]/95 border-l border-amber-500/20 backdrop-blur-2xl flex-col justify-between p-3.5 shadow-[0_0_40px_rgba(0,0,0,0.85)] transition-all duration-300 ease-in-out select-none ${
          isCollapsed ? 'w-20' : 'w-64 lg:w-72'
        }`}
      >
        {/* Subtle Ambient Gold Gradient in Sidebar */}
        <div className="absolute top-0 right-0 left-0 h-40 bg-gradient-to-b from-amber-500/10 via-amber-500/0 to-transparent pointer-events-none" />

        {/* Floating Collapse / Expand Edge Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="absolute -left-3.5 top-7 z-50 w-7 h-7 rounded-full bg-[#121216] border border-amber-500/50 text-amber-400 hover:bg-amber-500 hover:text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 group"
          title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> : <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
        </button>

        <div className="relative z-10">
          {/* Brand Header */}
          <div className={`flex items-center gap-3 px-1 py-2 mb-5 border-b border-amber-500/15 transition-all ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}>
            <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="relative group flex-shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
                <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-b from-zinc-900 to-black border border-amber-500/50 shadow-gold-glow overflow-hidden p-1.5">
                  <img
                    src={wolfLogo}
                    alt="BE THE WOLF"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  />
                </div>
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-sm font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 truncate">
                    BE THE WOLF
                  </h1>
                  <p className="text-[10px] text-zinc-400 font-semibold truncate font-mono">
                    GYM RECEPTION
                  </p>
                </div>
              )}
            </div>

            {/* Quick Header Toggle Button when Expanded */}
            {!isCollapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-amber-400 hover:bg-zinc-900/80 border border-transparent hover:border-zinc-800 transition-colors"
                title="طي القائمة"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Items List */}
          <nav className="space-y-1.5" aria-label="أقسام النظام الرئيسية">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = mainTab === item.id;
              return (
                <div key={item.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => setMainTab(item.id)}
                    className={`w-full text-right rounded-2xl flex items-center transition-all duration-200 relative overflow-hidden ${
                      isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'
                    } ${
                      isActive
                        ? 'bg-gradient-to-l from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)] font-black'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/70 border border-transparent hover:border-zinc-800/80 font-bold'
                    }`}
                  >
                    {/* Active Golden Neon Indicator Bar */}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-l-full bg-gradient-to-b from-amber-400 to-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                    )}

                    <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
                      <div className={`p-2 rounded-xl transition-all duration-200 flex-shrink-0 ${
                        isActive
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105'
                          : 'bg-zinc-900/90 text-zinc-400 border border-zinc-800/80 group-hover:text-amber-400 group-hover:border-amber-500/30 group-hover:bg-zinc-800'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {!isCollapsed && (
                        <span className={`text-xs truncate ${isActive ? 'text-amber-300 font-black' : 'text-zinc-300 font-bold'}`}>
                          {item.label}
                        </span>
                      )}
                    </div>

                    {/* Badge when expanded */}
                    {!isCollapsed && item.badge && (
                      <span className={`text-[10px] font-mono font-black min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isActive
                          ? 'bg-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                          : (item.badgeColor || 'bg-amber-500/20 text-amber-400 border border-amber-500/30')
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Badge pulse dot when collapsed */}
                    {isCollapsed && item.badge && (
                      <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-pulse" />
                    )}
                  </button>

                  {/* Floating Luxury Tooltip in Collapsed Mode */}
                  {isCollapsed && (
                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-zinc-950/95 border border-amber-500/40 text-amber-300 text-xs font-bold whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-mono">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        <div className={`relative z-10 pt-3 border-t border-amber-500/15 ${isCollapsed ? 'flex flex-col items-center gap-2' : 'space-y-2'}`}>
          {isAuthenticated ? (
            isCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(true)}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-900 to-black text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs font-mono hover:scale-105 transition-transform shadow-sm"
                    title={user?.name || 'الملف الرياضي'}
                  >
                    {user?.name ? user.name.slice(0, 1).toUpperCase() : 'W'}
                  </button>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black" />

                  {/* Tooltip */}
                  <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-zinc-950/95 border border-amber-500/40 text-amber-300 text-xs font-bold whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                    {user?.name || roleMeta.label}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-gradient-to-r from-zinc-950/90 to-zinc-900/80 border border-amber-500/20 rounded-2xl p-2.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-2.5 min-w-0 text-right group flex-1"
                  title="عرض الملف الرياضي"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs font-mono group-hover:scale-105 transition-transform">
                      {user?.name ? user.name.slice(0, 1).toUpperCase() : 'W'}
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black" />
                  </div>
                  <div className="min-w-0 truncate">
                    <span className="text-xs font-bold text-white block truncate group-hover:text-amber-400 transition-colors">
                      {user?.name || roleMeta.label}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 block truncate font-semibold">
                      {roleMeta.badge}
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="تغيير كلمة المرور"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={() => setActiveAuthView('login')}
              className={`w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow flex items-center justify-center gap-2 ${
                isCollapsed ? 'px-0' : ''
              }`}
              title="تسجيل الدخول"
            >
              <LogIn className="w-4 h-4" />
              {!isCollapsed && <span>تسجيل الدخول</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE DRAWER SIDEBAR                                       */}
      {/* ============================================================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-[#0d0d10] border-l border-amber-500/20 p-4 flex flex-col justify-between md:hidden shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <img src={wolfLogo} alt="BE THE WOLF" className="w-8 h-8 object-contain" />
                    <span className="text-sm font-black text-amber-400">BE THE WOLF</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = mainTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setMainTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-right p-3 rounded-2xl flex items-center justify-between transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900 font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-current">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {isAuthenticated && (
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">{user?.name}</span>
                  <button
                    type="button"
                    onClick={logout}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 3. MAIN CONTENT CONTAINER (مساحة المحتوى الرئيسية)             */}
      {/* ============================================================== */}
      <div 
        className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'mr-0 md:mr-20' : 'mr-0 md:mr-64 lg:mr-72'
        }`}
      >
        {/* Top Header Bar: Clean Breadcrumb + Clock */}
        <header className="sticky top-0 z-30 wolf-glass bg-zinc-950/90 border-b border-amber-500/20 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            
            {/* Right: Hamburger on mobile + Sidebar toggle shortcut + Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl bg-zinc-900 text-amber-400 border border-amber-500/30 hover:bg-zinc-800 transition-colors"
                title="القائمة الجانبية"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden md:flex p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 border border-zinc-800 transition-colors"
                title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
              >
                {isCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-bold hidden sm:inline">لوحة التحكم</span>
                <span className="text-zinc-600 hidden sm:inline">/</span>
                <span className="text-xs sm:text-sm font-black text-amber-400 flex items-center gap-1.5">
                  {activeNavItem?.icon && <activeNavItem.icon className="w-4 h-4 text-amber-400" />}
                  {activeNavItem?.label}
                </span>
              </div>
            </div>

            {/* Left: Quick New Subscription Button + Live Clock */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenNewSubscription()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black text-xs font-black shadow-gold-glow hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="تسجيل اشتراك جديد بالصالة"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">تسجيل اشتراك جديد</span>
                <span className="sm:hidden">اشتراك جديد</span>
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-cairo font-bold hidden sm:inline">
                  {currentTime.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="text-zinc-600 hidden sm:inline">|</span>
                <span className="text-amber-400 font-black">
                  {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* ======================================================== */}
            {/* VIEW 1: CARDS & OVERVIEW (كروت النظرة العامة - الأولى)    */}
            {/* ======================================================== */}
            {mainTab === 'cards' && (
              <motion.div
                key="cards-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* 4 Metric Quick Stat Cards */}
                <section aria-label="كروت الإحصائيات العامة" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                  {/* Card 1 */}
                  <div className="wolf-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-amber-500/25 hover:border-amber-500/50 transition-all flex items-center gap-3 sm:gap-4 group">
                    <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform flex-shrink-0">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] sm:text-xs font-bold text-zinc-400 truncate">في الجيم الآن</div>
                      <div className="text-xl sm:text-3xl font-black text-white font-mono">{currentOccupancy}</div>
                      <div className="text-[10px] text-amber-400 font-bold truncate">وحش بالتمرين</div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="wolf-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-yellow-500/25 hover:border-yellow-500/50 transition-all flex items-center gap-3 sm:gap-4 group">
                    <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-900 border border-yellow-500/30 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)] group-hover:scale-110 transition-transform flex-shrink-0">
                      <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] sm:text-xs font-bold text-zinc-400 truncate">دخول اليوم</div>
                      <div className="text-xl sm:text-3xl font-black text-white font-mono">{totalCheckInsToday}</div>
                      <div className="text-[10px] text-yellow-400 font-bold truncate">جلسة تمرين</div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="wolf-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-amber-500/25 hover:border-amber-500/50 transition-all flex items-center gap-3 sm:gap-4 group">
                    <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-900 border border-amber-600/30 text-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.2)] group-hover:scale-110 transition-transform flex-shrink-0">
                      <KeyRound className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] sm:text-xs font-bold text-zinc-400 truncate">لوكرات مشغولة</div>
                      <div className="text-xl sm:text-3xl font-black text-white font-mono">{occupiedLockerCount}</div>
                      <div className="text-[10px] text-amber-400 font-bold truncate">دولاب مسلم للأعضاء</div>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="wolf-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-500/25 hover:border-emerald-500/50 transition-all flex items-center gap-3 sm:gap-4 group">
                    <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-900 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] sm:text-xs font-bold text-zinc-400 truncate">الاشتراكات المعلقة</div>
                      <div className="text-xl sm:text-3xl font-black text-emerald-400 font-mono">{pendingCount}</div>
                      <div className="text-[10px] text-emerald-400 font-bold truncate">في انتظار التفعيل</div>
                    </div>
                  </div>
                </section>

                {/* Main Cards Row: Live Occupancy Radial + Quick Reception Action Card */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Occupancy Radial Gauge Widget */}
                  <div className="lg:col-span-5 w-full flex flex-col">
                    <OccupancyCard
                      refreshTrigger={refreshTrigger}
                      onOccupancyUpdated={(count) => setCurrentOccupancy(count)}
                    />
                  </div>

                  {/* Reception Quick Launch Banner Card */}
                  <div className="lg:col-span-7 w-full flex flex-col justify-between p-6 sm:p-8 rounded-3xl wolf-glass border border-amber-500/25 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700" />
                    <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>منظومة استقبال الوحوش الذكية</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                        أهلاً بك في وردية الاستقبال واللوكرات 🐺
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
                        يمكنك تسجيل دخول الوحوش وتسليم دواليب التمرين بنقرة واحدة، أو التوجه مباشرة لشاشات التحكم من الشريط الجانبي.
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setMainTab('attendance')}
                        className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs sm:text-sm font-black shadow-gold-glow flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                      >
                        <Zap className="w-4 h-4 fill-black" />
                        <span>تسجيل دخول واستلام لوكر</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMainTab('lockers')}
                        className="py-3.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>عرض خريطة اللوكرات</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-Time Live Attendance Stream Activity Feed */}
                <section aria-label="سجل حركات الحضور">
                  <RecentActivityFeed
                    activities={activities}
                    onClearActivities={handleClearActivities}
                    onSelectMember={handleSelectMemberForCheckout}
                  />
                </section>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: ATTENDANCE (تسجيل الحضور والانصراف - الثانية)       */}
            {/* ======================================================== */}
            {mainTab === 'attendance' && (
              <motion.div
                key="attendance-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Metric Quick Stats Bar */}
                <section aria-label="إحصائيات الجيم" className="grid grid-cols-3 gap-2 sm:gap-5">
                  <div className="wolf-glass rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-amber-500/20 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-right">
                    <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <Users className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] sm:text-xs font-bold text-zinc-400 hidden sm:block">في الجيم الآن</div>
                      <div className="text-lg sm:text-2xl font-black text-white font-mono">{currentOccupancy}</div>
                      <div className="text-[9px] sm:text-xs text-amber-400 font-cairo sm:hidden">في الجيم</div>
                    </div>
                  </div>

                  <div className="wolf-glass rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-amber-500/20 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-right">
                    <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-900 border border-yellow-500/30 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                      <Activity className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] sm:text-xs font-bold text-zinc-400 hidden sm:block">دخول اليوم</div>
                      <div className="text-lg sm:text-2xl font-black text-white font-mono">{totalCheckInsToday}</div>
                      <div className="text-[9px] sm:text-xs text-yellow-400 font-cairo sm:hidden">تمرينة</div>
                    </div>
                  </div>

                  <div className="wolf-glass rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-amber-500/20 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-right">
                    <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-900 border border-amber-600/30 text-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.2)]">
                      <KeyRound className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] sm:text-xs font-bold text-zinc-400 hidden sm:block">لوكرات مشغولة</div>
                      <div className="text-lg sm:text-2xl font-black text-white font-mono">{occupiedLockerCount}</div>
                      <div className="text-[9px] sm:text-xs text-amber-400 font-cairo sm:hidden">لوكر</div>
                    </div>
                  </div>
                </section>

                {/* Section Title & View Switcher */}
                <div className="flex items-center justify-between pb-1 sm:pb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400/20" />
                    <h2 className="text-sm sm:text-lg font-black text-white tracking-tight">
                      تسجيل الحضور والانصراف وتسليم اللوكرات
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

                {/* Forms Section */}
                <div className="space-y-4">
                  {/* Mobile Tab Switch */}
                  <div className="md:hidden space-y-3">
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

                  {/* Desktop: viewMode */}
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        <CheckInForm onCheckInSuccess={handleCheckInSuccess} />
                        <div id="checkout-panel">
                          <CheckOutForm onCheckOutSuccess={handleCheckOutSuccess} recentActiveMembers={activeMembers} />
                        </div>
                      </div>
                    )}
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

            {/* ======================================================== */}
            {/* VIEW 3: LOCKERS MANAGEMENT (إدارة اللوكرات)               */}
            {/* ======================================================== */}
            {mainTab === 'lockers' && (
              <motion.div
                key="lockers-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <LockersDashboard isEmbedded={true} />
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* VIEW 4: PACKAGES & PLANS (باقات واشتراكات كتيبة الذئاب)    */}
            {/* ======================================================== */}
            {mainTab === 'packages' && (
              <motion.div
                key="packages-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <PackagesDashboard
                  isEmbedded={true}
                  onOpenNewSubscription={handleOpenNewSubscription}
                />
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* VIEW 5: CUSTOMERS / MONSTERS (إدارة الوحوش)               */}
            {/* ======================================================== */}
            {mainTab === 'customers' && (
              <motion.div
                key="customers-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <CustomersList
                  onOpenNewSubscription={handleOpenNewSubscription}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

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

      {/* New Member Subscription Modal for Reception & Admin */}
      <CreateSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          setSubscriptionModalCustomer(null);
          setSubscriptionModalPackage(null);
        }}
        preselectedCustomer={subscriptionModalCustomer}
        preselectedPackage={subscriptionModalPackage}
        onSuccess={() => {
          setRefreshTrigger((p) => p + 1);
        }}
      />
    </div>
  );
};

export default AttendanceDashboard;
