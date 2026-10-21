import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, LogIn, LogOut, Clock, KeyRound, Trash2, ArrowUpLeft, Flame } from 'lucide-react';

export const RecentActivityFeed = ({ activities = [], onClearActivities, onSelectMember }) => {
  return (
    <div className="wolf-glass rounded-3xl p-6 lg:p-7 border border-amber-500/20 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.85)]">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              سجل حركة الوحوش المباشر
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </h3>
            <p className="text-xs text-zinc-400">
              تدفق لحظي لعمليات تسجيل الدخول والخروج في الجيم اليوم
            </p>
          </div>
        </div>

        {activities.length > 0 && (
          <button
            onClick={onClearActivities}
            className="text-xs text-zinc-400 hover:text-rose-400 p-2 rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-1.5 font-bold"
            title="مسح سجل الحركات"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">مسح السجل</span>
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 text-xs">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-amber-500/50">
            <Flame className="w-6 h-6" />
          </div>
          مفيش حركات اتسجلت لسه النهاردة.. ابدأ بتسجيل دخول أول وحش في الجيم!
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pl-1">
          <AnimatePresence initial={false}>
            {activities.map((item) => {
              const isCheckIn = item.type === 'check-in';

              return (
                <motion.div
                  key={item.id || item.timestamp + item.code}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
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
                          <span className="flex items-center gap-1 text-amber-400/90 font-cairo">
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
                      className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold transition-all flex items-center gap-1 shadow-gold-glow"
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
      )}
    </div>
  );
};

export default RecentActivityFeed;
