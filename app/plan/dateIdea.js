import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius } from '../../constants/theme';

const OPTIONS_BY_CATEGORY = {
  food: [
    { key: 'brunch_dinner', label: 'Brunch / Dinner', emoji: '🥞' },
    { key: 'coffee_dessert', label: 'Coffee / Dessert', emoji: '☕' },
    { key: 'drinks', label: 'Drinks', emoji: '🍸' },
  ],
  activity: [
    { key: 'indoor',  label: 'Indoor',  emoji: '🎳' },
    { key: 'outdoor', label: 'Outdoor', emoji: '🌤️' },
    { key: 'movies',  label: 'Movies',  emoji: '🎬' },
  ],
};

export default function DateIdeaScreen() {
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const [selected, setSelected] = useState(null);

  const options = OPTIONS_BY_CATEGORY[plan.category] || [];

  function handleSelect(value) {
    setSelected(value);
    console.log('[Plan Step 5] dateIdea_selected', { dateIdea: value });
    updatePlan({ dateIdea: value });
    setTimeout(() => router.push('/plan/results'), 150);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.step}>Step 3 of 3</Text>
        <Text style={s.title}>What kind of{'\n'}<Text style={{ fontStyle: 'italic' }}>vibe?</Text></Text>
      </View>

      <View style={s.grid}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[s.card, selected === option.key && s.cardActive]}
            onPress={() => handleSelect(option.key)}
            activeOpacity={0.85}
          >
            <Text style={s.cardEmoji}>{option.emoji}</Text>
            <View style={s.cardText}>
              <Text style={[s.cardLabel, selected === option.key && s.cardLabelActive]}>{option.label}</Text>
            </View>
            {selected === option.key && <View style={s.checkDot} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }} />

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
});
