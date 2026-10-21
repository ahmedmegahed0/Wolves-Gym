import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Base URL for Wolves Backend API
export const API_BASE_URL = 'https://wolves.runasp.net';

// LocalStorage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'gym_access_token',
  REFRESH_TOKEN: 'gym_refresh_token',
  USER_INFO: 'gym_user_info',
  ACTIVITY_LOG: 'gym_activity_log',
  MAX_CAPACITY: 'gym_max_capacity',
};

// Token Helper Methods
export const getAccessToken = () => {
  return (
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('gym_auth_token') ||
    ''
  );
};

export const getRefreshToken = () => {
  return (
    localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
    localStorage.getItem('refreshToken') ||
    ''
  );
};

// Project accounts provided by gym team
export const KNOWN_ACCOUNTS = [
  {
    Name: 'Super Admin',
    Email: 'superadmin@gymify.com',
    PhoneNumber: '01000000000',
    Address: 'Cairo, Egypt',
    Password: '12345678Hh',
    Role: 'SuperAdmin',
    UserType: 'SuperAdmin',
  },
  {
    Name: 'Trainer Ahmed',
    Email: 'trainer@project.com',
    PhoneNumber: '01234567893',
    Address: 'Cairo, Egypt',
    Password: '12345678Hh',
    Role: 'Trainer',
    UserType: 'Employee',
    Salary: 6000,
    YearsOfExperience: 3,
  },
  {
    Name: 'Manager Sara',
    Email: 'manager@project.com',
    PhoneNumber: '01234567894',
    Address: 'Cairo, Egypt',
    Password: '12345678Hh',
    Role: 'Manager',
    UserType: 'Employee',
    Salary: 10000,
  },
  {
    Name: 'Gator Mohamed',
    Email: 'gator@project.com',
    PhoneNumber: '01234567895',
    Address: 'Cairo, Egypt',
    Password: '12345678Hh',
    Role: 'Gator',
    UserType: 'Employee',
    Salary: 4000,
  },
  {
    Name: 'Customer User',
    Email: 'member@project.com',
    PhoneNumber: '01234567892',
    Address: 'Giza, Egypt',
    Password: '12345678Hh',
    Role: 'Customer',
    UserType: 'Customer',
    ApprovalStatus: 'Approved',
    IsActive: true,
  },
  {
    Name: 'Reception Sara',
    Email: 'reception@project.com',
    PhoneNumber: '01234567896',
    Address: 'Cairo, Egypt',
    Password: '12345678Hh',
    Role: 'Receptionist',
    UserType: 'Employee',
    Salary: 5000,
  },
];

/**
 * Standard role normalizer
 * Expected roles: SuperAdmin, Manager, Receptionist, Trainer, Customer
 */
export const normalizeRole = (roleStr = '') => {
  const r = String(roleStr || '').toLowerCase().trim();
  if (r === 'superadmin' || r === 'super_admin' || r === 'admin') return 'SuperAdmin';
  if (r === 'manager') return 'Manager';
  if (r === 'receptionist' || r === 'reception') return 'Receptionist';
  if (r === 'trainer' || r === 'coach') return 'Trainer';
  if (r === 'gator' || r === 'gate' || r === 'gatekeeper') return 'Gator';
  return 'Customer';
};

/**
 * Metadata and permissions helper per user role
 */
export const getRoleMeta = (role = '') => {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'SuperAdmin':
      return {
        role: 'SuperAdmin',
        label: 'سوبر أدمن',
        fullTitle: 'الإدارة العليا للذئاب',
        badge: '👑 سوبر أدمن',
        textColor: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        canManageLockers: false,
        canManageCustomers: false,
        canCheckInCheckOut: false,
        canApproveCustomers: false,
        primaryPath: '/dashboard/under-construction',
      };
    case 'Manager':
      return {
        role: 'Manager',
        label: 'مدير الجيم',
        fullTitle: 'إدارة تشغيل الجيم',
        badge: '📋 مدير الجيم',
        textColor: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        canManageLockers: false,
        canManageCustomers: false,
        canCheckInCheckOut: false,
        canApproveCustomers: false,
        primaryPath: '/dashboard/under-construction',
      };
    case 'Receptionist':
      return {
        role: 'Receptionist',
        label: 'موظف استقبال',
        fullTitle: 'استقبال الوحوش واللوكرات',
        badge: '🛎️ موظف استقبال',
        textColor: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        canManageLockers: true,
        canManageCustomers: true,
        canCheckInCheckOut: true,
        canApproveCustomers: true,
        primaryPath: '/dashboard/reception',
      };
    case 'Trainer':
      return {
        role: 'Trainer',
        label: 'كابتن مدرب',
        fullTitle: 'كابتن اللياقة والاشتراكات',
        badge: '💪 كابتن مدرب',
        textColor: 'text-sky-400',
        bg: 'bg-sky-500/10 border-sky-500/30',
        canManageLockers: false,
        canManageCustomers: false,
        canCheckInCheckOut: false,
        canApproveCustomers: false,
        primaryPath: '/dashboard/under-construction',
      };
    case 'Gator':
      return {
        role: 'Gator',
        label: 'مسؤول البوابة',
        fullTitle: 'بوابة الدخول والإشغال',
        badge: '🚪 مسؤول البوابة',
        textColor: 'text-orange-400',
        bg: 'bg-orange-500/10 border-orange-500/30',
        canManageLockers: false,
        canManageCustomers: false,
        canCheckInCheckOut: true,
        canApproveCustomers: false,
        primaryPath: '/dashboard/reception',
      };
    case 'Customer':
    default:
      return {
        role: 'Customer',
        label: 'عضو الجيم',
        fullTitle: 'وحش كتيبة الذئاب',
        badge: '🐺 وحش الجيم',
        textColor: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        canManageLockers: false,
        canManageCustomers: false,
        canCheckInCheckOut: false,
        canApproveCustomers: false,
        primaryPath: '/dashboard/customer',
      };
  }
};

/**
 * Decode JWT token safely in browser using jwt-decode library
 */
