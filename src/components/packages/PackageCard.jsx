import React from 'react';
import { 
  CheckCircle2, 
  Crown, 
  Zap, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Edit3, 
  Power, 
  ArrowLeft,
  Flame,
  Star
} from 'lucide-react';

import { getPackageTypeMeta } from '../../services/apiClient';
import ToggleSwitch from '../common/ToggleSwitch';

/**
 * PackageCard Component
 * Displays a luxury gym pricing card with pricing, duration badge, features list, and CTA button.
 * Supports both customer view and admin quick actions.
 */
export const PackageCard = ({
  packageItem,
  onSelect,
  isAdmin = false,
  onEdit,
  onToggleStatus,
  actionLoading = false,
}) => {
  if (!packageItem) return null;

  const {
    id,
    name,
    price = 0,
    duration = 30,
    description = '',
    isActive = true,
    isPopular = false,
    type = 0,
  } = packageItem;

  const typeMeta = getPackageTypeMeta(type);

  // Split description by newlines or commas into clean feature bullets
  const features = description
    ? description
        .split(/[\n,]+/)
        .map((f) => f.trim())
        .filter(Boolean)
    : ['دخول غير محدود لصالة التدريب', 'استخدام اللوكرات وغرفة التبديل', 'متابعة دورية مع الكباتن'];

  // Calculate duration human-readable label
  const getDurationLabel = (days) => {
    const num = Number(days);
    if (num === 30) return 'شهر واحد (30 يوماً)';
    if (num === 60) return 'شهران (60 يوماً)';
    if (num === 90) return '3 شهور (90 يوماً)';
    if (num === 180) return '6 شهور (180 يوماً)';
    if (num === 365) return 'سنة كاملة (365 يوماً)';
    if (num % 30 === 0) return `${num / 30} شهور`;
    return `${num} يوماً`;
  };

  const isAlphaOrVip = isPopular || (name && (name.includes('ألفا') || name.includes('VIP') || name.includes('الذهبي')));

  return (
    <div
      dir="rtl"
      className={`group relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between overflow-hidden ${
        isAlphaOrVip
          ? 'bg-gradient-to-b from-[#16140e] via-[#0d0d10] to-[#08080a] border-2 border-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.35)] hover:-translate-y-1.5'
          : 'bg-gradient-to-b from-[#101014] to-[#08080a] border border-amber-500/20 shadow-xl hover:border-amber-500/40 hover:-translate-y-1'
      } ${!isActive ? 'opacity-70 grayscale-[30%]' : ''}`}
    >
      {/* Top Ambient Glow for VIP / Popular */}
      {isAlphaOrVip && (
        <div className="absolute top-0 right-0 left-0 h-32 bg-gradient-to-b from-amber-500/15 via-yellow-500/5 to-transparent pointer-events-none" />
      )}

      {/* Decorative Popular Ribbon / Badge */}
      {isAlphaOrVip && (
        <div className="absolute -top-1 left-6">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[11px] font-black px-3.5 py-1 rounded-b-xl shadow-[0_4px_12px_rgba(245,158,11,0.4)] flex items-center gap-1.5 uppercase tracking-wider">
            <Star className="w-3 h-3 fill-black text-black" />
            <span>الباقة الأكثر طلباً</span>
          </div>
        </div>
      )}

      <div>
        {/* Header: Duration Badge, Type Badge & Status */}
        <div className="flex items-center justify-between gap-2 mb-4 pt-1 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
              <Clock className="w-3.5 h-3.5" />
              <span>{getDurationLabel(duration)}</span>
            </span>

            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeMeta.badgeColor}`}>
              <span>{typeMeta.label}</span>
            </span>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              isActive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span>{isActive ? 'متاح للاشتراك' : 'متوقف مؤقتاً'}</span>
          </span>
        </div>

        {/* Package Name */}
        <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-400 transition-colors tracking-tight mb-3">
          {name}
        </h3>

        {/* Price Tag */}
        <div className="mb-6 flex items-baseline gap-1.5 pb-5 border-b border-zinc-800/80">
          <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 font-mono tracking-tight">
            {Number(price).toLocaleString('ar-EG')}
          </span>
          <span className="text-xs font-bold text-zinc-400">جنيه مصري</span>
          <span className="text-[11px] text-zinc-500 font-normal">/ {duration} يوم</span>
        </div>

        {/* Features Checklist */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>مميزات وحوافز الباقة:</span>
          </p>
          <ul className="space-y-2.5">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-2">
        {isAdmin ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onEdit && onEdit(packageItem)}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-amber-500/60"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل الباقة</span>
            </button>

            <div className="w-full py-1.5 px-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300">حالة الباقة</span>
              <ToggleSwitch
                checked={Boolean(isActive)}
                onChange={() => onToggleStatus && onToggleStatus(packageItem)}
                disabled={actionLoading}
                loading={actionLoading}
                activeColor="purple"
                showLabel={true}
                activeLabel="نشطة"
                inactiveLabel="معطلة"
                labelPosition="side"
                size="sm"
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={!isActive}
            onClick={() => onSelect && onSelect(packageItem)}
            className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              isActive
                ? isAlphaOrVip
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
            }`}
          >
            <span>{isActive ? 'اشترك الآن في الباقة' : 'الباقة غير متاحة حالياً'}</span>
            {isActive && <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default PackageCard;
