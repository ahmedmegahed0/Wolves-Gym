import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Users,
  ShieldCheck,
  Sparkles,
  Crown,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  Star,
  Zap,
  Flame,
  Award,
  QrCode,
  Target,
  Building2,
  Banknote,
  Check,
  X,
  AlertCircle,
  Play,
  ArrowLeft,
  ChevronDown,
  Layers,
  Heart,
  TrendingUp,
  Activity,
  Maximize2,
  User,
  LogOut
} from 'lucide-react';

// Brand & Visual Assets
import wolfLogo from '../../assets/logo.png';
import logoEmblem from '../../assets/logo-emblem.png';
import heroAthlete from '../../assets/hero-athlete.jpg';
import wolfAbout from '../../assets/wolf-about.jpg';
import wolvesApp from '../../assets/wolves-app.jpg';
import facilityStrength from '../../assets/gym-machines.jpg';
import facilityCardio from '../../assets/cardio-zone.jpg';
import facilityFunctional from '../../assets/gym-bg.jpg';
import facilityLockers from '../../assets/lockers-zone.jpg';
import facilitySpa from '../../assets/gym-spa.jpg';

import { useAuth } from '../../context/AuthContext';
import { packageService, trainerService, getRoleMeta } from '../../services/apiClient';

/* ═══════════════════════════════════════════════════════════════════════════
   1. FLOATING LUXURY NAVBAR (طراز عصري فاخر)
   ═══════════════════════════════════════════════════════════════════════════ */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, redirectUserByRole } = useAuth();
  const roleMeta = getRoleMeta(user?.role);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'الرئيسية', target: 'hero' },
    { label: 'عن وولفز', target: 'about' },
    { label: 'الباقات', target: 'packages' },
    { label: 'المدربين', target: 'coaches' },
    { label: 'المرافق', target: 'facilities' },
    { label: 'التطبيق', target: 'app' },
    { label: 'تواصل معنا', target: 'contact' },
  ];

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGoToDashboard = () => {
    setUserDropdownOpen(false);
    if (redirectUserByRole) {
      redirectUserByRole(user);
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    setUserDropdownOpen(false);
    logout();
  };

  return (
    <>
      <header
        dir="rtl"
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#08080a]/90 backdrop-blur-2xl border-b border-amber-500/15 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.8)]'
            : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4 sm:py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl blur-md opacity-30 group-hover:opacity-75 transition duration-500" />
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-black border border-amber-500/40 p-1.5 shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center">
                <img src={wolfLogo} alt="WOLVES" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 font-mono">
                WOLVES
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#101014]/70 border border-white/[0.06] px-3 py-1.5 rounded-full backdrop-blur-xl">
            {navLinks.map((link) => (
              <button
                key={link.target}
                type="button"
                onClick={() => scrollTo(link.target)}
                className="px-3.5 py-1.5 text-xs font-bold text-zinc-300 hover:text-amber-400 transition-colors rounded-full hover:bg-white/[0.04] cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Action Buttons / User Avatar Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 sm:gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-2xl bg-zinc-950/80 hover:bg-zinc-900 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer group shadow-[0_0_20px_rgba(245,158,11,0.15)] select-none"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  title="حسابي ولوحة التحكم"
                >
                  {/* User Avatar Circle */}
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-[1.5px] shadow-gold-glow">
                      <div className="w-full h-full rounded-[10px] bg-black flex items-center justify-center text-amber-300 font-mono font-black text-xs sm:text-sm">
                        {user?.name ? user.name.slice(0, 1).toUpperCase() : 'W'}
                      </div>
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black" />
                  </div>

                  {/* User Name & Role (Desktop) */}
                  <div className="text-right hidden sm:block max-w-[120px]">
                    <span className="text-xs font-black text-white block truncate group-hover:text-amber-300 transition-colors">
                      {user?.name || 'وحش الجيم'}
                    </span>
                    <span className="text-[10px] text-amber-400/90 font-mono block truncate font-bold">
                      {roleMeta.badge || roleMeta.label}
                    </span>
                  </div>

                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-64 rounded-2xl bg-gradient-to-b from-[#141419] via-[#0f0f13] to-black border border-amber-500/30 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-50 overflow-hidden font-cairo text-right"
                    >
                      {/* Top User Info Card */}
                      <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/80 mb-1.5">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-xs font-mono shrink-0">
                            {user?.name ? user.name.slice(0, 1).toUpperCase() : 'W'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-white block truncate">
                              {user?.name || 'وحش الجيم'}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block truncate">
                              {user?.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px]">
                          <span className="text-zinc-500 font-semibold">الصلاحية:</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 font-mono">
                            {roleMeta.fullTitle || roleMeta.label}
                          </span>
                        </div>
                      </div>

                      {/* Action 1: Enter Dashboard */}
                      <button
                        type="button"
                        onClick={handleGoToDashboard}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black text-amber-300 hover:text-black bg-amber-500/10 hover:bg-gradient-to-r hover:from-amber-500 hover:to-yellow-400 border border-amber-500/20 hover:border-transparent transition-all cursor-pointer group mb-1 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-400 group-hover:text-black transition-colors" />
                          <span>الدخول للوحة التحكم</span>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                      </button>

                      {/* Action 2: Logout */}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                          <span>تسجيل الخروج</span>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white border border-zinc-800 hover:border-amber-500/40 transition-all cursor-pointer"
                >
                  دخول الوحوش
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black text-xs sm:text-sm font-black shadow-gold-glow hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  انضم للكتيبة
                </button>
              </>
            )}

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-amber-400 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="القائمة"
            >
              <div className="w-6 h-5 flex flex-col justify-center gap-1.5">
                <span className={`block h-[2px] bg-current transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[8px]' : ''}`} />
                <span className={`block h-[2px] bg-current transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-[2px] bg-current transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[8px]' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              dir="rtl"
              className="fixed top-0 right-0 bottom-0 w-72 bg-[#0c0c0f] border-l border-amber-500/20 z-50 p-6 flex flex-col justify-between lg:hidden shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <img src={wolfLogo} alt="WOLVES" className="w-8 h-8 object-contain" />
                    <span className="font-black text-amber-400 tracking-wider">WOLVES GYM</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="text-zinc-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-2 mt-6">
                  {navLinks.map((link) => (
                    <button
                      key={link.target}
                      onClick={() => scrollTo(link.target)}
                      className="w-full text-right py-2.5 px-3 rounded-xl text-sm font-bold text-zinc-300 hover:text-amber-400 hover:bg-white/[0.04] transition-colors block"
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Mobile Drawer Auth Footer */}
              <div className="pt-6 border-t border-zinc-800">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950 border border-amber-500/30">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-sm font-mono shrink-0">
                        {user?.name ? user.name.slice(0, 1).toUpperCase() : 'W'}
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        <span className="text-sm font-black text-white block truncate">
                          {user?.name || 'وحش الجيم'}
                        </span>
                        <span className="text-xs text-amber-400 font-mono font-bold block truncate">
                          {roleMeta.fullTitle || roleMeta.label}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setMobileOpen(false); handleGoToDashboard(); }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black text-xs font-black shadow-gold-glow flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Crown className="w-4 h-4" />
                      <span>الدخول للوحة التحكم</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setMobileOpen(false); handleLogout(); }}
                      className="w-full py-2.5 rounded-xl border border-rose-500/30 text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <button
                      onClick={() => { setMobileOpen(false); navigate('/register'); }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow"
                    >
                      انضم للكتيبة الآن
                    </button>
                    <button
                      onClick={() => { setMobileOpen(false); navigate('/login'); }}
                      className="w-full py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white"
                    >
                      دخول الوحوش
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. HERO SECTION ("IT'S A PACK" - طراز التصميم المعتمد)
   ═══════════════════════════════════════════════════════════════════════════ */
const HeroSection = ({ onOpenVideo }) => {
  const navigate = useNavigate();

  const scrollToPackages = () => {
    const el = document.getElementById('packages');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" dir="rtl" className="relative min-h-screen flex flex-col justify-between overflow-hidden pt-28 pb-8 sm:pb-12 bg-[#060608]">
      {/* Background Graphic Lightning / Slashes Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle gold atmospheric radial lights */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[450px] h-[450px] bg-yellow-500/[0.05] rounded-full blur-[100px]" />

        {/* Ambient gym background overlay */}
        <img
          src={heroAthlete}
          alt="Wolves Athlete"
          className="w-full h-full object-cover object-top opacity-35 filter brightness-[0.4] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/80 to-[#060608]/90" />
      </div>

      {/* Main Hero Body */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left / Right content based on RTL */}
          <div className="lg:col-span-7 text-right space-y-6">
            {/* Tag / Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-black tracking-widest shadow-gold-glow uppercase"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>MORE THAN A GYM • أكثر من مجرد صالة تدريب</span>
            </motion.div>

            {/* Huge Headline: IT'S A PACK */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="space-y-1 sm:space-y-2 select-none"
            >
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase leading-none font-mono">
                IT'S A
              </h1>
              <div className="relative inline-block">
                <span className="text-6xl sm:text-8xl lg:text-9xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 drop-shadow-[0_10px_35px_rgba(245,158,11,0.45)] font-mono uppercase block -mt-1 sm:-mt-2">
                  PACK
                </span>
                {/* Golden slash graphic lines under PACK */}
                <div className="h-1.5 w-3/4 bg-gradient-to-r from-amber-500 via-yellow-300 to-transparent rounded-full mt-1" />
              </div>
            </motion.div>

            {/* Arabic Mission Statement */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-sm sm:text-base lg:text-lg text-zinc-300 max-w-xl leading-relaxed font-semibold"
            >
              في صالة <strong className="text-amber-400 font-bold">WOLVES</strong>، لا نكتفي ببناء الأجسام، بل نصنع عقولاً حديدية، وانضباطاً لا ينكسر، وأسلوب حياة يدوم للأبد.
            </motion.p>

            {/* Dual CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center gap-3.5 pt-2 flex-wrap sm:flex-nowrap"
            >
              <button
                type="button"
                onClick={scrollToPackages}
                className="px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black text-xs sm:text-sm font-black shadow-gold-glow hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap min-h-[48px]"
              >
                <span>ابدأ رحلتك الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenVideo}
                className="px-6 py-4 rounded-2xl bg-white/[0.05] hover:bg-amber-500/10 border border-white/[0.1] hover:border-amber-500/40 text-white hover:text-amber-300 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2.5 backdrop-blur-md min-h-[48px]"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Play className="w-3 h-3 fill-amber-400" />
                </div>
                <span>شاهد جولة الصالة</span>
              </button>
            </motion.div>
          </div>

          {/* Center / Right Visual: The Ripped Athlete Back */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden border-2 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.25)] group">
              <img
                src={heroAthlete}
                alt="Wolves Muscular Athlete"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter contrast-115"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

              {/* Gold lightning scratches decorative badge */}
              <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-2xl bg-black/80 backdrop-blur-md border border-amber-500/40 flex items-center gap-2 text-xs font-mono font-bold text-amber-400 shadow-lg">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>OFFICIAL PACK</span>
              </div>

              {/* Floating Bottom Live Pass Pill */}
              <div className="absolute bottom-4 inset-x-4 p-3.5 rounded-2xl bg-[#0e0e12]/90 border border-amber-500/30 backdrop-blur-xl flex items-center justify-between text-xs text-white shadow-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-black text-amber-400">صالة تدريب الوحوش</span>
                    <span className="text-[10px] text-zinc-400">أجهزة ومعدات بمعايير أولمبية</span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 4-Item Feature Ribbon at Bottom of Hero (طراز الشريط في الصورة) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4">
        <div className="bg-[#0e0e12]/80 border border-amber-500/20 rounded-2xl p-4 sm:p-5 backdrop-blur-2xl shadow-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-zinc-800/80">
            
            {/* Feature 1 */}
            <div className="flex items-center gap-3 pt-2 sm:pt-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 text-amber-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">MODERN EQUIPMENT</h4>
                <p className="text-[11px] text-zinc-400 font-semibold">أحدث الأجهزة والمعدات العالمية</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pr-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">EXPERT COACHES</h4>
                <p className="text-[11px] text-zinc-400 font-semibold">مدربون معتمدون وإشراف دائم</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pr-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 text-amber-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">REAL RESULTS</h4>
                <p className="text-[11px] text-zinc-400 font-semibold">متابعة وقياسات دقيقة لتطورك</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pr-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">STRONG COMMUNITY</h4>
                <p className="text-[11px] text-zinc-400 font-semibold">نتمرن معاً، ونرتقي ككتيبة واحدة</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. ABOUT WOLVES SECTION ("DISCIPLINE BUILDS FREEDOM")
   ═══════════════════════════════════════════════════════════════════════════ */
const AboutWolvesSection = () => {
  return (
    <section id="about" dir="rtl" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#08080a] overflow-hidden border-t border-zinc-800/80">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Wolf Image Side with Glowing Amber Eyes */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] group">
              <img
                src={wolfAbout}
                alt="Wolves Spirit"
                className="w-full h-[400px] sm:h-[480px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              
              {/* Gold lightning scratches overlay */}
              <div className="absolute bottom-6 right-6 p-4 rounded-2xl bg-black/80 border border-amber-500/30 backdrop-blur-md max-w-xs text-right">
                <span className="text-[11px] font-mono text-amber-400 font-bold block mb-1">عقلية الوحوش 🐺</span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  "الذئب لا يشغل نفسه بآراء الخراف. ركّز في هدفك واصنع فارقك."
                </p>
              </div>
            </div>
          </motion.div>

          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 text-right space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ABOUT WOLVES • عن الصالة</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-black text-amber-400 font-mono tracking-widest uppercase">
                DISCIPLINE BUILDS FREEDOM
              </h3>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                الانضباط يصنع{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-yellow-300">
                  القوة والحرية
                </span>
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-semibold">
              صالة <strong className="text-amber-400">WOLVES</strong> أكثر من مجرد نادي رياضي، إنها عقلية متكاملة وأسلوب حياة مستدام. أنشأنا هذه المساحة لمن يبحث عن المزيد — قوة أكبر، ثقة أعلى، وسيطرة كاملة على لياقته وصحته.
            </p>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              هنا ستجد البيئة المثالية، الدعم المستمر من الكباتن المعتمدين، ومجتمعاً من الوحوش يشاركك نفس العزيمة والهدف لتصل إلى أفضل نسخة من نفسك.
            </p>

            {/* Stats Row matching mockup: 500+ Members, 10+ Certified Coaches, 3 Branches/Zones */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-800">
              <div className="bg-zinc-900/70 border border-zinc-800 p-3 sm:p-4 rounded-2xl text-center">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 block mb-0.5">500+</span>
                <span className="text-[11px] text-zinc-400 font-bold block">وحش ومشترك</span>
              </div>
              <div className="bg-zinc-900/70 border border-zinc-800 p-3 sm:p-4 rounded-2xl text-center">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 block mb-0.5">10+</span>
                <span className="text-[11px] text-zinc-400 font-bold block">كباتن معتمدين</span>
              </div>
              <div className="bg-zinc-900/70 border border-zinc-800 p-3 sm:p-4 rounded-2xl text-center">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 block mb-0.5">3</span>
                <span className="text-[11px] text-zinc-400 font-bold block">صالات ومناطق</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('coaches');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 hover:border-amber-500/60 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>تعرف على طاقم الكباتن</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   4. OUR COACHES SECTION ("TRAIN WITH THE BEST")
   ═══════════════════════════════════════════════════════════════════════════ */
const CoachesSection = () => {
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCoaches = async () => {
      try {
        setLoading(true);
        const res = await trainerService.getTrainers({ pageNumber: 1, pageSize: 8 });
        const list = Array.isArray(res?.data) ? res.data : [];
        if (isMounted) setCoaches(list);
      } catch (err) {
        console.warn('Landing coaches fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCoaches();
    return () => { isMounted = false; };
  }, []);

  return (
    <section id="coaches" dir="rtl" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#060608]">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="space-y-3 text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>OUR COACHES • فريق الكباتن</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              تدرّب مع{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-yellow-300">
                نخبة الأبطال
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl font-semibold">
              مدربون معتمدون لمساعدتك، وتحفيزك، ودفعك لتخطي كافة حدودك الرياضية.
            </p>
          </div>

          <div className="self-start md:self-end">
            <div className="text-xs font-mono text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-xl">
              <span>فريق معتمد لرياضات القوة واللياقة</span>
            </div>
          </div>
        </div>

        {/* Coaches Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-3xl bg-[#111115] border border-zinc-800 p-4 space-y-4 animate-pulse">
                <div className="aspect-[3/4] bg-zinc-800/80 rounded-2xl" />
                <div className="h-4 bg-zinc-800 rounded w-2/3" />
                <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : coaches.length === 0 ? (
          <div className="py-14 px-6 rounded-3xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center max-w-xl mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">كباتن ومدربو الصالة</h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
              طاقم التدريب في صالة WOLVES متواجد دائماً بالصالة لإرشادك وتصميم البرامج التدريبية المخصصة لأهدافك.
            </p>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              تواصل مع كابتن الصالة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {coaches.map((coach, index) => {
              const hasImage = Boolean(coach.imageUrl || coach.photoUrl);
              const coachImg = hasImage ? (coach.imageUrl || coach.photoUrl) : null;
              const expLabel = coach.yearsOfExperience ? `${coach.yearsOfExperience} سنوات خبرة` : 'مدرب معتمد';
              const specialty = coach.specialty || coach.bio || 'تدريب بدني وبناء أجسام';
              const coachInitial = coach.name ? coach.name.replace(/كابتن\s*/g, '').slice(0, 1).toUpperCase() : 'W';

              return (
                <motion.div
                  key={coach.id || coach.trainerId || index}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => setSelectedCoach({ ...coach, img: coachImg, expLabel, specialty, coachInitial })}
                  className="group relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#111115] to-[#08080a] border border-amber-500/20 hover:border-amber-500/60 p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer shadow-xl hover:shadow-[0_0_35px_rgba(245,158,11,0.25)] flex flex-col justify-between"
                >
                  {/* Photo or Monogram Card */}
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-gradient-to-b from-[#181820] via-[#101014] to-black border border-amber-500/20 flex flex-col items-center justify-center p-4">
                    {hasImage ? (
                      <>
                        <img
                          src={coachImg}
                          alt={coach.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                      </>
                    ) : (
                      <div className="relative w-full h-full flex flex-col items-center justify-center select-none text-center">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
                        
                        {/* Golden Monogram Avatar */}
                        <div className="relative mb-3">
                          <div className="absolute -inset-1.5 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-300" />
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-black border-2 border-amber-500/60 shadow-gold-glow flex items-center justify-center text-amber-300 font-mono font-black text-3xl group-hover:scale-105 group-hover:border-amber-400 transition-all duration-300">
                            {coachInitial}
                          </div>
                        </div>

                        <div className="mt-2 space-y-0.5">
                          <span className="text-[10px] font-mono tracking-widest text-amber-400 font-bold block">
                            CERTIFIED COACH
                          </span>
                          <span className="text-[11px] font-black text-zinc-300 block">
                            WOLVES ATHLETICS
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Exp badge */}
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/85 border border-amber-500/30 text-amber-400 backdrop-blur-md">
                      {expLabel}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="text-right space-y-1">
                    <span className="text-[10px] text-amber-400/90 font-mono font-bold block">COACH #{coach.id || coach.trainerId || index + 1}</span>
                    <h4 className="text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                      {coach.name}
                    </h4>
                    <p className="text-xs text-zinc-400 font-semibold">{specialty}</p>
                    <div className="pt-2 flex items-center justify-between text-xs text-amber-400 font-bold border-t border-zinc-800/80 mt-2">
                      <span>عرض التفاصيل</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* Coach Detail Modal */}
      <AnimatePresence>
        {selectedCoach && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0e0e12] border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-right space-y-4 font-cairo"
            >
              <button
                onClick={() => setSelectedCoach(null)}
                className="absolute left-4 top-4 p-2 text-zinc-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                {selectedCoach.img ? (
                  <img
                    src={selectedCoach.img}
                    alt={selectedCoach.name}
                    className="w-20 h-20 rounded-2xl object-cover object-top border border-amber-500/40 shadow-gold-glow shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-black border-2 border-amber-500/50 shadow-gold-glow flex items-center justify-center text-amber-400 font-mono font-black text-2xl shrink-0">
                    {selectedCoach.coachInitial || (selectedCoach.name ? selectedCoach.name.slice(0, 1) : 'W')}
                  </div>
                )}
                <div>
                  <span className="text-xs text-amber-400 font-mono font-bold block">COACH</span>
                  <h3 className="text-xl font-black text-white">{selectedCoach.name}</h3>
                  <span className="text-xs text-zinc-400">{selectedCoach.specialty}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs text-zinc-300">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-500">الخبرة:</span>
                  <span className="text-amber-400 font-bold">{selectedCoach.expLabel}</span>
                </div>
                {selectedCoach.phoneNumber && (
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500">رقم التواصل:</span>
                    <span className="text-white font-mono">{selectedCoach.phoneNumber}</span>
                  </div>
                )}
                {selectedCoach.email && (
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500">البريد:</span>
                    <span className="text-white font-mono">{selectedCoach.email}</span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-500 block mb-1">المجال التدريبي:</span>
                  <p className="text-zinc-200 leading-relaxed">{selectedCoach.specialty}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCoach(null);
                  const el = document.getElementById('packages');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow cursor-pointer"
              >
                استعرض باقات الصالة
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. MEMBERSHIP PACKAGES SECTION ("CHOOSE YOUR PATH")
   ═══════════════════════════════════════════════════════════════════════════ */
const PackagesSection = ({ onSelectPackage }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await packageService.getPackages({ pageNumber: 1, pageSize: 6, sortBy: 'price_asc' });
        const list = Array.isArray(res?.data) ? res.data : [];
        if (isMounted) setPackages(list);
      } catch (err) {
        console.warn('Landing packages fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPlans();
    return () => { isMounted = false; };
  }, []);

  const getDurationLabel = (days) => {
    const d = Number(days);
    if (d <= 7) return 'أسبوع';
    if (d <= 30) return 'شهر واحد';
    if (d <= 60) return 'شهرين';
    if (d <= 90) return '3 شهور';
    if (d <= 180) return '6 شهور';
    if (d <= 365) return 'سنة كاملة';
    return `${d} يوم`;
  };

  return (
    <section id="packages" dir="rtl" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#08080a] border-t border-zinc-800/80">
      <div className="max-w-7xl mx-auto">
        
        {/* Title */}
        <div className="text-center mb-14 sm:mb-20 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold">
            <Crown className="w-3.5 h-3.5" />
            <span>MEMBERSHIP PACKAGES • باقات العضوية</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            اختر مسارك،{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-yellow-300">
              اصنع بطولتك
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto font-semibold">
            Different goals. Same destination. A stronger you. (أهداف مختلفة، ووجهة واحدة: نسختك الأقوى).
          </p>
        </div>

        {/* Pricing Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl bg-[#101014] border border-zinc-800 p-8 space-y-5 animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-1/3" />
                <div className="h-7 bg-zinc-800 rounded w-2/3" />
                <div className="h-10 bg-zinc-800 rounded w-1/2" />
                <div className="space-y-2 pt-4 border-t border-zinc-800">
                  <div className="h-3.5 bg-zinc-800/60 rounded w-full" />
                  <div className="h-3.5 bg-zinc-800/60 rounded w-4/5" />
                  <div className="h-3.5 bg-zinc-800/60 rounded w-3/5" />
                </div>
                <div className="h-12 bg-zinc-800 rounded-2xl pt-2" />
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="py-16 text-center bg-zinc-950/60 rounded-3xl border border-dashed border-zinc-800 p-8 max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Crown className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-white">باقات صالة الذئاب الرياضية</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
              يتم تحديث الباقات والعروض الخاصة بصالة WOLVES دورياً. تفضل بزيارة مكتب الاستقبال في الجيم للاطلاع على باقات الاشتراكات والعروض المتاحة الآن.
            </p>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black text-xs font-black shadow-gold-glow hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>مواعيد العمل وأرقام الصالة</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {packages.map((pkg, idx) => {
              const isPopular = pkg.isPopular || idx === 1;
              const features = pkg.description
                ? pkg.description.split('\n').filter(Boolean)
                : [
                    `صلاحية الاشتراك: ${getDurationLabel(pkg.duration)}`,
                    'دخول غير محدود لصالة الحديد والأجهزة',
                    'استخدام اللوكرات الذكية وغرف تبديل الملابس',
                    'استشارة وتوجيه تدريبي مع كباتن الصالة'
                  ];

              return (
                <div
                  key={pkg.id || idx}
                  className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 overflow-hidden ${
                    isPopular
                      ? 'bg-gradient-to-b from-[#18150e] via-[#0f0e13] to-[#08080a] border-2 border-amber-500 shadow-[0_0_45px_rgba(245,158,11,0.3)] md:-translate-y-2'
                      : 'bg-gradient-to-b from-[#101014] to-[#08080a] border border-zinc-800 hover:border-amber-500/40 shadow-xl'
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute top-0 right-1/2 translate-x-1/2">
                      <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[11px] font-black px-4 py-1 rounded-b-xl shadow-gold-glow flex items-center gap-1 uppercase tracking-wider">
                        <Star className="w-3 h-3 fill-black text-black" />
                        <span>MOST POPULAR • الأكثر طلباً</span>
                      </span>
                    </div>
                  )}

                  <div className={isPopular ? 'pt-4' : ''}>
                    {/* Name & Subtitle */}
                    <div className="mb-4">
                      <span className="text-[11px] font-mono font-bold text-amber-400/90 block mb-1">
                        PLAN #{pkg.id || idx + 1}
                      </span>
                      <h3 className="text-2xl font-black text-white mb-1">{pkg.name}</h3>
                      <p className="text-xs text-zinc-400 font-mono">المدة: {getDurationLabel(pkg.duration)}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6 pb-6 border-b border-zinc-800">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                          {Number(pkg.price).toLocaleString('ar-EG')}
                        </span>
                        <span className="text-xs font-bold text-zinc-400">جنيه مصري</span>
                        <span className="text-[11px] text-zinc-500">/ {getDurationLabel(pkg.duration)}</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-8">
                      {features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    type="button"
                    onClick={() => onSelectPackage(pkg)}
                    className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isPopular
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 hover:border-amber-500/60'
                    }`}
                  >
                    <span>اشترك الآن</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   6. OUR FACILITIES SECTION ("EVERYTHING YOU NEED")
   ═══════════════════════════════════════════════════════════════════════════ */
const FacilitiesSection = () => {
  const [activeFacility, setActiveFacility] = useState(null);

  const facilities = [
    {
      id: 'strength',
      title: 'STRENGTH ZONE',
      titleAr: 'منطقة القوة والحديد الحر',
      desc: 'أحدث أجهزة Hammer Strength و Life Fitness مع تشكيلة أوزان حرة كاملة.',
      img: facilityStrength,
      badge: 'ZONE 1',
    },
    {
      id: 'cardio',
      title: 'CARDIO ZONE',
      titleAr: 'منطقة الكارديو واللياقة',
      desc: 'أجهزة سير ودراجات تفاعلية متصلة بشاشات رقمية وبرامج تدريب حية.',
      img: facilityCardio,
      badge: 'ZONE 2',
    },
    {
      id: 'functional',
      title: 'FUNCTIONAL AREA',
      titleAr: 'التدريب الوظيفي وكروس فيت',
      desc: 'مساحات مفتوحة مجهزة بالحبال، الإطارات، الصناديق وحلقات الجمباز.',
      img: facilityFunctional,
      badge: 'ZONE 3',
    },
    {
      id: 'lockers',
      title: 'LOCKER ROOMS',
      titleAr: 'غرف اللوكرات الذكية',
      desc: 'دواليب ذكية بباركود العضوية ومرافق تبديل ملابس واسعة وراقية.',
      img: facilityLockers,
      badge: 'ZONE 4',
    },
    {
      id: 'spa',
      title: 'SHOWERS & SPA',
      titleAr: 'الاستشفاء والساونا والشاورز',
      desc: 'غرف ساونا وبخار وجاكوزي لسرعة التعافي والاسترخاء بعد التمرين.',
      img: facilitySpa,
      badge: 'ZONE 5',
    },
  ];

  return (
    <section id="facilities" dir="rtl" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#060608]">
      <div className="max-w-7xl mx-auto">
        
        {/* Title */}
        <div className="mb-12 sm:mb-16 space-y-3 text-right">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>OUR FACILITIES • مرافق وتجهيزات الصالة</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            كل ما تحتاجه{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-yellow-300">
              تحت سقف واحد
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl font-semibold">
            A premium training environment with top-notch equipment and modern facilities.
          </p>
        </div>

        {/* 5 Facilities Horizontal Grid matching bottom-left of mockup */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {facilities.map((fac) => (
            <motion.div
              key={fac.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              onClick={() => setActiveFacility(fac)}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] border border-zinc-800 hover:border-amber-500/60 cursor-pointer shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src={fac.img}
                alt={fac.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              {/* Badge */}
              <span className="absolute top-3 right-3 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/80 text-amber-400 border border-amber-500/30">
                {fac.badge}
              </span>

              {/* Bottom Label Tag matching mockup */}
              <div className="absolute bottom-3 inset-x-3 text-right">
                <span className="text-[10px] text-amber-400 font-mono font-bold block mb-0.5">{fac.title}</span>
                <h4 className="text-xs font-black text-white truncate">{fac.titleAr}</h4>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Facility Lightbox Modal */}
      <AnimatePresence>
        {activeFacility && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#0e0e12] border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl text-right"
            >
              <button
                onClick={() => setActiveFacility(null)}
                className="absolute left-4 top-4 z-10 p-2 rounded-xl bg-black/70 text-zinc-300 hover:text-white border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="aspect-[16/9] w-full relative">
                <img src={activeFacility.img} alt={activeFacility.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-transparent to-transparent" />
              </div>

              <div className="p-6 space-y-3">
                <span className="text-xs text-amber-400 font-mono font-bold">{activeFacility.badge} — {activeFacility.title}</span>
                <h3 className="text-2xl font-black text-white">{activeFacility.titleAr}</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">{activeFacility.desc}</p>
                <div className="pt-3">
                  <button
                    onClick={() => setActiveFacility(null)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black"
                  >
                    إغلاق المعاينة
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   7. APP & TRACKING SECTION ("TRACK YOUR PROGRESS ANYWHERE")
   ═══════════════════════════════════════════════════════════════════════════ */
const AppSection = () => {
  const navigate = useNavigate();

  return (
    <section id="app" dir="rtl" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#08080a] border-t border-zinc-800/80 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left / Right Smartphone Mockup matching mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5 flex justify-center relative"
          >
            <div className="relative w-full max-w-xs sm:max-w-sm rounded-3xl overflow-hidden border border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.2)] group">
              <img
                src={wolvesApp}
                alt="Wolves Smart App"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              {/* Floating Stat Widget */}
              <div className="absolute bottom-4 inset-x-4 p-3 rounded-2xl bg-black/90 border border-amber-500/30 backdrop-blur-md flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white">نسبة إنجاز التمرين اليومي</span>
                </div>
                <span className="text-amber-400 font-mono font-bold">78%</span>
              </div>
            </div>
          </motion.div>

          {/* Right Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 text-right space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold">
              <QrCode className="w-3.5 h-3.5" />
              <span>SMART APP • تطبيق وبوابة الصالة</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-black text-amber-400 font-mono tracking-widest uppercase">
                TRACK YOUR PROGRESS ANYWHERE
              </h3>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                تابع تطورك وتقدمك{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-yellow-300">
                  لحظة بلحظة
                </span>
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-semibold">
              استخدم تطبيق وبوابة أعضاء <strong className="text-amber-400">WOLVES</strong> لمتابعة تمارينك، رصد أوزانك، والاطلاع على إشغال الصالة وتفاصيل اللوكر الذكي الخاص بك في أي وقت ومن أي مكان.
            </p>

            {/* 4 Feature Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-white mb-0.5">Workout Plans</h4>
                  <p className="text-[11px] text-zinc-400">جداول تمارين مخصصة لبرنامجك التدريبي.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-white">Progress Tracking</h4>
                  <p className="text-[11px] text-zinc-400">رصد تطور الأوزان وقياسات الـ InBody الدورية.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-white">Nutrition Guide</h4>
                  <p className="text-[11px] text-zinc-400">إرشادات غذائية وخطة الماكروز المناسبة لهدفك.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-white">Smart Notifications</h4>
                  <p className="text-[11px] text-zinc-400">باركود الدخول الذكي وتنبيهات اللوكر المباشرة.</p>
                </div>
              </div>
            </div>

            {/* Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black text-xs sm:text-sm font-black shadow-gold-glow hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>دخول بوابة المشتركين</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   8. JOIN THE PACK CALL TO ACTION BANNER (طراز الصورة المعتمد)
   ═══════════════════════════════════════════════════════════════════════════ */
const JoinPackBanner = () => {
  const navigate = useNavigate();

  return (
    <section id="contact" dir="rtl" className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#060608] overflow-hidden border-t border-zinc-800/80">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#141210] via-[#0d0d12] to-black border-2 border-amber-500/40 p-8 sm:p-14 text-center shadow-[0_0_60px_rgba(245,158,11,0.25)] space-y-6">
          
          {/* Center Glowing Logo Emblem */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-black border border-amber-500/40 p-3 shadow-gold-glow flex items-center justify-center">
            <img src={logoEmblem} alt="WOLVES Emblem" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-mono font-bold text-amber-400 tracking-widest uppercase block">
              WOLVES GYM
            </span>
            <div dir="ltr" className="select-none">
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight font-mono">
                ARE YOU READY TO{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                  JOIN THE PACK?
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 font-semibold leading-relaxed">
              هل أنت مستعد للانضمام إلى الكتيبة؟ القوة الحقيقية تبدأ بقرار اليوم. لا تؤجل بطولتك.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black text-xs sm:text-sm font-black shadow-gold-glow hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>انضم للكتيبة الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Social Links Row matching mockup */}
          <div className="pt-4 flex items-center justify-center gap-4 text-zinc-400">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 hover:text-amber-400 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 hover:text-amber-400 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 hover:text-amber-400 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 hover:text-amber-400 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   9. FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */
const Footer = () => {
  return (
    <footer dir="rtl" className="bg-[#040406] border-t border-zinc-800/80 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2.5">
          <img src={wolfLogo} alt="WOLVES" className="w-6 h-6 object-contain" />
          <span className="font-bold text-zinc-300">WOLVES GYM</span>
          <span>— جميع الحقوق محفوظة لكتيبة الذئاب © {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <span>مواعيد العمل: يومياً 6:00 ص – 12:00 م</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-amber-400 hover:underline cursor-pointer"
          >
            العودة للأعلى ↑
          </button>
        </div>
      </div>
    </footer>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT WITH MODALS
   ═══════════════════════════════════════════════════════════════════════════ */
export const LandingPage = () => {
  // Modal states
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  return (
    <div className="bg-[#060608] text-white font-cairo selection:bg-amber-500 selection:text-black overflow-x-hidden min-h-screen">
      <Navbar />
      <HeroSection onOpenVideo={() => setVideoModalOpen(true)} />
      <AboutWolvesSection />
      <CoachesSection />
      <PackagesSection onSelectPackage={(pkg) => setSelectedPackage(pkg)} />
      <FacilitiesSection />
      <AppSection />
      <JoinPackBanner />
      <Footer />

      {/* Video Tour Modal (إضافة مميزة) */}
      <AnimatePresence>
        {videoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-[#0e0e12] border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl text-right"
            >
              <button
                onClick={() => setVideoModalOpen(false)}
                className="absolute left-4 top-4 z-20 p-2 rounded-xl bg-black/80 text-zinc-300 hover:text-white border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={heroAthlete}
                  alt="Wolves Tour"
                  className="w-full h-full object-cover filter brightness-75 contrast-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/30 border-2 border-amber-400 text-amber-300 flex items-center justify-center shadow-gold-glow mb-4 animate-pulse">
                    <Play className="w-7 h-7 fill-amber-400 mr-0.5" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2">جولة سينمائية في صالة WOLVES</h3>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-md leading-relaxed">
                    استكشف أجواء التدريب الحماسية، ومناطق الأجهزة، وغرف الاستشفاء والساونا، واللوكرات الذكية.
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-[#0c0c10] border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-right">
                  <span className="text-xs text-amber-400 font-bold block">موقع الصالة في انتظارك</span>
                  <span className="text-xs text-zinc-400">القاهرة — مفتوح يومياً من 6:00 صباحاً حتى 12:00 منتصف الليل</span>
                </div>
                <button
                  onClick={() => {
                    setVideoModalOpen(false);
                    const el = document.getElementById('packages');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-gold-glow"
                >
                  استعرض الباقات والاشتراكات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reception Subscription Guidance Modal (المودال التوجيهي للريسبشن) */}
      <AnimatePresence>
        {selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md sm:max-w-lg mx-4 max-h-[92vh] overflow-y-auto gold-scrollbar bg-gradient-to-b from-[#141210] via-[#0d0d10] to-black rounded-3xl border border-amber-500/40 p-5 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.25)] my-auto text-right"
            >
              {/* Modal Close Button */}
              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                className="absolute left-4 top-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-5 text-right">
                {/* Header with Receptionist / Gym Emblem */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-amber-500/20">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-black flex items-center justify-center shadow-gold-glow shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        صالة WOLVES
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 mt-1">
                      توجه لرسيبشن الجيم للاشتراك
                    </h3>
                  </div>
                </div>

                {/* Selected Package Details Pill */}
                <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold block mb-0.5">الباقة المختارة:</span>
                    <h4 className="text-base sm:text-lg font-black text-white">{selectedPackage.name}</h4>
                    <span className="text-xs text-zinc-400 font-mono">المدة: {selectedPackage.duration} يوماً</span>
                  </div>

                  <div className="text-left">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono block">
                      {Number(selectedPackage.price).toLocaleString('ar-EG')}
                    </span>
                    <span className="text-[10px] text-zinc-400">جنيه مصري</span>
                  </div>
                </div>

                {/* Important Guidance Notice */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>تأكيد الاشتراك عبر مكتب الاستقبال</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                    عزيزنا البطل، للاشتراك وتفعيل <strong className="text-amber-400">{selectedPackage.name}</strong> واستلام كود الدخول واللوكر، يرجى التوجه إلى <strong>مكتب استقبال الجيم (Reception)</strong> بالصالة لإتمام التسجيل.
                  </p>
                </div>

                {/* Reception Features / Payment Methods */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-300 block">طرق السداد ومميزات الاستقبال:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                      <Banknote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">طرق دفع متعددة</span>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">كاش، فيزا/ماستركارد، أو إنستاباي InstaPay في الريسبشن.</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">استلام اللوكر والكود</span>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">تفعيل باركود الدخول الذكي وتخصيص اللوكر فوراً.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gym Info / Reception Hours */}
                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>مواعيد العمل: يومياً من 6:00 صباحاً حتى 12:00 منتصف الليل</span>
                  </div>
                  <span className="text-amber-400 font-bold shrink-0">WOLVES</span>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setSelectedPackage(null)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black text-xs sm:text-sm font-black shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>فهمت، سأتوجه للاستقبال للاشتراك</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
