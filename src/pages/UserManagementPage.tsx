import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Box,
  Alert,
  CircularProgress,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { formatDate } from '../utils/dateUtils';
import type { UserProfile } from '../services/authService';
import UserEditDialog from '../components/UserEditDialog';

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const userList: UserProfile[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          employeeId: data.employeeId,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          isActive: data.isActive,
          lastLoginAt: data.lastLoginAt?.toDate(),
        } as UserProfile;
      });
      
      setUsers(userList);
    } catch (error) {
      console.error('載入使用者失敗:', error);
      setError('載入使用者資料時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (uid: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        isActive: !currentStatus,
        updatedAt: new Date(),
      });
      
      setSuccess(`使用者狀態已${!currentStatus ? '啟用' : '停用'}`);
      await loadUsers();
    } catch (error) {
      console.error('更新使用者狀態失敗:', error);
      setError('更新使用者狀態時發生錯誤');
    }
  };

  const handleDeleteClick = (user: UserProfile) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      // 刪除使用者資料
      const userRef = doc(db, 'users', userToDelete.uid);
      await deleteDoc(userRef);
      
      setSuccess(`使用者 ${userToDelete.displayName} 已成功刪除`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (error) {
      console.error('刪除使用者失敗:', error);
      setError('刪除使用者時發生錯誤');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleEditClick = (user: UserProfile) => {
    setUserToEdit(user);
    setEditDialogOpen(true);
  };

  const handleEditSave = async (updatedUser: Partial<UserProfile>) => {
    if (!userToEdit) return;

    try {
      const userRef = doc(db, 'users', userToEdit.uid);
      
      // 準備更新資料，確保 undefined 值能正確處理
      const updateData: any = {
        updatedAt: new Date(),
      };

      // 只更新有變更的欄位，避免覆蓋未修改的資料
      if (updatedUser.displayName !== undefined) {
        updateData.displayName = updatedUser.displayName;
      }
      if (updatedUser.role !== undefined) {
        updateData.role = updatedUser.role;
      }
      if (updatedUser.employeeId !== undefined) {
        updateData.employeeId = updatedUser.employeeId;
      }
      if (updatedUser.isActive !== undefined) {
        updateData.isActive = updatedUser.isActive;
      }

      await updateDoc(userRef, updateData);
      
      setSuccess(`使用者 ${userToEdit.displayName} 已成功更新`);
      setEditDialogOpen(false);
      setUserToEdit(null);
      await loadUsers();
    } catch (error) {
      console.error('更新使用者失敗:', error);
      
      // 提供更詳細的錯誤訊息
      let errorMessage = '更新使用者時發生錯誤';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setUserToEdit(null);
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        使用者管理
      </Typography>

      {/* 操作區塊 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            使用者列表 ({users.length} 位使用者)
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
            disabled={loading}
          >
            重新載入
          </Button>
        </Box>
      </Paper>

      {/* 訊息顯示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* 使用者表格 */}
      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>姓名</TableCell>
                <TableCell>電子郵件</TableCell>
                <TableCell>角色</TableCell>
                <TableCell>員工編號</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>註冊時間</TableCell>
                <TableCell>最後登入</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleDisplayName(user.role)}
                      size="small"
                      color={getRoleColor(user.role) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{user.employeeId || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? '啟用' : '停用'}
                      size="small"
                      color={user.isActive ? 'success' : 'default'}
                      variant={user.isActive ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    {formatDate(user.lastLoginAt, { includeTime: true })}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="編輯使用者">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditClick(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.isActive ? '停用使用者' : '啟用使用者'}>
                        <IconButton
                          size="small"
                          onClick={() => toggleUserStatus(user.uid, user.isActive)}
                          color={user.isActive ? 'error' : 'success'}
                        >
                          {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="刪除使用者">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(user)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      沒有使用者資料
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 刪除確認對話框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>確認刪除使用者</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您確定要刪除使用者 <strong>{userToDelete?.displayName}</strong> 嗎？
            <br />
            <br />
            此操作將：
            <ul>
              <li>永久刪除該使用者的所有資料</li>
              <li>無法復原</li>
              <li>該使用者將無法再登入系統</li>
            </ul>
            <br />
            請輸入使用者姓名 <strong>{userToDelete?.displayName}</strong> 以確認刪除：
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="確認使用者姓名"
            type="text"
            fullWidth
            variant="outlined"
            placeholder={userToDelete?.displayName}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            取消
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : '確認刪除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編輯使用者對話框 */}
      <UserEditDialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        onSave={handleEditSave}
        user={userToEdit}
      />
    </Container>
  );
};

export default UserManagementPage;
