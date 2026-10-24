import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  Edit3, 
  Power, 
  RefreshCw, 
  Dumbbell, 
  Phone, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle, 
  X, 
  Check, 
  Eye, 
  UserCheck,
  UserPlus,
  Target,
  BarChart2,
  CalendarCheck,
  CalendarX,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import trainersService, { trainerService } from '../../services/trainersService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';
import CreateTrainerModal from './CreateTrainerModal';
import TrainerKpiEvaluationModal from './TrainerKpiEvaluationModal';
import TrainerCustomersList from './TrainerCustomersList';
import TrainerKpiReports from './TrainerKpiReports';

/**
 * EditTrainerModal Component
 * Handles updating coach data via PATCH /api/Trainers/{id}
 * Body: { name, phoneNumber, yearsOfExperience, salary, isActive }
 */
export const EditTrainerModal = ({ isOpen, onClose, trainer, onSuccess }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    yearsOfExperience: 1,
    salary: 0,
    isActive: true,
    isAvailable: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && trainer) {
      setFormData({
        name: trainer.name || '',
        phoneNumber: trainer.phoneNumber || '',
        yearsOfExperience: trainer.yearsOfExperience !== undefined ? Number(trainer.yearsOfExperience) : 1,
        salary: trainer.salary !== undefined ? Number(trainer.salary) : 0,
        isActive: Boolean(trainer.isActive ?? trainer.isTrainerActive ?? true),
        isAvailable: Boolean(trainer.isAvailable ?? true),
      });
      setErrors({});
    }
  }, [isOpen, trainer]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'اسم المدرب مطلوب';
    }
    if (!formData.phoneNumber.trim()) {
      errs.phoneNumber = 'رقم الهاتف مطلوب';
    }
    const exp = Number(formData.yearsOfExperience);
    if (isNaN(exp) || exp < 0) {
      errs.yearsOfExperience = 'سنوات الخبرة يجب أن تكون 0 أو أكثر';
    }
    const sal = Number(formData.salary);
    if (isNaN(sal) || sal < 0) {
      errs.salary = 'الراتب يجب أن يكون 0 أو أكثر';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const trainerId = trainer.id || trainer.trainerId;
      const payload = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        yearsOfExperience: Number(formData.yearsOfExperience),
        salary: Number(formData.salary),
        isActive: Boolean(formData.isActive),
        isAvailable: Boolean(formData.isAvailable),
      };

      await trainerService.updateTrainer(trainerId, payload);
      toastSuccess('تم التعديل بنجاح', `تم تحديث بيانات الكابتن "${payload.name}" بنجاح.`);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      let msg = err.response?.data?.detail || err.response?.data?.message || err.response?.data?.title || err.message || 'فشل تحديث بيانات الكابتن';
      if (err.response?.status === 409) {
        msg = 'رقم الهاتف مسجل بالفعل لمدرب أو مستخدم آخر بالصالة. يرجى إدخال رقم هاتف مختلف.';
      }
      toastError('فشل التعديل', msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !trainer) return null;

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto font-cairo"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg mx-3 sm:mx-4 max-h-[90vh] overflow-y-auto gold-scrollbar bg-gradient-to-b from-[#141419] via-[#0f0f13] to-black rounded-3xl border border-amber-500/30 p-5 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.2)] my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-amber-500/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">تعديل بيانات الكابتن</h3>
                <p className="text-xs text-zinc-400">
                  تحديث الاسم، التليفون، سنوات الخبرة، الراتب والحالة
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                اسم الكابتن <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: كابتن أحمد محمد"
                className={`w-full px-4 py-2.5 rounded-xl bg-zinc-900 border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${
                  errors.name ? 'border-rose-500' : 'border-zinc-800 focus:border-amber-500/60'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-400 font-semibold">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                رقم الهاتف <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                dir="ltr"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+201234567890"
                className={`w-full px-4 py-2.5 rounded-xl bg-zinc-900 border text-sm text-white font-mono placeholder-zinc-500 focus:outline-none transition-all text-right ${
                  errors.phoneNumber ? 'border-rose-500' : 'border-zinc-800 focus:border-amber-500/60'
                }`}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-rose-400 font-semibold">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Experience & Salary (2 Cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Experience */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  سنوات الخبرة <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white font-mono focus:outline-none focus:border-amber-500/60"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 font-cairo">
                    سنوات
                  </span>
                </div>
                {errors.yearsOfExperience && (
                  <p className="mt-1 text-xs text-rose-400 font-semibold">{errors.yearsOfExperience}</p>
                )}
              </div>

              {/* Salary */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  الراتب الشهري (جنيه مصري) <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white font-mono focus:outline-none focus:border-amber-500/60"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400 font-cairo">
                    ج.م
                  </span>
                </div>
                {errors.salary && (
                  <p className="mt-1 text-xs text-rose-400 font-semibold">{errors.salary}</p>
                )}
              </div>
            </div>

            {/* Dual Status Switches (isActive vs isAvailable) */}
            <div className="space-y-3 pt-1">
              {/* 1. Account Active Status (DomainUser) */}
              <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      formData.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">حالة تفعيل حساب الكابتن (User)</span>
                    <span className="text-[10px] text-zinc-400">
                      {formData.isActive ? 'حساب نشط ومصرح له بالدخول للنظام' : 'حساب معطل وممنوع من الدخول'}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* 2. Trainer Booking Availability */}
              <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      formData.isAvailable ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">إتاحة الحجز واستقبال متدربين</span>
                    <span className="text-[10px] text-zinc-400">
                      {formData.isAvailable ? 'متاح للظهور للعملاء وللحجز في الباقات' : 'غير متاح حالياً للحجز أو الباقات الخاصة'}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs sm:text-sm font-black shadow-gold-glow hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>حفظ التعديلات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * TrainersAdminManagement Component
 * Admin Data Table for Trainers Management (GET /api/Trainers/management)
 * Displays: Name, Phone, YearsOfExperience, Salary, isTrainerActive
 * Filters: IsActive, Search, Pagination
 */
export const TrainersAdminManagement = ({ onSwitchToCards = null }) => {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const userRole = user?.role || '';
  const isReception = userRole === 'Reception' || userRole === 'Receptionist';
  const isOperationManagerOrAdmin = 
    !isReception && 
    (
      userRole === 'OperationManager' || 
      userRole === 'OperationsManager' || 
      userRole === 'Manager' || 
      userRole === 'SuperAdmin' ||
      user?.roles?.includes?.('OperationManager')
    );

  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [isActiveFilter, setIsActiveFilter] = useState('all'); // 'all' | 'true' | 'false'
  const [isAvailableFilter, setIsAvailableFilter] = useState('all'); // 'all' | 'true' | 'false'
  const [sortBy, setSortBy] = useState('');

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [trainerToEdit, setTrainerToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [trainerForEvaluation, setTrainerForEvaluation] = useState(null);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);

  const [trainerForCustomers, setTrainerForCustomers] = useState(null);
  const [isCustomersModalOpen, setIsCustomersModalOpen] = useState(false);

  const [trainerForReports, setTrainerForReports] = useState(null);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  // Separate toggle loading states
  const [togglingActiveId, setTogglingActiveId] = useState(null);
  const [togglingAvailabilityId, setTogglingAvailabilityId] = useState(null);

  // Fetch Management Trainers
  const fetchTrainers = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      let activeParam = undefined;
      if (isActiveFilter === 'true') activeParam = true;
      else if (isActiveFilter === 'false') activeParam = false;

      let availableParam = undefined;
      if (isAvailableFilter === 'true') availableParam = true;
      else if (isAvailableFilter === 'false') availableParam = false;

      const res = await trainersService.getTrainersManagement({
        isActive: activeParam,
        isAvailable: availableParam,
        pageNumber,
        pageSize,
        search: debouncedSearch.trim(),
        sortBy,
      });

      setTrainers(res.data || []);
      setTotalCount(res.totalCount || (res.data ? res.data.length : 0));
      setTotalPages(res.totalPages || Math.ceil((res.totalCount || 1) / pageSize) || 1);
    } catch (err) {
      console.warn('Failed to load management trainers:', err);
      toastError('خطأ في التحميل', 'تعذر تحميل قائمة الكباتن الإدارية.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pageNumber, pageSize, debouncedSearch, isActiveFilter, isAvailableFilter, sortBy, toastError]);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const handleRefresh = () => {
    fetchTrainers(true);
  };

  // 1. Toggle Account Active Status (DomainUser)
  const handleToggleActive = async (trainer) => {
    const tId = trainer.id || trainer.trainerId;
    setTogglingActiveId(tId);
    try {
      const nextStatus = !(trainer.isActive ?? trainer.isTrainerActive ?? true);
      await trainersService.toggleTrainerActive(tId, trainer);

      // Optimistic/Local state update without full page reload
      setTrainers((prev) =>
        prev.map((t) => {
          if ((t.id || t.trainerId) === tId) {
            return { ...t, isActive: nextStatus, isTrainerActive: nextStatus };
          }
          return t;
        })
      );

      toastSuccess(
        nextStatus ? 'تم تفعيل حساب الكابتن' : 'تم تعطيل حساب الكابتن',
        `أصبح حساب الكابتن "${trainer.name}" ${nextStatus ? 'مفعلاً ومصرحاً له بالدخول' : 'معطلاً وممنوعاً من الدخول'}.`
      );
    } catch (err) {
      toastError('فشل تعديل حالة الحساب', err.friendlyMessage || err.message || 'حدث خطأ أثناء تعديل حالة الحساب.');
    } finally {
      setTogglingActiveId(null);
    }
  };

  // 2. Toggle Trainer Booking Availability
  const handleToggleAvailability = async (trainer) => {
    const tId = trainer.id || trainer.trainerId;
    setTogglingAvailabilityId(tId);
    try {
      const nextAvailable = !(trainer.isAvailable ?? true);
      await trainersService.toggleTrainerAvailability(tId, trainer);

      // Optimistic/Local state update without full page reload
      setTrainers((prev) =>
        prev.map((t) => {
          if ((t.id || t.trainerId) === tId) {
            return { ...t, isAvailable: nextAvailable };
          }
          return t;
        })
      );

      toastSuccess(
        nextAvailable ? 'الكابتن متاح للحجز' : 'الكابتن غير متاح حالياً',
        `أصبح الكابتن "${trainer.name}" ${nextAvailable ? 'متاحاً لاستقبال متدربين جدد والظهور في الباقات' : 'غير متاح حالياً للحجز أو الباقات'}.`
      );
    } catch (err) {
      toastError('فشل تعديل حالة الإتاحة', err.friendlyMessage || err.message || 'حدث خطأ أثناء تعديل إتاحة الكابتن.');
    } finally {
      setTogglingAvailabilityId(null);
    }
  };

  const handleOpenEdit = (trainer) => {
    setTrainerToEdit(trainer);
    setIsEditModalOpen(true);
  };

  // Metrics
  const activeCount = trainers.filter((t) => (t.isActive ?? t.isTrainerActive) !== false).length;
  const availableCount = trainers.filter((t) => t.isAvailable !== false).length;
  const totalSalaries = trainers.reduce((sum, t) => sum + (Number(t.salary) || 0), 0);

  return (
    <div dir="rtl" className="w-full space-y-6 font-cairo">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-amber-500/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              إدارة الكباتن والمدربين
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>لوحة إدارة المدربين والكباتن</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            متابعة رواتب وخبرات وبيانات الاتصال وحالة نشاط كتيبة المدربين
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Trainer Button (Manager / Operation Manager only) */}
          {isOperationManagerOrAdmin && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-gold-glow flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-black" />
              <span>+ إضافة كابتن جديد</span>
            </button>
          )}

          {onSwitchToCards && (
            <button
              type="button"
              onClick={onSwitchToCards}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
            >
              عرض كروت الكباتن الرياضية
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Trainers */}
        <div className="bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-400 block truncate">إجمالي الكباتن</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{totalCount}</span>
          </div>
        </div>

        {/* Metric 2: Active Accounts */}
        <div className="bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-emerald-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-400 block truncate">حسابات مفعلة</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{activeCount}</span>
          </div>
        </div>

        {/* Metric 3: Available for Booking */}
        <div className="bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-400 block truncate">متاحين للحجز</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">{availableCount}</span>
          </div>
        </div>

        {/* Metric 4: Total Salaries */}
        <div className="bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-yellow-500/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-400 block truncate">إجمالي الرواتب</span>
            <span className="text-lg sm:text-xl font-black text-yellow-300 font-mono">
              {totalSalaries.toLocaleString('ar-EG')} <span className="text-[10px] text-zinc-400 font-normal">ج.م</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-950/90 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }}
            placeholder="بحث باسم الكابتن أو رقم التليفون..."
            className="w-full pr-10 pl-8 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPageNumber(1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Account Status Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[10px] text-zinc-500 font-bold shrink-0">الحساب:</span>
            <select
              value={isActiveFilter}
              onChange={(e) => { setIsActiveFilter(e.target.value); setPageNumber(1); }}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-900 text-white">الكل</option>
              <option value="true" className="bg-zinc-900 text-emerald-400">مفعل</option>
              <option value="false" className="bg-zinc-900 text-rose-400">معطل</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[10px] text-zinc-500 font-bold shrink-0">التواجد:</span>
            <select
              value={isAvailableFilter}
              onChange={(e) => { setIsAvailableFilter(e.target.value); setPageNumber(1); }}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-900 text-white">الكل</option>
              <option value="true" className="bg-zinc-900 text-amber-300">متاح للحجز</option>
              <option value="false" className="bg-zinc-900 text-zinc-400">غير متاح</option>
            </select>
          </div>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPageNumber(1); }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="5">5 / صفحة</option>
            <option value="10">10 / صفحة</option>
            <option value="20">20 / صفحة</option>
          </select>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-zinc-900 text-amber-400 border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table & Cards */}
      <div className="bg-gradient-to-b from-[#141419] to-[#0c0c0e] border border-amber-500/20 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto gold-scrollbar hidden md:block">
          <table className="w-full text-right text-xs text-zinc-300">
            <thead className="bg-zinc-950/90 text-zinc-400 font-bold border-b border-amber-500/15 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">المدرب</th>
                <th className="px-5 py-3.5">رقم الهاتف</th>
                <th className="px-5 py-3.5">سنوات الخبرة</th>
                <th className="px-5 py-3.5">الراتب الشهري</th>
                <th className="px-5 py-3.5 text-center">حالة الحساب</th>
                <th className="px-5 py-3.5 text-center">إتاحة الحجز</th>
                <th className="px-5 py-3.5 text-left">إجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60">
              {loading && trainers.length === 0 ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-6 w-16 bg-zinc-800 rounded-full mx-auto" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-6 w-16 bg-zinc-800 rounded-full mx-auto" /></td>
                    <td className="px-5 py-4 text-left"><div className="h-7 w-20 bg-zinc-800 rounded-xl mr-auto" /></td>
                  </tr>
                ))
              ) : trainers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-14 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-white mb-1">لا يوجد مدربين مطابقين للبحث</h4>
                    <p className="text-xs text-zinc-400">يرجى التأكد من كلمات البحث أو تغيير فلاتر التصفية.</p>
                  </td>
                </tr>
              ) : (
                trainers.map((t) => {
                  const tId = t.id || t.trainerId;
                  const isActive = Boolean(t.isActive ?? t.isTrainerActive ?? true);
                  const isAvailable = Boolean(t.isAvailable ?? true);
                  const isTogglingActive = togglingActiveId === tId;
                  const isTogglingAvailability = togglingAvailabilityId === tId;

                  return (
                    <tr key={tId} className="hover:bg-zinc-900/60 transition-colors group">
                      {/* Name & Avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs font-mono shrink-0">
                            {t.name ? t.name.slice(0, 1) : 'W'}
                          </div>
                          <div>
                            <span className="font-black text-white text-sm block group-hover:text-amber-300 transition-colors">
                              {t.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {t.email || `ID #${tId}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 font-mono text-zinc-300" dir="ltr">
                        {t.phoneNumber ? (
                          <a href={`tel:${t.phoneNumber}`} className="hover:text-amber-400 transition-colors">
                            {t.phoneNumber}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Years of Experience */}
                      <td className="px-5 py-4 font-mono">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 font-bold">
                          <Clock className="w-3 h-3" />
                          <span>{t.yearsOfExperience || 0} سنوات</span>
                        </span>
                      </td>

                      {/* Salary */}
                      <td className="px-5 py-4 font-mono font-bold text-amber-300">
                        {Number(t.salary || 0).toLocaleString('ar-EG')} <span className="text-[10px] text-zinc-400 font-normal">ج.م</span>
                      </td>

                      {/* 1. Account Active Status Badge (DomainUser) */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                          <span>{isActive ? 'حساب مفعل' : 'حساب معطل'}</span>
                        </span>
                      </td>

                      {/* 2. Trainer Booking Availability Badge */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                            isAvailable
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                              : 'bg-zinc-800/80 text-zinc-400 border-white/5'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-amber-400' : 'bg-zinc-500'}`} />
                          <span>{isAvailable ? 'متاح للحجز' : 'غير متاح حالياً'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Trainer Customers */}
                          <button
                            type="button"
                            onClick={() => {
                              setTrainerForCustomers(t);
                              setIsCustomersModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer"
                            title="عرض قائمة اللاعبين المشتركين مع هذا الكابتن"
                          >
                            <Users className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* View KPI Reports */}
                          <button
                            type="button"
                            onClick={() => {
                              setTrainerForReports(t);
                              setIsReportsModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer"
                            title="سجل تقارير وتقييمات الكابتن"
                          >
                            <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Evaluate KPIs (Operation Manager / Admin only) */}
                          {isOperationManagerOrAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setTrainerForEvaluation(t);
                                setIsEvaluationModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="تسجيل تقييم أداء جديد (KPIs) - مخصص لمدير العمليات"
                            >
                              <Target className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">تقييم KPIs</span>
                            </button>
                          )}

                          {/* Toggle Booking Availability (Manager / OperationManager only) */}
                          {isOperationManagerOrAdmin && (
                            <button
                              type="button"
                              disabled={isTogglingAvailability}
                              onClick={() => handleToggleAvailability(t)}
                              className={`p-2 rounded-xl transition-all cursor-pointer ${
                                isAvailable
                                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/25'
                                  : 'bg-zinc-900 text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 border border-zinc-800'
                              }`}
                              title={isAvailable ? 'إتاحة الحجز: جعل الكابتن غير متاح' : 'إتاحة الحجز: جعل الكابتن متاحاً للحجز'}
                            >
                              <CalendarCheck className={`w-3.5 h-3.5 ${isTogglingAvailability ? 'animate-spin' : ''}`} />
                            </button>
                          )}

                          {/* Toggle Account Status (Manager / OperationManager only) */}
                          {isOperationManagerOrAdmin && (
                            <button
                              type="button"
                              disabled={isTogglingActive}
                              onClick={() => handleToggleActive(t)}
                              className={`p-2 rounded-xl transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                              }`}
                              title={isActive ? 'تعطيل حساب الكابتن' : 'تفعيل حساب الكابتن'}
                            >
                              <Power className={`w-3.5 h-3.5 ${isTogglingActive ? 'animate-spin' : ''}`} />
                            </button>
                          )}

                          {/* Edit Button (Manager / OperationManager only) */}
                          {isOperationManagerOrAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(t)}
                              className="p-2 rounded-xl bg-zinc-900 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/30 transition-all cursor-pointer"
                              title="تعديل بيانات المدرب"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
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

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-zinc-800/80 p-3 sm:p-4 space-y-3">
          {loading && trainers.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 font-bold">جاري التحميل...</div>
          ) : trainers.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 text-xs">لا يوجد مدربين مسجلين.</div>
          ) : (
            trainers.map((t) => {
              const tId = t.id || t.trainerId;
              const isActive = Boolean(t.isActive ?? t.isTrainerActive ?? true);
              const isAvailable = Boolean(t.isAvailable ?? true);
              const isTogglingActive = togglingActiveId === tId;
              const isTogglingAvailability = togglingAvailabilityId === tId;

              return (
                <div key={tId} className="bg-black/60 rounded-2xl p-4 border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-black text-white text-sm">{t.name}</h4>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                      }`}>
                        {isActive ? 'حساب مفعل' : 'حساب معطل'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isAvailable ? 'bg-amber-500/10 text-amber-300 border-amber-500/25' : 'bg-zinc-800/80 text-zinc-400 border-white/5'
                      }`}>
                        {isAvailable ? 'متاح للحجز' : 'غير متاح'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/50">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">الهاتف:</span>
                      <span dir="ltr" className="text-zinc-300 font-mono text-[11px] block">{t.phoneNumber || '—'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">الخبرة:</span>
                      <span className="text-amber-400 font-bold">{t.yearsOfExperience || 0} سنوات</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-zinc-800/50 flex items-center justify-between">
                      <span className="text-zinc-500 text-[10px]">الراتب:</span>
                      <span className="text-amber-300 font-mono font-bold">{Number(t.salary || 0).toLocaleString('ar-EG')} ج.م</span>
                    </div>
                  </div>

                  {/* Mobile Actions Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTrainerForCustomers(t);
                        setIsCustomersModalOpen(true);
                      }}
                      className="py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>المتدربين</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTrainerForReports(t);
                        setIsReportsModalOpen(true);
                      }}
                      className="py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>التقارير</span>
                    </button>

                    {/* Operation Manager & Admin Exclusive Actions */}
                    {isOperationManagerOrAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="py-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTrainerForEvaluation(t);
                            setIsEvaluationModalOpen(true);
                          }}
                          className="col-span-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-gold-glow"
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>تقييم أداء الكابتن (KPIs)</span>
                        </button>

                        {/* Availability Toggle */}
                        <button
                          type="button"
                          disabled={isTogglingAvailability}
                          onClick={() => handleToggleAvailability(t)}
                          className="col-span-1.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-300"
                          title="تبديل الإتاحة للحجز"
                        >
                          <CalendarCheck className={`w-3.5 h-3.5 ${isTogglingAvailability ? 'animate-spin text-amber-400' : isAvailable ? 'text-amber-400' : 'text-zinc-500'}`} />
                          <span>{isAvailable ? 'متاح للحجز' : 'غير متاح'}</span>
                        </button>

                        {/* Account Status Toggle */}
                        <button
                          type="button"
                          disabled={isTogglingActive}
                          onClick={() => handleToggleActive(t)}
                          className={`col-span-1.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isActive ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          }`}
                          title="تفعيل / تعطيل الحساب"
                        >
                          <Power className={`w-3.5 h-3.5 ${isTogglingActive ? 'animate-spin' : ''}`} />
                          <span>{isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        <div className="bg-zinc-950/90 px-5 py-3.5 border-t border-amber-500/15 flex items-center justify-between text-xs text-zinc-400">
          <div>
            إجمالي الكباتن: <span className="font-bold text-white font-mono">{totalCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageNumber <= 1 || loading}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 disabled:opacity-40 transition-colors"
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
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditTrainerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        trainer={trainerToEdit}
        onSuccess={fetchTrainers}
      />

      {/* Create Trainer Modal (POST /api/Trainers) */}
      <CreateTrainerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchTrainers}
      />

      {/* KPI Evaluation Modal (POST /api/Trainers/{id}/kpi-evaluations) */}
      <TrainerKpiEvaluationModal
        isOpen={isEvaluationModalOpen}
        onClose={() => {
          setIsEvaluationModalOpen(false);
          setTrainerForEvaluation(null);
        }}
        trainer={trainerForEvaluation}
        onSuccess={fetchTrainers}
      />

      {/* Trainer Customers Modal (GET /api/Trainers/{id}/customers) */}
      <TrainerCustomersList
        isOpen={isCustomersModalOpen}
        onClose={() => {
          setIsCustomersModalOpen(false);
          setTrainerForCustomers(null);
        }}
        trainerId={trainerForCustomers?.id || trainerForCustomers?.trainerId}
        trainerName={trainerForCustomers?.name}
      />

      {/* Trainer KPI Reports Modal (GET /api/Trainers/{id}/kpi-evaluations and /daily) */}
      <TrainerKpiReports
        isOpen={isReportsModalOpen}
        onClose={() => {
          setIsReportsModalOpen(false);
          setTrainerForReports(null);
        }}
        trainer={trainerForReports}
      />
    </div>
  );
};

export default TrainersAdminManagement;
