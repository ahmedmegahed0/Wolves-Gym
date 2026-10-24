import apiClient from './apiClient';

/**
 * Employees Management Service
 * Endpoints for managing staff/employees (Receptionists, Operation Managers, Admins/Managers)
 */

export const EMPLOYEE_ROLES = {
  1: { id: 1, key: 'Receptionist', name: 'موظف استقبال (Receptionist)', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  2: { id: 2, key: 'OperationManager', name: 'مدير عمليات (Operation Manager)', badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  3: { id: 3, key: 'Manager', name: 'مدير عام (Manager / Admin)', badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  4: { id: 4, key: 'SuperAdmin', name: 'سوبر أدمن (Super Admin)', badge: 'text-amber-300 bg-amber-400/10 border-amber-400/30' },
};

/**
 * Check if the user has permission to manage employees
 * Receptionists, Admins, SuperAdmins, Owners, OperationManagers
 */
export const canManageEmployees = (user) => {
  if (!user) return false;
  const allowedRoles = [
    'Admin',
    'SuperAdmin',
    'Owner',
    'Reception',
    'Receptionist',
    'Manager',
    'OperationManager',
  ];
  return (
    allowedRoles.includes(user.role) ||
    (Array.isArray(user.roles) && user.roles.some((r) => allowedRoles.includes(r)))
  );
};

/**
 * GET /api/employees
 * @param {Object} params - { IsActive, PageNumber, PageSize, Search, SortBy }
 */
export const getEmployees = async (params = {}) => {
  const cleanParams = {};
  if (params.IsActive !== undefined && params.IsActive !== null && params.IsActive !== '') {
    cleanParams.IsActive = params.IsActive;
  }
  if (params.PageNumber) cleanParams.PageNumber = params.PageNumber;
  if (params.PageSize) cleanParams.PageSize = params.PageSize;
  if (params.Search && params.Search.trim()) cleanParams.Search = params.Search.trim();
  if (params.SortBy) cleanParams.SortBy = params.SortBy;

  const response = await apiClient.get('/api/employees', { params: cleanParams });
  return response.data;
};

/**
 * GET /api/employees/{id}
 */
export const getEmployeeById = async (id) => {
  const response = await apiClient.get(`/api/employees/${id}`);
  return response.data;
};

/**
 * GET /api/employees/me
 */
export const getEmployeeMe = async () => {
  const response = await apiClient.get('/api/employees/me');
  return response.data;
};

/**
 * POST /api/employees
 * @param {Object} payload - { name, email, phoneNumber, password, confirmPassword, salary, role, isActive }
 */
export const createEmployee = async (payload) => {
  const body = {
    name: payload.name?.trim(),
    email: payload.email?.trim(),
    phoneNumber: payload.phoneNumber?.trim(),
    password: payload.password,
    confirmPassword: payload.confirmPassword,
    salary: Number(payload.salary) || 0,
    role: Number(payload.role) || 1,
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
  };
  const response = await apiClient.post('/api/employees', body);
  return response.data;
};

/**
 * PATCH /api/employees/{id}
 * @param {string|number} id
 * @param {Object} payload - { name, phoneNumber, salary, role, isActive }
 */
export const updateEmployee = async (id, payload) => {
  const body = {};
  if (payload.name !== undefined && payload.name !== null) {
    body.name = String(payload.name).trim();
  }
  if (payload.phoneNumber !== undefined && payload.phoneNumber !== null && String(payload.phoneNumber).trim()) {
    body.phoneNumber = String(payload.phoneNumber).trim();
  }
  if (payload.salary !== undefined && payload.salary !== null && payload.salary !== '' && !isNaN(payload.salary)) {
    body.salary = Number(payload.salary);
  }
  if (payload.role !== undefined && payload.role !== null && payload.role !== '' && !isNaN(payload.role)) {
    body.role = Number(payload.role);
  }
  if (payload.isActive !== undefined && payload.isActive !== null) {
    body.isActive = Boolean(payload.isActive);
  }

  const response = await apiClient.patch(`/api/employees/${id}`, body);
  return response.data;
};

export default {
  EMPLOYEE_ROLES,
  getEmployees,
  getEmployeeById,
  getEmployeeMe,
  createEmployee,
  updateEmployee,
};
