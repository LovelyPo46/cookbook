// ในไฟล์: screens/RegisterScreen.js
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
import { createUserWithEmailAndPassword } from 'firebase/auth';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Alert.alert("สมัครสมาชิกล้มเหลว", error.message);
    }
  };

  return (
    // 3. เปลี่ยน View นอกสุดเป็น KeyboardAvoidingView
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // 👈 4. เพิ่ม prop นี้
    >
      <View style={styles.card}>  
      <Text style={styles.title}>สร้างบัญชีใหม่</Text>

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
        placeholder="รหัสผ่าน (6+ ตัวอักษร)" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <TouchableOpacity style={styles.buttonContainer} onPress={handleRegister}>
        <Text style={styles.buttonText}>สมัครสมาชิก</Text>
      </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.switchText}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Text>
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
    marginBottom: 32,
    marginTop: 10
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
    backgroundColor: '#40B5A1', // สีฟ้าอมเขียว
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
    color: '#E27D60', 
    textAlign: 'center',
    fontSize: 16
  },
});

export default RegisterScreen;