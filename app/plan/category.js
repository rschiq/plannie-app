// app/plan/category.js — Step 3: What do you want to do?
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius } from '../../constants/theme';

const CATEGORIES = [
  {
    key: 'food',
    emoji: '🍽️',
    label: 'Food',
    sub: 'Restaurants & dining',
  },
  {
    key: 'activity',
    emoji: '🎯',
    label: 'Activity',
    sub: 'Fun things to do',
  },
];

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const [selected, setSelected] = useState(plan.category || null);

  function handleContinue() {
    if (!selected) return;
    const updates = { category: selected, dateIdea: null };
    console.log('[Plan Step 4] committing_selection', {
      updates,
      nextPlanPreview: { ...plan, ...updates },
    });
    updatePlan(updates);
    router.push('/plan/dateIdea');
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.step}>Step 3 of 3</Text>
        <Text style={s.title}>What do you{'\n'}<Text style={s.titleAccent}>want to do?</Text></Text>
      </View>

      {/* 2x2 Grid */}
      <View style={s.grid}>
        {CATEGORIES.map((c) => {
          const active = selected === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              style={[s.card, active && s.cardActive]}
              onPress={() => {
                setSelected(c.key);
                console.log('[Plan Step 4] category_selected', { category: c.key });
              }}
              activeOpacity={0.85}
            >
              <Text style={s.cardEmoji}>{c.emoji}</Text>
              <Text style={[s.cardLabel, active && s.cardLabelActive]}>{c.label}</Text>
              <Text style={s.cardSub}>{c.sub}</Text>
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
          <Text style={s.continueBtnText}>Find Places →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.cream },

  header:      { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 20 },
  backBtn:     { marginBottom: 16 },
  backText:    { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },
  step:        { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  title:       { fontFamily: fonts.display, fontSize: 34, color: colors.charcoal, lineHeight: 40 },
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
  cardActive:      { borderColor: colors.rose, backgroundColor: 'rgba(212,149,111,0.06)' },
  cardEmoji:       { fontSize: 40, marginBottom: 10 },
  cardLabel:       { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.charcoal, marginBottom: 4 },
  cardLabelActive: { color: colors.rose },
  cardSub:         { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, textAlign: 'center' },
  checkDot:        { position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.rose },

  footer:              { paddingHorizontal: 24, paddingBottom: 16 },
  continueBtn:         { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  continueBtnDisabled: { backgroundColor: colors.gray4 },
  continueBtnText:     { fontFamily: fonts.bodyMedium, fontSize: 16, color: '#F2EDE8' },
});