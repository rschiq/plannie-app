import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '../../constants/theme';

const ACTIVITY_OPTIONS = {
  indoor: [
    { key: 'bowling_pool',  label: 'Bowling & Pool',     emoji: '🎳' },
    { key: 'arcade_gaming', label: 'Arcade & Gaming',    emoji: '🕹️' },
    { key: 'escape_vr',     label: 'Escape Rooms & VR',  emoji: '🔐' },
    { key: 'arts_creative', label: 'Paint & Create',     emoji: '🎨' },
  ],
  outdoor: [
    { key: 'water_activities', label: 'Water Activities', emoji: '🚣' },
    { key: 'outdoor_games',    label: 'Outdoor Games',    emoji: '⛳' },
  ],
};

export default function ActivityTypeScreen() {
  const router = useRouter();
  const { idea } = useLocalSearchParams();
  const [selected, setSelected] = useState(null);

  const options = ACTIVITY_OPTIONS[idea] || [];

  function handleContinue() {
    if (!selected) return;
    router.push({ pathname: '/plan/results', params: { idea, activityType: selected } });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.step}>Step 4 of 4</Text>
        <Text style={s.title}>What type of{'\n'}<Text style={{ fontStyle: 'italic' }}>activity?</Text></Text>
      </View>

      <View style={s.grid}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[s.card, selected === option.key && s.cardActive]}
            onPress={() => setSelected(option.key)}
            activeOpacity={0.85}
          >
            <Text style={s.cardEmoji}>{option.emoji}</Text>
            <View style={s.cardText}>
              <Text style={[s.cardLabel, selected === option.key && s.cardLabelActive]}>
                {option.label}
              </Text>
            </View>
            {selected === option.key && <View style={s.checkDot} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.continueBtn, !selected && s.continueBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={!selected}
        >
          <Text style={s.continueBtnText}>Find Places →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 20 },
  backBtn: { marginBottom: 16 },
  backText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },
  step: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  title: { fontFamily: fonts.display, fontSize: 32, color: colors.charcoal, lineHeight: 38 },
  grid: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream2,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.gray4,
    position: 'relative',
  },
  cardActive:      { borderColor: colors.rose, backgroundColor: 'rgba(212,149,111,0.06)' },
  cardEmoji:       { fontSize: 28, marginRight: 14 },
  cardText:        { flex: 1 },
  cardLabel:       { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.charcoal },
  cardLabelActive: { color: colors.rose },
  checkDot:        { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.rose },

  footer:              { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12 },
  continueBtn:         { backgroundColor: colors.rose, borderRadius: radius.full, paddingVertical: 16, alignItems: 'center' },
  continueBtnDisabled: { backgroundColor: colors.gray3, opacity: 0.5 },
  continueBtnText:     { fontFamily: fonts.bodySemiBold, fontSize: 16, color: '#F2EDE8' },
});
