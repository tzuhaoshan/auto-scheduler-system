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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import type { UserProfile } from '../services/authService';

interface UserEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (updatedUser: Partial<UserProfile>) => Promise<void>;
  user: UserProfile | null;
}

const UserEditDialog: React.FC<UserEditDialogProps> = ({ open, onClose, onSave, user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 表單資料
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    role: '',
    employeeId: '',
    isActive: true,
  });

  // 當對話框開啟時，載入使用者資料
  useEffect(() => {
    if (open && user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        role: user.role || '',
        employeeId: user.employeeId || '',
        isActive: user.isActive,
      });
      setError(null);
    }
  }, [open, user]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    // 基本驗證
    if (!formData.displayName.trim()) {
      setError('姓名不能為空');
      return;
    }

    if (!formData.email.trim()) {
      setError('電子郵件不能為空');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 處理員工編號：如果為空字串則設為 undefined，否則保留原值
      const processedEmployeeId = formData.employeeId.trim() === '' ? undefined : formData.employeeId.trim();
      
      await onSave({
        displayName: formData.displayName.trim(),
        role: formData.role as 'admin' | 'manager' | 'employee',
        employeeId: processedEmployeeId,
        isActive: formData.isActive,
      });
      
      onClose();
    } catch (error: any) {
      console.error('更新使用者失敗:', error);
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

  if (!user) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">編輯使用者</Typography>
          <Chip
            label={getRoleDisplayName(user.role)}
            size="small"
            color={getRoleColor(user.role) as any}
            variant="outlined"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

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
              helperText="電子郵件無法在此處修改，如需變更請聯繫系統管理員"
            />
            
            <FormControl fullWidth>
              <InputLabel>角色</InputLabel>
              <Select
                value={formData.role}
                label="角色"
                onChange={(e) => handleInputChange('role', e.target.value)}
              >
                <MenuItem value="employee">員工</MenuItem>
                <MenuItem value="manager">管理者</MenuItem>
                <MenuItem value="admin">系統管理員</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="員工編號"
              value={formData.employeeId}
              onChange={(e) => handleInputChange('employeeId', e.target.value)}
              fullWidth
              helperText="可選填"
            />

            <FormControl fullWidth>
              <InputLabel>狀態</InputLabel>
              <Select
                value={formData.isActive ? 'true' : 'false'}
                label="狀態"
                onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
              >
                <MenuItem value="true">啟用</MenuItem>
                <MenuItem value="false">停用</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.displayName.trim()}
        >
          {loading ? <CircularProgress size={20} /> : '儲存變更'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserEditDialog;
