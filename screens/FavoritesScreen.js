// ในไฟล์: screens/FavoritesScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { listFavoriteRecipeIds } from '../services/FavoritesService';

const FavoritesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      if (!auth.currentUser) { setItems([]); setLoading(false); return; }
      const ids = await listFavoriteRecipeIds();
      const results = [];
      for (const id of ids) {
        const snap = await getDoc(doc(db, 'recipes', id));
        if (snap.exists()) results.push({ id, ...snap.data() });
      }
      setItems(results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  if (loading) return <ActivityIndicator style={styles.center} size="large" />;

  if (!items.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>ยังไม่มีรายการโปรด</Text>
        <Text style={{ color: '#666', marginTop: 6 }}>กดหัวใจที่หน้าสูตรอาหารเพื่อบันทึก</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('HomeStack', { screen: 'RecipeDetail', params: { recipeId: item.id, recipeTitle: item.title || 'รายละเอียดสูตร' } })}>
          <View style={styles.cardImage}>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} /> : null}
          </View>
          <View style={styles.cardText}>
            <Text style={styles.title} numberOfLines={1}>{item.title || 'ไม่มีชื่อสูตร'}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.servings ? `เสิร์ฟ ${item.servings} ที่` : ''}{item.servings && item.timeMinutes ? ' · ' : ''}{item.timeMinutes ? `${item.timeMinutes} นาที` : ''}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  text: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  cardImage: { width: 110, height: 90, backgroundColor: '#eee' },
  cardText: { flex: 1, padding: 10, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 12, color: '#666', marginTop: 2 },
});

export default FavoritesScreen;
