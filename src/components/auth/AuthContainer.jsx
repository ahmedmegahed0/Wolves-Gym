import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import wolfLogo from '../../assets/logo.png';
import gymBg from '../../assets/gym-bg.jpg';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ConfirmEmailForm from './ConfirmEmailForm';
import ForgotPasswordWizard from './ForgotPasswordWizard';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole } from '../../services/apiClient';

export const AuthContainer = ({ initialView }) => {
  const { activeAuthView, setActiveAuthView, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (initialView) {
      setActiveAuthView(initialView);
    }
  }, [initialView, setActiveAuthView]);

  // If user is already authenticated, redirect directly to role-specific dashboard
  if (isAuthenticated) {
    const role = normalizeRole(user?.role);
    if (role === 'Receptionist') {
      return <Navigate to="/dashboard/reception" replace />;
    }
    if (role === 'Customer') {
      return <Navigate to="/dashboard/customer" replace />;
    }
    return <Navigate to="/dashboard/under-construction" replace />;
  }

  // View states
  const isConfirmEmail = activeAuthView === 'confirm-email';
  const isForgotPassword = activeAuthView === 'forgot-password';
  const isRegister = activeAuthView === 'register';
  const isLogin = activeAuthView === 'login';

  return (
    <div dir="rtl" className="min-h-screen text-zinc-100 flex items-center justify-center font-cairo px-3 sm:px-4 py-4 sm:py-6 relative overflow-hidden">
      {/* Full-screen Gym Background */}
      <div className="fixed inset-0">
        <img
          src={gymBg}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlays for readability */}
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Main Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800/60 rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.95)]"
        >
          {/* Top Gold Line */}
          <div className="absolute top-0 left-6 right-6 sm:left-8 sm:right-8 h-[2px] bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />

          {/* Logo & Brand */}
          <div className="flex flex-col items-center mb-7">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4, type: 'spring', stiffness: 200 }}
              className="relative mb-4"
            >
              <div className="absolute -inset-2 bg-gradient-to-br from-amber-500/30 to-yellow-500/10 rounded-2xl blur-xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-black/90 border border-amber-500/40 flex items-center justify-center p-1.5 shadow-lg">
                <img
                  src={wolfLogo}
                  alt="BE THE WOLF"
                  className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                />
              </div>
            </motion.div>

            <h1 className="text-xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
              BE THE WOLF
            </h1>
          </div>

          {/* Tabs: Only for login/register views */}
          {!isConfirmEmail && !isForgotPassword && (
            <div className="flex rounded-2xl bg-black/70 p-1 border border-zinc-800/50 mb-6 relative">
              <button
                type="button"
                onClick={() => setActiveAuthView('login')}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all relative z-10 ${
                  isLogin ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                تسجيل الدخول
              </button>

              <button
                type="button"
                onClick={() => setActiveAuthView('register')}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all relative z-10 ${
                  isRegister ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                حساب جديد
              </button>

              {/* Animated Slider */}
              <motion.div
                layout
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className={`absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 ${
                  isLogin ? 'right-1 left-[calc(50%+2px)]' : 'left-1 right-[calc(50%+2px)]'
                }`}
              />
            </div>
          )}

          {/* Form Content */}
          <AnimatePresence mode="wait">
            {isConfirmEmail ? (
              <motion.div
                key="confirm-email"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <ConfirmEmailForm onSwitchToLogin={() => setActiveAuthView('login')} />
              </motion.div>
            ) : isForgotPassword ? (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <ForgotPasswordWizard onSwitchToLogin={() => setActiveAuthView('login')} />
              </motion.div>
            ) : isRegister ? (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <RegisterForm onSwitchToLogin={() => setActiveAuthView('login')} />
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <LoginForm onSwitchToRegister={() => setActiveAuthView('register')} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-600 mt-5">
          BE THE WOLF &copy; 2026
        </p>
      </div>
    </div>
  );
};

export default AuthContainer;
