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

const BackButton = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={{ paddingLeft: 4 }}>
    <Ionicons name="chevron-back" size={24} color="#E27D60" />
  </TouchableOpacity>
);

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeScreen"
      screenOptions={({ navigation }) => ({
        headerStyle: { borderBottomColor: '#E27D60', borderBottomWidth: 3 },
        headerTintColor: '#E27D60',
        headerLeftContainerStyle: { paddingLeft: 16 },
        backButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        // ปุ่มย้อนกลับดีฟอลต์
        headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
      })}
    >
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CategoryRecipes"
        component={CategoryRecipesScreen}
        options={({ route }) => ({
          title: route?.params?.title || 'หมวดหมู่',
          headerBackVisible: false,
        })}
      />
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeDetailScreen} 
        options={({ route }) => ({ 
          title: route?.params?.recipeTitle || 'รายละเอียดสูตร',
          headerBackVisible: false,
        })} 
      />
      <Stack.Screen 
        name="CreateRecipe" 
        component={CreateRecipeScreen} 
        options={({ navigation, route }) => ({ 
          title: 'โพสต์สูตรอาหาร',
          headerBackVisible: false,
          // override ดีฟอลต์เพราะมีเงื่อนไข fromProfile
          headerLeft: () => (
            <BackButton
              onPress={() => {
                const fromProfile = route?.params?.fromProfile;
                if (fromProfile) {
                  navigation.getParent()?.navigate('Profile');
                } else {
                  navigation.goBack();
                }
              }}
            />
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
            <BackButton
              onPress={() => {
                const fromProfile = route?.params?.fromProfile;
                if (fromProfile) {
                  navigation.getParent()?.navigate('Profile');
                } else {
                  navigation.goBack();
                }
              }}
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
