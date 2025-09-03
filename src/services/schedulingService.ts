import { format, isWithinInterval, startOfDay, isWeekend, differenceInDays, subDays } from 'date-fns';
import type { Employee } from '../models/employee';
import type { Holiday } from '../models/holiday';
import type { DailySchedule, ShiftAssignment } from '../models/schedule';
import type { Shift } from '../models/shift';

// --- 模組內變數 ---
let allEmployees: Employee[] = [];
let allHolidays: Holiday[] = [];
let leaveRecords: { employeeId: string, start: Date, end: Date }[] = [];
let existingSchedules: DailySchedule[] = [];
let currentSchedulingStats: Record<string, Record<string, number>> = {};
let historicalStats: Record<string, Record<string, number>> = {};

// --- 核心輔助函數 ---

// 檢查員工在特定日期是否請假（舊版本，僅用於向後兼容）
const isOnLeave = (employeeId: string, date: Date): boolean => {
  const targetDay = startOfDay(date);
  return leaveRecords.some(record => 
    record.employeeId === employeeId &&
    isWithinInterval(targetDay, { start: startOfDay(record.start), end: startOfDay(record.end) })
  );
};

// 檢查員工在特定班別是否與請假時間重疊
const isOnLeaveForShift = (employeeId: string, date: Date, shift: Shift): boolean => {
  const targetDay = startOfDay(date);
  
  return leaveRecords.some(record => {
    if (record.employeeId !== employeeId) return false;
    
    // 檢查日期是否重疊
    const leaveStart = startOfDay(record.start);
    const leaveEnd = startOfDay(record.end);
    
    if (!isWithinInterval(targetDay, { start: leaveStart, end: leaveEnd })) {
      return false;
    }
    
    // 如果日期重疊，檢查時間是否重疊
    const shiftTimeRanges = {
      'noon': { start: '12:30', end: '13:30' },
      'phone': { start: '09:00', end: '18:00' },
      'morning': { start: '09:00', end: '12:30' },
      'afternoon': { start: '13:30', end: '18:00' }
    };
    
    const shiftRange = shiftTimeRanges[shift];
    if (!shiftRange) return false;
    
    // 將時間轉換為分鐘數以便比較
    const shiftStartMinutes = parseInt(shiftRange.start.split(':')[0]) * 60 + parseInt(shiftRange.start.split(':')[1]);
    const shiftEndMinutes = parseInt(shiftRange.end.split(':')[0]) * 60 + parseInt(shiftRange.end.split(':')[1]);
    
    // 從請假記錄中提取時間部分
    const leaveStartTime = record.start;
    const leaveEndTime = record.end;
    
    // 如果請假記錄包含時間信息，檢查時間重疊
    if (leaveStartTime.getHours() !== 0 || leaveStartTime.getMinutes() !== 0 || 
        leaveEndTime.getHours() !== 23 || leaveEndTime.getMinutes() !== 59) {
      
      const leaveStartMinutes = leaveStartTime.getHours() * 60 + leaveStartTime.getMinutes();
      const leaveEndMinutes = leaveEndTime.getHours() * 60 + leaveEndTime.getMinutes();
      
      // 檢查時間重疊
      return !(shiftEndMinutes <= leaveStartMinutes || shiftStartMinutes >= leaveEndMinutes);
    }
    
    // 如果請假記錄是整天，則影響所有班別
    return true;
  });
};

const isAlreadyScheduled = (employeeId: string, date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const scheduleForDay = existingSchedules.find(s => s.date === dateStr);
    if (!scheduleForDay) return false;
    return Object.values(scheduleForDay.shifts).some(assignment => (assignment as ShiftAssignment).employeeId === employeeId);
};

const isExcludedDate = (date: Date): boolean => {
  if (isWeekend(date)) return true;
  
  const dateStr = format(date, 'yyyy-MM-dd');
  const holiday = allHolidays.find(h => h.date === dateStr);
  return holiday ? holiday.excludeFromScheduling : false;
};

