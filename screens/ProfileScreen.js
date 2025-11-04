// ในไฟล์: screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Image, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { auth, db } from '../firebase';
import { signOut, updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { updateUserProfile } from '../services/UserService';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoUri, setPhotoUri] = useState(user?.photoURL || null);
  const [saving, setSaving] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState(null);
  // ลบการแสดงผลจำนวนสูตรและฉบับร่างออกจากหน้าโปรไฟล์ จึงไม่ต้อง subscribe ตัวนับแล้ว

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตเข้าถึงรูปภาพ');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1, allowsEditing: true });
    if (!result.canceled) {
      const asset = result.assets?.[0];
      const uri = asset?.uri;
      if (uri) {
        try {
          // บีบอัดและเก็บ base64 ไว้รออัปโหลดตอนกดบันทึก
          const processed = await ImageManipulator.manipulateAsync(
            uri,
            [],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          setPhotoUri(processed.uri);
          setAvatarBase64(processed.base64 || null);
          Alert.alert('เลือกรูปแล้ว', 'กดบันทึกเพื่ออัปเดตโปรไฟล์');
        } catch (e) {
          Alert.alert('ผิดพลาด', e.message || 'เตรียมรูปภาพไม่สำเร็จ');
        }
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const isRemote = typeof photoUri === 'string' && /^https?:\/\//i.test(photoUri);

      let params = { displayName };
      if (photoUri && (!isRemote || avatarBase64)) {
        // ถ้าเป็นไฟล์ในเครื่อง หรือมี base64 จากการเลือกรูป ให้ส่งขึ้นไปอัปโหลด
        let uriToUse = photoUri;
        let b64 = avatarBase64;
        if (!b64 && !isRemote) {
          // กรณีผู้ใช้ใส่รูปก่อนหน้า (ไม่มี base64 เก็บไว้) แปลงใหม่
          const processed = await ImageManipulator.manipulateAsync(photoUri, [], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true });
          uriToUse = processed.uri;
          b64 = processed.base64 || null;
          setPhotoUri(uriToUse);
        }
        params.photoUri = uriToUse;
        params.photoBase64 = b64;
      }

      const res = await updateUserProfile(params);
      if (res?.photoURL) setPhotoUri(res.photoURL);
      if (typeof res?.displayName === 'string') setDisplayName(res.displayName);
      setAvatarBase64(null);
      Alert.alert('สำเร็จ', 'บันทึกโปรไฟล์แล้ว');
    } catch (e) {
      Alert.alert('ผิดพลาด', e.message || 'อัปเดตโปรไฟล์ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert("Logout ล้มเหลว", error.message);
    }
  };

  // ไม่มีเมนูลบฉบับร่างแล้ว

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Card */}
      <View style={styles.card}>
        <View style={[styles.header, { marginTop: 0 }] }>
          <TouchableOpacity onPress={pickAvatar}>
            <View style={styles.avatarBox}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} />
              ) : (
                <Ionicons name="person-circle-outline" size={84} color="#bbb" />
              )}
              <View style={styles.camBadge}><Ionicons name="camera" size={14} color="#fff" /></View>
            </View>
          </TouchableOpacity>
          {/* เอาชื่อเล่น/ช่องชื่อแสดงออกจากหน้าโปรไฟล์ */}
          <Text style={styles.emailText}>{auth.currentUser?.email}</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>บันทึกโปรไฟล์</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* ลบการ์ดสถิติ สูตรของฉัน/ฉบับร่าง ออก */}

      {/* Actions Card */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate('HomeStack', { screen: 'MyRecipes', params: { fromProfile: true } })}>
          <View style={styles.rowLeft}>
            <Ionicons name="folder-open-outline" size={18} color="#E27D60" />
            <Text style={styles.rowText}>ดูสูตรของฉัน</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>
        <View style={styles.rowDivider} />
        <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate('HomeStack', { screen: 'CreateRecipe', params: { fromProfile: true } })}>
          <View style={styles.rowLeft}>
            <Ionicons name="add-circle-outline" size={18} color="#E27D60" />
            <Text style={styles.rowText}>โพสต์สูตรอาหาร</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>
        <View style={styles.rowDivider} />
        <TouchableOpacity style={styles.rowItem} onPress={handleLogout}>
          <View style={styles.rowLeft}>
            <Ionicons name="log-out-outline" size={18} color="#d9534f" />
            <Text style={[styles.rowText, { color: '#d9534f' }]}>ออกจากระบบ</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EEE',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  header: { alignItems: 'center', marginTop: 12 },
  avatarBox: { position: 'relative' },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  camBadge: { position: 'absolute', right: -2, bottom: -2, backgroundColor: '#E27D60', borderRadius: 10, padding: 4 },
  nameInput: { marginTop: 10, borderWidth: 1, borderColor: '#DDD', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, width: '80%', backgroundColor: '#fff' },
  emailText: { color: '#666', marginTop: 8 },
  saveBtn: { marginTop: 12, backgroundColor: '#E27D60', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24 },
  saveText: { color: '#fff', fontWeight: 'bold' },
  // ลบสไตล์ที่เกี่ยวกับการ์ดสถิติออก
  rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowText: { marginLeft: 10, color: '#333', fontWeight: '600' },
  rowDivider: { height: 1, backgroundColor: '#EEE' },
});

export default ProfileScreen;
