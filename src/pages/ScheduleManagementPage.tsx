import { Box, Button, Container, Typography, Paper, TextField, Alert, CircularProgress, Card, CardContent, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { schedulingService } from '../services/schedulingService';
import { scheduleService } from '../services/scheduleService'; // 匯入 scheduleService
import { employeeService } from '../services/employeeService';
import { holidayService } from '../services/holidayService';
import { leaveService } from '../services/leaveService';
import type { DailySchedule, ShiftAssignment } from '../models/schedule';
import type { Employee } from '../models/employee';
import type { Holiday } from '../models/holiday';
import type { Shift } from '../models/shift';
import StatsDisplay from '../components/StatsDisplay'; // 匯入新的統計元件
import ScheduleEditDialog from '../components/ScheduleEditDialog';
import ShiftChangeRequestDialog from '../components/ShiftChangeRequestDialog';
import ScheduleCalendar from '../components/ScheduleCalendar';

const ScheduleManagementPage = () => {
  const { userProfile } = useAuth();
  
  // 排班設定功能已移至 SchedulingPage，此處僅保留查詢功能
  
  // --- 班表查詢相關 State ---
  const [queryStartDate, setQueryStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [queryEndDate, setQueryEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [queryEmployeeId, setQueryEmployeeId] = useState<string>(''); // 新增：查詢特定員工
  const [isQuerying, setIsQuerying] = useState(false);
  const [queriedSchedules, setQueriedSchedules] = useState<DailySchedule[]>([]); // 查詢到的已存班表
  const [queryError, setQueryError] = useState<string | null>(null);

  // --- 手動調整 State ---
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DailySchedule | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const [isShiftChangeDialogOpen, setIsShiftChangeDialogOpen] = useState(false);

  // --- 刪除確認 State ---
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 統計查詢相關 State ---（整合到班表查詢中）
  const [queriedStats, setQueriedStats] = useState<Record<string, Record<string, number>>>({});
  
  // --- 日曆顯示相關 State ---
  const [showCalendar, setShowCalendar] = useState(false);

  // error state 已移除，因為不再需要排班設定功能
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // 載入員工和假日資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesData, holidaysData] = await Promise.all([
          employeeService.getEmployees(),
          holidayService.getHolidays()
        ]);
        setEmployees(employeesData);
        setHolidays(holidaysData);
      } catch (err) {
        console.error('載入資料失敗:', err);
        // 錯誤處理已簡化，因為不再需要排班設定功能
      }
    };
    loadData();
  }, []);

  // 排班設定相關函數已移至 SchedulingPage

  // 新增查詢班表的處理函數
  const handleQuerySchedules = async () => {
    if (!queryStartDate || !queryEndDate) {
      setQueryError('請選擇查詢的開始和結束日期');
      return;
    }
    if (new Date(queryStartDate) > new Date(queryEndDate)) {
      setQueryError('開始日期不能晚於結束日期');
      return;
    }

    setIsQuerying(true);
    setQueryError(null);
    setQueriedSchedules([]);

    try {
      // 同時查詢班表和統計資訊
      const [scheduleResults, statsResults] = await Promise.all([
        scheduleService.getSchedules(
          new Date(queryStartDate),
          new Date(queryEndDate)
        ),
        scheduleService.calculateStatsForPeriod(
          new Date(queryStartDate),
          new Date(queryEndDate)
        )
      ]);
      
      // 如果指定了員工，則篩選該員工的班表
      let filteredSchedules = scheduleResults;
      if (queryEmployeeId) {
        filteredSchedules = scheduleResults.filter(schedule => {
          return Object.values(schedule.shifts).some(shift => 
            shift && shift.employeeId === queryEmployeeId
          );
        });
      }
      
      setQueriedSchedules(filteredSchedules);
      setQueriedStats(statsResults);
      
      if (filteredSchedules.length === 0) {
        if (queryEmployeeId) {
          setQueryError(`該時間區間內沒有找到員工 ${getEmployeeName(queryEmployeeId)} 的班表資料`);
        } else {
          setQueryError('該時間區間內沒有找到班表資料');
        }
      }
    } catch (err) {
      console.error('查詢班表失敗:', err);
      setQueryError('查詢班表時發生錯誤');
    } finally {
      setIsQuerying(false);
    }
  };

  const handleOpenEditDialog = (schedule: DailySchedule, shift: Shift) => {
    // 先設置編輯狀態，確保即使後續出錯，對話框也能正常打開
    setEditingSchedule(schedule);
    setEditingShift(shift);
    setIsEditDialogOpen(true);
    
    // 非同步載入資料，但不阻擋對話框打開
    (async () => {
      try {
        // 為了讓 getCandidates 能正確運作，必須先為 schedulingService 載入上下文資料
        const leaves = await leaveService.getLeaves();
        const approvedLeaves = leaves.filter(l => l.status === 'approved');
        // 使用 queriedSchedules 作為上下文，確保個人限制判斷的連續性
        schedulingService.loadData(employees, holidays, approvedLeaves, queriedSchedules);
      } catch (e) {
        console.error("準備編輯對話框資料失敗:", e);
        // 不設置錯誤狀態，讓對話框仍能顯示，ScheduleEditDialog 內部會處理候選人的備用方案
      }
    })();
  };

  const handleOpenShiftChangeDialog = (schedule: DailySchedule, shift: Shift) => {
    setEditingSchedule(schedule);
    setEditingShift(shift);
    setIsShiftChangeDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingSchedule(null);
    setEditingShift(null);
  };

  const handleSaveChanges = async (newEmployeeId: string) => {
    if (!editingSchedule || !editingShift) return;

    const originalEmployeeId = editingSchedule.shifts[editingShift]?.employeeId;

    // 如果員工沒有變更，則直接關閉
    if (newEmployeeId === originalEmployeeId) {
      handleCloseEditDialog();
      return;
    }

    try {
      // 1. 更新班表文件
      await scheduleService.updateSingleShiftAssignment(new Date(editingSchedule.date), editingShift, newEmployeeId);
      
      // 2. 同步更新新舊員工的長期統計 (如果原先有人的話)
      await employeeService.adjustHistoricalStats(originalEmployeeId || null, newEmployeeId, editingShift);
      
      // 3. 刷新查詢結果以顯示變更
      await handleQuerySchedules();

    } catch (error) {
      setQueryError("更新班次時發生錯誤，請檢查主控台。");
      console.error("更新失敗:", error);
    } finally {
      handleCloseEditDialog();
    }
  };

  const handleDeleteSchedules = async () => {
    setIsDeleting(true);
    try {
      const schedulesToDelete = await scheduleService.getSchedules(new Date(queryStartDate), new Date(queryEndDate));
      
      if (schedulesToDelete.length > 0) {
        // 1. 刪除班表文件
        await scheduleService.deleteSchedules(new Date(queryStartDate), new Date(queryEndDate));
        
        // 2. 同步更新統計資料，將被刪除的班次從員工的 historicalStats 中扣除
        await employeeService.revertHistoricalStats(schedulesToDelete);
      }
      
      // 刪除成功後，關閉對話框並清空查詢結果
      setIsDeleteDialogOpen(false);
      setQueriedSchedules([]);
      alert('班表已成功刪除，統計資料已同步更新。');
    } catch (error) {
      console.error('刪除班表失敗:', error);
      setQueryError('刪除班表時發生錯誤');
    } finally {
      setIsDeleting(false);
    }
  };

  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : '未知員工';
  };

  // 定義固定的班別順序
  const SHIFT_ORDER: string[] = ['noon', 'phone', 'morning', 'afternoon', 'verify1', 'verify2'];

  const getShiftDisplayName = (shift: string): string => {
    const shiftNames: Record<string, string> = {
      'noon': '諮詢台值午',
      'phone': '諮詢電話',
      'morning': '上午支援',
      'afternoon': '下午支援',
      'verify1': '處方審核(主)',
      'verify2': '處方審核(輔)'
    };
    return shiftNames[shift] || shift;
  };

  const getShiftColor = (shift: string): string => {
    const colors: Record<string, string> = {
      'noon': '#FF6B6B',
      'phone': '#4ECDC4',
      'morning': '#45B7D1',
      'afternoon': '#96CEB4',
      'verify1': '#FFA726',
      'verify2': '#26A69A'
    };
    return colors[shift] || '#95A5A6';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        {userProfile?.role === 'employee' ? '班表查詢' : '班表管理'}
      </Typography>
      
      {userProfile?.role === 'employee' && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          您可以查詢班表、查看統計資訊，以及申請換班或代班
        </Typography>
      )}

      {/* 排班設定功能已移至專門的排班設定頁面 */}

      {/* 新增：班表查詢區塊 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          查詢班表與統計
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          查詢指定時間區間的班表明細和統計資訊
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          flexWrap: 'wrap',
          flexDirection: { xs: 'column', sm: 'row' },
          '& > *': { width: { xs: '100%', sm: 'auto' } }
        }}>
          <TextField
            label="開始日期"
            type="date"
            value={queryStartDate}
            onChange={(e) => setQueryStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="結束日期"
            type="date"
            value={queryEndDate}
            onChange={(e) => setQueryEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="員工篩選"
            value={queryEmployeeId}
            onChange={(e) => setQueryEmployeeId(e.target.value)}
            sx={{ minWidth: 200 }}
            InputLabelProps={{ shrink: true }}
          >
            <MenuItem value="">
              <em>全部員工</em>
            </MenuItem>
            {employees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.name} ({employee.employeeId})
              </MenuItem>
            ))}
          </TextField>
          <Button 
            variant="contained" 
            onClick={handleQuerySchedules}
            disabled={isQuerying}
            sx={{ minWidth: 120 }}
          >
            {isQuerying ? <CircularProgress size={20} /> : '查詢班表'}
          </Button>
          
          {queryEmployeeId && (
            <Button
              variant="outlined"
              onClick={() => {
                setQueryEmployeeId('');
                // 如果已經有查詢結果，重新查詢以顯示全部結果
                if (queriedSchedules.length > 0) {
                  handleQuerySchedules();
                }
              }}
              sx={{ minWidth: 120 }}
            >
              清除篩選
            </Button>
          )}
          
          {/* 只有當查詢到結果時，且使用者有權限時，才顯示刪除按鈕 */}
          {queriedSchedules.length > 0 && (userProfile?.role === 'admin' || userProfile?.role === 'manager') && (
            <Button 
              variant="outlined" 
              color="error"
              onClick={() => setIsDeleteDialogOpen(true)}
              startIcon={<DeleteIcon />}
            >
              刪除此範圍班表
            </Button>
          )}

        </Box>
        {queryError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {queryError}
          </Alert>
        )}
      </Paper>



      {/* 查詢結果顯示區塊 */}
      {queriedSchedules.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
                      <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 0 },
              mb: 2 
            }}>
            <Typography variant="h6">
              查詢結果 ({format(new Date(queryStartDate), 'MM/dd')} - {format(new Date(queryEndDate), 'MM/dd')})
              {queryEmployeeId && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  - 員工：{getEmployeeName(queryEmployeeId)}
                </Typography>
              )}
            </Typography>
            
            {/* 日曆/列表切換按鈕 */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Button
                variant={!showCalendar ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setShowCalendar(false)}
              >
                列表檢視
              </Button>
              <Button
                variant={showCalendar ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setShowCalendar(true)}
              >
                日曆檢視
              </Button>
            </Box>
          </Box>
          
          {/* 整合統計資訊顯示 */}
          {Object.keys(queriedStats).length > 0 && (
            <Box sx={{ mb: 3 }}>
              <StatsDisplay 
                title={`統計資訊 (${format(new Date(queryStartDate), 'MM/dd')} - ${format(new Date(queryEndDate), 'MM/dd')})`}
                stats={queriedStats}
                employees={employees}
              />
            </Box>
          )}
          
          {/* 日曆檢視 */}
          {showCalendar && (
            <Box sx={{ mb: 3 }}>
              <ScheduleCalendar
                schedules={queriedSchedules}
                employees={employees}
                onDateClick={(date) => {
                  // 可以添加日期點擊處理邏輯
                  console.log('點擊日期:', date);
                }}
                onShiftClick={(date, shift, assignment) => {
                  // 可以添加班次點擊處理邏輯
                  console.log('點擊班次:', date, shift, assignment);
                }}
              />
            </Box>
          )}
          
          {/* 列表檢視 */}
          {!showCalendar && (
            <>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                班表明細
              </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
            {queriedSchedules.map((schedule) => (
              <Card key={schedule.date.toString()}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {format(new Date(schedule.date), 'MM/dd (E)')}
                  </Typography>
                  
                  {SHIFT_ORDER.map((shift) => {
                    const assignment = schedule.shifts[shift as keyof typeof schedule.shifts];
                    return assignment && (
                      <Box key={shift} sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={getShiftDisplayName(shift)}
                            size="small"
                            sx={{ 
                              backgroundColor: getShiftColor(shift),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                          <Typography variant="body2">
                            {getEmployeeName(assignment.employeeId)}
                          </Typography>
                        </Box>
                        {/* 編輯和換班按鈕 - 僅管理員和經理可見 */}
                        {(userProfile?.role === 'admin' || userProfile?.role === 'manager') && (
                          <>
                            <IconButton size="small" onClick={() => handleOpenEditDialog(schedule, shift as Shift)}>
                              <EditIcon fontSize="inherit" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleOpenShiftChangeDialog(schedule, shift as Shift)}>
                              <SwapHorizIcon fontSize="inherit" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    );
                  })}
                  
                  {Object.values(schedule.shifts).every(s => s === null) && (
                    <Typography variant="body2" color="text.secondary">
                      無排班
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
            </>
          )}
        </Paper>
      )}

      {/* 排班結果已移至 SchedulingPage */}

      <ScheduleEditDialog
        open={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        onSave={handleSaveChanges}
        schedule={editingSchedule}
        shiftToEdit={editingShift}
        allEmployees={employees}
      />

      {isShiftChangeDialogOpen && editingSchedule && editingShift && (
        <ShiftChangeRequestDialog 
          open={isShiftChangeDialogOpen}
          onClose={() => {
            setIsShiftChangeDialogOpen(false);
            setEditingSchedule(null);
            setEditingShift(null);
          }}
          scheduleDate={editingSchedule.date}
          shift={editingShift}
          assignment={editingSchedule.shifts[editingShift] as ShiftAssignment}
        />
      )}

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您確定要刪除從 {queryStartDate} 到 {queryEndDate} 的所有班表嗎？
            此操作無法復原，且會影響相關的統計數據。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={handleDeleteSchedules} color="error" disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={20} /> : '確認刪除'}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default ScheduleManagementPage;
