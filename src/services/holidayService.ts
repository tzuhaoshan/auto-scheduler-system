import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Holiday } from '../models/holiday';

const holidaysCollectionRef = collection(db, 'holidays');

export const holidayService = {
  /**
   * 獲取所有假日列表，按日期排序
   */
  async getHolidays(): Promise<Holiday[]> {
    const q = query(holidaysCollectionRef, orderBy('date', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Holiday;
    });
  },

  /**
   * 新增一個假日
   */
  async addHoliday(holidayData: Omit<Holiday, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(holidaysCollectionRef, {
      ...holidayData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * 更新一個假日的資料
   */
  async updateHoliday(id: string, holidayData: Partial<Omit<Holiday, 'id' | 'createdAt'>>): Promise<void> {
    const holidayDoc = doc(db, 'holidays', id);
    await updateDoc(holidayDoc, {
      ...holidayData,
      updatedAt: serverTimestamp(),
    });
  },
  
  /**
   * 刪除一個假日
   */
  async deleteHoliday(id: string): Promise<void> {
    const holidayDoc = doc(db, 'holidays', id);
    await deleteDoc(holidayDoc);
  }
};
