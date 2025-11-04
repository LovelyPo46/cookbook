// services/MigrationService.js
import { auth, db } from '../firebase';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { Image } from 'react-native';

// Static asset placeholders for cuisines
const PLACEHOLDERS = {
  thai: Image.resolveAssetSource(require('../assets/thai.jpg')).uri,
  western: Image.resolveAssetSource(require('../assets/wentern.jpg')).uri, // ชื่อไฟล์ในโฟลเดอร์เป็น wentern.jpg
  dessert: Image.resolveAssetSource(require('../assets/sweet.jpg')).uri,
  isan: Image.resolveAssetSource(require('../assets/isan.webp')).uri,
  japanese: Image.resolveAssetSource(require('../assets/japanes.jpg')).uri, // ชื่อไฟล์ japanes.jpg
  korean: Image.resolveAssetSource(require('../assets/korea.jpg')).uri,
  chinese: Image.resolveAssetSource(require('../assets/chinese.jpg')).uri,
  easy: Image.resolveAssetSource(require('../assets/easyfood.webp')).uri,
};

function pickPlaceholder(cuisine) {
  return PLACEHOLDERS[(cuisine || '').toLowerCase()] || PLACEHOLDERS.western;
}

function normalizeIngredients(ingredients) {
  if (!Array.isArray(ingredients)) return [];
  return ingredients.map((it) => {
    if (typeof it === 'string') return it.trim();
    if (it && typeof it === 'object') {
      const name = (it.name || it.item || '').toString().trim();
      const amount = (it.amount || it.qty || '').toString().trim();
      return [name, amount].filter(Boolean).join(' ').trim();
    }
    return '';
  }).filter(Boolean);
}

function normalizeSteps(steps, fallbackInstructions) {
  let list = [];
  if (Array.isArray(steps) && steps.length) list = steps;
  else if (Array.isArray(fallbackInstructions) && fallbackInstructions.length) list = fallbackInstructions;

  return list
    .map((s, i) => {
      if (s && typeof s === 'object' && (s.text || s.imageUrl)) {
        return { order: s.order ? Number(s.order) : i + 1, text: String(s.text || '').trim(), imageUrl: s.imageUrl || null };
      }
      // string
      return { order: i + 1, text: String(s || '').replace(/^\d+\.?\s*/, '').trim(), imageUrl: null };
    })
    .filter((x) => x.text);
}

export async function fixRecipes({ onlyMine = true } = {}) {
  const user = auth.currentUser;
  if (onlyMine && !user) throw new Error('ต้องเข้าสู่ระบบก่อน');

  const baseQ = [collection(db, 'recipes')];
  if (onlyMine) baseQ.push(where('authorId', '==', user.uid));
  const snap = await getDocs(query(...baseQ));
  if (snap.empty) return { scanned: 0, updated: 0 };

  let batch = writeBatch(db);
  let ops = 0;
  let updated = 0;
  snap.forEach((d) => {
    const r = d.data() || {};
    const patch = {};
    // titleLower
    const t = (r.title || '').toString().trim();
    if (t && r.titleLower !== t.toLowerCase()) patch.titleLower = t.toLowerCase();
    // imageUrl
    if (!r.imageUrl) patch.imageUrl = pickPlaceholder(r.cuisine);
    // ingredients
    if (!Array.isArray(r.ingredients) || (r.ingredients.length && typeof r.ingredients[0] !== 'string')) {
      const norm = normalizeIngredients(r.ingredients);
      if (norm.length) patch.ingredients = norm;
    }
    // steps/instructions
    if (!Array.isArray(r.steps) || r.steps.length === 0 || typeof r.steps[0] !== 'object') {
      const normSteps = normalizeSteps(r.steps, r.instructions);
      if (normSteps.length) patch.steps = normSteps;
    }

    if (Object.keys(patch).length > 0) {
      batch.update(doc(db, 'recipes', d.id), patch);
      ops++;
      updated++;
      if (ops >= 400) {
        // commit chunk
        // Note: Cannot await inside forEach; this is acceptable for current dataset sizes, but keep chunking safeguard
      }
    }
  });
  await batch.commit();
  return { scanned: snap.size, updated };
}