const checkPersonalConstraints = (employee: Employee, shift: Shift, date: Date, currentSchedule: DailySchedule[]): boolean => {
  // 1. 全域限制檢查
  if (employee.constraints.unavailableDates.includes(format(date, 'yyyy-MM-dd'))) {
    return false;
  }

  // 2. 獲取該班別的專屬限制
  const shiftConstraints = employee.constraints.byShift?.[shift];

  // 3. 如果該員工有此角色，但沒有設定專屬限制，則套用預設限制
  if (!shiftConstraints) {
    // 套用預設限制：週一到週五可排班，最小間隔1天，最大連續1天
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); 
    if (dayOfWeek < 1 || dayOfWeek > 5) {
      return false; // 週末不可排班
    }
    
    const schedulesToCheck = [...existingSchedules, ...currentSchedule];
    
    // 檢查最小間隔 (預設1天)
    const lastShiftDate = findLastShiftDate(employee.id, shift, schedulesToCheck);
    if (lastShiftDate && differenceInDays(date, lastShiftDate) < 1) {
      return false;
    }
    
    // 檢查最大連續天數 (預設1天)
    const consecutiveDays = countConsecutiveDays(employee.id, shift, date, schedulesToCheck);
    if (consecutiveDays >= 1) {
      return false;
    }
    
    return true;
  }

  // 4. 班別專屬限制檢查
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); 
  if (!shiftConstraints.availableDays.includes(dayOfWeek)) {
    return false;
  }
  
  const schedulesToCheck = [...existingSchedules, ...currentSchedule];

  // 檢查最小間隔 (需要知道上一次是哪個班別)
  const lastShiftDate = findLastShiftDate(employee.id, shift, schedulesToCheck);
  if (lastShiftDate && differenceInDays(date, lastShiftDate) < shiftConstraints.minInterval) {
    return false;
  }
  
  // 檢查最大連續天數
  const consecutiveDays = countConsecutiveDays(employee.id, shift, date, schedulesToCheck);
  if (consecutiveDays >= shiftConstraints.maxConsecutiveDays) {
    return false;
  }

  // 可以在此處加入 maxWeeklyShifts 的檢查，但這會更複雜，需要知道是當週的第幾天，暫時簡化
  
  return true;
};

const findLastShiftDate = (employeeId: string, shift: Shift, schedules: DailySchedule[]): Date | null => {
  const employeeSchedules = schedules
    .filter(s => s.shifts[shift]?.employeeId === employeeId)
    .map(s => new Date(s.date))
    .sort((a, b) => b.getTime() - a.getTime());
  return employeeSchedules[0] || null;
};

const countConsecutiveDays = (employeeId: string, shift: Shift, date: Date, schedules: DailySchedule[]): number => {
  let consecutiveCount = 0;
  let currentDate = subDays(date, 1);
  
  while (true) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const schedule = schedules.find(s => s.date === dateStr);
    if (schedule && schedule.shifts[shift]?.employeeId === employeeId) {
      consecutiveCount++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }
  return consecutiveCount + 1; // +1 for the current day being checked
};


const selectBestCandidate = (candidates: Employee[], shift: Shift, date: Date): Employee | null => {
  if (candidates.length === 0) return null;
  
  candidates.forEach(emp => {
    currentSchedulingStats[emp.id] = currentSchedulingStats[emp.id] || { morning: 0, noon: 0, afternoon: 0, phone: 0 };
    historicalStats[emp.id] = historicalStats[emp.id] || { morning: 0, noon: 0, afternoon: 0, phone: 0 };
  });
  
  candidates.sort((a, b) => {
    const aCurrent = currentSchedulingStats[a.id][shift] || 0;
    const bCurrent = currentSchedulingStats[b.id][shift] || 0;
    if (aCurrent !== bCurrent) return aCurrent - bCurrent;

    const aHistorical = historicalStats[a.id][shift] || 0;
    const bHistorical = historicalStats[b.id][shift] || 0;
    if (aHistorical !== bHistorical) return aHistorical - bHistorical;
    
    const seed = generateSeed(date, shift);
    return simpleHash(`${a.id}-${seed}`) - simpleHash(`${b.id}-${seed}`);
  });
  
  return candidates[0];
};

const generateSeed = (date: Date, shift: Shift): string => {
  return `${format(date, 'yyyy-MM-dd')}-${shift}`;
};

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const updateStats = (employeeId: string, shift: Shift): void => {
  currentSchedulingStats[employeeId][shift]++;
  historicalStats[employeeId][shift]++;
};

