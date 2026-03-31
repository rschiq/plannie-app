import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors } from '../../constants/theme';
import { RESTAURANTS } from '../../data';
import { ScreenHeader, ProgressBar, PrimaryButton, OutlineButton } from '../../components/UI';
import { ItemCard } from '../../components/ItemCard';

export default function FoodScreen() {
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const [selected, setSelected] = useState(plan.food);
  const items = RESTAURANTS[plan.vibe] || RESTAURANTS.Romantic;

  function handleAdd() { updatePlan({ food: selected }); router.push('/plan/addons'); }
  function handleSkip() { updatePlan({ food: null }); router.push('/plan/addons'); }

  const btnLabel = selected
    ? `✓ Add "${selected.name.split(' ').slice(0, 3).join(' ')}" →`
    : 'Add Restaurant →';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={'Perfect spots to\n'} italic="continue the night."
        subtitle="Curated restaurants that pair great with your date." />
      <ProgressBar total={7} current={5} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {items.map((item) => (
          <ItemCard key={item.id} item={item} selected={selected?.id === item.id}
            onSelect={setSelected} type="food" />
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
      <View style={styles.bbar}>
        <PrimaryButton label={btnLabel} onPress={handleAdd} variant="rose" disabled={!selected} />
        <OutlineButton label="Skip" onPress={handleSkip} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  bbar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, backgroundColor: colors.cream },
});