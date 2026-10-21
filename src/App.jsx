import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AttendanceDashboard from './components/AttendanceDashboard';
import AuthContainer from './components/auth/AuthContainer';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

function AppContent() {
  const { activeAuthView } = useAuth();

  if (activeAuthView === 'dashboard') {
    return <AttendanceDashboard />;
  }

  return <AuthContainer />;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
