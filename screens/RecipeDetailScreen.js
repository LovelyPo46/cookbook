// ในไฟล์: screens/RecipeDetailScreen.js
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { deleteRecipe } from '../services/RecipeService';
import { Ionicons } from '@expo/vector-icons';
import { subscribeIsFavorite, toggleFavorite } from '../services/FavoritesService';

const RecipeDetailScreen = ({ route, navigation }) => {
  const { recipeId } = route.params; 
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const docRef = doc(db, 'recipes', recipeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRecipe(docSnap.data());
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]); 

  // Watch favorite state
  useEffect(() => {
    if (!recipeId) return;
    const unsub = subscribeIsFavorite(recipeId, setIsFav);
    return () => unsub && unsub();
  }, [recipeId]);

  useLayoutEffect(() => {
    // เจ้าของจริง และไม่ใช่รายการตัวอย่าง (seed)
    const isOwner = !!(recipe && auth.currentUser && recipe.authorId === auth.currentUser.uid && !recipe.seedKey);
    navigation.setOptions({
      headerRight: () => {
        return (
          <View style={{ flexDirection: 'row' }}>
            {/* Favorite toggle for signed-in users */}
            {auth.currentUser ? (
              <TouchableOpacity
                onPress={async () => {
                  try { await toggleFavorite(recipeId); } catch (e) { Alert.alert('ไม่สำเร็จ', e.message || 'เกิดข้อผิดพลาด'); }
                }}
                style={{ marginRight: isOwner ? 16 : 0 }}
                accessibilityLabel="ของโปรด"
              >
                <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color="#E27D60" />
              </TouchableOpacity>
            ) : null}

            {/* Owner actions */}
            {!isOwner ? null : (
              <>
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateRecipe', { editRecipeId: recipeId, recipe })}
              style={{ marginRight: 16 }}
                accessibilityLabel="แก้ไขสูตร"
              >
                <Ionicons name="create-outline" size={22} color="#E27D60" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('ลบสูตรอาหาร', 'ยืนยันลบสูตรนี้หรือไม่?', [
                    { text: 'ยกเลิก', style: 'cancel' },
                    { text: 'ลบ', style: 'destructive', onPress: async () => {
                        try {
                          await deleteRecipe(recipeId);
                          navigation.goBack();
                        } catch (e) {
                          Alert.alert('ลบไม่สำเร็จ', e.message || 'เกิดข้อผิดพลาด');
                        }
                      } },
                  ]);
                }}
                accessibilityLabel="ลบสูตร"
                style={{ marginRight: 16 }}
              >
                <Ionicons name="trash-outline" size={22} color="#E27D60" />
              </TouchableOpacity>
              </>
            )}
          </View>
        );
      },
    });
  }, [recipe, navigation, recipeId, isFav]);

  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  if (!recipe) {
    return <View style={styles.centered}><Text>ไม่พบสูตรอาหาร</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.hero} />
      ) : null}
      <Text style={styles.title}>{recipe.title || 'รายละเอียดสูตร'}</Text>
      {(recipe.servings || recipe.timeMinutes) ? (
        <Text style={styles.meta}>
          {recipe.servings ? `เสิร์ฟ ${recipe.servings} ที่` : ''}
          {recipe.servings && recipe.timeMinutes ? ' · ' : ''}
          {recipe.timeMinutes ? `${recipe.timeMinutes} นาที` : ''}
        </Text>
      ) : null}

      <Text style={styles.subtitle}>ส่วนผสม</Text>
      {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? (
        recipe.ingredients.map((item, index) => (
          <Text key={index} style={styles.listItem}>• {String(item)}</Text>
        ))
      ) : (
        <Text style={styles.muted}>ไม่มีรายการส่วนผสม</Text>
      )}

      <Text style={styles.subtitle}>วิธีทำ</Text>
      {Array.isArray(recipe.steps) && recipe.steps.length > 0 ? (
        recipe.steps.map((st, index) => (
          <View key={index} style={styles.stepBlock}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
              <Text style={styles.stepText}>{st.text}</Text>
            </View>
            {st.imageUrl ? (
              <Image source={{ uri: st.imageUrl }} style={styles.stepImage} />
            ) : null}
          </View>
        ))
      ) : (
        <Text style={styles.muted}>ไม่มีขั้นตอน</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 16 },
  hero: { width: '100%', height: 220, borderRadius: 12, marginBottom: 12, backgroundColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  meta: { fontSize: 14, color: '#666', marginBottom: 16 },
  subtitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  listItem: { fontSize: 16, marginBottom: 4 },
  muted: { fontSize: 14, color: 'gray' },
  stepBlock: { marginBottom: 12 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E27D60', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  stepNumberText: { color: '#fff', fontWeight: 'bold' },
  stepText: { flex: 1, fontSize: 16 },
  stepImage: { width: '100%', height: 180, borderRadius: 10, backgroundColor: '#eee' },
});

export default RecipeDetailScreen;
