import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  KeyRound, 
  X, 
  Check, 
  Search, 
  ShieldAlert, 
  Crown, 
  Loader2, 
  RefreshCw,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { lockerService } from '../services/apiClient';

/**
 * LockerModal: Interactive visual dialog to pick an available locker during check-in.
 * Fetches real active lockers from backend API and allows 1-click selection.
 */
export const LockerModal = ({ 
  isOpen, 
  onClose, 
  selectedLockerId, 
  onSelectLocker, 
  occupiedLockers = [],
  initialLockers = []
}) => {
  const [filterSection, setFilterSection] = useState('all'); // all, available, occupied
  const [searchQuery, setSearchQuery] = useState('');
  const [lockers, setLockers] = useState(initialLockers || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync initialLockers if provided
  useEffect(() => {
    if (initialLockers && initialLockers.length > 0) {
      setLockers(initialLockers);
    }
  }, [initialLockers]);

  // Fetch / refresh on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchRealLockers = async () => {
      // Only show full loader if we have zero lockers in state
      setLockers((prev) => {
        if (!prev || prev.length === 0) {
          setLoading(true);
        }
        return prev;
      });
      setError(null);

      try {
        const data = await lockerService.getLockers();
        if (isMounted) {
          if (Array.isArray(data)) {
            setLockers(data);
          } else {
            setLockers([]);
          }
        }
      } catch (err) {
        console.warn('LockerModal fetch error:', err);
        if (isMounted) {
          setError(err.friendlyMessage || 'تعذر تحميل اللوكرات من السيرفر');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRealLockers();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Active lockers only for check-in
  const activeLockers = lockers.filter((l) => l.isActive);

  const filteredLockers = activeLockers.filter((l) => {
    const isOccupied = !l.isAvailable || occupiedLockers.includes(Number(l.number)) || occupiedLockers.includes(Number(l.id));
    if (filterSection === 'available' && isOccupied) return false;
    if (filterSection === 'occupied' && !isOccupied) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().replace(/^#/, '');
      if (!String(l.number).includes(q)) return false;
    }
    return true;
  });

  const availableCount = activeLockers.filter(
    (l) => l.isAvailable && !occupiedLockers.includes(Number(l.number)) && !occupiedLockers.includes(Number(l.id))
  ).length;

  const occupiedCount = activeLockers.length - availableCount;

  return (
    <AnimatePresence>
      <div 
        dir="rtl" 
        className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md font-cairo"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="wolf-glass bg-zinc-950/95 border border-amber-500/25 rounded-3xl p-4 sm:p-6 lg:p-7 max-w-2xl w-full mx-4 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  مخطط وتوزيع اللوكرات الذكي (Check-in Bay)
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-400">
                  اختر لوكر فاضي ومتاح لتسليمه للكابتن فوراً بنقرة واحدة
                </p>
              </div>
            </div>
            <button
              type="button"
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
                type="button"
                onClick={() => setFilterSection('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                  filterSection === 'all'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-gold-glow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                الكل ({activeLockers.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterSection('available')}
                className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                  filterSection === 'available'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-gold-glow'
                    : 'bg-zinc-900 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                المتاحة فقط ({availableCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterSection('occupied')}
                className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                  filterSection === 'occupied'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                مشغولة ({occupiedCount})
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
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" /> متاح وفاضي
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> اللوكر المختار
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" /> مشغول حالياً
            </div>
          </div>

          {/* Grid of Lockers */}
          <div className="flex-1 overflow-y-auto py-3 sm:py-4 pl-1 min-h-[220px] gold-scrollbar">
            {loading && lockers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs text-zinc-400 font-bold">جاري تحميل بيانات اللوكرات...</p>
              </div>
            ) : filteredLockers.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                {filteredLockers.map((locker) => {
                  const isSelected = Number(selectedLockerId) === Number(locker.number);
                  const isOccupied = !locker.isAvailable || occupiedLockers.includes(Number(locker.number)) || occupiedLockers.includes(Number(locker.id));

                  return (
                    <button
                      type="button"
                      key={locker.id}
                      disabled={isOccupied}
                      onClick={() => {
                        onSelectLocker(locker.number);
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
                        <span>لوكر</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
                      </div>

                      <span className="text-2xl font-mono font-black tracking-tight py-1 text-white group-hover:text-amber-400 transition-colors">
                        #{locker.number}
                      </span>

                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md mt-1 ${
                          isSelected
                            ? 'bg-amber-400 text-black'
                            : isOccupied
                            ? 'bg-zinc-800 text-zinc-500'
                            : 'bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-400 group-hover:text-black transition-colors'
                        }`}
                      >
                        {isOccupied ? 'مشغول' : isSelected ? 'مختار' : 'فاضي'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-zinc-500" />
                <p className="text-xs font-bold text-white">
                  {activeLockers.length === 0
                    ? 'لا توجد لوكرات مسجلة في النظام بعد'
                    : 'لا توجد لوكرات مطابقة للبحث أو الفلتر المحدد'}
                </p>
                {activeLockers.length === 0 && (
                  <p className="text-[11px] text-zinc-500 max-w-xs">
                    يمكنك إضافة دواليب جديدة من لوحة تحكم وإدارة اللوكرات.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              اللوكر المحدد حالياً: <strong className="text-amber-400 font-mono text-sm">{selectedLockerId ? `#${selectedLockerId}` : 'لا يوجد'}</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LockerModal;