export const decodeJwt = (token) => {
  try {
    if (!token || typeof token !== 'string') return null;
    return jwtDecode(token);
  } catch {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
};

/**
 * Extract complete user info and role from JWT claims or fallback
 */
export const extractUserFromToken = (token, fallbackEmail = '') => {
  const decoded = decodeJwt(token);

  if (!decoded) {
    const matched = KNOWN_ACCOUNTS.find(
      (a) => a.Email.toLowerCase() === String(fallbackEmail || '').toLowerCase()
    );
    if (matched) {
      return {
        name: matched.Name,
        email: matched.Email,
        role: normalizeRole(matched.Role),
        userType: matched.UserType,
        phoneNumber: matched.PhoneNumber,
        address: matched.Address,
      };
    }
    return {
      name: fallbackEmail ? fallbackEmail.split('@')[0] : 'عضو الجيم',
      email: fallbackEmail || '',
      role: 'Customer',
      userType: 'Customer',
    };
  }

  // Extract claims from ASP.NET Core Identity JWT
  const rawRoleClaim =
    decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
    decoded.role ||
    decoded.Role;

  const roleClaim = Array.isArray(rawRoleClaim) ? rawRoleClaim[0] : rawRoleClaim;
  const userTypeClaim = decoded.UserType || decoded.userType;

  const email =
    decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
    decoded.email ||
    fallbackEmail;

  const id =
    decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
    decoded.nameid ||
    decoded.sub;

  const matched = KNOWN_ACCOUNTS.find(
    (a) => a.Email.toLowerCase() === String(email || fallbackEmail || '').toLowerCase()
  );

  // Decide exact normalized role from JWT claims first (Requirement 1)
  let role = 'Customer';
  if (roleClaim) {
    role = normalizeRole(roleClaim);
  } else if (userTypeClaim) {
    const ut = String(userTypeClaim).toLowerCase();
    if (ut === 'superadmin' || userTypeClaim === 1) role = 'SuperAdmin';
    else if (ut === 'customer' || userTypeClaim === 4) role = 'Customer';
    else role = 'Customer';
  } else if (matched?.Role) {
    role = normalizeRole(matched.Role);
  }

  const userType = userTypeClaim || (role === 'Customer' ? 'Customer' : 'Employee');

  return {
    id,
    email: email || fallbackEmail,
    name: matched?.Name || (email ? email.split('@')[0] : 'وحش الجيم'),
    role,
    userType: matched?.UserType || userType,
    permissions: Array.isArray(decoded.Permission)
      ? decoded.Permission
      : (decoded.Permission ? [decoded.Permission] : []),
    phoneNumber: matched?.PhoneNumber || '',
  };
};

export const setAuthTokens = ({ accessToken, refreshToken, userInfo = null, fallbackEmail = '' }) => {
  if (accessToken) {
    const accessStr =
      typeof accessToken === 'string'
        ? accessToken
        : (accessToken?.token || accessToken?.accessToken || JSON.stringify(accessToken));
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, String(accessStr).trim());
    localStorage.setItem('gym_auth_token', String(accessStr).trim());

    // Auto-extract and enrich userInfo with accurate role
    let finalUser = userInfo;
    if (!finalUser || !finalUser.role) {
      finalUser = extractUserFromToken(accessStr, finalUser?.email || fallbackEmail);
    } else {
      finalUser.role = normalizeRole(finalUser.role);
    }
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(finalUser));
  } else if (userInfo) {
    userInfo.role = normalizeRole(userInfo.role);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
  }

  if (refreshToken) {
    const refreshStr =
      typeof refreshToken === 'string'
        ? refreshToken
        : (refreshToken?.token || refreshToken?.refreshToken || JSON.stringify(refreshToken));
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, String(refreshStr).trim());
  }
};

export const clearAuthTokens = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_INFO);
  localStorage.removeItem('gym_auth_token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const getUserInfo = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && parsed.role) return parsed;
    const token = getAccessToken();
    if (token) {
      const extracted = extractUserFromToken(token, parsed?.email || '');
      const merged = { ...parsed, ...extracted };
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return null;
  }
};

// Backward compatibility helper
export const getStoredToken = getAccessToken;
export const setStoredToken = (token) => {
  setAuthTokens({ accessToken: token });
};

// Create main Axios client instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 12000,
});

// Flag and queue to manage concurrent token refreshing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Auth endpoints that should NEVER send a Bearer token
const AUTH_PUBLIC_ENDPOINTS = [
  '/api/Authentication/login',
  '/api/Authentication/register-customer',
  '/api/Authentication/google',
  '/api/Authentication/confirm-email',
  '/api/Authentication/resend-confirmation-email',
  '/api/Authentication/send-reset-password-email',
  '/api/Authentication/validate-reset-password-code',
  '/api/Authentication/reset-password',
];

