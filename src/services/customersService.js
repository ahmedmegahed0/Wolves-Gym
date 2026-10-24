import apiClient, { customerService } from './apiClient';

/**
 * Customers Service Module
 * Handles:
 * - GET /api/customers
 * - GET /api/customers/{id}
 * - PATCH /api/customers/{id}
 * - PATCH /api/customers/{id}/approval-status
 * - POST /api/customers/{id}/behavior-notes
 * - GET /api/customers/{id}/behavior-notes
 * - GET /api/customers/{id}/attendances
 * - GET /api/customers/me
 */
/**
 * POST /api/customers
 * Direct Customer Onboarding from Reception/Admin Dashboard
 * @param {object} customerData
 */
export const createCustomerDirectly = async (customerData) => {
  const response = await apiClient.post('/api/customers', {
    name: customerData.name.trim(),
    email: customerData.email.trim(),
    phoneNumber: customerData.phoneNumber.trim(),
    password: customerData.password,
    confirmPassword: customerData.confirmPassword,
    isActive: customerData.isActive ?? true,
    code: customerData.code.trim(),
    height: Number(customerData.height) || 0,
    weight: Number(customerData.weight) || 0,
    age: Number(customerData.age) || 0,
    injuries: customerData.injuries || '',
    chronicDiseases: customerData.chronicDiseases || '',
    musclePercentage: Number(customerData.musclePercentage) || 0,
    fatPercentage: Number(customerData.fatPercentage) || 0,
    notes: customerData.notes || ''
  });
  return response.data;
};

export const customersService = {
  /**
   * POST /api/customers
   */
  createCustomerDirectly,

  /**
   * GET /api/customers
   */
  async getCustomers(params = {}) {
    return customerService.getCustomers(params);
  },

  /**
   * GET /api/customers/{id}
   * Get single customer full profile by ID
   * @param {number|string} id
   * @param {{ signal?: AbortSignal }} options
   */
  async getCustomerById(id, { signal } = {}) {
    const cleanId = Number(id);
    const response = await apiClient.get(`/api/customers/${cleanId}`, { signal });
    return response.data;
  },

  /**
   * PATCH /api/customers/{id}
   * Update customer profile details
   * @param {number|string} id
   * @param {object} data
   */
  async updateCustomer(id, data = {}) {
    const cleanId = Number(id);
    const payload = {
      name: String(data.name || '').trim(),
      phoneNumber: String(data.phoneNumber || '').trim(),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      height: data.height !== '' && data.height !== null && data.height !== undefined ? Number(data.height) : null,
      weight: data.weight !== '' && data.weight !== null && data.weight !== undefined ? Number(data.weight) : null,
      age: data.age !== '' && data.age !== null && data.age !== undefined ? Number(data.age) : null,
      musclePercentage: data.musclePercentage !== '' && data.musclePercentage !== null && data.musclePercentage !== undefined ? Number(data.musclePercentage) : null,
      fatPercentage: data.fatPercentage !== '' && data.fatPercentage !== null && data.fatPercentage !== undefined ? Number(data.fatPercentage) : null,
      injuries: String(data.injuries || '').trim(),
      chronicDiseases: String(data.chronicDiseases || '').trim(),
      notes: String(data.notes || '').trim(),
    };

    if (data.code && String(data.code).trim()) {
      payload.code = String(data.code).trim().toUpperCase();
    }
    if (data.approvalStatus !== undefined && data.approvalStatus !== null && data.approvalStatus !== '') {
      payload.approvalStatus = Number(data.approvalStatus);
    }

    try {
      const response = await apiClient.patch(`/api/customers/${cleanId}`, payload);
      return response.data || { success: true };
    } catch (patchErr) {
      if (patchErr.response?.status === 405) {
        const putRes = await apiClient.put(`/api/customers/${cleanId}`, payload);
        return putRes.data || { success: true };
      }
      throw patchErr;
    }
  },

  /**
   * PATCH /api/customers/{id}/approval-status
   * Change customer approval status (0: Pending, 1: Approved, 2: Rejected)
   * @param {number|string} id
   * @param {number|string|{ status: number }} data
   */
  async changeApprovalStatus(id, data) {
    const cleanId = Number(id);
    const statusVal = typeof data === 'object' && data !== null && data.status !== undefined 
      ? Number(data.status) 
      : Number(data);
    
    const payload = { status: statusVal };
    const response = await apiClient.patch(`/api/customers/${cleanId}/approval-status`, payload);
    return response.data || { success: true };
  },

  /**
   * POST /api/customers/{id}/behavior-notes
   * Add a behavior note to member's record
   * @param {number|string} id
   * @param {string|{ description: string }} descriptionOrData
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
   * Get behavior notes timeline for a member
   * @param {number|string} id
   * @param {{ pageNumber?: number, pageSize?: number, search?: string, sortBy?: string }} params
   * @param {{ signal?: AbortSignal }} options
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
   * Get customer attendances for a specific month and year
   * @param {number|string} id
   * @param {number} month (1-12)
   * @param {number} year (e.g. 2026)
   * @param {{ signal?: AbortSignal }} options
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
   * Get currently logged-in customer's profile
   */
  async getCustomerMe() {
    return customerService.getCustomerMe();
  },
};

export default customersService;
