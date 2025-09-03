/**
 * 假日類型
 */
export type HolidayType = 'national' | 'weekend';

/**
 * 假日資料模型
 */
export interface Holiday {
  id: string;
  name: string;        // 假日名稱
  date: string;        // YYYY-MM-DD
  type: HolidayType;
  excludeFromScheduling: boolean; // 是否排除排班
  createdAt: Date;
  updatedAt: Date;
}
