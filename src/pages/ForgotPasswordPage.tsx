import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
} from '@mui/material';
import {
  Email as EmailIcon,
  LockReset as LockResetIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { AuthService } from '../services/authService';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('請輸入電子郵件地址');
      return;
    }

    // 驗證電子郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('請輸入有效的電子郵件地址');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await AuthService.sendPasswordReset(email);
      setMessage('密碼重設信件已發送至您的電子郵件，請檢查您的信箱');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
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
            <LockResetIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography component="h1" variant="h4" gutterBottom>
              重設密碼
            </Typography>
            <Typography variant="body2" color="text.secondary">
              輸入您的電子郵件地址，我們將發送密碼重設連結給您
            </Typography>
          </Box>

          {/* 成功訊息 */}
          {message && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {message}
            </Alert>
          )}

          {/* 錯誤訊息 */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 表單 */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="電子郵件"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || !!message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading || !!message}
            >
              {loading ? '發送中...' : '發送重設連結'}
            </Button>

            {/* 返回登入 */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                underline="hover"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                <ArrowBackIcon fontSize="small" />
                返回登入頁面
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

export default ForgotPasswordPage;
