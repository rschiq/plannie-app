import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
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

  // ✅ Fixed: zero out today's time so "today" doesn't compare as > midnight
  function daysUntilNextAnniversary(dateStr) {
    if (!dateStr) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);  // ← KEY FIX: compare date-only, not datetime

    const d    = new Date(dateStr + 'T00:00');
    const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());

    // Only roll to next year if the date is strictly in the past
    if (next < today) next.setFullYear(today.getFullYear() + 1);

    const diff = Math.round((next - today) / (1000 * 60 * 60 * 24));

    if (diff === 0)   return '🎉 Today!';
    if (diff === 1)   return '🌅 Tomorrow!';
    if (diff <= 7)    return `✨ ${diff} days away`;
    if (diff <= 30)   return `📅 ${diff} days away`;
    return `📅 ${diff} days away`;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}><ActivityIndicator color={colors.gold} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
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
          dates.map((item) => {
            const countdown = daysUntilNextAnniversary(item.date);
            const isToday   = countdown?.includes('Today');
            const isSoon    = countdown?.includes('Tomorrow') || countdown?.startsWith('✨');

            return (
              <View key={item.id} style={styles.card}>
                {/* Card header */}
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardEmoji}>💍</Text>
                    <View style={{ flex: 1 }}>
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

                {/* ✅ Countdown — dark theme compatible, colour shifts by urgency */}
                {countdown && (
                  <View style={[
                    styles.countdown,
                    isToday && styles.countdownToday,
                    isSoon  && !isToday && styles.countdownSoon,
                  ]}>
                    <Text style={[
                      styles.countdownText,
                      isToday && styles.countdownTextToday,
                      isSoon  && !isToday && styles.countdownTextSoon,
                    ]}>
                      {countdown}
                    </Text>
                  </View>
                )}

                {/* Plan details — fixed label width so "LOCATION" doesn't wrap */}
                {item.planTitle && (
                  <View style={styles.planRow}>
                    <Text style={styles.planLabel}>PLAN</Text>
                    <Text style={styles.planValue}>{item.planTitle}</Text>
                  </View>
                )}
                {item.city && (
                  <View style={styles.planRow}>
                    <Text style={styles.planLabel}>LOCATION</Text>
                    <Text style={styles.planValue}>{item.city}</Text>
                  </View>
                )}
                {item.vibe && (
                  <View style={styles.planRow}>
                    <Text style={styles.planLabel}>VIBE</Text>
                    <Text style={styles.planValue}>{item.vibe}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:   { flex: 1 },

  // ── Header ── explicit dark so it doesn't pick up swapped theme token
  header: {
    backgroundColor: '#1E1C2C',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(242,237,232,0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  backArrow:   { fontSize: 26, color: '#F2EDE8', lineHeight: 30, marginLeft: 2 },
  headerTitle: { fontFamily: fonts.display, fontSize: 22, color: '#F2EDE8', flex: 1, textAlign: 'center' },

  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, textAlign: 'center', marginVertical: 24, lineHeight: 20 },

  // ── Empty state ──
  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.charcoal, marginBottom: 8 },
  emptySub:   { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, textAlign: 'center', lineHeight: 20, maxWidth: 260 },

  // ── Card ──
  card: {
    backgroundColor: colors.cream2,   // dark elevated surface
    borderRadius: radius.md,
    marginBottom: 14,
    overflow: 'hidden',
    ...shadow.sm,
    borderTopWidth: 3,
    borderTopColor: colors.rose,      // rose gold top accent
  },
  cardTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  cardLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardEmoji: { fontSize: 28 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal },
  cardDate:  { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 2 },
  deleteBtn: { fontSize: 16, color: colors.gray3 },

  // ── Countdown — dark theme, three urgency states ──
  countdown: {
    backgroundColor: colors.cream3,  // default: dark tint
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: colors.gray4,
  },
  countdownSoon: {
    backgroundColor: 'rgba(212,149,111,0.10)', // rose gold tint — within a week
  },
  countdownToday: {
    backgroundColor: 'rgba(212,149,111,0.20)', // stronger glow — today!
  },
  countdownText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.gray2,             // default: muted
  },
  countdownTextSoon:  { color: colors.rose },   // rose gold — coming soon
  countdownTextToday: { color: colors.gold },   // gold — today!

  // ── Plan detail rows ──
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: colors.gray4,
    gap: 12,
  },
  // ✅ Fixed width — wide enough for "LOCATION" without wrapping
  planLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.gray2,
    width: 72,                        // was 60 — "LOCATI\nON" wrapped at 60
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 1,
  },
  planValue: { fontFamily: fonts.body, fontSize: 13, color: colors.charcoal, flex: 1, lineHeight: 18 },
});