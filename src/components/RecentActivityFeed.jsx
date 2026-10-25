import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  LogIn, 
  LogOut, 
  Clock, 
  KeyRound, 
  ArrowUpLeft, 
  Flame, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';

/**
 * RecentActivityFeed Component
 * Displays live check-in and check-out stream with clean pagination
 */
export const RecentActivityFeed = ({ activities = [], onSelectMember }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(activities.length / itemsPerPage) || 1;

  // Reset to page 1 if current page becomes out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [activities.length, totalPages, currentPage]);

  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activities.slice(start, start + itemsPerPage);
  }, [activities, currentPage, itemsPerPage]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div dir="rtl" className="wolf-glass rounded-3xl p-4 sm:p-6 lg:p-7 border border-amber-500/20 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.85)] font-cairo">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5 sm:gap-2">
              سجل حركة الوحوش المباشر
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-400">
              تدفق لحظي لعمليات تسجيل الدخول والخروج في الجيم اليوم
            </p>
          </div>
        </div>

        {/* Total Count Badge */}
        {activities.length > 0 && (
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{activities.length} حركة</span>
          </div>
        )}
      </div>

      {/* Content */}
      {activities.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 text-xs">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-amber-500/50">
            <Flame className="w-6 h-6" />
          </div>
          مفيش حركات اتسجلت لسه النهاردة.. ابدأ بتسجيل دخول أول وحش في الجيم!
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2.5 min-h-[220px]">
            <AnimatePresence mode="popLayout" initial={false}>
              {paginatedActivities.map((item) => {
                const isCheckIn = item.type === 'check-in';

                return (
                  <motion.div
                    key={item.id || `${item.timestamp}-${item.code}-${item.type}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="bg-black/60 hover:bg-zinc-900/80 rounded-2xl p-3.5 border border-zinc-800/80 hover:border-amber-500/30 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          isCheckIn
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {isCheckIn ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white font-mono tracking-wide">
                            {item.code}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-2.5 py-0.5 rounded-full font-bold font-cairo ${
                              isCheckIn
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {isCheckIn ? 'دخل الجيم' : 'خرج وسلم اللوكر'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 font-mono">
                          <span className="flex items-center gap-1 font-cairo">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {new Date(item.timestamp).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                          {item.lockerId && (
                            <span className="flex items-center gap-1 text-amber-400/90 font-cairo font-bold">
                              <KeyRound className="w-3 h-3" />
                              لوكر #{item.lockerId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {onSelectMember && isCheckIn && (
                      <button
                        onClick={() => onSelectMember(item.code)}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold transition-all flex items-center gap-1 shadow-gold-glow flex-shrink-0 cursor-pointer active:scale-95"
                      >
                        <span>تسجيل خروج</span>
                        <ArrowUpLeft className="w-3 h-3" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3 text-xs">
              <span className="text-zinc-500 text-[11px]">
                عرض {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, activities.length)} من إجمالي {activities.length} حركة
              </span>

              <div className="flex items-center gap-1.5">
                {/* Previous (Next in RTL) */}
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-800 hover:border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer font-bold"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span className="hidden sm:inline">السابق</span>
                </button>

                {/* Page Number Indicator */}
                <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-black text-xs">
                  {currentPage} / {totalPages}
                </div>

                {/* Next (Previous in RTL) */}
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-800 hover:border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer font-bold"
                  title="الصفحة التالية"
                >
                  <span className="hidden sm:inline">التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentActivityFeed;
