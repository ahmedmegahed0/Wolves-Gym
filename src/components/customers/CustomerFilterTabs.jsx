import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, SlidersHorizontal, Users, Clock, ShieldCheck, XCircle } from 'lucide-react';

export const CustomerFilterTabs = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  counts = { all: 0, pending: 0, approved: 0, rejected: 0 },
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  // Debounce search input (only if query value changed)
  useEffect(() => {
    if (localSearch === (searchQuery || '')) return;
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, searchQuery]);

  // Keep in sync if parent clears
  useEffect(() => {
    if (searchQuery !== localSearch) {
      setLocalSearch(searchQuery || '');
    }
  }, [searchQuery]);

  const tabs = [
    {
      id: '0',
      label: 'طلبات الاشتراك الجديدة (معلقة)',
      shortLabel: 'معلقة',
      icon: Clock,
      count: counts.pending,
      activeStyle: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black border-amber-300 shadow-gold-glow font-black',
      activeIconStyle: 'text-black',
      activeBadgeStyle: 'bg-black/25 text-black border-black/30 font-black',
      inactiveBadgeStyle: 'bg-amber-400/10 text-amber-300 border-amber-500/30',
    },
    {
      id: '1',
      label: 'الوحوش النشطة (مقبول)',
      shortLabel: 'نشطة',
      icon: ShieldCheck,
      count: counts.approved,
      activeStyle: 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 text-black border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)] font-black',
      activeIconStyle: 'text-black',
      activeBadgeStyle: 'bg-black/25 text-black border-black/30 font-black',
      inactiveBadgeStyle: 'bg-emerald-400/10 text-emerald-300 border-emerald-500/30',
    },
    {
      id: '2',
      label: 'الاشتراكات المرفوضة',
      shortLabel: 'مرفوضة',
      icon: XCircle,
      count: counts.rejected,
      activeStyle: 'bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.35)] font-black',
      activeIconStyle: 'text-white',
      activeBadgeStyle: 'bg-black/30 text-white border-white/20 font-black',
      inactiveBadgeStyle: 'bg-rose-400/10 text-rose-300 border-rose-500/30',
    },
    {
      id: 'all',
      label: 'كل المشتركين',
      shortLabel: 'الكل',
      icon: Users,
      count: counts.all,
      activeStyle: 'bg-zinc-800 text-white border-zinc-500 shadow-[0_0_15px_rgba(255,255,255,0.15)] font-black',
      activeIconStyle: 'text-amber-400',
      activeBadgeStyle: 'bg-zinc-900 text-zinc-200 border-zinc-700 font-black',
      inactiveBadgeStyle: 'bg-zinc-900 text-zinc-400 border-zinc-800',
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search & Sort Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
        {/* Live Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4 text-amber-400/80" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="ابحث بالاسم، رقم التليفون، أو كود الوحش (WOLF-001)..."
            className="w-full bg-black/70 text-white placeholder-zinc-500 text-xs sm:text-sm rounded-2xl pr-10 pl-9 py-2.5 sm:py-3 border border-zinc-800 hover:border-zinc-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none transition-all shadow-inner font-cairo"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 hover:text-amber-400 transition-colors"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-amber-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="ترتيب حسب"
              className="w-full sm:w-auto bg-zinc-950 text-zinc-300 text-xs rounded-xl pr-9 pl-7 py-2.5 sm:py-3 border border-zinc-800 hover:border-amber-500/40 focus:border-amber-400 focus:outline-none cursor-pointer appearance-none font-cairo font-semibold"
            >
              <option value="">الترتيب الافتراضي (الأحدث)</option>
              <option value="name">ترتيب بالاسم (أ-ي)</option>
              <option value="code">ترتيب بكود العضو</option>
              <option value="weight">الأثقل وزناً</option>
              <option value="createdAt">تاريخ التسجيل</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-zinc-500">
              <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              className={`relative px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs transition-all flex items-center gap-2 whitespace-nowrap border flex-shrink-0 cursor-pointer select-none ${
                isActive
                  ? tab.activeStyle
                  : 'bg-zinc-950/80 border-zinc-800/90 text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-amber-500/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-colors ${
                isActive ? tab.activeIconStyle : 'text-zinc-500 group-hover:text-amber-400'
              }`} />
              
              <span className="hidden sm:inline font-bold">
                {tab.label}
              </span>
              <span className="sm:hidden font-bold">
                {tab.shortLabel}
              </span>

              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                    isActive ? tab.activeBadgeStyle : tab.inactiveBadgeStyle
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerFilterTabs;
