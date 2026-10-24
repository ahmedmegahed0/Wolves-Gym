import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Search, 
  RotateCw, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  Award, 
  Home, 
  Eye, 
  X, 
  Loader2,
  Calendar
} from 'lucide-react';
import { kpisService, extractKpiErrorMessage } from '../../services/kpisService';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';
import KpiFormModal from './KpiFormModal';
import KpiDetailsModal from './KpiDetailsModal';
import wolfLogo from '../../assets/logo.png';

/**
 * Status filter options for KPIs
 */
const STATUS_FILTERS = [
  { id: 'all', label: 'جميع المؤشرات' },
  { id: 'active', label: 'المفعلة فقط' },
  { id: 'inactive', label: 'المعطلة فقط' },
];

/**
 * Sort options for KPIs
 */
const SORT_OPTIONS = [
  { id: '', label: 'الترتيب الافتراضي' },
  { id: 'createdAt_desc', label: 'الأحدث إضافة' },
  { id: 'createdAt_asc', label: 'الأقدم إضافة' },
  { id: 'name_asc', label: 'الاسم (أ - ي)' },
  { id: 'name_desc', label: 'الاسم (ي - أ)' },
];

/**
 * KpisManagement Component
 * Comprehensive management dashboard and data table for KPIs Module.
 * Dedicated to Operation Manager and Gym Management.
 */
