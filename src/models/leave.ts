/**
 * 請假類型
 */
export type LeaveType = 'annual' | 'sick' | 'personal' | 'meeting' | 'other_duty' | 'compensatory_leave';

/**
 * 請假申請狀態
 */
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

/**
 * 請假資料模型
 */
export interface Leave {
  id: string;
  employeeId: string;
  employeeName?: string; // 為了方便顯示，可選
  startTime: Date;
  endTime: Date;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // 審核者ID
}
