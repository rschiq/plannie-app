import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
    { key: 'fun',        label: 'Fun',        emoji: '🎉' },
    { key: 'movies',     label: 'Movies',     emoji: '🎬' },
    { key: 'outdoor',    label: 'Outdoor',    emoji: '🌤️' },
    { key: 'hidden_gem', label: 'Hidden Gem', emoji: '🧩' },
  ],
};

export default function DateIdeaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { plan, updatePlan } = usePlan();

  const options = OPTIONS_BY_CATEGORY[plan.category] || [];

  function handleSelect(value) {
    console.log('[Plan Step 5] dateIdea_selected', { dateIdea: value });
    updatePlan({ dateIdea: value });
    router.push('/plan/results');
  }

  function handleSkip() {
    console.log('[Plan Step 5] dateIdea_skipped');
    router.push('/plan/results');
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.step}>Optional</Text>
        <Text style={s.title}>Want to narrow it down?</Text>
      </View>

      <View style={s.grid}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={s.card}
            onPress={() => handleSelect(option.key)}
            activeOpacity={0.85}
          >
            <Text style={s.cardEmoji}>{option.emoji}</Text>
            <Text style={s.cardLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
        <TouchableOpacity style={s.skipBtn} onPress={handleSkip} activeOpacity={0.85}>
          <Text style={s.skipBtnText}>Skip</Text>
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
  },
  cardEmoji: { fontSize: 36, marginBottom: 8 },
  cardLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal, textAlign: 'center' },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
  skipBtn: { borderRadius: 999, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray3, backgroundColor: colors.white },
  skipBtnText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.charcoal },
});