export const KpisManagement = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  // Data states
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [sortBy, setSortBy] = useState('');

  // Pagination states connected to API
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [hasNextPage, setNextPage] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [kpiToEdit, setKpiToEdit] = useState(null);
  const [selectedDetailsId, setSelectedDetailsId] = useState(null);

  // Status toggle in-progress tracking
  const [togglingId, setTogglingId] = useState(null);

  // Fetch KPIs from GET /api/Kpis
  const fetchKpis = useCallback(
    async (isManualRefresh = false, signal = null) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        let isActiveParam = undefined;
        if (statusFilter === 'active') isActiveParam = true;
        else if (statusFilter === 'inactive') isActiveParam = false;

        const res = await kpisService.getKpis(
          {
            isActive: isActiveParam,
            pageNumber,
            pageSize,
            search: debouncedSearch.trim(),
            sortBy,
          },
          { signal }
        );

        const list = Array.isArray(res?.data) ? res.data : [];
        setKpis(list);
        setTotalCount(res?.totalCount !== undefined ? res.totalCount : list.length);
        setTotalPages(res?.totalPages || Math.ceil((res?.totalCount || list.length || 1) / pageSize) || 1);
        setHasPreviousPage(Boolean(res?.hasPreviousPage || pageNumber > 1));
        setNextPage(Boolean(res?.hasNextPage || (pageNumber < (res?.totalPages || 1))));
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        console.error('Failed to fetch KPIs:', err);
        const errMsg = extractKpiErrorMessage(err, 'تعذر تحميل مؤشرات الأداء. يرجى التحقق من الاتصال.');
        toastError('خطأ في التحميل', errMsg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pageNumber, pageSize, debouncedSearch, statusFilter, sortBy, toastError]
  );

  // Effect to load data
  useEffect(() => {
    const controller = new AbortController();
    fetchKpis(false, controller.signal);
    return () => controller.abort();
  }, [fetchKpis]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchKpis(true);
  };

  // Toggle KPI active status via PATCH /api/Kpis/{id}
  const handleToggleStatus = async (kpi) => {
    const kpiId = kpi.id;
    setTogglingId(kpiId);

    const prevKpi = { ...kpi };
    const nextStatus = !kpi.isActive;

    // Optimistic UI update
    setKpis((prev) =>
      prev.map((item) => (item.id === kpiId ? { ...item, isActive: nextStatus } : item))
    );

    try {
      await kpisService.toggleKpiStatus(kpiId, prevKpi);
      toastSuccess(
        nextStatus ? 'تم تفعيل المؤشر' : 'تم تعطيل المؤشر',
        `أصبح مؤشر "${kpi.name}" ${nextStatus ? 'نشطاً ومعتمداً لتقييم الكباتن' : 'معطلاً ومخفياً من التقييمات'}.`
      );
    } catch (err) {
      console.error('Toggle status error:', err);
      // Revert optimistic update
      setKpis((prev) =>
        prev.map((item) => (item.id === kpiId ? { ...item, isActive: prevKpi.isActive } : item))
      );
      const msg = extractKpiErrorMessage(err, 'فشل تغيير حالة تفعيل المؤشر.');
      toastError('فشل التعديل', msg);
    } finally {
      setTogglingId(null);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (kpi) => {
    setKpiToEdit(kpi);
    setIsFormModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setKpiToEdit(null);
    setIsFormModalOpen(true);
  };

  // Open Details Modal
  const handleOpenDetails = (kpiId) => {
    setSelectedDetailsId(kpiId);
  };

  // Handle filter changes (resets to page 1)
  const handleFilterStatusChange = (val) => {
    setStatusFilter(val);
    setPageNumber(1);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setPageNumber(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSortBy('');
    setPageNumber(1);
  };

  // Calculate high-level stats
  const activeCount = useMemo(() => {
    return kpis.filter((k) => k.isActive !== false).length;
  }, [kpis]);

  const inactiveCount = useMemo(() => {
    return kpis.filter((k) => k.isActive === false).length;
  }, [kpis]);

  const hasActiveFilters = Boolean(search || statusFilter !== 'all' || sortBy);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div dir="rtl" className="w-full text-zinc-100 font-cairo">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & BRANDING BAR (When standalone or embedded)    */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-amber-500/20">
        <div 
          onClick={() => !isEmbedded && navigate('/')} 
          className={`flex items-center gap-3 ${!isEmbedded ? 'cursor-pointer group/logo' : ''}`}
          title="العودة للصفحة الرئيسية"
        >
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-black border border-amber-500/50 shadow-gold-glow overflow-hidden p-1.5">
              <img
                src={wolfLogo}
                alt="WOLVES"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white group-hover/logo:text-amber-400 transition-colors">
                مؤشرات أداء المدربين (KPIs)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                OPERATION MANAGER
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              إدارة واعتماد معايير التقييم الفنية والتشغيلية لكباتن ومدربي كتيبة الذئاب
            </p>
          </div>
        </div>

        {/* Top Actions: Add New KPI + Navigation shortcuts */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto flex-wrap sm:flex-nowrap">
          {!isEmbedded && (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 border border-white/10 hover:border-amber-500/40 text-zinc-300 hover:text-amber-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="الذهاب للصفحة الرئيسية للجيم"
            >
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span>الرئيسية</span>
            </button>
          )}

          {/* Primary Call-to-Action: Add KPI Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black shadow-gold-glow flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ إضافة مؤشر أداء جديد</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. STATS & SUMMARY METRIC CARDS                               */}
      {/* ============================================================== */}
      <section aria-label="إحصائيات مؤشرات الأداء" className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-6">
        {/* Metric 1: Total KPIs */}
        <div className="wolf-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-amber-500/25 flex items-center gap-3.5 group hover:border-amber-500/50 transition-all">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform">
            <Target className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-zinc-400">إجمالي المؤشرات</div>
            <div className="text-xl sm:text-3xl font-black text-white font-mono">{totalCount}</div>
            <div className="text-[10px] text-amber-400 font-bold">معيار مسجل بالسيستم</div>
          </div>
        </div>

        {/* Metric 2: Active KPIs */}
        <div className="wolf-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-500/25 flex items-center gap-3.5 group hover:border-emerald-500/50 transition-all">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-zinc-400">المؤشرات النشطة</div>
            <div className="text-xl sm:text-3xl font-black text-emerald-400 font-mono">
              {statusFilter === 'active' ? totalCount : activeCount}
            </div>
            <div className="text-[10px] text-emerald-400/90 font-bold">معتمدة في التقييم</div>
          </div>
        </div>

        {/* Metric 3: Inactive KPIs */}
        <div className="wolf-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-rose-500/25 flex items-center gap-3.5 group hover:border-rose-500/50 transition-all">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)] group-hover:scale-110 transition-transform">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-zinc-400">المؤشرات المعطلة</div>
            <div className="text-xl sm:text-3xl font-black text-rose-400 font-mono">
              {statusFilter === 'inactive' ? totalCount : inactiveCount}
            </div>
            <div className="text-[10px] text-rose-400/90 font-bold">متوقفة ومخفية</div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. SEARCH & FILTERS TOOLBAR                                   */}
      {/* ============================================================== */}
      <div className="wolf-glass rounded-2xl sm:rounded-3xl p-4 mb-6 border border-amber-500/20 shadow-lg">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageNumber(1);
              }}
              placeholder="ابحث باسم مؤشر الأداء أو جزء من الوصف..."
              className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-white text-xs sm:text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPageNumber(1);
                }}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills & Sorting */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Status Tabs */}
            <div className="flex items-center bg-zinc-950/90 rounded-xl p-1 border border-zinc-800 shrink-0">
              {STATUS_FILTERS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFilterStatusChange(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-950/90 border border-zinc-800 text-zinc-300 text-xs font-bold focus:outline-none focus:border-amber-500 transition-all cursor-pointer pr-3"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-zinc-950 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2 rounded-xl bg-zinc-950/90 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-all cursor-pointer"
              title="تحديث البيانات"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Reset Filters Shortcut */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer shrink-0"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. LUXURY DARK & GOLD DATA TABLE                              */}
      {/* ============================================================== */}
      <div className="wolf-glass rounded-2xl sm:rounded-3xl border border-amber-500/25 shadow-2xl overflow-hidden mb-6">
        <div className="overflow-x-auto gold-scrollbar">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-amber-500/20 text-amber-400/90 text-xs font-black uppercase tracking-wider">
                <th className="py-4 px-4 sm:px-6 w-20">#</th>
                <th className="py-4 px-4 sm:px-6">اسم المؤشر</th>
                <th className="py-4 px-4 sm:px-6">وصف المؤشر ومعايير القياس</th>
                <th className="py-4 px-4 sm:px-6 w-36">تاريخ الإضافة</th>
                <th className="py-4 px-4 sm:px-6 w-36 text-center">الحالة (تفاعلية)</th>
                <th className="py-4 px-4 sm:px-6 w-36 text-center">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/80 text-xs sm:text-sm">
              {loading && !refreshing ? (
                // Skeleton Loading State
                Array.from({ length: pageSize > 6 ? 6 : pageSize }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse bg-zinc-950/40">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="h-5 w-8 bg-zinc-800 rounded-lg" />
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="h-5 w-40 bg-zinc-800 rounded-lg mb-1.5" />
                      <div className="h-3 w-20 bg-zinc-900 rounded-lg" />
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="h-4 w-3/4 bg-zinc-800 rounded-lg mb-1" />
                      <div className="h-4 w-1/2 bg-zinc-900 rounded-lg" />
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="h-4 w-24 bg-zinc-800 rounded-lg" />
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="h-6 w-20 bg-zinc-800 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="h-8 w-20 bg-zinc-800 rounded-xl mx-auto" />
                    </td>
                  </tr>
                ))
              ) : kpis.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 shadow-gold-glow">
                        <Target className="w-8 h-8 animate-pulse" />
                      </div>
                      <h3 className="text-lg font-black text-white mb-1.5">
                        {hasActiveFilters
                          ? 'لا توجد نتائج مطابقة لبحثك'
                          : 'لم يتم إضافة مؤشرات أداء بعد'}
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
                        {hasActiveFilters
                          ? 'جرب البحث بكلمات أخرى أو قم بإلغاء الفلاتر المحددة لعرض كافة المؤشرات المعتمدة.'
                          : 'قم باعتماد أول مؤشر أداء للكباتن (مثل: الالتزام بالمواعيد، المتابعة البدنية) لبدء تقييم المدربين.'}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
                        >
                          إعادة ضبط الفلاتر
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenCreate}
                          className="px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-gold-glow hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>+ إضافة أول مؤشر أداء</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Data Rows
                kpis.map((kpi) => {
                  const isToggling = togglingId === kpi.id;
                  return (
                    <tr
                      key={kpi.id}
                      className="hover:bg-amber-500/5 transition-colors group/row"
                    >
                      {/* ID */}
                      <td className="py-4 px-4 sm:px-6 font-mono text-zinc-400 font-bold">
                        <span className="bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded-lg text-xs">
                          #{kpi.id}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0 group-hover/row:scale-110 transition-transform">
                            <Target className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-black text-white group-hover/row:text-amber-300 transition-colors block">
                              {kpi.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              معيار تقييم كباتن
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-4 px-4 sm:px-6 max-w-xs sm:max-w-md">
                        <p className="text-zinc-300 text-xs line-clamp-2 leading-relaxed">
                          {kpi.description || '— لا يوجد وصف مسجل —'}
                        </p>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 sm:px-6 text-zinc-400 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{formatDate(kpi.createdAt)}</span>
                        </div>
                      </td>

                      {/* Status (Interactive Badge via PATCH) */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(kpi)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border hover:scale-105 active:scale-95 ${
                            kpi.isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                          } ${isToggling ? 'opacity-60 cursor-wait' : ''}`}
                          title={`انقر للتحويل إلى: ${kpi.isActive ? 'معطل' : 'مفعل'}`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : kpi.isActive ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{kpi.isActive ? 'مفعل' : 'معطل'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(kpi.id)}
                            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                            title="عرض تفاصيل المؤشر"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(kpi)}
                            className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-sm hover:scale-105"
                            title="تعديل هذا المؤشر"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ============================================================== */}
        {/* 5. PAGINATION FOOTER (Directly connected to API)              */}
        {/* ============================================================== */}
        <div className="p-4 bg-zinc-950/90 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Info & Page Size */}
          <div className="flex items-center gap-3 text-zinc-400">
            <span>
              عرض <strong className="text-white font-mono">{kpis.length}</strong> من إجمالي{' '}
              <strong className="text-amber-400 font-mono">{totalCount}</strong> مؤشر أداء
            </span>

            <span className="text-zinc-600">|</span>

            <div className="flex items-center gap-1.5">
              <span>لكل صفحة:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
                className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-2 py-1 font-mono text-xs cursor-pointer focus:outline-none focus:border-amber-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!hasPreviousPage || pageNumber <= 1 || loading}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Page indicator pill */}
            <div className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs font-bold">
              صفحة <span className="text-amber-400">{pageNumber}</span> من{' '}
              <span className="text-white">{totalPages || 1}</span>
            </div>

            <button
              type="button"
              disabled={!hasNextPage || pageNumber >= totalPages || loading}
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. MODALS                                                     */}
      {/* ============================================================== */}
      {/* Add / Edit Modal */}
      <KpiFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setKpiToEdit(null);
        }}
        kpi={kpiToEdit}
        onSuccess={() => fetchKpis(true)}
      />

      {/* View Details Modal */}
      <KpiDetailsModal
        isOpen={Boolean(selectedDetailsId)}
        onClose={() => setSelectedDetailsId(null)}
        kpiId={selectedDetailsId}
        onEdit={(kpi) => handleOpenEdit(kpi)}
      />
    </div>
  );
};

export default KpisManagement;
