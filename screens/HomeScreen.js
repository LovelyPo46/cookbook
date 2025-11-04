// ในไฟล์: screens/HomeScreen.js (restored minimal)
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = React.useState('');

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="gray" style={styles.searchIcon} />
          <TextInput
            placeholder="พิมพ์ชื่อเมนู..."
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
        </View>

        {/* หมวดหมู่: แสดงรายการแบบรูปซ้าย-ชื่อขวา พร้อมจำนวนเมนู */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>หมวดหมู่</Text>
          </View>
          {[
            { title: 'อาหารไทย', cuisine: 'thai', image: require('../assets/thai.jpg') },
            { title: 'อาหารฝรั่ง', cuisine: 'western', image: require('../assets/wentern.jpg') },
            { title: 'ของหวาน', cuisine: 'dessert', image: require('../assets/sweet.jpg') },
            { title: 'อาหารอีสาน', cuisine: 'isan', image: require('../assets/isan.webp') },
            { title: 'อาหารญี่ปุ่น', cuisine: 'japanese', image: require('../assets/japanes.jpg') },
            { title: 'อาหารเกาหลี', cuisine: 'korean', image: require('../assets/korea.jpg') },
            { title: 'อาหารจีน', cuisine: 'chinese', image: require('../assets/chinese.jpg') },
            { title: 'อาหารง่ายๆ', cuisine: 'easy', image: require('../assets/easyfood.webp') },
          ].map((cat, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.cardContainer, styles.categoryCard]}
              onPress={() => navigation.navigate('CategoryRecipes', { title: cat.title, cuisine: cat.cuisine })}
            >
              <View style={[styles.cardImage, { backgroundColor: '#eee' }]}>
                {cat.image ? (
                  <Image source={cat.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : null}
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{cat.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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

// ไม่มีแถวเมนูแนะนำต่อหมวดในเวอร์ชันนี้

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
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    margin: 15,
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16 },

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
