import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius } from '../../constants/theme';

const BUDGETS = [
  { key: '$',  emoji: '💚', label: 'Low Budget',     sub: 'Great dates on a budget' },
  { key: '$$', emoji: '💛', label: 'Nice Night Out',  sub: 'A nice night out' },
];

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const [selected, setSelected] = useState(plan.budget || '$$');

  function handleContinue() {
    console.log('[Plan Step 4] budget_selected', { budget: selected });
    updatePlan({ budget: selected });
    router.push('/plan/results');
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.step}>Step 3 of 3</Text>
        <Text style={s.title}>What's your{'\n'}<Text style={s.titleAccent}>budget?</Text></Text>
      </View>

      <View style={s.grid}>
        {BUDGETS.map((b) => {
          const active = selected === b.key;
          return (
            <TouchableOpacity
              key={b.key}
              style={[s.card, active && s.cardActive]}
              onPress={() => setSelected(b.key)}
              activeOpacity={0.85}
            >
              <Text style={s.cardEmoji}>{b.emoji}</Text>
              <Text style={[s.cardKey, active && s.cardKeyActive]}>{b.key}</Text>
              <Text style={[s.cardLabel, active && s.cardLabelActive]}>{b.label}</Text>
              <Text style={s.cardSub}>{b.sub}</Text>
              {active && <View style={s.checkDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
        <TouchableOpacity style={s.continueBtn} onPress={handleContinue} activeOpacity={0.88}>
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
  title: { fontFamily: fonts.display, fontSize: 34, color: colors.charcoal, lineHeight: 40 },
  titleAccent: { fontFamily: fonts.displayItalic, color: colors.rose },

  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 14,
    alignContent: 'center',
  },
  card: {
    width: '47%',
    backgroundColor: colors.cream2,
    borderRadius: radius.md,
    padding: 22,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray4,
    position: 'relative',
  },
  cardActive: { borderColor: colors.rose, backgroundColor: 'rgba(212,149,111,0.06)' },
  cardEmoji: { fontSize: 40, marginBottom: 10 },
  cardKey: { fontFamily: fonts.bodySemiBold, fontSize: 22, color: colors.gray2, marginBottom: 4 },
  cardKeyActive: { color: colors.rose },
  cardLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal, marginBottom: 4, textAlign: 'center' },
  cardLabelActive: { color: colors.charcoal },
  cardSub: { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, textAlign: 'center' },
  checkDot: { position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.rose },

  footer: { paddingHorizontal: 24, paddingBottom: 16 },
  continueBtn: { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  continueBtnText: { fontFamily: fonts.bodyMedium, fontSize: 16, color: '#F2EDE8' },
});
