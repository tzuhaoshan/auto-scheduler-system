import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import type { Leave, LeaveStatus } from '../models/leave';
import type { Employee } from '../models/employee';
import { leaveService } from '../services/leaveService';
import { employeeService } from '../services/employeeService';
import LeaveForm from '../components/LeaveForm';
import type { LeaveFormData } from '../components/LeaveForm';
import { format } from 'date-fns';

const LeaveManagementPage = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leavesData, employeesData] = await Promise.all([
          leaveService.getLeaves(),
          employeeService.getEmployees(),
        ]);
        
        // Add employee names to leave objects for easy display
        const leavesWithNames = leavesData.map(leave => ({
          ...leave,
          employeeName: employeesData.find(e => e.id === leave.employeeId)?.name || '未知員工',
        }));

        setLeaves(leavesWithNames);
        setEmployees(employeesData);
      } catch (error) {
        console.error('無法獲取資料:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenForm = (leave: Leave | null) => {
    setSelectedLeave(leave);
    setIsFormOpen(true);
    handleMenuClose();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedLeave(null);
  };

  const handleSave = async (data: LeaveFormData, id?: string) => {
    try {
      const leavePayload = {
        employeeId: data.employeeId,
        leaveType: data.leaveType,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        reason: data.reason,
      };

      if (id) {
        await leaveService.updateLeave(id, leavePayload);
      } else {
        await leaveService.addLeave(leavePayload as Omit<Leave, 'id' | 'appliedAt' | 'status'>);
      }
      
      // Refresh data
      setLoading(true);
      const updatedLeaves = await leaveService.getLeaves();
      const leavesWithNames = updatedLeaves.map(leave => ({
          ...leave,
          employeeName: employees.find(e => e.id === leave.employeeId)?.name || '未知員工',
        }));
      setLeaves(leavesWithNames);
      setLoading(false);
    } catch (error) {
      console.error('儲存請假失敗:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await leaveService.deleteLeave(id);
      setLeaves(leaves.filter((leave) => leave.id !== id));
      handleMenuClose();
    } catch (error) {
      console.error('刪除請假失敗:', error);
    }
  };
  
  const handleUpdateStatus = async (id: string, status: LeaveStatus) => {
    try {
      await leaveService.updateLeave(id, { status, reviewedAt: new Date() });
       // Refresh data
      setLoading(true);
      const updatedLeaves = await leaveService.getLeaves();
      const leavesWithNames = updatedLeaves.map(leave => ({
          ...leave,
          employeeName: employees.find(e => e.id === leave.employeeId)?.name || '未知員工',
        }));
      setLeaves(leavesWithNames);
      setLoading(false);
      handleMenuClose();
    } catch (error) {
      console.error(`更新狀態失敗:`, error);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, leave: Leave) => {
    setAnchorEl(event.currentTarget);
    setSelectedLeave(leave);
    setMenuTargetId(leave.id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTargetId(null);
    // 不要清空 selectedLeave，讓編輯功能能正常工作
  };

  const getStatusChip = (status: LeaveStatus) => {
    const statusMap = {
      pending: { label: '待審核', color: 'warning' as const },
      approved: { label: '已批准', color: 'success' as const },
      rejected: { label: '已拒絕', color: 'error' as const },
    };
    const { label, color } = statusMap[status] || { label: '未知', color: 'default' as const };
    return <Chip label={label} color={color} size="small" />;
  };
  
  const getLeaveTypeDisplay = (type: string) => {
    const typeMap = {
      annual: '特休',
      sick: '病假',
      personal: '事假',
      meeting: '會議',
      other_duty: '其他值班',
      compensatory_leave: '排班補休',
    };
    return typeMap[type as keyof typeof typeMap] || '未知';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          請假管理
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm(null)}>
          新增請假
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="leave table">
            <TableHead>
              <TableRow>
                <TableCell>員工</TableCell>
                <TableCell>類型</TableCell>
                <TableCell>開始時間</TableCell>
                <TableCell>結束時間</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>{leave.employeeName}</TableCell>
                  <TableCell>{getLeaveTypeDisplay(leave.leaveType)}</TableCell>
                  <TableCell>{format(leave.startTime, 'yyyy/MM/dd HH:mm')}</TableCell>
                  <TableCell>{format(leave.endTime, 'yyyy/MM/dd HH:mm')}</TableCell>
                  <TableCell>{getStatusChip(leave.status)}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label="more" onClick={(e) => handleMenuClick(e, leave)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 請假說明區塊 */}
      <Paper sx={{ mt: 3, p: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="h6" component="h2" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
          📋 請假說明
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body2" component="p" sx={{ mb: 1, color: 'text.secondary' }}>
            1. 請填入實際請假日期與時間。
          </Typography>
          <Typography variant="body2" component="p" sx={{ mb: 1, color: 'text.secondary' }}>
            2. 延診請假：請填寫延診日期，時間請填寫 17:00-18:00。
          </Typography>
          <Typography variant="body2" component="p" sx={{ color: 'text.secondary' }}>
            3. 處方評估研討會：請填寫研討會日期，時間請填寫 17:30-18:00。
          </Typography>
        </Box>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && menuTargetId === selectedLeave?.id}
        onClose={handleMenuClose}
      >
        {selectedLeave?.status === 'pending' && [
          <MenuItem key="approve" onClick={() => handleUpdateStatus(selectedLeave.id, 'approved')}>
            <CheckCircleOutlineIcon sx={{ mr: 1 }} fontSize="small" /> 批准
          </MenuItem>,
          <MenuItem key="reject" onClick={() => handleUpdateStatus(selectedLeave.id, 'rejected')}>
            <HighlightOffIcon sx={{ mr: 1 }} fontSize="small" /> 拒絕
          </MenuItem>
        ]}
        <MenuItem onClick={() => handleOpenForm(selectedLeave)}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" /> 編輯
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedLeave!.id)}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" /> 刪除
        </MenuItem>
      </Menu>

      <LeaveForm
        open={isFormOpen}
        onClose={handleCloseForm}
        leave={selectedLeave}
        employees={employees}
        onSave={handleSave}
      />
    </Container>
  );
};

export default LeaveManagementPage;