// Request Interceptor: Inject Bearer Token (skip auth endpoints)
apiClient.interceptors.request.use(
  (config) => {
    const isAuthEndpoint = AUTH_PUBLIC_ENDPOINTS.some((ep) => config.url?.includes(ep));
    if (!isAuthEndpoint) {
      const token = getAccessToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      // Explicitly remove any Authorization header for public auth endpoints
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format errors and handle Silent Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle ProblemDetails messages
    let friendlyMessage = 'حدث خطأ أثناء الاتصال بالسيرفر. يرجى المحاولة لاحقاً.';
    if (error.response?.data) {
      const { data, status } = error.response;
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const errorDescriptions = data.errors.map((e) => {
          if (e.code === 'AUTH_INVALID_CREDENTIALS' || e.description?.includes('Invalid Email or password')) {
            return 'البريد الإلكتروني أو كلمة المرور غير صحيحة، أو هذا الحساب غير موجود على سيرفر wolves.runasp.net';
          }
          if (e.code === 'AUTH_EMAIL_NOT_VERIFIED' || e.description?.includes('Email is not verified')) {
            return 'الحساب موجود لكن لم يتم تفعيل البريد الإلكتروني بكود التحقق بعد.';
          }
          if (e.description?.toLowerCase().includes('pending for approval') || e.code?.includes('APPROVAL')) {
            return 'حسابك في انتظار موافقة إدارة الجيم (Pending Approval). يرجى من إدارة الجيم/الأونر تفعيل الحساب لتتمكن من الدخول.';
          }
          if (e.code === 'LOCKER_NUMBER_ALREADY_EXISTS' || e.description?.toLowerCase().includes('already exists')) {
            return 'رقم اللوكر ده مسجل وموجود بالفعل في السيستم! اختر رقم دولاب تاني.';
          }
          if (e.code === 'LOCKER_NOT_FOUND' || e.description?.toLowerCase().includes('was not found')) {
            return 'اللوكر المطلوب غير موجود أو تم حذفه.';
          }
          if (e.code === 'GreaterThanValidator' || e.description?.toLowerCase().includes('greater than zero')) {
            return 'رقم اللوكر لازم يكون رقم صحيح وموجب أكبر من صفر.';
          }
          return e.description || e.code;
        });
        friendlyMessage = errorDescriptions.join('; ');
      } else if (data.detail) {
        if (data.detail.toLowerCase().includes('pending for approval')) {
          friendlyMessage = 'حسابك في انتظار موافقة إدارة الجيم (Pending Approval). يرجى من إدارة الجيم/الأونر تفعيل الحساب لتتمكن من الدخول.';
        } else if (data.detail.toLowerCase().includes('already exists')) {
          friendlyMessage = 'رقم اللوكر ده مسجل وموجود بالفعل في السيستم! اختر رقم دولاب تاني.';
        } else {
          friendlyMessage = data.detail;
        }
      } else if (data.title) {
        if (data.title === 'Unauthorized') friendlyMessage = 'البريد أو كلمة المرور غير صحيحة';
        else if (data.title === 'Conflict') friendlyMessage = 'رقم اللوكر ده مسجل وموجود بالفعل في السيستم! اختر رقم دولاب تاني.';
        else friendlyMessage = data.title;
      } else if (typeof data === 'string') {
        friendlyMessage = data;
      }

      const isDefaultGenericMessage = !friendlyMessage || friendlyMessage === 'حدث خطأ أثناء الاتصال بالسيرفر. يرجى المحاولة لاحقاً.';
      if (status === 401 && isDefaultGenericMessage) {
        friendlyMessage = 'بيانات الدخول غير صحيحة أو هذا الحساب غير مسجل بالسيرفر.';
      } else if (status === 403 && isDefaultGenericMessage) {
        friendlyMessage = 'حسابك معلق وفي انتظار تفعيل الإدارة (Pending Approval)، أو ليس لديك صلاحية للدخول.';
      } else if (status === 404 && isDefaultGenericMessage) {
        friendlyMessage = 'اللوكر أو المورد المطلوب غير موجود بالسيستم.';
      } else if (status === 409 && isDefaultGenericMessage) {
        friendlyMessage = 'رقم اللوكر ده مسجل وموجود بالفعل في السيستم! اختر رقم دولاب تاني.';
      }
    } else if (error.request) {
      friendlyMessage = 'تعذر الاتصال بسيرفر الجيم. يرجى التحقق من اتصال الإنترنت.';
    }
    error.friendlyMessage = friendlyMessage;

    // Check if error is 401 and eligible for silent refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAuthEndpoint = 
        originalRequest.url.includes('/api/Authentication/login') ||
        originalRequest.url.includes('/api/Authentication/refresh-token') ||
        originalRequest.url.includes('/api/Authentication/register-customer');

      if (!isAuthEndpoint) {
        const storedRefreshToken = getRefreshToken();
        const storedAccessToken = getAccessToken();

        if (storedRefreshToken && storedAccessToken) {
          if (isRefreshing) {
            // Queue request until refresh completes
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((newToken) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // Call refresh token endpoint directly with unintercepted axios call
            const refreshResponse = await axios.post(
              `${API_BASE_URL}/api/Authentication/refresh-token`,
              {
                accessToken: storedAccessToken,
                refreshToken: storedRefreshToken,
              },
              { headers: { 'Content-Type': 'application/json' } }
            );

            const newAccessToken =
              refreshResponse.data?.accessToken ||
              refreshResponse.data?.token ||
              refreshResponse.data;
            const newRefreshToken =
              refreshResponse.data?.refreshToken || storedRefreshToken;

            if (typeof newAccessToken === 'string' && newAccessToken.length > 10) {
              setAuthTokens({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              });

              processQueue(null, newAccessToken);
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return apiClient(originalRequest);
            } else {
              throw new Error('Invalid refresh token response');
            }
          } catch (refreshError) {
            processQueue(refreshError, null);
            clearAuthTokens();
            // Dispatch event for UI to update auth state
            window.dispatchEvent(new CustomEvent('gym_auth_expired'));
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        } else {
          // No tokens stored
          clearAuthTokens();
          window.dispatchEvent(new CustomEvent('gym_auth_expired'));
        }
      }
    }

    return Promise.reject(error);
  }
);

// Authentication Service Endpoints
export const authService = {
  /**
   * POST /api/Authentication/register-customer
   * Body: { name, email, password, confirmPassword, phoneNumber }
   */
  async register({ name, email, password, confirmPassword, phoneNumber }) {
    const payload = {
      name: String(name || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      password: String(password || ''),
      confirmPassword: String(confirmPassword || ''),
      phoneNumber: String(phoneNumber || '').trim(),
    };
    const response = await apiClient.post('/api/Authentication/register-customer', payload);
    return response.data;
  },

  /**
   * POST /api/Authentication/login
   * Body: { email, password }
   */
  async login({ email, password }) {
    // Clear any stale tokens BEFORE login to prevent "You are already Logged in !" error
    clearAuthTokens();

    const payload = {
      email: String(email || '').trim().toLowerCase(),
      password: String(password || ''),
    };

    try {
      const response = await apiClient.post('/api/Authentication/login', payload);
      
      // Save tokens if present in response
      const data = response.data;
      const accessToken = data?.accessToken || data?.token || (typeof data === 'string' ? data : null);
      const refreshToken = data?.refreshToken || null;

      if (accessToken) {
        const userInfo = extractUserFromToken(accessToken, payload.email);
        if (data?.user?.name) userInfo.name = data.user.name;
        if (data?.user?.id) userInfo.id = data.user.id;
        if (data?.user?.role) userInfo.role = normalizeRole(data.user.role);
        setAuthTokens({
          accessToken,
          refreshToken,
          userInfo,
          fallbackEmail: payload.email,
        });
      }

      return response.data;
    } catch (err) {
      // Check if remote backend server is down (HTTP 500 / Network Error)
      const isServerDown = !err.response || err.response.status >= 500 || err.code === 'ERR_NETWORK';
      if (isServerDown) {
        // Match against project accounts for seamless offline operation
        const matched = KNOWN_ACCOUNTS.find(
          (acc) => acc.Email.toLowerCase() === payload.email && acc.Password === payload.password
        );
        if (matched) {
          const mockToken = `mock-token-${matched.Role.toLowerCase()}-${Date.now()}`;
          const userInfo = {
            name: matched.Name,
            email: matched.Email,
            role: matched.Role,
            phoneNumber: matched.PhoneNumber,
            address: matched.Address,
            userType: matched.UserType,
          };
          setAuthTokens({
            accessToken: mockToken,
            refreshToken: `mock-refresh-${Date.now()}`,
            userInfo,
          });
          return {
            accessToken: mockToken,
            token: mockToken,
            user: userInfo,
            name: matched.Name,
            isMockAuth: true,
          };
        }
      }
      throw err;
    }
  },

  /**
   * POST /api/Authentication/google
   * Body: { idToken, userType: 0 }
   */
  async googleLogin({ idToken, userType = 0 }) {
    // Clear any stale tokens BEFORE Google login
    clearAuthTokens();

    const payload = {
      idToken: String(idToken || '').trim(),
      userType: Number(userType),
    };
    const response = await apiClient.post('/api/Authentication/google', payload);
    
    const data = response.data;
    const accessToken = data?.accessToken || data?.token || (typeof data === 'string' ? data : null);
    const refreshToken = data?.refreshToken;

    if (accessToken) {
      setAuthTokens({
        accessToken,
        refreshToken,
        userInfo: { email: data?.email, name: data?.name || 'Google User' },
      });
    }

    return response.data;
  },

  /**
   * POST /api/Authentication/confirm-email
   * Body: { email, code }
   */
  async confirmEmail({ email, code }) {
    const payload = {
      email: String(email || '').trim().toLowerCase(),
      code: String(code || '').trim(),
    };
    const response = await apiClient.post('/api/Authentication/confirm-email', payload);
    return response.data;
  },

  /**
   * POST /api/Authentication/resend-confirmation-email
   * Body: { email }
   */
  async resendConfirmationEmail({ email }) {
    const payload = {
      email: String(email || '').trim().toLowerCase(),
    };
    const response = await apiClient.post('/api/Authentication/resend-confirmation-email', payload);
    return response.data;
  },

  /**
   * POST /api/Authentication/refresh-token
   * Body: { accessToken, refreshToken }
   */
  async refreshToken({ accessToken, refreshToken }) {
    const payload = {
      accessToken: String(accessToken || getAccessToken()).trim(),
      refreshToken: String(refreshToken || getRefreshToken()).trim(),
    };
    const response = await apiClient.post('/api/Authentication/refresh-token', payload);
    return response.data;
  },

  /**
   * POST /api/Authentication/send-reset-password-email
   * Body: { email }
   */
  async sendResetPasswordEmail({ email }) {
    const payload = {
      email: String(email || '').trim().toLowerCase(),
    };
    const response = await apiClient.post('/api/Authentication/send-reset-password-email', payload);
    return response.data;
  },

  /**
   * POST /api/Authentication/validate-reset-password-code
   * Body: { email, code }
   */
  async validateResetPasswordCode({ email, code }) {
    const payload = {
      email: String(email || '').trim().toLowerCase(),
      code: String(code || '').trim(),
    };
    const response = await apiClient.post('/api/Authentication/validate-reset-password-code', payload);
    return response.data; // returns { isValid: boolean }
  },

  /**
   * POST /api/Authentication/reset-password
   * Body: { email, code, newPassword, confirmNewPassword }
   */
  async resetPassword({ email, code, newPassword, confirmNewPassword }) {
    const payload = {
      email: String(email || '').trim().toLowerCase(),
      code: String(code || '').trim(),
      newPassword: String(newPassword || ''),
      confirmNewPassword: String(confirmNewPassword || ''),
    };
    const response = await apiClient.post('/api/Authentication/reset-password', payload);
    return response.data;
  },

  /**
   * POST /api/Authentication/change-password
   * Body: { currentPassword, newPassword, confirmNewPassword }
   */
  async changePassword({ currentPassword, newPassword, confirmNewPassword }) {
    const payload = {
      currentPassword: String(currentPassword || ''),
      newPassword: String(newPassword || ''),
      confirmNewPassword: String(confirmNewPassword || ''),
    };
    const response = await apiClient.post('/api/Authentication/change-password', payload);
    return response.data;
  },

  /**
   * POST /api/Authentication/logout
   * Body: { refreshToken }
   */
  async logout() {
    const storedRefreshToken = getRefreshToken();
    try {
      if (storedRefreshToken) {
        await apiClient.post('/api/Authentication/logout', {
          refreshToken: storedRefreshToken,
        });
      }
    } catch (e) {
      console.warn('Logout API call finished with warning:', e.message);
    } finally {
      clearAuthTokens();
      window.dispatchEvent(new CustomEvent('gym_auth_logged_out'));
    }
  },
};

// Mock customers data for offline resilience / server downtime
const DEFAULT_MOCK_CUSTOMERS = [
  {
    id: 1,
    name: 'أحمد مجاهد (كابتن الوحوش)',
    phoneNumber: '01012345678',
    code: 'WOLF-001',
    approvalStatus: 0, // 0 = Pending
    isActive: false,
    height: 182,
    weight: 85,
    age: 26,
    musclePercentage: 44.5,
    fatPercentage: 13.2,
    injuries: 'إصابة قديمة خفيفة في الكتف الأيمن',
    chronicDiseases: 'لا يوجد',
    notes: 'تمرين كمال أجسام وبناء كتلة عضلية نقية',
    createdAt: '2026-10-21T10:30:00Z'
  },
  {
    id: 2,
    name: 'محمود الصاوي',
    phoneNumber: '01123456789',
    code: 'WOLF-002',
    approvalStatus: 1, // 1 = Approved
    isActive: true,
    height: 175,
    weight: 78,
    age: 24,
    musclePercentage: 42.0,
    fatPercentage: 15.5,
    injuries: 'لا يوجد',
    chronicDiseases: 'لا يوجد',
    notes: 'ملتزم في المواعيد وبرنامج القوة البدنية',
    createdAt: '2026-10-20T14:15:00Z'
  },
  {
    id: 3,
    name: 'كريم عبد العزيز',
    phoneNumber: '01234567890',
    code: 'WOLF-003',
    approvalStatus: 0, // 0 = Pending
    isActive: false,
    height: 188,
    weight: 96,
    age: 29,
    musclePercentage: 47.0,
    fatPercentage: 18.0,
    injuries: 'خشونة ركبة بسيطة',
    chronicDiseases: 'ضغط دم خفيف',
    notes: 'يحتاج تركيز على تمارين الكارديو والإحماء الجيد',
    createdAt: '2026-10-21T12:00:00Z'
  },
  {
    id: 4,
    name: 'عمر الشريف',
    phoneNumber: '01098765432',
    code: 'WOLF-004',
    approvalStatus: 1, // 1 = Approved
    isActive: true,
    height: 170,
    weight: 68,
    age: 21,
    musclePercentage: 39.5,
    fatPercentage: 11.8,
    injuries: 'لا يوجد',
    chronicDiseases: 'لا يوجد',
    notes: 'تنشيف ولياقة بدنية عالية وسرعة استشفاء',
    createdAt: '2026-10-19T09:40:00Z'
  },
  {
    id: 5,
    name: 'ياسر ممدوح',
    phoneNumber: '01555554321',
    code: 'WOLF-005',
    approvalStatus: 2, // 2 = Rejected
    isActive: false,
    height: 165,
    weight: 90,
    age: 35,
    musclePercentage: 33.0,
    fatPercentage: 29.5,
    injuries: 'انزلاق غضروفي قطني',
    chronicDiseases: 'سكر وضغط',
    notes: 'تم رفض الاشتراك لحين إحضار تقرير طبي يسمح بممارسة الأوزان',
    createdAt: '2026-10-18T18:20:00Z'
  },
  {
    id: 6,
    name: 'طارق حسام',
    phoneNumber: '01044443322',
    code: 'WOLF-006',
    approvalStatus: 0, // 0 = Pending
    isActive: false,
    height: 180,
    weight: 82,
    age: 27,
    musclePercentage: 41.8,
    fatPercentage: 16.0,
    injuries: 'لا يوجد',
    chronicDiseases: 'حساسية صدر خفيفة',
    notes: 'مشترك جديد عبر الموقع - طلب اشتراك باقة 3 شهور VIP',
    createdAt: '2026-10-21T15:10:00Z'
  }
];

const getMockCustomers = () => {
  try {
    const saved = localStorage.getItem('gym_mock_customers');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error reading mock customers from storage:', e);
  }
  localStorage.setItem('gym_mock_customers', JSON.stringify(DEFAULT_MOCK_CUSTOMERS));
  return DEFAULT_MOCK_CUSTOMERS;
};

const saveMockCustomers = (list) => {
  try {
    localStorage.setItem('gym_mock_customers', JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving mock customers to storage:', e);
  }
};

// Customer Service Methods (GET, PATCH, PUT, ME)
export const customerService = {
  /**
   * GET /api/customers
   * Query: { ApprovalStatus, PageNumber, PageSize, Search, SortBy }
   */
  async getCustomers({ approvalStatus, pageNumber = 1, pageSize = 10, search = '', sortBy = '' } = {}) {
    const params = new URLSearchParams();
    if (approvalStatus !== undefined && approvalStatus !== null && approvalStatus !== '') {
      params.append('ApprovalStatus', String(approvalStatus));
    }
    if (pageNumber) params.append('PageNumber', String(pageNumber));
    if (pageSize) params.append('PageSize', String(pageSize));
    if (search && search.trim()) params.append('Search', search.trim());
    if (sortBy && sortBy.trim()) params.append('SortBy', sortBy.trim());

    try {
      const response = await apiClient.get(`/api/customers?${params.toString()}`);
      const data = response.data;

      // Handle paginated envelope vs flat array
      if (data && Array.isArray(data.items)) {
        return {
          items: data.items,
          totalCount: typeof data.totalCount === 'number' ? data.totalCount : data.items.length,
          pageNumber: Number(data.pageNumber) || pageNumber,
          pageSize: Number(data.pageSize) || pageSize,
          totalPages: Number(data.totalPages) || Math.ceil((data.totalCount || data.items.length) / pageSize),
        };
      } else if (data && Array.isArray(data.data)) {
        return {
          items: data.data,
          totalCount: typeof data.totalCount === 'number' ? data.totalCount : data.data.length,
          pageNumber: Number(data.pageNumber) || pageNumber,
          pageSize: Number(data.pageSize) || pageSize,
          totalPages: Number(data.totalPages) || Math.ceil((data.totalCount || data.data.length) / pageSize),
        };
      } else if (Array.isArray(data)) {
        return {
          items: data,
          totalCount: data.length,
          pageNumber,
          pageSize,
          totalPages: Math.max(1, Math.ceil(data.length / pageSize)),
        };
      }

      return {
        items: [],
        totalCount: 0,
        pageNumber,
        pageSize,
        totalPages: 1,
      };
    } catch (err) {
      console.warn('Backend customers API error, using resilient local storage:', err.message);

      // Fallback to local mock data if server is down (e.g. ASP.NET 500 error)
      let list = getMockCustomers();

      // Filter by approvalStatus if specified
      if (approvalStatus !== undefined && approvalStatus !== null && approvalStatus !== '') {
        list = list.filter((c) => Number(c.approvalStatus) === Number(approvalStatus));
      }

      // Filter by search query
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter((c) => 
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phoneNumber && c.phoneNumber.includes(q)) ||
          (c.code && c.code.toLowerCase().includes(q))
        );
      }

      // Sort
      if (sortBy) {
        if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === 'code') list.sort((a, b) => a.code.localeCompare(b.code));
        else if (sortBy === 'createdAt') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        else if (sortBy === 'weight') list.sort((a, b) => b.weight - a.weight);
      }

      const totalCount = list.length;
      const startIndex = (pageNumber - 1) * pageSize;
      const paginatedItems = list.slice(startIndex, startIndex + pageSize);

      return {
        items: paginatedItems,
        totalCount,
        pageNumber,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
        isMock: true,
      };
    }
  },

  /**
   * PATCH /api/customers/{id}/approval-status
   * Body: { status: number } (1 = approved, 2 = rejected)
   */
  async updateApprovalStatus(id, status) {
    const payload = { status: Number(status) };
    try {
      const response = await apiClient.patch(`/api/customers/${id}/approval-status`, payload);
      return response.data || { success: true };
    } catch (err) {
      console.warn('PATCH approval status API error, updating local mock:', err.message);
      const list = getMockCustomers();
      const updated = list.map((c) => {
        if (String(c.id) === String(id)) {
          return {
            ...c,
            approvalStatus: Number(status),
            isActive: Number(status) === 1,
          };
        }
        return c;
      });
      saveMockCustomers(updated);
      return { success: true, isMock: true };
    }
  },

  /**
   * PATCH /api/customers/{id}
   * Body: UpdateCustomerRequest model
   */
  async updateCustomer(id, data) {
    const payload = {
      name: String(data.name || '').trim(),
      phoneNumber: String(data.phoneNumber || '').trim(),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      height: Number(data.height) || 0,
      weight: Number(data.weight) || 0,
      age: Number(data.age) || 0,
      musclePercentage: Number(data.musclePercentage) || 0,
      fatPercentage: Number(data.fatPercentage) || 0,
      injuries: String(data.injuries || '').trim(),
      chronicDiseases: String(data.chronicDiseases || '').trim(),
      notes: String(data.notes || '').trim(),
    };

    if (data.code && String(data.code).trim()) {
      payload.code = String(data.code).trim().toUpperCase();
    }

    try {
      // Backend uses PATCH /api/customers/{id}
      let response;
      try {
        response = await apiClient.patch(`/api/customers/${id}`, payload);
      } catch (patchErr) {
        if (patchErr.response?.status === 405) {
          response = await apiClient.put(`/api/customers/${id}`, payload);
        } else {
          throw patchErr;
        }
      }
      return response.data || { success: true };
    } catch (err) {
      console.warn('Customer update API error, updating local storage:', err.message);
      const list = getMockCustomers();
      const updated = list.map((c) => {
        if (String(c.id || c.customerId) === String(id)) {
          return {
            ...c,
            ...payload,
          };
        }
        return c;
      });
      saveMockCustomers(updated);
      return { success: true, isMock: true };
    }
  },

  /**
   * GET /api/customers/me
   */
  async getCustomerMe() {
    try {
      const response = await apiClient.get('/api/customers/me');
      return response.data;
    } catch (err) {
      console.warn('GET /api/customers/me error, returning logged-in fallback:', err.message);
      const user = getUserInfo();
      const list = getMockCustomers();
      const matched = list.find((c) => c.phoneNumber === user?.phoneNumber || c.name === user?.name);
      if (matched) return matched;
      return {
        id: 99,
        name: user?.name || 'Customer User',
        phoneNumber: user?.phoneNumber || '01234567892',
        code: 'WOLF-MEMBER',
        approvalStatus: 1,
        isActive: true,
        height: 178,
        weight: 79,
        age: 26,
        musclePercentage: 44.5,
        fatPercentage: 14.2,
        injuries: 'لا يوجد',
        chronicDiseases: 'لا يوجد',
        notes: 'عضو نشط ومعتمد - ملتزم ببرنامج القوة والضخامة العضلية',
      };
    }
  },
};

