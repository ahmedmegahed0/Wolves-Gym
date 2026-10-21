import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AttendanceDashboard from './components/AttendanceDashboard';
import CustomerDashboard from './components/customers/CustomerDashboard';
import LockersDashboard from './components/lockers/LockersDashboard';
import PendingApprovalPage from './components/dashboard/PendingApprovalPage';
import UnderConstructionDashboard from './components/dashboard/UnderConstructionDashboard';
import AuthContainer from './components/auth/AuthContainer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { normalizeRole } from './services/apiClient';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '131232060757-o2mi2mprk6da7bu1e71rhu2qqseeflab.apps.googleusercontent.com';

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const role = normalizeRole(user?.role);
  if (role === 'Receptionist') {
    return <Navigate to="/dashboard/reception" replace />;
  }
  if (role === 'Customer') {
    return <Navigate to="/dashboard/customer" replace />;
  }
  // SuperAdmin, Manager, Trainer
  return <Navigate to="/dashboard/under-construction" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<AuthContainer initialView="login" />} />
              <Route path="/register" element={<AuthContainer initialView="register" />} />
              <Route path="/confirm-email" element={<AuthContainer initialView="confirm-email" />} />
              <Route path="/forgot-password" element={<AuthContainer initialView="forgot-password" />} />

              {/* Requirement 2 & 3: Reception Dashboard */}
              <Route
                path="/dashboard/reception"
                element={
                  <ProtectedRoute allowedRoles={['Receptionist']}>
                    <AttendanceDashboard initialSection="attendance" />
                  </ProtectedRoute>
                }
              />

              {/* Lockers Management Module: Protected Route */}
              <Route
                path="/dashboard/lockers"
                element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Manager', 'SuperAdmin']}>
                    <LockersDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/lockers" element={<Navigate to="/dashboard/lockers" replace />} />

              {/* Requirement 2 & 3: Customer Portal */}
              <Route
                path="/dashboard/customer"
                element={
                  <ProtectedRoute allowedRoles={['Customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Requirement 2: Pending Approval Page for Customers */}
              <Route
                path="/pending-approval"
                element={
                  <ProtectedRoute allowedRoles={['Customer']}>
                    <PendingApprovalPage />
                  </ProtectedRoute>
                }
              />

              {/* Requirement 2 & 3: Under-Construction Page for SuperAdmin, Manager, Trainer */}
              <Route
                path="/dashboard/under-construction"
                element={
                  <ProtectedRoute allowedRoles={['SuperAdmin', 'Manager', 'Trainer']}>
                    <UnderConstructionDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Legacy and convenience redirects */}
              <Route path="/dashboard" element={<RootRedirect />} />
              <Route path="/member" element={<Navigate to="/dashboard/customer" replace />} />
              <Route path="/customers" element={<RootRedirect />} />

              {/* Dynamic Role-Based Fallback Root Redirect */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
}

export default App;
