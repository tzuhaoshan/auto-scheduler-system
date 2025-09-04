import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,

} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,

  Download as DownloadIcon,
  Upload as UploadIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { employeeService } from '../services/employeeService';
import type { Employee } from '../models/employee';
import type { Shift } from '../models/shift';
import { formatDate } from '../utils/dateUtils';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: Array<{ employeeId: string; stats: Record<Shift, number> }>) => void;
  employees: Employee[];
}

const ImportDialog: React.FC<ImportDialogProps> = ({ open, onClose, onImport, employees }) => {
  const [previewData, setPreviewData] = useState<Array<{ employeeId: string; name: string; stats: Record<Shift, number> }>>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        parseCSV(content);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const parseCSV = (content: string) => {
    setError(null);
    try {
      const lines = content.trim().split('\n');
      if (lines.length < 2) {
        setError('CSV 檔案格式不正確，需要包含標題行和至少一行資料');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const expectedHeaders = ['員工編號', '諮詢台值午', '諮詢電話', '上午支援', '下午支援'];
      
      if (!expectedHeaders.every(header => headers.includes(header))) {
        setError(`CSV 檔案缺少必要的欄位。需要包含：${expectedHeaders.join(', ')}`);
        return;
      }

      const employeeMap = new Map(employees.map(e => [e.employeeId, e]));
      const parsedData: Array<{ employeeId: string; name: string; stats: Record<Shift, number> }> = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowData: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '0';
        });

        const employeeId = rowData['員工編號'];
        const employee = employeeMap.get(employeeId);
        
        if (!employee) {
          setError(`找不到員工編號：${employeeId}`);
          return;
        }

        parsedData.push({
          employeeId: employee.id,
          name: employee.name,
          stats: {
                    noon: parseInt(rowData['諮詢台值午'], 10) || 0,
        phone: parseInt(rowData['諮詢電話'], 10) || 0,
        morning: parseInt(rowData['上午支援'], 10) || 0,
        afternoon: parseInt(rowData['下午支援'], 10) || 0,
        verify: parseInt(rowData['處方審核'], 10) || 0,
          }
        });
      }

      setPreviewData(parsedData);
    } catch (err) {
      setError('解析 CSV 檔案時發生錯誤');
    }
  };

  const handleImport = () => {
    if (previewData.length > 0) {
      onImport(previewData.map(item => ({
        employeeId: item.employeeId,
        stats: item.stats
      })));
      handleClose();
    }
  };

  const handleClose = () => {
    setPreviewData([]);
    setError(null);
    onClose();
  };

  const downloadTemplate = () => {
    const headers = ['員工編號', '員工姓名', '諮詢台值午', '諮詢電話', '上午支援', '下午支援'];
    const sampleData = employees.slice(0, 3).map(emp => [
      emp.employeeId,
      emp.name,
      '0', '0', '0', '0'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'statistics_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>批量匯入統計資料</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            上傳 CSV 檔案來批量設定員工的歷史統計資料
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              onClick={downloadTemplate}
              startIcon={<DownloadIcon />}
            >
              下載範本
            </Button>
            <Button
              variant="contained"
              component="label"
            >
              選擇檔案
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {previewData.length > 0 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                預覽資料 ({previewData.length} 筆)
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>員工姓名</TableCell>
                      <TableCell align="center">諮詢台值午</TableCell>
                      <TableCell align="center">諮詢電話</TableCell>
                      <TableCell align="center">上午支援</TableCell>
                      <TableCell align="center">下午支援</TableCell>
                      <TableCell align="center">處方審核</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.name}</TableCell>
                                      <TableCell align="center">{row.stats.noon}</TableCell>
              <TableCell align="center">{row.stats.phone}</TableCell>
              <TableCell align="center">{row.stats.morning}</TableCell>
              <TableCell align="center">{row.stats.afternoon}</TableCell>
              <TableCell align="center">{row.stats.verify}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>取消</Button>
        <Button 
          onClick={handleImport} 
          variant="contained"
          disabled={previewData.length === 0}
        >
          匯入 ({previewData.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const shifts: Shift[] = ['noon', 'phone', 'morning', 'afternoon', 'verify'];

const shiftDisplayNames: Record<Shift, string> = {
  noon: '諮詢台值午',
  phone: '諮詢電話',
  morning: '上午支援',
  afternoon: '下午支援',
  verify: '處方審核',
};

const shiftColors: Record<Shift, string> = {
  noon: '#FF6B6B',
  phone: '#4ECDC4',
  morning: '#45B7D1',
  afternoon: '#96CEB4',
  verify: '#FFA726',
};

interface EditStatsDialogProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSave: (employeeId: string, stats: Record<Shift, number>) => void;
}

const EditStatsDialog: React.FC<EditStatsDialogProps> = ({ open, onClose, employee, onSave }) => {
  const [stats, setStats] = useState<Record<Shift, number>>({
    noon: 0,
    phone: 0,
    morning: 0,
    afternoon: 0,
    verify: 0,
  });

  useEffect(() => {
    if (employee?.historicalStats) {
      setStats({
        noon: employee.historicalStats.noon || 0,
        phone: employee.historicalStats.phone || 0,
        morning: employee.historicalStats.morning || 0,
        afternoon: employee.historicalStats.afternoon || 0,
        verify: employee.historicalStats.verify || 0,
      });
    }
  }, [employee]);

  const handleSave = () => {
    if (employee) {
      onSave(employee.id, stats);
      onClose();
    }
  };

  const handleStatsChange = (shift: Shift, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setStats(prev => ({ ...prev, [shift]: Math.max(0, numValue) }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        編輯統計資訊 - {employee?.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            設定該員工的歷史排班統計起始值
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {shifts.map((shift) => (
              <TextField
                key={shift}
                label={shiftDisplayNames[shift]}
                type="number"
                value={stats[shift]}
                onChange={(e) => handleStatsChange(shift, e.target.value)}
                fullWidth
                inputProps={{ min: 0 }}
                InputLabelProps={{ shrink: true }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained">
          儲存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const StatsManagementPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const employeeList = await employeeService.getEmployees();
      setEmployees(employeeList);
    } catch (err) {
      console.error('載入員工資料失敗:', err);
      setError('載入員工資料時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStats = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditDialogOpen(true);
  };

  const handleSaveStats = async (employeeId: string, stats: Record<Shift, number>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 更新員工的歷史統計
      await employeeService.setHistoricalStats([{
        employeeId,
        historicalStats: {
          ...stats,
          lastUpdated: new Date(),
        }
      }]);
      
      setSuccess(`已更新 ${selectedEmployee?.name} 的統計資訊`);
      await loadEmployees(); // 重新載入資料
    } catch (err) {
      console.error('更新統計失敗:', err);
      setError('更新統計資訊時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllStats = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const resetData = employees.map(employee => ({
        employeeId: employee.id,
        historicalStats: {
          noon: 0,
          phone: 0,
          morning: 0,
          afternoon: 0,
          verify: 0,
          lastUpdated: new Date(),
        }
      }));
      
      await employeeService.setHistoricalStats(resetData);
      setSuccess('已重置所有員工的統計資訊');
      await loadEmployees();
      setResetDialogOpen(false);
    } catch (err) {
      console.error('重置統計失敗:', err);
      setError('重置統計資訊時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const exportStats = () => {
    const data = employees.map(employee => ({
      員工姓名: employee.name,
      員工編號: employee.employeeId,
      諮詢台值午: employee.historicalStats?.noon || 0,
      諮詢電話: employee.historicalStats?.phone || 0,
      上午支援: employee.historicalStats?.morning || 0,
      下午支援: employee.historicalStats?.afternoon || 0,
      處方審核: employee.historicalStats?.verify || 0,
      最後更新: formatDate(employee.historicalStats?.lastUpdated, { includeTime: true }),
    }));
    
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `員工統計資料_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkImport = async (data: Array<{ employeeId: string; stats: Record<Shift, number> }>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const statsData = data.map(item => ({
        employeeId: item.employeeId,
        historicalStats: {
          ...item.stats,
          lastUpdated: new Date(),
        }
      }));
      
      await employeeService.setHistoricalStats(statsData);
      setSuccess(`已成功匯入 ${data.length} 位員工的統計資料`);
      await loadEmployees();
    } catch (err) {
      console.error('批量匯入失敗:', err);
      setError('批量匯入統計資料時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const getTotalStats = () => {
    return employees.reduce((total, employee) => {
      const stats = employee.historicalStats || { noon: 0, phone: 0, morning: 0, afternoon: 0, verify: 0 };
      return {
        noon: total.noon + (stats.noon || 0),
        phone: total.phone + (stats.phone || 0),
        morning: total.morning + (stats.morning || 0),
        afternoon: total.afternoon + (stats.afternoon || 0),
        verify: total.verify + (stats.verify || 0),
      };
    }, { noon: 0, phone: 0, morning: 0, afternoon: 0, verify: 0 });
  };

  const totalStats = getTotalStats();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        統計資訊管理
      </Typography>

      {/* 操作區塊 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          統計管理操作
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadEmployees}
            disabled={loading}
          >
            重新載入
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportStats}
            disabled={loading || employees.length === 0}
          >
            匯出 CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialogOpen(true)}
            disabled={loading || employees.length === 0}
          >
            匯入 CSV
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<WarningIcon />}
            onClick={() => setResetDialogOpen(true)}
            disabled={loading}
          >
            重置所有統計
          </Button>
        </Box>
      </Paper>

      {/* 總覽卡片 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            全體統計總覽
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {shifts.map((shift) => (
              <Chip
                key={shift}
                label={`${shiftDisplayNames[shift]}: ${totalStats[shift]}`}
                sx={{
                  backgroundColor: shiftColors[shift],
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* 錯誤和成功訊息 */}
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

      {/* 員工統計表格 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          員工統計明細
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>員工姓名</TableCell>
                <TableCell>員工編號</TableCell>
                {shifts.map((shift) => (
                  <TableCell key={shift} align="center">
                    {shiftDisplayNames[shift]}
                  </TableCell>
                ))}
                <TableCell>最後更新</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.employeeId}</TableCell>
                  {shifts.map((shift) => (
                    <TableCell key={shift} align="center">
                      <Chip
                        label={employee.historicalStats?.[shift] || 0}
                        size="small"
                        sx={{
                          backgroundColor: shiftColors[shift],
                          color: 'white',
                          fontWeight: 'bold',
                          minWidth: 40,
                        }}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    {formatDate(employee.historicalStats?.lastUpdated)}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="編輯統計">
                      <IconButton
                        onClick={() => handleEditStats(employee)}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 編輯統計對話框 */}
      <EditStatsDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        employee={selectedEmployee}
        onSave={handleSaveStats}
      />

      {/* 重置確認對話框 */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            確認重置統計資訊
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            此操作將會重置所有員工的歷史統計資訊為 0，此操作無法復原。
          </Typography>
          <Typography color="error" sx={{ mt: 1 }}>
            請確認您真的要執行此操作？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>取消</Button>
          <Button 
            onClick={handleResetAllStats} 
            color="warning" 
            variant="contained"
            disabled={loading}
          >
            確認重置
          </Button>
        </DialogActions>
      </Dialog>

      {/* 匯入對話框 */}
      <ImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleBulkImport}
        employees={employees}
      />
    </Container>
  );
};

export default StatsManagementPage;
