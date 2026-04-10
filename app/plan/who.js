// app/plan/who.js — Step 1: Who are you with?
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius } from '../../constants/theme';

const OPTIONS = [
  { key: 'couples', emoji: '💑', label: 'Couples',  sub: 'Romantic plans for two'     },
  { key: 'friends', emoji: '👯', label: 'Friends',  sub: 'Fun plans with your crew'   },
];

export default function WhoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const [selected, setSelected] = useState(plan.group || null);

  function handleContinue() {
    if (!selected) return;
    updatePlan({ group: selected, moment: null, category: null });
    router.push('/plan/moment');
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.step}>Step 1 of 3</Text>
        <Text style={s.title}>Who are you{'\n'}<Text style={s.titleAccent}>planning for?</Text></Text>
        <Text style={s.sub}>Select to continue</Text>
      </View>

      {/* Cards */}
      <View style={s.cards}>
        {OPTIONS.map((o) => {
          const active = selected === o.key;
          return (
            <TouchableOpacity
              key={o.key}
              style={[s.card, active && s.cardActive]}
              onPress={() => setSelected(o.key)}
              activeOpacity={0.85}
            >
              <Text style={s.cardEmoji}>{o.emoji}</Text>
              <Text style={[s.cardLabel, active && s.cardLabelActive]}>{o.label}</Text>
              <Text style={s.cardSub}>{o.sub}</Text>
              {active && <View style={s.checkDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Continue */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
        <TouchableOpacity
          style={[s.continueBtn, !selected && s.continueBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.88}
          disabled={!selected}
        >
          <Text style={s.continueBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.cream },

  header:      { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 24 },
  backBtn:     { marginBottom: 16 },
  backText:    { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },
  step:        { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  title:       { fontFamily: fonts.display, fontSize: 36, color: colors.charcoal, lineHeight: 42, marginBottom: 8 },
  titleAccent: { fontFamily: fonts.displayItalic, color: colors.rose },
  sub:         { fontFamily: fonts.body, fontSize: 14, color: colors.gray2 },

  cards: { flex: 1, paddingHorizontal: 24, gap: 16, justifyContent: 'center' },
  card:  {
    backgroundColor: colors.cream2,
    borderRadius: radius.md,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray4,
    position: 'relative',
  },
  cardActive:      { borderColor: colors.rose, backgroundColor: 'rgba(212,149,111,0.06)' },
  cardEmoji:       { fontSize: 48, marginBottom: 12 },
  cardLabel:       { fontFamily: fonts.bodySemiBold, fontSize: 20, color: colors.charcoal, marginBottom: 6 },
  cardLabelActive: { color: colors.rose },
  cardSub:         { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, textAlign: 'center' },
  checkDot:        { position: 'absolute', top: 16, right: 16, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.rose },

  footer:              { paddingHorizontal: 24, paddingBottom: 16 },
  continueBtn:         { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  continueBtnDisabled: { backgroundColor: colors.gray4 },
  continueBtnText:     { fontFamily: fonts.bodyMedium, fontSize: 16, color: '#F2EDE8' },
});