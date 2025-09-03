import type { Shift } from './shift';

/**
 * 單一班次的指派資訊
 */
export interface ShiftAssignment {
  employeeId: string;
  assignedAt: Date;
  isManual: boolean; // 是否為手動指派
}

/**
 * 每日的班表結構
 */
export interface DailySchedule {
  date: string; // YYYY-MM-DD
  shifts: Partial<Record<Shift, ShiftAssignment>>;
}

/**
 * 排班演算法的統計資料結構
 */
export interface SchedulingStats {
  employeeId: string;
  historicalStats: Record<Shift, number>;
  lastUpdated: Date;
}
