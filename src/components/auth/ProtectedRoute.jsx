import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAccessToken, normalizeRole } from '../../services/apiClient';

/**
 * ProtectedRoute Component
 * Guards protected pages against unauthorized access based on user role.
 * Example: <ProtectedRoute allowedRoles={['Receptionist']}> <ReceptionDashboard /> </ProtectedRoute>
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  const storedToken = getAccessToken();

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-black flex flex-col items-center justify-center font-cairo">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
          <div className="absolute inset-0 rounded-full blur-md bg-amber-400/20" />
        </div>
        <p className="text-zinc-400 text-sm font-semibold">
          جاري التحقق من هوية وصلاحيات المستخدم...
        </p>
      </div>
    );
  }

  // If unauthenticated or no token stored in localStorage, bounce to /login
  if (!isAuthenticated || !storedToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict Role-Based Access Control (Requirement 3)
  const currentRole = normalizeRole(user?.role);

  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some((r) => normalizeRole(r) === currentRole);

    if (!isAllowed) {
      // 1. Receptionist attempted unauthorized route
      if (currentRole === 'Receptionist') {
        return <Navigate to="/dashboard/reception" replace />;
      }

      // 2. Customer attempted unauthorized route (e.g. typing reception URL manually)
      if (currentRole === 'Customer') {
        return <Navigate to="/dashboard/customer" replace />;
      }

      // 3. SuperAdmin, Manager, Trainer attempted unauthorized route
      return <Navigate to="/dashboard/under-construction" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
