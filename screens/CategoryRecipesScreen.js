// screens/CategoryRecipesScreen.js
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, startAfter } from 'firebase/firestore';
// no deletion controls here to avoid confusion; users cannot delete others' data

export default function CategoryRecipesScreen({ route, navigation }) {
  const cuisine = route.params?.cuisine || 'thai';
  const title = route.params?.title || 'หมวดหมู่';
  const maxItems = Number(route.params?.limit) || 50; // ไม่จำกัดแบบเข้ม ให้ค่าใหญ่พอสำหรับการใช้งานทั่วไป
  const seedKey = route.params?.seedKey || null; // ถ้ามีให้กรองเฉพาะชุดที่กำหนด
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const baseCol = collection(db, 'recipes');
    const baseClauses = [
      where('isDraft', '==', false),
      where('cuisine', '==', cuisine),
      orderBy('createdAt', 'desc'),
    ];
    if (seedKey) baseClauses.splice(2, 0, where('seedKey', '==', seedKey));
    const q = query(baseCol, ...baseClauses, limit(maxItems));

    // Fallback loader (no orderBy) for missing index cases
    const loadOnceFallback = async () => {
      try {
        const clauses2 = [where('isDraft','==', false), where('cuisine','==', cuisine)];
        if (seedKey) clauses2.splice(1, 0, where('seedKey','==', seedKey));
        const q2 = query(baseCol, ...clauses2, limit(maxItems));
        const snap = await getDocs(q2);
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLastDoc(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
        setHasMore(snap.docs.length === maxItems);
      } catch (e) {
        Alert.alert('อ่านข้อมูลไม่สำเร็จ', e.message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    };

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(arr);
        setLastDoc(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
        setHasMore(snap.docs.length === maxItems);
        setLoading(false);
      },
      (err) => {
        // แสดงรายละเอียด และลองโหลดแบบไม่ orderBy เพื่อเลี่ยง index
        console.warn('Category query error:', err?.code, err?.message);
        loadOnceFallback();
      }
    );

    return () => unsub();
  }, [cuisine, maxItems, seedKey]);

  // No header delete action; deletion is limited to owners via Profile screen actions.

  if (loading) return <ActivityIndicator style={{ marginTop: 24 }} />;

  const loadMore = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    try {
      setLoadingMore(true);
      const baseCol = collection(db, 'recipes');
      const baseClauses = [
        where('isDraft','==', false),
        where('cuisine','==', cuisine),
        orderBy('createdAt','desc'),
      ];
      if (seedKey) baseClauses.splice(2, 0, where('seedKey','==', seedKey));
      const qMore = query(baseCol, ...baseClauses, startAfter(lastDoc), limit(maxItems));
      const snap = await getDocs(qMore);
      const more = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(prev => [...prev, ...more]);
      setLastDoc(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
      setHasMore(snap.docs.length === maxItems);
    } catch (e) {
      Alert.alert('โหลดเพิ่มไม่สำเร็จ', e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id, recipeTitle: item.title || 'รายละเอียดสูตร' })}
        >
          <View style={styles.imageWrap}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            ) : (
              <View style={[styles.image, { backgroundColor: '#eee' }]} />
            )}
          </View>
          <View style={styles.info}>
            <Text numberOfLines={1} style={styles.title}>{item.title || 'ไม่มีชื่อสูตร'}</Text>
            <Text style={styles.meta}>
              {item.servings ? `เสิร์ฟ ${item.servings} ที่` : ''}{item.servings && item.timeMinutes ? ' · ' : ''}{item.timeMinutes ? `${item.timeMinutes} นาที` : ''}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      ListFooterComponent={hasMore ? (
        <TouchableOpacity style={{ paddingVertical: 12, alignItems: 'center' }} onPress={loadMore} disabled={loadingMore}>
          <Text style={{ color: '#E27D60', fontWeight: '600' }}>{loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}</Text>
        </TouchableOpacity>
      ) : null}
      ListEmptyComponent={<Text>ยังไม่มีสูตรในหมวดนี้</Text>}
    />
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', elevation: 1 },
  imageWrap: { width: 100, height: 100 },
  image: { width: '100%', height: '100%' },
  info: { flex: 1, padding: 10 },
  title: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#666', marginTop: 4 },
});
