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

  const options = OPTIONS_BY_CATEGORY[plan.category] || [];

  function handleSelect(value) {
    console.log('[Plan Step 5] dateIdea_selected', { dateIdea: value });
    updatePlan({ dateIdea: value });
    router.push('/plan/results');
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
            style={s.card}
            onPress={() => handleSelect(option.key)}
            activeOpacity={0.85}
          >
            <Text style={s.cardEmoji}>{option.emoji}</Text>
            <Text style={s.cardLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
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
});
