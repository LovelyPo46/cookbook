// screens/CreateRecipeScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { createRecipe } from '../services/RecipeService';

const CreateRecipeScreen = ({ navigation, route }) => {
  const [title, setTitle] = useState('');
  const [servings, setServings] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState([{ text: '', imageUri: null }]);
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cuisine, setCuisine] = useState('thai');
  const editRecipeId = route?.params?.editRecipeId || null;
  const existing = route?.params?.recipe || null;

  const CUISINE_LABELS = {
    thai: 'อาหารไทย',
    western: 'อาหารฝรั่ง',
    dessert: 'ของหวาน',
    isan: 'อาหารอีสาน',
    japanese: 'อาหารญี่ปุ่น',
    korean: 'อาหารเกาหลี',
    chinese: 'อาหารจีน',
    easy: 'อาหารง่ายๆ',
  };
  const CUISINES = Object.keys(CUISINE_LABELS);

  // Prefill if editing
  React.useEffect(() => {
    if (existing) {
      setTitle(existing.title || '');
      setServings(existing.servings ? String(existing.servings) : '');
      setTimeMinutes(existing.timeMinutes ? String(existing.timeMinutes) : '');
      setIngredients(Array.isArray(existing.ingredients) && existing.ingredients.length ? existing.ingredients : ['']);
      setSteps(Array.isArray(existing.steps) && existing.steps.length ? existing.steps.map(s => ({ text: s.text || '', imageUri: s.imageUrl || null })) : [{ text: '', imageUri: null }]);
      setImageUri(existing.imageUrl || null);
      setCuisine(existing.cuisine || 'thai');
      navigation.setOptions?.({ title: 'แก้ไขสูตรอาหาร' });
    }
  }, [existing]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตเข้าถึงรูปภาพ');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      base64: false, // เราอ่านไฟล์ตรงผ่าน FileSystem อยู่แล้ว
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: false,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        try {
          const processed = await ImageManipulator.manipulateAsync(
            uri,
            [],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          const dataUri = processed?.base64 ? `data:image/jpeg;base64,${processed.base64}` : uri;
          setImageUri(dataUri);
        } catch (_) {
          setImageUri(uri);
        }
      }
    }
  };

  const onSubmit = async (draft = false) => {
    if (!title.trim()) return Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณาใส่ชื่ออาหาร');
    const cleanIngredients = ingredients.map(s => (s || '').trim()).filter(Boolean);
    const cleanSteps = steps
      .map(s => ({ text: (s.text || '').trim(), imageUri: s.imageUri || null }))
      .filter(s => s.text || s.imageUri);
    if (cleanIngredients.length === 0) return Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณาใส่วัตถุดิบอย่างน้อย 1 รายการ');
    if (cleanSteps.length === 0) return Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณาใส่วิธีทำอย่างน้อย 1 ขั้นตอน');

    try {
      setLoading(true);
      if (editRecipeId) {
        const { updateRecipe } = await import('../services/RecipeService');
        await updateRecipe(editRecipeId, {
          title,
          imageUri,
          ingredients: cleanIngredients,
          steps: cleanSteps,
          servings,
          timeMinutes,
          isDraft: draft,
          cuisine,
        });
        setLoading(false);
        Alert.alert('สำเร็จ', draft ? 'บันทึกฉบับร่างแล้ว' : 'อัปเดตสูตรอาหารแล้ว');
        if (draft) {
          navigation.goBack();
        } else {
          navigation.replace('RecipeDetail', { recipeId: editRecipeId, recipeTitle: title || 'รายละเอียดสูตร' });
        }
      } else {
        const newId = await createRecipe({
          title,
          imageUri,
          ingredients: cleanIngredients,
          steps: cleanSteps,
          servings,
          timeMinutes,
          isDraft: draft,
          cuisine,
        });
        setLoading(false);
        Alert.alert('สำเร็จ', draft ? 'บันทึกฉบับร่างแล้ว' : 'โพสต์สูตรอาหารแล้ว');
        if (draft) {
          navigation.goBack();
        } else {
          navigation.replace('RecipeDetail', { recipeId: newId, recipeTitle: title || 'รายละเอียดสูตร' });
        }
      }
    } catch (e) {
      setLoading(false);
      Alert.alert('เกิดข้อผิดพลาด', e.message || 'ไม่สามารถบันทึกได้');
    }
  };

  const addIngredient = () => setIngredients(prev => [...prev, '']);
  const removeIngredient = (idx) => setIngredients(prev => prev.filter((_, i) => i !== idx));
  const updateIngredient = (idx, text) => setIngredients(prev => prev.map((v, i) => (i === idx ? text : v)));

  const addStep = () => setSteps(prev => [...prev, { text: '', imageUri: null }]);
  const removeStep = (idx) => setSteps(prev => prev.filter((_, i) => i !== idx));
  const updateStepText = (idx, text) => setSteps(prev => prev.map((s, i) => (i === idx ? { ...s, text } : s)));
  const updateStepImage = async (idx) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตเข้าถึงรูปภาพ');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        try {
          const processed = await ImageManipulator.manipulateAsync(
            uri,
            [],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          const dataUri = processed?.base64 ? `data:image/jpeg;base64,${processed.base64}` : uri;
          setSteps(prev => prev.map((s, i) => (i === idx ? { ...s, imageUri: dataUri } : s)));
        } catch (_) {
          setSteps(prev => prev.map((s, i) => (i === idx ? { ...s, imageUri: uri } : s)));
        }
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#aaa" />
            <Text style={styles.imageHint}>เลือกรูปอาหาร</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="ชื่อสูตรอาหาร"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>หมวดหมู่</Text>
      <View style={styles.cuisineChipsRow}>
        {CUISINES.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.cuisineChip, cuisine === opt && styles.cuisineChipActive]}
            onPress={() => setCuisine(opt)}
          >
            <Text style={[styles.cuisineChipText, cuisine === opt && styles.cuisineChipTextActive]}>
              {CUISINE_LABELS[opt]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row2}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>เสิร์ฟ (ที่)</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น 2"
            keyboardType="number-pad"
            value={servings}
            onChangeText={setServings}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.label}>เวลาที่ใช้ (นาที)</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น 30"
            keyboardType="number-pad"
            value={timeMinutes}
            onChangeText={setTimeMinutes}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>ส่วนผสม</Text>
      {ingredients.map((ing, idx) => (
        <View key={`ing-${idx}`} style={styles.inlineRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder={idx === 0 ? 'เช่น ไข่ไก่ 2 ฟอง' : 'เพิ่มส่วนผสม'}
            value={ing}
            onChangeText={(t) => updateIngredient(idx, t)}
          />
          {ingredients.length > 1 && (
            <TouchableOpacity onPress={() => removeIngredient(idx)} style={styles.iconBtn}>
              <Ionicons name="close" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity onPress={addIngredient} style={styles.addRowBtn}>
        <Ionicons name="add" size={18} color="#E27D60" />
        <Text style={styles.addRowText}>เพิ่มส่วนผสม</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>วิธีทำ</Text>
      {steps.map((st, idx) => (
        <View key={`step-${idx}`} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}><Text style={{ color: '#fff', fontWeight: 'bold' }}>{idx + 1}</Text></View>
            {steps.length > 1 && (
              <TouchableOpacity onPress={() => removeStep(idx)}>
                <Ionicons name="trash-outline" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.stepImage} onPress={() => updateStepImage(idx)}>
            {st.imageUri ? (
              <Image source={{ uri: st.imageUri }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="camera-outline" size={28} color="#aaa" />
                <Text style={{ color: '#999', marginTop: 6 }}>เพิ่มรูปขั้นตอน (ไม่บังคับ)</Text>
              </View>
            )}
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="อธิบายขั้นตอน..."
            value={st.text}
            onChangeText={(t) => updateStepText(idx, t)}
            multiline
          />
        </View>
      ))}
      <TouchableOpacity onPress={addStep} style={styles.addRowBtn}>
        <Ionicons name="add" size={18} color="#E27D60" />
        <Text style={styles.addRowText}>เพิ่มขั้นตอน</Text>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => onSubmit(false)} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>โพสต์</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  imagePicker: {
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHint: {
    marginTop: 8,
    color: '#777',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  label: {
    marginBottom: 6,
    color: '#555',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBtn: {
    marginLeft: 8,
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  addRowText: {
    marginLeft: 6,
    color: '#E27D60',
    fontWeight: '600',
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#EEE',
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E27D60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepImage: {
    height: 140,
    borderRadius: 8,
    backgroundColor: '#F3F3F3',
    overflow: 'hidden',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#E27D60',
    paddingVertical: 14,
    borderRadius: 40,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E27D60',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cuisineChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  cuisineChip: {
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  cuisineChipActive: {
    borderColor: '#E27D60',
    backgroundColor: '#FFE3DB',
  },
  cuisineChipText: {
    color: '#555',
    fontWeight: '600',
  },
  cuisineChipTextActive: {
    color: '#E27D60',
  },
});

export default CreateRecipeScreen;

