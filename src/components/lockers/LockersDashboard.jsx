import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  KeyRound, 
  Plus, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  Wrench, 
  Lock, 
  Unlock, 
  Filter, 
  Layers, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Flame,
  Users,
  Clock,
  LogOut,
  Key,
  User,
  ArrowRight,
  Home
} from 'lucide-react';
import wolfLogo from '../../assets/logo.png';
import LockerCard from './LockerCard';
import AddLockerModal from './AddLockerModal';
import EditLockerModal from './EditLockerModal';
import { lockerService, getRoleMeta } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import UserProfileSettingsModal from '../profile/UserProfileSettingsModal';

const LiveClockBadge = React.memo(() => {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300">
      <Clock className="w-3.5 h-3.5 text-amber-400" />
      <span className="font-cairo font-bold">
        {time.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}
      </span>
      <span className="text-zinc-600">|</span>
      <span className="text-amber-400 font-black">
        {time.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
});

/**
 * LockersDashboard: Comprehensive Lockers Management Module
 * Implements Interactive Visual Grid / Locker Matrix, Status Toggles,
 * Summary Counters, Filtering, Add & Edit Modals.
 */
export const LockersDashboard = ({ isEmbedded = false, onNavigateBack }) => {
  const navigate = useNavigate();
  const { 
    user, 
    isAuthenticated, 
    logout, 
    setIsChangePasswordModalOpen,
    isProfileSettingsModalOpen,
    setIsProfileSettingsModalOpen 
  } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const roleMeta = getRoleMeta(user?.role);

  // Data states
  const [lockers, setLockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter & Search states
  // 'all' | 'active' | 'inactive'
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState(null);

  // Track locker IDs currently performing status toggle
  const [togglingIds, setTogglingIds] = useState(new Set());

  // Fetch lockers from API
  const fetchLockers = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Call GET /api/Lockers without filter to get full matrix and compute metrics locally
      const data = await lockerService.getLockers();
      setLockers(data);
    } catch (err) {
      console.error('Error fetching lockers:', err);
      const msg = err.friendlyMessage || 'تعذر تحميل بيانات اللوكرات من السيرفر. يرجى المحاولة لاحقاً.';
      setError(msg);
      toastError('خطأ في تحميل اللوكرات', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toastError]);

  // Initial load
  useEffect(() => {
    fetchLockers();
  }, [fetchLockers]);

  // Quick Toggle Locker Status (PATCH /api/Lockers/{id}/status)
  const handleToggleStatus = async (id, newStatus) => {
    setTogglingIds((prev) => new Set(prev).add(id));

    // Optimistic UI Update
    setLockers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActive: newStatus } : l))
    );

    try {
      await lockerService.toggleLockerStatus(id, newStatus);
      toastSuccess(
        newStatus ? 'تم تنشيط اللوكر بنجاح' : 'تم إيقاف اللوكر للصيانة',
        newStatus
          ? 'اللوكر الآن متاح وجاهز لتسكين أعضاء الجيم.'
          : 'تم وضع اللوكر في وضع الصيانة وخارج الخدمة مؤقتاً.'
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
      // Revert optimistic update
      setLockers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, isActive: !newStatus } : l))
      );
      toastError('فشل تغيير حالة اللوكر', err.friendlyMessage || 'حدث خطأ أثناء تعديل الحالة.');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Add Locker Success
  const handleLockerAdded = (newLocker) => {
    setLockers((prev) => {
      const updated = [...prev.filter((l) => l.id !== newLocker.id), newLocker];
      return updated.sort((a, b) => Number(a.number) - Number(b.number));
    });
    // Immediately fetch full state from server to get backend isAvailable & id
    fetchLockers();
  };


  // Edit Locker Success
  const handleLockerUpdated = (updatedLocker) => {
    setLockers((prev) => {
      const updated = prev.map((l) => (l.id === updatedLocker.id ? updatedLocker : l));
      return updated.sort((a, b) => Number(a.number) - Number(b.number));
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (locker) => {
    setSelectedLocker(locker);
    setIsEditModalOpen(true);
  };

  // Summary Metrics calculations
  const totalCount = lockers.length;
  const activeCount = useMemo(() => lockers.filter((l) => l.isActive).length, [lockers]);
  const inactiveCount = useMemo(() => lockers.filter((l) => !l.isActive).length, [lockers]);
  const occupiedCount = useMemo(() => lockers.filter((l) => l.isActive && !l.isAvailable).length, [lockers]);
  const availableCount = useMemo(() => lockers.filter((l) => l.isActive && l.isAvailable).length, [lockers]);

  // Existing numbers list for validation
  const existingNumbers = useMemo(() => lockers.map((l) => Number(l.number)), [lockers]);

  // Filtered & Searched lockers
  const filteredLockers = useMemo(() => {
    return lockers.filter((l) => {
      // Filter status tab
      if (filterStatus === 'active' && !l.isActive) return false;
      if (filterStatus === 'inactive' && l.isActive) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().replace(/^#/, '');
        const matchNumber = String(l.number).includes(q);
        const matchId = String(l.id) === q;
        if (!matchNumber && !matchId) return false;
      }

      return true;
    });
  }, [lockers, filterStatus, searchQuery]);

  return (
    <div dir="rtl" className={`text-zinc-100 font-cairo ${!isEmbedded ? 'min-h-screen bg-black bg-wolf-mesh pb-12' : ''}`}>
      {/* Standalone Navigation Header if not embedded */}
      {!isEmbedded && (
        <header className="sticky top-0 z-40 wolf-glass bg-zinc-950/90 border-b border-amber-500/20 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Logo & Brand */}
            <div 
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 sm:gap-4 min-w-0 cursor-pointer group/logo"
              title="العودة للصفحة الرئيسية"
            >
              <div className="relative group flex-shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl sm:rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
                <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-black border border-amber-500/50 shadow-gold-glow overflow-hidden p-1">
                  <img
                    src={wolfLogo}
                    alt="WOLVES"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 m-0 truncate group-hover/logo:text-amber-300">
                  WOLVES
                </h1>
                <p className="text-[10px] sm:text-xs text-zinc-400 font-semibold tracking-wide mt-0.5 hidden sm:block">
                  منظومة التحكم وإدارة دواليب ولوكرات الجيم
                </p>
              </div>
            </div>

            {/* Navigation links to other sections */}
            <nav className="flex items-center gap-1.5 p-1 bg-black/60 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black text-zinc-400 hover:text-amber-400 transition-all flex items-center gap-1.5 cursor-pointer"
                title="الذهاب للصفحة الرئيسية للجيم"
              >
                <Home className="w-3.5 h-3.5 text-amber-400" />
                <span>الرئيسية</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/reception')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الحضور والإشغال</span>
                <span className="sm:hidden">الحضور</span>
              </button>

              <button
                type="button"
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-gold-glow flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>إدارة اللوكرات</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard/reception')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">المشتركين</span>
              </button>
            </nav>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <LiveClockBadge />

              {isAuthenticated && (
                <div className="flex items-center gap-1 sm:gap-2 bg-zinc-900/90 border border-amber-500/30 rounded-xl sm:rounded-2xl p-1 sm:p-1.5">
                  <button
                    type="button"
                    onClick={() => setIsProfileSettingsModalOpen(true)}
                    className="w-7 h-7 rounded-lg sm:rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs font-mono hover:scale-105 transition-transform cursor-pointer"
                    title="تعديل البيانات الشخصية"
                  >
                    {user?.name ? user.name.slice(0, 1).toUpperCase() : 'W'}
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
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 ${!isEmbedded ? 'pt-6 sm:pt-8' : 'pt-2'} space-y-6 sm:space-y-8`}>
        
        {/* Module Header Bar: Title + Quick Refresh + Add Locker CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <KeyRound className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  إدارة اللوكرات
                  <span className="text-[10px] sm:text-xs font-mono font-bold bg-white/5 text-zinc-400 border border-white/10 px-2 py-0.5 rounded-md">
                    LOCKERS
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  مراقبة وتوزيع دواليب الجيم
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions: Refresh + Add Locker */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={loading || refreshing}
              onClick={() => fetchLockers(true)}
              className="p-2.5 sm:p-3 rounded-xl bg-[#141417] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50"
              title="تحديث قائمة اللوكرات من السيرفر"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-600/90 to-yellow-600/90 hover:from-amber-500 hover:to-yellow-500 text-black text-xs sm:text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span>إضافة لوكر</span>
            </button>
          </div>
        </div>

        {/* Top Summary Counters */}
        <section aria-label="إحصائيات اللوكرات" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Counter 1: Total Lockers */}
          <div className="bg-[#121215] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs font-medium text-zinc-400 truncate">
                الإجمالي
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                {totalCount}
              </div>
            </div>
          </div>

          {/* Counter 2: Active / Ready Lockers */}
          <div className="bg-[#121215] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs font-medium text-zinc-400 truncate">
                المتاح
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {availableCount}
              </div>
            </div>
          </div>

          {/* Counter 3: Occupied Lockers */}
          <div className="bg-[#121215] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs font-medium text-zinc-400 truncate">
                المشغول
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-0.5">
                {occupiedCount}
              </div>
            </div>
          </div>

          {/* Counter 4: Inactive / Maintenance Lockers */}
          <div className="bg-[#121215] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex-shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs font-medium text-zinc-400 truncate">
                الصيانة
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-0.5">
                {inactiveCount}
              </div>
            </div>
          </div>
        </section>

        {/* Filter Tabs & Search Controls */}
        <div className="bg-[#121215] rounded-xl sm:rounded-2xl p-3 border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filterStatus === 'all'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-white/5'
              }`}
            >
              <span>الكل</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-current">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filterStatus === 'active'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-white/5'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>النشطة</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-current">
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filterStatus === 'inactive'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-white/5'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>الصيانة</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-current">
                {inactiveCount}
              </span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم اللوكر..."
              className="w-full bg-[#16161a] text-white placeholder-zinc-500 text-xs rounded-lg pr-9 pl-3 py-2 border border-white/10 focus:outline-none focus:border-amber-500/40 font-mono transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-white font-mono bg-zinc-800 px-1.5 py-0.5 rounded"
              >
                مسح
              </button>
            )}
          </div>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="rounded-2xl p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <p className="text-xs sm:text-sm font-semibold">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchLockers(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold transition-colors whitespace-nowrap"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Interactive Visual Grid / Locker Matrix */}
        <section aria-label="شبكة اللوكرات التفاعلية" className="relative min-h-[350px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
              <p className="text-sm font-bold text-zinc-400">
                جاري تحميل شبكة وتوزيع اللوكرات من السيرفر...
              </p>
            </div>
          ) : filteredLockers.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3"
            >
              <AnimatePresence>
                {filteredLockers.map((locker) => (
                  <LockerCard
                    key={locker.id}
                    locker={locker}
                    onEdit={handleOpenEdit}
                    onToggleStatus={handleToggleStatus}
                    isToggling={togglingIds.has(locker.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl wolf-glass border border-amber-500/20 text-center">
              <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                <KeyRound className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mb-1">
                {lockers.length === 0
                  ? 'لا توجد لوكرات مسجلة بالسيستم بعد!'
                  : 'لم يتم العثور على لوكرات مطابقة للبحث أو الفلتر'}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-5">
                {lockers.length === 0
                  ? 'ابدأ بتسجيل أول دولاب في صالة WOLVES لتتمكن من تسكينه للأعضاء أثناء الدخول.'
                  : 'جرّب تعديل كلمات البحث أو اختيار فلتر "الكل" لعرض كافة الدواليب.'}
              </p>
              {lockers.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black text-xs font-black shadow-gold-glow hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>إضافة أول لوكر الآن</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/25 text-xs font-bold transition-all"
                >
                  إعادة ضبط الفلاتر
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Add New Locker Modal */}
      <AddLockerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLockerAdded={handleLockerAdded}
        existingNumbers={existingNumbers}
      />

      {/* Edit Locker Modal */}
      <EditLockerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLocker(null);
        }}
        locker={selectedLocker}
        onLockerUpdated={handleLockerUpdated}
        existingNumbers={existingNumbers}
      />

      {/* User Profile Settings Modal */}
      <UserProfileSettingsModal
        isOpen={isProfileSettingsModalOpen}
        onClose={() => setIsProfileSettingsModalOpen(false)}
      />
    </div>
  );
};

export default LockersDashboard;
