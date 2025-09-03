/**
 * 日期工具函數
 */

/**
 * 安全地格式化日期，處理各種日期格式
 * @param dateValue - 日期值（可能是 Date、Timestamp 或字串）
 * @param options - 格式化選項
 * @returns 格式化後的日期字串
 */
export const formatDate = (
  dateValue: any,
  options: {
    locale?: string;
    includeTime?: boolean;
    fallback?: string;
  } = {}
): string => {
  const { locale = 'zh-TW', includeTime = false, fallback = '無' } = options;

  if (!dateValue) return fallback;

  try {
    let date: Date;

    // 處理不同的日期格式
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
      // Firestore Timestamp
      date = dateValue.toDate();
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else {
      return fallback;
    }

    // 檢查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue);
      return '無效日期';
    }

    // 格式化日期
    if (includeTime) {
      return date.toLocaleString(locale);
    } else {
      return date.toLocaleDateString(locale);
    }
  } catch (error) {
    console.error('日期格式化錯誤:', error, 'Value:', dateValue);
    return '格式錯誤';
  }
};

/**
 * 檢查日期是否有效
 * @param dateValue - 要檢查的日期值
 * @returns 是否為有效日期
 */
export const isValidDate = (dateValue: any): boolean => {
  if (!dateValue) return false;

  try {
    let date: Date;

    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
      date = dateValue.toDate();
    } else {
      date = new Date(dateValue);
    }

    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

/**
 * 將各種日期格式轉換為標準 Date 物件
 * @param dateValue - 日期值
 * @returns Date 物件或 null
 */
export const toDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;

  try {
    if (dateValue instanceof Date) {
      return dateValue;
    } else if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
      return dateValue.toDate();
    } else {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }
  } catch {
    return null;
  }
};
