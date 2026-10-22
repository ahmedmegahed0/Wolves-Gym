import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AttendanceDashboard from './components/AttendanceDashboard';
import CustomerDashboard from './components/customers/CustomerDashboard';
import LockersDashboard from './components/lockers/LockersDashboard';
import PackagesDashboard from './components/packages/PackagesDashboard';
import TrainersSection from './components/trainers/TrainersSection';
import PendingApprovalPage from './components/dashboard/PendingApprovalPage';
import UnderConstructionDashboard from './components/dashboard/UnderConstructionDashboard';
import LandingPage from './components/landing/LandingPage';
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
  if (role === 'Receptionist' || role === 'SuperAdmin' || role === 'Manager') {
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
                  <ProtectedRoute allowedRoles={['Receptionist', 'SuperAdmin', 'Manager']}>
                    <AttendanceDashboard />
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

              {/* Packages & Membership Plans: Protected & Customer Routes */}
              <Route
                path="/dashboard/packages"
                element={
                  <ProtectedRoute allowedRoles={['Receptionist', 'Manager', 'SuperAdmin', 'Customer', 'Trainer']}>
                    <div className="min-h-screen bg-black bg-wolf-mesh p-4 sm:p-8">
                      <PackagesDashboard />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route path="/packages" element={<Navigate to="/dashboard/packages" replace />} />

              {/* Trainers Showcase: Public and Dashboard routes */}
              <Route
                path="/trainers"
                element={
                  <div className="min-h-screen bg-black bg-wolf-mesh p-4 sm:p-8">
                    <TrainersSection />
                  </div>
                }
              />
              <Route path="/dashboard/trainers" element={<Navigate to="/trainers" replace />} />

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

              {/* Landing Page (Public Home) */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<Navigate to="/" replace />} />

              {/* Legacy and convenience redirects */}
              <Route path="/dashboard" element={<RootRedirect />} />
              <Route path="/member" element={<Navigate to="/dashboard/customer" replace />} />
              <Route path="/customers" element={<RootRedirect />} />

              {/* Fallback unknown route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
}

export default App;
