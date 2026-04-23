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
        <Text style={s.step}>Step 2 of 3</Text>
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

      {/* OR divider */}
      <View style={s.orRow}>
        <View style={s.orLine} />
        <Text style={s.orText}>OR</Text>
        <View style={s.orLine} />
      </View>

      {/* Choose For Me */}
      <View style={s.cfmWrap}>
        <TouchableOpacity
          style={s.cfmCard}
          onPress={() => {
            console.log('[Plan Step 2] choose_for_me_selected');
            router.push('/plan/choose-for-me');
          }}
          activeOpacity={0.85}
        >
          <Text style={s.cfmEmoji}>✨</Text>
          <View style={s.cfmText}>
            <Text style={s.cfmLabel}>Choose For Me</Text>
            <Text style={s.cfmSub}>Let Plannie pick the perfect plan</Text>
          </View>
          <Text style={s.cfmChevron}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

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
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 14,
  },
  card: {
    width: '47%',
    backgroundColor: colors.cream2,
    borderRadius: radius.md,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray4,
    position: 'relative',
  },
  cardActive:      { borderColor: colors.rose, backgroundColor: 'rgba(212,149,111,0.06)' },
  cardEmoji:       { fontSize: 32, marginBottom: 8 },
  cardLabel:       { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.charcoal, marginBottom: 4 },
  cardLabelActive: { color: colors.rose },
  cardSub:         { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, textAlign: 'center' },
  checkDot:        { position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.rose },

  orRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.gray4 },
  orText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.gray2, marginHorizontal: 12, letterSpacing: 1.5 },

  cfmWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  cfmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(212,149,111,0.30)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  cfmEmoji: { fontSize: 24 },
  cfmText:  { flex: 1 },
  cfmLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal, marginBottom: 2 },
  cfmSub:   { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  cfmChevron: { fontFamily: fonts.bodySemiBold, fontSize: 18, color: colors.rose },

  footer:              { paddingHorizontal: 24, paddingBottom: 16 },
  continueBtn:         { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  continueBtnDisabled: { backgroundColor: colors.gray4 },
  continueBtnText:     { fontFamily: fonts.bodyMedium, fontSize: 16, color: '#F2EDE8' },
});