import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput,
  StyleSheet, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, radius, shadow } from '../../../constants/theme';
import { usePlan } from '../../../hooks/usePlan';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SpecialDatesScreen() {
  const { specialDates, toggleSpecialDate, updatePlanMeta } = usePlan();
  const [editTarget, setEditTarget] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [dateDraft, setDateDraft] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pendingToConfigure = useMemo(
    () => specialDates.find((item) => !item.specialDateConfigured),
    [specialDates]
  );

  useEffect(() => {
    if (!pendingToConfigure || editTarget) return;
    setEditTarget(pendingToConfigure);
    setNoteDraft(pendingToConfigure.specialDateNote || '');
    setDateDraft(pendingToConfigure.specialDateDate ? new Date(`${pendingToConfigure.specialDateDate}T00:00:00`) : null);
  }, [pendingToConfigure, editTarget]);

  async function handleDelete(id) {
    Alert.alert(
      'Remove Special Date',
      'Are you sure you want to remove this special date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: () => toggleSpecialDate(id),
        },
      ]
    );
  }

  function formatDate(str) {
    if (!str) return '';
    const d = new Date(str + 'T00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function deriveCardImage(item) {
    if (item.placeData?.photoUrl) return item.placeData.photoUrl;
    if (item.food?.photoUrl) return item.food.photoUrl;
    if (item.activity?.photoUrl) return item.activity.photoUrl;
    if (item.addonItem?.photoUrl) return item.addonItem.photoUrl;
    return null;
  }

  function deriveCardLocation(item) {
    return item.placeData?.address || item.city || '';
  }

  function getDateForCountdown(item) {
    return item.specialDateDate || item.date || '';
  }

  function handleSaveSpecialMeta() {
    if (!editTarget) return;
    updatePlanMeta(editTarget.id, {
      specialDateConfigured: true,
      specialDateNote: noteDraft.trim(),
      specialDateDate: dateDraft ? dateDraft.toISOString().slice(0, 10) : '',
    });
    setEditTarget(null);
    setNoteDraft('');
    setDateDraft(null);
    setShowDatePicker(false);
  }

  function openEditModal(item) {
    setEditTarget(item);
    setNoteDraft(item.specialDateNote || '');
    setDateDraft(item.specialDateDate ? new Date(`${item.specialDateDate}T00:00:00`) : null);
    setShowDatePicker(false);
  }

  function formatPickerDate(d) {
    if (!d) return 'No date selected';
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

        {specialDates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💍</Text>
            <Text style={styles.emptyTitle}>No special dates yet</Text>
            <Text style={styles.emptySub}>
              When saving a plan, toggle "Mark as special date" to save it here.
            </Text>
          </View>
        ) : (
          specialDates.map((item) => {
            const specialDate = getDateForCountdown(item);
            const countdown = daysUntilNextAnniversary(specialDate);
            const isToday   = countdown?.includes('Today');
            const isSoon    = countdown?.includes('Tomorrow') || countdown?.startsWith('✨');
            const cardImage = deriveCardImage(item);
            const cardLocation = deriveCardLocation(item);

            return (
              <View key={item.id} style={styles.card}>
                {cardImage ? (
                  <Image source={{ uri: cardImage }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={styles.imageFallback}>
                    <Text style={styles.imageFallbackEmoji}>💍</Text>
                  </View>
                )}
                {/* Card header */}
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      {cardLocation ? <Text style={styles.cardDate}>{cardLocation}</Text> : null}
                      {specialDate ? <Text style={styles.cardMetaDate}>{formatDate(specialDate)}</Text> : null}
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

                {item.specialDateNote ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>Note</Text>
                    <Text style={styles.noteText}>{item.specialDateNote}</Text>
                  </View>
                ) : null}

                <View style={styles.editRow}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEditModal(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.editBtnText}>Edit Details</Text>
                  </TouchableOpacity>
                </View>

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
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={!!editTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setEditTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mark this as a special date 💍</Text>
            <Text style={styles.modalSub}>
              Add meaning so this moment feels unforgettable.
            </Text>

            <TextInput
              style={styles.noteInput}
              placeholder='Optional note (e.g. "First date")'
              placeholderTextColor={colors.gray3}
              value={noteDraft}
              onChangeText={setNoteDraft}
            />

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.dateButtonText}>
                {dateDraft ? `Date: ${formatPickerDate(dateDraft)}` : 'Pick an optional date'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dateDraft || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDateDraft(selectedDate);
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditTarget(null)} activeOpacity={0.8}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveSpecialMeta} activeOpacity={0.85}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.cream2,
    borderRadius: radius.md,
    marginBottom: 14,
    overflow: 'hidden',
    ...shadow.md,
    borderTopWidth: 3,
    borderTopColor: colors.rose,
  },
  cardImage: { width: '100%', height: 150 },
  imageFallback: {
    width: '100%',
    height: 100,
    backgroundColor: '#221C34',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFallbackEmoji: { fontSize: 28 },
  cardTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  cardLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardEmoji: { fontSize: 28 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal },
  cardDate:  { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 2 },
  cardMetaDate: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.rose, marginTop: 4 },
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

  noteBox: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: 'rgba(212,149,111,0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,149,111,0.18)',
  },
  noteLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.rose,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  noteText: { fontFamily: fonts.body, fontSize: 13, color: colors.charcoal, lineHeight: 18 },
  editRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2 },
  editBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,149,111,0.12)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,149,111,0.24)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.rose },

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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8,6,14,0.78)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: colors.cream2,
    borderRadius: radius.md,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.gray4,
  },
  modalTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.charcoal, marginBottom: 6 },
  modalSub: { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginBottom: 14 },
  noteInput: {
    backgroundColor: colors.cream,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gray4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.charcoal,
    fontFamily: fonts.body,
    fontSize: 14,
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: colors.cream,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gray4,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
  },
  dateButtonText: { fontFamily: fonts.body, fontSize: 13, color: colors.gray },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gray4,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalCancelText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gray2 },
  modalSave: {
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.rose,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalSaveText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#F2EDE8' },
});