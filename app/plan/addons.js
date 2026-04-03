import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { getPlacesByVibe } from '../../services/placesService';
import { ScreenHeader, ProgressBar, PrimaryButton, OutlineButton, SectionLabel, Divider } from '../../components/UI';
import { AddonCard } from '../../components/ItemCard';

// ─── Removed ADDONS import — no more hardcoded LA fallback data ───

const ADDON_OPTIONS = [
  { key: 'flowers', emoji: '💐', title: 'Flowers', sub: 'Pick up a bouquet on the way', label: '💐 Flower Shops Nearby' },
  { key: 'dessert', emoji: '🍰', title: 'Dessert Stop', sub: 'Sweet ending to a perfect night', label: '🍰 Dessert Stops Nearby' },
  { key: 'scenic', emoji: '🌅', title: 'Scenic Stop', sub: 'A photo-worthy moment together', label: '🌅 Scenic Spots Nearby' },
];

// Specific search config per addon type
const ADDON_SEARCH_CONFIG = {
  flowers: { type: 'florist', keyword: 'flower shop bouquet' },
  dessert: { type: 'bakery',  keyword: 'dessert cake ice cream sweets' },
  scenic:  { type: 'park',    keyword: 'scenic park viewpoint nature' },
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

export default function AddonsScreen() {
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const [addonType, setAddonType] = useState(plan.addonType || null);
  const [addonItem, setAddonItem] = useState(plan.addonItem || null);
  const [addonItems, setAddonItems] = useState({});
  const [loadingType, setLoadingType] = useState(null);

  useEffect(() => {
    if (!addonType) return;
    if (addonItems[addonType]) return; // already loaded
    fetchAddonPlaces(addonType);
  }, [addonType]);

  async function fetchAddonPlaces(type) {
    setLoadingType(type);
    try {
      // Step 1 — geocode the city the user entered
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(plan.city)}&key=AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8`
      );
      const geoData = await geoRes.json();

      if (geoData.status !== 'OK') {
        console.log('[Addons] Geocode failed:', geoData.status);
        setAddonItems((prev) => ({ ...prev, [type]: [] }));
        setLoadingType(null);
        return;
      }

      const { lat, lng } = geoData.results[0].geometry.location;
      const config = ADDON_SEARCH_CONFIG[type];

      // Step 2 — search nearby with a wide radius (20km covers suburbs like Hemet)
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: '20000',        // ✅ was 8000 — too tight for suburban areas
        type: config.type,
        keyword: config.keyword,
        key: 'AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8',
      });

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`
      );
      const data = await res.json();
      console.log(`[Addons] ${type} → ${data.status}, ${data.results?.length ?? 0} results`);

      const results = data.results ?? [];

      // Step 3 — filter: rating >= 3.5 and at least 10 reviews
      // (lower bar than activities — flower shops & dessert spots have fewer reviews)
      const filtered = results.filter(
        (p) => (p.rating ?? 0) >= 3.5 && (p.user_ratings_total ?? 0) >= 10
      );

      // Step 4 — sort by rating desc, take top 4
      const sorted = filtered
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 4);

      // Step 5 — map to the shape AddonCard expects
      const mapped = sorted.map((p) => ({
        id: p.place_id,
        name: p.name,
        type,
        note: p.rating >= 4.8 ? 'Top rated'
            : p.opening_hours?.open_now ? 'Open now'
            : p.rating >= 4.5 ? 'Highly rated'
            : 'Nearby',
        desc: p.vicinity
          ? p.vicinity.split(',').slice(0, 2).join(',').trim()
          : 'Near your location',
        rating: p.rating != null ? parseFloat(p.rating).toFixed(1) : null,
        dist: p.geometry?.location
          ? calcDistMiles({ lat, lng }, p.geometry.location) + ' mi'
          : '',
        featured: (p.rating ?? 0) >= 4.5,
      }));

      // ✅ If API returns nothing — show empty, NOT fake LA data
      setAddonItems((prev) => ({ ...prev, [type]: mapped }));

    } catch (e) {
      console.log('[Addons] Fetch error:', e.message);
      setAddonItems((prev) => ({ ...prev, [type]: [] }));
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

  function handleSkip() {
    updatePlan({ addonType: null, addonItem: null });
    router.push('/plan/cart');
  }

  const activeOption = ADDON_OPTIONS.find((o) => o.key === addonType);
  const currentItems = addonType ? (addonItems[addonType] || []) : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={'Add a little\n'} italic="extra magic."
        subtitle="One finishing touch goes a long way." />
      <ProgressBar total={7} current={6} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {ADDON_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.row, addonType === opt.key && styles.rowSel]}
            onPress={() => pickType(opt.key)}
            activeOpacity={0.85}
          >
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
            ) : currentItems.length > 0 ? (
              currentItems.map((item) => (
                <AddonCard
                  key={item.id}
                  item={item}
                  selected={addonItem?.id === item.id}
                  onSelect={setAddonItem}
                />
              ))
            ) : (
              // ✅ Clean empty state — no fake data shown
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>😅</Text>
                <Text style={styles.emptyText}>We couldn't find anything great here</Text>
                <Text style={styles.emptySub}>Try another vibe — we've got better options.</Text>
              </View>
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
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 },
  emptyEmoji: { fontSize: 40, marginBottom: 4 },
  emptyText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.charcoal, textAlign: 'center', lineHeight: 22 },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, textAlign: 'center', lineHeight: 19 },
  bbar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, backgroundColor: colors.cream },
});