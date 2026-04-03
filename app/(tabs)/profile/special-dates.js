import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, radius, shadow } from '../../../constants/theme';

const STORAGE_KEY = '@plannie_special_dates';

export default function SpecialDatesScreen() {
  const [dates, setDates]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => { if (raw) setDates(JSON.parse(raw)); })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    Alert.alert(
      'Remove Special Date',
      'Are you sure you want to remove this special date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            const updated = dates.filter((d) => d.id !== id);
            setDates(updated);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          },
        },
      ]
    );
  }

  function formatDate(str) {
    if (!str) return '';
    const d = new Date(str + 'T00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function daysUntilNextAnniversary(dateStr) {
    if (!dateStr) return null;
    const today = new Date();
    const d = new Date(dateStr + 'T00:00');
    const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    const diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
    return diff === 0 ? '🎉 Today!' : diff === 1 ? 'Tomorrow!' : diff + ' days away';
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}><ActivityIndicator color={colors.gold2} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Special Dates</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
      >
        <Text style={styles.hint}>
          Your most meaningful dates — saved from your plans 💕
        </Text>

        {dates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💍</Text>
            <Text style={styles.emptyTitle}>No special dates yet</Text>
            <Text style={styles.emptySub}>
              When saving a plan, toggle "Mark as special date" to save it here.
            </Text>
          </View>
        ) : (
          dates.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardEmoji}>💍</Text>
                  <View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Countdown */}
              <View style={styles.countdown}>
                <Text style={styles.countdownText}>
                  📅 {daysUntilNextAnniversary(item.date)}
                </Text>
              </View>

              {/* Plan details */}
              {item.planTitle && (
                <View style={styles.planRow}>
                  <Text style={styles.planLabel}>Plan</Text>
                  <Text style={styles.planValue}>{item.planTitle}</Text>
                </View>
              )}
              {item.city && (
                <View style={styles.planRow}>
                  <Text style={styles.planLabel}>Location</Text>
                  <Text style={styles.planValue}>{item.city}</Text>
                </View>
              )}
              {item.vibe && (
                <View style={styles.planRow}>
                  <Text style={styles.planLabel}>Vibe</Text>
                  <Text style={styles.planValue}>{item.vibe}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:  { flex: 1 },

  header: {
    backgroundColor: colors.charcoal,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  backArrow: { fontSize: 26, color: colors.cream, lineHeight: 30, marginLeft: 2 },
  headerTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.cream, flex: 1, textAlign: 'center' },

  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, textAlign: 'center', marginVertical: 24, lineHeight: 20 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.charcoal, marginBottom: 8 },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, textAlign: 'center', lineHeight: 20, maxWidth: 260 },

  card: {
    backgroundColor: colors.white, borderRadius: radius.md,
    marginBottom: 14, overflow: 'hidden', ...shadow.sm,
    borderTopWidth: 3, borderTopColor: colors.rose,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardEmoji: { fontSize: 28 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal },
  cardDate: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 2 },
  deleteBtn: { fontSize: 16, color: colors.gray3 },

  countdown: { backgroundColor: '#FFF5F5', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.cream2 },
  countdownText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.rose },

  planRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.cream2, gap: 12 },
  planLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.gray2, width: 60, textTransform: 'uppercase', letterSpacing: 0.5 },
  planValue: { fontFamily: fonts.body, fontSize: 13, color: colors.charcoal, flex: 1 },
});