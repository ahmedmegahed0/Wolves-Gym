import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AttendanceDashboard from './components/AttendanceDashboard';
import AuthContainer from './components/auth/AuthContainer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '131232060757-o2mi2mprk6da7bu1e71rhu2qqseeflab.apps.googleusercontent.com';

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

              {/* Protected Dashboard Route */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AttendanceDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Root and Unmatched Routes: Redirect to /dashboard (which ProtectedRoute guards) */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
}

export default App;
