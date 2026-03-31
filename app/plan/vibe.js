import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ACTIVITIES, RESTAURANTS, ADDONS, VIBES } from '../../data';
import { ScreenHeader, ProgressBar, PrimaryButton } from '../../components/UI';

export default function VibeScreen() {
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const [selected, setSelected] = useState(plan.vibe || '');

  function confirm() {
    if (!selected) return;
    updatePlan({ vibe: selected });
    if (plan.mode === 'auto') {
      const hr = plan.time ? parseInt(plan.time.split(':')[0]) : 17;
      const acts = ACTIVITIES[selected];
      const rests = RESTAURANTS[selected];
      let actIdx = 0, addonKey = 'dessert';
      if (hr < 12) { actIdx = 2; addonKey = 'scenic'; }
      else if (hr < 15) { actIdx = 1; addonKey = 'dessert'; }
      else if (hr < 19) { actIdx = 0; addonKey = 'flowers'; }
      else { actIdx = 0; addonKey = 'scenic'; }
      updatePlan({
        vibe: selected,
        activity: acts[actIdx] || acts[0],
        food: rests[1] || rests[0],
        addonType: addonKey,
        addonItem: ADDONS[addonKey][0],
      });
      router.push('/plan/cart');
    } else {
      router.push('/plan/activity');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={'Pick the\n'} italic="vibe."
        subtitle="What kind of night are you going for?" />
      <ProgressBar total={7} current={3} />
      <FlatList data={VIBES} keyExtractor={(item) => item.id} numColumns={2}
        columnWrapperStyle={styles.row} contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const sel = selected === item.id;
          return (
            <TouchableOpacity style={[styles.card, sel && styles.cardSel]}
              onPress={() => setSelected(item.id)} activeOpacity={0.85}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.name}>{item.id}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </TouchableOpacity>
          );
        }} />
      <View style={styles.bbar}>
        <PrimaryButton label="Continue →" onPress={confirm} disabled={!selected} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  row: { gap: 14, marginBottom: 14 },
  card: { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, padding: 18, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', ...shadow.sm, minHeight: 140 },
  cardSel: { borderColor: colors.rose, backgroundColor: '#FFF8F7' },
  emoji: { fontSize: 30, marginBottom: 6 },
  name: { fontFamily: fonts.displayMedium, fontSize: 19, color: colors.charcoal, marginBottom: 3, textAlign: 'center' },
  desc: { fontFamily: fonts.body, fontSize: 10, color: colors.gray2, textAlign: 'center', lineHeight: 14 },
  bbar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, backgroundColor: colors.cream },
});