import apiClient, { 
  getStoredSubscriptions, 
  saveStoredSubscription 
} from './apiClient';

/**
 * Subscriptions Enums & Status Mapping
 */
export const SUBSCRIPTION_STATUS = {
  1: { label: 'نشط', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  2: { label: 'مجمد', badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  3: { label: 'منتهي', badge: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  4: { label: 'ملغي', badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  5: { label: 'قيد الانتظار', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
};

export const PAYMENT_METHODS = {
  0: { label: 'نقدي (كاش في الدرج)', icon: 'Cash' },
  1: { label: 'محفظة إلكترونية (Mobile Wallet)', icon: 'Phone' },
  2: { label: 'إنستا باي (InstaPay)', icon: 'Zap' },
  3: { label: 'بطاقة ائتمان (Credit Card)', icon: 'CreditCard' }
};

/**
 * Helper to safely extract status meta regardless of whether status is number or string
 * @param {number|string} status
 */
export const getSubscriptionStatusMeta = (status) => {
  if (status === undefined || status === null) {
    return { label: 'غير محدد', badge: 'text-zinc-400 bg-zinc-800/40 border-zinc-700/40' };
  }

  // Handle numeric status
  const numStatus = Number(status);
  if (!isNaN(numStatus) && SUBSCRIPTION_STATUS[numStatus]) {
    return SUBSCRIPTION_STATUS[numStatus];
  }

  // Handle textual status from legacy or varied backend responses
  const strStatus = String(status).trim().toLowerCase();
  if (strStatus === 'active' || strStatus === 'نشط') return SUBSCRIPTION_STATUS[1];
  if (strStatus === 'frozen' || strStatus === 'مجمد') return SUBSCRIPTION_STATUS[2];
  if (strStatus === 'expired' || strStatus === 'منتهي') return SUBSCRIPTION_STATUS[3];
  if (strStatus === 'cancelled' || strStatus === 'canceled' || strStatus === 'ملغي') return SUBSCRIPTION_STATUS[4];
  if (strStatus === 'pending' || strStatus === 'قيد الانتظار') return SUBSCRIPTION_STATUS[5];

  return { label: String(status), badge: 'text-zinc-400 bg-zinc-800/40 border-zinc-700/40' };
};

/**
 * Helper to safely extract payment method meta
 * @param {number|string} method
 */
export const getPaymentMethodMeta = (method) => {
  const numMethod = Number(method);
  if (!isNaN(numMethod) && PAYMENT_METHODS[numMethod]) {
    return PAYMENT_METHODS[numMethod];
  }

  const str = String(method || '').toLowerCase();
  if (str.includes('cash') || str.includes('نقد')) return PAYMENT_METHODS[0];
  if (str.includes('wallet') || str.includes('محفظ')) return PAYMENT_METHODS[1];
  if (str.includes('insta') || str.includes('انستا') || str.includes('إنستا')) return PAYMENT_METHODS[2];
  if (str.includes('card') || str.includes('بطاق') || str.includes('كارت')) return PAYMENT_METHODS[3];

  return { label: 'نقدي (افتراضي)', icon: 'Cash' };
};

/**
 * Format currency with EGP
 */
export const formatCurrency = (amount) => {
  const val = Number(amount) || 0;
  return `${val.toLocaleString('ar-EG')} ج.م`;
};

/**
 * Subscriptions Service Object
 */
export const subscriptionsService = {
  /**
   * GET /api/Subscriptions
   * @param {{ Status?: number|string, Type?: number|string, PageNumber?: number, PageSize?: number, Search?: string, SortBy?: string }} params
   */
  async getSubscriptions(params = {}) {
    const queryParams = {};

    if (params.Status !== undefined && params.Status !== 'all' && params.Status !== '') {
      queryParams.Status = params.Status;
    } else if (params.status !== undefined && params.status !== 'all' && params.status !== '') {
      queryParams.Status = params.status;
    }

    if (params.Type !== undefined && params.Type !== 'all' && params.Type !== '') {
      queryParams.Type = params.Type;
    } else if (params.type !== undefined && params.type !== 'all' && params.type !== '') {
      queryParams.Type = params.type;
    }

    if (params.Search) queryParams.Search = params.Search.trim();
    else if (params.search) queryParams.Search = params.search.trim();

    if (params.SortBy) queryParams.SortBy = params.SortBy;
    else if (params.sortBy) queryParams.SortBy = params.sortBy;

    queryParams.PageNumber = params.PageNumber || params.pageNumber || 1;
    queryParams.PageSize = params.PageSize || params.pageSize || 10;

    try {
      const response = await apiClient.get('/api/Subscriptions', { params: queryParams });
      const data = response.data;

      // Extract array of items
      let items = [];
      let totalCount = 0;

      if (Array.isArray(data)) {
        items = data;
        totalCount = data.length;
      } else if (data && typeof data === 'object') {
        items = data.items || data.data || data.subscriptions || [];
        totalCount = data.totalCount ?? data.total ?? data.count ?? items.length;
      }

      // If server returned 0 items, check if we have any recently stored local subscriptions for this session
      if (items.length === 0 && queryParams.PageNumber === 1 && !queryParams.Search && queryParams.Status === undefined) {
        const stored = getStoredSubscriptions();
        if (stored.length > 0) {
          items = stored;
          totalCount = stored.length;
        }
      }

      return {
        items,
        totalCount,
        pageNumber: queryParams.PageNumber,
        pageSize: queryParams.PageSize,
        raw: data
      };
    } catch (err) {
      console.warn('GET /api/Subscriptions returned error, checking local store:', err);
      // Fallback to locally stored subscriptions if network/server is unavailable
      const stored = getStoredSubscriptions();
      let filtered = [...stored];
      if (queryParams.Search) {
        const s = queryParams.Search.toLowerCase();
        filtered = filtered.filter(item => 
          item.customerName?.toLowerCase().includes(s) ||
          item.customerCode?.toLowerCase().includes(s) ||
          item.customerPhone?.includes(s) ||
          item.packageName?.toLowerCase().includes(s)
        );
      }
      return {
        items: filtered,
        totalCount: filtered.length,
        pageNumber: queryParams.PageNumber,
        pageSize: queryParams.PageSize,
        isFallback: true
      };
    }
  },

  /**
   * GET /api/Subscriptions/{id}
   * @param {string|number} id
   */
  async getSubscriptionById(id) {
    try {
      const response = await apiClient.get(`/api/Subscriptions/${id}`);
      return response.data;
    } catch (err) {
      console.warn(`GET /api/Subscriptions/${id} error, checking local store:`, err);
      const stored = getStoredSubscriptions();
      const match = stored.find(s => String(s.id) === String(id));
      if (match) return match;
      throw err;
    }
  },

  /**
   * POST /api/Subscriptions
   * @param {{ customerId: number, packageId: number, trainerId?: number|null, paymentMethod: number, notes?: string }} payload
   */
  async createSubscription(payload) {
    const formatted = {
      customerId: Number(payload.customerId),
      packageId: Number(payload.packageId),
      trainerId: payload.trainerId ? Number(payload.trainerId) : null,
      paymentMethod: Number(payload.paymentMethod || 0),
      notes: payload.notes ? String(payload.notes).trim() : ''
    };

    const response = await apiClient.post('/api/Subscriptions', formatted);
    
    // Save locally to history
    if (payload.customer || payload.packageItem) {
      saveStoredSubscription({
        id: response.data?.id || `SUB-${Date.now()}`,
        customerId: formatted.customerId,
        customerName: payload.customer?.name || `عضو #${formatted.customerId}`,
        customerPhone: payload.customer?.phoneNumber || '',
        customerCode: (payload.customer?.code && !/^ID-\d+$/i.test(String(payload.customer.code).trim())) ? payload.customer.code : '',
        packageId: formatted.packageId,
        packageName: payload.packageItem?.name || `باقة #${formatted.packageId}`,
        packagePrice: Number(payload.packageItem?.price) || 0,
        trainerId: formatted.trainerId,
        trainerName: payload.trainer?.name || (formatted.trainerId ? `كابتن #${formatted.trainerId}` : null),
        paymentMethod: formatted.paymentMethod,
        notes: formatted.notes,
        status: 1, // نشط
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
    }

    return response.data;
  },

  /**
   * POST /api/Subscriptions/{id}/freeze
   * @param {string|number} id
   * @param {{ endDate: string, reason?: string }} data
   */
  async freezeSubscription(id, { endDate, reason = '' }) {
    const payload = {
      endDate: String(endDate),
      reason: String(reason || '').trim()
    };

    const response = await apiClient.post(`/api/Subscriptions/${id}/freeze`, payload);
    return response.data;
  },

  /**
   * POST /api/Subscriptions/{id}/unfreeze
   * @param {string|number} id
   */
  async unfreezeSubscription(id) {
    const response = await apiClient.post(`/api/Subscriptions/${id}/unfreeze`);
    return response.data;
  },

  /**
   * POST /api/Subscriptions/{id}/cancel
   * @param {string|number} id
   * @param {{ reason: string }} data
   */
  async cancelSubscription(id, { reason = '' }) {
    const payload = {
      reason: String(reason || '').trim()
    };

    const response = await apiClient.post(`/api/Subscriptions/${id}/cancel`, payload);
    return response.data;
  },

  /**
   * GET /api/Subscriptions/financial-summary
   * @param {string} fromDate (ISO or YYYY-MM-DD)
   * @param {string} toDate (ISO or YYYY-MM-DD)
   */
  async getFinancialSummary(fromDate = null, toDate = null) {
    const params = {};
    if (fromDate) {
      params.FromDate = fromDate;
      params.fromDate = fromDate;
    }
    if (toDate) {
      params.ToDate = toDate;
      params.toDate = toDate;
    }

    try {
      const response = await apiClient.get('/api/Subscriptions/financial-summary', { params });
      return response.data;
    } catch (err) {
      console.warn('GET /api/Subscriptions/financial-summary API error:', err);
      throw err;
    }
  }
};

export default subscriptionsService;
