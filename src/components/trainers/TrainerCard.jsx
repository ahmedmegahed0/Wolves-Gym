import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Award, 
  Star, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  Dumbbell, 
  Flame, 
  CheckCircle2, 
  ChevronLeft,
  Crown
} from 'lucide-react';

/**
 * Specialty icon and color mapping
 */
const getSpecialtyBadge = (specialty = '') => {
  if (specialty.includes('كمال') || specialty.includes('تضخيم')) {
    return {
      label: specialty || 'كمال أجسام وتضخيم',
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: Dumbbell,
    };
  }
  if (specialty.includes('قوة') || specialty.includes('Power')) {
    return {
      label: specialty || 'قوة بدنية وPowerlifting',
      color: 'bg-red-500/15 text-red-400 border-red-500/30',
      icon: Flame,
    };
  }
  if (specialty.includes('فتنس') || specialty.includes('تخسيس')) {
    return {
      label: specialty || 'فتنس وتخسيس',
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: Award,
    };
  }
  return {
    label: specialty || 'لياقة وظيفية شاملة',
    color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    icon: Dumbbell,
  };
};

/**
 * TrainerCard Component
 * Displays a luxury athletic coach profile card with gold accents,
 * badges, specialization, experience, and contact options.
 */
export const TrainerCard = ({ trainer, onSelect = null }) => {
  if (!trainer) return null;

  const badgeInfo = getSpecialtyBadge(trainer.specialty);
  const SpecialtyIcon = badgeInfo.icon;
  const initial = trainer.name ? trainer.name.replace(/كابتن\s*/g, '').slice(0, 1).toUpperCase() : 'W';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25 }}
      onClick={() => onSelect && onSelect(trainer)}
      className={`group relative bg-gradient-to-b from-[#141419] via-[#0f0f13] to-[#09090b] border border-amber-500/20 hover:border-amber-500/60 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xl hover:shadow-[0_0_35px_rgba(245,158,11,0.22)] transition-all duration-300 font-cairo overflow-hidden ${
        onSelect ? 'cursor-pointer' : ''
      }`}
    >
      {/* Ambient Gold Radial Flare on Hover */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />

      <div>
        {/* Top Header: Badge + Certified Pill */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
            <span>{trainer.badge || 'كابتن معتمد'}</span>
          </div>

          {trainer.rating && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 border border-zinc-800 text-[11px] font-mono text-amber-300 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{Number(trainer.rating).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Coach Visual Avatar / Ring */}
        <div className="flex flex-col items-center text-center my-2">
          <div className="relative mb-3">
            {/* Glowing Golden Ring */}
            <div className="absolute -inset-1 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition duration-300" />
            
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-b from-zinc-900 to-black border-2 border-amber-500/60 flex items-center justify-center text-amber-400 font-black text-2xl font-mono shadow-2xl overflow-hidden">
              {trainer.imageUrl ? (
                <img
                  src={trainer.imageUrl}
                  alt={trainer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span>{initial}</span>
                  <Dumbbell className="w-3.5 h-3.5 text-amber-400/60 mt-0.5" />
                </div>
              )}
            </div>

            {/* Online / Active Coach Indicator */}
            <span className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>

          {/* Coach Name */}
          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1">
            {trainer.name}
          </h3>

          {/* Specialization Badge */}
          <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${badgeInfo.color}`}>
            <SpecialtyIcon className="w-3.5 h-3.5" />
            <span>{badgeInfo.label}</span>
          </div>

          {/* Bio / Quote */}
          <p className="text-xs text-zinc-400 mt-3 line-clamp-2 leading-relaxed px-1 text-center">
            {trainer.bio || 'مدرب معتمد بكتيبة الذئاب لمتابعة خطط التدريب والقياسات البدنية والتغذية.'}
          </p>
        </div>

        {/* Key Metrics / Highlights Row */}
        <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-zinc-800/80 text-xs">
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-zinc-500 block">سنوات الخبرة</span>
            <span className="font-mono font-black text-amber-400 text-sm">
              {trainer.yearsOfExperience ? `${trainer.yearsOfExperience} سنوات` : '--'}
            </span>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-zinc-500 block">المتدربين</span>
            <span className="font-mono font-black text-zinc-200 text-sm">
              {trainer.clientsCount ? `+${trainer.clientsCount} وحش` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Contact / Booking Actions */}
      <div className="space-y-2 pt-2">
        {trainer.phoneNumber && (
          <a
            href={`tel:${trainer.phoneNumber}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/30 text-zinc-300 hover:text-amber-400 text-xs font-bold transition-all flex items-center justify-center gap-2 group/btn"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400 group-hover/btn:scale-110 transition-transform" />
            <span dir="ltr" className="font-mono text-[11px]">{trainer.phoneNumber}</span>
          </a>
        )}

        {onSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(trainer);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>باقات الكابتن الخاصة (PT)</span>
            <ChevronLeft className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default TrainerCard;
