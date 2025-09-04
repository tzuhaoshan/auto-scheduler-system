# 自動排班系統 PRD (Material Design 3)

## 1. 專案願景

### 1.1 專案目標
打造一個符合 Material Design 3 設計哲學的智慧排班系統。提供排班管理者與員工一個美觀、直覺、且高效的排班體驗，自動化處理複雜的排班規則，並在所有裝置上提供一致的感受。

### 1.2 目標用戶
- **主要用戶：排班管理者**
  - 核心任務：快速、公平地完成排班，並輕鬆管理班表異動。
- **次要用戶：員工**
  - 核心任務：清楚查看個人班表，並方便地申請休假、換班與代班。

### 1.3 設計原則
- **美學與個人化**: 遵循 Material You，提供動態色彩與現代化的視覺風格。
- **直覺與高效**: 簡化操作流程，讓使用者透過自然的互動完成任務。
- **適應性**: 在手機、平板、桌面提供無縫的響應式體驗。

---

## 2. 核心功能與使用者流程

### 2.1 班別定義

#### 2.1.1 班別總覽
系統支援四種班別，針對藥品諮詢組的業務需求設計：

| 班別 | 英文代碼 | 時間範圍 | 人員需求 | 工作內容 | 排班策略 |
|------|----------|----------|----------|----------|----------|
| 諮詢台值午 | `noon` | 12:30-13:30 | 1人 | 諮詢台值班、處理現場諮詢 | 預設排班 |
| 諮詢電話 | `phone` | 09:00-18:00 | 1人 | 接聽諮詢電話、處理電話諮詢 | 預設排班 |
| 諮詢台上午支援 | `morning` | 09:00-12:30 | 1人 | 諮詢台支援、協助現場諮詢 | 按需排班 |
| 諮詢台下午支援 | `afternoon` | 13:30-18:00 | 1人 | 諮詢台支援、協助現場諮詢 | 按需排班 |

#### 2.1.2 班別詳細說明

##### 1. 諮詢台值午 (noon)
- **時間**: 12:30-13:30 (午休時段)
- **人員需求**: 1人 (必須)
- **工作內容**: 
  - 諮詢台值班
  - 處理現場諮詢
  - 處理緊急諮詢需求
- **排班策略**: 預設排班，每日必須有人值班
- **優先級**: 最高 (1)

##### 2. 諮詢電話 (phone)
- **時間**: 09:00-18:00 (全天)
- **人員需求**: 1人 (必須)
- **工作內容**:
  - 接聽諮詢電話
  - 處理電話諮詢
  - 記錄諮詢內容
- **排班策略**: 預設排班，每日必須有人接聽
- **優先級**: 高 (2)

##### 3. 諮詢台上午支援 (morning)
- **時間**: 09:00-12:30 (上午)
- **人員需求**: 1人 (彈性)
- **工作內容**:
  - 諮詢台支援
  - 協助現場諮詢
  - 處理一般諮詢
- **排班策略**: 按需排班，視業務需求決定
- **優先級**: 中 (3)

##### 4. 諮詢台下午支援 (afternoon)
- **時間**: 13:30-18:00 (下午)
- **人員需求**: 1人 (彈性)
- **工作內容**:
  - 諮詢台支援
  - 協助現場諮詢
  - 處理一般諮詢
- **排班策略**: 按需排班，視業務需求決定
- **優先級**: 低 (4)

#### 2.1.3 班別配置規則

##### 預設排班班別 (Default Shifts)
- **noon**: 諮詢台值午 - 每日必須排班，1人
- **phone**: 諮詢電話 - 每日必須排班，1人

##### 按需排班班別 (On-Demand Shifts)
- **morning**: 諮詢台上午支援 - 視需求排班，1人
- **afternoon**: 諮詢台下午支援 - 視需求排班，1人

#### 2.1.4 班別時間關係

##### 時間重疊分析
- **phone** (09:00-18:00) 涵蓋全天，與其他班別都有重疊
- **morning** (09:00-12:30) 與 **phone** 重疊 3.5小時
- **noon** (12:30-13:30) 與 **phone** 重疊 1小時
- **afternoon** (13:30-18:00) 與 **phone** 重疊 4.5小時

##### 人員配置規則
- 每日每人最多排1個班次
- **noon** 和 **phone** 為主要班別，優先排班
- **morning** 和 **afternoon** 為支援班別，按需排班
- 同一時段可以有多人值班（如 phone + morning）

#### 2.1.5 排班策略

##### 預設排班邏輯
1. **優先排班 noon 和 phone**：確保基本服務不中斷
2. **按需排班 morning 和 afternoon**：根據業務量決定
3. **平衡分配**：確保員工班次分配公平

##### 特殊情況處理
- **請假影響**：已批准的請假會影響所有班別的排班
- **人員不足**：優先確保 noon 和 phone 有人值班
- **業務高峰**：可增加 morning 和 afternoon 支援

#### 2.1.6 技術實現

##### 班別配置常數
```javascript
const SHIFT_CONFIG = {
  noon: {
    timeRange: { start: '12:30', end: '13:30' },
    maxEmployees: 1,
    required: true,
    priority: 1
  },
  phone: {
    timeRange: { start: '09:00', end: '18:00' },
    maxEmployees: 1,
    required: true,
    priority: 2
  },
  morning: {
    timeRange: { start: '09:00', end: '12:30' },
    maxEmployees: 1,
    required: false,
    priority: 3
  },
  afternoon: {
    timeRange: { start: '13:30', end: '18:00' },
    maxEmployees: 1,
    required: false,
    priority: 4
  }
};

const DEFAULT_SHIFTS = ['noon', 'phone'];
const ON_DEMAND_SHIFTS = ['morning', 'afternoon'];
```

### 2.2 功能需求

#### 2.2.1 Phase 1: MVP 基礎功能 (Sprint 1-2)

##### 1.1 員工管理
**功能描述**: 管理員工基本資料與班別設定

**需求詳述**:
- 新增員工：姓名、員工編號、可擔任班別
- 編輯員工資料
- 刪除員工（軟刪除）
- 員工列表檢視

