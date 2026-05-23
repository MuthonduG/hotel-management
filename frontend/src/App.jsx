import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Guests from './pages/Guests';
import Rooms from './pages/Rooms';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CreateStaff from './pages/admin/CreateStaff';
import RoleRoute from './components/RoleRoute';
import SessionManager from './components/SessionManager';
import AppShellLayout from './layout/AppShellLayout';
import { useAuthStore } from './store/authstore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function ProtectedShell() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <AppShellLayout />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/admin/staff"
          element={
            <RoleRoute>
              <CreateStaff />
            </RoleRoute>
          }
        />
        <Route
          path="/guests"
          element={
            <RoleRoute>
              <Guests />
            </RoleRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <RoleRoute>
              <Rooms />
            </RoleRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <RoleRoute>
              <Reports />
            </RoleRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleRoute>
              <Settings />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1a4a6e',
            colorLink: '#1a4a6e',
            borderRadius: 8,
            fontFamily:
              "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          },
          components: {
            Button: { controlHeightLG: 44 },
            Input: { controlHeightLG: 44 },
          },
        }}
      >
        <BrowserRouter>
          <SessionManager />
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
