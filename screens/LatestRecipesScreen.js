// screens/LatestRecipesScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { collection, onSnapshot, query, orderBy, where, getDocs, limit as qlimit, startAfter } from 'firebase/firestore';
import { db, auth } from '../firebase';

const LatestRecipesScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'recipes'),
      where('authorId', '==', user.uid),
      where('isDraft', '==', false),
      orderBy('createdAt', 'desc'),
      qlimit(pageSize)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        // [!!] แก้ไขจุดที่ 1: เพิ่ม .filter
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((x) => !x.seedKey); // <-- เพิ่มบรรทัดนี้
        setItems(list);
        setLastDoc(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
        setHasMore(snap.docs.length === pageSize);
        setLoading(false);
      },
      async (err) => {
        // บางสภาพแวดล้อมต้องสร้าง index ก่อน: fallback แบบไม่เรียงเพื่อให้เห็นข้อมูล
        console.warn('LatestRecipes snapshot error:', err?.code, err?.message);
        try {
          const snap = await getDocs(
            query(
              collection(db, 'recipes'),
              where('authorId', '==', user.uid),
              where('isDraft', '==', false),
              qlimit(pageSize)
            )
          );
          // [!!] แก้ไขจุดที่ 2: เพิ่ม .filter (ใน Fallback)
          const list = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((x) => !x.seedKey); // <-- เพิ่มบรรทัดนี้
          setItems(list);
          setLastDoc(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
          setHasMore(snap.docs.length === pageSize);
        } catch (e) {
          Alert.alert('อ่านข้อมูลไม่สำเร็จ', e.message || 'เกิดข้อผิดพลาด');
        } finally {
          setLoading(false);
        }
      }
    );
    return () => unsub();
  }, []);

  const onRefresh = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      setRefreshing(true);
      const snap = await getDocs(
        query(
          collection(db, 'recipes'),
          where('authorId', '==', user.uid),
          where('isDraft', '==', false),
          orderBy('createdAt', 'desc'),
          qlimit(pageSize)
        )
      );
      // [!!] แก้ไขจุดที่ 3: เพิ่ม .filter (ใน onRefresh)
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((x) => !x.seedKey); // <-- เพิ่มบรรทัดนี้
      setItems(list);
      setLastDoc(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
      setHasMore(snap.docs.length === pageSize);
    } catch (e) {
      Alert.alert('รีเฟรชไม่สำเร็จ', e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !hasMore || loadingMore || !lastDoc) return;
    try {
      setLoadingMore(true);
      const snap = await getDocs(
        query(
          collection(db, 'recipes'),
          where('authorId', '==', user.uid),
          where('isDraft', '==', false),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          qlimit(pageSize)
        )
      );
      // [!!] แก้ไขจุดที่ 4: เพิ่ม .filter (ใน loadMore)
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((x) => !x.seedKey); // <-- เพิ่มบรรทัดนี้
      setItems((prev) => [...prev, ...list]);
      setLastDoc(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);
      setHasMore(snap.docs.length === pageSize);
    } catch (e) {
      Alert.alert('โหลดเพิ่มไม่สำเร็จ', e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastDoc]);

  const renderItem = ({ item: r }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('HomeStack', { screen: 'RecipeDetail', params: { recipeId: r.id, recipeTitle: r.title || 'รายละเอียดสูตร' } })}
    >
      <View style={styles.imageBox}>
        {r.imageUrl ? <Image source={{ uri: r.imageUrl }} style={{ width: '100%', height: '100%' }} /> : null}
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title} numberOfLines={1}>{r.title || 'ไม่มีชื่อสูตร'}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {r.servings ? `เสิร์ฟ ${r.servings} ที่` : ''}{r.servings && r.timeMinutes ? ' · ' : ''}{r.timeMinutes ? `${r.timeMinutes} นาที` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(it) => it.id}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListFooterComponent={hasMore ? (
        <TouchableOpacity style={{ paddingVertical: 14, alignItems: 'center' }} onPress={loadMore} disabled={loadingMore}>
          <Text style={{ color: '#E27D60', fontWeight: '600' }}>{loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}</Text>
        </TouchableOpacity>
      ) : null}
      ListEmptyComponent={<Text style={styles.muted}>ยังไม่มีสูตรของฉัน หรือยังไม่ได้เข้าสู่ระบบ</Text>}
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#EEE',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageBox: { width: 120, height: 90, backgroundColor: '#eee' },
  textBox: { flex: 1, padding: 10, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold' },
  meta: { fontSize: 13, color: 'gray', marginTop: 4 },
  muted: { color: 'gray', textAlign: 'center', marginTop: 24 },
});

export default LatestRecipesScreen;