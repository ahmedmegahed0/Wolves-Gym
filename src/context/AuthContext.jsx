import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAccessToken, 
  getUserInfo, 
  clearAuthTokens, 
  authService,
  normalizeRole,
  customerService,
  STORAGE_KEYS
} from '../services/apiClient';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [token, setToken] = useState(() => getAccessToken());
  const [user, setUser] = useState(() => getUserInfo());
  const [activeAuthView, setActiveAuthView] = useState(() => {
    return getAccessToken() ? 'dashboard' : 'login';
  });
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isProfileSettingsModalOpen, setIsProfileSettingsModalOpen] = useState(false);

  // Sync token state changes
  const updateAuthState = useCallback(() => {
    const currentToken = getAccessToken();
    const currentUser = getUserInfo();
    setToken(currentToken);
    setUser(currentUser);
  }, []);

  // Update current user without full page reload
  const updateCurrentUser = useCallback((newUserData) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...newUserData };
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Central Role-Based Destination Resolver (Requirement 2)
  const redirectUserByRole = useCallback(async (targetUser) => {
    const role = normalizeRole(targetUser?.role);

    // 1. Receptionist, SuperAdmin, Manager -> /dashboard/reception
    if (role === 'Receptionist' || role === 'SuperAdmin' || role === 'Manager') {
      setActiveAuthView('dashboard');
      navigate('/dashboard/reception', { replace: true });
      return;
    }

    // 2. Customer -> GET /api/customers/me check
    if (role === 'Customer') {
      try {
        const profile = await customerService.getCustomerMe();
        const approvalStatus = profile?.approvalStatus !== undefined ? Number(profile.approvalStatus) : 0;
        if (approvalStatus === 1) {
          setActiveAuthView('member');
          navigate('/dashboard/customer', { replace: true });
        } else {
          setActiveAuthView('pending');
          navigate('/pending-approval', { replace: true });
        }
      } catch {
        setActiveAuthView('pending');
        navigate('/pending-approval', { replace: true });
      }
      return;
    }

    // 3. SuperAdmin, Manager, Trainer -> /dashboard/under-construction
    setActiveAuthView('under-construction');
    navigate('/dashboard/under-construction', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const handleAuthExpired = () => {
      updateAuthState();
      setActiveAuthView('login');
      navigate('/login', { replace: true });
      toastError('انتهت الجلسة', 'انتهت صلاحية جلسة الدخول. برجاء تسجيل الدخول مجدداً.');
    };

    const handleLoggedOut = () => {
      updateAuthState();
      setActiveAuthView('login');
      navigate('/login', { replace: true });
      toastInfo('تم تسجيل الخروج', 'نورتنا يا كوتش.. مستنينك في التمرين الجاي');
    };

    window.addEventListener('gym_auth_expired', handleAuthExpired);
    window.addEventListener('gym_auth_logged_out', handleLoggedOut);

    return () => {
      window.removeEventListener('gym_auth_expired', handleAuthExpired);
      window.removeEventListener('gym_auth_logged_out', handleLoggedOut);
    };
  }, [toastError, toastInfo, updateAuthState, navigate]);

  // Login handler
  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      updateAuthState();
      const currentUser = getUserInfo();

      toastSuccess(
        'أهلاً بك يا وحش!',
        `تم تسجيل الدخول بنجاح (${currentUser?.name || email})`
      );

      // Execute strict role-based redirection
      await redirectUserByRole(currentUser);
      return { success: true, data };
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.friendlyMessage || 'تعذر تسجيل الدخول. يرجى التأكد من البريد وكلمة المرور.';
      toastError('فشل الدخول', msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Register Customer handler
  const handleRegister = async ({ name, email, password, confirmPassword, phoneNumber }) => {
    setLoading(true);
    try {
      const data = await authService.register({
        name,
        email,
        password,
        confirmPassword,
        phoneNumber,
      });

      setPendingConfirmationEmail(email.trim().toLowerCase());
      toastSuccess(
        'عاش يا بطل! تم إنشاء الحساب',
        'تم إرسال كود التفعيل إلى بريدك الإلكتروني لتأكيد انضمامك للكتيبة.'
      );
      setActiveAuthView('confirm-email');
      return { success: true, data };
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.friendlyMessage || 'تعذر إنشاء الحساب. تأكد من البيانات المدخلة.';
      toastError('فشل التسجيل', msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Confirm Email handler
  const handleConfirmEmail = async ({ email, code }) => {
    setLoading(true);
    try {
      const data = await authService.confirmEmail({ email, code });
      toastSuccess(
        'تم تأكيد الحساب بنجاح!',
        'حسابك الآن مفعّل في كتيبة الذئاب. سجل دخولك للانطلاق!'
      );
      setActiveAuthView('login');
      return { success: true, data };
    } catch (err) {
      console.error('Confirm email error:', err);
      const msg = err.friendlyMessage || 'كود التفعيل غير صحيح أو انتهت صلاحيته.';
      toastError('فشل التأكيد', msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Resend confirmation code handler
  const handleResendConfirmation = async (email) => {
    try {
      await authService.resendConfirmationEmail({ email });
      toastSuccess(
        'كود تفعيل جديد',
        'بعتنالك كود تفعيل جديد على إيميلك، شيك عليه دلوقتي'
      );
      return { success: true };
    } catch (err) {
      const msg = err.friendlyMessage || 'تعذر إعادة إرسال كود التفعيل حالياً.';
      toastError('خطأ في الإرسال', msg);
      return { success: false, error: msg };
    }
  };

  // Send Reset Password Email (Step 1)
  const handleSendResetPasswordEmail = async (email) => {
    setLoading(true);
    try {
      await authService.sendResetPasswordEmail({ email });
      toastSuccess(
        'تم إرسال كود الاستعادة',
        'تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح.'
      );
      return { success: true };
    } catch (err) {
      const msg = err.friendlyMessage || 'تعذر إرسال كود الاستعادة. تأكد من صحة البريد الإلكتروني.';
      toastError('فشل الإرسال', msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Validate Reset Password Code (Step 2)
  const handleValidateResetPasswordCode = async ({ email, code }) => {
    setLoading(true);
    try {
      const result = await authService.validateResetPasswordCode({ email, code });
      // Backend returns { isValid: boolean }
      if (result && result.isValid === false) {
        const msg = 'كود التحقق غير صحيح أو انتهت صلاحيته.. تأكد من الكود وحاول تاني';
        toastError('كود غير صالح', msg);
        return { success: false, error: msg };
      }
      toastSuccess('كود معتمد', 'تم التحقق من الرمز بنجاح! حدد كلمة المرور الجديدة.');
      return { success: true };
    } catch (err) {
      const msg = err.friendlyMessage || 'كود التحقق غير صحيح أو انتهت صلاحيته.';
      toastError('خطأ في التحقق', msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Final (Step 3)
  const handleResetPassword = async ({ email, code, newPassword, confirmNewPassword }) => {
    setLoading(true);
    try {
      await authService.resetPassword({ email, code, newPassword, confirmNewPassword });
      toastSuccess(
        'عاش يا بطل! تم تحديث الباسورد بنجاح',
        'تم حفظ كلمة المرور الجديدة. يمكنك الآن تسجيل الدخول بها.'
      );
      setActiveAuthView('login');
      return { success: true };
    } catch (err) {
      const msg = err.friendlyMessage || 'تعذر تحديث كلمة المرور. تأكد من مطابقة كلمة المرور.';
      toastError('فشل تغيير كلمة المرور', msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Change Password (from inside Settings / Profile)
  const handleChangePassword = async ({ currentPassword, newPassword, confirmNewPassword }) => {
    setLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword, confirmNewPassword });
      toastSuccess(
        'تم تحديث كلمة المرور بنجاح!',
        'تم تغيير كلمة المرور وحسابك في أمان تام يا كابتن.'
      );
      setIsChangePasswordModalOpen(false);
      return { success: true };
    } catch (err) {
      const msg = err.friendlyMessage || 'تعذر تغيير كلمة المرور. تأكد من صحة كلمة المرور الحالية ومطابقة الجديدة.';
      toastError('فشل تغيير كلمة المرور', msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Google Login handler
  const handleGoogleLogin = async (idToken) => {
    setLoading(true);
    try {
      const data = await authService.googleLogin({ idToken, userType: 0 });
      updateAuthState();
      const currentUser = getUserInfo();
      toastSuccess('تم الدخول بحساب Google', 'مرحباً بك مجدداً في BE THE WOLF!');
      await redirectUserByRole(currentUser);
      return { success: true, data };
    } catch (err) {
      console.error('Google login error:', err);
      const msg = err.friendlyMessage || 'تعذر تسجيل الدخول عبر Google. يرجى تجربة البريد وكلمة المرور.';
      toastError('فشل تسجيل الدخول بـ Google', msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      clearAuthTokens();
      updateAuthState();
      setActiveAuthView('login');
      setLoading(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token),
        activeAuthView,
        setActiveAuthView,
        pendingConfirmationEmail,
        setPendingConfirmationEmail,
        isChangePasswordModalOpen,
        setIsChangePasswordModalOpen,
        isProfileSettingsModalOpen,
        setIsProfileSettingsModalOpen,
        updateCurrentUser,
        loading,
        login: handleLogin,
        register: handleRegister,
        confirmEmail: handleConfirmEmail,
        resendConfirmation: handleResendConfirmation,
        sendResetPasswordEmail: handleSendResetPasswordEmail,
        validateResetPasswordCode: handleValidateResetPasswordCode,
        resetPassword: handleResetPassword,
        changePassword: handleChangePassword,
        googleLogin: handleGoogleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
