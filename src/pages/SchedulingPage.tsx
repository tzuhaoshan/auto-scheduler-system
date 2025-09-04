import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from '@mui/material';
import { format, addDays, subMonths } from 'date-fns';
// useAuth 暫時未使用，未來可根據需求添加
import type { DailySchedule } from '../models/schedule';
import type { Employee } from '../models/employee';
import type { Holiday } from '../models/holiday';
import StatsDisplay from '../components/StatsDisplay';
import { employeeService } from '../services/employeeService';
import { holidayService } from '../services/holidayService';
import { leaveService } from '../services/leaveService';
import { scheduleService } from '../services/scheduleService';
import { schedulingService } from '../services/schedulingService';

const SchedulingPage = () => {
  // 暫時不需要 userProfile，未來可根據需求添加
  
  // --- 排班設定相關 State ---
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [schedules, setSchedules] = useState<DailySchedule[]>([]); // 預覽的班表
  
  const [error, setError] = useState<string | null>(null);
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
        setError('載入資料失敗');
      }
    };
    loadData();
  }, []);

  // 定義固定的班別順序
  const SHIFT_ORDER: string[] = ['noon', 'phone', 'morning', 'afternoon', 'verify'];

  const handleRunScheduling = async () => {
    if (!startDate || !endDate) {
      setError('請選擇開始和結束日期');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('開始日期不能晚於結束日期');
      return;
    }

    setIsRunning(true);
    setError(null);
    setSchedules([]);

    try {
      // 在排班前，先讀取相關日期範圍的既有班表，以利個人限制判斷
      const scheduleStartDate = new Date(startDate);
      const scheduleEndDate = new Date(endDate);
      const historyStartDate = subMonths(scheduleStartDate, 1); // 往前讀取一個月作為參考
      
      const [leaves, existingSchedules] = await Promise.all([
        leaveService.getLeaves(),
        scheduleService.getSchedules(historyStartDate, scheduleEndDate)
      ]);
      
      const approvedLeaves = leaves.filter(l => l.status === 'approved');
      
      // 注意：這裡的 `stats` 暫時傳入空值
      // 未來可以從資料庫讀取歷史統計資料
      schedulingService.loadData(employees, holidays, approvedLeaves, existingSchedules);
      
      // 執行排班演算法
      const results = schedulingService.runScheduling(
        new Date(startDate),
        new Date(endDate)
      );
      
      setSchedules(results);
      console.log('排班完成:', results);
    } catch (err) {
      console.error('排班失敗:', err);
      setError('排班演算法執行失敗');
    } finally {
      setIsRunning(false);
    }
  };

  // 新增儲存班表的處理函數
  const handleSaveSchedules = async () => {
    if (schedules.length === 0) {
      setError('沒有可儲存的班表。');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await scheduleService.saveSchedules(schedules);
      
      // 儲存成功後，立即更新員工的歷史統計資料
      await employeeService.updateHistoricalStats(schedules, employees);
      
      // 可以在這裡加入一個成功的提示，例如 Snackbar
      alert('班表已成功儲存，並已更新統計資料！'); 
    } catch (err) {
      console.error('儲存或更新統計失敗:', err);
      setError('儲存班表或更新統計時發生錯誤');
    } finally {
      setIsSaving(false);
    }
  };

  // 獲取員工姓名
  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : '未知員工';
  };

  // 獲取班別顯示名稱
  const getShiftDisplayName = (shift: string): string => {
    const shiftNames: Record<string, string> = {
      'noon': '諮詢台值午',
      'phone': '諮詢電話',
      'morning': '上午支援',
      'afternoon': '下午支援'
    };
    return shiftNames[shift] || shift;
  };

  // 獲取班別顏色
  const getShiftColor = (shift: string): string => {
    const colors: Record<string, string> = {
      'noon': '#FF6B6B',
      'phone': '#4ECDC4',
      'morning': '#45B7D1',
      'afternoon': '#96CEB4'
    };
    return colors[shift] || '#95A5A6';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        排班設定
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        設定排班日期範圍並執行自動排班演算法，生成班表後可以預覽和儲存
      </Typography>

      {/* 排班設定區塊 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          排班設定
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          設定排班日期範圍並執行自動排班演算法
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="開始日期"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="結束日期"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button 
            variant="contained" 
            onClick={handleRunScheduling}
            disabled={isRunning}
            sx={{ minWidth: 120 }}
          >
            {isRunning ? <CircularProgress size={20} /> : '執行排班'}
          </Button>
          
          {/* 新增儲存按鈕 */}
          {schedules.length > 0 && (
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSaveSchedules}
              disabled={isSaving}
              sx={{ minWidth: 120 }}
            >
              {isSaving ? <CircularProgress size={20} /> : '儲存班表'}
            </Button>
          )}
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* 排班結果 (預覽) */}
      {schedules.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            排班結果 ({schedules.length} 天)
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
            {schedules.map((schedule) => (
              <Card key={schedule.date}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {format(new Date(schedule.date), 'MM/dd (E)')}
                  </Typography>
                  
                  {SHIFT_ORDER.map((shift) => {
                    const assignment = schedule.shifts[shift as keyof typeof schedule.shifts];
                    return assignment && (
                      <Box key={shift} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    );
                  })}
                  
                  {Object.keys(schedule.shifts).length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      無排班
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* 統計資訊 */}
      {schedules.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            統計資訊
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 2 }}>
            <StatsDisplay 
              title="當次排班統計"
              stats={schedulingService.getCurrentStats()}
              employees={employees}
            />
            <StatsDisplay 
              title="長期統計（更新前）"
              stats={schedulingService.getHistoricalStats()}
              employees={employees}
            />
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default SchedulingPage;