// Attendance Service Methods
export const attendanceService = {
  async getCurrentOccupancy() {
    const response = await apiClient.get('/api/Attendances/current-occupancy');
    return response.data;
  },

  async checkIn({ code, lockerId }) {
    const payload = {
      code: String(code).trim(),
      lockerId: Number(lockerId),
    };
    const response = await apiClient.post('/api/Attendances/check-in', payload);
    return response.data || { success: true };
  },

  async checkOut({ code }) {
    const payload = {
      code: String(code).trim(),
    };
    const response = await apiClient.post('/api/Attendances/check-out', payload);
    return response.data || { success: true };
  },

  async getLockers(isActive = true) {
    try {
      return await lockerService.getLockers(isActive);
    } catch {
      return [];
    }
  },
};

// Lockers Service Methods for Lockers Management Module
export const lockerService = {
  /**
   * GET /api/Lockers
   * @param {boolean|undefined|null} isActive - Optional filter (true = active, false = inactive, undefined = all)
   * @returns {Promise<Array<{ id: number, number: number, isActive: boolean, isAvailable: boolean, createdAt: string, updatedAt: string|null }>>}
   */
  async getLockers(isActive = undefined) {
    let url = '/api/Lockers';
    if (typeof isActive === 'boolean') {
      url += `?isActive=${isActive}`;
    }
    const response = await apiClient.get(url);
    const list = Array.isArray(response.data) ? response.data : [];
    return list.sort((a, b) => Number(a.number) - Number(b.number));
  },

  /**
   * POST /api/Lockers
   * @param {{ number: number }} payload
   */
  async createLocker({ number }) {
    const payload = {
      number: Number(number),
    };
    const response = await apiClient.post('/api/Lockers', payload);
    return response.data;
  },

  /**
   * PATCH /api/Lockers/{id}/status
   * @param {number|string} id
   * @param {boolean} isActive
   */
  async toggleLockerStatus(id, isActive) {
    const payload = {
      isActive: Boolean(isActive),
    };
    const response = await apiClient.patch(`/api/Lockers/${id}/status`, payload);
    return response.data;
  },

  /**
   * Edit Locker Details: PATCH /api/Lockers/{id} (with fallback to PUT /api/Lockers/{id})
   * @param {number|string} id
   * @param {{ number: number, isActive?: boolean }} data
   */
  async updateLocker(id, { number, isActive }) {
    const payload = {
      number: Number(number),
    };
    if (typeof isActive === 'boolean') {
      payload.isActive = isActive;
    }
    try {
      const response = await apiClient.patch(`/api/Lockers/${id}`, payload);
      return response.data;
    } catch (err) {
      if (err.response?.status === 405) {
        const putRes = await apiClient.put(`/api/Lockers/${id}`, payload);
        return putRes.data;
      }
      throw err;
    }
  },
};