// --- 公開服務 ---
export const schedulingService = {
  loadData(employees: Employee[], holidays: Holiday[], leaves: any[], schedules: DailySchedule[]) {
    allEmployees = employees;
    allHolidays = holidays;
    leaveRecords = leaves.map(l => ({ ...l, start: l.startTime, end: l.endTime }));
    existingSchedules = schedules.map(s => ({...s, date: format(s.date, 'yyyy-MM-dd')}));
    
    // 從員工資料中直接建立長期統計資料
    historicalStats = {};
    allEmployees.forEach(emp => {
      historicalStats[emp.id] = {
        morning: emp.historicalStats?.morning || 0,
        noon: emp.historicalStats?.noon || 0,
        afternoon: emp.historicalStats?.afternoon || 0,
        phone: emp.historicalStats?.phone || 0,
      };
    });
    
    currentSchedulingStats = {}; // 重置當次排班統計
  },

  getCandidates(shift: Shift, date: Date, currentSchedule: DailySchedule[]): Employee[] {
    if (isExcludedDate(date)) return [];

    const candidates = allEmployees.filter(emp => {
      const hasRole = emp.roles[shift];
      const isActive = emp.isActive;
      const notOnLeave = !isOnLeaveForShift(emp.id, date, shift);
      const notScheduled = !isAlreadyScheduled(emp.id, date);
      // 傳入 shift 參數
      const meetsConstraints = checkPersonalConstraints(emp, shift, date, currentSchedule);
      
      // 添加調試日誌
      if (emp.name === '測試員工' || emp.name === '測試員工2') {
        console.log(`員工 ${emp.name} 班別 ${shift} 檢查:`, {
          hasRole,
          isActive,
          notOnLeave,
          notScheduled,
          meetsConstraints,
          onLeave: isOnLeaveForShift(emp.id, date, shift)
        });
      }
      
      return hasRole && isActive && notOnLeave && notScheduled && meetsConstraints;
    });

    console.log(`班別 ${shift} 於 ${format(date, 'yyyy-MM-dd')} 的候選人:`, candidates.map(c => c.name));
    return candidates;
  },

  runScheduling(startDate: Date, endDate: Date): DailySchedule[] {
    console.log('開始執行排班演算法:', format(startDate, 'yyyy-MM-dd'), '到', format(endDate, 'yyyy-MM-dd'));
    
    const results: DailySchedule[] = [];
    let current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = format(current, 'yyyy-MM-dd');
      
      if (isExcludedDate(current)) {
        console.log(`跳過日期 ${dateStr} - 假日或週末`);
        current = new Date(current.setDate(current.getDate() + 1));
        continue;
      }
      
      const dailySchedule: DailySchedule = { date: current.toISOString().split('T')[0], shifts: {} };
      const shifts = ['noon', 'phone', 'morning', 'afternoon'] as const;
      
      for (const shift of shifts) {
        let candidates = this.getCandidates(shift, current, results);

        // [BUG FIX] 
        // 增加一道過濾，排除當天已經被指派過班次的員工
        // 確保每人每天最多一班
        const assignedEmployeeIdsToday = Object.values(dailySchedule.shifts).map(a => (a as ShiftAssignment).employeeId);
        if (assignedEmployeeIdsToday.length > 0) {
          candidates = candidates.filter(c => !assignedEmployeeIdsToday.includes(c.id));
        }
        
        if (candidates.length === 0) continue;
        
        const bestCandidate = selectBestCandidate(candidates, shift, current);
        
        if (bestCandidate) {
          dailySchedule.shifts[shift] = {
            employeeId: bestCandidate.id,
            assignedAt: new Date(),
            isManual: false
          };
          updateStats(bestCandidate.id, shift);
          console.log(`班別 ${shift} 於 ${dateStr} 指派給: ${bestCandidate.name}`);
        }
      }
      
      results.push(dailySchedule);
      current.setDate(current.getDate() + 1);
    }
    
    console.log('排班演算法執行完成，共處理', results.length, '天');
    return results;
  },

  getCurrentStats: () => currentSchedulingStats,
  getHistoricalStats: () => historicalStats,
  resetCurrentStats: () => { currentSchedulingStats = {}; }
};
