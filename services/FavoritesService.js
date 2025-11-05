// services/FavoritesService.js
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, serverTimestamp, orderBy, limit as qlimit } from 'firebase/firestore';

function favDocRef(uid, recipeId) {
  return doc(db, 'favorites', `${uid}_${recipeId}`);
}

export function subscribeIsFavorite(recipeId, callback) {
  const user = auth.currentUser;
  if (!user) return () => {};
  const ref = favDocRef(user.uid, recipeId);
  const unsub = onSnapshot(ref, (snap) => callback(!!snap.exists()));
  return unsub;
}

export async function toggleFavorite(recipeId) {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบ');
  const ref = favDocRef(user.uid, recipeId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return { favorited: false };
  } else {
    await setDoc(ref, { userId: user.uid, recipeId, createdAt: serverTimestamp() });
    return { favorited: true };
  }
}

export async function listFavoriteRecipeIds(max = 200) {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบ');
  const qy = query(
    collection(db, 'favorites'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc'),
    qlimit(max)
  );
  const snap = await getDocs(qy);
  return snap.docs.map((d) => (d.data() || {}).recipeId).filter(Boolean);
}