// ============================================================================
// PACKAGES & MEMBERSHIP PLANS SERVICE (باقات واشتراكات كتيبة الذئاب)
// ============================================================================

const PACKAGES_STORAGE_KEY = 'gym_packages_cache';

const DEFAULT_PACKAGES = [
  {
    id: 1,
    name: 'اشتراك الذئب البرونزي (شهر)',
    price: 650,
    duration: 30,
    description: 'دخول غير محدود لصالة الأجهزة والحديد\nاستخدام اللوكرات وغرفة تبديل الملابس\nجلسة تقييم بدني مجانية (InBody)\nمتابعة مستوى اللياقة والوزن أسبوعياً',
    isActive: true,
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'اشتراك الذئب الفضي (3 شهور)',
    price: 1750,
    duration: 90,
    description: 'دخول شامل لجميع الصالات وأجهزة الكارديو والحديد\n3 جلسات InBody مجانية ومتابعة دورية مع الكابتن\nخطة تدريبية مخصصة ومحدثة شهرياً\nإمكانية تجميد الاشتراك لمدة 14 يوماً مجاناً\nخصم 15% على مكملات البار الرياضي',
    isActive: true,
    isPopular: true,
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'اشتراك الذئب الذهبي (6 شهور)',
    price: 3200,
    duration: 180,
    description: 'دخول VIP لجميع مرافق الجيم والساونا والبخار\nلوكر خاص مخصص طوال فترة الاشتراك\nجلسات قياس ومتابعة نظام غذائي احترافي\nإمكانية تجميد الاشتراك حتى 30 يوماً\nدعوة مجانية لصديق (Free Pass) شهرياً',
    isActive: true,
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'اشتراك ألفا الذئاب السنوي (VIP)',
    price: 5800,
    duration: 365,
    description: 'العضوية الملكية الكاملة لصالة BE THE WOLF\nلوكر ذكي ثابت + حقيبة رياضية خاصة بالصالة\nاستخدام غير محدود للساونا والجاكوزي والبخار\nخطة تدريب وتغذية متكاملة مع كابتن خاص\nإمكانية تجميد حتى 60 يوماً + 5 دعوات للأصدقاء',
    isActive: true,
    createdAt: '2026-10-01T00:00:00Z',
  },
];

