import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// 您的 Firebase 專案設定
// 提示：為了安全，這些金鑰通常會儲存在環境變數中
const firebaseConfig = {
  apiKey: "AIzaSyB4WKGex_INEx0M1fQHv5JWGpDE5NSJRF8",
  authDomain: "auto-scheduler-system-b597a.firebaseapp.com",
  projectId: "auto-scheduler-system-b597a",
  storageBucket: "auto-scheduler-system-b597a.firebasestorage.app",
  messagingSenderId: "97246050987",
  appId: "1:97246050987:web:a5a42b6f89920a052755ee"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 導出 Firebase 服務
export const db = getFirestore(app);
export const auth = getAuth(app);
