import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  ShieldCheck, 
  Edit3, 
  Check, 
  X, 
  RotateCw, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  Flame, 
  Scale, 
  Phone, 
  QrCode, 
  Loader2,
  Sparkles,
  Info,
  Crown,
  Plus
} from 'lucide-react';
import { customerService } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import ApprovalBadge from './ApprovalBadge';
import CustomerFilterTabs from './CustomerFilterTabs';
import CustomerEditModal from './CustomerEditModal';

export const CustomersList = ({ onOpenNewSubscription = null }) => {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  // Filters & Pagination State
  const [activeTab, setActiveTab] = useState('0'); // '0' = Pending by default
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data & Loading State
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabCounts, setTabCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });

  // Modals & Action States
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectConfirmModal, setRejectConfirmModal] = useState({ isOpen: false, customer: null });

  // Fetch Tab Counts (Only fetched once on mount and after mutations, NEVER on every filter/search keystroke)
  const fetchTabCounts = useCallback(async () => {
    try {
      const allRes = await customerService.getCustomers({ pageSize: 1000 });
      const allItems = allRes.items || [];
      setTabCounts({
        all: allItems.length,
        pending: allItems.filter((c) => Number(c.approvalStatus) === 0).length,
        approved: allItems.filter((c) => Number(c.approvalStatus) === 1).length,
        rejected: allItems.filter((c) => Number(c.approvalStatus) === 2).length,
      });
    } catch (countErr) {
      console.warn('Could not load tab counts:', countErr);
    }
  }, []);

  // Fetch Customers Data with AbortSignal
  const fetchCustomers = useCallback(async (isManualRefresh = false, signal = null) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const approvalParam = activeTab === 'all' ? undefined : Number(activeTab);
      const result = await customerService.getCustomers({
        approvalStatus: approvalParam,
        pageNumber,
        pageSize,
        search: searchQuery,
        sortBy,
        signal,
      });

      setCustomers(result.items || []);
      setTotalCount(result.totalCount || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return; // Safely ignore aborted request
      }
      console.error('Error fetching customers:', err);
      toastError(
        'تعذر تحميل بيانات المشتركين',
        err.friendlyMessage || 'تأكد من الاتصال بالسيرفر وحاول مجدداً.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, pageNumber, pageSize, searchQuery, sortBy, toastError]);

  // Initial & Dependency Fetch with in-flight cancellation
  useEffect(() => {
    const controller = new AbortController();
    fetchCustomers(false, controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchCustomers]);

  // Fetch tab counts once on mount
  useEffect(() => {
    fetchTabCounts();
  }, [fetchTabCounts]);

  // Tab change resets page to 1
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    setPageNumber(1);
  }, []);

  // Search change resets page to 1
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    setPageNumber(1);
  }, []);

  // 1. APPROVE MEMBER ACTION (PATCH status: 1)
  const handleApprove = async (customer) => {
    setActionLoadingId(customer.id);
    try {
      await customerService.updateApprovalStatus(customer.id, 1);
      toastSuccess(
        'تم قبول العضو بنجاح.. جاهز للتمرين! 🐺',
        `تم تفعيل اشتراك الكابتن (${customer.name}) وأصبح عضواً نشطاً في الجيم.`
      );
      fetchCustomers();
      fetchTabCounts();
    } catch (err) {
      console.error('Approve member error:', err);
      toastError('فشل قبول العضو', err.friendlyMessage || 'تعذر تغيير حالة الاشتراك.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. REJECT MEMBER ACTION (PATCH status: 2 with Confirmation)
  const handleConfirmReject = async () => {
    const customer = rejectConfirmModal.customer;
    if (!customer) return;

    setActionLoadingId(customer.id);
    setRejectConfirmModal({ isOpen: false, customer: null });

    try {
      await customerService.updateApprovalStatus(customer.id, 2);
      toastInfo(
        'تم رفض طلب الاشتراك',
        `تم نقل طلب العضو (${customer.name}) إلى قائمة الاشتراكات المرفوضة.`
      );
      fetchCustomers();
      fetchTabCounts();
    } catch (err) {
      console.error('Reject member error:', err);
      toastError('فشل رفض العضو', err.friendlyMessage || 'تعذر تحديث حالة الاشتراك.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. MEMBER UPDATED HANDLER
  const handleCustomerUpdated = (updated) => {
    setCustomers((prev) =>
      prev.map((c) => (String(c.id) === String(updated.id) ? updated : c))
    );
    fetchCustomers();
    fetchTabCounts();
  };

  return (
    <div className="space-y-4 sm:space-y-6 font-cairo">
      {/* Top Banner & Quick Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121215] rounded-2xl p-4 sm:p-5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-amber-400">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              سجل الأعضاء والاشتراكات
              <span className="text-[10px] font-mono bg-white/5 text-zinc-400 border border-white/10 px-2 py-0.5 rounded-md font-semibold">
                MEMBERS
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              متابعة المشتركين، طلبات العضوية، وتحديث الحسابات
            </p>
          </div>
        </div>

        {/* Quick Actions & Refresh */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {onOpenNewSubscription && (
            <button
              type="button"
              onClick={() => onOpenNewSubscription()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600/90 to-yellow-600/90 hover:from-amber-500 hover:to-yellow-500 text-black text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>اشتراك جديد</span>
            </button>
          )}

          <button
            onClick={() => {
              fetchCustomers(true);
              fetchTabCounts();
            }}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#16161a] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-colors disabled:opacity-50"
            title="تحديث قائمة المشتركين"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#121215] rounded-2xl p-3.5 sm:p-4 border border-white/10">
        <CustomerFilterTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortBy={sortBy}
          onSortChange={setSortBy}
          counts={tabCounts}
        />
      </div>

      {/* Main Table / Card View Container */}
      <div className="wolf-glass rounded-3xl border border-amber-500/20 overflow-hidden shadow-2xl">
        {/* Table Content */}
        {loading ? (
          // Loading Skeleton
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-zinc-900/60 rounded-2xl animate-pulse border border-zinc-800/80 flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800" />
                  <div className="space-y-2">
                    <div className="h-3.5 w-32 bg-zinc-800 rounded" />
                    <div className="h-2.5 w-24 bg-zinc-800 rounded" />
                  </div>
                </div>
                <div className="h-8 w-24 bg-zinc-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          // Empty State
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-zinc-900/90 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              {activeTab === '0' ? (
                <Clock className="w-8 h-8" />
              ) : activeTab === '2' ? (
                <UserX className="w-8 h-8 text-rose-400" />
              ) : (
                <Users className="w-8 h-8" />
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">
              {activeTab === '0'
                ? 'مفيش طلبات اشتراك معلقة دلوقتي! 🐺'
                : activeTab === '2'
                ? 'مفيش أي اشتراكات مرفوضة'
                : 'لم يتم العثور على أي مشتركين'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
              {activeTab === '0'
                ? 'كل طلبات الاشتراك تم البت فيها وقبولها. جاهزون لاستقبال وحوش جدد في أي وقت!'
                : searchQuery
                ? 'جرب البحث بكلمات أخرى أو مسح شريط البحث لرؤية المشتركين.'
                : 'ابدأ بقبول الأعضاء الجدد أو تسجيل مشتركين جدد في الجيم.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto gold-scrollbar">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-black/60 border-b border-zinc-800/80 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="py-4 px-5">كود الوحش</th>
                    <th className="py-4 px-5">اسم العضو وبياناته</th>
                    <th className="py-4 px-5">القياسات البدنية</th>
                    <th className="py-4 px-5">عضل / دهون</th>
                    <th className="py-4 px-5">حالة الاشتراك</th>
                    <th className="py-4 px-5 text-center">إجراءات سريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {customers.map((c) => {
                    const isProcessing = actionLoadingId === c.id;
                    const heightM = Number(c.height) / 100;
                    const bmi =
                      heightM > 0 && Number(c.weight) > 0
                        ? (Number(c.weight) / (heightM * heightM)).toFixed(1)
                        : null;

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-zinc-900/50 transition-colors group"
                      >
                        {/* Member Code */}
                        <td className="py-4 px-5">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/80 border border-amber-500/30 font-mono text-amber-400 font-bold shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                            <QrCode className="w-3.5 h-3.5" />
                            <span>{c.code || `ID-${c.id}`}</span>
                          </div>
                        </td>

                        {/* Name & Phone */}
                        <td className="py-4 px-5">
                          <div>
                            <div className="font-black text-white text-sm group-hover:text-amber-400 transition-colors">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5 font-mono">
                              <Phone className="w-3 h-3 text-zinc-500" />
                              <span dir="ltr">{c.phoneNumber || 'بدون هاتف'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Physical Specs */}
                        <td className="py-4 px-5">
                          <div className="space-y-0.5 text-zinc-300 font-mono">
                            <div className="flex items-center gap-1.5">
                              <Scale className="w-3 h-3 text-amber-400" />
                              <span>{c.weight ? `${c.weight} كجم` : '--'}</span>
                              <span className="text-zinc-600">/</span>
                              <span>{c.height ? `${c.height} سم` : '--'}</span>
                            </div>
                            {bmi && (
                              <div className="text-[10px] text-zinc-500 font-cairo">
                                مؤشر BMI: <span className="text-amber-400/90 font-bold font-mono">{bmi}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Muscle / Fat % */}
                        <td className="py-4 px-5">
                          <div className="space-y-1 font-mono">
                            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                              <Flame className="w-3 h-3" />
                              <span>عضل: {c.musclePercentage ? `${c.musclePercentage}%` : '--'}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              دهون: {c.fatPercentage ? `${c.fatPercentage}%` : '--'}
                            </div>
                          </div>
                        </td>

                        {/* Approval Badge */}
                        <td className="py-4 px-5">
                          <ApprovalBadge status={c.approvalStatus} />
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Subscribe to Package Button */}
                            {onOpenNewSubscription && (
                              <button
                                type="button"
                                onClick={() => onOpenNewSubscription(c)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1 hover:scale-105 active:scale-95"
                                title="تسجيل أو تجديد اشتراك في باقة تدريب لهذا العضو"
                              >
                                <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:text-black" />
                                <span>اشتراك باقة</span>
                              </button>
                            )}

                            {/* Accept button for pending/rejected */}
                            {Number(c.approvalStatus) !== 1 && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleApprove(c)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/40 text-xs font-black transition-all flex items-center gap-1 hover:scale-105 active:scale-95 disabled:opacity-50"
                                title="قبول وتفعيل العضوية فوراً"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>تفعيل الاشتراك</span>
                              </button>
                            )}

                            {/* Reject button for pending/approved */}
                            {Number(c.approvalStatus) !== 2 && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => setRejectConfirmModal({ isOpen: true, customer: c })}
                                className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/40 transition-all"
                                title="رفض طلب الاشتراك"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit Modal Trigger */}
                            <button
                              type="button"
                              onClick={() => setEditingCustomer(c)}
                              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                              title="تعديل القياسات والملف الرياضي"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                              <span>تعديل</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Responsive Cards View */}
            <div className="lg:hidden divide-y divide-zinc-800/80 p-3 sm:p-4 space-y-3">
              {customers.map((c) => {
                const isProcessing = actionLoadingId === c.id;

                return (
                  <div
                    key={c.id}
                    className="bg-black/60 rounded-2xl p-4 border border-zinc-800/80 space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-xl bg-black border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                          {c.code || `ID-${c.id}`}
                        </div>
                        <h4 className="font-black text-white text-sm">{c.name}</h4>
                      </div>
                      <ApprovalBadge status={c.approvalStatus} size="sm" />
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/50">
                      <div>
                        <span className="text-zinc-500 text-[10px] block">الهاتف:</span>
                        <span className="text-zinc-200 font-mono text-xs" dir="ltr">
                          {c.phoneNumber || 'لا يوجد'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block">الوزن / الطول:</span>
                        <span className="text-zinc-200 font-mono text-xs">
                          {c.weight || '--'} kg / {c.height || '--'} cm
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block">نسبة العضلات:</span>
                        <span className="text-amber-400 font-mono text-xs font-bold">
                          {c.musclePercentage ? `${c.musclePercentage}%` : '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block">نسبة الدهون:</span>
                        <span className="text-zinc-400 font-mono text-xs">
                          {c.fatPercentage ? `${c.fatPercentage}%` : '--'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {onOpenNewSubscription && (
                        <button
                          type="button"
                          onClick={() => onOpenNewSubscription(c)}
                          className="flex-1 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>اشتراك باقة</span>
                        </button>
                      )}

                      {Number(c.approvalStatus) !== 1 && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(c)}
                          className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/40 text-xs font-black transition-all flex items-center justify-center gap-1 shadow-sm"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>تفعيل</span>
                        </button>
                      )}

                      {Number(c.approvalStatus) !== 2 && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setRejectConfirmModal({ isOpen: true, customer: c })}
                          className="px-3 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-rose-400 border border-zinc-800 text-xs font-bold"
                          title="رفض"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingCustomer(c)}
                        className="flex-1 py-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-amber-400 border border-zinc-800 text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>تعديل</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Dynamic Pagination Footer */}
        {totalCount > 0 && (
          <div className="bg-black/60 px-4 sm:px-6 py-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-zinc-400">
              إظهار{' '}
              <span className="text-amber-400 font-bold font-mono">
                {Math.min(totalCount, (pageNumber - 1) * pageSize + 1)}
              </span>{' '}
              إلى{' '}
              <span className="text-amber-400 font-bold font-mono">
                {Math.min(totalCount, pageNumber * pageSize)}
              </span>{' '}
              من إجمالي{' '}
              <span className="text-white font-bold font-mono">{totalCount}</span> وحش
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              {/* Page size selector */}
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-zinc-500 text-[11px]">في الصفحة:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPageNumber(1);
                  }}
                  aria-label="عدد العناصر في الصفحة"
                  className="bg-zinc-900 text-zinc-300 rounded-lg px-2 py-1 border border-zinc-800 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Prev Button */}
              <button
                disabled={pageNumber <= 1 || loading}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Page Indicators */}
              <div className="flex items-center gap-1 font-mono">
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let pNum = idx + 1;
                  if (totalPages > 5 && pageNumber > 3) {
                    pNum = pageNumber - 2 + idx;
                    if (pNum > totalPages) pNum = totalPages - (4 - idx);
                  }

                  return (
                    <button
                      key={pNum}
                      onClick={() => setPageNumber(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        pageNumber === pNum
                          ? 'bg-amber-500 text-black shadow-gold-glow'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                disabled={pageNumber >= totalPages || loading}
                onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="الصفحة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      <CustomerEditModal
        isOpen={Boolean(editingCustomer)}
        onClose={() => setEditingCustomer(null)}
        customer={editingCustomer}
        onCustomerUpdated={handleCustomerUpdated}
      />

      {/* Rejection Confirmation Modal */}
      <AnimatePresence>
        {rejectConfirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-cairo">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="wolf-glass bg-zinc-950/95 border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">تأكيد رفض طلب الاشتراك</h4>
                  <p className="text-xs text-zinc-400">هذا الإجراء سينقل العضو للمرفوضين</p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 mb-5">
                هل أنت متأكد من رفض طلب اشتراك العضو{' '}
                <span className="text-amber-400 font-bold font-mono">
                  {rejectConfirmModal.customer?.name}
                </span>
                ؟ يمكنك تفعيله لاحقاً في أي وقت إذا تم استيفاء الشروط.
              </p>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectConfirmModal({ isOpen: false, customer: null })}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-800"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white text-xs font-black shadow-lg transition-all"
                >
                  تأكيد الرفض
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomersList;
