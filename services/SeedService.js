// services/SeedService.js
import { auth, db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp, getDocs, query, where, writeBatch } from 'firebase/firestore';
const recipes = require('../seed/recipes.thai.json');

function slugifyTitle(s) {
  const t = String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
  return t || Math.random().toString(36).slice(2);
}

export async function seedThaiRecipes() {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบก่อนจึงจะเพิ่มข้อมูลตัวอย่างได้');

  const createdIds = [];
  const seedKey = 'thai-v1';

  for (const r of recipes) {
    const slug = slugifyTitle(r.title);
    const id = `${user.uid}_${seedKey}_${slug}`;
    const target = doc(db, 'recipes', id);
    await setDoc(target, {
      title: String(r.title || '').trim(),
      titleLower: String(r.title || '').trim().toLowerCase(),
      imageUrl: r.imageUrl || null,
      ingredients: Array.isArray(r.ingredients) ? r.ingredients.map(String) : [],
      steps: Array.isArray(r.steps)
        ? r.steps.map((s, i) => ({
            order: i + 1,
            text: String(s.text || ''),
            imageUrl: s.imageUrl || null,
          }))
        : [],
      servings: r.servings ?? null,
      timeMinutes: r.timeMinutes ?? null,
      isDraft: false,
      authorId: user.uid,
      cuisine: (r.cuisine || 'thai').toLowerCase(),
      seedKey,
      createdAt: serverTimestamp(),
    }, { merge: true });
    createdIds.push(id);
  }
  return createdIds;
}

export async function cleanupThaiSeed() {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบก่อน');
  const uid = user.uid;

  const titles = recipes.map((r) => String(r.title || '').trim()).filter(Boolean);

  // ดึงสูตรทั้งหมดของผู้ใช้ แล้วลบเฉพาะที่เป็น seed หรือชื่ออยู่ในชุดตัวอย่าง
  const snap = await getDocs(query(collection(db, 'recipes'), where('authorId', '==', uid)));

  const batch = writeBatch(db);
  let count = 0;
  snap.forEach((d) => {
    const x = d.data() || {};
    const isSeed = x.seedKey === 'thai-v1' || titles.includes(String(x.title || '').trim());
    if (isSeed) {
      batch.delete(d.ref);
      count++;
    }
  });
  if (count === 0) return { removed: 0 };
  await batch.commit();
  return { removed: count };
}

// ---- Generic multi-category seeding ----
const CATEGORY_CONFIGS = {
  western: { key: 'western-v1', count: 10 },
  dessert: { key: 'dessert-v1', count: 15 },
  isan: { key: 'isan-v1', count: 10 },
  japanese: { key: 'japanese-v1', count: 10 },
  korean: { key: 'korean-v1', count: 10 },
  chinese: { key: 'chinese-v1', count: 10 },
  easy: { key: 'easy-v1', count: 10 },
};

function sampleTitles(cuisine) {
  const map = {
    western: ['Spaghetti Carbonara','Caesar Salad','Grilled Chicken','Fish and Chips','Beef Steak','Mashed Potatoes','Pancakes','Tomato Soup','Garlic Bread','Roasted Vegetables'],
    dessert: ['Chocolate Cake','Cheesecake','Brownies','Tiramisu','Apple Pie','Panna Cotta','Creme Brulee','Donuts','Ice Cream Sundae','Fruit Tart','Banana Bread','Cupcakes','Mango Sticky Rice','Waffles','Cookies'],
    isan: ['ส้มตำปลาร้า','ลาบหมู','ไก่ย่าง','น้ำตกหมู','ต้มแซ่บกระดูกอ่อน','ซุปหน่อไม้','ข้าวเหนียว ไก่ย่าง','แจ่วปลาร้า','ก้อยเนื้อ','ไส้กรอกอีสาน'],
    japanese: ['Sushi','Ramen','Tempura','Chicken Teriyaki','Okonomiyaki','Miso Soup','Gyoza','Udon','Katsudon','Yakisoba'],
    korean: ['Kimchi Fried Rice','Bibimbap','Tteokbokki','Bulgogi','Japchae','Kimchi Jjigae','Sundubu Jjigae','Kimbap','Korean Fried Chicken','Samgyeopsal'],
    chinese: ['Fried Rice','Sweet and Sour Pork','Mapo Tofu','Kung Pao Chicken','Dumplings','Hot and Sour Soup','Chow Mein','Spring Rolls','Steamed Fish','Wonton Soup'],
    easy: ['ไข่เจียว','ข้าวผัดไข่','ขนมปังกระเทียม','สลัดทูน่า','ผัดผักรวม','มาม่าผัดไข่','แซนด์วิชชีส','ข้าวโพดเนย','สมูทตี้กล้วย','โยเกิร์ตพาร์เฟต์'],
  };
  return map[cuisine] || [];
}

