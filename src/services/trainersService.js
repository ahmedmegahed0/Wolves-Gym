import apiClient from './apiClient';
import axios from 'axios';

/**
 * Trainers Service Module
 * Comprehensive API client for:
 * - Public Trainers showcase: GET /api/Trainers
 * - Create Trainer: POST /api/Trainers
 * - Management Trainers table: GET /api/Trainers/management
 * - Trainer Details: GET /api/Trainers/{id}
 * - Update Trainer: PATCH /api/Trainers/{id}
 * - Current Logged-in Trainer Profile: GET /api/Trainers/me
 * - Trainer's Customers List: GET /api/Trainers/{id}/customers
 * - Submit KPI Evaluations: POST /api/Trainers/{id}/kpi-evaluations
 * - Update KPI Evaluations: PUT /api/Trainers/{id}/kpi-evaluations
 * - Get KPI Evaluations Summary: GET /api/Trainers/{id}/kpi-evaluations
 * - Get Daily KPI Evaluations: GET /api/Trainers/{id}/kpi-evaluations/daily
 */
export const trainersService = {
  /**
   * GET /api/Trainers
   * Public showcase list
   * @param {{ pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, signal?: AbortSignal }} params
   */
  async getPublicTrainers({ pageNumber = 1, pageSize = 8, search = '', sortBy = '', signal } = {}) {
    const query = new URLSearchParams();
    if (pageNumber) query.append('PageNumber', String(pageNumber));
    if (pageSize) query.append('PageSize', String(pageSize));
    if (search && search.trim()) query.append('Search', search.trim());

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

  // Alias for backward compatibility
  async getTrainers(params) {
    return this.getPublicTrainers(params);
  },

  /**
   * Helper to fetch full list of trainers for dropdown selections
   * Returns active and available coaches
   */
  async getAllTrainers({ signal } = {}) {
    try {
      const res = await this.getPublicTrainers({ pageSize: 100, signal });
      const list = res.data || [];
      return list.filter((t) => t.isAvailable !== false && t.isActive !== false && t.isTrainerActive !== false);
    } catch (err) {
      console.warn('Failed to load all trainers for dropdown:', err);
      return [];
    }
  },

  /**
   * POST /api/Trainers
   * Create a new coach account and profile
   * @param {{ name: string, email?: string, phoneNumber?: string, password?: string, confirmPassword?: string, salary?: number, yearsOfExperience?: number, isActive?: boolean, isAvailable?: boolean }} data
   */
  async createTrainer(data) {
    const payload = {
      name: String(data.name || '').trim(),
      email: data.email ? String(data.email).trim() : null,
      phoneNumber: data.phoneNumber ? String(data.phoneNumber).trim() : null,
      password: data.password || undefined,
      confirmPassword: data.confirmPassword || data.password || undefined,
      salary: Number(data.salary) || 0,
      yearsOfExperience: Number(data.yearsOfExperience) || 0,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) : true,
    };

    const response = await apiClient.post('/api/Trainers', payload);
    return response.data;
  },

  /**
   * GET /api/Trainers/management
   * Admin management table with filtering & pagination
   * @param {{ isActive?: boolean|string, isAvailable?: boolean|string, pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, signal?: AbortSignal }} params
   */
  async getTrainersManagement({
    isActive = undefined,
    isAvailable = undefined,
    pageNumber = 1,
    pageSize = 10,
    search = '',
    sortBy = '',
    signal,
  } = {}) {
    const query = new URLSearchParams();
    if (typeof isActive === 'boolean') {
      query.append('IsActive', String(isActive));
    } else if (isActive === 'true' || isActive === 'false') {
      query.append('IsActive', isActive);
    }

    if (typeof isAvailable === 'boolean') {
      query.append('IsAvailable', String(isAvailable));
    } else if (isAvailable === 'true' || isAvailable === 'false') {
      query.append('IsAvailable', isAvailable);
    }

    if (pageNumber) query.append('PageNumber', String(pageNumber));
    if (pageSize) query.append('PageSize', String(pageSize));
    if (search && search.trim()) query.append('Search', search.trim());

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

  // Alias for backward compatibility
  async getManagementTrainers(params) {
    return this.getTrainersManagement(params);
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
   * Update trainer info
   * @param {string|number} id
   * @param {{ name?: string, phoneNumber?: string, yearsOfExperience?: number, salary?: number, isActive?: boolean, isAvailable?: boolean }} data
   */
  async updateTrainer(id, data) {
    const payload = {};
    if (data.name !== undefined) payload.name = String(data.name).trim();
    if (data.phoneNumber !== undefined) payload.phoneNumber = String(data.phoneNumber).trim();
    if (data.yearsOfExperience !== undefined) payload.yearsOfExperience = Number(data.yearsOfExperience);
    if (data.salary !== undefined) payload.salary = Number(data.salary);
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);
    if (data.isAvailable !== undefined) payload.isAvailable = Boolean(data.isAvailable);

    const response = await apiClient.patch(`/api/Trainers/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle Trainer active status (account login permission)
   */
  async toggleTrainerActive(id, currentTrainer) {
    const nextStatus = !(currentTrainer.isActive ?? currentTrainer.isTrainerActive ?? true);
    return await this.updateTrainer(id, {
      isActive: nextStatus,
    });
  },

  /**
   * Toggle Trainer booking availability (accepting trainees)
   */
  async toggleTrainerAvailability(id, currentTrainer) {
    const nextAvailability = !(currentTrainer.isAvailable ?? true);
    return await this.updateTrainer(id, {
      isAvailable: nextAvailability,
    });
  },

  /**
   * Toggle Trainer status (Backward compatibility alias)
   */
  async toggleTrainerStatus(id, currentTrainer) {
    return this.toggleTrainerActive(id, currentTrainer);
  },

  /**
   * GET /api/Trainers/me
   * Profile of currently logged-in trainer
   */
  async getTrainerMe({ signal } = {}) {
    const response = await apiClient.get('/api/Trainers/me', { signal });
    return response.data;
  },

  /**
   * GET /api/Trainers/{id}/customers
   * Retrieves the assigned/subscribed athletes for this coach
   * @param {string|number} id
   * @param {{ pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, signal?: AbortSignal }} params
   */
  async getTrainerCustomers(id, { pageNumber = 1, pageSize = 10, search = '', sortBy = '', signal } = {}) {
    const query = new URLSearchParams();
    if (pageNumber) query.append('PageNumber', String(pageNumber));
    if (pageSize) query.append('PageSize', String(pageSize));
    if (search && search.trim()) query.append('Search', search.trim());

    const response = await apiClient.get(`/api/Trainers/${id}/customers?${query.toString()}`, { signal });
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
  },

  /**
   * POST /api/Trainers/{id}/kpi-evaluations
   * Submit new KPI evaluations for coach
   * @param {string|number} id
   * @param {{ scores: Array<{ kpiId: number, score: number, comment?: string }> }} payload
   */
  async submitTrainerKpiEvaluations(id, payload) {
    const body = {
      scores: Array.isArray(payload?.scores)
        ? payload.scores.map((s) => ({
            kpiId: Number(s.kpiId),
            score: Number(s.score),
            comment: s.comment ? String(s.comment).trim() : null,
          }))
        : [],
    };

    const response = await apiClient.post(`/api/Trainers/${id}/kpi-evaluations`, body);
    return response.data;
  },

  /**
   * PUT /api/Trainers/{id}/kpi-evaluations
   * Update KPI evaluations for a specific date
   * @param {string|number} id
   * @param {{ date: string, scores: Array<{ kpiId: number, score: number, comment?: string }> }} payload
   */
  async updateTrainerKpiEvaluations(id, payload) {
    const body = {
      date: payload.date,
      scores: Array.isArray(payload?.scores)
        ? payload.scores.map((s) => ({
            kpiId: Number(s.kpiId),
            score: Number(s.score),
            comment: s.comment ? String(s.comment).trim() : null,
          }))
        : [],
    };

    const response = await apiClient.put(`/api/Trainers/${id}/kpi-evaluations`, body);
    return response.data;
  },

  /**
   * GET /api/Trainers/{id}/kpi-evaluations
   * Overall average and KPI average breakdown
   * @param {string|number} id
   * @param {{ from?: string, to?: string, pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, signal?: AbortSignal }} params
   */
  async getTrainerKpiEvaluations(id, { from = '', to = '', pageNumber = 1, pageSize = 10, search = '', sortBy = '', signal } = {}) {
    const query = new URLSearchParams();
    if (from) query.append('From', from);
    if (to) query.append('To', to);
    if (pageNumber) query.append('PageNumber', String(pageNumber));
    if (pageSize) query.append('PageSize', String(pageSize));
    if (search && search.trim()) query.append('Search', search.trim());

    const response = await apiClient.get(`/api/Trainers/${id}/kpi-evaluations?${query.toString()}`, { signal });
    return response.data;
  },

  /**
   * GET /api/Trainers/{id}/kpi-evaluations/daily
   * Daily evaluations list with scores breakdown per day
   * @param {string|number} id
   * @param {{ date?: string, from?: string, to?: string, pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, signal?: AbortSignal }} params
   */
  async getTrainerDailyKpiEvaluations(id, { date = '', from = '', to = '', pageNumber = 1, pageSize = 10, search = '', sortBy = '', signal } = {}) {
    const query = new URLSearchParams();
    if (date) query.append('Date', date);
    if (from) query.append('From', from);
    if (to) query.append('To', to);
    if (pageNumber) query.append('PageNumber', String(pageNumber));
    if (pageSize) query.append('PageSize', String(pageSize));
    if (search && search.trim()) query.append('Search', search.trim());

    const response = await apiClient.get(`/api/Trainers/${id}/kpi-evaluations/daily?${query.toString()}`, { signal });
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
  },
};

// Aliases for unified naming
export const trainerService = trainersService;
export default trainersService;
