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
  onToggleStatus,
  isToggling = false,
}) => {
  const { id, number, isActive, isAvailable, createdAt } = locker;

  // Determine state:
  // 1. Inactive / Maintenance (معطل / صيانة)
  // 2. Active & Occupied (نشط ولكن مشغول بكابتن)
  // 3. Active & Available (نشط وجاهز للاستخدام)
  const isMaintenance = !isActive;
  const isOccupied = isActive && !isAvailable;
  const isReady = isActive && isAvailable;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isToggling) return;
    onToggleStatus(id, !isActive);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(locker);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      onClick={() => onEdit(locker)}
      className={`group relative rounded-2xl p-2.5 sm:p-3.5 lg:p-4 cursor-pointer transition-all duration-300 border flex flex-col justify-between overflow-hidden select-none ${
        isMaintenance
          ? 'bg-gradient-to-b from-[#121214] via-[#0d0d0f] to-[#1a0f0f] border-zinc-800/80 hover:border-rose-500/40 shadow-[0_8px_25px_-8px_rgba(244,63,94,0.08)]'
          : isOccupied
          ? 'bg-gradient-to-b from-[#161410] via-[#100f0d] to-[#1a140a] border-amber-500/30 hover:border-amber-500/60 shadow-[0_8px_30px_-8px_rgba(245,158,11,0.18)]'
          : 'bg-gradient-to-b from-[#161510] via-[#111111] to-[#1c1808] border-amber-500/25 hover:border-amber-400/70 shadow-[0_10px_35px_-10px_rgba(245,158,11,0.22)]'
      }`}
    >
      {/* Ambient background glow on hover */}
      <div 
        className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-15 group-hover:opacity-35 transition-opacity pointer-events-none ${
          isMaintenance
            ? 'bg-rose-600'
            : isOccupied
            ? 'bg-amber-600'
            : 'bg-yellow-400'
        }`} 
      />

      {/* Top Bar: Icon + Status Badge */}
      <div className="flex items-center justify-between gap-1 mb-2 relative z-10">
        {/* Status Icon */}
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-lg sm:rounded-xl flex items-center justify-center border transition-all duration-300 shadow-sm flex-shrink-0 ${
            isMaintenance
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 group-hover:bg-rose-500/20'
              : isOccupied
              ? 'bg-amber-500/15 border-amber-500/35 text-amber-400 group-hover:scale-105'
              : 'bg-gradient-to-br from-amber-400/20 to-yellow-500/10 border-amber-500/40 text-amber-300 group-hover:scale-105 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
          }`}
        >
          {isMaintenance ? (
            <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
          ) : isOccupied ? (
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          ) : (
            <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
          )}
        </div>

        {/* Badge */}
        <div className="flex items-center">
          <span
            className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border transition-colors ${
              isMaintenance
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : isOccupied
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isMaintenance
                  ? 'bg-rose-400'
                  : isOccupied
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
              }`}
            />
            <span className="hidden sm:inline">
              {isMaintenance ? 'معطل' : isOccupied ? 'مشغول' : 'متاح'}
            </span>
          </span>
        </div>
      </div>

      {/* Locker Big Visual Number */}
      <div className="my-1 sm:my-1.5 relative z-10">
        <div className="text-[10px] text-zinc-400 font-bold flex items-center justify-between">
          <span>لوكر</span>
          <span className="text-[9px] font-mono text-zinc-500">#{id}</span>
        </div>
        <div className="flex items-baseline gap-0.5 mt-0.5">
          <span className="text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight text-white group-hover:text-amber-400 transition-colors">
            #{number}
          </span>
        </div>
      </div>

      {/* Bottom Controls: Quick Toggle Switch & Edit Action */}
      <div className="pt-2 mt-1 border-t border-zinc-800/80 flex items-center justify-between gap-1 relative z-10">
        {/* Quick Toggle Switch */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            disabled={isToggling}
            onClick={handleToggle}
            aria-label={isActive ? 'إيقاف اللوكر للصيانة' : 'تنشيط اللوكر'}
            title={isActive ? 'اضغط لإيقاف اللوكر مؤقتاً للصيانة' : 'اضغط لتنشيط اللوكر للاستخدام'}
            className={`relative inline-flex h-5 w-9 sm:h-5.5 sm:w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
              isActive ? 'bg-amber-500 shadow-gold-glow' : 'bg-zinc-800'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                isActive ? '-translate-x-4 sm:-translate-x-4.5' : 'translate-x-0'
              }`}
            >
              {isToggling ? (
                <Loader2 className="w-2.5 h-2.5 text-amber-400 animate-spin" />
              ) : (
                <Power
                  className={`w-2 h-2 ${
                    isActive ? 'text-amber-400' : 'text-zinc-500'
                  }`}
                />
              )}
            </span>
          </button>
        </div>

        {/* Edit Button */}
        <button
          type="button"
          onClick={handleEditClick}
          className="p-1 sm:p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/80 transition-all flex items-center gap-0.5 text-[10px] font-bold"
          title="تعديل اللوكر"
        >
          <Edit3 className="w-3 h-3 text-amber-400" />
          <span className="hidden md:inline">تعديل</span>
        </button>
      </div>
    </motion.div>
  );
};

export default LockerCard;
