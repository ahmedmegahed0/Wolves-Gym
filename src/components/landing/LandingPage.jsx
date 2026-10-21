import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Users,
  ShieldCheck,
  Sparkles,
  Crown,
  ArrowUp,
  Clock,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Star,
  Zap,
  Heart,
  Flame,
  Award,
  Loader2,
  QrCode,
  Target,
} from 'lucide-react';
import wolfLogo from '../../assets/logo.png';
import gymBg from '../../assets/gym-bg.jpg';
import { packageService, trainerService } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

/* ═══════════════════════════════════════════
   1. FLOATING LUXURY NAVBAR
   ═══════════════════════════════════════════ */
const Navbar = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'الباقات', target: 'packages' },
    { label: 'المدربين', target: 'trainers' },
    { label: 'مميزاتنا', target: 'highlights' },
  ];

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <motion.header
        dir="rtl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#080808]/85 backdrop-blur-2xl border-b border-amber-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.7)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-black border border-amber-500/40 p-1.5 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <img src={wolfLogo} alt="BE THE WOLF" className="w-full h-full object-contain" />
              </div>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-l from-amber-400 via-yellow-300 to-amber-500 select-none">
              BE THE WOLF
            </h1>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.target}
                type="button"
                onClick={() => scrollTo(link.target)}
                className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-white/5 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-l from-amber-500 via-yellow-400 to-amber-600 text-black text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                لوحة التحكم
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="hidden sm:flex px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white border border-zinc-800 hover:border-amber-500/40 transition-all cursor-pointer"
                >
                  دخول الوحوش
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-l from-amber-500 via-yellow-400 to-amber-600 text-black text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  انضم للكتيبة
                </button>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-amber-400 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="فتح القائمة الرئيسية"
            >
              <div className="w-6 h-5 flex flex-col justify-center gap-1.5">
                <span className={`block h-[2px] bg-current transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[8px]' : ''}`} />
                <span className={`block h-[2px] bg-current transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-[2px] bg-current transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[8px]' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer (Backdrop & Sliding Dark Glass Menu) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-40 md:hidden"
            />
            <motion.div
              dir="rtl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-[290px] max-w-[85vw] backdrop-blur-xl bg-black/90 border-l border-amber-500/20 p-6 z-50 md:hidden flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.9)]"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-6">
                  <div className="flex items-center gap-2.5">
                    <img src={wolfLogo} alt="WOLVES" className="w-8 h-8 object-contain" />
                    <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-yellow-500">
                      WOLVES GYM
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label="إغلاق القائمة"
                  >
                    <span className="text-xl leading-none">✕</span>
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <button
                      key={link.target}
                      type="button"
                      onClick={() => scrollTo(link.target)}
                      className="text-right text-base font-bold text-zinc-300 hover:text-amber-400 py-3 px-3 rounded-xl hover:bg-zinc-900/60 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>{link.label}</span>
                      <ChevronLeft className="w-4 h-4 text-zinc-600" />
                    </button>
                  ))}
                </nav>
              </div>

              {/* Action Buttons at Bottom */}
              <div className="space-y-2 pt-6 border-t border-zinc-800/80 pb-safe">
                {isAuthenticated ? (
                  <button
                    onClick={() => { setMobileOpen(false); navigate('/dashboard'); }}
                    className="w-full py-3 rounded-xl bg-gradient-to-l from-amber-500 via-yellow-400 to-amber-600 text-black text-sm font-black text-center cursor-pointer shadow-gold-glow flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    <span>الانتقال للوحة التحكم</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setMobileOpen(false); navigate('/register'); }}
                      className="w-full py-3 rounded-xl bg-gradient-to-l from-amber-500 via-yellow-400 to-amber-600 text-black text-sm font-black text-center cursor-pointer shadow-gold-glow"
                    >
                      انضم للكتيبة الآن
                    </button>
                    <button
                      onClick={() => { setMobileOpen(false); navigate('/login'); }}
                      className="w-full py-2.5 rounded-xl text-zinc-300 hover:text-white border border-zinc-800 hover:border-amber-500/40 text-xs font-bold text-center cursor-pointer bg-zinc-900/40"
                    >
                      دخول الوحوش
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};


/* ═══════════════════════════════════════════
   2. HERO SECTION – Cinematic Minimal
   ═══════════════════════════════════════════ */
const HeroSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const stats = [
    { value: '+15', label: 'كابتن معتمد', icon: Users },
    { value: '99%', label: 'رضاء الوحوش', icon: Heart },
    { value: '+50', label: 'جهاز دولي', icon: Dumbbell },
  ];

  return (
    <section ref={ref} id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -top-20">
        <img src={gymBg} alt="" className="w-full h-[120%] object-cover filter brightness-[0.18] grayscale-[30%] contrast-125" />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/50 via-transparent to-[#080808]" />
      {/* Gold radial spotlight - responsive without horizontal overflow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[90vw] max-w-[650px] h-[90vw] max-h-[650px] bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <motion.div
        style={{ opacity }}
        dir="rtl"
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center pt-24 sm:pt-32 pb-16"
      >
        {/* Subtle pre-title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-6 sm:mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>كتيبة الذئاب الرياضية</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8 }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight text-white mb-4 sm:mb-6"
        >
          أيقظ{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 via-yellow-300 to-amber-500">
            الوحش
          </span>{' '}
          الذي بداخلك
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="text-sm sm:text-base md:text-lg text-zinc-400 font-semibold max-w-xl mx-auto mb-8 sm:mb-10 px-2"
        >
          القوة، الانضباط، والجسد المثالي يبدأ هنا في WOLVES GYM
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none"
        >
          <button
            onClick={() => scrollTo('packages')}
            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-l from-amber-500 via-yellow-400 to-amber-600 text-black text-sm sm:text-base font-black shadow-[0_0_30px_rgba(245,158,11,0.35)] hover:shadow-[0_0_50px_rgba(245,158,11,0.55)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Crown className="w-5 h-5" />
            <span>اشترك الآن</span>
          </button>
          <button
            onClick={() => scrollTo('highlights')}
            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm sm:text-base font-bold border border-white/10 hover:border-amber-500/30 backdrop-blur transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>استكشف التجربة</span>
          </button>
        </motion.div>

        {/* Floating Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-12 sm:mt-20 flex items-center justify-center gap-2.5 sm:gap-6 flex-wrap"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400/80 flex-shrink-0" />
                <div className="text-right">
                  <div className="text-base sm:text-xl font-black text-white font-mono">{stat.value}</div>
                  <div className="text-[10px] sm:text-xs text-zinc-500 font-bold">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
    </section>
  );
};


/* ═══════════════════════════════════════════
   3. BENTO HIGHLIGHTS GRID (1 col mobile -> 2 cols tablet -> 4 cols desktop)
   ═══════════════════════════════════════════ */
const HighlightsSection = () => {
  const highlights = [
    {
      icon: Dumbbell,
      title: 'أجهزة عالمية',
      desc: 'أحدث المعدات المتطورة من Life Fitness و Hammer Strength لصنع عضلات حقيقية.',
    },
    {
      icon: Award,
      title: 'مدربين دوليين',
      desc: 'نخبة كباتن معتمدين دولياً لمتابعة تدريبك وتغذيتك خطوة بخطوة.',
    },
    {
      icon: Heart,
      title: 'استشفاء متكامل',
      desc: 'غرف ساونا، حمامات استشفاء، وجلسات استريتشنج لسرعة التعافي العضلي.',
    },
    {
      icon: QrCode,
      title: 'عضويات ذكية',
      desc: 'دخول سريع بالباركود، إدارة ذكية للوكرات وتتبع مباشر لنسبة إشغال الصالة.',
    },
  ];

  return (
    <section id="highlights" dir="rtl" className="relative py-16 sm:py-24 px-4 sm:px-6 bg-[#080808]">
      {/* Subtle ambient */}
      <div className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-400 text-[11px] font-bold mb-3 sm:mb-4">
            <Target className="w-3 h-3" />
            <span>ليه WOLVES GYM؟</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white">
            تجربة رياضية{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-yellow-500">
              لا تُنسى
            </span>
          </h2>
        </motion.div>

        {/* Bento Grid: 1 col on mobile -> 2 cols on tablet -> 4 cols on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group relative p-6 sm:p-7 rounded-3xl bg-[#111113]/80 border border-white/[0.04] hover:border-amber-500/25 transition-all duration-500 overflow-hidden cursor-default flex flex-col justify-between"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 font-semibold leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};


/* ═══════════════════════════════════════════
   4. LIVE PACKAGES PRICING (1 col mobile -> 3 cols desktop)
   ═══════════════════════════════════════════ */
const PackagesSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await packageService.getPackages({ pageNumber: 1, pageSize: 12, sortBy: 'price_asc' });
        setPackages(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        console.warn('Landing page packages fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  // Find "most popular"
  const mostPopularId = packages.length > 0
    ? packages.reduce((best, pkg) => Number(pkg.price) > Number(best.price) ? pkg : best, packages[0])?.id
    : null;

  const getDurationLabel = (days) => {
    const d = Number(days);
    if (d <= 7) return 'أسبوع';
    if (d <= 30) return 'شهر';
    if (d <= 60) return 'شهرين';
    if (d <= 90) return '3 شهور';
    if (d <= 180) return '6 شهور';
    if (d <= 365) return 'سنة';
    return `${d} يوم`;
  };

  const handleSubscribe = (pkg) => {
    if (isAuthenticated) {
      navigate('/dashboard/packages');
    } else {
      navigate('/register');
    }
  };

  return (
    <section id="packages" dir="rtl" className="relative py-16 sm:py-24 px-4 sm:px-6 bg-[#080808]">
      {/* Ambient */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90vw] max-w-[600px] h-[90vw] max-h-[600px] bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-400 text-[11px] font-bold mb-3 sm:mb-4">
            <Crown className="w-3 h-3" />
            <span>باقات العضوية</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-3">
            اختار باقتك،{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-yellow-500">
              ابدأ التحول
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-semibold max-w-md mx-auto">
            خطط تدريب مرنة تناسب مستواك الرياضي وأهدافك
          </p>
        </motion.div>

        {/* Packages Grid: 1 col on mobile -> 2 cols on tablet -> 3 cols on desktop */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
              <span className="text-xs text-zinc-500 font-bold">جاري تحميل الباقات...</span>
            </div>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-sm font-bold">لا توجد باقات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {packages.slice(0, 6).map((pkg, idx) => {
              const isPopular = pkg.id === mostPopularId;
              return (
                <motion.div
                  key={pkg.id || idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className={`group relative rounded-3xl p-[1px] transition-all duration-500 flex flex-col ${
                    isPopular
                      ? 'bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 shadow-[0_0_40px_rgba(245,158,11,0.22)]'
                      : 'bg-gradient-to-b from-white/[0.08] to-transparent hover:from-amber-500/20'
                  }`}
                >
                  <div className="relative rounded-[23px] bg-[#0d0d0f] p-6 sm:p-7 flex-1 flex flex-col justify-between pt-8 sm:pt-9">
                    {/* Popular badge without breaking grid height */}
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-l from-amber-500 to-yellow-400 text-black text-[11px] font-black shadow-lg whitespace-nowrap flex items-center gap-1">
                        <span>⭐ الأكثر طلباً</span>
                      </div>
                    )}

                    <div>
                      {/* Name & Duration */}
                      <div className="mb-4">
                        <h3 className="text-base sm:text-lg font-black text-white mb-1">
                          {pkg.name || 'باقة رياضية'}
                        </h3>
                        <span className="text-[11px] text-zinc-400 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          {getDurationLabel(pkg.duration)} — {pkg.duration} يوم
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mb-5 pb-4 border-b border-zinc-800/80">
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-3xl sm:text-4xl font-black font-mono ${
                            isPopular ? 'text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-yellow-300' : 'text-white'
                          }`}>
                            {Number(pkg.price).toLocaleString('ar-EG')}
                          </span>
                          <span className="text-xs text-zinc-400 font-bold">ج.م</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2.5 mb-6">
                        {(pkg.description || 'تدريب شامل — أجهزة حديثة — كابتن شخصي — قياس InBody').split(/[—\-•,]/).filter(Boolean).slice(0, 4).map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2 text-xs text-zinc-300">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            <span>{feat.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => handleSubscribe(pkg)}
                      className={`w-full py-3.5 rounded-2xl text-sm font-black transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] min-h-[46px] ${
                        isPopular
                          ? 'bg-gradient-to-l from-amber-500 via-yellow-400 to-amber-600 text-black shadow-gold-glow'
                          : 'bg-white/5 hover:bg-amber-500/10 text-white border border-white/[0.08] hover:border-amber-500/30'
                      }`}
                    >
                      {isAuthenticated ? 'اشترك الآن' : 'سجّل واشترك'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};


/* ═══════════════════════════════════════════
   5. TRAINERS CAROUSEL (Smooth Touch Scroll)
   ═══════════════════════════════════════════ */
const TrainersShowcase = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await trainerService.getTrainers({ pageNumber: 1, pageSize: 12 });
        setTrainers(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        console.warn('Landing trainers fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const getSpecialtyLabel = (s) => {
    if (!s) return 'لياقة بدنية شاملة';
    return s;
  };

  return (
    <section id="trainers" dir="rtl" className="relative py-16 sm:py-24 px-4 sm:px-6 bg-[#080808]">
      {/* Ambient */}
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-400 text-[11px] font-bold mb-3 sm:mb-4">
            <ShieldCheck className="w-3 h-3" />
            <span>كتيبة الكباتن</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-3">
            كباتن{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-yellow-500">
              محترفين
            </span>{' '}
            يقودونك للقمة
          </h2>
        </motion.div>

        {/* Carousel */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
          </div>
        ) : trainers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-sm font-bold">سيتم عرض الكباتن قريباً</p>
          </div>
        ) : (
          <div className="relative">
            {/* Scroll Buttons */}
            <button
              type="button"
              onClick={() => scroll('right')}
              className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#111]/90 border border-amber-500/30 text-amber-400 items-center justify-center hover:bg-amber-500/10 transition-colors cursor-pointer shadow-lg"
              aria-label="التالي"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('left')}
              className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#111]/90 border border-amber-500/30 text-amber-400 items-center justify-center hover:bg-amber-500/10 transition-colors cursor-pointer shadow-lg"
              aria-label="السابق"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Cards Strip - Smooth Touch Scroll */}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory touch-pan-x no-scrollbar px-1 py-3"
              style={{ scrollbarWidth: 'none' }}
            >
              {trainers.map((trainer, idx) => {
                const initial = trainer.name ? trainer.name.replace(/كابتن\s*/g, '').slice(0, 1).toUpperCase() : 'W';
                return (
                  <motion.div
                    key={trainer.id || idx}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.06 }}
                    className="snap-center group flex-shrink-0 w-60 sm:w-64 rounded-3xl bg-[#111113]/80 border border-white/[0.04] hover:border-amber-500/25 p-5 sm:p-6 transition-all duration-500 cursor-default"
                  >
                    {/* Avatar */}
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute -inset-1 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1a1a1e] to-[#0e0e10] border border-amber-500/20 flex items-center justify-center text-xl font-black text-amber-400 font-mono">
                        {initial}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="text-center">
                      <h4 className="text-sm font-black text-white mb-1 truncate">
                        {trainer.name || 'كابتن الذئاب'}
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-semibold mb-3 truncate">
                        {getSpecialtyLabel(trainer.specialty)}
                      </p>

                      {/* Experience */}
                      {trainer.yearsOfExperience > 0 && (
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-400 font-bold">
                          <Star className="w-3 h-3" />
                          <span>{trainer.yearsOfExperience} سنة خبرة</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Hide scrollbar globally for this carousel */}
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </section>
  );
};


/* ═══════════════════════════════════════════
   6. SLEEK FOOTER (Clean Branded SVGs)
   ═══════════════════════════════════════════ */
const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer dir="rtl" className="relative bg-[#060606] border-t border-white/[0.04] pt-14 pb-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-black border border-amber-500/30 p-1.5 shadow-gold-glow">
                <img src={wolfLogo} alt="WOLVES" className="w-full h-full object-contain" />
              </div>
              <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-yellow-500 tracking-wider">
                WOLVES GYM
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed max-w-xs">
              منظومة رياضية متكاملة لصنع أجسام وعقول الذئاب. القوة ليست خياراً، هي أسلوب حياة.
            </p>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              مواعيد العمل
            </h4>
            <div className="space-y-2 text-xs text-zinc-400 font-semibold">
              <div className="flex justify-between">
                <span>السبت – الخميس</span>
                <span className="text-zinc-200 font-mono">6:00 ص — 12:00 م</span>
              </div>
              <div className="flex justify-between">
                <span>الجمعة</span>
                <span className="text-zinc-200 font-mono">2:00 م — 12:00 م</span>
              </div>
            </div>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              تواصل معنا
            </h4>
            <div className="space-y-2 text-xs text-zinc-400 font-semibold mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                <span>القاهرة، مصر</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                <span dir="ltr">+20 100 000 0000</span>
              </div>
            </div>

            {/* Social SVGs */}
            <div className="flex items-center gap-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/40 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/40 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-zinc-600 font-semibold">
            © {new Date().getFullYear()} WOLVES GYM — جميع الحقوق محفوظة لكتيبة الذئاب
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-amber-500/20 text-zinc-400 hover:text-amber-400 text-[10px] font-bold transition-all cursor-pointer"
          >
            <ArrowUp className="w-3 h-3" />
            <span>العودة للأعلى</span>
          </button>
        </div>
      </div>
    </footer>
  );
};


/* ═══════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   ═══════════════════════════════════════════ */
const LandingPage = () => {
  return (
    <div className="bg-[#080808] text-white font-cairo selection:bg-amber-500 selection:text-black overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <HighlightsSection />
      <PackagesSection />
      <TrainersShowcase />
      <Footer />
    </div>
  );
};

export default LandingPage;
