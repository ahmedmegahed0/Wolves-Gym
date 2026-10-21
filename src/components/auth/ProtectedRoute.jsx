import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAccessToken } from '../../services/api';

/**
 * ProtectedRoute Component
 * Guards protected pages (like Attendance Dashboard) against unauthorized access.
 * Checks for token existence in localStorage and AuthContext.
 * Automatically bounces unauthenticated users back to /login with history replace.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Strict check on token in storage
  const storedToken = getAccessToken();

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-black flex flex-col items-center justify-center font-cairo">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
          <div className="absolute inset-0 rounded-full blur-md bg-amber-400/20" />
        </div>
        <p className="text-zinc-400 text-sm font-semibold">
          جاري التحقق من هوية الوحش وصلاحية الجلسة...
        </p>
      </div>
    );
  }

  // If unauthenticated or no token stored in localStorage, bounce to /login
  if (!isAuthenticated || !storedToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
