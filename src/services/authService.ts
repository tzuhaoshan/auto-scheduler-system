import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'employee';
  employeeId?: string; // 關聯到員工資料
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLoginAt?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  role: 'admin' | 'manager' | 'employee';
  employeeId?: string;
}

export class AuthService {
  /**
   * 使用者登入
   */
  static async login({ email, password }: LoginCredentials): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 更新最後登入時間
      await this.updateLastLoginTime(userCredential.user.uid);
      
      return userCredential.user;
    } catch (error: any) {
      console.error('登入失敗:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * 使用者註冊
   */
  static async register(data: RegisterData): Promise<User> {
    let user: User | null = null;
    
    try {
      // 步驟 1: 建立 Firebase 帳號
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      user = userCredential.user;

      // 步驟 2: 更新使用者顯示名稱
      try {
        await updateProfile(user, {
          displayName: data.displayName,
        });
      } catch (profileError) {
        console.warn('更新顯示名稱失敗，但繼續進行:', profileError);
        // 不中斷流程，繼續建立 UserProfile
      }

      // 步驟 3: 建立使用者資料文件
      try {
        await this.createUserProfile(user, data);
      } catch (profileError) {
        console.error('建立使用者資料文件失敗:', profileError);
        
        // 提供詳細的錯誤資訊
        let errorMessage = '建立使用者資料失敗';
        
        // 安全地提取錯誤訊息
        if (profileError && typeof profileError === 'object') {
          if ('message' in profileError && typeof profileError.message === 'string') {
            errorMessage += `: ${profileError.message}`;
          } else if ('code' in profileError && typeof profileError.code === 'string') {
            errorMessage += `: ${profileError.code}`;
          } else {
            errorMessage += ': 未知錯誤';
          }
        }
        
        // 檢查是否為權限問題
        if (profileError && typeof profileError === 'object' && 'message' in profileError) {
          const message = String(profileError.message);
          if (message.includes('permission') || message.includes('Permission')) {
            errorMessage += '\n\n可能原因：Firestore 權限不足\n解決方案：請檢查 Firebase Console 中的安全規則設定';
          } else if (message.includes('network') || message.includes('Network')) {
            errorMessage += '\n\n可能原因：網路連線問題\n解決方案：請檢查網路連線和 Firebase 專案設定';
          }
        }
        
        // 如果建立 UserProfile 失敗，嘗試清理已建立的 Firebase 帳號
        try {
          await user.delete();
        } catch (deleteError) {
          console.error('清理失敗的帳號時發生錯誤:', deleteError);
        }
        
        throw new Error(errorMessage);
      }

      return user;
    } catch (error: any) {
      console.error('註冊失敗:', error);
      
      // 安全地處理錯誤訊息
      let errorMessage = '註冊過程中發生未知錯誤，請稍後再試';
      
      if (error && typeof error === 'object') {
        // 如果是已知的 Firebase 錯誤，使用對應的錯誤訊息
        if ('code' in error && typeof error.code === 'string' && error.code.startsWith('auth/')) {
          errorMessage = this.getAuthErrorMessage(error.code);
        }
        // 如果是我們自定義的錯誤，使用其訊息
        else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
        // 如果是其他類型的錯誤，嘗試提取有用資訊
        else if ('code' in error && typeof error.code === 'string') {
          errorMessage = `錯誤代碼: ${error.code}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * 使用者登出
   */
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('登出失敗:', error);
      throw new Error('登出時發生錯誤');
    }
  }

  /**
   * 監聽認證狀態變化
   */
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * 獲取當前使用者
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * 獲取使用者資料
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid: docSnap.id,
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          employeeId: data.employeeId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          isActive: data.isActive,
          lastLoginAt: data.lastLoginAt?.toDate(),
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('獲取使用者資料失敗:', error);
      throw new Error('無法載入使用者資料');
    }
  }

  /**
   * 更新使用者資料
   */
  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('更新使用者資料失敗:', error);
      throw new Error('更新使用者資料時發生錯誤');
    }
  }

  /**
   * 發送密碼重設信件
   */
  static async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('發送密碼重設信件失敗:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * 更改密碼
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('使用者未登入');
      }

      // 重新驗證使用者
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 更新密碼
      await updatePassword(user, newPassword);
    } catch (error: any) {
      console.error('更改密碼失敗:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * 檢查使用者權限
   */
  static async checkUserPermission(uid: string, requiredRole: 'admin' | 'manager' | 'employee'): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile || !userProfile.isActive) {
        return false;
      }

      // 權限層級：admin > manager > employee
      const roleHierarchy = { admin: 3, manager: 2, employee: 1 };
      const userLevel = roleHierarchy[userProfile.role];
      const requiredLevel = roleHierarchy[requiredRole];

      return userLevel >= requiredLevel;
    } catch (error) {
      console.error('檢查使用者權限失敗:', error);
      return false;
    }
  }

  /**
   * 檢查並修復不完整的使用者帳號
   */
  static async checkAndFixIncompleteAccount(email: string, displayName: string, role: 'admin' | 'manager' | 'employee', employeeId?: string): Promise<boolean> {
    try {
      // 檢查是否已有 Firebase 帳號但沒有 UserProfile
      const user = auth.currentUser;
      if (!user || user.email !== email) {
        return false;
      }

      // 檢查是否已有 UserProfile
      const existingProfile = await this.getUserProfile(user.uid);
      if (existingProfile) {
        return true; // 帳號完整，無需修復
      }

      // 嘗試建立 UserProfile（不包含密碼）
      const userProfileData: Record<string, any> = {
        uid: user.uid,
        email: user.email!,
        displayName,
        role,
        isActive: true,
      };

      // 只有當 employeeId 有值時才加入
      if (employeeId && employeeId.trim() !== '') {
        userProfileData.employeeId = employeeId;
      }

      await setDoc(doc(db, 'users', user.uid), {
        ...userProfileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return true;
    } catch (error) {
      console.error('修復帳號失敗:', error);
      return false;
    }
  }

  /**
   * 測試 Firestore 連線和權限
   */
  static async testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // 測試寫入權限
      const testDoc = doc(db, 'test', 'connection-test');
      await setDoc(testDoc, {
        timestamp: serverTimestamp(),
        message: 'Connection test'
      });
      
      // 測試讀取權限
      const testSnap = await getDoc(testDoc);
      if (!testSnap.exists()) {
        throw new Error('無法讀取測試文件');
      }
      
      // 清理測試文件
      await deleteDoc(testDoc);
      
      return {
        success: true,
        message: 'Firestore 連線和權限正常'
      };
    } catch (error: any) {
      console.error('Firestore 連線測試失敗:', error);
      
      let message = 'Firestore 連線測試失敗';
      if (error.message.includes('permission')) {
        message += '\n\n可能原因：Firestore 安全規則限制\n解決方案：請在 Firebase Console 中設定允許所有讀寫操作的安全規則';
      } else if (error.message.includes('network')) {
        message += '\n\n可能原因：網路連線問題\n解決方案：請檢查網路連線和 Firebase 專案設定';
      } else {
        message += `\n\n錯誤詳情：${error.message}`;
      }
      
      return {
        success: false,
        message
      };
    }
  }

  /**
   * 建立使用者資料文件
   */
  private static async createUserProfile(user: User, data: RegisterData): Promise<void> {
    // 建立基本資料，過濾掉 undefined 值
    const userProfileData: Record<string, any> = {
      uid: user.uid,
      email: user.email!,
      displayName: data.displayName,
      role: data.role,
      isActive: true,
    };

    // 只有當 employeeId 有值時才加入
    if (data.employeeId && data.employeeId.trim() !== '') {
      userProfileData.employeeId = data.employeeId;
    }

    await setDoc(doc(db, 'users', user.uid), {
      ...userProfileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * 更新最後登入時間
   */
  private static async updateLastLoginTime(uid: string): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('更新最後登入時間失敗:', error);
      // 不拋出錯誤，因為這不是關鍵功能
    }
  }

  /**
   * 轉換 Firebase 錯誤代碼為中文訊息
   */
  private static getAuthErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': '找不到此電子郵件的使用者',
      'auth/wrong-password': '密碼錯誤',
      'auth/invalid-email': '電子郵件格式不正確',
      'auth/email-already-in-use': '此電子郵件已被註冊',
      'auth/weak-password': '密碼強度不足，至少需要6個字元',
      'auth/too-many-requests': '嘗試次數過多，請稍後再試',
      'auth/network-request-failed': '網路連線失敗',
      'auth/invalid-credential': '登入憑證無效',
      'auth/user-disabled': '此帳號已被停用',
      'auth/requires-recent-login': '此操作需要重新登入',
    };

    return errorMessages[errorCode] || '發生未知錯誤，請稍後再試';
  }
}

export default AuthService;
