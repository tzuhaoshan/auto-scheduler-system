import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Card,
  CardContent,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { DailySchedule, ShiftAssignment } from '../models/schedule';
import type { Employee } from '../models/employee';

interface ScheduleCalendarProps {
  schedules: DailySchedule[];
  employees: Employee[];
  onDateClick?: (date: Date) => void;
  onShiftClick?: (date: Date, shift: string, assignment: ShiftAssignment | null) => void;
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  schedules,
  employees,
  onDateClick,
  onShiftClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 生成當前月份的日期陣列
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    // 為了讓日曆從週一開始，我們需要調整起始日期
    const startDate = new Date(start);
    const dayOfWeek = getDay(startDate);
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 週日 = 0, 週一 = 1
    
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    return eachDayOfInterval({ start: startDate, end });
  }, [currentMonth]);

  // 獲取指定日期的班表
  const getScheduleForDate = (date: Date): DailySchedule | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.find(schedule => schedule.date === dateStr);
  };

  // 獲取員工姓名
  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : '未知員工';
  };

  // 定義固定的班別順序
  const SHIFT_ORDER: string[] = ['noon', 'phone', 'morning', 'afternoon', 'verify'];

  // 獲取班別顯示名稱
  const getShiftDisplayName = (shift: string): string => {
    const shiftNames: Record<string, string> = {
      'noon': '諮詢台值午',
      'phone': '諮詢電話',
      'morning': '上午支援',
      'afternoon': '下午支援',
      'verify': '處方審核'
    };
    return shiftNames[shift] || shift;
  };

  // 獲取班別顏色
  const getShiftColor = (shift: string): string => {
    const colors: Record<string, string> = {
      'noon': '#FF6B6B',
      'phone': '#4ECDC4',
      'morning': '#45B7D1',
      'afternoon': '#96CEB4',
      'verify': '#9B59B6'
    };
    return colors[shift] || '#95A5A6';
  };

  // 切換月份
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // 處理日期點擊
  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  // 處理班次點擊
  const handleShiftClick = (date: Date, shift: string, assignment: ShiftAssignment | null) => {
    if (onShiftClick) {
      onShiftClick(date, shift, assignment);
    }
  };

  // 週標題
  const weekDays = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

  return (
    <Paper elevation={2} sx={{ p: isMobile ? 2 : 3 }}>
      {/* 日曆標題和導航 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant={isMobile ? "h6" : "h5"} component="h2" sx={{ fontWeight: 'medium' }}>
          {format(currentMonth, 'yyyy年 M月', { locale: zhTW })}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePreviousMonth} size={isMobile ? "small" : "medium"}>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton onClick={handleNextMonth} size={isMobile ? "small" : "medium"}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {/* 週標題 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
        {weekDays.map((day, index) => (
          <Box
            key={index}
            sx={{
              p: 1,
              textAlign: 'center',
              fontWeight: 'medium',
              color: 'text.secondary',
              backgroundColor: theme.palette.grey[50],
              borderBottom: `2px solid ${theme.palette.divider}`,
            }}
          >
            {day}
          </Box>
        ))}
      </Box>

      {/* 日曆網格 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {daysInMonth.map((date, index) => {
          const schedule = getScheduleForDate(date);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isCurrentDay = isToday(date);
          
          return (
            <Card
              key={index}
              variant="outlined"
              sx={{
                minHeight: isMobile ? 80 : 120,
                cursor: onDateClick ? 'pointer' : 'default',
                backgroundColor: isCurrentMonth ? 'background.paper' : theme.palette.grey[50],
                border: isCurrentDay ? `2px solid ${theme.palette.primary.main}` : undefined,
                '&:hover': onDateClick ? {
                  backgroundColor: theme.palette.action.hover,
                  boxShadow: theme.shadows[2],
                } : undefined,
              }}
              onClick={() => handleDateClick(date)}
            >
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                {/* 日期標題 */}
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: 'center',
                    fontWeight: isCurrentDay ? 'bold' : 'medium',
                    color: isCurrentDay ? 'primary.main' : 'text.primary',
                    mb: 1,
                  }}
                >
                  {format(date, 'd')}
                </Typography>

                                  {/* 班次顯示 */}
                  {schedule && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {SHIFT_ORDER.map((shift) => {
                        const assignment = schedule.shifts[shift as keyof typeof schedule.shifts];
                        return (
                          <Tooltip
                            key={shift}
                            title={`${getShiftDisplayName(shift)}: ${assignment ? getEmployeeName(assignment.employeeId) : '未排班'}`}
                            placement="top"
                          >
                            <Chip
                              label={assignment ? getEmployeeName(assignment.employeeId) : '-'}
                              size="small"
                              variant={assignment ? 'filled' : 'outlined'}
                              sx={{
                                backgroundColor: assignment ? getShiftColor(shift) : 'transparent',
                                color: assignment ? 'white' : 'text.secondary',
                                fontSize: isMobile ? '0.6rem' : '0.7rem',
                                height: isMobile ? 18 : 20,
                                cursor: onShiftClick ? 'pointer' : 'default',
                                '&:hover': onShiftClick ? {
                                  opacity: 0.8,
                                } : undefined,
                              }}
                                                          onClick={(e) => {
                              e.stopPropagation();
                              handleShiftClick(date, shift, assignment || null);
                            }}
                            />
                          </Tooltip>
                        );
                      })}
                    </Box>
                  )}

                {/* 無班表時的提示 */}
                {!schedule && isCurrentMonth && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    }}
                  >
                    無班表
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* 圖例說明 */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
          班別圖例：
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {SHIFT_ORDER.map((shift) => (
            <Box key={shift} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: getShiftColor(shift),
                  borderRadius: '50%',
                }}
              />
              <Typography variant="caption">
                {getShiftDisplayName(shift)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default ScheduleCalendar;
