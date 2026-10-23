import apiClient from './apiClient';

/**
 * Extract user-friendly error message from ProblemDetails or Axios error
 * @param {any} err
 * @param {string} defaultMessage
 * @returns {string}
 */
export const extractKpiErrorMessage = (err, defaultMessage = 'حدث خطأ أثناء معالجة الطلب.') => {
  if (!err) return defaultMessage;

  // 409 Conflict error
  if (err.response?.status === 409) {
    const detail = err.response?.data?.detail || err.response?.data?.message || '';
    if (detail) return detail;
    return 'اسم مؤشر الأداء مسجل بالفعل في النظام. يرجى اختيار اسم مؤشر آخر.';
  }

  // 400 Bad Request error
  if (err.response?.status === 400 && err.response?.data) {
    const data = err.response.data;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map((e) => e.description || e.message || e.code || e).join('; ');
    }
    if (typeof data.errors === 'object' && Object.keys(data.errors).length > 0) {
      const msgs = [];
      Object.values(data.errors).forEach((val) => {
        if (Array.isArray(val)) msgs.push(...val);
        else if (typeof val === 'string') msgs.push(val);
      });
      if (msgs.length > 0) return msgs.join('; ');
    }
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    if (data.title) return data.title;
  }

  // 404 Not Found error
  if (err.response?.status === 404) {
    return 'مؤشر الأداء المطلوب غير موجود أو تم حذفه.';
  }

  if (err.response?.data?.detail) return err.response.data.detail;
  if (err.response?.data?.message) return err.response.data.message;
  return err.message || defaultMessage;
};

/**
 * KPIs Service Module
 * Handles Endpoints:
 * - GET /api/Kpis
 * - POST /api/Kpis
 * - GET /api/Kpis/{id}
 * - PATCH /api/Kpis/{id}
 */
export const kpisService = {
  /**
   * Fetch approved KPIs list with search, filter, and pagination
   * GET /api/Kpis
   * @param {{
   *   isActive?: boolean|string|null,
   *   pageNumber?: number,
   *   pageSize?: number,
   *   search?: string,
   *   sortBy?: string
   * }} params
   * @param {{ signal?: AbortSignal }} options
   * @returns {Promise<{
   *   data: Array<{ id: number, name: string, description: string, isActive: boolean, createdAt: string, updatedAt?: string }>,
   *   currentPage: number,
   *   totalPages: number,
   *   totalCount: number,
   *   pageSize: number,
   *   hasPreviousPage: boolean,
   *   hasNextPage: boolean
   * }>}
   */
  async getKpis(params = {}, { signal } = {}) {
    const query = new URLSearchParams();

    // Check if isActive is specifically provided as boolean or 'true'/'false'
    if (params.isActive !== undefined && params.isActive !== null && params.isActive !== '' && params.isActive !== 'all') {
      const boolVal = typeof params.isActive === 'boolean' ? params.isActive : params.isActive === 'true';
      query.append('IsActive', String(boolVal));
    }

    const page = Number(params.pageNumber || params.PageNumber) || 1;
    query.append('PageNumber', String(page));

    const size = Number(params.pageSize || params.PageSize) || 10;
    query.append('PageSize', String(size));

    const searchVal = String(params.search || params.Search || '').trim();
    if (searchVal) {
      query.append('Search', searchVal);
    }

    const sortByVal = String(params.sortBy || params.SortBy || '').trim();
    if (sortByVal) {
      query.append('SortBy', sortByVal);
    }

    const qs = query.toString();
    const url = `/api/Kpis${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get(url, { signal });
    return response.data;
  },

  /**
   * Get single KPI details by ID
   * GET /api/Kpis/{id}
   * @param {number|string} id
   * @param {{ signal?: AbortSignal }} options
   * @returns {Promise<{
   *   id: number,
   *   name: string,
   *   description: string,
   *   isActive: boolean,
   *   createdAt: string,
   *   updatedAt?: string
   * }>}
   */
  async getKpiById(id, { signal } = {}) {
    const cleanId = Number(id);
    const response = await apiClient.get(`/api/Kpis/${cleanId}`, { signal });
    return response.data;
  },

  /**
   * Create new KPI indicator
   * POST /api/Kpis
   * @param {{ name: string, description: string, isActive?: boolean }} payload
   * @returns {Promise<any>}
   */
  async createKpi({ name, description, isActive = true }) {
    const body = {
      name: String(name || '').trim(),
      description: String(description || '').trim(),
      isActive: Boolean(isActive),
    };
    const response = await apiClient.post('/api/Kpis', body);
    return response.data;
  },

  /**
   * Update existing KPI indicator
   * PATCH /api/Kpis/{id}
   * @param {number|string} id
   * @param {{ name: string, description: string, isActive?: boolean }} payload
   * @returns {Promise<any>}
   */
  async updateKpi(id, { name, description, isActive }) {
    const cleanId = Number(id);
    const body = {
      name: String(name || '').trim(),
      description: String(description || '').trim(),
      isActive: Boolean(isActive),
    };
    const response = await apiClient.patch(`/api/Kpis/${cleanId}`, body);
    return response.data;
  },

  /**
   * Toggle KPI active status
   * Helper that calls updateKpi with toggled isActive value
   * @param {number|string} id
   * @param {{ name: string, description: string, isActive?: boolean }} currentKpi
   * @returns {Promise<any>}
   */
  async toggleKpiStatus(id, currentKpi) {
    const cleanId = Number(id);
    const nextStatus = !Boolean(currentKpi?.isActive);
    return await this.updateKpi(cleanId, {
      name: currentKpi?.name || '',
      description: currentKpi?.description || '',
      isActive: nextStatus,
    });
  },
};

// Aliases for convenience
export const kpiService = kpisService;
export default kpisService;
