import apiClient from './apiClient';

/**
 * Employees Management Service
 * Endpoints for managing staff/employees (Receptionists, Operation Managers, Admins/Managers)
 */

export const EMPLOYEE_ROLES = {
  1: { id: 1, key: 'Trainer', name: 'مدرب (Trainer)', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  2: { id: 2, key: 'OperationManager', name: 'مدير عمليات (Operation Manager)', badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  6: { id: 6, key: 'Reception', name: 'موظف استقبال (Reception)', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
};

// Non-enumerable string lookups so Object.entries(EMPLOYEE_ROLES) only iterates over [1, 2, 6] in UI dropdowns
Object.defineProperty(EMPLOYEE_ROLES, 'Trainer', { value: EMPLOYEE_ROLES[1], enumerable: false, writable: true });
Object.defineProperty(EMPLOYEE_ROLES, 'OperationManager', { value: EMPLOYEE_ROLES[2], enumerable: false, writable: true });
Object.defineProperty(EMPLOYEE_ROLES, 'Reception', { value: EMPLOYEE_ROLES[6], enumerable: false, writable: true });
Object.defineProperty(EMPLOYEE_ROLES, 'Receptionist', { value: EMPLOYEE_ROLES[6], enumerable: false, writable: true });

export const getEmployeeRoleInfo = (role) => {
  if (role === null || role === undefined) return null;
  if (EMPLOYEE_ROLES[role]) return EMPLOYEE_ROLES[role];
  const r = String(role).toLowerCase().trim();
  if (r === '1' || r === 'trainer' || r === 'coach') return EMPLOYEE_ROLES[1];
  if (r === '2' || r === 'operationmanager' || r === 'operation_manager' || r === 'operationsmanager') return EMPLOYEE_ROLES[2];
  if (r === '6' || r === 'reception' || r === 'receptionist') return EMPLOYEE_ROLES[6];
  if (r === '3' || r === 'manager') return { id: 3, key: 'Manager', name: 'مدير (Manager)', badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
  if (r === '4' || r === 'superadmin' || r === 'admin') return { id: 4, key: 'SuperAdmin', name: 'سوبر أدمن (Super Admin)', badge: 'text-amber-300 bg-amber-400/10 border-amber-400/30' };
  return null;
};

export const parseRoleValue = (role) => {
  if (role === null || role === undefined) return 6;
  const num = Number(role);
  if (!isNaN(num) && [1, 2, 6].includes(num)) return num;
  const r = String(role).toLowerCase().trim();
  if (r === 'trainer' || r === 'coach' || r === '1') return 1;
  if (r === 'operationmanager' || r === 'operation_manager' || r === 'operationsmanager' || r === '2') return 2;
  if (r === 'reception' || r === 'receptionist' || r === '6') return 6;
  return 6;
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
    '2',
    '6',
    2,
    6,
  ];
  return (
    allowedRoles.includes(user.role) ||
    allowedRoles.includes(String(user.role)) ||
    (Array.isArray(user.roles) && user.roles.some((r) => allowedRoles.includes(r) || allowedRoles.includes(String(r))))
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
    role: parseRoleValue(payload.role),
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
  if (payload.role !== undefined && payload.role !== null && payload.role !== '') {
    body.role = parseRoleValue(payload.role);
  }
  if (payload.isActive !== undefined && payload.isActive !== null) {
    body.isActive = Boolean(payload.isActive);
  }

  const response = await apiClient.patch(`/api/employees/${id}`, body);
  return response.data;
};

export default {
  EMPLOYEE_ROLES,
  getEmployeeRoleInfo,
  parseRoleValue,
  canManageEmployees,
  getEmployees,
  getEmployeeById,
  getEmployeeMe,
  createEmployee,
  updateEmployee,
};
