import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Leave } from '../models/leave';

const leavesCollectionRef = collection(db, 'leaves');

// Helper function to convert Firestore Timestamps to Dates
const convertTimestampToDate = (data: any): Leave => {
  return {
    ...data,
    id: data.id,
    startTime: (data.startTime as Timestamp).toDate(),
    endTime: (data.endTime as Timestamp).toDate(),
    appliedAt: (data.appliedAt as Timestamp).toDate(),
    reviewedAt: data.reviewedAt ? (data.reviewedAt as Timestamp).toDate() : undefined,
  } as Leave;
};

export const leaveService = {
  /**
   * 獲取所有請假記錄
   */
  async getLeaves(): Promise<Leave[]> {
    const q = query(leavesCollectionRef, orderBy('startTime', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestampToDate({ ...data, id: doc.id });
    });
  },

  /**
   * 新增一筆請假記錄
   */
  async addLeave(leaveData: Omit<Leave, 'id' | 'appliedAt' | 'status'>): Promise<string> {
    const docRef = await addDoc(leavesCollectionRef, {
      ...leaveData,
      status: 'pending',
      appliedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * 更新一筆請假記錄
   */
  async updateLeave(id: string, leaveData: Partial<Omit<Leave, 'id'>>): Promise<void> {
    const leaveDoc = doc(db, 'leaves', id);
    const dataToUpdate: any = { ...leaveData };

    // Convert Date objects back to Timestamps for Firestore
    if (leaveData.startTime) {
      dataToUpdate.startTime = Timestamp.fromDate(leaveData.startTime);
    }
    if (leaveData.endTime) {
      dataToUpdate.endTime = Timestamp.fromDate(leaveData.endTime);
    }
    if (leaveData.reviewedAt) {
      dataToUpdate.reviewedAt = Timestamp.fromDate(leaveData.reviewedAt);
    }
    
    await updateDoc(leaveDoc, dataToUpdate);
  },

  /**
   * 刪除一筆請假記錄
   */
  async deleteLeave(id: string): Promise<void> {
    const leaveDoc = doc(db, 'leaves', id);
    await deleteDoc(leaveDoc);
  },
};
