import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle, 
  Briefcase, 
  DollarSign, 
  Phone, 
  Mail, 
  Calendar, 
  Power,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  getEmployees, 
  updateEmployee, 
  EMPLOYEE_ROLES 
} from '../../services/employeesService';
import { translateServerErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import CreateEmployeeModal from './CreateEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';

export const EmployeesManagementPage = ({ isEmbedded = false }) => {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 450);
  const [activeFilter, setActiveFilter] = useState(''); // '' | 'true' | 'false'
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  // Reset to first page when search or filter changes
  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch, activeFilter]);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchEmployeesList = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
      };

      if (debouncedSearch.trim()) {
        params.Search = debouncedSearch.trim();
      }

      if (activeFilter === 'true') {
        params.IsActive = true;
      } else if (activeFilter === 'false') {
        params.IsActive = false;
      }

      const res = await getEmployees(params);
      
      // Handle both pagination formats ({ items, totalCount } or array)
      if (res && Array.isArray(res.items)) {
        setEmployees(res.items);
        setTotalCount(res.totalCount || res.items.length);
      } else if (Array.isArray(res)) {
        setEmployees(res);
        setTotalCount(res.length);
      } else if (res && Array.isArray(res.data)) {
        setEmployees(res.data);
        setTotalCount(res.totalCount || res.data.length);
      } else {
        setEmployees([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Fetch employees failed:', err);
      toastError('خطأ في تحميل الموظفين', 'تعذر جلب قائمة الموظفين من الخادم.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize, debouncedSearch, activeFilter, toastError]);

  useEffect(() => {
    fetchEmployeesList();
  }, [fetchEmployeesList]);

  // Handle Quick Toggle Active Status
  const handleToggleStatus = async (emp) => {
    // Prevent self-deactivation if current user is this employee/user
    const isSelf = user && (
      (user.email && emp.email && user.email.toLowerCase() === emp.email.toLowerCase()) ||
      (user.id && (user.id === emp.userId || user.id === emp.id))
    );

    if (isSelf && emp.isActive) {
      toastError('إجراء غير مسموح', 'لا يمكنك تعطيل حسابك الشخصي المسجل به دخول حالياً.');
      return;
    }

    const newStatus = !emp.isActive;
    setTogglingId(emp.id);
    try {
      // Send ONLY isActive when toggling status via PATCH to prevent validation errors on other fields
      await updateEmployee(emp.id, {
        isActive: newStatus,
      });

      // Update locally to avoid full reload
      setEmployees((prev) =>
        prev.map((item) => (item.id === emp.id ? { ...item, isActive: newStatus } : item))
      );

      toastSuccess(
        newStatus ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب',
        `تم ${newStatus ? 'تفعيل' : 'تعطيل'} حساب الموظف (${emp.name}) بنجاح.`
      );
    } catch (err) {
      console.error('Toggle status error:', err);
      const data = err.response?.data;
      let errorMsg = 'تعذر تحديث حالة حساب الموظف.';

      if (data?.errors) {
        if (Array.isArray(data.errors)) {
          errorMsg = data.errors.map((e) => translateServerErrorMessage(e.description || e)).join(' • ');
        } else if (typeof data.errors === 'object') {
          const list = Object.values(data.errors).flat().map(translateServerErrorMessage);
          errorMsg = list.join(' • ');
        }
      } else if (data?.detail || data?.title) {
        errorMsg = translateServerErrorMessage(data.detail || data.title);
      } else if (typeof data === 'string') {
        errorMsg = translateServerErrorMessage(data);
      }

      toastError('فشل تغيير الحالة', errorMsg);
    } finally {
      setTogglingId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Active / Inactive counts
  const activeCount = employees.filter((e) => e.isActive).length;
  const inactiveCount = employees.filter((e) => !e.isActive).length;

  return (
    <div dir="rtl" className={`space-y-6 ${isEmbedded ? '' : 'max-w-7xl mx-auto'}`}>
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c0c0e] border border-white/10 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">إدارة فريق العمل والموظفين</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                  HR Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                إدارة موظفي الاستقبال، مديري العمليات، والإداريين مع التحكم بالصلاحيات والرواتب
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchEmployeesList()}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors disabled:opacity-50"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة موظف جديد</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-[#141417]/80 border border-white/5 flex items-center justify-between">
            <span className="text-xs text-zinc-400">إجمالي الموظفين</span>
            <span className="text-lg font-black text-white font-mono">{totalCount}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#141417]/80 border border-white/5 flex items-center justify-between">
            <span className="text-xs text-zinc-400">حسابات نشطة ومفعلة</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{activeCount}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#141417]/80 border border-white/5 flex items-center justify-between">
            <span className="text-xs text-zinc-400">حسابات معطلة</span>
            <span className="text-lg font-black text-rose-400 font-mono">{inactiveCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/10 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageNumber(1);
            }}
            placeholder="بحث بالاسم أو البريد الإلكتروني..."
            className="w-full pl-4 pr-10 py-2 rounded-xl bg-[#141417] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/50 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141417] border border-white/10 self-stretch md:self-auto">
          <button
            onClick={() => {
              setActiveFilter('');
              setPageNumber(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === '' ? 'bg-amber-400 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            الكل ({totalCount})
          </button>
          <button
            onClick={() => {
              setActiveFilter('true');
              setPageNumber(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'true' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            المفعل فقط
          </button>
          <button
            onClick={() => {
              setActiveFilter('false');
              setPageNumber(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'false' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            المعطل فقط
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-3xl bg-[#0c0c0e] border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#141417] border-b border-white/10 text-xs font-semibold text-zinc-400">
              <tr>
                <th className="py-4 px-5">الموظف</th>
                <th className="py-4 px-5">الدور الوظيفي</th>
                <th className="py-4 px-5">رقم الهاتف</th>
                <th className="py-4 px-5">الراتب الأساسي</th>
                <th className="py-4 px-5">حالة الحساب</th>
                <th className="py-4 px-5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
                    <span>جاري تحميل بيانات الموظفين...</span>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-zinc-400">
                    <Briefcase className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                    <p className="text-base font-bold text-zinc-300">لم يتم العثور على أي موظفين</p>
                    <p className="text-xs text-zinc-500 mt-1">جرّب تغيير كلمات البحث أو أضف موظفاً جديداً</p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const roleInfo = emp.role ? EMPLOYEE_ROLES[emp.role] : null;
                  const isToggling = togglingId === emp.id;
                  const isSelf = user && (
                    (user.email && emp.email && user.email.toLowerCase() === emp.email.toLowerCase()) ||
                    (user.id && (user.id === emp.userId || user.id === emp.id))
                  );

                  return (
                    <tr 
                      key={emp.id} 
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Name & Email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#141417] border border-white/10 flex items-center justify-center font-bold text-amber-400 text-sm">
                            {emp.name ? emp.name.charAt(0).toUpperCase() : 'W'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white text-sm">{emp.name}</p>
                              {isSelf && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-medium">
                                  حسابك
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 font-mono mt-0.5" dir="ltr">
                              {emp.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${roleInfo?.badge || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                          {roleInfo?.name || `رتبة (${emp.role})`}
                        </span>
                      </td>

                      {/* Phone Number */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="text-xs font-mono text-zinc-300" dir="ltr">
                          {emp.phoneNumber || '—'}
                        </span>
                      </td>

                      {/* Salary */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          {emp.salary !== undefined && emp.salary !== null
                            ? `${Number(emp.salary).toLocaleString()} ج.م`
                            : '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          emp.isActive 
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                            : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        }`}>
                          {emp.isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>مفعّل</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>معطّل</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingEmployee(emp)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors"
                            title="تعديل بيانات الموظف"
                          >
                            <Edit3 className="w-4 h-4 text-amber-400" />
                          </button>

                          {/* Quick Toggle Active Status */}
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            disabled={isToggling || (isSelf && emp.isActive)}
                            className={`p-2 rounded-xl border transition-colors ${
                              isSelf && emp.isActive
                                ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500 border-zinc-700'
                                : emp.isActive
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                            }`}
                            title={
                              isSelf && emp.isActive
                                ? 'لا يمكنك تعطيل حسابك الشخصي المسجل به دخول حالياً'
                                : emp.isActive
                                  ? 'تعطيل الحساب'
                                  : 'تفعيل الحساب'
                            }
                          >
                            {isToggling ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#141417]/50">
            <span className="text-xs text-zinc-400">
              الصفحة <strong className="text-white font-mono">{pageNumber}</strong> من <strong className="text-white font-mono">{totalPages}</strong> (إجمالي {totalCount} موظف)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
                disabled={pageNumber === 1 || loading}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPageNumber((p) => Math.min(p + 1, totalPages))}
                disabled={pageNumber === totalPages || loading}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateEmployeeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchEmployeesList()}
      />

      {editingEmployee && (
        <EditEmployeeModal
          isOpen={Boolean(editingEmployee)}
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSuccess={(updated) => {
            setEmployees((prev) =>
              prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
            );
          }}
        />
      )}
    </div>
  );
};

export default EmployeesManagementPage;
