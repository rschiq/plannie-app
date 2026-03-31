import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius } from '../../constants/theme';
import { ACTIVITIES } from '../../data';
import { ScreenHeader, ProgressBar, PrimaryButton, OutlineButton } from '../../components/UI';
import { ItemCard } from '../../components/ItemCard';

export default function ActivityScreen() {
  const router = useRouter();
  const { plan, updatePlan, getTimeLabel } = usePlan();
  const [selected, setSelected] = useState(plan.activity);
  const items = ACTIVITIES[plan.vibe] || ACTIVITIES.Romantic;
  const timeLabel = getTimeLabel();

  function handleAdd() { updatePlan({ activity: selected }); router.push('/plan/food-ask'); }
  function handleSkip() { updatePlan({ activity: null }); router.push('/plan/food-ask'); }

  const btnLabel = selected
    ? `✓ Add "${selected.name.split(' ').slice(0, 3).join(' ')}" →`
    : 'Add Activity →';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={'Your best\n'} italic="matches."
        subtitle={`Top ${plan.vibe?.toLowerCase() || ''} activities near ${plan.city?.split(',')[0] || 'you'}.`} />
      <ProgressBar total={7} current={4} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {timeLabel && (
          <View style={styles.todBanner}>
            <Text style={styles.todIcon}>{timeLabel.icon}</Text>
            <Text style={styles.todText}>{timeLabel.msg}</Text>
          </View>
        )}
        {items.map((item) => (
          <ItemCard key={item.id} item={item} selected={selected?.id === item.id}
            onSelect={setSelected} type="activity" />
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
      <View style={styles.bbar}>
        <PrimaryButton label={btnLabel} onPress={handleAdd} variant="rose" disabled={!selected} />
        <OutlineButton label="Skip for now" onPress={handleSkip} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  todBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0E0B8', borderRadius: radius.sm, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(201,169,110,0.3)' },
  todIcon: { fontSize: 22 },
  todText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold2, flex: 1, lineHeight: 18 },
  bbar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, backgroundColor: colors.cream },
});