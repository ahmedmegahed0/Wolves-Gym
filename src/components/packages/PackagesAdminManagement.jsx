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
  X
} from 'lucide-react';
import { packageService } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import PackageFormModal from './PackageFormModal';

/**
 * PackagesAdminManagement Component
 * Comprehensive management dashboard and data table for SuperAdmin and Manager
 * Handles GET /api/Packages/management, status toggles, edits, and creation.
 */
export const PackagesAdminManagement = ({ onBackToPublicGrid, isEmbedded = false }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  
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

  // Fetch Management Packages
  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await packageService.getManagementPackages({
        pageNumber,
        pageSize,
        search,
        sortBy,
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
  }, [pageNumber, pageSize, search, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPackages();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchPackages]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPackages();
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

  // Calculate Metrics
  const activeCount = packages.filter((p) => p.isActive !== false).length;
  const inactiveCount = packages.filter((p) => p.isActive === false).length;
  const avgPrice = packages.length > 0 
    ? Math.round(packages.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / packages.length)
    : 0;

  return (
    <div dir="rtl" className="w-full space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-amber-500/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              صلاحيات المدير والأدمن
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            <span>لوحة إدارة باقات واشتراكات الجيم</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            تحكم كامل في إنشاء وتعديل وتفعيل خطط التدريب والأسعار والمدد الزمنية
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onBackToPublicGrid && (
            <button
              type="button"
              onClick={onBackToPublicGrid}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold transition-all cursor-pointer"
            >
              عرض كروت العملاء
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة باقة جديدة</span>
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Packages */}
        <div className="bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-zinc-400 block truncate">إجمالي الباقات</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{totalCount}</span>
          </div>
        </div>

        {/* Active Packages */}
        <div className="bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-emerald-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-zinc-400 block truncate">باقات نشطة حالياً</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{activeCount}</span>
          </div>
        </div>

        {/* Inactive Packages */}
        <div className="bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-rose-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-zinc-400 block truncate">باقات متوقفة</span>
            <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">{inactiveCount}</span>
          </div>
        </div>

        {/* Average Price */}
        <div className="bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-zinc-400 block truncate">متوسط الأسعار</span>
            <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">
              {avgPrice.toLocaleString('ar-EG')} <span className="text-[10px] text-zinc-400 font-normal">ج.م</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950/90 border border-amber-500/15 rounded-2xl p-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }}
            placeholder="بحث عن باقة باسم أو تفاصيل..."
            className="w-full pr-10 pl-8 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Refresh & Page Size */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPageNumber(1); }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/40 cursor-pointer"
          >
            <option value="5">5 باقات / صفحة</option>
            <option value="10">10 باقات / صفحة</option>
            <option value="20">20 باقة / صفحة</option>
          </select>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-zinc-900 text-amber-400 border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-[#0e0e11] border border-amber-500/20 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-zinc-300">
            <thead className="bg-zinc-950/90 text-zinc-400 font-bold border-b border-amber-500/15 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">#ID</th>
                <th className="px-5 py-3.5">اسم الباقة</th>
                <th className="px-5 py-3.5">السعر</th>
                <th className="px-5 py-3.5">المدة</th>
                <th className="px-5 py-3.5">المميزات</th>
                <th className="px-5 py-3.5 text-center">الحالة</th>
                <th className="px-5 py-3.5 text-left">إجراءات سريعة</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60">
              {loading && packages.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center text-zinc-400 font-bold">
                    <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin mx-auto mb-2" />
                    جاري تحميل جدول باقات الإدارة...
                  </td>
                </tr>
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-zinc-500">
                    لا توجد باقات حالياً. انقر على "+ إضافة باقة جديدة" لإنشاء أول باقة!
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => {
                  const isToggling = togglingId === pkg.id;
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

                      {/* Active Status Badge */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                            pkg.isActive !== false
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              pkg.isActive !== false ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                            }`}
                          />
                          <span>{pkg.isActive !== false ? 'نشط' : 'متوقف'}</span>
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="px-5 py-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Switch Button */}
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handleToggleStatus(pkg)}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              pkg.isActive !== false
                                ? 'bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                            }`}
                            title={pkg.isActive !== false ? 'إيقاف الباقة مؤقتاً' : 'تنشيط الباقة'}
                          >
                            <Power className={`w-3.5 h-3.5 ${isToggling ? 'animate-spin' : ''}`} />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(pkg)}
                            className="p-2 rounded-xl bg-zinc-900 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/30 transition-all cursor-pointer"
                            title="تعديل بيانات الباقة"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* View Details Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailsPackage(pkg)}
                            className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-all cursor-pointer"
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

      {/* Package Form Modal (Add / Edit) */}
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
                  <span className="text-xs text-zinc-400 font-mono">
                    {selectedDetailsPackage.duration} يوماً • {Number(selectedDetailsPackage.price).toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>

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
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>تعديل الباقة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDetailsPackage(null)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-bold hover:bg-zinc-800"
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
