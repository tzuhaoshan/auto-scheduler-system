import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { db } from '../firebase';
import type { Employee } from '../models/employee';
import type { DailySchedule } from '../models/schedule';
import type { Shift } from '../models/shift';

const employeesCollectionRef = collection(db, 'employees');

export const employeeService = {
  /**
   * 獲取所有員工列表，按建立時間排序
   */
  async getEmployees(): Promise<Employee[]> {
    const q = query(employeesCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const employee = {
        ...data,
        id: doc.id,
        // 將 Firestore Timestamp 轉換為 Date 物件
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Employee;

      // 轉換 historicalStats.lastUpdated
      if (employee.historicalStats?.lastUpdated) {
        employee.historicalStats.lastUpdated = (employee.historicalStats.lastUpdated as any).toDate();
      }

      return employee;
    });
  },

  /**
   * 新增一名員工
   * @param employeeData - 要新增的員工資料 (不含 id, createdAt, updatedAt)
   */
  async addEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(employeesCollectionRef, {
      ...employeeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * 更新一名員工的資料
   * @param id - 員工 ID
   * @param employeeData - 要更新的員工資料
   */
  async updateEmployee(id: string, employeeData: Partial<Omit<Employee, 'id' | 'createdAt'>>): Promise<void> {
    const employeeDoc = doc(db, 'employees', id);
    await updateDoc(employeeDoc, {
      ...employeeData,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * 在儲存班表後，更新員工的長期歷史統計資料
   * @param schedules - 已儲存的班表
   * @param employees - 全體員工列表
   */
  async updateHistoricalStats(schedules: DailySchedule[], employees: Employee[]): Promise<void> {
    const statsUpdate: Record<string, Record<Shift, number>> = {};

    // 1. 計算本次排班中，每位員工各班別的次數
    for (const schedule of schedules) {
      for (const shift of Object.values(schedule.shifts)) {
        if (shift) {
          const employeeId = shift.employeeId;
          const shiftType = Object.keys(schedule.shifts).find(key => schedule.shifts[key as Shift] === shift) as Shift;
          
          if (!statsUpdate[employeeId]) {
            statsUpdate[employeeId] = { morning: 0, noon: 0, afternoon: 0, phone: 0, verify: 0 };
          }
          if(shiftType) {
            statsUpdate[employeeId][shiftType]++;
          }
        }
      }
    }

    if (Object.keys(statsUpdate).length === 0) {
      console.log('沒有需要更新的統計資料。');
      return;
    }

    const batch = writeBatch(db);
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // 2. 準備批次更新
    for (const [employeeId, newCounts] of Object.entries(statsUpdate)) {
      const employee = employeeMap.get(employeeId);
      if (employee) {
        const employeeDocRef = doc(db, 'employees', employeeId);
        
        // 取得現有的統計資料，如果不存在則初始化
        const currentStats = employee.historicalStats || { morning: 0, noon: 0, afternoon: 0, phone: 0, verify: 0 };
        
        const updatedStats = {
          morning: (currentStats.morning || 0) + (newCounts.morning || 0),
          noon: (currentStats.noon || 0) + (newCounts.noon || 0),
          afternoon: (currentStats.afternoon || 0) + (newCounts.afternoon || 0),
          phone: (currentStats.phone || 0) + (newCounts.phone || 0),
          verify: (currentStats.verify || 0) + (newCounts.verify || 0),
          lastUpdated: serverTimestamp()
        };

        batch.update(employeeDocRef, { historicalStats: updatedStats });
      }
    }

    // 3. 執行批次更新
    try {
      await batch.commit();
      console.log(`成功更新 ${Object.keys(statsUpdate).length} 位員工的歷史統計資料。`);
    } catch (error) {
      console.error('更新歷史統計資料時發生錯誤:', error);
      throw new Error('更新歷史統計資料失敗');
    }
  },

  /**
   * 手動調整班表後，同步更新相關員工的長期統計資料 (一減一增)
   * @param originalEmployeeId - 原本的員工 ID，如果原為空班則為 null
   * @param newEmployeeId - 新的員工 ID
   * @param shift - 變動的班別
   */
  async adjustHistoricalStats(originalEmployeeId: string | null, newEmployeeId: string, shift: Shift): Promise<void> {
    if (originalEmployeeId === newEmployeeId) return;

    const batch = writeBatch(db);
    
    // 舊員工的統計 -1
    if (originalEmployeeId) {
      const originalDocRef = doc(db, 'employees', originalEmployeeId);
      batch.update(originalDocRef, {
        [`historicalStats.${shift}`]: increment(-1),
        'historicalStats.lastUpdated': serverTimestamp()
      });
    }

    // 新員工的統計 +1
    const newDocRef = doc(db, 'employees', newEmployeeId);
    batch.update(newDocRef, {
      [`historicalStats.${shift}`]: increment(1),
      'historicalStats.lastUpdated': serverTimestamp()
    });
    
    try {
      await batch.commit();
      console.log(`成功調整 ${shift} 班次的統計資料。`);
    } catch (error) {
      console.error('調整統計資料失敗:', error);
      throw new Error('調整統計資料失敗');
    }
  },

  /**
   * 刪除班表後，反向更新 (扣除) 員工的長期歷史統計資料
   * @param deletedSchedules - 被刪除的班表
   */
  async revertHistoricalStats(deletedSchedules: DailySchedule[]): Promise<void> {
    const statsToRevert: Record<string, Record<Shift, number>> = {};

    // 1. 計算被刪除的排班中，每位員工各班別的次數
    for (const schedule of deletedSchedules) {
      for (const shiftKey in schedule.shifts) {
        const shift = shiftKey as Shift;
        const assignment = schedule.shifts[shift];
        if (assignment) {
          const { employeeId } = assignment;
          if (!statsToRevert[employeeId]) {
            statsToRevert[employeeId] = { morning: 0, noon: 0, afternoon: 0, phone: 0, verify: 0 };
          }
          statsToRevert[employeeId][shift]++;
        }
      }
    }

    if (Object.keys(statsToRevert).length === 0) {
      console.log('沒有需要回滾的統計資料。');
      return;
    }

    const batch = writeBatch(db);

    // 2. 準備批次更新 (使用 increment 負值來進行扣除)
    for (const [employeeId, countsToRevert] of Object.entries(statsToRevert)) {
      const employeeDocRef = doc(db, 'employees', employeeId);
      const updatePayload: Record<string, any> = { 'historicalStats.lastUpdated': serverTimestamp() };
      
      for (const shiftKey in countsToRevert) {
        const shift = shiftKey as Shift;
        if (countsToRevert[shift] > 0) {
          updatePayload[`historicalStats.${shift}`] = increment(-countsToRevert[shift]);
        }
      }
      batch.update(employeeDocRef, updatePayload);
    }

    // 3. 執行批次更新
    try {
      await batch.commit();
      console.log(`成功回滾 ${Object.keys(statsToRevert).length} 位員工的歷史統計資料。`);
    } catch (error) {
      console.error('回滾歷史統計資料時發生錯誤:', error);
      throw new Error('回滾歷史統計資料失敗');
    }
  },

  /**
   * 調整單個員工的歷史統計（增量或減量）
   * @param employeeId - 員工 ID
   * @param shift - 班別
   * @param operation - 'increment' 或 'decrement'
   */
  async adjustSingleEmployeeStats(employeeId: string, shift: Shift, operation: 'increment' | 'decrement'): Promise<void> {
    const docRef = doc(db, 'employees', employeeId);
    const incrementValue = operation === 'increment' ? 1 : -1;
    
    await updateDoc(docRef, {
      [`historicalStats.${shift}`]: increment(incrementValue),
      'historicalStats.lastUpdated': serverTimestamp()
    });
  },

  /**
   * 批量設定員工的歷史統計（直接設定值，不是增量）
   * @param statsData - 要設定的統計資料陣列
   */
  async setHistoricalStats(
          statsData: Array<{
        employeeId: string;
        historicalStats: {
          morning: number;
          noon: number;
          afternoon: number;
          phone: number;
          verify: number;
          lastUpdated: Date;
        };
      }>
  ): Promise<void> {
    console.log('開始批量更新歷史統計:', statsData);

    if (statsData.length === 0) {
      console.log('沒有需要更新的統計資料。');
      return;
    }

    const batch = writeBatch(db);

    // 批次更新每個員工的歷史統計
    for (const { employeeId, historicalStats } of statsData) {
      const employeeDocRef = doc(db, 'employees', employeeId);
      
      batch.update(employeeDocRef, {
        historicalStats: {
          morning: historicalStats.morning,
          noon: historicalStats.noon,
          afternoon: historicalStats.afternoon,
          phone: historicalStats.phone,
          verify: historicalStats.verify,
          lastUpdated: serverTimestamp(),
        }
      });
    }

    // 提交批次更新
    await batch.commit();
    console.log(`成功更新 ${statsData.length} 位員工的歷史統計。`);
  },

  // deleteEmployee will be added later...
};
