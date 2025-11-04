// ในไฟล์: firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // 👈 Firestore
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth"; // 👈 Auth + RN persistence
import { getStorage } from "firebase/storage"; // 👈 เพิ่ม Storage สำหรับอัปโหลดรูป
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
 apiKey: "AIzaSyB3iKFcpoP5Zfjzf1_rpvcjapws9u-VEzQ",
 authDomain: "cookbook-836d7.firebaseapp.com",
 projectId: "cookbook-836d7",
 storageBucket: "cookbook-836d7.appspot.com",
 messagingSenderId: "438103335203",
 appId: "1:438103335203:web:2c6f01a84e5a1c17e96c96"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// export service ที่เราจะใช้
// บน React Native (iOS/Android) ให้ใช้ initializeAuth + AsyncStorage เพื่อให้สถานะล็อกอินถูกจำไว้ระหว่างเปิดแอปใหม่
// บน Web ใช้ getAuth ตามปกติ
export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
export const db = getFirestore(app);
export const storage = getStorage(app);
