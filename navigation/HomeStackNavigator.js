// ในไฟล์: navigation/HomeStackNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import CreateRecipeScreen from '../screens/CreateRecipeScreen';
import LatestRecipesScreen from '../screens/LatestRecipesScreen';
import CategoryRecipesScreen from '../screens/CategoryRecipesScreen';

const Stack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{
        // เส้นขีดสีฟ้าใต้ Header ของหน้าที่อยู่ใน Home Stack
        headerStyle: { borderBottomColor: '#E27D60', borderBottomWidth: 3 },
        headerTintColor: '#E27D60',
        headerLeftContainerStyle: { paddingLeft: 16 },
        // iOS: แสดงปุ่มย้อนกลับแบบไอคอนอย่างเดียว (ไม่มีข้อความ)
        backButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CategoryRecipes"
        component={CategoryRecipesScreen}
        options={({ route, navigation }) => ({
          title: route?.params?.title || 'หมวดหมู่',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#E27D60" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeDetailScreen} 
        options={({ route, navigation }) => ({ 
          title: route?.params?.recipeTitle || 'รายละเอียดสูตร',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: 4 }}>
              <Ionicons name="chevron-back" size={24} color="#E27D60" />
            </TouchableOpacity>
          ),
        })} 
      />
      <Stack.Screen 
        name="CreateRecipe" 
        component={CreateRecipeScreen} 
        options={({ navigation, route }) => ({ 
          title: 'โพสต์สูตรอาหาร',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                const fromProfile = route?.params?.fromProfile;
                if (fromProfile) {
                  navigation.getParent()?.navigate('Profile');
                } else {
                  navigation.goBack();
                }
              }}
              style={{ paddingLeft: 4 }}
            >
              <Ionicons name="chevron-back" size={24} color="#E27D60" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="MyRecipes"
        component={LatestRecipesScreen}
        options={({ navigation, route }) => ({ 
          title: 'สูตรของฉัน',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                const fromProfile = route?.params?.fromProfile;
                if (fromProfile) {
                  navigation.getParent()?.navigate('Profile');
                } else {
                  navigation.goBack();
                }
              }}
              style={{ paddingLeft: 4 }}
            >
              <Ionicons name="chevron-back" size={24} color="#E27D60" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
