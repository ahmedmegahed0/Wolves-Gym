import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Users, Clock, ShieldCheck, XCircle } from 'lucide-react';

export const CustomerFilterTabs = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
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
      label: 'الطلبات المعلقة',
      shortLabel: 'معلقة',
      icon: Clock,
      count: counts.pending,
      activeStyle: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      activeIconStyle: 'text-amber-400',
      activeBadgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold',
      inactiveBadgeStyle: 'bg-white/5 text-zinc-400 border-white/5',
    },
    {
      id: '1',
      label: 'الأعضاء النشطين',
      shortLabel: 'نشطة',
      icon: ShieldCheck,
      count: counts.approved,
      activeStyle: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      activeIconStyle: 'text-emerald-400',
      activeBadgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold',
      inactiveBadgeStyle: 'bg-white/5 text-zinc-400 border-white/5',
    },
    {
      id: '2',
      label: 'الطلبات المرفوضة',
      shortLabel: 'مرفوضة',
      icon: XCircle,
      count: counts.rejected,
      activeStyle: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      activeIconStyle: 'text-rose-400',
      activeBadgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold',
      inactiveBadgeStyle: 'bg-white/5 text-zinc-400 border-white/5',
    },
    {
      id: 'all',
      label: 'كافة المشتركين',
      shortLabel: 'الكل',
      icon: Users,
      count: counts.all,
      activeStyle: 'bg-zinc-800 text-white border-zinc-700',
      activeIconStyle: 'text-amber-400',
      activeBadgeStyle: 'bg-zinc-700 text-zinc-200 border-zinc-600 font-bold',
      inactiveBadgeStyle: 'bg-white/5 text-zinc-400 border-white/5',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Search & Sort Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Live Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4 text-zinc-400" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="بحث بالاسم، رقم الهاتف، أو كود العضو..."
            className="w-full bg-[#121215] text-white placeholder-zinc-500 text-xs sm:text-sm rounded-xl pr-10 pl-9 py-2.5 border border-white/10 hover:border-white/20 focus:border-amber-500/40 focus:outline-none transition-colors font-cairo"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 hover:text-white transition-colors"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
              className={`relative px-3.5 sm:px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-2 whitespace-nowrap border flex-shrink-0 cursor-pointer select-none font-medium ${
                isActive
                  ? tab.activeStyle
                  : 'bg-[#121215] border-white/5 text-zinc-400 hover:text-white hover:border-white/15'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                isActive ? tab.activeIconStyle : 'text-zinc-500'
              }`} />
              
              <span className="hidden sm:inline">
                {tab.label}
              </span>
              <span className="sm:hidden">
                {tab.shortLabel}
              </span>

              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono border transition-colors ${
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
