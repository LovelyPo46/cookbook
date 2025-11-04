// ในไฟล์: screens/LoginScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView, // 👈 1. เพิ่ม Import
  Platform              // 👈 2. เพิ่ม Import
} from 'react-native';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Alert.alert("เข้าสู่ระบบล้มเหลว", error.message);
    }
  };

  return (
    // 3. เปลี่ยน View นอกสุดเป็น KeyboardAvoidingView
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // 👈 4. เพิ่ม prop นี้
    >
      <View style={styles.card}>  
      <Text style={styles.appName}>COOKBOOK</Text>
    
      <Text style={styles.title}>เข้าสู่ระบบ</Text>

      <TextInput 
        style={styles.input} 
        placeholder="อีเมล" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address"
      />
      <TextInput 
        style={styles.input} 
        placeholder="รหัสผ่าน" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <TouchableOpacity style={styles.buttonContainer} onPress={handleLogin}>
        <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
      </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.switchText}>ยังไม่มีบัญชี? สมัครสมาชิก</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView> // 👈 5. ปิด Tag
  );
};

// (Styles ไม่มีการเปลี่ยนแปลง)
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 15, 
    backgroundColor: '#F5F2E8'
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    padding: 15,
    borderWidth: 1,
    borderColor: '#DDD'
  },
  title: { 
    fontSize: 22, 
    fontWeight: '600',
    color: '#555',
    textAlign: 'center', 
    marginBottom: 32 
  },
  input: { 
    height: 50, 
    backgroundColor: '#FFFFFF', 
    borderColor: '#DDD', 
    borderWidth: 1, 
    borderRadius: 40,
    marginBottom: 16, 
    paddingHorizontal: 16,
    fontSize: 16,
  },
  buttonContainer: {
    backgroundColor: '#E27D60',
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: { 
    marginTop: 24, 
    color: '#40B5A1',
    textAlign: 'center',
    fontSize: 16
  },
});

export default LoginScreen;