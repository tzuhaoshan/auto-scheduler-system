import type { Shift } from './shift';

/**
 * 用於單一班別的限制
 */
export interface PerShiftConstraints {
  maxWeeklyShifts: number;
  minInterval: number;
  availableDays: number[]; // 1=週一, 7=週日
  maxConsecutiveDays: number;
}

/**
 * 員工個人化限制
 */
export interface EmployeeConstraints {
  // 全域限制
  dailyMax: 1; // 固定為1
  unavailableDates: string[]; // YYYY-MM-DD

  // 各班別的專屬限制
  byShift: Partial<Record<Shift, PerShiftConstraints>>;
}

/**
 * 員工的歷史統計資料
 */
export interface HistoricalStats {
  morning: number;
  noon: number;
  afternoon: number;
  phone: number;
  lastUpdated: Date;
}

/**
 * 員工資料模型
 */
export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  roles: Record<Shift, boolean>;
  constraints: EmployeeConstraints;
  historicalStats?: Partial<HistoricalStats>; // 儲存長期統計資料
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
