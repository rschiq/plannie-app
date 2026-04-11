// app/plan/who.js — Step 1: Who are you with?
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Rect, Line } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius } from '../../constants/theme';


// ── Card Illustrations ────────────────────────────────────────
function CardIllustration({ type }) {
  if (type === 'couples') {
    return (
      <Svg width="80" height="80" viewBox="0 0 80 80">
        {/* Person 1 - left */}
        <Circle cx="27" cy="22" r="10" fill="#D4956F" />
        <Path d="M10 60 Q10 42 27 42 Q44 42 44 60" fill="#8B5E8B" />
        {/* Person 2 - right */}
        <Circle cx="53" cy="22" r="10" fill="#F2C4A0" />
        <Path d="M36 60 Q36 42 53 42 Q70 42 70 60" fill="#6B4C8B" />
        {/* Heart between them */}
        <Path d="M40 35 C40 33 38 30 36 31 C34 32 34 35 36 37 L40 41 L44 37 C46 35 46 32 44 31 C42 30 40 33 40 35Z" fill="#E87070" />
      </Svg>
    );
  }
  return (
    <Svg width="80" height="80" viewBox="0 0 80 80">
      {/* Person 1 */}
      <Circle cx="22" cy="20" r="9" fill="#D4956F" />
      <Path d="M8 58 Q8 40 22 40 Q36 40 36 58" fill="#5B7FBB" />
      {/* Person 2 - middle */}
      <Circle cx="40" cy="18" r="9" fill="#F2C4A0" />
      <Path d="M26 58 Q26 38 40 38 Q54 38 54 58" fill="#7B9FCC" />
      {/* Person 3 */}
      <Circle cx="58" cy="20" r="9" fill="#C4956F" />
      <Path d="M44 58 Q44 40 58 40 Q72 40 72 58" fill="#4B6FAA" />
      {/* Stars */}
      <Path d="M14 12 L15 9 L16 12 L19 12 L17 14 L18 17 L15 15 L12 17 L13 14 L11 12Z" fill="#D4C56F" />
      <Path d="M62 10 L63 7 L64 10 L67 10 L65 12 L66 15 L63 13 L60 15 L61 12 L59 10Z" fill="#D4C56F" />
    </Svg>
  );
}

const OPTIONS = [
  { key: 'couples', label: 'Couples', sub: 'Romantic plans for two'   },
  { key: 'friends', label: 'Friends',  sub: 'Fun plans with your crew' },
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
              <CardIllustration type={o.key} />
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

  cards: { paddingHorizontal: 24, gap: 12, justifyContent: 'center', paddingVertical: 12 },
  card:  {
    backgroundColor: colors.cream2,
    borderRadius: radius.md,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray4,
    position: 'relative',
  },
  cardActive:      { borderColor: colors.rose, backgroundColor: 'rgba(212,149,111,0.06)' },
  cardIllustration: { width: 80, height: 80, marginBottom: 8 },
  cardLabel:       { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.charcoal, marginBottom: 4 },
  cardLabelActive: { color: colors.rose },
  cardSub:         { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, textAlign: 'center' },
  checkDot:        { position: 'absolute', top: 16, right: 16, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.rose },

  footer:              { paddingHorizontal: 24, paddingBottom: 16 },
  continueBtn:         { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  continueBtnDisabled: { backgroundColor: colors.gray4 },
  continueBtnText:     { fontFamily: fonts.bodyMedium, fontSize: 16, color: '#F2EDE8' },
});