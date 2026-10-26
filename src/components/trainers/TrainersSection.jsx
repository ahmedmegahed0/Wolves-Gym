import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowUpDown, 
  RotateCw, 
  ShieldCheck, 
  Dumbbell, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Award,
  AlertCircle,
  Home,
  Table,
  Grid
} from 'lucide-react';
import TrainerCard from './TrainerCard';
import TrainersAdminManagement from './TrainersAdminManagement';
import TrainerPackagesModal from './TrainerPackagesModal';
import { trainerService, getRoleMeta } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';
import wolfLogo from '../../assets/logo.png';

/**
 * Filter categories for coach specialties
 */
const SPECIALTY_FILTERS = [
  { id: 'all', label: 'كل الكباتن' },
  { id: 'bodybuilding', label: 'كمال أجسام وتضخيم' },
  { id: 'powerlifting', label: 'قوة بدنية (Powerlifting)' },
  { id: 'fitness', label: 'فتنس وتخسيس' },
  { id: 'crossfit', label: 'كروس فيت ولياقة' },
];

/**
 * TrainersSection Component
 * Reusable Trainers Showcase Module for Landing Page and Dashboards
 * Integrates with GET /api/Trainers (Public cards) and GET /api/Trainers/management (Admin table)
 */
export const TrainersSection = ({ 
  isEmbedded = false, 
  onSelectTrainer = null,
  initialView = 'cards',
  title = 'كتيبة المدربين والكباتن المعتمدين',
  subtitle = 'نخبة من أفضل أبطال ومدربي اللياقة البدنية وكمال الأجسام لتحقيق أهدافك الرياضية'
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleMeta = getRoleMeta(user?.role);
  const canManage = ['SuperAdmin', 'Manager', 'Receptionist', 'Reception'].includes(roleMeta.role);

  const [activeView, setActiveView] = useState(() => {
    if (canManage) return 'management';
    return initialView || 'cards';
  });

  const { error: toastError, success: toastSuccess } = useToast();

  // Selected trainer for private packages modal
  const [selectedTrainerModal, setSelectedTrainerModal] = useState(null);

  // Query & Filter states for Public Cards View
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [activeSpecialty, setActiveSpecialty] = useState('all');

  // Pagination states
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Trainers from API with AbortSignal support
  const fetchTrainers = useCallback(async (isManualRefresh = false, signal = null) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await trainerService.getTrainers({
        pageNumber,
        pageSize,
        search: debouncedSearch.trim(),
        signal,
      });

      setTrainers(Array.isArray(res?.data) ? res.data : []);
      setTotalCount(res?.totalCount ?? 0);
      setTotalPages(res?.totalPages ?? 1);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return; // Safely ignore obsolete aborted request
      }
      console.error('Error fetching trainers:', err);
      toastError('تعذر تحميل بيانات الكباتن', err.message || 'يرجى التأكد من اتصال السيرفر والمحاولة مجدداً.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pageNumber, pageSize, debouncedSearch, toastError]);

  // Trigger fetch with cancellation of in-flight obsolete queries
  useEffect(() => {
    if (activeView === 'cards') {
      const controller = new AbortController();
      fetchTrainers(false, controller.signal);
      return () => {
        controller.abort();
      };
    }
  }, [fetchTrainers, activeView]);

  // Client-side specialty filter on top of search results
  const filteredTrainers = useMemo(() => {
    if (activeSpecialty === 'all') return trainers;
    if (activeSpecialty === 'bodybuilding') {
      return trainers.filter((t) => (t.specialty || '').includes('كمال') || (t.specialty || '').includes('تضخيم'));
    }
    if (activeSpecialty === 'powerlifting') {
      return trainers.filter((t) => (t.specialty || '').includes('قوة') || (t.specialty || '').includes('Power'));
    }
    if (activeSpecialty === 'fitness') {
      return trainers.filter((t) => (t.specialty || '').includes('فتنس') || (t.specialty || '').includes('تخسيس'));
    }
    if (activeSpecialty === 'crossfit') {
      return trainers.filter((t) => (t.specialty || '').includes('كروس') || (t.specialty || '').includes('لياقة'));
    }
    return trainers;
  }, [trainers, activeSpecialty]);

  // Reset pagination when searching
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageNumber(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPageNumber(1);
  };

  return (
    <div dir="rtl" className="w-full space-y-6 sm:space-y-8 font-cairo">
      
      {/* ============================================================== */}
      {/* 1. HERO / SECTION HEADER                                       */}
      {/* ============================================================== */}
      {!isEmbedded ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#14120c] via-[#0e0e12] to-black border border-amber-500/30 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
                <Dumbbell className="w-4 h-4" />
                <span>طاقم التدريب الرياضي الرسمي • WOLVES</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 tracking-tight">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-white/10 hover:border-amber-500/40 text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                title="الذهاب للصفحة الرئيسية للجيم"
              >
                <Home className="w-4 h-4 text-amber-400" />
                <span>الرئيسية</span>
              </button>

            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-black flex items-center justify-center shadow-gold-glow shrink-0">
              <Dumbbell className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">{title}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  COACHES
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeView === 'cards' && (
              <button
                type="button"
                onClick={() => fetchTrainers(true)}
                disabled={loading || refreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/25 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 self-start sm:self-auto cursor-pointer"
                title="تحديث البيانات"
              >
                <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* RENDER VIEW: MANAGEMENT OR PUBLIC CARDS */}
      <AnimatePresence mode="wait">
        {activeView === 'management' && canManage ? (
          <motion.div
            key="management-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TrainersAdminManagement />
          </motion.div>
        ) : (
          <motion.div
            key="cards-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Search & Filter Controls */}
            <div className="bg-[#121217] border border-amber-500/20 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Live Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="ابحث باسم الكابتن أو التخصص..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 focus:border-amber-500 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all shadow-inner"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                    >
                      مسح
                    </button>
                  )}
                </div>

                {/* PageSize Controls */}
                <div className="flex items-center gap-2.5 self-end md:self-auto">
                  {/* PageSize Selector */}
                  <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl px-3 py-2 text-xs">
                    <span className="text-zinc-500 hidden sm:inline">عرض:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPageNumber(1);
                      }}
                      className="bg-transparent text-amber-400 font-mono font-bold outline-none cursor-pointer"
                    >
                      <option value={4} className="bg-zinc-950">4 كباتن</option>
                      <option value={8} className="bg-zinc-950">8 كباتن</option>
                      <option value={12} className="bg-zinc-950">12 كابتن</option>
                      <option value={16} className="bg-zinc-950">16 كابتن</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Specialty Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {SPECIALTY_FILTERS.map((f) => {
                  const isActive = activeSpecialty === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveSpecialty(f.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow'
                          : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800/80'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trainers Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-4 animate-pulse"
                  >
                    <div className="flex justify-between items-center">
                      <div className="h-5 w-24 bg-zinc-800 rounded-full" />
                      <div className="h-5 w-12 bg-zinc-800 rounded-xl" />
                    </div>
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-zinc-800" />
                    <div className="h-5 w-36 mx-auto bg-zinc-800 rounded-lg" />
                    <div className="h-4 w-28 mx-auto bg-zinc-800/60 rounded-lg" />
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="h-12 bg-zinc-800/60 rounded-xl" />
                      <div className="h-12 bg-zinc-800/60 rounded-xl" />
                    </div>
                    <div className="h-10 bg-zinc-800 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredTrainers.length === 0 ? (
              <div className="bg-[#121217] border border-amber-500/20 rounded-3xl py-16 px-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900/90 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto shadow-gold-glow">
                  <Dumbbell className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">لا يوجد كباتن مسجلين حالياً</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    {search
                      ? `لم نجد أي كابتن يطابق بحثك "${search}". جرب البحث بكلمة أخرى.`
                      : 'سيتم إضافة كباتن جدد لكتيبة الذئاب قريباً.'}
                  </p>
                </div>
                {search && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    عرض كل الكباتن
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredTrainers.map((trainer) => (
                  <TrainerCard
                    key={trainer.id || trainer.trainerId}
                    trainer={trainer}
                    onSelect={(t) => onSelectTrainer ? onSelectTrainer(t) : setSelectedTrainerModal(t)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-amber-500/15">
                <div className="text-xs text-zinc-400 font-mono">
                  صفحة <span className="text-amber-400 font-bold">{pageNumber}</span> من{' '}
                  <span className="text-white font-bold">{totalPages}</span> (إجمالي {totalCount} مدرب)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pageNumber <= 1 || loading}
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 disabled:opacity-40 disabled:hover:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPageNumber(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        pageNumber === pageNum
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={pageNumber >= totalPages || loading}
                    onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 disabled:opacity-40 disabled:hover:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trainer Private Packages Modal */}
      <TrainerPackagesModal
        isOpen={Boolean(selectedTrainerModal)}
        onClose={() => setSelectedTrainerModal(null)}
        trainer={selectedTrainerModal}
      />
    </div>
  );
};

export default TrainersSection;
