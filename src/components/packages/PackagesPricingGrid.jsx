import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Crown, 
  Sparkles, 
  RefreshCw, 
  ArrowUpDown, 
  Clock, 
  ShieldCheck, 
  Flame, 
  CreditCard, 
  Wallet, 
  Banknote, 
  Check, 
  X,
  AlertCircle,
  HelpCircle,
  PhoneCall
} from 'lucide-react';
import PackageCard from './PackageCard';
import { packageService, getUserInfo } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

/**
 * PackagesPricingGrid Component
 * Customer & Public View for Gym Membership Plans
 * Features gym pricing cards, search/filter, and subscription modal flow.
 */
export const PackagesPricingGrid = ({ onOpenAdminManagement, isEmbedded = false }) => {
  const { user, isAuthenticated, setActiveAuthView } = useAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('price_asc');
  const [durationFilter, setDurationFilter] = useState('all'); // 'all' | '30' | '90' | '180' | '365'

  // Subscription modal state
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(0); // 0: Cash, 1: Card, 2: Wallet/InstaPay
  const [subscriptionNotes, setSubscriptionNotes] = useState('');

  // Fetch Packages
  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await packageService.getPackages({
        pageNumber: 1,
        pageSize: 50,
        search,
        sortBy,
      });
      setPackages(res.data || []);
    } catch (err) {
      console.warn('Failed to load packages:', err);
      toastError('تعذر التحميل', 'حدث خطأ أثناء تحميل الباقات الرياضية.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPackages();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPackages]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPackages();
  };

  // Client-side duration filtering & sorting
  const filteredPackages = packages.filter((pkg) => {
    if (durationFilter === 'all') return true;
    const days = Number(pkg.duration);
    if (durationFilter === '30') return days <= 30;
    if (durationFilter === '90') return days > 30 && days <= 90;
    if (durationFilter === '180') return days > 90 && days <= 180;
    if (durationFilter === '365') return days > 180;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'duration_asc') return Number(a.duration) - Number(b.duration);
    if (sortBy === 'duration_desc') return Number(b.duration) - Number(a.duration);
    return (a.name || '').localeCompare(b.name || '');
  });

  // Handle plan selection -> open checkout modal
  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setSubscriptionSuccess(false);
    setPaymentMethod(0);
    setSubscriptionNotes('');
  };

  // Handle checkout subscription submission
  const handleConfirmSubscription = async (e) => {
    e.preventDefault();
    if (!selectedPackage) return;

    setSubscribing(true);
    try {
      let customerId = user?.customerId || user?.id;
      let customerProfile = null;

      // Ensure customerId is obtained from GET /api/customers/me if customer role
      try {
        customerProfile = await customerService.getCustomerMe();
        if (customerProfile?.id || customerProfile?.customerId) {
          customerId = customerProfile.id || customerProfile.customerId;
        }
      } catch (meErr) {
        console.warn('Could not fetch /api/customers/me:', meErr);
      }

      await packageService.subscribe({
        customerId: customerId || 1,
        packageId: selectedPackage.id,
        paymentMethod,
        notes: subscriptionNotes,
        customer: customerProfile || user,
        packageItem: selectedPackage,
      });

      setSubscriptionSuccess(true);
      toastSuccess('مبروك يا وحش!', `تم تفعيل اشتراكك في باقة ${selectedPackage.name} وجاهز للتمرين.`);
    } catch (err) {
      toastError('تعذر إتمام الاشتراك', err.message || 'حدث خطأ أثناء إرسال طلب الاشتراك.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div dir="rtl" className="w-full space-y-8">
      {/* Hero / Banner Header */}
      {!isEmbedded && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#14120c] via-[#0e0e12] to-black border border-amber-500/30 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
                <Crown className="w-4 h-4" />
                <span>عضويات وباقات BE THE WOLF الرسمية</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 tracking-tight">
                خطط وباقات التدريب الرياضية
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                استثمر في قوتك ولياقتك مع باقات مصممة خصيصاً لتناسب أهدافك. باقات شاملة الأجهزة، اللوكرات الذكية، واستشارات الكباتن والـ InBody.
              </p>
            </div>

            {onOpenAdminManagement && (
              <button
                type="button"
                onClick={onOpenAdminManagement}
                className="self-start md:self-center px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center gap-2 shadow-gold-glow hover:scale-105 transition-all cursor-pointer whitespace-nowrap"
              >
                <Crown className="w-4 h-4" />
                <span>لوحة إدارة الباقات</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-zinc-950/80 border border-amber-500/15 rounded-2xl p-3 sm:p-4 backdrop-blur-xl">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن باقة بالاسم أو المميزات..."
            className="w-full pr-10 pl-8 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 transition-all"
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

        {/* Duration Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'الكل' },
            { id: '30', label: 'شهر' },
            { id: '90', label: '3 شهور' },
            { id: '180', label: '6 شهور' },
            { id: '365', label: 'سنة كاملة' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDurationFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                durationFilter === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort & Refresh */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <div className="flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs text-zinc-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="price_asc" className="bg-zinc-900">السعر: من الأقل للأعلى</option>
              <option value="price_desc" className="bg-zinc-900">السعر: من الأعلى للأقل</option>
              <option value="duration_asc" className="bg-zinc-900">المدة: الأقصر أولاً</option>
              <option value="duration_desc" className="bg-zinc-900">المدة: الأطول أولاً</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-zinc-900 text-amber-400 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-800 transition-all cursor-pointer"
            title="تحديث الباقات"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      {loading && packages.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="relative mb-4">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
            <Crown className="w-5 h-5 text-amber-400 absolute inset-0 m-auto" />
          </div>
          <p className="text-zinc-400 text-sm font-bold">جاري تحميل باقات واشتراكات الذئاب...</p>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="py-16 text-center bg-zinc-950/60 rounded-3xl border border-dashed border-zinc-800 p-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">لا توجد باقات تطابق البحث</h3>
          <p className="text-xs text-zinc-400 mb-4">جرّب تغيير كلمات البحث أو الفلاتر المختارة.</p>
          <button
            type="button"
            onClick={() => { setSearch(''); setDurationFilter('all'); }}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-zinc-800 transition-colors"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              packageItem={pkg}
              onSelect={handleSelectPackage}
            />
          ))}
        </div>
      )}

      {/* Subscription Checkout Modal */}
      <AnimatePresence>
        {selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-gradient-to-b from-[#141210] via-[#0d0d10] to-black rounded-3xl border border-amber-500/40 p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.25)] my-8"
            >
              {/* Modal Close Button */}
              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                className="absolute left-4 top-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {!subscriptionSuccess ? (
                <form onSubmit={handleConfirmSubscription} className="space-y-5">
                  {/* Header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-amber-500/15">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-black flex items-center justify-center shadow-gold-glow">
                      <Crown className="w-5 h-5 fill-black" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">تأكيد طلب الاشتراك الرياضي</h3>
                      <p className="text-xs text-zinc-400">انضمام فوري لكتيبة الذئاب</p>
                    </div>
                  </div>

                  {/* Selected Package Summary Card */}
                  <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold block mb-0.5">الباقة المختارة:</span>
                      <h4 className="text-base font-black text-white">{selectedPackage.name}</h4>
                      <span className="text-xs text-zinc-400 font-mono">المدة: {selectedPackage.duration} يوماً</span>
                    </div>

                    <div className="text-left">
                      <span className="text-2xl font-black text-amber-400 font-mono block">
                        {Number(selectedPackage.price).toLocaleString('ar-EG')}
                      </span>
                      <span className="text-[10px] text-zinc-400">جنيه مصري</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">
                      طريقة الدفع وتأكيد الاشتراك:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 0, title: 'الدفع في الجيم', desc: 'كاش في الاستقبال', icon: Banknote },
                        { id: 1, title: 'بطاقة ائتمانية', desc: 'فيزا / ماستركارد', icon: CreditCard },
                        { id: 2, title: 'محفظة / إنستاباي', desc: 'فودافون كاش فوري', icon: Wallet },
                      ].map((pm) => {
                        const Icon = pm.icon;
                        const isSelected = paymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`p-3 rounded-2xl text-right transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-gradient-to-b from-amber-500/20 to-transparent border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                            }`}
                          >
                            <Icon className={`w-4 h-4 mb-2 ${isSelected ? 'text-amber-400' : 'text-zinc-500'}`} />
                            <span className="text-xs font-bold block">{pm.title}</span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">{pm.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Notes */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      ملاحظات أو استفسارات إضافية (اختياري):
                    </label>
                    <textarea
                      rows="2"
                      value={subscriptionNotes}
                      onChange={(e) => setSubscriptionNotes(e.target.value)}
                      placeholder="مثال: يرجى تحديد ميعاد تقييم الـ InBody في الفترة المسائية..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 transition-all resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setSelectedPackage(null)}
                      disabled={subscribing}
                      className="flex-1 py-3 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      disabled={subscribing}
                      className="flex-2 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {subscribing ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>جاري تأكيد الاشتراك...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>تأكيد الاشتراك في الباقة</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Celebration Success View */
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                    <Crown className="w-8 h-8 fill-black" />
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 mb-2">
                      مبروك يا وحش! تم تفعيل اشتراكك وجاهز للتمرين 🔥🐺
                    </h3>
                    <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                      تم اعتماد اشتراكك بنجاح في <span className="text-amber-400 font-bold">{selectedPackage.name}</span>. كارت الوحش واللوكر الخاص بك جاهزان الآن بالصالة!
                    </p>
                  </div>

                  <div className="bg-zinc-900/80 border border-amber-500/20 rounded-2xl p-3 text-xs text-zinc-400 max-w-sm mx-auto flex items-center justify-center gap-2">
                    <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>فريق الاستقبال في انتظارك لتسليم اللوكر وقياس InBody.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPackage(null)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow hover:scale-105 transition-all cursor-pointer"
                  >
                    تم، العودة لقائمة الباقات
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PackagesPricingGrid;
