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
  PhoneCall,
  Building2,
  MapPin,
  QrCode
} from 'lucide-react';
import PackageCard from './PackageCard';
import { packageService, getUserInfo } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

/**
 * PackagesPricingGrid Component
 * Customer & Public View for Gym Membership Plans
 * Features gym pricing cards, search/filter, and subscription guidance to gym reception.
 */
export const PackagesPricingGrid = ({ onOpenAdminManagement, isEmbedded = false, trainerId = null }) => {
  const { user, isAuthenticated, setActiveAuthView } = useAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [durationFilter, setDurationFilter] = useState('all'); // 'all' | '30' | '90' | '180' | '365'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | '0' | '1' | '2'

  // Selected package for reception subscription guidance modal
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Check if current user is gym staff / admin
  const isGymStaff = ['SuperAdmin', 'Manager', 'Receptionist', 'Reception'].includes(user?.role);

  // Fetch Packages from backend API
  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await packageService.getPackages({
        pageNumber: 1,
        pageSize: 50,
        search,
        trainerId: trainerId || undefined,
      });
      setPackages(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.warn('Failed to load packages:', err);
      setPackages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, trainerId]);

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

  // Client-side duration & type filtering & sorting
  const filteredPackages = packages.filter((pkg) => {
    // Hide private trainer packages from general public list (only show them when specifically viewing a trainer)
    if (!trainerId && Number(pkg.type ?? 0) === 1) {
      return false;
    }
    if (typeFilter !== 'all' && Number(pkg.type ?? 0) !== Number(typeFilter)) {
      return false;
    }
    if (durationFilter === 'all') return true;
    const days = Number(pkg.duration);
    if (durationFilter === '30') return days <= 30;
    if (durationFilter === '90') return days > 30 && days <= 90;
    if (durationFilter === '180') return days > 90 && days <= 180;
    if (durationFilter === '365') return days > 180;
    return true;
  });

  // Handle plan selection -> open reception subscription modal
  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    toastInfo('توجه لرسيبشن الجيم للاشتراك', `لتأكيد اشتراكك في ${pkg.name}، ننتظرك بمكتب استقبال صالة WOLVES!`);
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
                <span>عضويات وباقات WOLVES الرسمية</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 tracking-tight">
                خطط وباقات التدريب الرياضية
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                استثمر في قوتك ولياقتك مع باقات مصممة خصيصاً لتناسب أهدافك في صالة WOLVES. باقات شاملة الأجهزة، اللوكرات الذكية، واستشارات الكباتن والـ InBody.
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

        {/* Package Type Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none bg-zinc-950/80 p-1 rounded-2xl border border-zinc-800/80">
          {(trainerId
            ? [
                { id: 'all', label: 'كافة باقات الكابتن' },
                { id: '1', label: 'برايفت' },
              ]
            : [
                { id: 'all', label: 'كافة الباقات العامة' },
                { id: '0', label: 'عادية' },
                { id: '2', label: 'خاصة مشتركة' },
              ]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                typeFilter === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Duration Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'كل المدد' },
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
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Refresh Action */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
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
        /* Golden Skeleton Shimmer */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 sm:p-7 space-y-5 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 bg-zinc-800 rounded" />
                <div className="h-5 w-16 bg-zinc-800 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-6 w-44 bg-zinc-800 rounded" />
                <div className="h-3.5 w-24 bg-zinc-800/60 rounded" />
              </div>
              <div className="h-10 w-32 bg-zinc-800 rounded-lg" />
              <div className="space-y-2.5 pt-2 border-t border-zinc-800/60">
                <div className="h-3.5 w-full bg-zinc-800/40 rounded" />
                <div className="h-3.5 w-5/6 bg-zinc-800/40 rounded" />
                <div className="h-3.5 w-4/6 bg-zinc-800/40 rounded" />
              </div>
              <div className="h-11 bg-zinc-800 rounded-2xl pt-2" />
            </div>
          ))}
        </div>
      ) : filteredPackages.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center bg-zinc-950/60 rounded-3xl border border-dashed border-zinc-800 p-8 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
            {packages.length === 0 ? <Crown className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {packages.length === 0 ? 'لا توجد باقات معروضة حالياً' : 'لا توجد باقات تطابق البحث'}
          </h3>
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            {packages.length === 0
              ? 'يرجى مراجعة إدارة واستقبال الجيم للاطلاع على أحدث العروض والاشتراكات المتاحة.'
              : 'جرّب تغيير كلمات البحث أو الفلاتر المختارة.'}
          </p>
          {packages.length > 0 ? (
            <button
              type="button"
              onClick={() => { setSearch(''); setDurationFilter('all'); }}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              إعادة تعيين الفلاتر
            </button>
          ) : isGymStaff && onOpenAdminManagement ? (
            <button
              type="button"
              onClick={onOpenAdminManagement}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold shadow-gold-glow hover:scale-105 transition-all cursor-pointer"
            >
              إدارة وإضافة الباقات (لوحة المسؤول)
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              packageItem={pkg}
              onSelect={handleSelectPackage}
            />
          ))}
        </div>
      )}

      {/* Reception Subscription Guidance Modal */}
      <AnimatePresence>
        {selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md sm:max-w-lg mx-4 max-h-[92vh] overflow-y-auto gold-scrollbar bg-gradient-to-b from-[#141210] via-[#0d0d10] to-black rounded-3xl border border-amber-500/40 p-5 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.25)] my-auto"
            >
              {/* Modal Close Button */}
              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                className="absolute left-4 top-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-5 text-right">
                {/* Header with Receptionist / Gym Emblem */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-amber-500/20">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-black flex items-center justify-center shadow-gold-glow shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        صالة WOLVES
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 mt-1">
                      توجه لرسيبشن الجيم للاشتراك
                    </h3>
                  </div>
                </div>

                {/* Selected Package Details Pill */}
                <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold block mb-0.5">الباقة المختارة:</span>
                    <h4 className="text-base sm:text-lg font-black text-white">{selectedPackage.name}</h4>
                    <span className="text-xs text-zinc-400 font-mono">المدة: {selectedPackage.duration} يوماً</span>
                  </div>

                  <div className="text-left">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono block">
                      {Number(selectedPackage.price).toLocaleString('ar-EG')}
                    </span>
                    <span className="text-[10px] text-zinc-400">جنيه مصري</span>
                  </div>
                </div>

                {/* Important Guidance Notice */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>تأكيد الاشتراك عبر مكتب الاستقبال</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                    عزيزنا البطل، للاشتراك وتفعيل <strong className="text-amber-400">{selectedPackage.name}</strong> واستلام كود الدخول واللوكر، يرجى التوجه إلى <strong>مكتب استقبال الجيم (Reception)</strong> بالصالة لإتمام التسجيل.
                  </p>
                </div>

                {/* Reception Features / Payment Methods */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-300 block">طرق السداد ومميزات الاستقبال:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                      <Banknote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">طرق دفع متعددة</span>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">كاش، فيزا/ماستركارد، أو إنستاباي InstaPay في الريسبشن.</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">استلام اللوكر والكود</span>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">تفعيل باركود الدخول الذكي وتخصيص اللوكر فوراً.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gym Info / Reception Hours */}
                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>مواعيد العمل: يومياً من 6:00 صباحاً حتى 12:00 منتصف الليل</span>
                  </div>
                  <span className="text-amber-400 font-bold shrink-0">WOLVES</span>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPackage(null)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black text-xs sm:text-sm font-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>فهمت، سأتوجه للاستقبال للاشتراك</span>
                  </button>

                  {isGymStaff && onOpenAdminManagement && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPackage(null);
                        onOpenAdminManagement();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      تسجيل اشتراك لعضو كمسؤول (لوحة الإدارة)
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PackagesPricingGrid;

