import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  Snowflake, 
  PlayCircle, 
  AlertTriangle, 
  FileText, 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  Crown, 
  Dumbbell, 
  CreditCard, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  Layers,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Banknote
} from 'lucide-react';
import { 
  subscriptionsService, 
  SUBSCRIPTION_STATUS, 
  getSubscriptionStatusMeta, 
  getPaymentMethodMeta, 
  formatCurrency 
} from '../../services/subscriptionsService';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import FreezeSubscriptionModal from './FreezeSubscriptionModal';
import UnfreezeModal from './UnfreezeModal';
import CancelSubscriptionModal from './CancelSubscriptionModal';
import SubscriptionDetailsModal from './SubscriptionDetailsModal';
import CreateSubscriptionModal from './CreateSubscriptionModal';

/**
 * SubscriptionsManagementTable Component
 * Complete Lifecycle management data table with conditional smart actions, filters, search, and details modal.
 */
export const SubscriptionsManagementTable = ({ 
  onOpenNewSubscription = null,
  isEmbedded = false 
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 1 | 2 | 3 | 4 | 5
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('');

  // Modals state
  const [selectedSubForDetails, setSelectedSubForDetails] = useState(null);
  const [selectedSubForFreeze, setSelectedSubForFreeze] = useState(null);
  const [selectedSubForUnfreeze, setSelectedSubForUnfreeze] = useState(null);
  const [selectedSubForCancel, setSelectedSubForCancel] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch subscriptions from service
  const fetchSubscriptions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await subscriptionsService.getSubscriptions({
        Status: statusFilter,
        Search: debouncedSearch,
        PageNumber: pageNumber,
        PageSize: pageSize,
        SortBy: sortBy
      });

      setSubscriptions(res.items || []);
      setTotalCount(res.totalCount || (res.items || []).length);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      toastError(err.friendlyMessage || 'تعذر تحميل قائمة الاشتراكات.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, debouncedSearch, pageNumber, pageSize, sortBy, toastError]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Reset page when filter or search changes
  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch, statusFilter]);

  // Handle local state updates after modal operations
  const handleItemUpdated = (updatedSub) => {
    setSubscriptions((prev) => 
      prev.map((item) => (String(item.id) === String(updatedSub.id) ? { ...item, ...updatedSub } : item))
    );
  };

  const handleOpenNewSub = onOpenNewSubscription || (() => setIsCreateModalOpen(true));

  // Compute stats on current list
  const activeCount = subscriptions.filter(s => Number(s.status) === 1 || String(s.status).toLowerCase() === 'active').length;
  const frozenCount = subscriptions.filter(s => Number(s.status) === 2 || String(s.status).toLowerCase() === 'frozen').length;
  const expiredOrCancelledCount = subscriptions.filter(s => [3, 4].includes(Number(s.status))).length;

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div dir="rtl" className="w-full space-y-6 font-cairo">
      {/* Top Header & Actions Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-3xl bg-[#141417] border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>إدارة الاشتراكات والعضويات</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {totalCount.toLocaleString('ar-EG')} اشتراك
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              متابعة دورة حياة العضوية، التجميد، الاستئناف، والإلغاء
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchSubscriptions(true)}
            disabled={refreshing || loading}
            className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-white/5 transition-colors disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenNewSub}
            className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>تسجيل اشتراك جديد</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#141417] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 block">إجمالي الاشتراكات</span>
            <span className="text-xl font-black text-white font-mono">{totalCount}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-zinc-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141417] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 block">اشتراكات نشطة</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{activeCount}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141417] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-cyan-400 block">اشتراكات مجمدة</span>
            <span className="text-xl font-black text-cyan-400 font-mono">{frozenCount}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Snowflake className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141417] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-400 block">ملغاة أو منتهية</span>
            <span className="text-xl font-black text-rose-400 font-mono">{expiredOrCancelledCount}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#141417] border border-white/5">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ابحث باسم العضو، كود العضوية، الهاتف، أو اسم الباقة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-bold whitespace-nowrap">الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0c0c0e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-colors"
          >
            <option value="all">كل الحالات</option>
            <option value="1">نشط (Active)</option>
            <option value="2">مجمد (Frozen)</option>
            <option value="3">منتهي (Expired)</option>
            <option value="4">ملغي (Cancelled)</option>
            <option value="5">قيد الانتظار (Pending)</option>
          </select>
        </div>
      </div>

      {/* Main Table / Mobile Cards */}
      <div className="rounded-3xl bg-[#141417] border border-white/10 overflow-hidden shadow-2xl">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#0c0c0e]/60 text-zinc-400 font-bold">
                <th className="p-4">العضو والمشترك</th>
                <th className="p-4">الباقة والرسوم</th>
                <th className="p-4">المدرب الخاص</th>
                <th className="p-4">الصلاحية والتوقيت</th>
                <th className="p-4">طريقة الدفع</th>
                <th className="p-4 text-center">الحالة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span>جاري تحميل بيانات الاشتراكات...</span>
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    لا توجد اشتراكات مطابقة للبحث أو الفلتر المحدد.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const statusMeta = getSubscriptionStatusMeta(sub.status);
                  const paymentMeta = getPaymentMethodMeta(sub.paymentMethod);
                  const isStatusActive = Number(sub.status) === 1 || String(sub.status).toLowerCase() === 'active';
                  const isStatusFrozen = Number(sub.status) === 2 || String(sub.status).toLowerCase() === 'frozen';

                  const customerName = sub.customerName || sub.customer?.name || `عضو #${sub.customerId}`;
                  const customerPhone = sub.customerPhone || sub.customer?.phoneNumber || '-';
                  const customerCode = sub.customerCode || sub.customer?.code || `#${sub.customerId}`;

                  const packageName = sub.packageName || sub.package?.name || `باقة #${sub.packageId}`;
                  const packagePrice = sub.packagePrice ?? sub.package?.price ?? sub.price ?? 0;
                  const trainerName = sub.trainerName || sub.trainer?.name;

                  const startDate = sub.startDate || sub.createdAt;
                  const endDate = sub.endDate || sub.expiresAt;

                  return (
                    <tr 
                      key={sub.id} 
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Customer Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-amber-300 transition-colors">
                              {customerName}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono" dir="ltr">
                              <span>{customerPhone}</span>
                              <span className="text-zinc-600">|</span>
                              <span className="text-zinc-500">{customerCode}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Package Info */}
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-zinc-200">{packageName}</p>
                          <p className="text-[11px] font-mono font-black text-emerald-400">
                            {formatCurrency(packagePrice)}
                          </p>
                        </div>
                      </td>

                      {/* Trainer */}
                      <td className="p-4">
                        {trainerName ? (
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-semibold">{trainerName}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">بدون مدرب خاص</span>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="p-4">
                        <div className="font-mono text-[11px] space-y-0.5">
                          <p className="text-zinc-400">
                            من: <span className="text-zinc-200">{startDate ? new Date(startDate).toLocaleDateString('ar-EG') : '-'}</span>
                          </p>
                          <p className="text-zinc-400">
                            إلى: <span className="text-zinc-200">{endDate ? new Date(endDate).toLocaleDateString('ar-EG') : '-'}</span>
                          </p>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-white/5 text-[11px] text-zinc-300 font-medium">
                          <Banknote className="w-3 h-3 text-amber-400" />
                          <span>{paymentMeta.label.split('(')[0].trim()}</span>
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${statusMeta.badge}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{statusMeta.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Details Button - Always available */}
                          <button
                            type="button"
                            onClick={() => setSelectedSubForDetails(sub)}
                            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 transition-colors"
                            title="تفاصيل الاشتراك"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Conditional Actions */}
                          {isStatusActive && (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedSubForFreeze(sub)}
                                className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-colors"
                                title="تجميد الاشتراك"
                              >
                                <Snowflake className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedSubForCancel(sub)}
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                                title="إلغاء الاشتراك"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {isStatusFrozen && (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedSubForUnfreeze(sub)}
                                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                                title="إلغاء التجميد واستئناف العضوية"
                              >
                                <PlayCircle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedSubForCancel(sub)}
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                                title="إلغاء الاشتراك"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="block lg:hidden divide-y divide-white/5">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">
              <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>جاري التحميل...</span>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">لا توجد اشتراكات مسجلة.</div>
          ) : (
            subscriptions.map((sub) => {
              const statusMeta = getSubscriptionStatusMeta(sub.status);
              const paymentMeta = getPaymentMethodMeta(sub.paymentMethod);
              const isStatusActive = Number(sub.status) === 1 || String(sub.status).toLowerCase() === 'active';
              const isStatusFrozen = Number(sub.status) === 2 || String(sub.status).toLowerCase() === 'frozen';

              const customerName = sub.customerName || sub.customer?.name || `عضو #${sub.customerId}`;
              const packageName = sub.packageName || sub.package?.name || `باقة #${sub.packageId}`;
              const packagePrice = sub.packagePrice ?? sub.package?.price ?? sub.price ?? 0;

              return (
                <div key={sub.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{customerName}</h4>
                      <p className="text-xs text-amber-400 font-bold">{packageName}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.badge}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-white/5">
                    <span className="font-mono font-bold text-emerald-400">{formatCurrency(packagePrice)}</span>
                    <span>{paymentMeta.label.split('(')[0].trim()}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSubForDetails(sub)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-xs text-zinc-300 font-bold flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>تفاصيل</span>
                    </button>

                    {isStatusActive && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedSubForFreeze(sub)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 font-bold flex items-center gap-1"
                        >
                          <Snowflake className="w-3.5 h-3.5" />
                          <span>تجميد</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSubForCancel(sub)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-bold flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>إلغاء</span>
                        </button>
                      </>
                    )}

                    {isStatusFrozen && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedSubForUnfreeze(sub)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold flex items-center gap-1"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>استئناف</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSubForCancel(sub)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-bold flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>إلغاء</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 bg-[#0c0c0e]/60 flex items-center justify-between text-xs text-zinc-400">
            <div>
              صفحة <span className="font-mono text-white font-bold">{pageNumber}</span> من{' '}
              <span className="font-mono text-white font-bold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={pageNumber === 1}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                disabled={pageNumber >= totalPages}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modals */}
      <FreezeSubscriptionModal
        isOpen={Boolean(selectedSubForFreeze)}
        subscription={selectedSubForFreeze}
        onClose={() => setSelectedSubForFreeze(null)}
        onSuccess={handleItemUpdated}
      />

      <UnfreezeModal
        isOpen={Boolean(selectedSubForUnfreeze)}
        subscription={selectedSubForUnfreeze}
        onClose={() => setSelectedSubForUnfreeze(null)}
        onSuccess={handleItemUpdated}
      />

      <CancelSubscriptionModal
        isOpen={Boolean(selectedSubForCancel)}
        subscription={selectedSubForCancel}
        onClose={() => setSelectedSubForCancel(null)}
        onSuccess={handleItemUpdated}
      />

      <SubscriptionDetailsModal
        isOpen={Boolean(selectedSubForDetails)}
        subscription={selectedSubForDetails}
        onClose={() => setSelectedSubForDetails(null)}
        onOpenFreeze={(sub) => setSelectedSubForFreeze(sub)}
        onOpenUnfreeze={(sub) => setSelectedSubForUnfreeze(sub)}
        onOpenCancel={(sub) => setSelectedSubForCancel(sub)}
      />

      <CreateSubscriptionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchSubscriptions(true)}
      />
    </div>
  );
};

export default SubscriptionsManagementTable;
