// screens/HomeScreen.js (Modified)
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '../constants/categories';

const HomeScreen = ({ navigation }) => {
  // ลบ: const [searchText, setSearchText] = React.useState('');

  const data = useMemo(() => CATEGORIES, []);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={styles.container}
        data={data}
        keyExtractor={(item) => `${item.cuisine}`}
        ListHeaderComponent={
          <>
            {/* ลบ: Search Bar View ทั้งหมด */}
            
            {/* ปรับ margin ของ Header ให้เหมาะสม */}
            <View style={[styles.sectionHeader, { paddingHorizontal: 15, marginTop: 15 }]}>
              <Text style={styles.sectionTitle}>หมวดหมู่</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <CategoryCard
            title={item.title}
            image={item.image}
            onPress={() => navigation.navigate('CategoryRecipes', { title: item.title, cuisine: item.cuisine })}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 16 }}
      />

      {/* Floating Add Button */}
      <AddButton onPress={() => navigation.navigate('CreateRecipe')} />
    </View>
  );
};

// ปุ่มลอยอยู่มุมขวาล่าง
const AddButton = ({ onPress }) => (
  <TouchableOpacity style={styles.fab} onPress={onPress} accessibilityLabel="เพิ่มสูตรอาหาร">
    <Ionicons name="add" size={28} color="#fff" />
  </TouchableOpacity>
);

const CategoryCard = ({ title, image, onPress }) => (
  <TouchableOpacity style={[styles.cardContainer, styles.categoryCard]} onPress={onPress}>
    <View style={[styles.cardImage, { backgroundColor: '#eee' }]}>
      {image ? (
        <Image source={image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : null}
    </View>
    <View style={styles.cardTextContainer}>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E27D60',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  // ลบ: styles ของ Search Bar
  // searchContainer, searchIcon, searchInput

  // Section
  sectionContainer: { paddingHorizontal: 15, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  // Cards
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 15,
    overflow: 'hidden',
  },
  categoryCard: { height: 90 },
  cardImage: { width: 120, height: '100%' },
  cardTextContainer: { flex: 1, padding: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 12, color: '#666' },
  sectionSubtitle: { fontSize: 12, color: '#666' },
});

export default HomeScreen;