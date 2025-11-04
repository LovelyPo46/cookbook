// services/UserService.js
import { auth, db, storage } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
// Use legacy API to support readAsStringAsync/copyAsync on SDK 54+
import * as FileSystem from 'expo-file-system/legacy';
import { updateProfile } from 'firebase/auth';

const BASE64 = (FileSystem?.EncodingType && FileSystem.EncodingType.Base64) || 'base64';


async function uploadAvatar(uid, source) {
  if (!source) return null;
  const uri = typeof source === 'string' ? source : source.uri;
  const base64Input = typeof source === 'object' ? source.base64 : undefined;
  if (!uri && !base64Input) return null;

  const extGuess = uri ? String(uri.split('.').pop() || 'jpg').split('?')[0].toLowerCase() : 'jpg';
  const ext = ['png','webp','jpg','jpeg'].includes(extGuess) ? (extGuess === 'jpeg' ? 'jpg' : extGuess) : 'jpg';
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  try {
    const storageRef = ref(storage, `users/${uid}/avatar.${ext}`);

    // Preferred path: uploadString with 'base64' (best supported on Expo)
    if (base64Input) {
      await uploadString(storageRef, base64Input, 'base64', { contentType });
      return await getDownloadURL(storageRef);
    }

    if (uri) {
      // Normalize to a readable file:// and read as base64
      let fileUri = uri;
      try {
        if (/^(content:\/\/|ph:\/\/)/i.test(uri) || !/^file:\/\//i.test(uri)) {
          const tmp = `${FileSystem.cacheDirectory || ''}avatar_${Date.now()}.${ext}`;
          await FileSystem.copyAsync({ from: uri, to: tmp });
          fileUri = tmp;
        }
      } catch (_) {}
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: BASE64 });
      await uploadString(storageRef, base64, 'base64', { contentType });
      return await getDownloadURL(storageRef);
    }

    return null;
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
    if (photoBase64) {
      // มี base64 มา ชัวร์สุด: อัปโหลดใหม่
      photoURL = await uploadAvatar(user.uid, { uri: photoUri || null, base64: photoBase64 });
    } else if (photoUri) {
      const isRemote = typeof photoUri === 'string' && /^https?:\/\//i.test(photoUri);
      if (isRemote) {
        // เป็น URL อยู่แล้ว ไม่ต้องอัปโหลดซ้ำ
        photoURL = photoUri;
      } else {
        // เป็นไฟล์ในเครื่อง: อัปโหลดขึ้น Storage
        photoURL = await uploadAvatar(user.uid, { uri: photoUri, base64: null });
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
