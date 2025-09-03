import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import HolidayManagementPage from './pages/HolidayManagementPage';
import LeaveManagementPage from './pages/LeaveManagementPage';
// import ShiftChangeManagementPage from './pages/ShiftChangeManagementPage';
import ShiftChangeManagementPageSimple from './pages/ShiftChangeManagementPageSimple';
import ErrorBoundary from './components/ErrorBoundary';
import ScheduleManagementPage from './pages/ScheduleManagementPage';
import SchedulingPage from './pages/SchedulingPage';
import StatsManagementPage from './pages/StatsManagementPage';
import UserManagementPage from './pages/UserManagementPage';

const AppRouter = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* 公開路由 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* 受保護的路由 */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <Navigate to="/schedule" />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/schedule" element={
            <ProtectedRoute>
              <MainLayout>
                <ScheduleManagementPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/scheduling" element={
            <ProtectedRoute requiredRole="manager">
              <MainLayout>
                <SchedulingPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/employees" element={
            <ProtectedRoute requiredRole="manager">
              <MainLayout>
                <EmployeeManagementPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/holidays" element={
            <ProtectedRoute requiredRole="manager">
              <MainLayout>
                <HolidayManagementPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/leaves" element={
            <ProtectedRoute>
              <MainLayout>
                <LeaveManagementPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/shift-changes" element={
            <ProtectedRoute requiredRole="manager">
              <MainLayout>
                <ErrorBoundary>
                  <ShiftChangeManagementPageSimple />
                </ErrorBoundary>
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/stats" element={
            <ProtectedRoute requiredRole="admin">
              <MainLayout>
                <StatsManagementPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute requiredRole="admin">
              <MainLayout>
                <UserManagementPage />
              </MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default AppRouter;
