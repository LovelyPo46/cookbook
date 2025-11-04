import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ImageBackground } from 'react-native';
import Constants from 'expo-constants'; 

const SplashScreen = () => {
  return (
    <ImageBackground source={require('../assets/wallpaper.png')} 
      style={styles.container}
      resizeMode="cover" 
    >
      <Text style={styles.logoText}>COOKBOOK</Text>
    </ImageBackground> 
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F2E8', // สีพื้นหลัง
  },
  logoText: {
    fontSize: 48, 
    fontWeight: 'bold',
    color: '#555', //สีตัวหนังสือ cookbook
    marginBottom: 40, 
  },
 
});

export default SplashScreen;