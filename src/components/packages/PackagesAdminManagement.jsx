import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit3, 
  Power, 
  RefreshCw, 
  Crown, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  ArrowUpDown, 
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Eye,
  X,
  Filter,
  UserCheck,
  Users,
  Loader2
} from 'lucide-react';
import { 
  packageService, 
  trainerService, 
  PACKAGE_TYPES, 
  getPackageTypeMeta 
} from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import PackageFormModal from './PackageFormModal';
import useDebounce from '../../hooks/useDebounce';

/**
 * PackagesAdminManagement Component
 * Comprehensive management dashboard and data table for SuperAdmin and Manager
 * Handles GET /api/Packages/management with full query parameters:
 * Types, TrainerId, IsActive, PageNumber, PageSize, Search, SortBy
 */
export const PackagesAdminManagement = ({ onBackToPublicGrid, isEmbedded = false, onOpenNewSubscription = null }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [packages, setPackages] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [selectedType, setSelectedType] = useState('all'); // 'all' | '0' | '1' | '2'
  const [selectedTrainerId, setSelectedTrainerId] = useState('all'); // 'all' | number
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'active' | 'inactive'
  
  // Pagination
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Actions
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedDetailsPackage, setSelectedDetailsPackage] = useState(null);

  // Load trainers once for the filter dropdown
  useEffect(() => {
    let isMounted = true;
    trainerService
      .getAllTrainers()
      .then((data) => {
        if (isMounted) setTrainers(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.warn('Failed to load trainers for filter dropdown:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Management Packages
  const fetchPackages = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      // Build query arguments
      let typesParam = undefined;
      if (selectedType !== 'all') {
        typesParam = Number(selectedType);
      }

      let trainerIdParam = undefined;
      if (selectedTrainerId !== 'all') {
        trainerIdParam = Number(selectedTrainerId);
      }

      let isActiveParam = undefined;
      if (selectedStatus === 'active') isActiveParam = true;
      else if (selectedStatus === 'inactive') isActiveParam = false;

      const res = await packageService.getManagementPackages({
        types: typesParam,
        trainerId: trainerIdParam,
        isActive: isActiveParam,
        pageNumber,
        pageSize,
        search: debouncedSearch.trim(),
      });

      setPackages(res.data || []);
      setTotalCount(res.totalCount || (res.data ? res.data.length : 0));
      setTotalPages(res.totalPages || Math.ceil((res.totalCount || 1) / pageSize) || 1);
    } catch (err) {
      console.warn('Failed to fetch management packages:', err);
      toastError('خطأ في التحميل', 'تعذر تحميل باقات الإدارة. برجاء التحقق من الاتصال.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pageNumber, pageSize, debouncedSearch, selectedType, selectedTrainerId, selectedStatus, toastError]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleRefresh = () => {
    fetchPackages(true);
  };

  // Toggle active status
  const handleToggleStatus = async (pkg) => {
    setTogglingId(pkg.id);
    try {
      const nextStatus = !pkg.isActive;
      await packageService.togglePackageStatus(pkg.id, pkg);
      toastSuccess(
        nextStatus ? 'تم تفعيل الباقة' : 'تم إيقاف الباقة',
        `أصبحت باقة "${pkg.name}" ${nextStatus ? 'مفعلة وتظهر للمشتركين' : 'متوقفة ومخفية عن المشتركين'}.`
      );
      fetchPackages();
    } catch (err) {
      toastError('فشل تغيير الحالة', err.message || 'حدث خطأ أثناء تعديل حالة الباقة.');
    } finally {
      setTogglingId(null);
    }
  };

  // Edit package
  const handleOpenEdit = (pkg) => {
    setPackageToEdit(pkg);
    setIsFormModalOpen(true);
  };

  // Create new package
  const handleOpenCreate = () => {
    setPackageToEdit(null);
    setIsFormModalOpen(true);
  };

  // Reset pageNumber on any filter change
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPageNumber(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedType('all');
    setSelectedTrainerId('all');
    setSelectedStatus('all');
    setPageNumber(1);
  };

  // Helper to find trainer name
  const getTrainerName = (trainerId) => {
    if (!trainerId) return null;
    const found = trainers.find((t) => Number(t.id || t.trainerId) === Number(trainerId));
    return found ? found.name : `كابتن #${trainerId}`;
  };

  // Calculate Metrics
  const activeCount = packages.filter((p) => p.isActive !== false).length;
  const inactiveCount = packages.filter((p) => p.isActive === false).length;
  const privateCount = packages.filter((p) => Number(p.type) === PACKAGE_TYPES.PRIVATE).length;
  const avgPrice = packages.length > 0 
    ? Math.round(packages.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / packages.length)
    : 0;

  const hasActiveFilters = search || selectedType !== 'all' || selectedTrainerId !== 'all' || selectedStatus !== 'all';

  return (
    <div dir="rtl" className="w-full space-y-6 font-cairo">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            <span>إدارة باقات الجيم</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            تحكم كامل في خطط التدريب، الأسعار، والكباتن المخصصين
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {onOpenNewSubscription && (
            <button
              type="button"
              onClick={() => onOpenNewSubscription()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600/90 to-yellow-600/90 hover:from-amber-500 hover:to-yellow-500 text-black text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              title="تسجيل اشتراك جديد بالصالة"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>تسجيل اشتراك جديد</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-[#141417] hover:bg-zinc-800 text-zinc-200 hover:text-white border border-white/10 text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>إضافة باقة جديدة</span>
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Packages */}
        <div className="bg-[#121215] border border-white/10 rounded-xl sm:rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 block truncate">إجمالي الباقات</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{totalCount}</span>
          </div>
        </div>

        {/* Active Packages */}
        <div className="bg-[#121215] border border-white/10 rounded-xl sm:rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 block truncate">باقات نشطة</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{activeCount}</span>
          </div>
        </div>

        {/* Private Packages */}
        <div className="bg-[#121215] border border-white/10 rounded-xl sm:rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 block truncate">باقات خاصة</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">{privateCount}</span>
          </div>
        </div>

        {/* Average Price */}
        <div className="bg-[#121215] border border-white/10 rounded-xl sm:rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-zinc-400 block truncate">متوسط الأسعار</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono">
              {avgPrice.toLocaleString('ar-EG')} <span className="text-[10px] text-zinc-400 font-normal">ج.م</span>
            </span>
          </div>
        </div>
      </div>

      {/* Streamlined Filter Bar: Search, Type, Status */}
      <div className="bg-[#121215] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* 1. Search Box */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              placeholder="بحث باسم الباقة أو الوصف أو المدة..."
              className="w-full pr-10 pl-8 py-2.5 rounded-xl bg-[#16161a] border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/40 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleFilterChange(setSearch, '')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Streamlined Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Filter 1: Package Type */}
            <div className="flex items-center gap-1.5 bg-[#16161a] border border-white/10 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] text-zinc-400 font-medium shrink-0">النوع:</span>
              <select
                value={selectedType}
                onChange={(e) => handleFilterChange(setSelectedType, e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900 text-white">كل الأنواع</option>
                <option value="0" className="bg-zinc-900 text-zinc-200">عادية / عامة</option>
                <option value="1" className="bg-zinc-900 text-amber-300">برايفت</option>
                <option value="2" className="bg-zinc-900 text-purple-300">خاصة مشتركة</option>
              </select>
            </div>

            {/* Filter 2: Active Status */}
            <div className="flex items-center gap-1.5 bg-[#16161a] border border-white/10 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] text-zinc-400 font-medium shrink-0">الحالة:</span>
              <select
                value={selectedStatus}
                onChange={(e) => handleFilterChange(setSelectedStatus, e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900 text-white">كل الحالات</option>
                <option value="active" className="bg-zinc-900 text-emerald-400">نشطة</option>
                <option value="inactive" className="bg-zinc-900 text-rose-400">معطلة</option>
              </select>
            </div>

            {/* Page Size & Refresh */}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPageNumber(1); }}
              className="bg-[#16161a] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="5">5 / صفحة</option>
              <option value="10">10 / صفحة</option>
              <option value="20">20 / صفحة</option>
            </select>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-[#16161a] text-zinc-300 hover:text-white border border-white/10 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="تحديث البيانات من السيرفر"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-2 rounded-xl bg-zinc-900 text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-medium transition-colors cursor-pointer"
                title="إعادة ضبط الفلاتر"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table & Mobile Cards Container */}
      <div className="bg-[#121215] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {/* Desktop Table View */}
        <div className="overflow-x-auto gold-scrollbar hidden md:block">
          <table className="w-full text-right text-xs text-zinc-300">
            <thead className="bg-zinc-950/90 text-zinc-400 font-bold border-b border-amber-500/15 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">#ID</th>
                <th className="px-5 py-3.5">اسم الباقة</th>
                <th className="px-5 py-3.5">نوع الباقة</th>
                <th className="px-5 py-3.5">الكابتن المخصص</th>
                <th className="px-5 py-3.5">السعر</th>
                <th className="px-5 py-3.5">المدة</th>
                <th className="px-5 py-3.5">المميزات</th>
                <th className="px-5 py-3.5 text-center">الحالة</th>
                <th className="px-5 py-3.5 text-left">إجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60">
              {loading && packages.length === 0 ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-8 bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-zinc-800 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-36 bg-zinc-800/60 rounded" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-6 w-14 bg-zinc-800 rounded-full mx-auto" /></td>
                    <td className="px-5 py-4 text-left"><div className="h-7 w-20 bg-zinc-800 rounded-xl mr-auto" /></td>
                  </tr>
                ))
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-gold-glow">
                      <Crown className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-white mb-1">
                      {hasActiveFilters ? 'لا توجد باقات تطابق الفلاتر المحددة' : 'لا توجد باقات مسجلة في النظام بعد!'}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                      {hasActiveFilters
                        ? 'جرّب تغيير فلاتر النوع أو الكابتن أو الحالة أو مسح حقل البحث.'
                        : 'ابدأ بإنشاء أول باقة اشتراك رياضية لصالة WOLVES لتظهر للأعضاء.'}
                    </p>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-500/40 text-xs font-bold text-zinc-200 transition-all cursor-pointer"
                      >
                        مسح كافة الفلاتر
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow hover:scale-105 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة أول باقة</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => {
                  const isToggling = togglingId === pkg.id;
                  const typeMeta = getPackageTypeMeta(pkg.type);
                  const trainerName = getTrainerName(pkg.trainerId);

                  return (
                    <tr
                      key={pkg.id}
                      className="hover:bg-zinc-900/60 transition-colors group"
                    >
                      {/* ID */}
                      <td className="px-5 py-4 font-mono font-bold text-amber-400">
                        #{pkg.id}
                      </td>

                      {/* Name */}
                      <td className="px-5 py-4 font-black text-white text-sm">
                        <div className="flex items-center gap-2">
                          <span>{pkg.name}</span>
                          {pkg.isPopular && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              الأكثر طلباً
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${typeMeta.badgeColor}`}>
                          <span>{typeMeta.label}</span>
                        </span>
                      </td>

                      {/* Assigned Trainer */}
                      <td className="px-5 py-4 text-xs">
                        {Number(pkg.type) === PACKAGE_TYPES.PRIVATE ? (
                          trainerName ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{trainerName}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-500">غير محدد (#{pkg.trainerId})</span>
                          )
                        ) : Number(pkg.type) === PACKAGE_TYPES.SHARED_PRIVATE ? (
                          <span className="text-purple-400/90 text-[11px] font-semibold">
                            مشتركة (يحدده العضو)
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">بدون كابتن خاص</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 font-mono font-black text-amber-300 text-sm">
                        {Number(pkg.price).toLocaleString('ar-EG')} <span className="text-[10px] text-zinc-400 font-normal">ج.م</span>
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-4 font-mono">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{pkg.duration} يوماً</span>
                        </span>
                      </td>

                      {/* Description Preview */}
                      <td className="px-5 py-4 max-w-xs truncate text-zinc-400 text-[11px]" title={pkg.description}>
                        {pkg.description ? pkg.description.replace(/[\n\r]+/g, ' • ') : '—'}
                      </td>

                      {/* Active Status Toggle Switch (Status Toggle) */}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex flex-col items-center justify-center gap-1">
                          <button
                            type="button"
                            dir="ltr"
                            disabled={isToggling}
                            onClick={() => handleToggleStatus(pkg)}
                            aria-label={`تغيير حالة باقة ${pkg.name}`}
                            className={`relative inline-flex h-6 w-11 shrink-0 p-0.5 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-50 ${
                              pkg.isActive !== false ? 'bg-purple-600 hover:bg-purple-500' : 'bg-zinc-700 hover:bg-zinc-600'
                            }`}
                            title={pkg.isActive !== false ? 'الباقة نشطة (اضغط لإيقافها)' : 'الباقة معطلة (اضغط لتنشيطها)'}
                          >
                            <span
                              className={`pointer-events-none inline-flex items-center justify-center h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                                pkg.isActive !== false ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            >
                              {isToggling && (
                                <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />
                              )}
                            </span>
                          </button>
                          <span className={`text-[10px] font-bold ${pkg.isActive !== false ? 'text-purple-400' : 'text-zinc-500'}`}>
                            {pkg.isActive !== false ? 'نشطة' : 'معطلة'}
                          </span>
                        </div>
                      </td>

                      {/* Quick Actions */}
                      <td className="px-5 py-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(pkg)}
                            className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-amber-300 hover:bg-zinc-800 border border-white/10 transition-colors cursor-pointer"
                            title="تعديل بيانات الباقة"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* View Details Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailsPackage(pkg)}
                            className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-white/10 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="معاينة تفاصيل الباقة"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

        {/* Mobile Cards View (< md) */}
        <div className="md:hidden divide-y divide-zinc-800/80 p-3 sm:p-4 space-y-3">
          {loading && packages.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 font-bold">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin mx-auto mb-2" />
              جاري تحميل الباقات...
            </div>
          ) : packages.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 text-xs">
              {hasActiveFilters ? 'لا توجد باقات تطابق الفلاتر المحددة.' : 'لا توجد باقات حالياً. انقر على "+ إضافة باقة جديدة".'}
            </div>
          ) : (
            packages.map((pkg) => {
              const isToggling = togglingId === pkg.id;
              const typeMeta = getPackageTypeMeta(pkg.type);
              const trainerName = getTrainerName(pkg.trainerId);

              return (
                <div key={pkg.id} className="bg-[#141417] rounded-xl p-4 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 font-mono text-xs font-bold">
                        #{pkg.id}
                      </span>
                      <h4 className="font-bold text-white text-sm">{pkg.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        dir="ltr"
                        disabled={isToggling}
                        onClick={() => handleToggleStatus(pkg)}
                        className={`relative inline-flex h-5 w-9 shrink-0 p-0.5 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                          pkg.isActive !== false ? 'bg-purple-600' : 'bg-zinc-700'
                        }`}
                        title={pkg.isActive !== false ? 'إيقاف الباقة' : 'تنشيط الباقة'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                            pkg.isActive !== false ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className={`text-[10px] font-bold ${pkg.isActive !== false ? 'text-purple-400' : 'text-zinc-500'}`}>
                        {pkg.isActive !== false ? 'نشطة' : 'معطلة'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeMeta.badgeColor}`}>
                      {typeMeta.label}
                    </span>
                    {trainerName && (
                      <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        <span>{trainerName}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs bg-zinc-900/60 p-2.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">السعر:</span>
                      <span className="text-amber-300 font-mono text-sm font-bold">
                        {Number(pkg.price).toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">المدة:</span>
                      <span className="text-zinc-300 font-mono text-xs">
                        {pkg.duration} يوماً
                      </span>
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-[11px] text-zinc-400 line-clamp-2">
                      {pkg.description.replace(/[\n\r]+/g, ' • ')}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggleStatus(pkg)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                        pkg.isActive !== false
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                      }`}
                    >
                      <Power className={`w-3.5 h-3.5 ${isToggling ? 'animate-spin' : ''}`} />
                      <span>{pkg.isActive !== false ? 'نشطة (إيقاف)' : 'معطلة (تنشيط)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(pkg)}
                      className="flex-1 py-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDetailsPackage(pkg)}
                      className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-white/10 transition-colors"
                      title="تفاصيل"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        <div className="bg-zinc-950/90 px-5 py-3.5 border-t border-amber-500/15 flex items-center justify-between text-xs text-zinc-400">
          <div>
            إجمالي الباقات: <span className="font-bold text-white font-mono">{totalCount}</span> باقة
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageNumber <= 1 || loading}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="font-mono text-xs px-2 font-bold text-zinc-200">
              {pageNumber} / {totalPages}
            </span>

            <button
              type="button"
              disabled={pageNumber >= totalPages || loading}
              onClick={() => setPageNumber((p) => p + 1)}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Package Form Modal (Add / Edit with PATCH) */}
      <PackageFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        packageToEdit={packageToEdit}
        onSuccess={fetchPackages}
      />

      {/* Package Quick Details Drawer / Modal */}
      <AnimatePresence>
        {selectedDetailsPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121216] border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setSelectedDetailsPackage(null)}
                className="absolute left-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-mono font-bold">
                  #{selectedDetailsPackage.id}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{selectedDetailsPackage.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPackageTypeMeta(selectedDetailsPackage.type).badgeColor}`}>
                      {getPackageTypeMeta(selectedDetailsPackage.type).label}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {selectedDetailsPackage.duration} يوماً • {Number(selectedDetailsPackage.price).toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {Number(selectedDetailsPackage.type) === PACKAGE_TYPES.PRIVATE && selectedDetailsPackage.trainerId && (
                <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-300">
                  <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    الكابتن المخصص: <strong className="text-white">{getTrainerName(selectedDetailsPackage.trainerId) || `كابتن #${selectedDetailsPackage.trainerId}`}</strong>
                  </span>
                </div>
              )}

              <div className="space-y-3 py-3 border-y border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-500 block mb-1 font-bold">قائمة المميزات:</span>
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-zinc-300 whitespace-pre-line leading-relaxed font-mono">
                    {selectedDetailsPackage.description || 'لا يوجد وصف مسجل'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-zinc-500 font-bold">حالة الباقة:</span>
                  <span className={selectedDetailsPackage.isActive !== false ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {selectedDetailsPackage.isActive !== false ? 'مفعلة وتظهر للمشتركين' : 'متوقفة حالياً'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = selectedDetailsPackage;
                    setSelectedDetailsPackage(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>تعديل الباقة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDetailsPackage(null)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PackagesAdminManagement;
