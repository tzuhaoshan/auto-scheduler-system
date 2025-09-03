import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Autocomplete,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { employeeService } from '../services/employeeService';
import type { Employee } from '../models/employee';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
    employeeId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const employeeList = await employeeService.getEmployees();
      setEmployees(employeeList);
    } catch (error) {
      console.error('載入員工資料失敗:', error);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target?.value || event;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證表單
    if (!formData.email || !formData.password || !formData.displayName) {
      setError('請填寫所有必填欄位');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('密碼確認不相符');
      return;
    }

    if (formData.password.length < 6) {
      setError('密碼至少需要6個字元');
      return;
    }

    // 驗證電子郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('請輸入有效的電子郵件地址');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        role: formData.role,
        employeeId: formData.employeeId || undefined,
      });
      navigate('/');
    } catch (error: any) {
      // 安全地處理錯誤訊息
      let errorMessage = '註冊失敗，請稍後再試';
      
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('code' in error && typeof error.code === 'string') {
          errorMessage = `錯誤代碼: ${error.code}`;
        }
      }
      
      // 檢查是否為帳號已存在但 UserProfile 建立失敗的情況
      if (errorMessage.includes('建立使用者資料失敗')) {
        setError(`${errorMessage}\n\n注意：Firebase 帳號可能已建立，但使用者資料不完整。\n請聯繫管理員協助處理，或嘗試使用此帳號登入。`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const getEmployeeOptions = () => {
    return employees.map(emp => ({
      label: `${emp.name} (${emp.employeeId})`,
      value: emp.id,
      employeeId: emp.employeeId,
    }));
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Logo 和標題 */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <PersonAddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography component="h1" variant="h4" gutterBottom>
              建立新帳號
            </Typography>
            <Typography variant="body2" color="text.secondary">
              註冊以開始使用自動排班系統
            </Typography>
          </Box>

          {/* 錯誤訊息 */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 註冊表單 */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="displayName"
              label="姓名"
              name="displayName"
              autoComplete="name"
              autoFocus
              value={formData.displayName}
              onChange={handleChange('displayName')}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="電子郵件"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange('email')}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="密碼"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange('password')}
              disabled={loading}
              helperText="至少6個字元"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => togglePasswordVisibility('password')}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="確認密碼"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel id="role-label">角色</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                value={formData.role}
                label="角色"
                onChange={(e) => handleChange('role')(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="employee">員工</MenuItem>
                <MenuItem value="manager">管理者</MenuItem>
                <MenuItem value="admin">系統管理員</MenuItem>
              </Select>
            </FormControl>

            {formData.role === 'employee' && (
              <Autocomplete
                options={getEmployeeOptions()}
                getOptionLabel={(option) => option.label}
                value={getEmployeeOptions().find(opt => opt.value === formData.employeeId) || null}
                onChange={(_, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    employeeId: newValue?.value || '',
                  }));
                }}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="normal"
                    label="關聯員工 (選填)"
                    helperText="選擇此帳號對應的員工資料"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? '註冊中...' : '建立帳號'}
            </Button>

            <Divider sx={{ my: 2 }} />

            {/* 登入連結 */}
            <Box sx={{ textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                underline="hover"
              >
                已有帳號？立即登入
              </Link>
            </Box>
          </Box>
        </Paper>

        {/* 系統資訊 */}
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
          © 2025 自動排班系統. 採用 Material Design 3 設計
        </Typography>
      </Box>
    </Container>
  );
};

export default RegisterPage;