const getCachedPackages = () => {
  try {
    const raw = localStorage.getItem(PACKAGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_PACKAGES;
};

const saveCachedPackages = (pkgs) => {
  try {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(pkgs));
  } catch {}
};

export const packageService = {
  /**
   * GET /api/Packages (Public / Customer Plans)
   * @param {{ pageNumber?: number, pageSize?: number, search?: string, sortBy?: string }} params
   */
  async getPackages({ pageNumber = 1, pageSize = 12, search = '', sortBy = '' } = {}) {
    const query = new URLSearchParams();
    if (pageNumber) query.append('PageNumber', pageNumber);
    if (pageSize) query.append('PageSize', pageSize);
    if (search && search.trim()) query.append('Search', search.trim());
    if (sortBy && sortBy.trim()) query.append('SortBy', sortBy.trim());

    try {
      const response = await apiClient.get(`/api/Packages?${query.toString()}`);
      const payload = response.data;

      // Handle standard paginated response { data: [...], totalCount: ... }
      if (payload && Array.isArray(payload.data) && payload.data.length > 0) {
        saveCachedPackages(payload.data);
        return {
          data: payload.data,
          totalCount: payload.totalCount ?? payload.data.length,
          currentPage: payload.currentPage ?? pageNumber,
          totalPages: payload.totalPages ?? Math.ceil(payload.totalCount / pageSize),
          pageSize: payload.pageSize ?? pageSize,
        };
      }
      if (Array.isArray(payload) && payload.length > 0) {
        saveCachedPackages(payload);
        return {
          data: payload,
          totalCount: payload.length,
          currentPage: pageNumber,
          totalPages: Math.ceil(payload.length / pageSize),
          pageSize,
        };
      }
      // If server returns empty list, fallback to cached or default packages
      const cached = getCachedPackages();
      let filtered = cached.filter((p) => p.isActive !== false);
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
      }
      return {
        data: filtered,
        totalCount: filtered.length,
        currentPage: pageNumber,
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
        pageSize,
        isFallback: true,
      };
    } catch (err) {
      console.warn('GET /api/Packages API error, returning cached fallback:', err.message);
      const cached = getCachedPackages();
      let filtered = cached.filter((p) => p.isActive !== false);
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
      }
      return {
        data: filtered,
        totalCount: filtered.length,
        currentPage: pageNumber,
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
        pageSize,
        isFallback: true,
      };
    }
  },

  /**
   * GET /api/Packages/management (Admin / Manager Table)
   * @param {{ pageNumber?: number, pageSize?: number, search?: string, sortBy?: string }} params
   */
  async getManagementPackages({ pageNumber = 1, pageSize = 10, search = '', sortBy = '' } = {}) {
    const query = new URLSearchParams();
    if (pageNumber) query.append('PageNumber', pageNumber);
    if (pageSize) query.append('PageSize', pageSize);
    if (search && search.trim()) query.append('Search', search.trim());
    if (sortBy && sortBy.trim()) query.append('SortBy', sortBy.trim());

    try {
      const response = await apiClient.get(`/api/Packages/management?${query.toString()}`);
      const payload = response.data;

      if (payload && Array.isArray(payload.data) && payload.data.length > 0) {
        saveCachedPackages(payload.data);
        return {
          data: payload.data,
          totalCount: payload.totalCount ?? payload.data.length,
          currentPage: payload.currentPage ?? pageNumber,
          totalPages: payload.totalPages ?? Math.ceil(payload.totalCount / pageSize),
          pageSize: payload.pageSize ?? pageSize,
        };
      }
      if (Array.isArray(payload) && payload.length > 0) {
        saveCachedPackages(payload);
        return {
          data: payload,
          totalCount: payload.length,
          currentPage: pageNumber,
          totalPages: Math.ceil(payload.length / pageSize),
          pageSize,
        };
      }
      // If server returns empty list, fallback to cached
      const cached = getCachedPackages();
      let filtered = [...cached];
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
      }
      return {
        data: filtered,
        totalCount: filtered.length,
        currentPage: pageNumber,
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
        pageSize,
        isFallback: true,
      };
    } catch (err) {
      console.warn('GET /api/Packages/management error, returning cached fallback:', err.message);
      const cached = getCachedPackages();
      let filtered = [...cached];
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
      }
      return {
        data: filtered,
        totalCount: filtered.length,
        currentPage: pageNumber,
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
        pageSize,
        isFallback: true,
      };
    }
  },

  /**
   * GET /api/Packages/{id}
   */
  async getPackageById(id) {
    try {
      const response = await apiClient.get(`/api/Packages/${id}`);
      return response.data;
    } catch (err) {
      console.warn(`GET /api/Packages/${id} error:`, err.message);
      const cached = getCachedPackages();
      return cached.find((p) => String(p.id) === String(id));
    }
  },

  /**
   * GET /api/Packages/management/{id}
   */
  async getManagementPackageById(id) {
    try {
      const response = await apiClient.get(`/api/Packages/management/${id}`);
      return response.data;
    } catch (err) {
      console.warn(`GET /api/Packages/management/${id} error:`, err.message);
      const cached = getCachedPackages();
      return cached.find((p) => String(p.id) === String(id));
    }
  },

  /**
   * POST /api/Packages
   * Body: { name, price, duration, description, isActive }
   */
  async createPackage({ name, price, duration, description, isActive = true }) {
    const payload = {
      name: String(name || '').trim(),
      price: Number(price) || 0,
      duration: Number(duration) || 30,
      description: String(description || '').trim(),
      isActive: Boolean(isActive),
    };

    try {
      const response = await apiClient.post('/api/Packages', payload);
      const created = response.data || { id: Date.now(), ...payload };
      // Update local cache
      const cached = getCachedPackages();
      saveCachedPackages([created, ...cached]);
      return created;
    } catch (err) {
      console.warn('POST /api/Packages API error, saving to local cache:', err.message);
      const cached = getCachedPackages();
      const mockCreated = {
        id: Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
      };
      saveCachedPackages([mockCreated, ...cached]);
      return mockCreated;
    }
  },

  /**
   * PATCH /api/Packages/{id} (with fallback to PUT /api/Packages/{id})
   * Body: { name, price, duration, description, isActive }
   */
  async updatePackage(id, { name, price, duration, description, isActive }) {
    const payload = {
      name: String(name || '').trim(),
      price: Number(price) || 0,
      duration: Number(duration) || 30,
      description: String(description || '').trim(),
      isActive: Boolean(isActive),
    };

    try {
      let response;
      try {
        response = await apiClient.patch(`/api/Packages/${id}`, payload);
      } catch (patchErr) {
        if (patchErr.response?.status === 405) {
          response = await apiClient.put(`/api/Packages/${id}`, payload);
        } else {
          throw patchErr;
        }
      }
      const updated = response?.data || { id, ...payload };
      // Update local cache
      const cached = getCachedPackages();
      const nextList = cached.map((p) => (String(p.id) === String(id) ? { ...p, ...payload } : p));
      saveCachedPackages(nextList);
      return updated;
    } catch (err) {
      console.warn(`Update package API error for ID ${id}, updating local cache:`, err.message);
      const cached = getCachedPackages();
      const nextList = cached.map((p) => (String(p.id) === String(id) ? { ...p, ...payload, updatedAt: new Date().toISOString() } : p));
      saveCachedPackages(nextList);
      return { id, ...payload, isMock: true };
    }
  },

  /**
    * Toggle Package Active Status
   * @param {number|string} id
   * @param {object} currentPackage
   */
  async togglePackageStatus(id, currentPackage) {
    const nextStatus = !currentPackage.isActive;
    return await this.updatePackage(id, {
      ...currentPackage,
      isActive: nextStatus,
    });
  },

  /**
   * POST /api/Subscriptions
   * Body: { customerId, packageId, paymentMethod, notes }
   */
  async subscribe({ customerId, packageId, paymentMethod = 0, notes = '', customer = null, packageItem = null }) {
    return await subscriptionService.createSubscription({ customerId, packageId, paymentMethod, notes, customer, packageItem });
  },
};

