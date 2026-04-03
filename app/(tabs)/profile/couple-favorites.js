import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, radius, shadow } from '../../../constants/theme';

const STORAGE_KEY = '@plannie_couple_favorites';

const CATEGORIES = [
  { key: 'restaurants', label: 'Favorite Restaurants', icon: '🍽️', placeholder: 'Add a restaurant…' },
  { key: 'activities',  label: 'Favorite Activities',  icon: '🎯', placeholder: 'Add an activity…' },
  { key: 'addons',      label: 'Favorite Add-ons',     icon: '🌹', placeholder: 'Add an add-on…' },
];

const DEFAULT = { restaurants: [], activities: [], addons: [] };

export default function CoupleFavoritesScreen() {
  const [favorites, setFavorites] = useState(DEFAULT);
  const [inputs, setInputs] = useState({ restaurants: '', activities: '', addons: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => { if (raw) setFavorites(JSON.parse(raw)); })
      .finally(() => setLoading(false));
  }, []);

  const persist = async (updated) => {
    setFavorites(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAdd = async (catKey) => {
    const val = inputs[catKey].trim();
    if (!val) return;
    const updated = { ...favorites, [catKey]: [...favorites[catKey], val] };
    setInputs(prev => ({ ...prev, [catKey]: '' }));
    Keyboard.dismiss();
    await persist(updated);
  };

  const handleRemove = (catKey, index) => {
    Alert.alert(
      'Remove Item',
      `Remove "${favorites[catKey][index]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            const next = [...favorites[catKey]];
            next.splice(index, 1);
            await persist({ ...favorites, [catKey]: next });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}><ActivityIndicator color={colors.gold2} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Couple Favorites</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.hint}>
          Save your go-to spots and ideas — Plannie uses these to inspire your dates ❤️
        </Text>

        {CATEGORIES.map(cat => (
          <View key={cat.key} style={styles.catCard}>

            {/* Category Header */}
            <View style={styles.catHeader}>
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={styles.catTitle}>{cat.label}</Text>
              {favorites[cat.key].length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{favorites[cat.key].length}</Text>
                </View>
              )}
            </View>

            {/* Items */}
            {favorites[cat.key].length === 0 ? (
              <Text style={styles.emptyText}>Nothing saved yet — add your first one!</Text>
            ) : (
              favorites[cat.key].map((item, idx) => (
                <View
                  key={`${item}-${idx}`}
                  style={[
                    styles.favItem,
                    idx < favorites[cat.key].length - 1 && styles.favItemBorder,
                  ]}
                >
                  <Text style={styles.favDot}>•</Text>
                  <Text style={styles.favText} numberOfLines={1}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemove(cat.key, idx)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeBtn}>−</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Add Row */}
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder={cat.placeholder}
                placeholderTextColor={colors.gray3}
                value={inputs[cat.key]}
                onChangeText={val => setInputs(prev => ({ ...prev, [cat.key]: val }))}
                returnKeyType="done"
                onSubmitEditing={() => handleAdd(cat.key)}
              />
              <TouchableOpacity
                style={[styles.addBtn, !inputs[cat.key].trim() && styles.addBtnDisabled]}
                onPress={() => handleAdd(cat.key)}
                activeOpacity={0.8}
                disabled={!inputs[cat.key].trim()}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },

  header: {
    backgroundColor: colors.charcoal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  backArrow: {
    fontSize: 26, color: colors.cream,
    lineHeight: 30, marginLeft: 2,
  },
  headerTitle: {
    fontFamily: fonts.display, fontSize: 22,
    color: colors.cream, flex: 1, textAlign: 'center',
  },

  hint: {
    fontFamily: fonts.body, fontSize: 13,
    color: colors.gray2, textAlign: 'center',
    marginVertical: 24, lineHeight: 20,
  },

  catCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 16,
    ...shadow.sm,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.cream2,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream3,
  },
  catIcon: { fontSize: 18 },
  catTitle: {
    fontFamily: fonts.bodyMedium, fontSize: 14,
    color: colors.charcoal, flex: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(168,132,62,0.15)',
    borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  countText: {
    fontFamily: fonts.bodySemiBold, fontSize: 12,
    color: colors.gold2,
  },

  emptyText: {
    fontFamily: fonts.body, fontSize: 13,
    color: colors.gray3, textAlign: 'center',
    paddingVertical: 16,
  },
  favItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  favItemBorder: {
    borderBottomWidth: 1, borderBottomColor: colors.cream2,
  },
  favDot: { fontSize: 14, color: colors.gold2 },
  favText: {
    fontFamily: fonts.body, fontSize: 14,
    color: colors.charcoal, flex: 1,
  },
  removeBtn: { fontSize: 22, color: colors.rose, lineHeight: 24 },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.cream2,
    backgroundColor: colors.cream,
  },
  addInput: {
    flex: 1,
    fontFamily: fonts.body, fontSize: 14,
    color: colors.charcoal,
    paddingVertical: 6, paddingHorizontal: 4,
  },
  addBtn: {
    backgroundColor: colors.gold2,
    borderRadius: radius.sm,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: {
    fontFamily: fonts.bodyMedium, fontSize: 13,
    color: colors.white,
  },
});