**技術規格**:
- Firestore Collection: `employees`
- 資料結構:
```javascript
{
  id: "string",
  name: "string", 
  employeeId: "string",
  
  // 基本角色設定
  roles: {
    morning: boolean,
    noon: boolean,
    afternoon: boolean,
    phone: boolean
  },
  
  // 個人限制設定（可配置）
  constraints: {
    dailyMax: 1,                    // 個人每日班次上限（固定為1）
    maxWeeklyShifts: 5,            // 每週最大班次數
    minInterval: 1,                // 最小間隔天數
    availableDays: [1,2,3,4,5],   // 可排班的星期幾（1=週一, 7=週日）
    unavailableDates: [],          // 不可排班的特定日期 ["2024-01-15", "2024-01-16"]
    maxConsecutiveDays: 3          // 最大連續排班天數
  },
  
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

##### 1.2 請假管理
**功能描述**: 員工請假申請與管理者審核系統

**管理者功能**:
- 審核請假申請（批准/拒絕）
- 編輯請假資料
- 刪除請假記錄
- 請假日曆檢視
- 請假統計報表

**員工功能**:
- 申請請假：開始時間、結束時間、請假類型、原因
- 查看個人請假記錄
- 查看請假申請狀態
- 取消未審核的請假申請

**技術規格**:
- Firestore Collection: `leaves`
- 資料結構:
```javascript
{
  id: "string",
  employeeId: "string",
  startTime: Timestamp, // UTC
  endTime: Timestamp,   // UTC
  leaveType: "annual" | "sick" | "personal",
  reason: "string",
  status: "pending" | "approved" | "rejected",
  appliedAt: Timestamp,
  reviewedAt: Timestamp,
  reviewedBy: "string", // 審核者ID
  reviewNote: "string"  // 審核備註
}
```

##### 1.3 簡化版排班功能
**功能描述**: 基礎排班邏輯，僅考慮請假與時段重疊

**需求詳述**:
- 選擇排班日期範圍
- 執行排班演算法
- 顯示排班結果 (預覽)
- 手動調整排班
- **確認並發佈班表** (將預覽結果儲存)

**技術規格**:
- Cloud Function: `generateSchedule`
- 輸入參數: `startDate`, `endDate`
- 輸出: 排班結果陣列

##### 1.4 日期範圍排班功能
**功能描述**: 支援自定義日期範圍的排班

**需求詳述**:
- 自定義開始和結束日期
- 快速選擇按鈕（下週、下月、自定義範圍）
- 日期範圍驗證
- 週末排除選項

**技術規格**:
- 日期輸入欄位: `schedule-start-date`, `schedule-end-date`
- 快速選擇按鈕: `next-week-btn`, `next-month-btn`, `custom-range-btn`
- 週末排除選項: `exclude-weekends`
- 預設範圍: 下週（7天）

##### 1.5 班次優先級管理
**功能描述**: 管理不同班次的優先級和排班策略

**需求詳述**:
- 主要班次設定（必須排班）
- 次要班次設定（按需排班）
- 班次優先級排序
- 排班策略選擇

**技術規格**:
```javascript
const SHIFT_PRIORITY = {
    noon: 1,           // 諮詢台值午 - 最高優先級
    phone: 2,          // 諮詢電話 - 第二優先級
    morning: 3,        // 諮詢台上午支援 - 較低優先級
    afternoon: 4       // 諮詢台下午支援 - 最低優先級
};

const PRIMARY_SHIFTS = ['noon', 'phone'];
const SECONDARY_SHIFTS = ['morning', 'afternoon'];
```

##### 1.6 班表管理功能
**功能描述**: 班表的清除和管理操作

**需求詳述**:
- 清除所有班表
- 清除指定日期範圍的班表
- 清除下週班表
- 操作確認機制

**技術規格**:
- 函數: `clearSchedule()`, `clearScheduleRange()`
- 確認對話框
- 批次刪除操作
- 錯誤處理機制

##### 1.7 班表檢視
**功能描述**: 多角色班表顯示系統

**管理者功能**:
- 完整班表月曆/週曆檢視
- 所有員工班次顯示
- 班次顏色區分
- 點擊編輯功能
- 班次統計資訊

**員工功能**:
- 個人班表檢視
- 個人班次行事曆
- 班次提醒設定
- 班表匯出 (個人)

**技術規格**:
- Firestore Collection: `schedules/{YYYY-MM-DD}`
- 資料結構:
```javascript
{
  date: "YYYY-MM-DD",
  shifts: {
    morning: {
      employeeId: "string",
      assignedAt: Timestamp,
      isManual: boolean
    },
    noon: { ... },
    afternoon: { ... },
    phone: { ... }
  }
}
```

##### 1.8 用戶認證與權限管理
**功能描述**: 多角色用戶系統

**需求詳述**:
- Firebase Authentication 整合
- 角色型權限控制 (RBAC)
- 用戶資料管理
- 密碼重設功能

**用戶角色**:
```javascript
{
  roles: {
    admin: "系統管理員",
    manager: "排班管理者", 
    employee: "一般員工"
  }
}
```

**權限設定**:
```javascript
{
  permissions: {
    admin: ["*"],  // 所有權限
    manager: [
      "employees:read", "employees:write",
      "leaves:read", "leaves:write", "leaves:approve",
      "schedules:read", "schedules:write",
      "stats:read"
    ],
    employee: [
      "employees:read:self",
      "leaves:read:self", "leaves:write:self",
      "schedules:read:self"
    ]
  }
}
```

**技術規格**:
- Firestore Collection: `users`
- 資料結構:
```javascript
{
  uid: "string",        // Firebase Auth UID
  email: "string",
  role: "admin" | "manager" | "employee",
  employeeId: "string", // 關聯到 employees collection
  isActive: boolean,
  createdAt: Timestamp,
  lastLoginAt: Timestamp
}
```

##### 1.9 員工特殊規則管理
**功能描述**: 管理員工個人排班限制設定

**管理者功能**:
- 設定員工個人限制（每日上限、每週上限、間隔天數）
- 設定員工可用時間（星期幾、特定日期）
- 批量設定員工規則
- 規則衝突檢測與驗證
- 規則模板管理

**需求詳述**:
- 個人限制設定：每週最大班次、最小間隔、連續天數限制
- 可用時間管理：可排班的星期幾、特定不可用日期
- 批量操作：選擇多個員工進行批量設定
- 驗證機制：設定值合理性檢查、邏輯衝突檢測
- 模板功能：預設規則模板（一般員工、兼職員工、特殊員工）

**技術規格**:
- 整合於 `employees` collection 中
- 配置驗證規則:
```javascript
const VALIDATION_RULES = {
  dailyMax: { min: 1, max: 1, fixed: true },        // 固定為1
  maxWeeklyShifts: { min: 1, max: 7 },             // 1-7次
  minInterval: { min: 0, max: 7 },                  // 0-7天
  maxConsecutiveDays: { min: 1, max: 7 },          // 1-7天
  availableDays: { min: 1, max: 7 },               // 至少1天
  priority: { min: -1, max: 1 }                    // -1到1
};