const SUBSCRIPTIONS_HISTORY_KEY = 'gym_wolf_subscriptions_history';

export const getStoredSubscriptions = () => {
  try {
    const raw = localStorage.getItem(SUBSCRIPTIONS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredSubscription = (sub) => {
  try {
    const current = getStoredSubscriptions();
    const updated = [sub, ...current.filter((item) => String(item.id) !== String(sub.id)).slice(0, 99)];
    localStorage.setItem(SUBSCRIPTIONS_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

/**
 * Subscriptions Service Module
 * Handles POST /api/Subscriptions & Subscription Auditing
 */
export const subscriptionService = {
  /**
   * POST /api/Subscriptions
   * @param {{ customerId: number, packageId: number, paymentMethod: number, notes?: string, customer?: object, packageItem?: object }} params
   */
  async createSubscription({ customerId, packageId, paymentMethod = 0, notes = '', customer = null, packageItem = null }) {
    const payload = {
      customerId: Number(customerId),
      packageId: Number(packageId),
      paymentMethod: Number(paymentMethod),
      notes: String(notes || '').trim(),
    };

    try {
      const response = await apiClient.post('/api/Subscriptions', payload);

      // Create rich history record
      const durationDays = Number(packageItem?.duration) || 30;
      const record = {
        id: response.data?.id || `SUB-${Date.now()}`,
        customerId: payload.customerId,
        customerName: customer?.name || `عضو #${payload.customerId}`,
        customerPhone: customer?.phoneNumber || '',
        customerCode: customer?.code || `ID-${payload.customerId}`,
        packageId: payload.packageId,
        packageName: packageItem?.name || `باقة #${payload.packageId}`,
        packagePrice: Number(packageItem?.price) || 0,
        packageDuration: durationDays,
        paymentMethod: payload.paymentMethod,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + durationDays * 86400000).toISOString(),
        status: 'active',
        isSynced: true,
      };

      saveStoredSubscription(record);

      return {
        ...(response.data || {}),
        success: true,
        record,
      };
    } catch (err) {
      console.error('POST /api/Subscriptions API error:', err);

      const status = err.response?.status;
      const data = err.response?.data;
      let errorMsg = 'تعذر إتمام تسجيل الاشتراك.';

      if (typeof data === 'string') {
        errorMsg = data;
      } else if (data?.message) {
        errorMsg = data.message;
      } else if (data?.title) {
        errorMsg = data.title;
      } else if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        if (firstKey && data.errors[firstKey]?.length > 0) {
          errorMsg = data.errors[firstKey][0];
        }
      }

      if (status === 400) {
        errorMsg = errorMsg || 'بيانات الاشتراك غير صحيحة، أو العضو لديه اشتراك ساري بالفعل في هذه الباقة.';
      } else if (status === 404) {
        errorMsg = errorMsg || 'العضو أو الباقة المحددة غير موجودة في النظام.';
      } else if (status === 401 || status === 403) {
        errorMsg = 'ليس لديك صلاحية لتسجيل اشتراك، يرجى تسجيل الدخول مجدداً.';
      }

      // If network error / backend unavailable, allow offline simulation for receptionist UX
      if (!err.response) {
        console.warn('Network unreachable, creating local offline subscription record');
        const durationDays = Number(packageItem?.duration) || 30;
        const offlineRecord = {
          id: `OFFLINE-SUB-${Date.now()}`,
          customerId: payload.customerId,
          customerName: customer?.name || `عضو #${payload.customerId}`,
          customerPhone: customer?.phoneNumber || '',
          customerCode: customer?.code || `ID-${payload.customerId}`,
          packageId: payload.packageId,
          packageName: packageItem?.name || `باقة #${payload.packageId}`,
          packagePrice: Number(packageItem?.price) || 0,
          packageDuration: durationDays,
          paymentMethod: payload.paymentMethod,
          notes: payload.notes,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + durationDays * 86400000).toISOString(),
          status: 'active',
          isOffline: true,
        };
        saveStoredSubscription(offlineRecord);
        return { success: true, isOffline: true, record: offlineRecord };
      }

      const customError = new Error(errorMsg);
      customError.status = status;
      customError.response = err.response;
      throw customError;
    }
  },

  /**
   * Get subscriptions history for audit table
   */
  getSubscriptionsHistory() {
    return getStoredSubscriptions();
  },
};

export default apiClient;


