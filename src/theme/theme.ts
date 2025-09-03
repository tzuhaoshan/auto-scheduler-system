import { createTheme } from '@mui/material/styles';

// 參考 Material Design 3 設計令牌
const theme = createTheme({
  palette: {
    mode: 'light', // 預設為亮色模式
    primary: {
      main: '#6750A4', // Brand color
    },
    secondary: {
      main: '#625B71', // Supporting color
    },
    background: {
      default: '#FFFBFE',
      paper: '#FFFBFE',
    },
    error: {
      main: '#B3261E',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    // Material Design 3 Type Scale
    h1: { fontSize: '3.5rem', lineHeight: '4rem', fontWeight: 400 },
    h2: { fontSize: '2rem', lineHeight: '2.5rem', fontWeight: 400 },
    h3: { fontSize: '1.375rem', lineHeight: '1.75rem', fontWeight: 500 },
    body1: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 400 },
    button: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 500 },
  },
  shape: {
    borderRadius: 16, // 更圓潤的邊角
  },
  components: {
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px', // 全圓角按鈕
        },
      },
    },
  },
});

export default theme;
