import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Wallet, 
  Calendar, 
  TrendingUp, 
  RefreshCw, 
  CreditCard, 
  Phone, 
  Zap, 
  Banknote, 
  Receipt,
  PieChart,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { subscriptionsService, formatCurrency, PAYMENT_METHODS } from '../../services/subscriptionsService';
import { useToast } from '../../context/ToastContext';

/**
 * FinancialSummaryWidget Component
 * Operation Manager & Executive Dashboard Widget for Treasury, Revenue, and Payment Methods distribution.
 */
export const FinancialSummaryWidget = ({ isStandalone = false }) => {
  const { error: toastError } = useToast();

  // Date filters
  const [fromDate, setFromDate] = useState(() => {
    // Default to start of current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    totalSubscriptionsCount: 0,
    averageTicket: 0,
    methods: {
      0: { label: 'نقدي (كاش في الدرج)', amount: 0, count: 0, percentage: 0, icon: Banknote, color: 'text-amber-400', barBg: 'bg-amber-400' },
      1: { label: 'محفظة إلكترونية (Mobile Wallet)', amount: 0, count: 0, percentage: 0, icon: Phone, color: 'text-purple-400', barBg: 'bg-purple-500' },
      2: { label: 'إنستا باي (InstaPay)', amount: 0, count: 0, percentage: 0, icon: Zap, color: 'text-emerald-400', barBg: 'bg-emerald-400' },
      3: { label: 'بطاقة ائتمان (Credit Card)', amount: 0, count: 0, percentage: 0, icon: CreditCard, color: 'text-cyan-400', barBg: 'bg-cyan-400' },
    }
  });

  // Preset Filters
  const applyPreset = (preset) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(now.getDate() - 7);
      setFromDate(lastWeek.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(startOfMonth.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === 'last30') {
      const last30 = new Date();
      last30.setDate(now.getDate() - 30);
      setFromDate(last30.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === 'all') {
      setFromDate('');
      setToDate('');
    }
  };

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionsService.getFinancialSummary(fromDate, toDate);
      
      // Parse flexible server responses
      const totalRev = Number(res?.totalRevenue ?? res?.totalAmount ?? res?.totalIncome ?? 0);
      const totalCount = Number(res?.totalSubscriptionsCount ?? res?.totalCount ?? res?.count ?? 0);
      const avg = totalCount > 0 ? Math.round(totalRev / totalCount) : 0;

      // Extract methods
      let cashAmt = 0;
      let cashCount = 0;
      let walletAmt = 0;
      let walletCount = 0;
      let instaAmt = 0;
      let instaCount = 0;
      let cardAmt = 0;
      let cardCount = 0;

      if (Array.isArray(res?.paymentMethodsDistribution) || Array.isArray(res?.methods) || Array.isArray(res?.byPaymentMethod)) {
        const list = res?.paymentMethodsDistribution || res?.methods || res?.byPaymentMethod || [];
        list.forEach(m => {
          const methodId = Number(m.paymentMethod ?? m.method ?? m.id);
          const amt = Number(m.amount ?? m.totalAmount ?? m.revenue ?? 0);
          const cnt = Number(m.count ?? m.subscriptionsCount ?? 0);
          if (methodId === 0) { cashAmt = amt; cashCount = cnt; }
          else if (methodId === 1) { walletAmt = amt; walletCount = cnt; }
          else if (methodId === 2) { instaAmt = amt; instaCount = cnt; }
          else if (methodId === 3) { cardAmt = amt; cardCount = cnt; }
        });
      } else if (res && typeof res === 'object') {
        cashAmt = Number(res.cashAmount ?? res.cash ?? res.cashRevenue ?? 0);
        cashCount = Number(res.cashCount ?? 0);
        walletAmt = Number(res.walletAmount ?? res.mobileWallet ?? res.walletRevenue ?? 0);
        walletCount = Number(res.walletCount ?? 0);
        instaAmt = Number(res.instaPayAmount ?? res.instaPay ?? res.instapayRevenue ?? 0);
        instaCount = Number(res.instaPayCount ?? 0);
        cardAmt = Number(res.cardAmount ?? res.creditCard ?? res.creditCardRevenue ?? 0);
        cardCount = Number(res.cardCount ?? 0);
      }

      // If backend gave totalRevenue but all sub-methods are 0, allocate to cash
      if (totalRev > 0 && cashAmt === 0 && walletAmt === 0 && instaAmt === 0 && cardAmt === 0) {
        cashAmt = totalRev;
        cashCount = totalCount;
      }

      const sumMethods = cashAmt + walletAmt + instaAmt + cardAmt || totalRev || 1;
      const calcPct = (amt) => (totalRev > 0 ? Math.round((amt / sumMethods) * 100) : 0);

      setSummaryData({
        totalRevenue: totalRev,
        totalSubscriptionsCount: totalCount,
        averageTicket: avg,
        methods: {
          0: { label: 'نقدي (كاش في الدرج)', amount: cashAmt, count: cashCount, percentage: calcPct(cashAmt), icon: Banknote, color: 'text-amber-400', barBg: 'bg-amber-400' },
          1: { label: 'محفظة إلكترونية (Mobile Wallet)', amount: walletAmt, count: walletCount, percentage: calcPct(walletAmt), icon: Phone, color: 'text-purple-400', barBg: 'bg-purple-500' },
          2: { label: 'إنستا باي (InstaPay)', amount: instaAmt, count: instaCount, percentage: calcPct(instaAmt), icon: Zap, color: 'text-emerald-400', barBg: 'bg-emerald-400' },
          3: { label: 'بطاقة ائتمان (Credit Card)', amount: cardAmt, count: cardCount, percentage: calcPct(cardAmt), icon: CreditCard, color: 'text-cyan-400', barBg: 'bg-cyan-400' },
        }
      });
    } catch (err) {
      console.warn('Financial summary load fallback to local subscriptions:', err);
      // Fallback calculation from local subscriptions history
      try {
        const localList = JSON.parse(localStorage.getItem('gym_wolf_subscriptions_history') || '[]');
        let totalRev = 0;
        let totalCount = localList.length;
        let cashAmt = 0;
        let walletAmt = 0;
        let instaAmt = 0;
        let cardAmt = 0;

        localList.forEach(s => {
          const price = Number(s.packagePrice || 0);
          totalRev += price;
          const method = Number(s.paymentMethod || 0);
          if (method === 0) cashAmt += price;
          else if (method === 1) walletAmt += price;
          else if (method === 2) instaAmt += price;
          else if (method === 3) cardAmt += price;
        });

        const sum = totalRev || 1;
        const calcPct = (amt) => (totalRev > 0 ? Math.round((amt / sum) * 100) : 0);

        setSummaryData({
          totalRevenue: totalRev,
          totalSubscriptionsCount: totalCount,
          averageTicket: totalCount > 0 ? Math.round(totalRev / totalCount) : 0,
          methods: {
            0: { label: 'نقدي (كاش في الدرج)', amount: cashAmt, count: localList.filter(s => Number(s.paymentMethod) === 0).length, percentage: calcPct(cashAmt), icon: Banknote, color: 'text-amber-400', barBg: 'bg-amber-400' },
            1: { label: 'محفظة إلكترونية (Mobile Wallet)', amount: walletAmt, count: localList.filter(s => Number(s.paymentMethod) === 1).length, percentage: calcPct(walletAmt), icon: Phone, color: 'text-purple-400', barBg: 'bg-purple-500' },
            2: { label: 'إنستا باي (InstaPay)', amount: instaAmt, count: localList.filter(s => Number(s.paymentMethod) === 2).length, percentage: calcPct(instaAmt), icon: Zap, color: 'text-emerald-400', barBg: 'bg-emerald-400' },
            3: { label: 'بطاقة ائتمان (Credit Card)', amount: cardAmt, count: localList.filter(s => Number(s.paymentMethod) === 3).length, percentage: calcPct(cardAmt), icon: CreditCard, color: 'text-cyan-400', barBg: 'bg-cyan-400' },
          }
        });
      } catch (localErr) {
        console.error('Local fallback failed:', localErr);
      }
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div dir="rtl" className="w-full space-y-6 font-cairo">
      {/* Top Filter & Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-3xl bg-[#141417] border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>الخزينة والملخص المالي</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                لوحة العمليات والإدارة
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              تحليل شامل لإيرادات الاشتراكات وتوزيعها حسب قنوات السداد
            </p>
          </div>
        </div>

        {/* Date Filters & Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1 bg-[#0c0c0e] p-1 rounded-2xl border border-white/5">
            {[
              { id: 'today', label: 'اليوم' },
              { id: 'week', label: 'آخر 7 أيام' },
              { id: 'month', label: 'هذا الشهر' },
              { id: 'last30', label: 'آخر 30 يوم' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-2 bg-[#0c0c0e] px-3 py-1.5 rounded-2xl border border-white/10 text-xs">
            <span className="text-zinc-500">من:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none text-xs"
            />
            <span className="text-zinc-500">إلى:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none text-xs"
            />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchSummary}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-white/5 transition-colors disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Revenue Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-[#181611] via-[#141417] to-[#0c0c0e] border border-amber-500/30 shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400/90 tracking-wide uppercase">
              إجمالي المبالغ المحصلة (Total Revenue)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">
              {formatCurrency(summaryData.totalRevenue)}
            </h3>
            <p className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>دخل الخزينة الصافي خلال الفترة المحددة</span>
            </p>
          </div>
        </motion.div>

        {/* Subscriptions Count Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden p-6 rounded-3xl bg-[#141417] border border-white/10 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 tracking-wide uppercase">
              عدد الاشتراكات المحصلة (Volume)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-300">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">
              {summaryData.totalSubscriptionsCount.toLocaleString('ar-EG')} <span className="text-xs text-zinc-400 font-normal">اشتراك</span>
            </h3>
            <p className="mt-1 text-[11px] text-zinc-400">
              إجمالي العمليات المسجلة في الخزينة
            </p>
          </div>
        </motion.div>

        {/* Average Ticket Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden p-6 rounded-3xl bg-[#141417] border border-white/10 shadow-xl sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 tracking-wide uppercase">
              متوسط قيمة الاشتراك (Avg Ticket)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-300">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">
              {formatCurrency(summaryData.averageTicket)}
            </h3>
            <p className="mt-1 text-[11px] text-zinc-400">
              معدل الإيراد لكل مشترك جديد
            </p>
          </div>
        </motion.div>
      </div>

      {/* Payment Methods Breakdown Section */}
      <div className="p-6 rounded-3xl bg-[#141417] border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-400" />
              <span>توزيع الخزينة حسب طرق الدفع</span>
            </h3>
            <p className="text-xs text-zinc-400">
              مقارنة دقيقة بين السيولة النقدية في الدرج والمدفوعات الإلكترونية
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              كاش
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              إنستاباي
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              محافظ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              بطاقات
            </span>
          </div>
        </div>

        {/* Visual Multi-Segment Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-3 rounded-full bg-[#0c0c0e] border border-white/5 overflow-hidden flex">
            {Object.entries(summaryData.methods).map(([key, item]) => {
              if (item.percentage === 0) return null;
              return (
                <div
                  key={key}
                  style={{ width: `${item.percentage}%` }}
                  title={`${item.label}: ${item.percentage}%`}
                  className={`${item.barBg} transition-all duration-500`}
                />
              );
            })}
          </div>
        </div>

        {/* Method Detail Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(summaryData.methods).map(([key, item]) => {
            const Icon = item.icon;
            return (
              <div
                key={key}
                className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/5 hover:border-white/10 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl bg-zinc-900 border border-white/5 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-zinc-300">
                      {item.label.split('(')[0].trim()}
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-black ${item.color}`}>
                    {item.percentage}%
                  </span>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-baseline justify-between">
                  <span className="text-sm font-black font-mono text-white">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {item.count} عملية
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryWidget;
