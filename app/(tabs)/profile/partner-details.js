import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, radius, shadow } from '../../../constants/theme';

const STORAGE_KEY = '@plannie_partner_details';

const FIELDS = [
  { key: 'name',     label: 'Partner Name',     placeholder: 'e.g. Sarah' },
  { key: 'food',     label: 'Favorite Food',     placeholder: 'e.g. Italian, sushi…' },
  { key: 'flowers',  label: 'Favorite Flowers',  placeholder: 'e.g. Roses, sunflowers…' },
  { key: 'activity', label: 'Favorite Activity', placeholder: 'e.g. Hiking, cooking together…' },
  { key: 'avoid',    label: 'Things to Avoid',   placeholder: 'e.g. Loud restaurants, horror movies…' },
];

export default function PartnerDetailsScreen() {
  const [form, setForm] = useState({
    name: '', food: '', flowers: '', activity: '', avoid: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => { if (raw) setForm(JSON.parse(raw)); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      Alert.alert('Saved ✓', 'Partner details updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Could not save details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold2} />
        </View>
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
        <Text style={styles.headerTitle}>Partner Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.hint}>
          Help Plannie personalise every date idea for your partner 💌
        </Text>

        <View style={styles.card}>
          {FIELDS.map((field, idx) => (
            <View
              key={field.key}
              style={[styles.fieldRow, idx < FIELDS.length - 1 && styles.fieldBorder]}
            >
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder={field.placeholder}
                placeholderTextColor={colors.gray3}
                value={form[field.key]}
                onChangeText={val => setForm(prev => ({ ...prev, [field.key]: val }))}
                returnKeyType={idx < FIELDS.length - 1 ? 'next' : 'done'}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.saveBtnText}>Save Details</Text>
          }
        </TouchableOpacity>

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

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 20,
    ...shadow.sm,
  },
  fieldRow: {
    paddingHorizontal: 16, paddingVertical: 14,
  },
  fieldBorder: {
    borderBottomWidth: 1, borderBottomColor: colors.cream2,
  },
  fieldLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 10,
    letterSpacing: 0.8, textTransform: 'uppercase',
    color: colors.gray2, marginBottom: 5,
  },
  fieldInput: {
    fontFamily: fonts.body, fontSize: 15,
    color: colors.charcoal, paddingVertical: 0,
  },

  saveBtn: {
    backgroundColor: colors.gold2,
    borderRadius: radius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.sm,
  },
  saveBtnText: {
    fontFamily: fonts.bodyMedium, fontSize: 16,
    color: colors.white, letterSpacing: 0.2,
  },
});