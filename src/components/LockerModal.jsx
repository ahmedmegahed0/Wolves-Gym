import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, X, Check, Search, ShieldAlert, Crown } from 'lucide-react';

export const LockerModal = ({ isOpen, onClose, selectedLockerId, onSelectLocker, occupiedLockers = [] }) => {
  const [filterSection, setFilterSection] = useState('all'); // all, standard, vip
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Generate 36 lockers with visual layout
  const lockers = Array.from({ length: 36 }, (_, i) => {
    const id = i + 1;
    const isVip = id > 24;
    const isOccupied = occupiedLockers.includes(id);
    return {
      id,
      number: id < 10 ? `0${id}` : `${id}`,
      type: isVip ? 'VIP ذهبي' : 'عادي',
      status: isOccupied ? 'occupied' : 'available',
    };
  });

  const filteredLockers = lockers.filter((l) => {
    if (filterSection === 'vip' && !l.type.includes('VIP')) return false;
    if (filterSection === 'standard' && l.type !== 'عادي') return false;
    if (searchQuery && !l.number.includes(searchQuery)) return false;
    return true;
  });

  return (
    <AnimatePresence>
      <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md font-cairo">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="wolf-glass bg-zinc-950/95 border border-amber-500/25 rounded-3xl p-4 sm:p-6 lg:p-7 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  مخطط وتوزيع اللوكرات الذكي
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-400">
                  اختر لوكر فاضي لتسليمه للعضو فوراً
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 py-3 sm:py-4">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setFilterSection('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                  filterSection === 'all'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-gold-glow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                الكل (36)
              </button>
              <button
                onClick={() => setFilterSection('standard')}
                className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                  filterSection === 'standard'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-gold-glow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                عادي (1-24)
              </button>
              <button
                onClick={() => setFilterSection('vip')}
                className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                  filterSection === 'vip'
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-gold-glow'
                    : 'bg-zinc-900 text-amber-400/80 hover:text-amber-300 border border-amber-500/20'
                }`}
              >
                <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                VIP ذهبي (25-36)
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="ابحث برقم اللوكر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-auto bg-black text-white text-xs pr-8 pl-3 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-zinc-400 pb-2.5 sm:pb-3 border-b border-zinc-800 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> متاح وفاضي
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" /> اللوكر المختار
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" /> مشغول حالياً
            </div>
          </div>

          {/* Grid of Lockers */}
          <div className="flex-1 overflow-y-auto py-3 sm:py-4 pl-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
            {filteredLockers.map((locker) => {
              const isSelected = selectedLockerId === locker.id;
              const isOccupied = locker.status === 'occupied';

              return (
                <button
                  key={locker.id}
                  disabled={isOccupied}
                  onClick={() => {
                    onSelectLocker(locker.id);
                    onClose();
                  }}
                  className={`relative p-3 rounded-2xl flex flex-col items-center justify-between border transition-all duration-200 group ${
                    isSelected
                      ? 'bg-amber-500/25 border-amber-400 text-white shadow-gold-glow scale-105'
                      : isOccupied
                      ? 'bg-zinc-950/40 border-zinc-900 text-zinc-600 cursor-not-allowed opacity-50'
                      : 'bg-zinc-900/70 border-zinc-800 hover:border-amber-500/60 text-zinc-200 hover:bg-zinc-900 hover:scale-105'
                  }`}
                >
                  <div className="flex items-center justify-between w-full text-[10px] text-zinc-400 mb-1 font-mono">
                    <span className={locker.type.includes('VIP') ? 'text-amber-400 font-bold' : ''}>
                      {locker.type}
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                  </div>

                  <span className="text-xl font-mono font-black tracking-tight py-1">
                    #{locker.number}
                  </span>

                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md mt-1 ${
                      isSelected
                        ? 'bg-amber-400 text-black'
                        : isOccupied
                        ? 'bg-zinc-800 text-zinc-500'
                        : 'bg-amber-500/15 text-amber-400 group-hover:bg-amber-400 group-hover:text-black transition-colors'
                    }`}
                  >
                    {isOccupied ? 'مشغول' : isSelected ? 'مختار' : 'فاضي'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              اللوكر المحدد حالياً: <strong className="text-amber-400 font-mono text-sm">{selectedLockerId ? `#${selectedLockerId}` : 'لا يوجد'}</strong>
            </span>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              تم
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LockerModal;
