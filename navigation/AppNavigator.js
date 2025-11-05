// ในไฟล์: navigation/AppNavigator.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase'; 

import MainTabNavigator from './MainTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SplashScreen from '../screens/SplashScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [user, setUser] = useState(null);

  // 1. เราจะเปลี่ยน isLoading เป็น 2 ตัวแปร
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [isTimePassed, setIsTimePassed] = useState(false);

  // 2. useEffect (1) - สำหรับ Firebase (เหมือนเดิม)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setIsFirebaseReady(true); // 👈 บอกว่า Firebase พร้อมแล้ว
    });
    return () => unsubscribe(); 
  }, []);

  // 3. useEffect (2) - ตัวตั้งเวลาแบบสั้น (ลดเวลาเพื่อไม่ให้จอดำนาน)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimePassed(true); // 👈 บอกว่าครบ 1.2 วิแล้ว
    }, 1200); // 👈 1.2s พอให้เห็น Splash สั้นๆ

    // เคลียร์ timer เมื่อ component ถูกปิด
    return () => clearTimeout(timer); 
  }, []);


  // 4. ตรวจสอบเงื่อนไข: รอ Splash ชั่วคราว และรอ Firebase พร้อม
  if (!isFirebaseReady || !isTimePassed) {
    return <SplashScreen />; // 👈 ให้โชว์ Splash Screen ต่อไป
  }

  // 5. ถ้าโหลดเสร็จทั้ง 2 อย่าง ค่อยแสดงผลแอป
  return (
    <NavigationContainer>
      <Stack.Navigator key={user ? 'app' : 'auth'} screenOptions={{ headerShown: false }}>
        {user ? (
          // ถ้าล็อกอินแล้ว: แสดงแอปหลัก
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          // ถ้ายังไม่ล็อกอิน: แสดงหน้า Auth
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;