// 衝突檢測
const CONFLICT_RULES = {
  availabilityConflict: "可用時間不能為空",
  weeklyLimitTooHigh: "每週上限不能超過可用天數"
};
```

**管理介面設計**:
- 員工規則設定對話框
- 批量設定工具
- 規則模板選擇器
- 衝突警告提示
- 設定預覽功能

##### 1.10 國定假日管理
**功能描述**: 管理國定假日與例假日的排班排除設定

**管理者功能**:
- 設定年度國定假日清單
- 選擇性排除特定國定假日排班
- 例假日排班排除設定（週六、週日）
- 假日排班例外設定（緊急情況可排班）
- 假日行事曆檢視
- 批量假日設定

**需求詳述**:
- 國定假日清單管理：新增、編輯、刪除國定假日
- 排班排除設定：選擇哪些假日不排班
- 例假日設定：週六、週日排班控制
- 例外處理：特殊情況下的假日排班
- 年度規劃：支援多年度假日設定
- 假日模板：常用假日組合快速設定

**技術規格**:
- Firestore Collection: `holidays`
- 資料結構:
```javascript
{
  id: "string",
  name: "string",                    // 假日名稱 "春節"、"中秋節"
  date: "YYYY-MM-DD",               // 假日日期
  type: "national" | "weekend",      // 假日類型
  excludeFromScheduling: boolean,    // 是否排除排班
  isRecurring: boolean,             // 是否每年重複
  recurringRule: {                  // 重複規則（如農曆節日）
    type: "lunar" | "solar" | "relative",
    monthDay: "string",             // "01-01" 或 "12-25"
    weekRule: "string"              // "第二個週一" 等
  },
  year: number,                     // 適用年份
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// 系統設定
{
  id: "holiday_settings",
  weekendExclude: {
    saturday: boolean,              // 週六排除排班
    sunday: boolean                 // 週日排除排班
  },
  nationalHolidayExclude: boolean,  // 國定假日排除排班（全部）
  customExclusions: string[],       // 自訂排除日期清單
  emergencyOverride: boolean,       // 緊急情況可覆蓋
  lastUpdated: Timestamp
}
```

**台灣國定假日預設清單**:
```javascript
const TAIWAN_NATIONAL_HOLIDAYS = [
  { name: "中華民國開國紀念日", date: "01-01", type: "solar" },
  { name: "春節", date: "農曆12-30~01-03", type: "lunar" },
  { name: "和平紀念日", date: "02-28", type: "solar" },
  { name: "兒童節", date: "04-04", type: "solar" },
  { name: "民族掃墓節", date: "清明", type: "lunar" },
  { name: "勞動節", date: "05-01", type: "solar" },
  { name: "端午節", date: "農曆05-05", type: "lunar" },
  { name: "中秋節", date: "農曆08-15", type: "lunar" },
  { name: "國慶日", date: "10-10", type: "solar" }
];
```

**假日檢測函數**:
```javascript
// 檢查是否為排除日期
function isExcludedDate(date) {
  const dayOfWeek = date.getDay();
  const dateStr = date.toISOString().split('T')[0];
  
  // 檢查例假日
  const settings = getHolidaySettings();
  if ((dayOfWeek === 0 && settings.weekendExclude.sunday) ||
      (dayOfWeek === 6 && settings.weekendExclude.saturday)) {
    return { excluded: true, reason: "例假日" };
  }
  
  // 檢查國定假日
  const holiday = getHoliday(dateStr);
  if (holiday && holiday.excludeFromScheduling) {
    return { excluded: true, reason: `國定假日: ${holiday.name}` };
  }
  
  // 檢查自訂排除日期
  if (settings.customExclusions.includes(dateStr)) {
    return { excluded: true, reason: "自訂排除日期" };
  }
  
  return { excluded: false };
}

// 緊急覆蓋檢查
function canOverrideHoliday(date, reason) {
  const settings = getHolidaySettings();
  return settings.emergencyOverride && reason === "emergency";
}
```

**管理介面設計**:
- 假日行事曆檢視（顯示所有假日和排班狀態）
- 假日清單管理（新增、編輯、刪除假日）
- 排班排除設定面板
- 緊急排班覆蓋功能
- 假日模板選擇器

##### 1.11 換班與代班管理
**功能描述**: 員工間的班次調換和代班申請系統

**換班功能**:
- 員工發起換班申請（與其他員工互換班次）
- 雙方確認換班協議
- 管理者審核換班申請
- 自動更新班表和統計資料
- 換班歷史記錄

**代班功能**:
- 員工發起代班請求（請其他員工代班）
- 其他員工接受代班請求
- 管理者審核代班申請
- 自動處理班表變更
- 代班補償記錄

**需求詳述**:
- 換班申請：員工可選擇要換的班次和對象
- 代班請求：員工可請求特定日期的代班
- 雙向確認：相關員工都需要確認同意
- 管理者審核：最終由管理者批准或拒絕
- 條件檢查：驗證換班/代班的合理性
- 自動更新：審核通過後自動更新班表
- 通知系統：相關人員即時通知

**技術規格**:
- Firestore Collection: `shiftChanges`
- 資料結構:
```javascript
{
  id: "string",
  type: "swap" | "cover",              // 換班或代班
  status: "pending" | "approved" | "rejected" | "cancelled",
  
  // 申請者資訊
  requesterId: "string",               // 申請者員工ID
  requesterShift: {
    date: "YYYY-MM-DD",
    shift: "morning" | "noon" | "afternoon" | "phone" | "verify",
    originalAssignee: "string"         // 原排班員工ID
  },
  
  // 換班對象資訊（僅換班使用）
  targetId: "string",                  // 換班對象員工ID
  targetShift: {
    date: "YYYY-MM-DD", 
    shift: "morning" | "noon" | "afternoon" | "phone" | "verify",
    originalAssignee: "string"
  },
  
  // 代班對象資訊（僅代班使用）
  coverId: "string",                   // 代班員工ID
  
  // 申請資訊
  reason: "string",                    // 申請原因
  requestedAt: Timestamp,              // 申請時間
  
  // 確認狀態
  requesterConfirmed: boolean,         // 申請者確認
  targetConfirmed: boolean,            // 對方確認（換班）
  coverConfirmed: boolean,             // 代班者確認（代班）
  
  // 審核資訊
  reviewedBy: "string",                // 審核者ID
  reviewedAt: Timestamp,               // 審核時間
  reviewNote: "string",                // 審核備註
  
  // 執行狀態
  executed: boolean,                   // 是否已執行
  executedAt: Timestamp,               // 執行時間
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**換班流程**:
```javascript
// 換班申請流程
const SWAP_WORKFLOW = {
  1: "申請者發起換班申請",
  2: "系統檢查換班條件（時間衝突、個人限制等）",
  3: "通知換班對象確認",
  4: "雙方確認後提交管理者審核",
  5: "管理者審核批准/拒絕",
  6: "審核通過後自動更新班表",
  7: "通知相關人員完成換班"
};

// 代班申請流程  
const COVER_WORKFLOW = {
  1: "申請者發起代班請求",
  2: "系統檢查代班條件",
  3: "通知可代班員工或指定代班者",
  4: "代班者確認接受",
  5: "提交管理者審核",
  6: "管理者審核批准/拒絕", 
  7: "審核通過後自動更新班表",
  8: "記錄代班補償資訊"
};
```

**條件檢查規則**:
```javascript
// 換班條件檢查
function validateSwapRequest(requesterShift, targetShift, requesterId, targetId) {
  const errors = [];
  
  // 基本條件檢查
  if (requesterShift.date === targetShift.date) {
    errors.push("不能在同一天內換班");
  }
  
  // 員工角色檢查
  const requester = getEmployee(requesterId);
  const target = getEmployee(targetId);
  
  if (!requester.roles[targetShift.shift]) {
    errors.push(`申請者不具備 ${targetShift.shift} 班別角色`);
  }
  
  if (!target.roles[requesterShift.shift]) {
    errors.push(`換班對象不具備 ${requesterShift.shift} 班別角色`);
  }
  
  // 個人限制檢查
  if (!checkPersonalConstraints(requesterId, targetShift)) {
    errors.push("申請者個人限制不允許此班次");
  }
  
  if (!checkPersonalConstraints(targetId, requesterShift)) {
    errors.push("換班對象個人限制不允許此班次");
  }
  
  // 請假衝突檢查
  if (isOnLeave(requesterId, targetShift.date)) {
    errors.push("申請者在換班日期有請假");
  }
  
  if (isOnLeave(targetId, requesterShift.date)) {
    errors.push("換班對象在換班日期有請假");
  }
  
  return errors;
}

// 代班條件檢查
function validateCoverRequest(originalShift, coverId) {
  const errors = [];
  
  const cover = getEmployee(coverId);
  
  // 角色檢查
  if (!cover.roles[originalShift.shift]) {
    errors.push(`代班者不具備 ${originalShift.shift} 班別角色`);
  }
  
  // 個人限制檢查
  if (!checkPersonalConstraints(coverId, originalShift)) {
    errors.push("代班者個人限制不允許此班次");
  }
  
  // 請假衝突檢查
  if (isOnLeave(coverId, originalShift.date)) {
    errors.push("代班者在該日期有請假");
  }
  
  // 已排班檢查
  if (isAlreadyScheduled(coverId, originalShift.date)) {
    errors.push("代班者在該日期已有排班");
  }
  
  return errors;
}
```

**自動執行機制**:
```javascript
// 換班執行
async function executeSwap(swapRequest) {
  const { requesterShift, targetShift, requesterId, targetId } = swapRequest;
  
  // 更新班表
  await updateSchedule(requesterShift.date, requesterShift.shift, targetId);
  await updateSchedule(targetShift.date, targetShift.shift, requesterId);
  
  // 更新統計資料
  await updateEmployeeStats(requesterId, requesterShift.shift, -1);
  await updateEmployeeStats(requesterId, targetShift.shift, +1);
  await updateEmployeeStats(targetId, targetShift.shift, -1);
  await updateEmployeeStats(targetId, requesterShift.shift, +1);
  
  // 記錄執行狀態
  await updateShiftChange(swapRequest.id, { 
    executed: true, 
    executedAt: new Date() 
  });
  
  // 發送通知
  await sendNotification([requesterId, targetId], "換班已完成");
}

// 代班執行
async function executeCover(coverRequest) {
  const { requesterShift, requesterId, coverId } = coverRequest;
  
  // 更新班表
  await updateSchedule(requesterShift.date, requesterShift.shift, coverId);
  
  // 更新統計資料
  await updateEmployeeStats(requesterId, requesterShift.shift, -1);
  await updateEmployeeStats(coverId, requesterShift.shift, +1);
  
  // 記錄代班補償
  await recordCoverCompensation(coverId, requesterShift);
  
  // 記錄執行狀態
  await updateShiftChange(coverRequest.id, { 
    executed: true, 
    executedAt: new Date() 
  });
  
  // 發送通知
  await sendNotification([requesterId, coverId], "代班已完成");
}
```

#### 2.2.2 Phase 2: 核心演算法 (Sprint 3-4)

##### 2.1 智慧排班演算法
**功能描述**: 完整的排班邏輯，包含三級平衡機制

**核心邏輯**:
1. **候選人篩選**：
   - 基本篩選：有該班別角色的員工
   - 請假篩選：排除當天請假的員工
   - 每日上限：排除當天已排班的員工

2. **三級平衡排序**：
   - 主要排序：當次排班該班別次數（升序）
   - 次要排序：長期統計該班別次數（升序）
   - 第三級排序：Seed隨機分派（當前兩級相同時）

3. **員工選擇**：
   - 選擇排序後的第一個候選人
   - 更新統計資料
**功能描述**: 完整的排班邏輯，包含平衡機制

**需求詳述**:
- 候選人篩選（排除請假、每日上限）
- 三級平衡排序（當次排班、長期統計、Seed隨機）
- 統計資料管理（當次排班、長期統計）
- 決策日誌記錄

**演算法流程**:
1. 載入所有相關資料（員工、已批准請假、現有班表、統計資料、個人規則）
2. 對每個日期、每個班別：
   - 篩選符合條件的候選人：
     * 有該班別角色
     * 未請假
     * 當天未排班
     * 符合個人限制（每日上限、可用時間、週間隔等）
       - **三級平衡排序**：
      * **主要排序**：當次排班該班別次數（升序）
      * **次要排序**：長期統計該班別次數（升序）
      * **第三級排序**：Seed隨機分派（當前兩級相同時）
   - 選擇排序後的第一個候選人
   - 更新統計資料
3. 批次寫回結果

**候選人篩選邏輯**:
```javascript
function getCandidates(shift, date, employees) {
  // 首先檢查是否為排除日期
  if (shouldExcludeFromScheduling(date)) {
    const holidayInfo = isHoliday(date);
    console.log(`跳過排班: ${date.toISOString().split('T')[0]} - ${holidayInfo.name}`);
    return []; // 假日不排班，返回空陣列
  }
  
  return employees.filter(emp => {
    // 基本條件
    const hasRole = emp.roles[shift] === true;
    const isActive = emp.isActive === true;
    const notOnLeave = !isOnLeave(emp, date);
    const notScheduled = !isAlreadyScheduled(emp, date);
    
    // 個人限制檢查
    const withinDailyLimit = emp.constraints.dailyMax >= 1;
    const withinWeeklyLimit = getWeeklyShiftCount(emp, date) < emp.constraints.maxWeeklyShifts;
    const availableOnDay = emp.constraints.availableDays.includes(date.getDay() || 7);
    const notUnavailableDate = !emp.constraints.unavailableDates.includes(
      date.toISOString().split('T')[0]
    );
    const respectsInterval = checkMinInterval(emp, shift, date);
    const respectsConsecutive = checkMaxConsecutive(emp, date);
    
    return hasRole && isActive && notOnLeave && notScheduled && 
           withinDailyLimit && withinWeeklyLimit && availableOnDay && 
           notUnavailableDate && respectsInterval && respectsConsecutive;
  });
}

// 緊急排班覆蓋功能
function getCandidatesWithEmergencyOverride(shift, date, employees, isEmergency = false) {
  // 如果是緊急情況且允許覆蓋
  if (isEmergency && canOverrideHoliday(date, "emergency")) {
    console.log(`緊急排班覆蓋: ${date.toISOString().split('T')[0]}`);
    // 跳過假日檢查，直接進行員工篩選
    return employees.filter(emp => {
      const hasRole = emp.roles[shift] === true;
      const isActive = emp.isActive === true;
      const notOnLeave = !isOnLeave(emp, date);
      const notScheduled = !isAlreadyScheduled(emp, date);
      
      return hasRole && isActive && notOnLeave && notScheduled;
    });
  }
  
  // 一般情況使用標準篩選
  return getCandidates(shift, date, employees);
}
```

**簡化後的平衡機制**:
- 移除當次排班統計，專注於長期平衡
- 移除冷卻期限制，讓演算法更靈活
- 保持每日班次上限（避免同一天多個班次）

**優化的平衡策略**:
```javascript
candidates.sort((a, b) => {
    // 主要排序：當次排班該班別次數
    const aCurrent = currentStats[a.id][shift] || 0;
    const bCurrent = currentStats[b.id][shift] || 0;
    if (aCurrent !== bCurrent) {
        return aCurrent - bCurrent;
    }
    
    // 次要排序：長期統計該班別次數
    const aHistorical = historicalStats[a.id][shift] || 0;
    const bHistorical = historicalStats[b.id][shift] || 0;
    if (aHistorical !== bHistorical) {
        return aHistorical - bHistorical;
    }
    
    // 第三級排序：Seed隨機分派
    const seed = generateSeed(targetDate, shift);
    return simpleHash(`${a.id}-${seed}`) - simpleHash(`${b.id}-${seed}`);
});

function generateSeed(targetDate, shift) {
    const dateStr = targetDate.toISOString().split('T')[0];
    return simpleHash(`${dateStr}-${shift}`);
}
```

**技術規格**:
- Cloud Function: `generateSmartSchedule`
- 配置管理: `settings/scheduleConfig`
- 統計資料: `employees/{id}/stats`

**預期效果**:
- **長期平衡**：長期統計各班別內部差異 ≤ 3
- **公平分配**：新員工優先，重負擔員工得到休息
- **可重現性**：相同條件下結果一致
- **簡化維護**：移除複雜的短期統計和冷卻期邏輯

**統計資料結構**:
```javascript
// 當次排班統計 (記憶體中計算)
{
    employeeId: {
        morning: 0,
        noon: 0,
        afternoon: 0,
        phone: 0
    }
}

// 長期統計（從 Firestore 讀取）
{
    employeeId: "string",
    historicalStats: {
        morning: 0,
        noon: 0,
        afternoon: 0,
        phone: 0,
        lastUpdated: Timestamp
    }
}
```

##### 2.2 假日排班管理
**功能描述**: 例假日與國定假日的排班控制

**需求詳述**:
- 例假日排班排除（週六、週日）
- 國定假日排班排除（可選擇性設定）
- 假日日期識別與檢測
- 假日排班統計
- 緊急排班覆蓋機制

**技術規格**:
```javascript
// 整合的假日檢測函數
function isHoliday(date) {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    
    // 檢查例假日
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { 
            isHoliday: true, 
            type: "weekend", 
            name: dayOfWeek === 0 ? "週日" : "週六" 
        };
    }
    
    // 檢查國定假日
    const holiday = getHoliday(dateStr);
    if (holiday) {
        return { 
            isHoliday: true, 
            type: "national", 
            name: holiday.name,
            excludeFromScheduling: holiday.excludeFromScheduling
        };
    }
    
    return { isHoliday: false };
}

// 檢查是否應排除排班
function shouldExcludeFromScheduling(date) {
    const holidayInfo = isHoliday(date);
    
    if (!holidayInfo.isHoliday) {
        return false;
    }
    
    const settings = getHolidaySettings();
    
    // 例假日檢查
    if (holidayInfo.type === "weekend") {
        const dayOfWeek = date.getDay();
        return (dayOfWeek === 0 && settings.weekendExclude.sunday) ||
               (dayOfWeek === 6 && settings.weekendExclude.saturday);
    }
    
    // 國定假日檢查
    if (holidayInfo.type === "national") {
        return holidayInfo.excludeFromScheduling;
    }
    
    return false;
}

// 假日統計
function getHolidayStats(startDate, endDate) {
    const stats = {
        totalDays: 0,
        weekends: 0,
        nationalHolidays: 0,
        excludedDays: 0,
        workingDays: 0
    };
    
    const current = new Date(startDate);
    while (current <= endDate) {
        stats.totalDays++;
        
        const holidayInfo = isHoliday(current);
        if (holidayInfo.isHoliday) {
            if (holidayInfo.type === "weekend") {
                stats.weekends++;
            } else if (holidayInfo.type === "national") {
                stats.nationalHolidays++;
            }
            
            if (shouldExcludeFromScheduling(current)) {
                stats.excludedDays++;
            }
        } else {
            stats.workingDays++;
        }
        
        current.setDate(current.getDate() + 1);
    }
    
    return stats;
}
```

##### 2.3 班別平衡監控
**功能描述**: 監控和顯示各班別的平衡狀態

**需求詳述**:
- 班別平衡度計算
- 平衡狀態可視化
- 不平衡警告提示
- 平衡建議生成

**技術規格**:
```javascript
function checkShiftBalance(employeeStatsMap, shift) {
    const stats = Array.from(employeeStatsMap.entries())
        .map(([employeeId, statsData]) => ({ 
            id: employeeId, 
            name: statsData.name || employeeId, 
            historicalCount: statsData.historicalStats[shift] || 0
        }))
        .sort((a, b) => a.historicalCount - b.historicalCount);
    
    return {
        minHistoricalCount: stats[0].historicalCount,
        maxHistoricalCount: stats[stats.length - 1].historicalCount,
        historicalVariance: stats[stats.length - 1].historicalCount - stats[0].historicalCount,
        recommendations: stats.filter(s => s.historicalCount === stats[0].historicalCount)
    };
}
```

##### 2.4 演算法穩定性優化
**功能描述**: 確保排班演算法的穩定性和可靠性

**需求詳述**:
- 錯誤處理機制
- 演算法超時保護
- 資料完整性檢查
- 回滾機制

**技術規格**:
- 超時設定: 30 秒
- 錯誤重試機制
- 資料驗證
- 異常處理

##### 2.5 員工配置管理
**功能描述**: 可調整的員工個人排班參數

**需求詳述**:
- 員工個人限制設定（每日上限、每週上限、間隔天數）
- 員工可用時間設定（星期幾、特定日期）
- 員工個人限制設定
- 配置驗證與衝突檢測
- 批量設定工具
- 即時生效

**技術規格**:
```javascript
// 系統級別的基本配置（固定）
{
  // 員工限制
  dailyMax: 1,           // 每個員工每天最多1個班次
  
  // 班別基本設定
  shifts: {
    noon: { required: true },      // 必須排班
    phone: { required: true },     // 必須排班
    morning: { required: false },  // 可選排班
    afternoon: { required: false } // 可選排班
  }
}

// 員工個人配置（可調整）
{
  employeeId: "string",
  constraints: {
    dailyMax: 1,                    // 個人每日班次上限（固定為1）
    maxWeeklyShifts: 5,            // 每週最大班次數
    minInterval: 1,                // 最小間隔天數
    availableDays: [1,2,3,4,5],   // 可排班的星期幾
    unavailableDates: [],          // 不可排班的特定日期
    maxConsecutiveDays: 3          // 最大連續排班天數
  },
  // 個人偏好設定已移除，專注於客觀的排班限制
}
```

**配置驗證機制**:
```javascript
// 配置驗證規則
const EMPLOYEE_CONFIG_VALIDATION = {
  maxWeeklyShifts: { min: 1, max: 7 },
  minInterval: { min: 0, max: 7 },
  maxConsecutiveDays: { min: 1, max: 7 },
  availableDays: { minLength: 1, maxLength: 7 },
  priority: { min: -1, max: 1 }
};

// 衝突檢測
function validateEmployeeConfig(employee) {
  const errors = [];
  
  // 個人偏好設定已移除，無需檢查偏好衝突
  
  // 檢查每週上限與可用天數
  if (employee.constraints.maxWeeklyShifts > employee.constraints.availableDays.length) {
    errors.push('每週最大班次數不能超過可用天數');
  }
  
  return errors;
}
```

**管理者配置介面**:
- 員工個人設定頁面
- 批量設定工具
- 配置模板功能
- 衝突檢測系統
- 設定預覽與驗證

### 2.2.3 Phase 3: Material Design UI/UX 實現 (Sprint 5-6)

#### 3.1 Material Design 設計系統整合
**功能描述**: 完整實現 Material Design 3 設計規範

**設計原則** (參考 [Material Design 3](https://m3.material.io)):
- **個人化 (Personalization)**: Dynamic Color 動態色彩系統
- **適應性 (Adaptive)**: 響應式設計，支援多裝置
- **表達性 (Expressive)**: 豐富的動畫和互動效果

**核心組件實現**:
```typescript
// Material Design 3 主要組件
- App Bars (Top/Bottom/Navigation)
- Cards (排班卡片、員工卡片)
- Buttons (FAB、Text、Outlined、Filled)
- Navigation (Navigation Drawer、Bottom Navigation)
- Data Display (Tables、Lists、Chips)
- Feedback (Snackbars、Dialogs、Progress)
- Inputs (Text Fields、Select、Date Pickers)
- Layout (Container、Grid、Divider)
```

**設計令牌系統**:
```typescript
// Material Design Tokens
const theme = {
  palette: {
    primary: { main: '#6750A4' },    // Brand color
    secondary: { main: '#625B71' },  // Supporting color
    tertiary: { main: '#7D5260' },   // Accent color
    surface: { main: '#FFFBFE' },    // Background surfaces
    error: { main: '#BA1A1A' },      // Error states
  },
  typography: {
    // Material Design 3 Type Scale
    displayLarge: { fontSize: '3.5rem', lineHeight: '4rem' },
    headlineLarge: { fontSize: '2rem', lineHeight: '2.5rem' },
    bodyLarge: { fontSize: '1rem', lineHeight: '1.5rem' },
  },
  elevation: {
    // Material Design 3 Elevation Tokens
    level0: '0px',
    level1: '0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
    level2: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
  }
}
```

#### 3.2 核心介面設計

**管理者介面架構**:
1. **Navigation Rail** (桌面版) / **Bottom Navigation** (行動版)
   - 員工管理 (People icon)
   - 請假管理 (Event_busy icon)
   - 排班管理 (Calendar_month icon)
   - 換班代班 (Swap_horiz icon)
   - 假日管理 (Event_available icon)
   - 統計報表 (Analytics icon)
   - 系統設定 (Settings icon)

2. **排班日曆介面**:
   - **Material Calendar Component** 整合
   - **Floating Action Button** 用於快速排班
   - **Cards** 顯示每日班次資訊
   - **Chips** 標示班次狀態 (已排班/空缺/衝突)
   - **Bottom Sheet** 用於班次詳細資訊
   - **Save/Publish Button** 用於將預覽的班表儲存至系統

3. **員工管理介面**:
   - **Data Table** 顯示員工列表
   - **Search Bar** 搜尋功能
   - **Filter Chips** 篩選條件
   - **Dialogs** 新增/編輯員工

4. **員工特殊規則管理介面**:
   - **Employee Rules Table** 員工規則列表
   - **Rule Configuration Dialog** 規則設定對話框
   - **Batch Configuration Tool** 批量設定工具
   - **Template Selector** 規則模板選擇器
   - **Conflict Detection Panel** 衝突檢測面板
   - **Validation Feedback** 驗證回饋與警告

5. **假日管理介面**:
   - **Holiday Calendar** 假日行事曆檢視（顯示所有假日和排班狀態）
   - **Holiday List** 國定假日清單管理
   - **Exclusion Settings Panel** 排班排除設定面板
   - **Weekend Configuration** 例假日設定（週六、週日）
   - **Emergency Override Controls** 緊急排班覆蓋控制
   - **Holiday Templates** 假日模板選擇器
   - **Bulk Holiday Management** 批量假日設定工具

6. **換班代班管理介面**:
   - **Shift Change Dashboard** 換班代班申請總覽
   - **Pending Approvals List** 待審核申請列表
   - **Approval Actions Panel** 審核操作面板
   - **Change History** 換班代班歷史記錄
   - **Conflict Detection** 衝突檢測與警告
   - **Bulk Approval Tool** 批量審核工具
   - **Statistics Dashboard** 換班代班統計報表

**員工介面架構**:
1. **Bottom Navigation** (主要導航)
   - 我的班表 (Calendar_today icon)
   - 請假申請 (Time_off icon)
   - 換班代班 (Swap_horiz icon)
   - 個人資料 (Person icon)

2. **我的班表介面**:
   - **Personal Calendar** 個人行事曆檢視
   - **Upcoming Shifts Card** 即將到來的班次
   - **Monthly Summary** 本月班次統計
   - **Export Button** 個人班表匯出
   - **Quick Swap/Cover Buttons** 快速換班/代班按鈕

3. **請假申請介面**:
   - **Leave Request Form** 請假申請表單
   - **Leave History List** 請假記錄列表
   - **Status Chips** 申請狀態標示
   - **Calendar Integration** 行事曆整合

4. **換班代班介面**:
   - **Swap Request Form** 換班申請表單
   - **Cover Request Form** 代班請求表單
   - **Available Shifts List** 可換班次列表
   - **Pending Requests** 待處理申請列表
   - **Request History** 申請歷史記錄
   - **Quick Actions** 快速操作按鈕

**技術實現**:
```typescript
// MUI v5 + Material Design 3
import { 
  ThemeProvider, 
  CssBaseline,
  Container,
  AppBar,
  Drawer,
  Card,
  Fab,
  Chip,
  Dialog
} from '@mui/material';
```

#### 3.3 互動設計與動畫

**Material Motion 動畫系統**:
- **Container Transform**: 頁面切換動畫
- **Shared Axis**: 導航動畫
- **Fade Through**: 內容切換
- **Elevation**: 元素狀態變化

**互動設計**:
- **Drag & Drop**: 拖拉調整排班
- **Swipe Gestures**: 行動裝置手勢操作
- **Touch Ripple**: 點擊回饋效果
- **Loading States**: 載入狀態指示器

#### 3.4 進階班表管理 (Material Design)
**功能描述**: 採用 Material Design 的班表管理功能

**UI 組件**:
- **Export Menu**: Menu 組件提供匯出選項
- **Comparison View**: Split Layout 並排比較
- **History Timeline**: Timeline 組件顯示歷史
- **Version Control**: Stepper 組件版本追蹤

#### 3.5 單班別補排 (Material Design)
**功能描述**: Material Design 風格的單班別操作

**UI 設計**:
- **Quick Actions**: Speed Dial FAB 快速操作
- **Confirmation Dialog**: 操作確認對話框
- **Progress Indicator**: Linear/Circular Progress
- **Success Feedback**: Snackbar 成功提示

#### 3.6 響應式設計 (Material Design Adaptive)
**功能描述**: 完全遵循 Material Design 響應式規範

**斷點系統**:
```typescript
// Material Design 3 Breakpoints
const breakpoints = {
  compact: '0px-599px',     // 手機直向
  medium: '600px-839px',    // 手機橫向/小平板
  expanded: '840px+',       // 平板/桌面
}
```

**適應性佈局**:
- **Compact**: Bottom Navigation + Single Column
- **Medium**: Navigation Rail + Two Column
- **Expanded**: Navigation Drawer + Multi Column

**觸控優化**:
- **Touch Target**: 最小 48dp 點擊區域
- **Gesture Navigation**: 支援手勢導航
- **Accessibility**: 符合 WCAG 2.1 AA 標準

### 2.2.4 Phase 4: 測試與部署 (Sprint 7)

#### 4.1 測試策略
**單元測試**:
- Cloud Functions 邏輯測試
- 演算法正確性驗證
- 邊界條件測試

**整合測試**:
- 端到端流程測試
- 資料一致性測試
- 效能測試

#### 4.2 環境管理
**開發環境**:
- Firebase Project: `auto-scheduler-dev`
- 測試資料集
- 開發者權限管理

**正式環境**:
- Firebase Project: `auto-scheduler-prod`
- 生產資料備份
- 監控與警報

---

## 非功能需求

### 效能需求
- 排班演算法執行時間 < 30 秒（50 員工，30 天）
- 頁面載入時間 < 3 秒
- 支援同時 10 個用戶操作

### 安全需求
- Firebase Authentication 身份驗證
- Firestore 安全規則設定
- 資料加密傳輸

### 可用性需求
- 系統可用性 > 99%
- 資料備份每日執行
- 錯誤監控與警報

### 可維護性需求
- 模組化程式架構
- 完整的 API 文件
- 版本控制管理

---

## 技術架構

### 前端技術棧
- **React 18 + TypeScript** (現代化前端框架)
- **Material-UI (MUI) v5** (Material Design 3 實現)
- **Firebase SDK v9+** (模組化架構)
- **React Query/TanStack Query** (資料狀態管理)
- **React Hook Form** (表單處理)
- **Material Design Icons** (圖示系統)
- **Framer Motion** (動畫效果)
- **Vite** (快速建置工具)

### 後端技術棧
- Firebase Cloud Functions (Node.js) - 計劃中
- Firestore Database
- Firebase Authentication
- Firebase Hosting

**注意**: 目前使用前端 JavaScript 實現排班邏輯，計劃後續遷移至 Cloud Functions

### 開發工具
- **Vite** (快速建置工具)
- **TypeScript** (型別安全)
- **ESLint + Prettier** (程式碼品質)
- **Material-UI DevTools** (設計系統偵錯)
- **Storybook** (組件開發與文件)
- **Firebase CLI** (後端服務)
- **VS Code** + Material Design 擴充套件
- **Git** 版本控制
- **Vitest** (測試框架，與 Vite 整合)
- **Playwright** (E2E 測試)

---

## 開發時程

### Sprint 1 (2週): 基礎架構
- Firebase 專案設定
- 身份驗證系統
- 基礎 UI 框架
- 員工管理功能

### Sprint 2 (2週): 核心功能
- 請假管理
- 簡化版排班
- 班表檢視
- 手動調整

### Sprint 3 (3週): 智慧演算法
- 完整排班邏輯
- 平衡機制
- 配置管理
- 決策日誌

### Sprint 4 (3週): 進階功能
- 日期範圍排班
- 班次優先級管理
- 假日排班管理（例假日 + 國定假日）
- 班表管理功能
- 員工特殊規則管理
- 換班與代班系統

### Sprint 5 (3週): Material Design UI/UX 實現
- Material Design 3 設計系統整合
- 核心介面重構 (Navigation、Cards、Tables)
- Material Motion 動畫系統
- 響應式設計 (Adaptive Layout)
- 無障礙功能實現

### Sprint 6 (2週): 測試部署
- 單元測試
- 整合測試
- 環境部署
- 監控設定

**總開發時程**: 15 週 (新增換班代班功能需額外時間)

---

## 風險評估

### 技術風險
- **風險**: Cloud Functions 執行時間限制
- **緩解**: 優化演算法，分批處理

- **風險**: 複雜排班邏輯的測試覆蓋
- **緩解**: 建立完整的測試案例

### 業務風險
- **風險**: 排班結果不符合實際需求
- **緩解**: 提供手動調整功能，逐步優化演算法

- **風險**: 系統穩定性問題
- **緩解**: 完善的錯誤處理與監控

---

## 成功指標

### 功能指標
- 排班成功率 > 95%
- 手動調整率 < 10%
- 系統響應時間 < 3 秒

### 使用者指標
- 管理者操作時間減少 50%
- 排班錯誤率降低 80%
- 使用者滿意度 > 4.0/5.0

### 技術指標
- 系統可用性 > 99%
- 測試覆蓋率 > 80%
- 程式碼品質評分 > A

---

## 附錄

### A. 資料模型完整規格
### B. API 文件
### C. UI/UX 設計稿
### D. 測試案例
### E. 超出原PRD的功能清單

#### E.1 已實現的額外功能

##### 日期範圍排班功能
- **功能**: 支援自定義日期範圍的排班
- **實現狀態**: ✅ 已完成
- **技術細節**: 
  - 日期輸入欄位
  - 快速選擇按鈕（下週、下月、自定義）
  - 週末排除選項
  - 預設範圍設定

##### 班次優先級管理
- **功能**: 管理不同班次的優先級和排班策略
- **實現狀態**: ✅ 已完成
- **技術細節**:
  - 主要班次和次要班次分類
  - 班次優先級排序
  - 排班策略選擇

##### 週末排班管理
- **功能**: 週末排班的靈活控制
- **實現狀態**: ✅ 已完成
- **技術細節**:
  - 週末日期識別
  - 週末排除選項
  - 週末排班統計

##### 班表管理功能
- **功能**: 班表的清除和管理操作
- **實現狀態**: ✅ 已完成
- **技術細節**:
  - 清除所有班表
  - 清除指定日期範圍的班表
  - 操作確認機制

#### E.2 計劃中的額外功能

##### 進階班表管理
- **功能**: 更靈活的班表管理功能
- **實現狀態**: 🔄 計劃中
- **計劃功能**:
  - 班表匯出功能
  - 班表比較功能
  - 班表歷史記錄
  - 班表版本控制

##### 演算法穩定性優化
- **功能**: 確保排班演算法的穩定性和可靠性
- **實現狀態**: 🔄 進行中
- **計劃功能**:
  - 錯誤處理機制
  - 演算法超時保護
  - 資料完整性檢查
  - 回滾機制

##### 三級平衡演算法
- **功能**: 實現短期和長期平衡的智能排班
- **實現狀態**: ✅ 已完成設計
- **核心功能**:
  - 候選人篩選（角色、請假、每日上限）
  - 三級平衡排序（當次排班、長期統計、Seed隨機）
  - 統計資料管理（當次排班、長期統計）
  - 可重現的隨機選擇

---

## 3. 使用者介面與體驗 (Material Design 3)

### 3.1 佈局與導航 (Adaptive Layout)
- **手機 (Compact)**: 使用 `Bottom Navigation Bar` 進行主要頁面切換。
- **平板與桌面 (Expanded)**: 使用 `Navigation Rail` 或 `Navigation Drawer`，充分利用大螢幕空間。

### 3.2 核心介面

#### 管理者介面
- **排班日曆 (Schedule Calendar)**
  - 使用 `Material Calendar` 視圖，清晰呈現月/週班表。
  - `Cards` 用於顯示每日班次與人員。
  - `Chips` 標示班次狀態（如：空缺、待補）。
  - `Floating Action Button (FAB)` 用於觸發「執行排班」。
- **員工管理 (Employee Management)**
  - 使用 `Data Table` 顯示員工列表。
  - 透過 `Dialogs` 進行新增/編輯員工與其個人化規則。
- **異動審核 (Approval Dashboard)**
  - 使用 `Lists` 與 `Badges` 顯示待審核的請假、換班、代班申請。
  - 在 `Dialog` 或 `Bottom Sheet` 中顯示詳情並進行操作。
- **假日設定 (Holiday Settings)**
  - 使用 `Date Pickers` 讓管理者能輕易地點選國定假日。
  - `Switches` 用於開關例假日排班。

#### 員工介面
- **我的班表 (My Schedule)**
  - 以 `Material Calendar` 或 `Lists` 檢視個人班表。
  - `Cards` 清晰呈現即將到來的班次資訊。
- **發起申請 (Request Flow)**
  - 透過 `Bottom Sheet` 或全螢幕 `Dialogs` 進行請假、換班、代班申請。
  - `Text Fields`, `Date Pickers`, `Menus` 用於輸入申請資訊。
  - `Snackbars` 提供操作成功或失敗的即時回饋。

### 3.3 互動與動效 (Material Motion)
- **頁面轉場**: 使用 `Container Transform` 和 `Shared Axis` 提供流暢的導航體驗。
- **狀態變化**: 透過 `Elevation` 的變化與 `Ripples` 回饋，提供清晰的互動感知。
- **提示與通知**: 使用 `Snackbars` 和 `Dialogs` 與使用者進行非阻斷式或關鍵性溝通。

---

## 4. 技術與時程

### 4.1 技術棧
- **前端**: React 18 + TypeScript, Material-UI (MUI) v5, Vite。
- **後端**: Firebase (Cloud Functions, Firestore, Authentication)。

### 4.2 開發時程 (預估 15 週)
- **Sprint 1-2 (4週)**: 基礎架構、員工與假日管理。
- **Sprint 3-4 (4週)**: 核心排班演算法與手動調整功能。
- **Sprint 5-6 (4週)**: 請假、換班、代班申請與審核流程。
- **Sprint 7-8 (3週)**: 全面 UI/UX 優化、響應式設計與部署。

## 5. 附錄：精簡後移除的內容
為求PRD精簡，已將下列內容移除，若開發需要可回溯 Git 歷史紀錄：
- 冗長的程式碼範例與技術細節
- 重複的功能描述
- 舊版的UI/UX規劃
- 較不重要的非功能性需求細節
