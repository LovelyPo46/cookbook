// ในไฟล์ App.js (หรือ index.js)
// 👇 เพิ่มบรรทัดนี้ไว้ "บนสุด" เสมอ
import 'react-native-gesture-handler'; 

// ... import อื่นๆ ของคุณ
import React from 'react';
import AppNavigator from './navigation/AppNavigator';
// ...

export default function App() {
  return <AppNavigator />;
}