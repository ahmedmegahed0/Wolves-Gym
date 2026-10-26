import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { trainersService } from './trainersService';

// Base URL for Wolves Backend API
export const API_BASE_URL = 'https://wolves.runasp.net';

// LocalStorage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'gym_access_token',
  REFRESH_TOKEN: 'gym_refresh_token',
  USER_INFO: 'gym_user_info',
  USER: 'gym_user_info',
  ACTIVITY_LOG: 'gym_activity_log',
  MAX_CAPACITY: 'gym_max_capacity',
};

// Purge legacy mock data caches from localStorage
try {
  localStorage.removeItem('gym_mock_customers');
  localStorage.removeItem('gym_packages_cache');
} catch {}

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

// ============================================================================
// SYSTEM ENUMS ALIGNED WITH C# BACKEND
// ============================================================================

export const USER_ROLES = {
  TRAINER: 1,
  MANAGER: 2,
  GATOR: 3,
  SUPERADMIN: 4,
  CUSTOMER: 5,
  RECEPTION: 6,
};

export const USER_TYPES = {
  UNKNOWN: 0,
  SUPERADMIN: 1,
  EMPLOYEE: 3,
  CUSTOMER: 4,
};

export const APPROVAL_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
};

export const PAYMENT_METHODS = {
  CASH: 0,
  MOBILE_WALLET: 1,
  INSTAPAY: 2,
  FAWRY: 3,
  OTHER: 4,
};

export const SUBSCRIPTION_TYPES = {
  REGULAR: 0,
  PRIVATE: 1,
};




/**
 * Standard role normalizer
 * Expected roles: SuperAdmin, Manager, Receptionist, Trainer, Customer
 */
