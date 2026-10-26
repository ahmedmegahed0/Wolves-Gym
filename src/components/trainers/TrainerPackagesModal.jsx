import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Crown, 
  Sparkles, 
  Phone, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Dumbbell, 
  Star, 
  Loader2,
  Calendar,
  Award
} from 'lucide-react';
import { packageService, PACKAGE_TYPES } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

export const TrainerPackagesModal = ({ isOpen, onClose, trainer }) => {
  const { info: toastInfo } = useToast();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const trainerId = trainer?.id || trainer?.trainerId;

  const fetchTrainerPackages = useCallback(async () => {
    if (!trainerId) return;
    setLoading(true);
    try {
      // 1. Try to fetch with trainerId & type
      const res = await packageService.getPackages({
        pageNumber: 1,
        pageSize: 50,
        trainerId,
      });

      const all = Array.isArray(res?.data) ? res.data : [];
      // Filter for private packages for this trainer
      let trainerPkgs = all.filter((p) => {
        const isPrivate = Number(p.type ?? 0) === PACKAGE_TYPES.PRIVATE;
        const matchesId = Number(p.trainerId) === Number(trainerId);
        const matchesName = p.trainerName && trainer?.name && p.trainerName.toLowerCase().includes(trainer.name.toLowerCase());
        return isPrivate && (matchesId || matchesName);
      });

      // If backend doesn't filter on server, fallback fetch all packages
      if (trainerPkgs.length === 0) {
        const fallbackRes = await packageService.getPackages({
          pageNumber: 1,
          pageSize: 100,
        });
        const fallbackList = Array.isArray(fallbackRes?.data) ? fallbackRes.data : [];
        trainerPkgs = fallbackList.filter((p) => {
          const isPrivate = Number(p.type ?? 0) === PACKAGE_TYPES.PRIVATE;
          const matchesId = Number(p.trainerId) === Number(trainerId);
          const matchesName = p.trainerName && trainer?.name && p.trainerName.toLowerCase().includes(trainer.name.toLowerCase());
          return isPrivate && (matchesId || matchesName);
        });
      }

      setPackages(trainerPkgs);
    } catch (err) {
      console.warn('Failed to load trainer packages:', err);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [trainerId, trainer?.name]);

  useEffect(() => {
    if (isOpen && trainerId) {
      fetchTrainerPackages();
    } else {
      setPackages([]);
    }
  }, [isOpen, trainerId, fetchTrainerPackages]);

  if (!isOpen || !trainer) return null;

  const handleSelectPackage = (pkg) => {
    toastInfo(
      'طلب اشتراك تدريب خاص (PT)',
      `لتأكيد اشتراكك في "${pkg.name}" مع ${trainer.name}، ننتظرك بمكتب استقبال صالة WOLVES!`
    );
  };

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

  return (
    <AnimatePresence>
      <div 
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-gradient-to-b from-[#16161d] via-[#101015] to-[#0a0a0d] border border-amber-500/40 rounded-3xl p-5 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-white overflow-hidden my-auto"
        >
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Coach Header Profile */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 border-b border-amber-500/20">
            {/* Avatar */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-zinc-900 to-black border-2 border-amber-500/60 flex items-center justify-center text-amber-400 font-black text-2xl font-mono shadow-2xl overflow-hidden shrink-0">
              {trainer.imageUrl ? (
                <img
                  src={trainer.imageUrl}
                  alt={trainer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span>{trainer.name ? trainer.name.replace(/كابتن\s*/g, '').slice(0, 1).toUpperCase() : 'W'}</span>
                  <Dumbbell className="w-4 h-4 text-amber-400/60 mt-1" />
                </div>
              )}
            </div>

            {/* Coach Details */}
            <div className="flex-1 text-center sm:text-right space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Crown className="w-3.5 h-3.5" />
                  <span>باقات برايفت وتدريب خاص (PT)</span>
                </span>
                {trainer.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {trainer.badge}
                  </span>
                )}
                {trainer.rating && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-black/60 border border-zinc-800 text-xs font-mono text-amber-300 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{Number(trainer.rating).toFixed(1)}</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white">
                {trainer.name}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                {trainer.specialty ? `التخصص: ${trainer.specialty}` : 'مدرب معتمد بكتيبة الذئاب'} • {trainer.yearsOfExperience ? `خبرة ${trainer.yearsOfExperience} سنوات` : ''}
              </p>

              {trainer.phoneNumber && (
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                  <a
                    href={`tel:${trainer.phoneNumber}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 text-xs font-bold transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span dir="ltr" className="font-mono">{trainer.phoneNumber}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Packages Content Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  الباقات المتاحة مع الكابتن
                </h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {packages.length} باقة خاصة
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-xs text-zinc-400">جاري تحميل باقات التدريب الخاص بالكابتن...</p>
              </div>
            ) : packages.length === 0 ? (
              <div className="py-12 px-4 rounded-3xl bg-zinc-950/60 border border-amber-500/15 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Dumbbell className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white">
                  لا توجد باقات تدريب خاص مسجلة لهذا الكابتن حالياً
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  يمكنك التواصل مع الكابتن مباشرة عبر الهاتف، أو التوجه لمكتب استقبال صالة WOLVES للاستفسار عن مواعيد التدريب الخاص (PT) والأسعار المتاحة.
                </p>
                {trainer.phoneNumber && (
                  <div className="pt-2">
                    <a
                      href={`tel:${trainer.phoneNumber}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow hover:scale-105 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                      <span>اتصال بالكابتن الآن</span>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[55vh] overflow-y-auto pr-1">
                {packages.map((pkg) => {
                  const features = pkg.description
                    ? pkg.description.split(/[\n,]+/).map((f) => f.trim()).filter(Boolean)
                    : ['تدريب برايفت ومتابعة شخصية فردية', 'خطة غذائية متكاملة مصممة لجسمك', 'متابعة دورية لقياسات InBody والوزن'];

                  return (
                    <div
                      key={pkg.id}
                      className="group relative rounded-2xl p-5 bg-gradient-to-b from-[#181822] to-[#101016] border border-amber-500/30 hover:border-amber-500/60 shadow-lg flex flex-col justify-between transition-all hover:-translate-y-1"
                    >
                      <div>
                        {/* Header badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Crown className="w-3 h-3" />
                            <span>برايفت</span>
                          </span>

                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-zinc-400">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>{getDurationLabel(pkg.duration)}</span>
                          </span>
                        </div>

                        {/* Package Name */}
                        <h4 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors mb-2">
                          {pkg.name}
                        </h4>

                        {/* Price */}
                        <div className="flex items-baseline gap-1.5 mb-4 pb-3 border-b border-zinc-800">
                          <span className="text-2xl sm:text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                            {Number(pkg.price).toLocaleString('ar-EG')}
                          </span>
                          <span className="text-xs font-bold text-zinc-400">جنيه مصري</span>
                        </div>

                        {/* Features */}
                        <ul className="space-y-2 mb-5">
                          {features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CTA Button */}
                      <button
                        type="button"
                        onClick={() => handleSelectPackage(pkg)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>طلب الاشتراك مع الكابتن</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TrainerPackagesModal;
