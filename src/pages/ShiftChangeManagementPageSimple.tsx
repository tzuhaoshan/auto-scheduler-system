import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Container,
} from '@mui/material';
import { format } from 'date-fns';
import { getPendingAdminRequests, approveAndProcessShiftChange, updateShiftChangeRequestStatus } from '../services/shiftChangeService';
import { employeeService } from '../services/employeeService';
import type { ShiftChangeRequest, ShiftChangeStatus } from '../models/shiftChange';
import type { Employee } from '../models/employee';

// 狀態映射
const statusMap: Record<ShiftChangeStatus, { label: string; color: any }> = {
  pending: { label: '待處理', color: 'warning' },
  approved_by_user: { label: '待管理員批准', color: 'info' },
  approved_by_admin: { label: '已批准', color: 'success' },
  rejected: { label: '已拒絕', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
};

// 班別顯示名稱
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

const ShiftChangeManagementPageSimple = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<ShiftChangeRequest[]>([]);
  const [employees, setEmployees] = useState<Record<string, Employee>>({});

  // 安全的日期格式化
  const formatDate = (timestamp: any): string => {
    try {
      if (!timestamp) return '未知時間';
      if (timestamp.toDate) {
        return format(timestamp.toDate(), 'yyyy/MM/dd HH:mm');
      }
      if (timestamp instanceof Date) {
        return format(timestamp, 'yyyy/MM/dd HH:mm');
      }
      return '無效日期';
    } catch (error) {
      console.error('Date formatting error:', error, timestamp);
      return '日期錯誤';
    }
  };

  // 渲染申請詳情
  const renderRequestDetails = (request: ShiftChangeRequest): string => {
    try {
      console.log('=== Rendering details for request ===');
      console.log('Request ID:', request.id);
      console.log('Request type:', request.type);
      console.log('Original date:', request.originalDate, typeof request.originalDate);
      console.log('Original shift:', request.originalShift);
      console.log('Target coverer ID:', request.targetCovererId);
      console.log('Target swapper ID:', request.targetSwapperId);
      console.log('Target swap date:', request.targetSwapDate);
      console.log('Target swap shift:', request.targetSwapShift);
      console.log('=====================================');
      
      // 安全處理原始班次資訊
      let originalShiftText = '';
      try {
        if (request.originalDate) {
          console.log('Attempting to parse originalDate:', request.originalDate);
          console.log('Original date type:', typeof request.originalDate);
          
          let dateObj;
          
          // 處理 Firestore Timestamp
          if (request.originalDate && typeof request.originalDate === 'object' && (request.originalDate as any).toDate) {
            console.log('Detected Firestore Timestamp');
            dateObj = (request.originalDate as any).toDate();
          }
          // 處理字串格式
          else if (typeof request.originalDate === 'string') {
            console.log('Detected string date');
            if (request.originalDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dateObj = new Date(request.originalDate + 'T00:00:00');
            } else {
              dateObj = new Date(request.originalDate);
            }
          }
          // 處理其他格式
          else {
            console.log('Detected other date format');
            dateObj = new Date(request.originalDate);
          }
          
          console.log('Parsed date object:', dateObj);
          
          if (!dateObj || isNaN(dateObj.getTime())) {
            throw new Error('Invalid date');
          }
          
          originalShiftText = `${format(dateObj, 'MM/dd')} ${getShiftDisplayName(request.originalShift)}`;
          console.log('Successfully formatted originalShiftText:', originalShiftText);
        } else {
          originalShiftText = `未知日期 ${getShiftDisplayName(request.originalShift)}`;
        }
      } catch (dateError) {
        console.error('Date parsing error for originalDate:', dateError);
        console.error('Original date value:', request.originalDate);
        console.error('Original date type:', typeof request.originalDate);
        
        // 降級處理：嘗試直接顯示字串格式的日期
        if (typeof request.originalDate === 'string' && request.originalDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const parts = request.originalDate.split('-');
          originalShiftText = `${parts[1]}/${parts[2]} ${getShiftDisplayName(request.originalShift)}`;
        } else {
          originalShiftText = `日期解析失敗 ${getShiftDisplayName(request.originalShift)}`;
        }
      }

      if (request.type === 'cover') {
        const covererName = employees[request.targetCovererId || '']?.name || 'N/A';
        const result = `申請 ${covererName} 代班 ${originalShiftText}`;
        console.log('Cover result:', result);
        return result;
      }

      if (request.type === 'swap') {
        const swapperName = employees[request.targetSwapperId || '']?.name || 'N/A';
        
        let targetShiftText = 'N/A';
        try {
          if (request.targetSwapDate) {
            const targetDateObj = new Date(request.targetSwapDate);
            targetShiftText = `${format(targetDateObj, 'MM/dd')} ${getShiftDisplayName(request.targetSwapShift || '')}`;
          }
        } catch (targetDateError) {
          console.error('Date parsing error for targetSwapDate:', targetDateError);
          targetShiftText = '目標日期錯誤';
        }
        
        const result = `申請與 ${swapperName} 交換班次 (${originalShiftText} <=> ${targetShiftText})`;
        console.log('Swap result:', result);
        return result;
      }

      return '未知類型';
    } catch (error) {
      console.error('Error rendering request details:', error);
      console.error('Request object:', request);
      return `資料格式錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Step 1: Starting to fetch data...');
        setIsLoading(true);
        setError(null);
        
        console.log('Step 2: Fetching requests and employees...');
        const [pendingRequests, allEmployees] = await Promise.all([
          getPendingAdminRequests(),
          employeeService.getEmployees()
        ]);

        console.log('Step 3: Processing data...', {
          requestsCount: pendingRequests.length,
          employeesCount: allEmployees.length
        });

        const employeeMap = allEmployees.reduce((acc, emp) => {
          acc[emp.id] = emp;
          return acc;
        }, {} as Record<string, Employee>);

        setRequests(pendingRequests);
        setEmployees(employeeMap);
        
        console.log('Step 4: Data set successfully');
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(`載入失敗：${err instanceof Error ? err.message : '未知錯誤'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 處理批准申請
  const handleApprove = async (requestId: string) => {
    const adminId = 'temp_admin_id'; // 在實際應用中，這應該從認證上下文獲取
    try {
      console.log('Approving request:', requestId);
      await approveAndProcessShiftChange(requestId, adminId);
      
      // 從列表中移除已處理的申請
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      console.log('Request approved successfully');
    } catch (err) {
      console.error('Approval failed:', err);
      setError(`批准操作失敗：${err instanceof Error ? err.message : '未知錯誤'}`);
    }
  };

  // 處理拒絕申請
  const handleReject = async (requestId: string) => {
    const reason = '管理者拒絕'; // 在實際應用中，這應該通過對話框輸入
    try {
      console.log('Rejecting request:', requestId);
      await updateShiftChangeRequestStatus(requestId, 'rejected', undefined, reason);
      
      // 從列表中移除已處理的申請
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      console.log('Request rejected successfully');
    } catch (err) {
      console.error('Rejection failed:', err);
      setError(`拒絕操作失敗：${err instanceof Error ? err.message : '未知錯誤'}`);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        換班/代班申請審核
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        找到 {requests.length} 筆申請記錄，{Object.keys(employees).length} 位員工
      </Typography>
      
      <Paper sx={{ p: 3 }}>
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
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={statusMap[request.status]?.label || '未知'}
                        color={statusMap[request.status]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success" 
                        onClick={() => handleApprove(request.id)} 
                        sx={{ mr: 1 }}
                      >
                        批准
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="error" 
                        onClick={() => handleReject(request.id)}
                      >
                        拒絕
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default ShiftChangeManagementPageSimple;
