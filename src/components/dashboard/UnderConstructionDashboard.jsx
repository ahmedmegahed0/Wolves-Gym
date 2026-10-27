import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Hammer, 
  Sparkles, 
  LogOut, 
  Clock, 
  ShieldCheck, 
  Dumbbell, 
  TrendingUp, 
  Users, 
  FileText,
  AlertTriangle,
  Crown,
  Key,
  User,
  Home,
  Target,
  ChevronLeft
} from 'lucide-react';
import wolfLogo from '../../assets/logo.png';
import gymBg from '../../assets/gym-bg.jpg';
import { useAuth } from '../../context/AuthContext';
import { getRoleMeta } from '../../services/apiClient';
import UserProfileSettingsModal from '../profile/UserProfileSettingsModal';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import TrainerMeDashboard from '../trainers/TrainerMeDashboard';

export const UnderConstructionDashboard = () => {
  const navigate = useNavigate();
  const { 
    user, 
    logout, 
    isProfileSettingsModalOpen, 
    setIsProfileSettingsModalOpen,
    isChangePasswordModalOpen,
    setIsChangePasswordModalOpen
  } = useAuth();
  const roleMeta = getRoleMeta(user?.role);
  const canAccessReception = ['Receptionist', 'SuperAdmin', 'Manager'].includes(roleMeta.role);

  // Role-specific upcoming features teaser
  const getRoleFeatures = () => {
    switch (roleMeta.role) {
      case 'Trainer':
        return [
          { icon: Dumbbell, title: 'خطط التدريب والتمارين', desc: 'تصميم ومتابعة الجداول التدريبية لكل وحش' },
          { icon: TrendingUp, title: 'قياسات الـ InBody والـ BMI', desc: 'متابعة التطور العضلي ونسبة الدهون للأعضاء' },
          { icon: Users, title: 'سجل المتدربين والاشتراكات', desc: 'إشراف مباشر على تدريبات المشتركين المعتمدين' },
        ];
      case 'Manager':
        return [
          { icon: Users, title: 'إدارة طاقم العمل والموظفين', desc: 'متابعة مواعيد الكباتن وموظفي الاستقبال والرواتب' },
          { icon: TrendingUp, title: 'التقارير المالية والتشغيلية', desc: 'إحصائيات الاشتراكات والإيرادات ونسب الإشغال' },
          { icon: FileText, title: 'إدارة الاشتراكات والعضويات', desc: 'تحديد وتعديل باقات الجيم والعروض الترويجية' },
        ];
      case 'SuperAdmin':
      default:
        return [
          { icon: ShieldCheck, title: 'الصلاحيات وإدارة النظام', desc: 'التحكم الشامل في المستخدمين والرتب وقواعد البيانات' },
          { icon: TrendingUp, title: 'مؤشرات الأداء والتحليلات', desc: 'متابعة شاملة لجميع فروع الجيم وحركات الدخول' },
          { icon: Hammer, title: 'إعدادات المنظومة المركزية', desc: 'ضبط معايير الأمان والبوابات واللوكرات الذكية' },
        ];
    }
  };

  const features = getRoleFeatures();

  return (
    <div dir="rtl" className="min-h-screen bg-[#070707] text-white font-cairo flex flex-col relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Background Graphic */}
      <div className="fixed inset-0 pointer-events-none">
        <img src={gymBg} alt="" className="w-full h-full object-cover opacity-20 filter grayscale contrast-125" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/70" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-amber-500/15 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 cursor-pointer group/logo"
            title="العودة للصفحة الرئيسية"
          >
            <div className="w-10 h-10 rounded-xl bg-black/90 border border-amber-500/40 p-1.5 shadow-gold-glow">
              <img src={wolfLogo} alt="WOLVES" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 leading-none group-hover/logo:text-amber-300">
                WOLVES
              </h1>
              <p className="text-[10px] text-zinc-400 font-semibold mt-1">
                منظومة إدارة الذئاب المتكاملة
              </p>
            </div>
          </div>

          {/* User Badge & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* User Profile Badge Button */}
            <button
              type="button"
              onClick={() => setIsProfileSettingsModalOpen(true)}
              className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/30 hover:border-amber-500/60 rounded-xl px-2 sm:px-3 py-1.5 transition-all cursor-pointer group"
              title="إعدادات الحساب والبيانات الشخصية"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center font-mono text-xs group-hover:scale-105 transition-transform">
                {user?.name ? user.name.slice(0, 1).toUpperCase() : 'W'}
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-white block leading-tight group-hover:text-amber-400 transition-colors">
                  {user?.name || roleMeta.label}
                </span>
                <span className={`text-[10px] font-mono flex items-center gap-1 ${roleMeta.textColor}`}>
                  {roleMeta.badge}
                </span>
              </div>
            </button>

            {/* Home Page Shortcut */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-amber-400 bg-zinc-900 border border-white/10 hover:border-amber-500/40 rounded-xl transition-all cursor-pointer shadow-sm"
              title="الذهاب للصفحة الرئيسية للجيم"
            >
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">الرئيسية</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/packages')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-black bg-amber-500/15 hover:bg-amber-400 border border-amber-500/35 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>باقات واشتراكات</span>
            </button>

            {['Manager', 'SuperAdmin'].includes(roleMeta.role) && (
              <button
                type="button"
                onClick={() => navigate('/dashboard/kpis')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-black bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-gold-glow transition-all cursor-pointer"
                title="لوحة إدارة مؤشرات الأداء وتقييم المدربين"
              >
                <Target className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">مؤشرات الأداء (KPIs)</span>
                <span className="sm:hidden">KPIs</span>
              </button>
            )}

            {canAccessReception && (
              <button
                type="button"
                onClick={() => navigate('/dashboard/reception')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-black bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 rounded-xl shadow-gold-glow transition-all"
              >
                <span className="hidden sm:inline">لوحة الاستقبال</span>
                <span className="sm:hidden">الاستقبال</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex items-center justify-center relative z-10">
        {roleMeta.role === 'Trainer' ? (
          <div className="w-full py-2">
            <TrainerMeDashboard />
          </div>
        ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full wolf-glass rounded-3xl p-6 sm:p-10 border border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.1)] text-center relative"
        >
          {/* Top Line Accent */}
          <div className="absolute top-0 right-10 left-10 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Construction Icon */}
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 shadow-gold-glow">
              <Hammer className="w-10 h-10 animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Role Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-zinc-900 border border-amber-500/30 text-amber-400 mb-4 font-mono">
            <span>{roleMeta.badge}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-300">{roleMeta.fullTitle}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            لوحة الإدارة قيد التطوير
          </h2>

          <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed mb-8">
            أهلاً بك يا <span className="text-amber-400 font-bold">{user?.name || roleMeta.label}</span>. 
            يجري حالياً تجهيز وبرمجة لوحة التحكم والتحليلات الخاصة برتبتك بأعلى معايير الدقة والاحترافية. 
            تم عزل شاشة الريسبشن واللوكرات وتخصيصها لموظفي الاستقبال فقط للحفاظ على خصوصية وسير العمليات.
          </p>

          {/* Notice Banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 mb-8 text-xs text-amber-300/90 flex items-center gap-2.5 text-right max-w-xl mx-auto">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              لا تمتلك هذه الرتبة صلاحية استخدام شاشة الريسبشن واللوكرات. سيتم إشعارك فور اكتمال إطلاق وحداتك الإدارية.
            </span>
          </div>

          {/* Active Released Module: KPIs Module for Manager & SuperAdmin */}
          {['Manager', 'SuperAdmin'].includes(roleMeta.role) && (
            <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-black border border-amber-500/40 shadow-gold-glow flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-gold-glow">
                  <Target className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>موديول متاح وجاهز للاستخدام الآن</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    مؤشرات الأداء وتقييم المدربين (KPIs Module)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    إدارة مؤشرات الأداء، إضافة معايير جديدة، وتعديل حالات التفعيل مباشرة من خلال الـ API.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/dashboard/kpis')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-gold-glow flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              >
                <span>فتح لوحة مؤشرات الأداء</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upcoming Modules Teaser */}
          <div className="text-right mb-8">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              الوحدات والخصائص قيد الإطلاق قريباً:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {features.map((feat, idx) => {
                const IconComponent = feat.icon;
                return (
                  <div
                    key={idx}
                    className="bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-500/30 rounded-2xl p-4 transition-all text-right group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">{feat.title}</h4>
                    <p className="text-[11px] text-zinc-400 leading-normal">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logout Action */}
          <div className="flex items-center justify-center pt-2">
            <button
              type="button"
              onClick={logout}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black shadow-gold-glow flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج الآمن</span>
            </button>
          </div>
        </motion.div>
        )}
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      {/* User Profile Settings Modal */}
      <UserProfileSettingsModal
        isOpen={isProfileSettingsModalOpen}
        onClose={() => setIsProfileSettingsModalOpen(false)}
      />
    </div>
  );
};

export default UnderConstructionDashboard;
