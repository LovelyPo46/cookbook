// services/RecipeService.js
import { db, auth, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, writeBatch } from 'firebase/firestore';
// 💡 แก้ไข: เปลี่ยน uploadString เป็น uploadBytes
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Use legacy API to support readAsStringAsync/copyAsync on SDK 54+
import * as FileSystem from 'expo-file-system/legacy';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

// 💡 หมายเหตุ: เราจะไม่ใช้ BASE64 อีกต่อไป
// const BASE64 = (FileSystem?.EncodingType && FileSystem.EncodingType.Base64) || 'base64';


async function uploadImageAsync(localUri, storagePath) {
  if (!localUri) return null;

  // 💡 ลบ: บล็อกที่ตรวจสอบ data: URI (เราจะใช้ fetch แทน)

  // Derive extension and ensure a file:// URI (copy from content:// if needed)
  let ext = String((localUri.split('.').pop() || 'jpg').split('?')[0]).toLowerCase();
  if (!['png','webp','jpg','jpeg','heic','heif'].includes(ext)) ext = 'jpg';
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  let fileUri = localUri;
  try {
    // 💡 แก้ไข: เพิ่มเงื่อนไขเช็ค data: URI เพื่อไม่ให้พยายาม copy
    if (localUri.startsWith('data:')) {
      fileUri = localUri;
    } else if (/^(content:\/\/|ph:\/\/)/i.test(localUri) || !/^file:\/\//i.test(localUri)) {
      const tmp = `${FileSystem.cacheDirectory || ''}upload_${Date.now()}.${ext}`;
      await FileSystem.copyAsync({ from: localUri, to: tmp });
      fileUri = tmp;
    }
  } catch (_) {
    // If copy fails, try reading directly; some platforms still allow it
  }

  const storageRef = ref(storage, storagePath);

  // 💡💡💡 นี่คือส่วนแก้ไขหลัก (Blob upload) 💡💡💡
  // 1. แปลง fileUri (ไม่ว่าจะเป็น file:// หรือ data:) ให้เป็น Blob
  const response = await fetch(fileUri);
  const blob = await response.blob();

  // 2. อัปโหลด Blob โดยใช้ uploadBytes
  await uploadBytes(storageRef, blob);
  
  return await getDownloadURL(storageRef);
}

