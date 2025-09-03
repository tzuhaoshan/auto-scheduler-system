import type { Timestamp } from 'firebase/firestore';
import type { Shift } from './shift';

/**
 * 換班/代班申請的類型
 * - swap: 換班 (雙方交換班次)
 * - cover: 代班 (B 代替 A 的班次，A 不需補班)
 */
export type ShiftChangeType = 'swap' | 'cover';

/**
 * 申請的狀態
 * - pending: 待處理 (等待對方或管理員回應)
 * - approved_by_user: 已由對方同意 (僅適用於換班，等待管理員最終批准)
 * - approved_by_admin: 已由管理員批准 (最終狀態)
 * - rejected: 已拒絕 (被任一方或管理員拒絕)
 * - cancelled: 已取消 (由申請人主動撤銷)
 */
export type ShiftChangeStatus =
  | 'pending'
  | 'approved_by_user'
  | 'approved_by_admin'
  | 'rejected'
  | 'cancelled';

/**
 * 代表一個換班或代班的申請
 */
export interface ShiftChangeRequest {
  id: string;

  // 核心資訊
  type: ShiftChangeType;
  status: ShiftChangeStatus;
  requesterId: string; // 申請人 ID

  // 申請的原始班次資訊
  originalDate: string; // YYYY-MM-DD
  originalShift: Shift;

  // 換班(swap)對方資訊
  targetSwapperId?: string; // 換班對象 ID
  targetSwapDate?: string; // 換班對象的日期 YYYY-MM-DD
  targetSwapShift?: Shift; // 換班對象的班別

  // 代班(cover)對方資訊
  targetCovererId?: string; // 代班人 ID

  // 流程時間戳
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // 審核紀錄
  approvedByUserId?: string; // 同意的用戶(換班或代班者)
  approvedByUserAt?: Timestamp;
  finalApproverId?: string; // 最終批准的管理者 ID
  finalApprovedAt?: Timestamp;

  // 附註
  requesterNotes?: string; // 申請人備註
  rejectionReason?: string; // 拒絕原因
}
