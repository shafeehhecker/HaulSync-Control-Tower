import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveOperations from './pages/LiveOperations';
import ExceptionsPage from './pages/Exceptions';
import AlertsPage from './pages/Alerts';
import ActionLogPage from './pages/ActionLog';
import AnalyticsPage from './pages/Analytics';
import RulesPage from './pages/Rules';
import UsersPage from './pages/Users';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index          element={<Dashboard />} />
        <Route path="live"        element={<LiveOperations />} />
        <Route path="exceptions"  element={<ExceptionsPage />} />
        <Route path="alerts"      element={<AlertsPage />} />
        <Route path="action-log"  element={<ActionLogPage />} />
        <Route path="analytics"   element={<AnalyticsPage />} />
        <Route path="rules"       element={<RulesPage />} />
        <Route path="users"       element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
