import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ADDONS } from '../../data';
import { getPlacesByVibe } from '../../services/placesService';
import { ScreenHeader, ProgressBar, PrimaryButton, OutlineButton, SectionLabel, Divider } from '../../components/UI';
import { AddonCard } from '../../components/ItemCard';

const ADDON_OPTIONS = [
  { key: 'flowers', emoji: '💐', title: 'Flowers', sub: 'Pick up a bouquet on the way', label: '💐 Flower Shops Nearby' },
  { key: 'dessert', emoji: '🍰', title: 'Dessert Stop', sub: 'Sweet ending to a perfect night', label: '🍰 Dessert Stops Nearby' },
  { key: 'scenic', emoji: '🌅', title: 'Scenic Stop', sub: 'A photo-worthy moment together', label: '🌅 Scenic Spots Nearby' },
];

// Map addon type → vibe key for placesService
const ADDON_VIBE_MAP = {
  flowers: 'chill',   // fetches cafes/parks — closest to flower shop feel
  dessert: 'foodie',  // fetches bakeries/restaurants
  scenic:  'chill',   // fetches parks
};

// Override types per addon for more accurate results
const ADDON_TYPE_OVERRIDE = {
  flowers: { types: ['florist', 'store'], keyword: 'flower shop bouquet' },
  dessert: { types: ['bakery', 'cafe'], keyword: 'dessert sweets' },
  scenic: { types: ['park'], keyword: 'scenic park viewpoint nature' },
};

function calcDistMiles(from, to) {
  const R = 3958.8;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
    Math.cos((to.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

function getNote(p) {
  if (p.rating >= 4.8) return 'Top rated';
  if (p.totalRatings > 1000) return 'Very popular';
  if (p.isOpenNow === true) return 'Open now';
  if (p.rating >= 4.5) return 'Highly rated';
  return 'Nearby';
}

export default function AddonsScreen() {
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const [addonType, setAddonType] = useState(plan.addonType || null);
  const [addonItem, setAddonItem] = useState(plan.addonItem || null);
  const [addonItems, setAddonItems] = useState({});
  const [loadingType, setLoadingType] = useState(null);

  // Fetch places when user picks an addon type
  useEffect(() => {
    if (!addonType) return;
    if (addonItems[addonType]) return; // already loaded
    fetchAddonPlaces(addonType);
  }, [addonType]);

  async function fetchAddonPlaces(type) {
  setLoadingType(type);
  try {
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(plan.city)}&key=AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8`
    );
    const geoData = await geoRes.json();

    if (geoData.status !== 'OK') {
      console.log('Geo failed:', geoData.status);
      setAddonItems((prev) => ({ ...prev, [type]: ADDONS[type] || [] }));
      setLoadingType(null);
      return;
    }

    const { lat, lng } = geoData.results[0].geometry.location;
    const override = ADDON_TYPE_OVERRIDE[type];

    const locationStr = lat + ',' + lng;
const params = new URLSearchParams({
  location: locationStr,
  radius: '8000',
  type: override.types[0],
  keyword: override.keyword,
  key: 'AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8',
});

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`
    );
    const data = await res.json();
    console.log('Addon results:', type, data.status, data.results?.length);

    const results = data.results ?? [];
    const mapped = results.slice(0, 4).map((p) => ({
      id: p.place_id,
      name: p.name,
      type,
      note: p.rating >= 4.8 ? 'Top rated' : p.opening_hours?.open_now ? 'Open now' : 'Nearby',
      desc: p.vicinity
        ? p.vicinity.split(',').slice(0, 2).join(',').trim()
        : 'Near your location',
      rating: p.rating != null ? parseFloat(p.rating).toFixed(1) : '4.0',
      dist: p.geometry?.location
        ? calcDistMiles({ lat, lng }, p.geometry.location) + ' mi'
        : '',
      featured: p.rating >= 4.5,
    }));

    // Use mapped results OR fall back to static
    const finalItems = mapped.length > 0 ? mapped : (ADDONS[type] || []);
    setAddonItems((prev) => ({ ...prev, [type]: finalItems }));

  } catch (e) {
    console.log('Addon fetch error:', e.message);
    setAddonItems((prev) => ({ ...prev, [type]: ADDONS[type] || [] }));
  }
  setLoadingType(null);
}

  function pickType(key) {
  setAddonType(key);
  setAddonItem(null);
  if (!addonItems[key]) {
    fetchAddonPlaces(key);
  }
}
  function handleFinish() {
  if (!addonType) return;
  updatePlan({ addonType, addonItem });
  router.push('/plan/cart');
}
  function handleSkip() { updatePlan({ addonType: null, addonItem: null }); router.push('/plan/cart'); }

  const activeOption = ADDON_OPTIONS.find((o) => o.key === addonType);
  const currentItems = addonType ? (addonItems[addonType] || []) : [];

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

            {loadingType === addonType ? (
              <View style={styles.loader}>
                <ActivityIndicator size="small" color={colors.rose} />
                <Text style={styles.loadingText}>Finding spots near you…</Text>
              </View>
            ) : (
              currentItems.map((item) => (
                <AddonCard key={item.id} item={item}
                  selected={addonItem?.id === item.id} onSelect={setAddonItem} />
              ))
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.bbar}>
        <PrimaryButton label="Add to Plan →" onPress={handleFinish} variant="rose" disabled={!addonType} />
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
  loader: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  loadingText: { fontFamily: fonts.body, fontSize: 13, color: colors.gray2 },
  bbar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, backgroundColor: colors.cream },
});