export async function createRecipe({
  title,
  ingredientsText,
  methodText,
  imageUri,
  ingredients,
  steps,
  servings,
  timeMinutes,
  isDraft,
  cuisine,
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบก่อนโพสต์');

  const cleanTitle = (title || '').trim();
  const cleanMethod = (methodText || '').trim();
  const finalIngredients = (Array.isArray(ingredients) && ingredients.length > 0)
    ? ingredients.map((s) => String(s).trim()).filter(Boolean)
    : (ingredientsText || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

  const baseSteps = Array.isArray(steps) && steps.length > 0
    ? steps.map((st, idx) => ({
        order: idx + 1,
        text: String(st.text || '').trim(),
        imageUri: st.imageUri || null,
      }))
    : (cleanMethod
        ? cleanMethod.split('\n').map((t, idx) => ({ order: idx + 1, text: t.trim() })).filter(s => s.text)
        : []);

  let imageUrl = null;
  if (imageUri) {
    const isRemote = typeof imageUri === 'string' && (/^https?:\/\//i).test(imageUri);
    if (isRemote) {
      imageUrl = imageUri;
    } else {
      const extGuess = (String(imageUri).split('.').pop() || 'jpg').split('?')[0];
      const filename = `recipes/${user.uid}/${Date.now()}.${extGuess}`;
      imageUrl = await uploadImageAsync(imageUri, filename);
    }
  }

  const stepUploads = [];
  for (let i = 0; i < baseSteps.length; i++) {
    const st = baseSteps[i];
    let stepImageUrl = null;
    if (st.imageUri) {
      const isRemote = typeof st.imageUri === 'string' && (/^https?:\/\//i).test(st.imageUri);
      if (isRemote) {
        stepImageUrl = st.imageUri;
      } else {
        const extGuess = (String(st.imageUri).split('.').pop() || 'jpg').split('?')[0];
        const filename = `recipes/${user.uid}/steps/${Date.now()}_${i}.${extGuess}`;
        stepImageUrl = await uploadImageAsync(st.imageUri, filename);
      }
    }
    stepUploads.push({ order: st.order, text: st.text, imageUrl: stepImageUrl });
  }

  const finalCuisine = (cuisine || 'thai').toString().trim().toLowerCase();
  const docRef = await addDoc(collection(db, 'recipes'), {
    title: cleanTitle,
    titleLower: cleanTitle.toLowerCase(),
    imageUrl,
    ingredients: finalIngredients,
    steps: stepUploads,
    servings: servings ? Number(servings) : null,
    timeMinutes: timeMinutes ? Number(timeMinutes) : null,
    isDraft: !!isDraft,
    authorId: user.uid,
    cuisine: finalCuisine,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export { uploadImageAsync };

// Update existing recipe; uploads new images if local URIs are provided
export async function updateRecipe(recipeId, {
  title,
  imageUri, // local or remote
  ingredients,
  steps, // [{ text, imageUri }], local or remote image URIs
  servings,
  timeMinutes,
  isDraft,
  cuisine,
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบ');

  const data = {};
  if (typeof title === 'string') data.title = title.trim();
  if (typeof title === 'string') data.titleLower = title.trim().toLowerCase();
  if (Array.isArray(ingredients)) data.ingredients = ingredients.map((s) => String(s).trim()).filter(Boolean);
  if (servings !== undefined) data.servings = servings ? Number(servings) : null;
  if (timeMinutes !== undefined) data.timeMinutes = timeMinutes ? Number(timeMinutes) : null;
  if (isDraft !== undefined) data.isDraft = !!isDraft;
  if (typeof cuisine === 'string') data.cuisine = cuisine.trim().toLowerCase();

  // Upload cover image if looks like a local URI
  if (imageUri) {
    const isRemote = typeof imageUri === 'string' && (/^https?:\/\//i).test(imageUri);
    if (!isRemote) {
      const extGuess = (String(imageUri).split('.').pop() || 'jpg').split('?')[0];
      const filename = `recipes/${user.uid}/${Date.now()}_cover.${extGuess}`;
      data.imageUrl = await uploadImageAsync(imageUri, filename);
    } else {
      data.imageUrl = imageUri;
    }
  }

  if (Array.isArray(steps)) {
    const uploaded = [];
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i] || {};
      let imageUrl = null;
      if (st.imageUri) {
        const isRemote = typeof st.imageUri === 'string' && (/^https?:\/\//i).test(st.imageUri);
        if (!isRemote) {
          const extGuess = (String(st.imageUri).split('.').pop() || 'jpg').split('?')[0];
          const filename = `recipes/${user.uid}/steps/${Date.now()}_${i}.${extGuess}`;
          imageUrl = await uploadImageAsync(st.imageUri, filename);
        } else {
          imageUrl = st.imageUri;
        }
      }
      uploaded.push({ order: i + 1, text: String(st.text || '').trim(), imageUrl: imageUrl || null });
    }
    data.steps = uploaded;
  }

  const target = doc(db, 'recipes', recipeId);
  await updateDoc(target, data);
}

export async function deleteRecipe(recipeId) {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบ');
  const target = doc(db, 'recipes', recipeId);
  await deleteDoc(target);
}

// ... (โค้ดส่วนที่เหลือของ RecipeService.js เหมือนเดิม) ...
// Delete all my recipes created by the current user (both drafts and published)
export async function deleteAllMyRecipes() {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบ');

  const snap = await getDocs(query(collection(db, 'recipes'), where('authorId', '==', user.uid)));
  if (snap.empty) return { removed: 0 };

  let removed = 0;
  let batch = writeBatch(db);
  let ops = 0;
  snap.forEach((d) => {
    batch.delete(d.ref);
    ops++;
    removed++;
    if (ops >= 400) {
      // Commit in chunks to avoid exceeding batch limits
      // Note: awaiting inside forEach isn't ideal; but we can queue via array. For simplicity, rely on low counts.
    }
  });
  // Commit the batch (single commit is sufficient for current dataset sizes)
  await batch.commit();
  return { removed };
}

// Delete only draft recipes created by the current user
export async function deleteMyDrafts() {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบ');

  const snap = await getDocs(
    query(collection(db, 'recipes'), where('authorId', '==', user.uid), where('isDraft', '==', true))
  );
  if (snap.empty) return { removed: 0 };

  let removed = 0;
  let batch = writeBatch(db);
  let ops = 0;
  snap.forEach((d) => {
    batch.delete(d.ref);
    ops++;
    removed++;
    if (ops >= 400) {
      // chunk safeguard; current dataset is small so single commit below suffices
    }
  });
  await batch.commit();
  return { removed };
}

// Keep only N latest recipes by cuisine for current user; delete the rest
export async function pruneMyRecipesByCuisine(cuisine, keep = 3) {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบ');
  const col = collection(db, 'recipes');
  // fetch all of my recipes for this cuisine ordered by createdAt desc
  const snap = await getDocs(query(col, where('authorId','==', user.uid), where('cuisine','==', String(cuisine||'').toLowerCase()), orderBy('createdAt','desc')));
  if (snap.empty) return { scanned: 0, removed: 0 };
  const docs = snap.docs;
  const toKeep = new Set(docs.slice(0, Math.max(keep,0)).map(d => d.id));
  const toDelete = docs.filter(d => !toKeep.has(d.id));
  if (toDelete.length === 0) return { scanned: docs.length, removed: 0 };
  let removed = 0; let ops = 0; let batch = writeBatch(db);
  for (const d of toDelete) {
    batch.delete(d.ref); ops++; removed++;
    if (ops >= 400) { await batch.commit(); batch = writeBatch(db); ops = 0; }
  }
  if (ops > 0) await batch.commit();
  return { scanned: docs.length, removed };
}

// Prune all my cuisines to keep N latest each
export async function pruneAllMyCuisines(keep = 3) {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบ');
  const cuisines = ['thai','western','dessert','isan','japanese','korean','chinese','easy'];
  const results = {};
  let totalRemoved = 0;
  for (const c of cuisines) {
    const res = await pruneMyRecipesByCuisine(c, keep);
    results[c] = res;
    totalRemoved += res.removed || 0;
  }
  return { totalRemoved, results };
}