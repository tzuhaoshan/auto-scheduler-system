import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Button,
} from '@mui/material';
import { format } from 'date-fns';
import type { ShiftChangeRequest, ShiftChangeStatus } from '../models/shiftChange';
import { getPendingAdminRequests, approveAndProcessShiftChange, updateShiftChangeRequestStatus } from '../services/shiftChangeService';
import { employeeService } from '../services/employeeService';
import type { Employee } from '../models/employee';

const statusMap: Record<ShiftChangeStatus, { label: string; color: any }> = {
  pending: { label: '待處理', color: 'warning' },
  approved_by_user: { label: '待管理員批准', color: 'info' },
  approved_by_admin: { label: '已批准', color: 'success' },
  rejected: { label: '已拒絕', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
};

const getShiftDisplayName = (shift: string) => {
  const names: Record<string, string> = {
    morning: '上午支援',
    noon: '諮詢台值午',
    afternoon: '下午支援',
    phone: '諮詢電話',
    verify1: '處方審核(主)',
    verify2: '處方審核(輔)',
  };
  return names[shift] || shift;
};

const ShiftChangeManagementPage = () => {
  const [requests, setRequests] = useState<ShiftChangeRequest[]>([]);
  const [employees, setEmployees] = useState<Record<string, Employee>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('ShiftChangeManagementPage: Starting to fetch data...');
        setIsLoading(true);
        setError(null); // 清除之前的錯誤
        
        const [pendingRequests, allEmployees] = await Promise.all([
          getPendingAdminRequests(),
          employeeService.getEmployees()
        ]);

        console.log('ShiftChangeManagementPage: Fetched data:', { 
          requestsCount: pendingRequests.length, 
          employeesCount: allEmployees.length 
        });

        const employeeMap = allEmployees.reduce((acc, emp) => {
          acc[emp.id] = emp;
          return acc;
        }, {} as Record<string, Employee>);

        setRequests(pendingRequests);
        setEmployees(employeeMap);
        
        console.log('ShiftChangeManagementPage: Data set successfully');
      } catch (err) {
        console.error('ShiftChangeManagementPage: Error fetching data:', err);
        setError(`無法讀取申請資料：${err instanceof Error ? err.message : '未知錯誤'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const handleApprove = async (requestId: string) => {
    // In a real app, you'd get the admin's ID from an auth context
    const adminId = 'temp_admin_id'; 
    try {
      // 現在呼叫新的整合函式
      await approveAndProcessShiftChange(requestId, adminId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      // Optionally, show a success snackbar
    } catch (err) {
      console.error('Approval process failed:', err);
      setError('批准操作失敗，請檢查主控台以獲取詳細資訊。');
    }
  };

  const handleReject = async (requestId: string) => {
    // In a real app, you'd show a dialog to enter a reason
    const reason = '管理者拒絕';
    try {
      await updateShiftChangeRequestStatus(requestId, 'rejected', undefined, reason);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      setError('拒絕操作失敗');
    }
  };


  const renderRequestDetails = (request: ShiftChangeRequest) => {
    try {
      // const requesterName = employees[request.requesterId]?.name || request.requesterId; // 暫時不使用
      const originalShiftText = request.originalDate 
        ? `${format(new Date(request.originalDate), 'MM/dd')} ${getShiftDisplayName(request.originalShift)}`
        : `未知日期 ${getShiftDisplayName(request.originalShift)}`;

      if (request.type === 'cover') {
        const covererName = employees[request.targetCovererId || '']?.name || 'N/A';
        return `申請 ${covererName} 代班 ${originalShiftText}`;
      }

      if (request.type === 'swap') {
        const swapperName = employees[request.targetSwapperId || '']?.name || 'N/A';
        const targetShiftText = request.targetSwapDate 
          ? `${format(new Date(request.targetSwapDate), 'MM/dd')} ${getShiftDisplayName(request.targetSwapShift || '')}`
          : 'N/A';
        return `申請與 ${swapperName} 交換班次 (${originalShiftText} <=> ${targetShiftText})`;
      }

      return '未知類型';
    } catch (error) {
      console.error('Error rendering request details:', error, request);
      return '資料格式錯誤';
    }
  }

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        換班/代班申請審核
      </Typography>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>申請人</TableCell>
                <TableCell>類型</TableCell>
                <TableCell>詳細內容</TableCell>
                <TableCell>申請時間</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    目前沒有待處理的申請
                  </TableCell>
                </TableRow>
              ) : (
                requests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell>{employees[request.requesterId]?.name || '未知'}</TableCell>
                    <TableCell>{request.type === 'swap' ? '換班' : '代班'}</TableCell>
                    <TableCell>{renderRequestDetails(request)}</TableCell>
                    <TableCell>
                      {request.createdAt && request.createdAt.toDate 
                        ? format(request.createdAt.toDate(), 'yyyy/MM/dd HH:mm')
                        : '未知時間'
                      }
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={statusMap[request.status]?.label || '未知'}
                        color={statusMap[request.status]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="contained" color="success" onClick={() => handleApprove(request.id)} sx={{ mr: 1 }}>批准</Button>
                      <Button size="small" variant="contained" color="error" onClick={() => handleReject(request.id)}>拒絕</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ShiftChangeManagementPage;
