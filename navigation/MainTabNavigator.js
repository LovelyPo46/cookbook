// ในไฟล์: navigation/MainTabNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import HomeStackNavigator from './HomeStackNavigator';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LatestRecipesScreen from '../screens/LatestRecipesScreen';

const Drawer = createDrawerNavigator();

const MainTabNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="HomeStack"
      screenOptions={({ route }) => ({
        // ให้ Drawer แสดง Header เป็นค่าเริ่มต้น (จะซ่อนเฉพาะกรณีหน้าใน Stack ลึกๆ)
        headerTintColor: '#E27D60',
        // เส้นขีดสีฟ้าใต้ Header ของแต่ละหน้าใน Drawer
        headerStyle: { borderBottomColor: '#E27D60', borderBottomWidth: 3 },
        headerShadowVisible: false,
        drawerActiveTintColor: '#E27D60',
        drawerInactiveTintColor: '#999',
        drawerIcon: ({ focused, color, size }) => {
          let iconName = 'ellipse-outline';
          if (route.name === 'HomeStack') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Latest') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Drawer.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeScreen';
          const onHome = routeName === 'HomeScreen';
          return {
            title: 'ค้นหา',
            // แสดง Header ของ Drawer เฉพาะตอนอยู่หน้า HomeScreen
            headerShown: onHome,
            // เอาปุ่มกระดิ่งออก
            headerRight: undefined,
            // ออกจากหน้าซ้อนภายในเมื่อสลับไปเมนูอื่น เพื่อให้กลับมาเริ่มที่ HomeScreen เสมอ
            unmountOnBlur: true,
          };
        }}
        listeners={({ navigation }) => ({
          // เมื่อกดเมนู "ค้นหา" ให้รีเซ็ตให้ไปที่ HomeScreen เสมอ และยกเลิก default
          drawerItemPress: (e) => {
            e.preventDefault();
            navigation.navigate('HomeStack', { screen: 'HomeScreen' });
          },
        })}
      />
      <Drawer.Screen
        name="Latest"
        component={LatestRecipesScreen}
        options={{ title: 'สูตรของฉัน' }}
      />
      <Drawer.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'ของโปรด' }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'โปรไฟล์' }}
      />
    </Drawer.Navigator>
  );
};

export default MainTabNavigator;
