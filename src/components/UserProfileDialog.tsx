import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/authService';

interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({ open, onClose }) => {
  const { userProfile, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // 表單資料
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    role: '',
    employeeId: '',
  });

  // 密碼修改表單資料
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 當對話框開啟時，載入使用者資料
  useEffect(() => {
    if (open && userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        role: userProfile.role || '',
        employeeId: userProfile.employeeId || '',
      });
      setError(null);
      setSuccess(false);
    }
  }, [open, userProfile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;

    // 驗證新密碼
    if (passwordData.newPassword.length < 6) {
      setError('新密碼至少需要6個字元');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('新密碼與確認密碼不相符');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await AuthService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      setSuccess(true);
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('修改密碼失敗:', error);
      setError(error.message || '修改密碼失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!userProfile || !currentUser) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 更新使用者資料
      await AuthService.updateUserProfile(userProfile.uid, {
        displayName: formData.displayName,
        employeeId: formData.employeeId || undefined,
      });

      // 如果電子郵件有變更，需要重新驗證
      if (formData.email !== userProfile.email) {
        // 這裡可以添加電子郵件變更的邏輯
        // 由於 Firebase 需要重新驗證，暫時不允許變更電子郵件
        setError('電子郵件變更需要重新驗證，請聯繫管理員協助處理');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('更新使用者資料失敗:', error);
      setError(error.message || '更新失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: '系統管理員',
      manager: '管理者',
      employee: '員工',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      admin: 'error',
      manager: 'warning',
      employee: 'info',
    };
    return roleColors[role as keyof typeof roleColors] || 'default';
  };

  if (!userProfile) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">個人設定</Typography>
            <Chip
              label={getRoleDisplayName(userProfile.role)}
              size="small"
              color={getRoleColor(userProfile.role) as any}
              variant="outlined"
            />
          </Box>
          <Button
            size="small"
            variant={showPasswordForm ? "outlined" : "text"}
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              if (!showPasswordForm) {
                resetPasswordForm();
              }
            }}
            sx={{ minWidth: 'auto' }}
          >
            {showPasswordForm ? '返回個人資料' : '修改密碼'}
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {showPasswordForm ? '密碼修改成功！' : '個人資料更新成功！'}
            </Alert>
          )}

          {!showPasswordForm ? (
            // 個人資料表單
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="姓名"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                fullWidth
                required
              />
              
              <TextField
                label="電子郵件"
                value={formData.email}
                disabled
                fullWidth
                helperText="電子郵件無法在此處修改，如需變更請聯繫管理員"
              />
              
              <TextField
                label="角色"
                value={getRoleDisplayName(formData.role)}
                disabled
                fullWidth
                helperText="角色無法在此處修改"
              />
              
              <TextField
                label="員工編號"
                value={formData.employeeId}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                fullWidth
                helperText="可選填"
              />
            </Box>
          ) : (
            // 密碼修改表單
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="目前密碼"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                fullWidth
                required
                helperText="請輸入您目前的密碼"
              />
              
              <TextField
                label="新密碼"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                fullWidth
                required
                helperText="新密碼至少需要6個字元"
              />
              
              <TextField
                label="確認新密碼"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                fullWidth
                required
                helperText="請再次輸入新密碼"
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          取消
        </Button>
        {!showPasswordForm ? (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.displayName.trim()}
          >
            {loading ? <CircularProgress size={20} /> : '儲存變更'}
          </Button>
        ) : (
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={loading || !passwordData.currentPassword.trim() || !passwordData.newPassword.trim() || !passwordData.confirmPassword.trim()}
          >
            {loading ? <CircularProgress size={20} /> : '修改密碼'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserProfileDialog;
