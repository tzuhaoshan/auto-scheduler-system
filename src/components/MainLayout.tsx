import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BarChartIcon from '@mui/icons-material/BarChart';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserProfileDialog from './UserProfileDialog';

interface MainLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 240;

const navItems = [
  { text: '班表查詢', path: '/schedule', icon: <CalendarMonthIcon />, role: 'employee' },
  { text: '班表管理', path: '/schedule', icon: <CalendarMonthIcon />, role: 'manager' },
  { text: '排班設定', path: '/scheduling', icon: <SettingsIcon />, role: 'manager' },
  { text: '員工管理', path: '/employees', icon: <PeopleIcon />, role: 'manager' },
  { text: '假日管理', path: '/holidays', icon: <EventAvailableIcon />, role: 'manager' },
  { text: '請假管理', path: '/leaves', icon: <EventBusyIcon />, role: 'employee' },
  { text: '換班審核', path: '/shift-changes', icon: <SwapHorizIcon />, role: 'manager' },
  { text: '統計管理', path: '/stats', icon: <BarChartIcon />, role: 'admin' },
  { text: '使用者管理', path: '/users', icon: <ManageAccountsIcon />, role: 'admin' },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, logout, hasPermission } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  // 根據使用者權限過濾導航項目，避免重複項目
  const filteredNavItems = useMemo(() => {
    const userRole = userProfile?.role;
    
    // 如果是管理員或管理者，只顯示最高權限的項目
    if (userRole === 'admin' || userRole === 'manager') {
      return navItems.filter(item => {
        // 管理員和管理者都可以看到所有項目，但避免重複的班表相關項目
        if (item.path === '/schedule') {
          // 只顯示「班表管理」，不顯示「班表查詢」
          return item.role === 'manager';
        }
        return hasPermission(item.role as 'admin' | 'manager' | 'employee');
      });
    }
    
    // 員工角色正常過濾
    return navItems.filter(item => 
      hasPermission(item.role as 'admin' | 'manager' | 'employee')
    );
  }, [userProfile?.role, hasPermission]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileSettings = () => {
    setIsProfileDialogOpen(true);
    handleClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
    handleClose();
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

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            自動排班系統
          </Typography>
          
          {/* 使用者資訊 */}
          {userProfile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={getRoleDisplayName(userProfile.role)}
                size="small"
                color={getRoleColor(userProfile.role) as any}
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)' }}
              />
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {userProfile.displayName.charAt(0)}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem disabled>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2">{userProfile.displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {userProfile.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleProfileSettings}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  個人設定
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  登出
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {filteredNavItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
      
      {/* 個人設定對話框 */}
      <UserProfileDialog
        open={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
      />
    </Box>
  );
};

export default MainLayout;
