import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ShiftChangeRequest, ShiftChangeStatus } from '../models/shiftChange';
import { scheduleService } from './scheduleService';
import { employeeService } from './employeeService';

const shiftChangeCollection = collection(db, 'shiftChangeRequests');

/**
 * 創建一個新的換班或代班申請
 * @param requestData - 不含 id 和時間戳的申請資料
 * @returns 創建後的申請文檔 ID
 */
export const createShiftChangeRequest = async (
  requestData: Omit<ShiftChangeRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> => {
  console.log('Creating shift change request with data:', requestData);
  
  try {
    const docRef = await addDoc(shiftChangeCollection, {
      ...requestData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('Successfully created shift change request with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating shift change request:', error);
    throw error;
  }
};

// 安全的日期轉換輔助函式
const safeConvertToDate = (dateValue: any): Date => {
  console.log('Converting date value:', dateValue, 'type:', typeof dateValue);
  
  // 處理 Firestore Timestamp
  if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
    console.log('Converting Firestore Timestamp to Date');
    return dateValue.toDate();
  }
  
  // 處理字串格式
  if (typeof dateValue === 'string') {
    console.log('Converting string to Date');
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateValue + 'T00:00:00');
    }
    return new Date(dateValue);
  }
  
  // 處理其他格式
  console.log('Converting other format to Date');
  return new Date(dateValue);
};

/**
 * 獲取與特定用戶相關的換班/代班申請
 * @param userId - 用戶 ID
 * @returns 相關的申請列表
 */
export const getShiftChangeRequestsForUser = async (userId: string): Promise<ShiftChangeRequest[]> => {
  const q = query(
    shiftChangeCollection,
    where('requesterId', '==', userId)
    // In a real app, you'd also query for where the user is a targetSwapperId or targetCovererId
    // This requires more complex queries or data duplication, keeping it simple for now.
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt as Timestamp, // Type assertion
    updatedAt: doc.data().updatedAt as Timestamp,
  })) as ShiftChangeRequest[];
};

/**
 * 獲取所有待處理的申請 (管理者用)
 * @returns 所有待處理的申請列表
 */
export const getPendingAdminRequests = async (): Promise<ShiftChangeRequest[]> => {
  console.log('Fetching pending admin requests...');
  
  try {
    const q = query(shiftChangeCollection, where('status', 'in', ['pending', 'approved_by_user']));
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.docs.length} pending requests`);
    
    const requests = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Processing request document:', doc.id, data);
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
        approvedByUserAt: data.approvedByUserAt || undefined,
        finalApprovedAt: data.finalApprovedAt || undefined,
      };
    }) as ShiftChangeRequest[];
    
    console.log('Processed requests:', requests);
    return requests;
  } catch (error) {
    console.error('Error fetching pending admin requests:', error);
    throw error;
  }
};


/**
 * 更新換班/代班申請的狀態
 * @param requestId - 申請的文檔 ID
 * @param status - 新的狀態
 * @param adminId - (可選) 執行操作的管理員 ID
 * @param rejectionReason - (可選) 拒絕原因
 */
export const updateShiftChangeRequestStatus = async (
  requestId: string,
  status: ShiftChangeStatus,
  adminId?: string,
  rejectionReason?: string
): Promise<void> => {
  const docRef = doc(db, 'shiftChangeRequests', requestId);
  const updateData: any = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'approved_by_admin' && adminId) {
    updateData.finalApproverId = adminId;
    updateData.finalApprovedAt = serverTimestamp();
  }

  if (status === 'rejected' && rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }

  // TODO: Add logic for 'approved_by_user' later

  await updateDoc(docRef, updateData);

  // IMPORTANT: After a request is 'approved_by_admin',
  // we need to actually swap the shifts in the 'schedules' collection.
  // This logic will be implemented in a later step.
};

/**
 * 批准一個代班/換班申請並實際執行班表更新
 * @param requestId 申請 ID
 * @param adminId 批准的管理者 ID
 */
export const approveAndProcessShiftChange = async (requestId: string, adminId: string): Promise<void> => {
  const requestDocRef = doc(db, 'shiftChangeRequests', requestId);
  const requestDoc = await getDoc(requestDocRef);

  if (!requestDoc.exists()) {
    throw new Error('找不到指定的申請');
  }

  const request = requestDoc.data() as ShiftChangeRequest;

  // 使用 Batch Write 確保所有操作的原子性
  const batch = writeBatch(db);

  // --- 步驟 1: 更新班表 ---
  if (request.type === 'cover' && request.targetCovererId) {
    // updateSingleShiftAssignment 內部不是使用 batch, 這裡我們先獨立執行
    // 在更複雜的系統中，會將 updateSingleShiftAssignment 改為接受 batch 作為參數
    await scheduleService.updateSingleShiftAssignment(
      safeConvertToDate(request.originalDate),
      request.originalShift,
      request.targetCovererId
    );
    
    // --- 步驟 2: 調整歷史統計數據 ---
    // 原申請人統計 -1
    await employeeService.adjustSingleEmployeeStats(request.requesterId, request.originalShift, 'decrement');
    // 代班人統計 +1
    await employeeService.adjustSingleEmployeeStats(request.targetCovererId, request.originalShift, 'increment');
    
  } else if (request.type === 'swap' && request.targetSwapperId && request.targetSwapDate && request.targetSwapShift) {
    // 步驟 1-A: 將 targetSwapper 指派給 originalShift
    await scheduleService.updateSingleShiftAssignment(
      safeConvertToDate(request.originalDate),
      request.originalShift,
      request.targetSwapperId
    );
    // 步驟 1-B: 將 requester 指派給 targetSwapShift
    await scheduleService.updateSingleShiftAssignment(
      safeConvertToDate(request.targetSwapDate),
      request.targetSwapShift,
      request.requesterId
    );

    // 步驟 2: 調整歷史統計數據 (只有在班別類型不同的情況下需要)
    if (request.originalShift !== request.targetSwapShift) {
      // Requester: -original, +target
      await employeeService.adjustSingleEmployeeStats(request.requesterId, request.originalShift, 'decrement');
      await employeeService.adjustSingleEmployeeStats(request.requesterId, request.targetSwapShift, 'increment');
      // Swapper: +original, -target
      await employeeService.adjustSingleEmployeeStats(request.targetSwapperId, request.originalShift, 'increment');
      await employeeService.adjustSingleEmployeeStats(request.targetSwapperId, request.targetSwapShift, 'decrement');
    }
  } else {
    throw new Error('無效的申請類型或缺少目標人員ID');
  }

  // --- 步驟 3: 更新申請單狀態 ---
  batch.update(requestDocRef, {
    status: 'approved_by_admin',
    finalApproverId: adminId,
    finalApprovedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 提交所有批次更新
  await batch.commit();
};
