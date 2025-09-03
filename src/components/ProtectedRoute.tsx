import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'employee';
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'employee',
  requireAuth = true,
}) => {
  const { currentUser, userProfile, loading, hasPermission } = useAuth();
  const location = useLocation();

  // 載入中
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          載入中...
        </Typography>
      </Box>
    );
  }

  // 需要登入但未登入
  if (requireAuth && !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登入但沒有使用者資料
  if (requireAuth && currentUser && !userProfile) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h6" color="error">
          無法載入使用者資料
        </Typography>
        <Typography variant="body2" color="text.secondary">
          請聯絡系統管理員或重新登入
        </Typography>
      </Box>
    );
  }

  // 帳號被停用
  if (requireAuth && userProfile && !userProfile.isActive) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h6" color="error">
          帳號已被停用
        </Typography>
        <Typography variant="body2" color="text.secondary">
          請聯絡系統管理員以重新啟用您的帳號
        </Typography>
      </Box>
    );
  }

  // 權限不足
  if (requireAuth && !hasPermission(requiredRole)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h6" color="error">
          權限不足
        </Typography>
        <Typography variant="body2" color="text.secondary">
          您沒有權限存取此頁面
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
