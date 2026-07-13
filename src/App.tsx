import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MeetingProvider, useMeeting } from './context/MeetingContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MeetingRoom } from './pages/MeetingRoom';
import { Settings } from './pages/Settings';
import { AppLayout } from './components/layout/AppLayout';

// Protected Route Gate: Redirects to Login if user is unauthenticated
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useMeeting();

  if (isLoading) {
    return (
      <div id="loader-gate" className="min-h-screen bg-[#0B1017] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-xl border-t-2 border-r-2 border-blue-500 animate-spin"></div>
        <p className="text-sm text-gray-400 font-mono tracking-wide">Syncing Workspace Identity...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <MeetingProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Portal */}
          <Route path="/login" element={<Login />} />

          {/* Secure Workspace (uses AppLayout sidebar structure) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          {/* Secure Immersive Meeting Session (no sidebar layout - full screen) */}
          <Route 
            path="/meeting/:roomId" 
            element={
              <ProtectedRoute>
                <MeetingRoom />
              </ProtectedRoute>
            } 
          />

          {/* Root Wildcard Routing Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </MeetingProvider>
  );
}
