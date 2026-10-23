import React from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  Wrench, 
  Edit3, 
  Power, 
  Loader2, 
  CheckCircle2, 
  ShieldAlert,
  Clock
} from 'lucide-react';

/**
 * LockerCard: Single Locker Card within the Interactive Visual Grid / Matrix
 * Displays: Locker #, Lock icon, Status badge, Quick Toggle Switch, and Edit action.
 */
export const LockerCard = ({
  locker,
  onEdit,
}) => {
  const { id, number, isActive, isAvailable } = locker;

  const isMaintenance = !isActive;
  const isOccupied = isActive && !isAvailable;
  const isReady = isActive && isAvailable;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={() => onEdit(locker)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(locker);
        }
      }}
      className={`group relative rounded-xl sm:rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 border flex flex-col justify-between overflow-hidden select-none ${
        isMaintenance
          ? 'bg-[#121215] border-rose-500/20 hover:border-rose-500/40 text-zinc-300'
          : isOccupied
          ? 'bg-[#141418] border-white/10 hover:border-amber-500/30 text-zinc-300'
          : 'bg-[#141418] border-white/10 hover:border-emerald-500/30 text-zinc-200'
      }`}
    >
      {/* Top Bar: Subtle Status Icon + Status Badge */}
      <div className="flex items-center justify-between gap-1 mb-2 relative z-10">
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-colors ${
            isMaintenance
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : isOccupied
              ? 'bg-zinc-800/80 border-white/5 text-zinc-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}
        >
          {isMaintenance ? (
            <Wrench className="w-3.5 h-3.5" />
          ) : isOccupied ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Unlock className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Calm Status Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
            isMaintenance
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              : isOccupied
              ? 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isMaintenance
                ? 'bg-rose-400'
                : isOccupied
                ? 'bg-zinc-400'
                : 'bg-emerald-400'
            }`}
          />
          <span>
            {isMaintenance ? 'معطل' : isOccupied ? 'مشغول' : 'متاح'}
          </span>
        </span>
      </div>

      {/* Locker Big Clean Number */}
      <div className="my-1.5 relative z-10">
        <div className="text-[10px] text-zinc-500 font-mono">لوكر #{id}</div>
        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white group-hover:text-amber-300 transition-colors mt-0.5">
          #{number}
        </div>
      </div>

      {/* Subtle bottom hint */}
      <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
        <span>إدارة اللوكر</span>
        <Edit3 className="w-3 h-3 text-zinc-600 group-hover:text-amber-400 transition-colors" />
      </div>
    </motion.div>
  );
};

export default LockerCard;