function sampleImage(cuisine) {
  const images = {
    western: 'https://images.unsplash.com/photo-1521389508051-d7ffb5dc8bbf?w=1200&q=60&auto=format&fit=crop',
    dessert: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1200&q=60&auto=format&fit=crop',
    isan: 'https://images.unsplash.com/photo-1609710228159-0f2a7bc01db3?w=1200&q=60&auto=format&fit=crop',
    japanese: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=60&auto=format&fit=crop',
    korean: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=60&auto=format&fit=crop',
    chinese: 'https://images.unsplash.com/photo-1543352634-873278f4d7b5?w=1200&q=60&auto=format&fit=crop',
    easy: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=60&auto=format&fit=crop',
  };
  return images[cuisine] || images.western;
}

export async function seedCategory(cuisine) {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบก่อน');
  const cfg = CATEGORY_CONFIGS[cuisine];
  if (!cfg) throw new Error('ไม่มีหมวดนี้');
  const titles = sampleTitles(cuisine).slice(0, cfg.count);
  const created = [];
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const id = `${user.uid}_${cfg.key}_${i+1}`;
    const target = doc(db, 'recipes', id);
    await setDoc(target, {
      title,
      titleLower: title.toLowerCase(),
      imageUrl: sampleImage(cuisine),
      ingredients: ['วัตถุดิบ A','วัตถุดิบ B','วัตถุดิบ C'],
      steps: [
        { order: 1, text: 'เตรียมวัตถุดิบ', imageUrl: null },
        { order: 2, text: 'ปรุงตามขั้นตอน', imageUrl: null },
        { order: 3, text: 'จัดเสิร์ฟ', imageUrl: null },
      ],
      servings: 2,
      timeMinutes: 20,
      isDraft: false,
      authorId: user.uid,
      cuisine,
      seedKey: cfg.key,
      createdAt: serverTimestamp(),
    }, { merge: true });
    created.push(id);
  }
  return created;
}

export async function cleanupCategory(cuisine) {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบก่อน');
  const cfg = CATEGORY_CONFIGS[cuisine];
  if (!cfg) throw new Error('ไม่มีหมวดนี้');
  const snap = await getDocs(query(collection(db, 'recipes'), where('authorId','==', user.uid), where('seedKey','==', cfg.key)));
  if (snap.empty) return { removed: 0 };
  const batch = writeBatch(db);
  snap.forEach((d)=> batch.delete(d.ref));
  await batch.commit();
  return { removed: snap.size };
}

export async function seedAllCategories() {
  // รวมไทยด้วย
  await seedThaiRecipes();
  const keys = Object.keys(CATEGORY_CONFIGS);
  let total = 0;
  for (const k of keys) {
    const res = await seedCategory(k);
    total += res.length;
  }
  return { total };
}

export async function cleanupAllCategories() {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบก่อน');
  let total = 0;
  // ไทย
  const snapThai = await getDocs(query(collection(db, 'recipes'), where('authorId','==', user.uid), where('seedKey','==','thai-v1')));
  if (!snapThai.empty) {
    const batch = writeBatch(db);
    snapThai.forEach((d)=> batch.delete(d.ref));
    await batch.commit();
    total += snapThai.size;
  }
  // อื่นๆ
  for (const k of Object.keys(CATEGORY_CONFIGS)) {
    const cfg = CATEGORY_CONFIGS[k];
    const snap = await getDocs(query(collection(db, 'recipes'), where('authorId','==', user.uid), where('seedKey','==', cfg.key)));
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach((d)=> batch.delete(d.ref));
      await batch.commit();
      total += snap.size;
    }
  }
  // ล้างตัวอย่างเก่าที่ไม่มี seedKey แต่ชื่ออยู่ในชุดตัวอย่าง
  const thaiTitles = (recipes || []).map((r) => String(r.title || '').trim()).filter(Boolean);
  const otherTitles = Object.keys(CATEGORY_CONFIGS).flatMap((k) => sampleTitles(k));
  const titleSet = new Set([...thaiTitles, ...otherTitles].map((s) => String(s).trim()));
  const allSnap = await getDocs(query(collection(db, 'recipes'), where('authorId','==', user.uid)));
  if (!allSnap.empty) {
    const batch = writeBatch(db);
    let c = 0;
    allSnap.forEach((d) => {
      const x = d.data() || {};
      if (!x.seedKey && titleSet.has(String(x.title || '').trim())) {
        batch.delete(d.ref);
        c++;
      }
    });
    if (c > 0) {
      await batch.commit();
      total += c;
    }
  }
  return { removed: total };
}

// Delete my recipes by cuisine (owner-only)
export async function deleteMyRecipesByCuisine(cuisine) {
  const user = auth.currentUser;
  if (!user) throw new Error('ต้องเข้าสู่ระบบก่อน');
  const snap = await getDocs(
    query(
      collection(db, 'recipes'),
      where('authorId','==', user.uid),
      where('cuisine','==', String(cuisine || '').toLowerCase())
    )
  );
  if (snap.empty) return { removed: 0 };
  const batch = writeBatch(db);
  snap.forEach((d)=> batch.delete(d.ref));
  await batch.commit();
  return { removed: snap.size };
}
