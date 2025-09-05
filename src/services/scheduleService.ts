import { collection, writeBatch, getDocs, query, where, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { DailySchedule, ShiftAssignment } from '../models/schedule';
import type { Shift } from '../models/shift';
import { format } from 'date-fns';

const schedulesCollection = collection(db, 'schedules');

export const scheduleService = {
  /**
   * 將產生的班表結果（預覽狀態）儲存到 Firestore。
   * 使用 batch write 進行批次操作，確保資料一致性。
   * @param scheduleResults - 由 schedulingService 產生的每日班表陣列。
   */
  async saveSchedules(scheduleResults: DailySchedule[]): Promise<void> {
    if (!scheduleResults || scheduleResults.length === 0) {
      console.log('沒有要儲存的班表。');
      return;
    }

    const batch = writeBatch(db);

    scheduleResults.forEach((dailySchedule) => {
      // 文件 ID 使用 'YYYY-MM-DD' 格式
      const docId = format(dailySchedule.date, 'yyyy-MM-dd');
      const scheduleDocRef = doc(schedulesCollection, docId);
      
      const shiftsData: Record<Shift, ShiftAssignment | null> = {
        noon: null,
        phone: null,
        morning: null,
        afternoon: null,
        verify1: null,
        verify2: null,
      };

      // 轉換 shifts Map 為可序列化的物件
      for (const [shift, assignment] of Object.entries(dailySchedule.shifts)) {
        if (assignment) {
          shiftsData[shift as Shift] = {
            employeeId: assignment.employeeId,
            // 轉換 assignedAt 為 Firestore Timestamp
            assignedAt: Timestamp.fromDate(assignment.assignedAt instanceof Date ? assignment.assignedAt : new Date()),
            isManual: assignment.isManual,
          } as any; // 暫時使用 any 來避免型別衝突
        }
      }

      const dataToSave = {
        date: Timestamp.fromDate(typeof dailySchedule.date === 'string' ? new Date(dailySchedule.date) : dailySchedule.date),
        shifts: shiftsData,
      };

      batch.set(scheduleDocRef, dataToSave, { merge: true }); // 使用 merge: true 來避免覆蓋手動調整
    });

    try {
      await batch.commit();
      console.log(`成功儲存 ${scheduleResults.length} 天的班表。`);
    } catch (error) {
      console.error('儲存班表時發生錯誤:', error);
      throw new Error('儲存班表失敗');
    }
  },

  /**
   * 根據日期範圍從 Firestore 讀取已儲存的班表。
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 該日期範圍內的每日班表陣列。
   */
  async getSchedules(startDate: Date, endDate: Date): Promise<DailySchedule[]> {
    const q = query(
      schedulesCollection,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );

    try {
      const querySnapshot = await getDocs(q);
      const schedules: DailySchedule[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // 將 Firestore Timestamp 轉換回 JavaScript Date 物件
        const dailySchedule: DailySchedule = {
          date: (data.date as Timestamp).toDate().toISOString().split('T')[0],
          shifts: data.shifts || {},
        };
        // 確保 shifts 裡面的 assignedAt 也被轉換
        for (const shift in dailySchedule.shifts) {
            if (dailySchedule.shifts[shift as Shift]?.assignedAt) {
                const assignment = dailySchedule.shifts[shift as Shift];
                if (assignment) {
                    assignment.assignedAt = (assignment.assignedAt as unknown as Timestamp).toDate();
                }
            }
        }
        schedules.push(dailySchedule);
      });
      console.log(`成功讀取 ${schedules.length} 筆班表資料。`);
      return schedules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('讀取班表時發生錯誤:', error);
      throw new Error('讀取班表失敗');
    }
  },

  /**
   * 計算指定日期範圍內，每位員工各班別的排班次數統計。
   * @param startDate - 統計開始日期
   * @param endDate - 統計結束日期
   * @returns 返回一個物件，key 為 employeeId，value 為各班別次數的物件。
   */
  async calculateStatsForPeriod(startDate: Date, endDate: Date): Promise<Record<string, Record<Shift, number>>> {
    const schedules = await this.getSchedules(startDate, endDate);
    const stats: Record<string, Record<Shift, number>> = {};

    if (schedules.length === 0) {
      return stats;
    }

    for (const schedule of schedules) {
      for (const shiftKey in schedule.shifts) {
        const shift = shiftKey as Shift;
        const assignment = schedule.shifts[shift];
        if (assignment) {
          const { employeeId } = assignment;
                  if (!stats[employeeId]) {
          stats[employeeId] = { morning: 0, noon: 0, afternoon: 0, phone: 0, verify1: 0, verify2: 0 };
        }
          stats[employeeId][shift]++;
        }
      }
    }
    
    console.log(`計算 ${format(startDate, 'yyyy-MM-dd')} 到 ${format(endDate, 'yyyy-MM-dd')} 的統計完成。`);
    return stats;
  },

  /**
   * 更新單一天的單一班次指派
   * @param date - 要更新的日期
   * @param shift - 要更新的班別
   * @param newEmployeeId - 新指派的員工 ID
   */
  async updateSingleShiftAssignment(date: Date, shift: Shift, newEmployeeId: string): Promise<void> {
    const docId = format(date, 'yyyy-MM-dd');
    const scheduleDocRef = doc(schedulesCollection, docId);

    const updateData = {
      [`shifts.${shift}`]: {
        employeeId: newEmployeeId,
        assignedAt: Timestamp.now(),
        isManual: true, // 標記為手動調整
      }
    };

    try {
      await updateDoc(scheduleDocRef, updateData);
      console.log(`成功更新 ${docId} 的 ${shift} 班次。`);
    } catch (error) {
      console.error(`更新班次 ${docId} / ${shift} 時發生錯誤:`, error);
      throw new Error('更新班次失敗');
    }
  },

  /**
   * 刪除指定日期範圍內的所有班表
   * @param startDate - 刪除開始日期
   * @param endDate - 刪除結束日期
   */
  async deleteSchedules(startDate: Date, endDate: Date): Promise<void> {
    // 1. 查詢出所有在此範圍內的文件
    const schedulesToDelete = await this.getSchedules(startDate, endDate);

    if (schedulesToDelete.length === 0) {
      console.log('在指定範圍內沒有需要刪除的班表。');
      return;
    }
    
    // 2. 使用 batch write 進行批次刪除
    const batch = writeBatch(db);
    schedulesToDelete.forEach(schedule => {
      const docId = format(new Date(schedule.date), 'yyyy-MM-dd');
      const scheduleDocRef = doc(schedulesCollection, docId);
      batch.delete(scheduleDocRef);
    });

    try {
      await batch.commit();
      console.log(`成功刪除 ${schedulesToDelete.length} 筆班表資料。`);
    } catch (error) {
      console.error('刪除班表時發生錯誤:', error);
      throw new Error('刪除班表失敗');
    }
  },

  // deleteEmployee will be added later...
};
