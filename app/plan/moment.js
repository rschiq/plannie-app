// app/plan/moment.js — Step 2: What kind of moment is this?
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius } from '../../constants/theme';

const MOMENTS = {
  couples: [
    { key: 'first_date',     emoji: '🌹', label: 'First Date',     sub: 'Make a great first impression' },
    { key: 'casual_hangout', emoji: '😊', label: 'Casual Hangout', sub: 'Low-key, easy and fun'         },
    { key: 'date_night',     emoji: '🌙', label: 'Date Night',     sub: 'A proper night out together'   },
  ],
  friends: [
    { key: 'casual_hangout', emoji: '😌', label: 'Chill',      sub: 'Relaxed and laid-back'   },
    { key: 'date_night',     emoji: '🎉', label: 'Going Out',  sub: 'Night out with the crew' },
  ],
};

export default function MomentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const [selected, setSelected] = useState(plan.moment || null);

  const options = MOMENTS[plan.group] || MOMENTS.couples;

  function handleContinue() {
    if (!selected) return;
    const updates = { moment: selected, category: null };
    console.log('[Plan Step 3] committing_selection', {
      updates,
      nextPlanPreview: { ...plan, ...updates },
    });
    updatePlan(updates);
    router.push('/plan/category');
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.step}>Step 2 of 3</Text>
        <Text style={s.title}>What kind of{'\n'}<Text style={s.titleAccent}>moment is this?</Text></Text>
      </View>

      {/* Options */}
      <View style={s.list}>
        {options.map((o) => {
          const active = selected === o.key;
          return (
            <TouchableOpacity
              key={o.key}
              style={[s.row, active && s.rowActive]}
              onPress={() => {
                setSelected(o.key);
                console.log('[Plan Step 3] moment_selected', { moment: o.key });
              }}
              activeOpacity={0.85}
            >
              <Text style={s.rowEmoji}>{o.emoji}</Text>
              <View style={s.rowText}>
                <Text style={[s.rowLabel, active && s.rowLabelActive]}>{o.label}</Text>
                <Text style={s.rowSub}>{o.sub}</Text>
              </View>
              <View style={[s.radio, active && s.radioActive]}>
                {active && <View style={s.radioDot} />}
              </View>
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

  header:      { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 20 },
  backBtn:     { marginBottom: 16 },
  backText:    { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },
  step:        { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  title:       { fontFamily: fonts.display, fontSize: 34, color: colors.charcoal, lineHeight: 40 },
  titleAccent: { fontFamily: fonts.displayItalic, color: colors.rose },

  list: { flex: 1, paddingHorizontal: 24, gap: 10 },
  row:  {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.cream2,
    borderRadius: radius.md,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.gray4,
  },
  rowActive:      { borderColor: colors.rose, backgroundColor: 'rgba(212,149,111,0.06)' },
  rowEmoji:       { fontSize: 28 },
  rowText:        { flex: 1 },
  rowLabel:       { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal, marginBottom: 2 },
  rowLabelActive: { color: colors.rose },
  rowSub:         { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  radio:          { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.gray3, alignItems: 'center', justifyContent: 'center' },
  radioActive:    { borderColor: colors.rose },
  radioDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.rose },

  footer:              { paddingHorizontal: 24, paddingBottom: 16 },
  continueBtn:         { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  continueBtnDisabled: { backgroundColor: colors.gray4 },
  continueBtnText:     { fontFamily: fonts.bodyMedium, fontSize: 16, color: '#F2EDE8' },
});