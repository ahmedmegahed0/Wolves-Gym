import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import wolfLogo from '../../assets/logo.png';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ConfirmEmailForm from './ConfirmEmailForm';
import ForgotPasswordWizard from './ForgotPasswordWizard';
import { useAuth } from '../../context/AuthContext';

export const AuthContainer = () => {
  const { activeAuthView, setActiveAuthView, isAuthenticated } = useAuth();

  // View states
  const isConfirmEmail = activeAuthView === 'confirm-email';
  const isForgotPassword = activeAuthView === 'forgot-password';
  const isRegister = activeAuthView === 'register';
  const isLogin = activeAuthView === 'login';

  return (
    <div dir="rtl" className="min-h-screen bg-black bg-wolf-mesh text-zinc-100 flex flex-col justify-between font-cairo px-4 py-8">
      {/* Top Bar with quick link to Dashboard */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pb-4">
        <button
          type="button"
          onClick={() => setActiveAuthView('dashboard')}
          className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors p-2 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
        >
          <ArrowRight className="w-4 h-4" />
          <span>لوحة الحضور واللوكرات</span>
        </button>

        {isAuthenticated && (
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-cairo">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            الجلسة نشطة ومصادقة
          </span>
        )}
      </div>

      {/* Main Glassmorphic Auth Card */}
      <div className="max-w-md w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="wolf-glass bg-zinc-950/90 border border-amber-500/25 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.95)] relative overflow-hidden"
        >
          {/* Subtle Golden Accent Glow */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 opacity-90" />
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Logo & Brand Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative group mb-3">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
              <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-black border border-amber-500/50 shadow-gold-glow overflow-hidden p-1.5">
                <img
                  src={wolfLogo}
                  alt="BE THE WOLF"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                />
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 m-0">
              BE THE WOLF
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-semibold">
              بوابة تسجيل ومصادقة أبطال الجيم
            </p>
          </div>

          {/* Tabs switch: Only shown when in login or register view */}
          {!isConfirmEmail && !isForgotPassword && (
            <div className="flex rounded-2xl bg-black/80 p-1.5 border border-zinc-800 mb-6 relative">
              <button
                type="button"
                onClick={() => setActiveAuthView('login')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 relative z-10 ${
                  isLogin
                    ? 'text-black font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>تسجيل الدخول</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAuthView('register')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 relative z-10 ${
                  isRegister
                    ? 'text-black font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>حساب جديد</span>
              </button>

              {/* Animated Tab Background Indicator */}
              <motion.div
                layout
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shadow-gold-glow ${
                  isLogin ? 'right-1.5 left-1/2 ml-1' : 'left-1.5 right-1/2 mr-1'
                }`}
              />
            </div>
          )}

          {/* Form Content Slider */}
          <AnimatePresence mode="wait">
            {isConfirmEmail ? (
              <motion.div
                key="confirm-email"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
              >
                <ConfirmEmailForm
                  onSwitchToLogin={() => setActiveAuthView('login')}
                />
              </motion.div>
            ) : isForgotPassword ? (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
              >
                <ForgotPasswordWizard
                  onSwitchToLogin={() => setActiveAuthView('login')}
                />
              </motion.div>
            ) : isRegister ? (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
              >
                <RegisterForm
                  onSwitchToLogin={() => setActiveAuthView('login')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
              >
                <LoginForm
                  onSwitchToRegister={() => setActiveAuthView('register')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-xs text-zinc-500 pt-6">
        BE THE WOLF &copy; 2026 • جميع الحقوق محفوظة لكتيبة الذئاب
      </footer>
    </div>
  );
};

export default AuthContainer;
