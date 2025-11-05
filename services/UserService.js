// services/UserService.js
import { auth, db, storage } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
// 💡 แก้ไข: เปลี่ยน uploadString เป็น uploadBytes
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Use legacy API to support readAsStringAsync/copyAsync on SDK 54+
import * as FileSystem from 'expo-file-system/legacy';
import { updateProfile } from 'firebase/auth';

// 💡 ลบ: เราไม่จำเป็นต้องใช้ BASE64 แล้ว
// const BASE64 = (FileSystem?.EncodingType && FileSystem.EncodingType.Base64) || 'base64';


async function uploadAvatar(uid, source) {
  if (!source) return null;
  const uri = typeof source === 'string' ? source : source.uri;
  // 💡 ลบ: เราจะไม่ใช้ base64Input
  // const base64Input = typeof source === 'object' ? source.base64 : undefined;
  if (!uri) return null;

  const extGuess = uri ? String(uri.split('.').pop() || 'jpg').split('?')[0].toLowerCase() : 'jpg';
  const ext = ['png','webp','jpg','jpeg'].includes(extGuess) ? (extGuess === 'jpeg' ? 'jpg' : extGuess) : 'jpg';
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  try {
    const storageRef = ref(storage, `users/${uid}/avatar.${ext}`);

    // 💡💡💡 นี่คือส่วนแก้ไขหลัก (Blob upload) 💡💡💡
    // (ใช้ logic เดียวกับ RecipeService.js)
    
    let fileUri = uri;
    try {
      if (uri.startsWith('data:')) {
        fileUri = uri;
      } else if (/^(content:\/\/|ph:\/\/)/i.test(uri) || !/^file:\/\//i.test(uri)) {
        const tmp = `${FileSystem.cacheDirectory || ''}avatar_${Date.now()}.${ext}`;
        await FileSystem.copyAsync({ from: uri, to: tmp });
        fileUri = tmp;
      }
    } catch (_) {}

    // 1. แปลง fileUri (ไม่ว่าจะเป็น file:// หรือ data:) ให้เป็น Blob
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    // 2. อัปโหลด Blob โดยใช้ uploadBytes
    await uploadBytes(storageRef, blob);
    
    return await getDownloadURL(storageRef);

  } catch (e) {
    console.error('uploadAvatar error:', e);
    throw new Error(`อัปโหลดรูปไม่สำเร็จ${e?.message ? ': '+e.message : ''}`);
  }
}

export async function updateUserProfile({ displayName, photoUri, photoBase64 }) {
  const user = auth.currentUser;
  if (!user) throw new Error('ยังไม่ได้เข้าสู่ระบบ');

  try {
    let photoURL = user.photoURL || null;

    // 💡 แก้ไข: ลดความซับซ้อนของ logic นี้
    // เราไม่จำเป็นต้องใช้ photoBase64 อีกต่อไป
    if (photoUri) {
      const isRemote = typeof photoUri === 'string' && /^https?:\/\//i.test(photoUri);
      if (isRemote) {
        // เป็น URL อยู่แล้ว ไม่ต้องอัปโหลดซ้ำ (ถ้าไม่เหมือนของเดิม)
        if (photoUri !== user.photoURL) {
           photoURL = photoUri;
        }
      } else {
        // เป็นไฟล์ในเครื่อง หรือ data: URI: อัปโหลดขึ้น Storage
        // 💡 เราส่งแค่ { uri } ก็พอ
        photoURL = await uploadAvatar(user.uid, { uri: photoUri });
      }
    }

    const nameSource = typeof displayName === 'string' ? displayName : (user.displayName || null);
    const newDisplayName = nameSource ? String(nameSource).trim().slice(0, 50) : null;

    await updateProfile(user, {
      displayName: newDisplayName,
      photoURL: photoURL || null,
    });
    // ให้แน่ใจว่า state ของ user อัปเดตแล้ว
    try { await auth.currentUser?.reload?.(); } catch (_) {}

    await setDoc(
      doc(db, 'users', user.uid),
      {
        displayName: newDisplayName,
        photoURL: photoURL || null,
        email: user.email || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { displayName: newDisplayName, photoURL };
  } catch (err) {
    console.error('updateUserProfile error:', err);
    const msg = (err && err.message) ? `อัปเดตโปรไฟล์ไม่สำเร็จ: ${err.message}` : 'อัปเดตโปรไฟล์ไม่สำเร็จ';
    throw new Error(msg);
  }
}