import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Banknote,
  CreditCard,
  Wallet,
  Search,
  Check,
  X,
  Calendar,
  User,
  Phone,
  Tag,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  Receipt,
  Flame,
  CheckCircle2,
  ChevronDown,
  UserCheck,
  Dumbbell
} from 'lucide-react';
import { 
  customerService, 
  packageService, 
  trainerService, 
  subscriptionService, 
  PACKAGE_TYPES, 
  getPackageTypeMeta,
  PAYMENT_METHODS as PAYMENT_METHOD_ENUM
} from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

/**
 * Payment method definitions aligned with backend PaymentMethod Enum:
 * 0 = Cash, 1 = MobileWallet, 2 = InstaPay, 3 = Fawry, 4 = Other
 */
const PAYMENT_METHODS = [
  {
    id: 0,
    title: 'كاش / نقدي (Cash)',
    subTitle: 'دفع نقدي مباشر في خزينة الاستقبال',
    icon: Banknote,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    id: 1,
    title: 'محفظة إلكترونية (Mobile Wallet)',
    subTitle: 'فودافون كاش، أورنج، وي باي، إلخ',
    icon: Wallet,
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  },
  {
    id: 2,
    title: 'إنستاباي (InstaPay)',
    subTitle: 'تحويل بنكي لحظي عبر تطبيق InstaPay',
    icon: CreditCard,
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
  {
    id: 3,
    title: 'فوري (Fawry)',
    subTitle: 'سداد عن طريق ماكينات وشبكة فوري',
    icon: Receipt,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  {
    id: 4,
    title: 'أخرى (Other)',
    subTitle: 'طريقة دفع بديلة أو شيك معتمد',
    icon: Sparkles,
    badgeColor: 'text-zinc-400 bg-zinc-800 border-zinc-700',
  },
];


/**
 * CreateSubscriptionModal
 * Receptionist / Admin modal to register, activate, and bill member subscriptions.
 * Implements Conditional Trainer Selection:
 * - If package is SharedPrivate (2): mandatory trainerId selection from trainers list
 * - If package is Regular (0) or Private (1): hide trainer selection and send trainerId: null
 */
export const CreateSubscriptionModal = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedCustomer = null,
  preselectedPackage = null,
}) => {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  // Data sources
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingTrainers, setLoadingTrainers] = useState(false);

  // Form states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isPackageDropdownOpen, setIsPackageDropdownOpen] = useState(false);
  const [packageSearchQuery, setPackageSearchQuery] = useState('');
  const [selectedTrainerId, setSelectedTrainerId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(0); // 0: Cash, 1: MobileWallet, 2: InstaPay, 3: Fawry, 4: Other
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dropdownRef = useRef(null);
  const packageDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsCustomerDropdownOpen(false);
      }
      if (packageDropdownRef.current && !packageDropdownRef.current.contains(e.target)) {
        setIsPackageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Fetch initial packages, customers, and trainers when opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchInitialData = async () => {
      setLoadingInitial(true);
      try {
        // 1. Fetch active packages
        const pkgsRes = await packageService.getPackages({ pageSize: 50 });
        if (isMounted) {
          const list = Array.isArray(pkgsRes?.data) ? pkgsRes.data : [];
          const activeOnly = list.filter((p) => p.isActive !== false);
          setPackages(activeOnly.length > 0 ? activeOnly : list);
        }

        // 2. Fetch initial customers
        setLoadingCustomers(true);
        const custRes = await customerService.getCustomers({ pageSize: 50, sortBy: 'createdAt' });
        if (isMounted) {
          const rawCusts = Array.isArray(custRes?.items) ? custRes.items : [];
          setCustomers(rawCusts);
        }

        // 3. Fetch trainers for conditional trainer selection
        setLoadingTrainers(true);
        const trainersList = await trainerService.getAllTrainers();
        if (isMounted) {
          setTrainers(Array.isArray(trainersList) ? trainersList : []);
        }
      } catch (err) {
        console.warn('Error loading subscription modal dependencies:', err);
      } finally {
        if (isMounted) {
          setLoadingInitial(false);
          setLoadingCustomers(false);
          setLoadingTrainers(false);
        }
      }
    };

    fetchInitialData();

    // Reset or apply preselected
    if (preselectedCustomer) {
      setSelectedCustomer(preselectedCustomer);
      setCustomerSearchQuery(preselectedCustomer.name || '');
    } else {
      setSelectedCustomer(null);
      setCustomerSearchQuery('');
    }

    if (preselectedPackage) {
      setSelectedPackage(preselectedPackage);
    } else {
      setSelectedPackage(null);
    }

    setSelectedTrainerId(null);
    setPaymentMethod(0);
    setNotes('');
    setSubmitting(false);

    return () => {
      isMounted = false;
    };
  }, [isOpen, preselectedCustomer, preselectedPackage]);

  // Handle dynamic customer search with debouncing
  useEffect(() => {
    if (!isOpen || selectedCustomer) return;
    if (!customerSearchQuery.trim()) return;

    const timer = setTimeout(async () => {
      setLoadingCustomers(true);
      try {
        const res = await customerService.getCustomers({
          search: customerSearchQuery.trim(),
          pageSize: 20,
        });
        if (Array.isArray(res?.items)) {
          setCustomers(res.items);
        }
      } catch (e) {
        console.warn('Customer live search error:', e);
      } finally {
        setLoadingCustomers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearchQuery, isOpen, selectedCustomer]);

  // Filtered customer list for dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers.slice(0, 15);
    const q = customerSearchQuery.trim().toLowerCase();
    return customers.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phoneNumber || '').includes(q) ||
        (c.code || '').toLowerCase().includes(q) ||
        String(c.id || '').includes(q)
    );
  }, [customers, customerSearchQuery]);

  // Filtered packages list for dropdown with search
  const filteredPackages = useMemo(() => {
    if (!packageSearchQuery.trim()) return packages;
    const q = packageSearchQuery.trim().toLowerCase();
    return packages.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        String(p.price || '').includes(q)
    );
  }, [packages, packageSearchQuery]);

  // Check if selected package is SharedPrivate (type 2)
  const isSharedPrivate = Boolean(
    selectedPackage && Number(selectedPackage.type) === PACKAGE_TYPES.SHARED_PRIVATE
  );

  // When package changes, if not shared private, clear trainerId
  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setIsPackageDropdownOpen(false);
    if (Number(pkg?.type) !== PACKAGE_TYPES.SHARED_PRIVATE) {
      setSelectedTrainerId(null);
    }
  };


  // Find selected trainer object
  const selectedTrainerObj = useMemo(() => {
    if (!selectedTrainerId) return null;
    return trainers.find((t) => Number(t.id || t.trainerId) === Number(selectedTrainerId)) || null;
  }, [selectedTrainerId, trainers]);

  // Calculate live subscription expiration date
  const calculationSummary = useMemo(() => {
    const today = new Date();
    const durationDays = Number(selectedPackage?.duration) || 30;
    const expiryDate = new Date(today.getTime() + durationDays * 24 * 60 * 60 * 1000);

    return {
      startDateFormatted: today.toLocaleDateString('ar-EG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      expiryDateFormatted: expiryDate.toLocaleDateString('ar-EG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      price: Number(selectedPackage?.price) || 0,
      durationDays,
    };
  }, [selectedPackage]);

  // Handle selecting a customer from dropdown
  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setCustomerSearchQuery(cust.name || '');
    setIsCustomerDropdownOpen(false);
  };

  // Clear chosen customer
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(true);
  };

  // Form submission handler
  const handleSubmitSubscription = async (e) => {
    e.preventDefault();

    // 1. Validation: Ensure both customer and package are selected
    if (!selectedCustomer) {
      toastWarning('بيانات غير مكتملة', 'يرجى اختيار العضو (الوحش) أولاً.');
      return;
    }
    if (!selectedPackage) {
      toastWarning('بيانات غير مكتملة', 'يرجى اختيار باقة التدريب المراد تفعيلها.');
      return;
    }

    // 2. Validation for SharedPrivate package: trainerId is mandatory
    if (isSharedPrivate && !selectedTrainerId) {
      toastWarning(
        'مطلوب اختيار الكابتن',
        'هذه الباقة خاصة مشتركة بين الكباتن (SharedPrivate). يرجى اختيار الكابتن المتابع من القائمة.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const customerId = Number(selectedCustomer.id || selectedCustomer.customerId);
      const packageId = Number(selectedPackage.id);
      // For Regular (0) or Private (1): send trainerId: null automatically
      const finalTrainerId = isSharedPrivate && selectedTrainerId ? Number(selectedTrainerId) : null;

      const res = await subscriptionService.createSubscription({
        customerId,
        packageId,
        trainerId: finalTrainerId,
        paymentMethod: Number(paymentMethod),
        notes: notes.trim(),
        customer: selectedCustomer,
        packageItem: selectedPackage,
        trainer: selectedTrainerObj,
      });

      // Provide celebratory toast exactly as required:
      // "تم تسجيل الاشتراك وتفعيل الباقة بنجاح"
      toastSuccess(
        'تم تسجيل الاشتراك وتفعيل الباقة بنجاح 🐺🔥',
        `تم تفعيل باقة "${selectedPackage.name}" للعضو ${selectedCustomer.name}.`
      );

      if (onSuccess) {
        onSuccess(res?.record || res);
      }

      onClose();
    } catch (err) {
      console.error('Subscription creation failed:', err);
      toastError(
        'فشل تسجيل الاشتراك',
        err.message || 'حدث خطأ أثناء معالجة طلب الاشتراك. يرجى مراجعة البيانات والمحاولة مجدداً.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-cairo"
      >
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative w-full max-w-4xl mx-3 sm:mx-4 max-h-[92vh] overflow-y-auto gold-scrollbar bg-gradient-to-b from-[#141419] to-[#0c0c0e] border border-amber-500/30 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] z-10 my-auto"
        >
          {/* Subtle Golden Ambient Glow */}
          <div className="absolute top-0 right-0 left-0 h-32 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent pointer-events-none" />

          {/* Modal Header */}
          <div className="relative z-10 flex items-center justify-between p-5 sm:p-6 border-b border-amber-500/15">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-black flex items-center justify-center shadow-gold-glow shrink-0">
                <Crown className="w-6 h-6 fill-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    تسجيل وتفعيل اشتراك جديد بالصالة
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    WOLVES BILLING
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  اختيار الوحش، تحديد الباقة الرياضية، واختيار الكابتن إذا كانت الباقة مشتركة
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="p-2 rounded-xl bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: 2-Column Responsive Layout */}
          <form onSubmit={handleSubmitSubscription}>
            <div className="relative z-10 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[76vh] overflow-y-auto custom-scrollbar">
              
              {/* ========================================================== */}
              {/* LEFT / CENTER COLUMN: INTERACTIVE INPUT FORM (7 Cols)      */}
              {/* ========================================================== */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* 1. SELECT CUSTOMER (اختيار العضو) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>1. اختيار العضو (الوحش) <span className="text-amber-400">*</span>:</span>
                    </label>
                    {selectedCustomer && (
                      <button
                        type="button"
                        onClick={handleClearCustomer}
                        className="text-[11px] text-amber-400/80 hover:text-amber-300 underline font-bold cursor-pointer"
                      >
                        تغيير العضو
                      </button>
                    )}
                  </div>

                  {/* If customer is selected: show active badge card */}
                  {selectedCustomer ? (
                    <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-amber-500/40 flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                          {selectedCustomer.name?.slice(0, 1) || 'W'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-white truncate">
                            {selectedCustomer.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 font-mono">
                            <span dir="ltr">{selectedCustomer.phoneNumber || 'بدون هاتف'}</span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-amber-400 font-bold">
                              {selectedCustomer.code || `ID-${selectedCustomer.id}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>تم الاختيار</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleClearCustomer}
                          className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="إلغاء الاختيار"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Searchable dropdown input */
                    <div ref={dropdownRef} className="relative">
                      <div className="relative">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="text"
                          value={customerSearchQuery}
                          onChange={(e) => {
                            setCustomerSearchQuery(e.target.value);
                            setIsCustomerDropdownOpen(true);
                          }}
                          onFocus={() => setIsCustomerDropdownOpen(true)}
                          placeholder="ابحث بالاسم، رقم التليفون، أو كود الوحش..."
                          className="w-full pl-4 pr-10 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 focus:border-amber-500 text-sm text-white placeholder-zinc-500 outline-none transition-all shadow-inner"
                        />
                        {loadingCustomers && (
                          <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 animate-spin" />
                        )}
                      </div>

                      {/* Dropdown Options */}
                      <AnimatePresence>
                        {isCustomerDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="absolute right-0 left-0 top-full mt-1.5 bg-[#0f0f13] border border-amber-500/30 rounded-2xl shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-zinc-800/80 custom-scrollbar"
                          >
                            {filteredCustomers.length === 0 ? (
                              <div className="p-4 text-center text-xs text-zinc-400">
                                {loadingCustomers ? 'جاري البحث في قاعدة البيانات...' : 'لم يتم العثور على أي وحش بهذا الاسم'}
                              </div>
                            ) : (
                              filteredCustomers.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleSelectCustomer(c)}
                                  className="w-full p-3 text-right hover:bg-zinc-900/80 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 group-hover:bg-amber-500/20 group-hover:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 transition-colors">
                                      {c.name?.slice(0, 1) || 'W'}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                                        {c.name}
                                      </div>
                                      <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                                        <span dir="ltr">{c.phoneNumber || 'بدون هاتف'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-amber-400 shrink-0">
                                    {c.code || `ID-${c.id}`}
                                  </div>
                                </button>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* 2. SELECT PACKAGE (اختيار الباقة كـ Dropdown ذكي) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>2. باقة التدريب المتاحة <span className="text-amber-400">*</span>:</span>
                    </label>
                    {selectedPackage && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPackageTypeMeta(selectedPackage.type).badgeColor}`}>
                        {getPackageTypeMeta(selectedPackage.type).label}
                      </span>
                    )}
                  </div>

                  {loadingInitial ? (
                    <div className="h-14 bg-zinc-900/50 rounded-2xl animate-pulse flex items-center justify-center text-xs text-zinc-500">
                      جاري تحميل الباقات المتاحة...
                    </div>
                  ) : packages.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center text-xs text-zinc-400">
                      لا توجد باقات متاحة حالياً. يرجى إضافة باقة جديدة أولاً.
                    </div>
                  ) : (
                    <div ref={packageDropdownRef} className="relative">
                      {/* Dropdown Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setIsPackageDropdownOpen((prev) => !prev)}
                        className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isPackageDropdownOpen
                            ? 'bg-zinc-900 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/50'
                            : selectedPackage
                            ? 'bg-zinc-900/90 border-amber-500/40 hover:border-amber-400'
                            : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {selectedPackage ? (
                          <div className="flex items-center justify-between flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getPackageTypeMeta(selectedPackage.type).badgeColor}`}>
                                {getPackageTypeMeta(selectedPackage.type).label}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-black text-white truncate">
                                  {selectedPackage.name}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    {selectedPackage.duration} يوم
                                  </span>
                                  {selectedPackage.isPopular && (
                                    <span className="text-amber-400 font-bold">• الأكثر طلباً</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-left shrink-0 mr-2">
                              <span className="text-sm font-black text-amber-400 font-mono">
                                {Number(selectedPackage.price).toLocaleString('ar-EG')}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-cairo mr-1">ج.م</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-zinc-500" />
                            اضغط لاختيار باقة التدريب المناسبة... ({packages.length} باقة متاحة)
                          </span>
                        )}

                        <div className={`p-1 rounded-lg bg-zinc-800/80 text-zinc-400 transition-transform shrink-0 ${isPackageDropdownOpen ? 'rotate-180 text-amber-400' : ''}`}>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {isPackageDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 left-0 top-full mt-2 bg-[#0d0d12] border border-amber-500/40 rounded-2xl shadow-2xl z-50 overflow-hidden"
                          >
                            {/* Search box inside dropdown if packages > 4 */}
                            {packages.length > 4 && (
                              <div className="p-2.5 border-b border-zinc-800 bg-zinc-900/60">
                                <div className="relative">
                                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                  <input
                                    type="text"
                                    value={packageSearchQuery}
                                    onChange={(e) => setPackageSearchQuery(e.target.value)}
                                    placeholder="بحث سريع في الباقات..."
                                    className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-black/60 border border-zinc-800 focus:border-amber-500 text-xs text-white placeholder-zinc-500 outline-none"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Scrollable list of packages */}
                            <div className="max-h-60 overflow-y-auto divide-y divide-zinc-850 custom-scrollbar p-1.5 space-y-1">
                              {filteredPackages.length === 0 ? (
                                <div className="p-4 text-center text-xs text-zinc-500">
                                  لا توجد باقة مطابقة لاسم البحث
                                </div>
                              ) : (
                                filteredPackages.map((pkg) => {
                                  const isSelected = selectedPackage?.id === pkg.id;
                                  const pkgTypeMeta = getPackageTypeMeta(pkg.type);
                                  return (
                                    <button
                                      key={pkg.id}
                                      type="button"
                                      onClick={() => handleSelectPackage(pkg)}
                                      className={`w-full p-2.5 rounded-xl text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                        isSelected
                                          ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                                          : 'hover:bg-zinc-800/60 border border-transparent text-zinc-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                            isSelected
                                              ? 'border-amber-400 bg-amber-400 text-black'
                                              : 'border-zinc-700'
                                          }`}
                                        >
                                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white truncate">
                                              {pkg.name}
                                            </span>
                                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${pkgTypeMeta.badgeColor}`}>
                                              {pkgTypeMeta.label}
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                                            <span>{pkg.duration} يوماً</span>
                                            {pkg.description && (
                                              <span className="text-zinc-500 truncate max-w-[160px] font-cairo">
                                                • {pkg.description}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-left shrink-0">
                                        <span className="text-xs font-black text-amber-400 font-mono">
                                          {Number(pkg.price).toLocaleString('ar-EG')}
                                        </span>
                                        <span className="text-[9px] text-zinc-400 font-cairo mr-1">ج.م</span>
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* CONDITIONAL TRAINER SELECTION LOGIC (Requirement 3) */}
                <AnimatePresence>
                  {isSharedPrivate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/15 via-purple-500/10 to-transparent border border-purple-500/40 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-purple-300 flex items-center gap-2">
                            <Dumbbell className="w-4 h-4 text-purple-400" />
                            <span>اختر الكابتن المتابع <span className="text-purple-400">*</span></span>
                          </label>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                            إلزامي للباقة المشتركة
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          هذه الباقة <strong className="text-purple-300">خاصة مشتركة (SharedPrivate)</strong>. يحق للعضو تحديد الكابتن الذي يرغب في التدريب والمتابعة معه من كتيبة مدربي الجيم:
                        </p>

                        {loadingTrainers ? (
                          <div className="p-3 bg-zinc-900/80 rounded-xl text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                            <span>جاري تحميل الكباتن المعتمدين...</span>
                          </div>
                        ) : trainers.length === 0 ? (
                          <div className="p-3 bg-zinc-900 rounded-xl text-xs text-zinc-400 text-center">
                            لا يوجد كباتن مسجلين حالياً.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {trainers.map((t) => {
                              const tId = t.id || t.trainerId;
                              const isCoachSelected = Number(selectedTrainerId) === Number(tId);
                              return (
                                <button
                                  key={tId}
                                  type="button"
                                  onClick={() => setSelectedTrainerId(tId)}
                                  className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                                    isCoachSelected
                                      ? 'bg-purple-500/25 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] ring-1 ring-purple-400'
                                      : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-purple-500/40 hover:bg-zinc-850'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-black text-xs font-mono shrink-0">
                                      {t.name?.slice(0, 1) || 'C'}
                                    </div>
                                    <div className="min-w-0">
                                      <h5 className="text-xs font-bold text-white truncate">
                                        {t.name}
                                      </h5>
                                      <span className="text-[10px] text-zinc-400 block font-mono">
                                        خبرة {t.yearsOfExperience || 1} سنوات
                                      </span>
                                    </div>
                                  </div>

                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      isCoachSelected
                                        ? 'border-purple-400 bg-purple-400 text-black'
                                        : 'border-zinc-700'
                                    }`}
                                  >
                                    {isCoachSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* If selected package is Private (type 1): show info badge */}
                {selectedPackage && Number(selectedPackage.type) === PACKAGE_TYPES.PRIVATE && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
                    <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      هذه الباقة <strong>خاصة بكابتن محدد (Private)</strong>، ومربوطة بالفعل بكابتن الصالة تلقائيًا. سيتم إرسال <code className="font-mono text-amber-400">trainerId: null</code> وفقاً لنظام الباقة.
                    </span>
                  </div>
                )}

                {/* 3. PAYMENT METHOD (طرق الدفع الخمسة المعتمدة في الباك إند) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>3. طريقة الدفع واستلام المبلغ <span className="text-amber-400">*</span>:</span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map((pm) => {
                      const Icon = pm.icon;
                      const isSelected = paymentMethod === pm.id;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`p-3 rounded-2xl text-right transition-all cursor-pointer border flex flex-col justify-between ${
                            isSelected
                              ? 'bg-gradient-to-b from-amber-500/20 to-transparent border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/50'
                              : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className={`p-2 rounded-xl ${pm.badgeColor}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-400'
                                  : 'border-zinc-600'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                          </div>
                          <div>
                            <div className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                              {pm.title}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                              {pm.subTitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>


                {/* 4. NOTES (ملاحظات اختيارية) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    4. ملاحظات إضافية (اختياري):
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: تم دفع المبلغ كامل مع كابتن محمد، أو تحويل فودافون كاش كود 889..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 focus:border-amber-500 text-xs text-white placeholder-zinc-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* ========================================================== */}
              {/* RIGHT / SIDEBAR COLUMN: LIVE BILLING SUMMARY CARD (5 Cols) */}
              {/* ========================================================== */}
              <div className="lg:col-span-5 space-y-4">
                <div className="h-full bg-gradient-to-b from-[#18181f] via-[#121217] to-[#0a0a0d] border border-amber-500/30 rounded-3xl p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                  {/* Subtle Background Mesh Watermark */}
                  <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="space-y-4">
                    {/* Summary Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-black text-white">ملخص الفاتورة التلقائي</h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold">
                        LIVE SUMMARY
                      </span>
                    </div>

                    {/* Member Details */}
                    <div className="space-y-1.5 bg-black/40 p-3 rounded-2xl border border-zinc-800/80">
                      <span className="text-[10px] text-zinc-400 block">العضو المشترك:</span>
                      {selectedCustomer ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white truncate">
                            {selectedCustomer.name}
                          </span>
                          <span className="text-[11px] font-mono text-amber-400 font-bold">
                            {selectedCustomer.code || `ID-${selectedCustomer.id}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500 italic block">
                          لم يتم تحديد العضو بعد
                        </span>
                      )}
                    </div>

                    {/* Package Details */}
                    <div className="space-y-1.5 bg-black/40 p-3 rounded-2xl border border-zinc-800/80">
                      <span className="text-[10px] text-zinc-400 block">الباقة ونوعها:</span>
                      {selectedPackage ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-300">
                              {selectedPackage.name}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-300">
                              {selectedPackage.duration} يوماً
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPackageTypeMeta(selectedPackage.type).badgeColor}`}>
                              {getPackageTypeMeta(selectedPackage.type).label}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500 italic block">
                          يرجى اختيار باقة التدريب
                        </span>
                      )}
                    </div>

                    {/* Assigned Trainer in SharedPrivate */}
                    {isSharedPrivate && (
                      <div className="space-y-1.5 bg-purple-500/10 p-3 rounded-2xl border border-purple-500/30">
                        <span className="text-[10px] text-purple-300 font-bold block">الكابتن المتابع المختار:</span>
                        {selectedTrainerObj ? (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white truncate">
                              {selectedTrainerObj.name}
                            </span>
                            <span className="text-[10px] font-mono text-purple-300">
                              خبرة {selectedTrainerObj.yearsOfExperience || 1} سنوات
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-rose-400 font-semibold block">
                            ⚠️ يرجى اختيار الكابتن المتابع
                          </span>
                        )}
                      </div>
                    )}

                    {/* Dates Breakdown */}
                    {selectedPackage && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/60 font-mono">
                        <div>
                          <span className="text-[9px] text-zinc-500 block font-cairo">تاريخ البدء:</span>
                          <span className="text-zinc-200">{calculationSummary.startDateFormatted}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-amber-400/80 block font-cairo">تاريخ الانتهاء:</span>
                          <span className="text-amber-400 font-bold">{calculationSummary.expiryDateFormatted}</span>
                        </div>
                      </div>
                    )}

                    {/* Payment Method Badge */}
                    <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                      <span className="text-zinc-400">طريقة السداد:</span>
                      <span className="font-bold text-zinc-200">
                        {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.title}
                      </span>
                    </div>
                  </div>

                  {/* Total Amount Due */}
                  <div className="pt-4 mt-4 border-t border-amber-500/20 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold text-zinc-300">المبلغ الإجمالي المستحق:</span>
                      <div className="text-left">
                        <span className="text-3xl font-black text-amber-400 font-mono tracking-tight drop-shadow-md">
                          {calculationSummary.price.toLocaleString('ar-EG')}
                        </span>
                        <span className="text-xs text-zinc-400 mr-1.5">جنيه مصري</span>
                      </div>
                    </div>

                    {/* Submit Confirmation Button */}
                    <button
                      type="submit"
                      disabled={submitting || !selectedCustomer || !selectedPackage || (isSharedPrivate && !selectedTrainerId)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black text-sm font-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                          <span>جاري تسجيل وتفعيل الاشتراك...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                          <span>تأكيد الاشتراك وتفعيل الباقة</span>
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-center text-zinc-500 leading-tight">
                      يتم تفعيل العضوية وتحديث سجلات الصالة فورياً بمجرد التأكيد.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateSubscriptionModal;