export const normalizeRole = (roleStr = '') => {
  const r = String(roleStr || '').toLowerCase().trim();
  if (r === 'superadmin' || r === 'super_admin' || r === 'admin') return 'SuperAdmin';
  if (
    r === 'operationmanager' || 
    r === 'operation_manager' || 
    r === 'operationsmanager' || 
    r === 'operations_manager' || 
    r === 'operations'
  ) return 'OperationManager';
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
        canManageLockers: true,
        canManageCustomers: true,
        canCheckInCheckOut: true,
        canApproveCustomers: true,
        canManageKpis: true,
        canEvaluateTrainers: true,
        primaryPath: '/dashboard/reception',
      };
    case 'OperationManager':
      return {
        role: 'OperationManager',
        label: 'مدير العمليات',
        fullTitle: 'إدارة العمليات ومؤشرات الأداء',
        badge: '⚡ مدير العمليات',
        textColor: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        canManageLockers: true,
        canManageCustomers: true,
        canCheckInCheckOut: true,
        canApproveCustomers: true,
        canManageKpis: true,
        canEvaluateTrainers: true,
        primaryPath: '/dashboard/operations',
      };
    case 'Manager':
      return {
        role: 'Manager',
        label: 'مدير الجيم',
        fullTitle: 'إدارة تشغيل الجيم',
        badge: '📋 مدير الجيم',
        textColor: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        canManageLockers: true,
        canManageCustomers: true,
        canCheckInCheckOut: true,
        canApproveCustomers: true,
        canManageKpis: true,
        canEvaluateTrainers: true,
        primaryPath: '/dashboard/reception',
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
        canManageKpis: false,
        canEvaluateTrainers: false,
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

  const nameClaim =
    decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
    decoded.name ||
    decoded.Name ||
    decoded.unique_name ||
    decoded.given_name;

  // Decide exact normalized role from JWT claims
  let role = 'Customer';
  if (roleClaim) {
    role = normalizeRole(roleClaim);
  } else if (userTypeClaim) {
    const ut = String(userTypeClaim).toLowerCase();
    if (ut === 'superadmin' || userTypeClaim === 1) role = 'SuperAdmin';
    else if (ut === 'customer' || userTypeClaim === 4) role = 'Customer';
    else role = 'Customer';
  }

  const userType = userTypeClaim || (role === 'Customer' ? 'Customer' : 'Employee');

  const phoneNumber =
    decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'] ||
    decoded.phoneNumber ||
    decoded.PhoneNumber ||
    '';

  return {
    id,
    email: email || fallbackEmail,
    name: nameClaim || (email ? email.split('@')[0] : 'وحش الجيم'),
    role,
    userType,
    permissions: Array.isArray(decoded.Permission)
      ? decoded.Permission
      : (decoded.Permission ? [decoded.Permission] : []),
    phoneNumber,
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

/**
 * Central translator from server/FluentValidation errors to clear, friendly Arabic
 * @param {string} rawMsg
 * @returns {string}
 */
export const translateServerErrorMessage = (rawMsg) => {
  if (!rawMsg || typeof rawMsg !== 'string') return '';
  const msg = rawMsg.trim();

  // Physical measurements
  if (/height.*greater than 0/i.test(msg)) {
    return 'قيمة الطول يجب أن تكون رقماً موجباً أكبر من صفر (سم).';
  }
  if (/weight.*greater than 0/i.test(msg)) {
    return 'قيمة الوزن يجب أن تكون رقماً موجباً أكبر من صفر (كجم).';
  }
  if (/age.*between 5 and 120/i.test(msg) || /age.*between/i.test(msg)) {
    return 'العمر يجب أن يكون بين 5 و 120 سنة.';
  }
  if (/musclepercentage/i.test(msg)) {
    return 'نسبة العضلات يجب أن تكون بين 0 و 100%.';
  }
  if (/fatpercentage/i.test(msg)) {
    return 'نسبة الدهون يجب أن تكون بين 0 و 100%.';
  }

  // Name / KPIs
  if (/name.*contain only letters/i.test(msg) || /only letters and spaces/i.test(msg)) {
    return 'الاسم يجب أن يحتوي على حروف ومسافات فقط (بدون أرقام أو رموز).';
  }
  if (/name.*must not exceed/i.test(msg)) {
    const match = msg.match(/\d+/);
    const limit = match ? match[0] : '30';
    return `اسم المؤشر يجب ألا يتجاوز ${limit} حرفاً.`;
  }

  // Identity & Auth
  if (/email.*already exists|email.*taken|email.*registered|USERS_EMAIL_ALREADY_EXISTS/i.test(msg)) {
    return 'البريد الإلكتروني مسجل بالفعل لمستخدم أو موظف آخر في الجيم.';
  }
  if (/phone.*already exists|phone.*taken|phone.*registered|USERS_PHONE_ALREADY_EXISTS/i.test(msg)) {
    return 'رقم الهاتف مسجل بالفعل لحساب موظف أو مستخدم آخر في الجيم.';
  }
  if (/code.*already exists|code.*taken/i.test(msg)) {
    return 'كود العضوية مسجل بالفعل، يرجى توليد أو إدخال كود آخر.';
  }
  if (/invalid email or password|bad credentials|AUTH_INVALID_CREDENTIALS/i.test(msg)) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (/email is not verified|AUTH_EMAIL_NOT_VERIFIED/i.test(msg)) {
    return 'الحساب موجود لكن لم يتم تفعيل البريد الإلكتروني بعد.';
  }
  if (/pending for approval|approval/i.test(msg)) {
    return 'حساب العضو في انتظار موافقة إدارة الجيم (Pending Approval).';
  }

  // Trainers & Subscriptions
  if (/trainer.*unavailable/i.test(msg)) {
    return 'هذا المدرب غير متاح حالياً لاستقبال اشتراكات جديدة، يرجى اختيار مدرب آخر.';
  }
  if (/already.*evaluat|evaluation.*already.*exist|already.*submitted/i.test(msg)) {
    return 'تم تسجيل تقييم لهذا الكابتن اليوم بالفعل. يمكنك تعديل تقييم اليوم بدلاً من إنشاء تقييم جديد.';
  }
  if (/score.*between|score.*inclusivebetween|score.*must be/i.test(msg)) {
    return 'درجة التقييم يجب أن تكون رقماً صحيحاً ضمن النطاق المسموح به (1 إلى 10).';
  }

  // Lockers
  if (/locker.*already exists|LOCKER_NUMBER_ALREADY_EXISTS/i.test(msg)) {
    return 'رقم اللوكر ده مسجل وموجود بالفعل في السيستم! اختر رقم دولاب تاني.';
  }
  if (/locker.*not found|LOCKER_NOT_FOUND/i.test(msg)) {
    return 'اللوكر المطلوب غير موجود أو تم حذفه.';
  }

  // General Validation
  if (/greater.*zero|greaterthanvalidator/i.test(msg)) {
    return 'القيمة المدخلة يجب أن تكون رقماً موجباً أكبر من صفر.';
  }
  if (/passwords do not match|password.*match/i.test(msg)) {
    return 'كلمتا المرور غير متطابقتين.';
  }
  if (/password.*least 6 characters/i.test(msg)) {
    return 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.';
  }
  if (/the field (.*) is required|is required/i.test(msg)) {
    return 'هذا الحقل مطلوب، يرجى استكمال البيانات.';
  }

  return msg;
};

// Response Interceptor: Format errors and handle Silent Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If request was canceled by AbortController, reject immediately and do NOT treat as server error
    if (axios.isCancel(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Handle ProblemDetails messages
    let friendlyMessage = 'حدث خطأ أثناء الاتصال بالسيرفر. يرجى المحاولة لاحقاً.';
    if (error.response?.data) {
      const { data, status } = error.response;
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const errorDescriptions = data.errors.map((e) => {
          const raw = e.description || e.message || e.code || (typeof e === 'string' ? e : JSON.stringify(e));
          return translateServerErrorMessage(raw);
        });
        friendlyMessage = errorDescriptions.join(' • ');
      } else if (typeof data.errors === 'object' && data.errors !== null) {
        const msgs = [];
        Object.values(data.errors).forEach((val) => {
          if (Array.isArray(val)) {
            val.forEach((sub) => msgs.push(translateServerErrorMessage(sub)));
          } else if (typeof val === 'string') {
            msgs.push(translateServerErrorMessage(val));
          }
        });
        if (msgs.length > 0) {
          friendlyMessage = msgs.join(' • ');
        }
      } else if (data.detail) {
        friendlyMessage = translateServerErrorMessage(data.detail);
      } else if (data.title) {
        if (data.title === 'Unauthorized') friendlyMessage = 'البريد أو كلمة المرور غير صحيحة';
        else if (data.title === 'Conflict') friendlyMessage = 'البيانات المدخلة موجودة بالفعل في النظام أو تتعارض مع السجل الحالي.';
        else friendlyMessage = translateServerErrorMessage(data.title);
      } else if (typeof data === 'string') {
        friendlyMessage = translateServerErrorMessage(data);
      }

      const isDefaultGenericMessage = !friendlyMessage || friendlyMessage === 'حدث خطأ أثناء الاتصال بالسيرفر. يرجى المحاولة لاحقاً.';
      if (status === 401 && isDefaultGenericMessage) {
        friendlyMessage = 'بيانات الدخول غير صحيحة أو هذا الحساب غير مسجل بالسيرفر.';
      } else if (status === 403 && isDefaultGenericMessage) {
        friendlyMessage = 'حسابك معلق وفي انتظار تفعيل الإدارة (Pending Approval)، أو ليس لديك صلاحية للدخول.';
      } else if (status === 404 && isDefaultGenericMessage) {
        friendlyMessage = 'المورد أو العضو المطلوب غير موجود بالسيستم.';
      } else if (status === 409 && isDefaultGenericMessage) {
        if (originalRequest?.url?.toLowerCase()?.includes('subscription')) {
          friendlyMessage = 'لا يمكن إجراء هذه العملية على هذا الاشتراك، قد يكون مجمداً أو ملغياً بالفعل.';
        } else if (originalRequest?.url?.toLowerCase()?.includes('locker')) {
          friendlyMessage = 'رقم اللوكر ده مسجل وموجود بالفعل في السيستم! اختر رقم دولاب تاني.';
        } else {
          friendlyMessage = 'البيانات المدخلة موجودة بالفعل في النظام أو تتعارض مع السجل الحالي.';
        }
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

// Customer Service Methods (GET, PATCH, PUT, ME)
export const customerService = {
  /**
   * GET /api/customers
   * Query: { ApprovalStatus, PageNumber, PageSize, Search, SortBy }
   */
  async getCustomers({ approvalStatus, pageNumber = 1, pageSize = 10, search = '', sortBy = '', signal } = {}) {
    const params = new URLSearchParams();
    if (approvalStatus !== undefined && approvalStatus !== null && approvalStatus !== '') {
      params.append('ApprovalStatus', String(approvalStatus));
    }
    if (pageNumber) params.append('PageNumber', String(pageNumber));
    if (pageSize) params.append('PageSize', String(pageSize));
    if (search && search.trim()) params.append('Search', search.trim());
    if (sortBy && sortBy.trim()) params.append('SortBy', sortBy.trim());

    try {
      const response = await apiClient.get(`/api/customers?${params.toString()}`, { signal });
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
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        throw err;
      }
      throw err;
    }
  },

  /**
   * PATCH /api/customers/{id}/approval-status
   * Body: { status: number } (1 = approved, 2 = rejected)
   */
  async updateApprovalStatus(id, status) {
    const payload = { status: Number(status) };
    const response = await apiClient.patch(`/api/customers/${id}/approval-status`, payload);
    return response.data || { success: true };
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

    // Backend uses PATCH /api/customers/{id} with PUT fallback
    try {
      const response = await apiClient.patch(`/api/customers/${id}`, payload);
      return response.data || { success: true };
    } catch (patchErr) {
      if (patchErr.response?.status === 405) {
        const putRes = await apiClient.put(`/api/customers/${id}`, payload);
        return putRes.data || { success: true };
      }
      throw patchErr;
    }
  },

  /**
   * GET /api/customers/{id}
   */
  async getCustomerById(id, { signal } = {}) {
    const cleanId = Number(id);
    const response = await apiClient.get(`/api/customers/${cleanId}`, { signal });
    return response.data;
  },

  /**
   * Alias for updateApprovalStatus
   */
  async changeApprovalStatus(id, data) {
    const cleanId = Number(id);
    const statusVal = typeof data === 'object' && data !== null && data.status !== undefined 
      ? Number(data.status) 
      : Number(data);
    return this.updateApprovalStatus(cleanId, statusVal);
  },

  /**
   * POST /api/customers
   * Direct customer creation from Reception
   */
  async createCustomerDirectly(customerData) {
    const cleanNum = (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return !isNaN(num) && num > 0 ? num : null;
    };

    const response = await apiClient.post('/api/customers', {
      name: customerData.name?.trim() || '',
      email: customerData.email?.trim() || '',
      phoneNumber: customerData.phoneNumber?.trim() || '',
      password: customerData.password,
      confirmPassword: customerData.confirmPassword,
      isActive: customerData.isActive ?? true,
      code: customerData.code?.trim() || '',
      height: cleanNum(customerData.height),
      weight: cleanNum(customerData.weight),
      age: cleanNum(customerData.age),
      injuries: customerData.injuries?.trim() || null,
      chronicDiseases: customerData.chronicDiseases?.trim() || null,
      musclePercentage: cleanNum(customerData.musclePercentage),
      fatPercentage: cleanNum(customerData.fatPercentage),
      notes: customerData.notes?.trim() || null
    });
    return response.data;
  },

  /**
   * POST /api/customers/{id}/behavior-notes
   */
  async addBehaviorNote(id, descriptionOrData) {
    const cleanId = Number(id);
    const description = typeof descriptionOrData === 'object' && descriptionOrData !== null 
      ? String(descriptionOrData.description || '').trim() 
      : String(descriptionOrData || '').trim();

    const payload = { description };
    const response = await apiClient.post(`/api/customers/${cleanId}/behavior-notes`, payload);
    return response.data;
  },

  /**
   * GET /api/customers/{id}/behavior-notes
   */
  async getCustomerBehaviorNotes(id, params = {}, { signal } = {}) {
    const cleanId = Number(id);
    const query = new URLSearchParams();

    if (params.pageNumber || params.PageNumber) {
      query.append('PageNumber', String(params.pageNumber || params.PageNumber));
    }
    if (params.pageSize || params.PageSize) {
      query.append('PageSize', String(params.pageSize || params.PageSize));
    }
    if (params.search || params.Search) {
      query.append('Search', String(params.search || params.Search).trim());
    }
    if (params.sortBy || params.SortBy) {
      query.append('SortBy', String(params.sortBy || params.SortBy).trim());
    }

    const qs = query.toString();
    const url = `/api/customers/${cleanId}/behavior-notes${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get(url, { signal });
    return response.data;
  },

  /**
   * GET /api/customers/{id}/attendances
   */
  async getCustomerAttendances(id, month, year, { signal } = {}) {
    const cleanId = Number(id);
    const query = new URLSearchParams();

    if (month !== undefined && month !== null) {
      query.append('Month', String(month));
    }
    if (year !== undefined && year !== null) {
      query.append('Year', String(year));
    }

    const qs = query.toString();
    const url = `/api/customers/${cleanId}/attendances${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get(url, { signal });
    return response.data;
  },

  /**
   * GET /api/customers/me
   */
  async getCustomerMe() {
    const response = await apiClient.get('/api/customers/me');
    return response.data;
  },
};

// Attendance Service Methods
export const attendanceService = {
  async getCurrentOccupancy({ signal } = {}) {
    const response = await apiClient.get('/api/Attendances/current-occupancy', { signal });
    return response.data;
  },

  async getAttendances({ isCurrentlyAttending, fromDate, pageNumber = 1, pageSize = 50, search = '', sortBy = '', signal } = {}) {
    const params = new URLSearchParams();
    if (typeof isCurrentlyAttending === 'boolean') {
      params.append('IsCurrentlyAttending', String(isCurrentlyAttending));
    }
    if (fromDate) params.append('FromDate', fromDate);
    if (pageNumber) params.append('PageNumber', String(pageNumber));
    if (pageSize) params.append('PageSize', String(pageSize));
    if (search && search.trim()) params.append('Search', search.trim());
    if (sortBy && sortBy.trim()) params.append('SortBy', sortBy.trim());

    try {
      const response = await apiClient.get(`/api/Attendances?${params.toString()}`, { signal });
      return response.data;
    } catch {
      return { data: [], totalCount: 0 };
    }
  },

  async checkIn({ code, customerCode, lockerId, selectedLockerId }) {
    const memberCode = (code || customerCode || '').trim();
    const rawLockerId = lockerId ?? selectedLockerId;
    const payload = {
      code: String(memberCode).trim(),
      lockerId: Number(rawLockerId),
    };
    console.log('Check-in Payload:', payload);
    try {
      const response = await apiClient.post('/api/Attendances/check-in', payload);
      return response.data || { success: true };
    } catch (error) {
      console.error('Check-in API error:', {
        status: error.response?.status,
        data: error.response?.data,
        payload,
      });
      throw error;
    }
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
  async getLockers(isActive = undefined, { signal } = {}) {
    let url = '/api/Lockers';
    if (typeof isActive === 'boolean') {
      url += `?isActive=${isActive}`;
    }
    const response = await apiClient.get(url, { signal });
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

export const PACKAGE_TYPES = {
  REGULAR: 0,
  PRIVATE: 1,
  SHARED_PRIVATE: 2,
};

export const getPackageTypeMeta = (type) => {
  const num = Number(type);
  switch (num) {
    case PACKAGE_TYPES.PRIVATE:
      return {
        type: 1,
        key: 'Private',
        label: 'خاصة بكابتن',
        subLabel: 'تدريب فردي مخصص (PT)',
        badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        textColor: 'text-amber-400',
      };
    case PACKAGE_TYPES.SHARED_PRIVATE:
      return {
        type: 2,
        key: 'SharedPrivate',
        label: 'خاصة مشتركة',
        subLabel: 'تدريب خاص مشترك بين كباتن الجيم',
        badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        textColor: 'text-purple-400',
      };
    case PACKAGE_TYPES.REGULAR:
    default:
      return {
        type: 0,
        key: 'Regular',
        label: 'عادية / عامة',
        subLabel: 'تدريب عام وتدريب حر لكافة الأعضاء',
        badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        textColor: 'text-sky-400',
      };
  }
};

export const packageService = {
  /**
   * GET /api/Packages (Public / Customer Plans)
   * @param {{ types?: number|number[], pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, signal?: AbortSignal }} params
   */
  async getPackages({ types = undefined, pageNumber = 1, pageSize = 12, search = '', sortBy = '', signal } = {}) {
    const query = new URLSearchParams();
    if (types !== undefined && types !== null && types !== '') {
      if (Array.isArray(types)) {
        types.forEach((t) => query.append('Types', String(t)));
      } else {
        query.append('Types', String(types));
      }
    }
    if (pageNumber) query.append('PageNumber', pageNumber);
    if (pageSize) query.append('PageSize', pageSize);
    if (search && search.trim()) query.append('Search', search.trim());
    if (sortBy && sortBy.trim()) query.append('SortBy', sortBy.trim());

    try {
      const response = await apiClient.get(`/api/Packages?${query.toString()}`, { signal });
      const payload = response.data;

      // Handle standard paginated response { data: [...], totalCount: ... }
      if (payload && Array.isArray(payload.data)) {
        return {
          data: payload.data,
          totalCount: payload.totalCount ?? payload.data.length,
          currentPage: payload.currentPage ?? pageNumber,
          totalPages: payload.totalPages ?? Math.ceil((payload.totalCount ?? payload.data.length) / pageSize),
          pageSize: payload.pageSize ?? pageSize,
        };
      }
      if (Array.isArray(payload)) {
        return {
          data: payload,
          totalCount: payload.length,
          currentPage: pageNumber,
          totalPages: Math.ceil(payload.length / pageSize),
          pageSize,
        };
      }

      return {
        data: [],
        totalCount: 0,
        currentPage: pageNumber,
        totalPages: 0,
        pageSize,
      };
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') throw err;
      throw err;
    }
  },

  /**
   * GET /api/Packages/management (Admin / Manager Table)
   * @param {{ types?: number|number[], trainerId?: number, isActive?: boolean, pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, signal?: AbortSignal }} params
   */
  async getManagementPackages({
    types = undefined,
    trainerId = undefined,
    isActive = undefined,
    pageNumber = 1,
    pageSize = 10,
    search = '',
    sortBy = '',
    signal,
  } = {}) {
    const query = new URLSearchParams();
    if (types !== undefined && types !== null && types !== '') {
      if (Array.isArray(types)) {
        types.forEach((t) => query.append('Types', String(t)));
      } else {
        query.append('Types', String(types));
      }
    }
    if (trainerId !== undefined && trainerId !== null && trainerId !== '') {
      query.append('TrainerId', String(trainerId));
    }
    if (typeof isActive === 'boolean') {
      query.append('IsActive', String(isActive));
    }
    if (pageNumber) query.append('PageNumber', pageNumber);
    if (pageSize) query.append('PageSize', pageSize);
    if (search && search.trim()) query.append('Search', search.trim());
    if (sortBy && sortBy.trim()) query.append('SortBy', sortBy.trim());

    try {
      const response = await apiClient.get(`/api/Packages/management?${query.toString()}`, { signal });
      const payload = response.data;

      if (payload && Array.isArray(payload.data)) {
        return {
          data: payload.data,
          totalCount: payload.totalCount ?? payload.data.length,
          currentPage: payload.currentPage ?? pageNumber,
          totalPages: payload.totalPages ?? Math.ceil(payload.totalCount / pageSize),
          pageSize: payload.pageSize ?? pageSize,
        };
      }
      if (Array.isArray(payload)) {
        return {
          data: payload,
          totalCount: payload.length,
          currentPage: pageNumber,
          totalPages: Math.ceil(payload.length / pageSize),
          pageSize,
        };
      }

      return {
        data: [],
        totalCount: 0,
        currentPage: pageNumber,
        totalPages: 0,
        pageSize,
      };
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') throw err;
      throw err;
    }
  },

  /**
   * GET /api/Packages/{id}
   */
  async getPackageById(id) {
    const response = await apiClient.get(`/api/Packages/${id}`);
    return response.data;
  },

  /**
   * GET /api/Packages/management/{id}
   */
  async getManagementPackageById(id) {
    const response = await apiClient.get(`/api/Packages/management/${id}`);
    return response.data;
  },

  /**
   * POST /api/Packages
   * Body: { name, price, duration, description, isActive, type, trainerId }
   */
  async createPackage({ name, price, duration, description, isActive = true, type = 0, trainerId = null }) {
    const pkgType = Number(type) || 0;
    const payload = {
      name: String(name || '').trim(),
      price: Number(price) || 0,
      duration: Number(duration) || 30,
      description: String(description || '').trim(),
      isActive: Boolean(isActive),
      type: pkgType,
      trainerId: pkgType === PACKAGE_TYPES.PRIVATE && trainerId ? Number(trainerId) : null,
    };

    const response = await apiClient.post('/api/Packages', payload);
    return response.data;
  },

  /**
   * PATCH /api/Packages/{id} (with fallback to PUT /api/Packages/{id})
   * Body: { name, price, duration, description, isActive, type, trainerId }
   */
  async updatePackage(id, { name, price, duration, description, isActive, type = 0, trainerId = null }) {
    const pkgType = Number(type) || 0;
    const payload = {
      name: String(name || '').trim(),
      price: Number(price) || 0,
      duration: Number(duration) || 30,
      description: String(description || '').trim(),
      isActive: Boolean(isActive),
      type: pkgType,
      trainerId: pkgType === PACKAGE_TYPES.PRIVATE && trainerId ? Number(trainerId) : null,
    };

    try {
      const response = await apiClient.patch(`/api/Packages/${id}`, payload);
      return response.data;
    } catch (patchErr) {
      if (patchErr.response?.status === 405) {
        const putRes = await apiClient.put(`/api/Packages/${id}`, payload);
        return putRes.data;
      }
      throw patchErr;
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
   * Body: { customerId, packageId, trainerId, paymentMethod, notes }
   */
  async subscribe({ customerId, packageId, trainerId = null, paymentMethod = 0, notes = '', customer = null, packageItem = null }) {
    return await subscriptionService.createSubscription({ customerId, packageId, trainerId, paymentMethod, notes, customer, packageItem });
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
   * @param {{ customerId: number, packageId: number, trainerId?: number|null, paymentMethod: number, notes?: string, customer?: object, packageItem?: object, trainer?: object }} params
   */
  async createSubscription({ customerId, packageId, trainerId = null, paymentMethod = 0, notes = '', customer = null, packageItem = null, trainer = null }) {
    const payload = {
      customerId: Number(customerId),
      packageId: Number(packageId),
      trainerId: trainerId ? Number(trainerId) : null,
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
        trainerId: payload.trainerId,
        trainerName: trainer?.name || (payload.trainerId ? `كابتن #${payload.trainerId}` : null),
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
      } else if (data?.detail) {
        errorMsg = data.detail;
      } else if (data?.errors) {
        if (Array.isArray(data.errors)) {
          errorMsg = data.errors.map((e) => e.description || e.code).join('; ');
        } else {
          const firstKey = Object.keys(data.errors)[0];
          if (firstKey && data.errors[firstKey]?.length > 0) {
            errorMsg = data.errors[firstKey][0];
          }
        }
      }

      if (status === 400) {
        errorMsg = errorMsg || 'بيانات الاشتراك غير صحيحة، أو العضو لديه اشتراك ساري بالفعل في هذه الباقة.';
      } else if (status === 404) {
        errorMsg = errorMsg || 'العضو أو الباقة المحددة غير موجودة في النظام.';
      } else if (status === 401 || status === 403) {
        errorMsg = 'ليس لديك صلاحية لتسجيل اشتراك، يرجى تسجيل الدخول مجدداً.';
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

/**
 * Trainers Service Module
 * Handles GET /api/Trainers, GET /api/Trainers/management, PATCH /api/Trainers/{id}, and GET /api/Trainers/me
 */
export const trainerService = {
  /**
   * GET /api/Trainers (Public showcase list)
   * @param {{ pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, signal?: AbortSignal }} params
   */
  async getTrainers({ pageNumber = 1, pageSize = 8, search = '', sortBy = '', signal } = {}) {
    const query = new URLSearchParams();
    if (pageNumber) query.append('PageNumber', String(pageNumber));
    if (pageSize) query.append('PageSize', String(pageSize));
    if (search && search.trim()) query.append('Search', search.trim());
    if (sortBy && sortBy.trim()) query.append('SortBy', sortBy.trim());

    try {
      const response = await apiClient.get(`/api/Trainers?${query.toString()}`, { signal });
      const payload = response.data;

      let list = [];
      let totalCount = 0;

      if (payload && Array.isArray(payload.data)) {
        list = payload.data;
        totalCount = payload.totalCount ?? list.length;
      } else if (Array.isArray(payload)) {
        list = payload;
        totalCount = list.length;
      }

      // Format dynamic trainer profiles from real backend data
      const formatted = list.map((t) => {
        const exp = Number(t.yearsOfExperience) || 1;
        return {
          ...t,
          specialty: t.specialty || (exp >= 5 ? 'إعداد بدني وقوة ولياقة شاملة' : 'كمال أجسام وتدريب وظيفي'),
          badge: t.badge || (exp >= 5 ? 'كابتن أول معتمد' : 'كابتن معتمد'),
          bio: t.bio || `مدرب معتمد بصالة WOLVES بخبرة ${exp} سنوات في إعداد البرامج التدريبية ومتابعة المتدربين.`,
          rating: t.rating || 5.0,
          clientsCount: t.clientsCount || null,
        };
      });

      return {
        data: formatted,
        totalCount: totalCount ?? formatted.length,
        currentPage: payload?.currentPage ?? pageNumber,
        totalPages: payload?.totalPages ?? (Math.ceil((totalCount ?? formatted.length) / pageSize) || (formatted.length > 0 ? 1 : 0)),
        pageSize: payload?.pageSize ?? pageSize,
      };
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') throw err;
      throw err;
    }
  },

  /**
   * Helper to fetch full list of trainers for dropdown selections
   */
  async getAllTrainers({ signal } = {}) {
    try {
      const res = await this.getTrainers({ pageSize: 100, signal });
      return res.data || [];
    } catch (err) {
      console.warn('Failed to load all trainers for dropdown:', err);
      return [];
    }
  },

  /**
   * GET /api/Trainers/management (Admin management table)
   * Query: { IsActive, PageNumber, PageSize, Search, SortBy }
   */
  async getManagementTrainers({
    isActive = undefined,
    pageNumber = 1,
    pageSize = 10,
    search = '',
    sortBy = '',
    signal,
  } = {}) {
    const query = new URLSearchParams();
    if (typeof isActive === 'boolean') {
      query.append('IsActive', String(isActive));
    }
    if (pageNumber) query.append('PageNumber', String(pageNumber));
    if (pageSize) query.append('PageSize', String(pageSize));
    if (search && search.trim()) query.append('Search', search.trim());
    if (sortBy && sortBy.trim()) query.append('SortBy', sortBy.trim());

    try {
      const response = await apiClient.get(`/api/Trainers/management?${query.toString()}`, { signal });
      const payload = response.data;

      if (payload && Array.isArray(payload.data)) {
        return {
          data: payload.data,
          totalCount: payload.totalCount ?? payload.data.length,
          currentPage: payload.currentPage ?? pageNumber,
          totalPages: payload.totalPages ?? Math.ceil((payload.totalCount ?? 1) / pageSize),
          pageSize: payload.pageSize ?? pageSize,
          hasPreviousPage: Boolean(payload.hasPreviousPage),
          hasNextPage: Boolean(payload.hasNextPage),
        };
      }
      if (Array.isArray(payload)) {
        return {
          data: payload,
          totalCount: payload.length,
          currentPage: pageNumber,
          totalPages: Math.ceil(payload.length / pageSize),
          pageSize,
          hasPreviousPage: pageNumber > 1,
          hasNextPage: false,
        };
      }

      return {
        data: [],
        totalCount: 0,
        currentPage: pageNumber,
        totalPages: 0,
        pageSize,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') throw err;
      throw err;
    }
  },

  /**
   * GET /api/Trainers/{id}
   */
  async getTrainerById(id) {
    const response = await apiClient.get(`/api/Trainers/${id}`);
    return response.data;
  },

  /**
   * PATCH /api/Trainers/{id}
   * Body: { name, phoneNumber, yearsOfExperience, salary, isActive }
   */
  async updateTrainer(id, { name, phoneNumber, yearsOfExperience, salary, isActive }) {
    const payload = {
      name: String(name || '').trim(),
      phoneNumber: String(phoneNumber || '').trim(),
      yearsOfExperience: Number(yearsOfExperience) || 0,
      salary: Number(salary) || 0,
      isActive: Boolean(isActive),
    };

    const response = await apiClient.patch(`/api/Trainers/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle Trainer active status
   */
  async toggleTrainerStatus(id, currentTrainer) {
    const nextStatus = !Boolean(currentTrainer.isTrainerActive ?? currentTrainer.isActive);
    return await this.updateTrainer(id, {
      name: currentTrainer.name,
      phoneNumber: currentTrainer.phoneNumber,
      yearsOfExperience: currentTrainer.yearsOfExperience,
      salary: currentTrainer.salary,
      isActive: nextStatus,
    });
  },

  /**
   * GET /api/Trainers/me (Profile of currently logged-in coach)
   */
  async getTrainerMe({ signal } = {}) {
    const response = await apiClient.get('/api/Trainers/me', { signal });
    return response.data;
  },

  /**
   * POST /api/Trainers (Create new trainer)
   */
  async createTrainer(data) {
    return trainersService.createTrainer(data);
  },

  /**
   * GET /api/Trainers/{id}/customers
   */
  async getTrainerCustomers(id, params) {
    return trainersService.getTrainerCustomers(id, params);
  },

  /**
   * POST /api/Trainers/{id}/kpi-evaluations
   */
  async submitTrainerKpiEvaluations(id, payload) {
    return trainersService.submitTrainerKpiEvaluations(id, payload);
  },

  /**
   * PUT /api/Trainers/{id}/kpi-evaluations
   */
  async updateTrainerKpiEvaluations(id, payload) {
    return trainersService.updateTrainerKpiEvaluations(id, payload);
  },

  /**
   * GET /api/Trainers/{id}/kpi-evaluations
   */
  async getTrainerKpiEvaluations(id, params) {
    return trainersService.getTrainerKpiEvaluations(id, params);
  },

  /**
   * GET /api/Trainers/{id}/kpi-evaluations/daily
   */
  async getTrainerDailyKpiEvaluations(id, params) {
    return trainersService.getTrainerDailyKpiEvaluations(id, params);
  },
};

export { usersService } from './usersService';
export { kpisService, kpiService, extractKpiErrorMessage } from './kpisService';
export { customersService } from './customersService';
export { trainersService } from './trainersService';
export default apiClient;



