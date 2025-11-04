// screens/LatestRecipesScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../firebase';

const LatestRecipesScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          // ซ่อนรายการตัวอย่างทุกหมวด (มี seedKey ใดๆ)
          .filter((x) => !x.seedKey);
        setItems(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

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
