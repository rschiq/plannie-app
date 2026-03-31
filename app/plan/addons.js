import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ADDONS } from '../../data';
import { ScreenHeader, ProgressBar, PrimaryButton, OutlineButton, SectionLabel, Divider } from '../../components/UI';
import { AddonCard } from '../../components/ItemCard';

const ADDON_OPTIONS = [
  { key: 'flowers', emoji: '💐', title: 'Flowers', sub: 'Pick up a bouquet on the way', label: '💐 Flower Shops Nearby' },
  { key: 'dessert', emoji: '🍰', title: 'Dessert Stop', sub: 'Sweet ending to a perfect night', label: '🍰 Dessert Stops Nearby' },
  { key: 'scenic', emoji: '🌅', title: 'Scenic Stop', sub: 'A photo-worthy moment together', label: '🌅 Scenic Spots Nearby' },
];

export default function AddonsScreen() {
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const [addonType, setAddonType] = useState(plan.addonType || null);
  const [addonItem, setAddonItem] = useState(plan.addonItem || null);

  function pickType(key) { setAddonType(key); setAddonItem(null); }
  function handleFinish() { updatePlan({ addonType, addonItem }); router.push('/plan/cart'); }
  function handleSkip() { updatePlan({ addonType: null, addonItem: null }); router.push('/plan/cart'); }

  const activeOption = ADDON_OPTIONS.find((o) => o.key === addonType);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={'Add a little\n'} italic="extra magic."
        subtitle="One finishing touch goes a long way." />
      <ProgressBar total={7} current={6} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {ADDON_OPTIONS.map((opt) => (
          <TouchableOpacity key={opt.key}
            style={[styles.row, addonType === opt.key && styles.rowSel]}
            onPress={() => pickType(opt.key)} activeOpacity={0.85}>
            <Text style={styles.rowEmoji}>{opt.emoji}</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>{opt.title}</Text>
              <Text style={styles.rowSub}>{opt.sub}</Text>
            </View>
            {addonType === opt.key && <Text style={styles.selCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
        {addonType && (
          <>
            <Divider />
            <SectionLabel text={activeOption?.label || 'Options Nearby'} />
            {ADDONS[addonType].map((item) => (
              <AddonCard key={item.id} item={item}
                selected={addonItem?.id === item.id} onSelect={setAddonItem} />
            ))}
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
      <View style={styles.bbar}>
        <PrimaryButton label="Add to Plan →" onPress={handleFinish} variant="rose" />
        <OutlineButton label="Skip" onPress={handleSkip} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  row: { backgroundColor: colors.white, borderRadius: radius.sm, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, borderWidth: 2, borderColor: 'transparent', ...shadow.sm },
  rowSel: { borderColor: colors.rose, backgroundColor: '#FFF9F8' },
  rowEmoji: { fontSize: 26 },
  rowContent: { flex: 1 },
  rowTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal },
  rowSub: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 2 },
  selCheck: { fontSize: 18, color: colors.rose, fontFamily: fonts.bodySemiBold },
  bbar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, backgroundColor: colors.cream },
});