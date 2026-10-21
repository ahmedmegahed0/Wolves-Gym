import axios from 'axios';

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

export const setAuthTokens = ({ accessToken, refreshToken, userInfo = null }) => {
  if (accessToken) {
    const accessStr =
      typeof accessToken === 'string'
        ? accessToken
        : (accessToken?.token || accessToken?.accessToken || JSON.stringify(accessToken));
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, String(accessStr).trim());
    localStorage.setItem('gym_auth_token', String(accessStr).trim());
  }
  if (refreshToken) {
    const refreshStr =
      typeof refreshToken === 'string'
        ? refreshToken
        : (refreshToken?.token || refreshToken?.refreshToken || JSON.stringify(refreshToken));
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, String(refreshStr).trim());
  }
  if (userInfo) {
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
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
    return raw ? JSON.parse(raw) : null;
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
          return e.description || e.code;
        });
        friendlyMessage = errorDescriptions.join('; ');
      } else if (data.detail) {
        if (data.detail.toLowerCase().includes('pending for approval')) {
          friendlyMessage = 'حسابك في انتظار موافقة إدارة الجيم (Pending Approval). يرجى من إدارة الجيم/الأونر تفعيل الحساب لتتمكن من الدخول.';
        } else {
          friendlyMessage = data.detail;
        }
      } else if (data.title) {
        friendlyMessage = data.title === 'Unauthorized' ? 'البريد أو كلمة المرور غير صحيحة' : data.title;
      } else if (typeof data === 'string') {
        friendlyMessage = data;
      }

      const isDefaultGenericMessage = !friendlyMessage || friendlyMessage === 'حدث خطأ أثناء الاتصال بالسيرفر. يرجى المحاولة لاحقاً.';
      if (status === 401 && isDefaultGenericMessage) {
        friendlyMessage = 'بيانات الدخول غير صحيحة أو هذا الحساب غير مسجل بالسيرفر.';
      } else if (status === 403 && isDefaultGenericMessage) {
        friendlyMessage = 'حسابك معلق وفي انتظار تفعيل الإدارة (Pending Approval)، أو ليس لديك صلاحية للدخول.';
      } else if (status === 404 && isDefaultGenericMessage) {
        friendlyMessage = 'المورد المطلوب أو الحساب غير موجود.';
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
    const response = await apiClient.post('/api/Authentication/login', payload);
    
    // Save tokens if present in response
    const data = response.data;
    const accessToken = data?.accessToken || data?.token || (typeof data === 'string' ? data : null);
    const refreshToken = data?.refreshToken || null;

    if (accessToken) {
      setAuthTokens({
        accessToken,
        refreshToken,
        userInfo: { email: payload.email, name: data?.name || payload.email.split('@')[0] },
      });
    }

    return response.data;
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
      const response = await apiClient.get(`/api/Lockers?isActive=${isActive}`);
      return response.data;
    } catch {
      return null;
    }
  },
};

export default apiClient;
