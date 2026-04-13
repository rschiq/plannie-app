import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ScreenHeader, ProgressBar, PrimaryButton, OutlineButton, SectionLabel, Divider } from '../../components/UI';
import { AddonCard } from '../../components/ItemCard';
import { SelectableCard } from '../../components/SelectableCard';
import { AnimatedPrimaryButton, AnimatedOutlineButton } from '../../components/ScreenTransition';

// ─── Removed ADDONS import — no more hardcoded LA fallback data ───

const ADDON_OPTIONS = [
  { key: 'flowers', emoji: '💐', title: 'Flowers',      sub: 'Pick up a bouquet on the way',   label: '💐 Flower Shops Nearby' },
  { key: 'dessert', emoji: '🍰', title: 'Dessert Stop', sub: 'Sweet ending to a perfect night', label: '🍰 Dessert Stops Nearby' },
];

// Specific search config per addon type
// Using multiple targeted keywords and strict type matching
const ADDON_SEARCH_CONFIG = {
  flowers: {
    searches: [
      { type: 'florist',  keyword: 'florist flower shop' },
      { type: 'florist',  keyword: 'flower bouquet delivery' },
    ],
  },
  dessert: {
    searches: [
      { type: 'bakery',      keyword: 'dessert bakery cakes' },
      { type: 'cafe',        keyword: 'dessert cafe ice cream' },
      { type: 'ice_cream',   keyword: 'ice cream gelato' },
      { type: 'restaurant',  keyword: 'dessert bar sweets' },
    ],
  },
};

// Keywords that signal a non-food place slipping through
const NON_FOOD_KEYWORDS = [
  'recreation area', 'state park', 'national park', 'reservoir',
  'lake', 'river', 'creek', 'trail', 'campground', 'park',
  'school', 'hospital', 'clinic', 'pharmacy', 'gas station',
  'auto', 'tire', 'supply', 'warehouse', 'storage',
];

function isValidAddonResult(p, type) {
  const name = (p.name || '').toLowerCase();
  // Block non-food places
  if (NON_FOOD_KEYWORDS.some(kw => name.includes(kw))) return false;
  // For dessert — must have at least one food-related type
  if (type === 'dessert') {
    const foodTypes = ['bakery', 'cafe', 'restaurant', 'food', 'ice_cream_shop', 'meal_takeaway', 'meal_delivery'];
    const hasFood = (p.types || []).some(t => foodTypes.includes(t));
    if (!hasFood) return false;
  }
  return true;
}

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
  const insets = useSafeAreaInsets();
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
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(plan.city)}&key=AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w`
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

      // Step 2 — run multiple targeted searches in parallel
      const searchResults = await Promise.allSettled(
        config.searches.map(({ type: placeType, keyword }) => {
          const params = new URLSearchParams({
            location: `${lat},${lng}`,
            radius:   '20000',
            type:     placeType,
            keyword:  keyword,
            key:      'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w',
          });
          return fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`
          ).then(r => r.json());
        })
      );

      // Merge results, deduplicate by place_id
      const seen = new Set();
      const results = [];
      for (const r of searchResults) {
        if (r.status !== 'fulfilled') continue;
        for (const p of r.value.results || []) {
          if (!seen.has(p.place_id)) {
            seen.add(p.place_id);
            results.push(p);
          }
        }
      }

      console.log(`[Addons] ${type} → ${results.length} merged results`);

      // Step 3 — filter: must be valid food place, rating >= 3.5, at least 10 reviews
      const filtered = results.filter(
        (p) =>
          isValidAddonResult(p, type) &&
          (p.rating ?? 0) >= 3.5 &&
          (p.user_ratings_total ?? 0) >= 10
      );

      // Step 4 — sort by rating desc, take top 4
      const sorted = filtered
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 4);

      // Step 5 — map to the shape AddonCard + PlaceDetailModal expects
      const mapped = sorted.map((p) => ({
        id:           p.place_id,
        place_id:     p.place_id,
        name:         p.name,
        type,
        note: p.rating >= 4.8 ? 'Top rated'
            : p.opening_hours?.open_now ? 'Open now'
            : p.rating >= 4.5 ? 'Highly rated'
            : 'Nearby',
        desc: p.vicinity
          ? p.vicinity.split(',').slice(0, 2).join(',').trim()
          : 'Near your location',
        // ✅ shortLocation for display
        shortLocation: p.vicinity
          ? p.vicinity.split(',')[0].trim()
          : 'Near your location',
        address:      p.vicinity || '',
        rating:       p.rating != null ? parseFloat(p.rating).toFixed(1) : null,
        totalRatings: p.user_ratings_total || 0,
        isOpenNow:    p.opening_hours?.open_now ?? null,
        dist: p.geometry?.location
          ? calcDistMiles({ lat, lng }, p.geometry.location) + ' mi'
          : '',
        distance: p.geometry?.location
          ? calcDistMiles({ lat, lng }, p.geometry.location)
          : null,
        // ✅ location needed for Maps + detail modal
        location: p.geometry?.location
          ? { lat: p.geometry.location.lat, lng: p.geometry.location.lng }
          : null,
        // ✅ photoUrl for thumbnail in card
        photoUrl: p.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w`
          : null,
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

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        {ADDON_OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.key}
            selected={addonType === opt.key}
            onPress={() => pickType(opt.key)}
            style={styles.row}
            innerStyle={styles.rowInner}
          >
            <Text style={styles.rowEmoji}>{opt.emoji}</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>{opt.title}</Text>
              <Text style={styles.rowSub}>{opt.sub}</Text>
            </View>
            {addonType === opt.key && <Text style={styles.selCheck}>✓</Text>}
          </SelectableCard>
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
                <Text style={styles.emptyText}>We couldn't find anything worth your time</Text>
                <Text style={styles.emptySub}>Try another vibe — we'll do better.</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={[styles.bbar, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
        <AnimatedPrimaryButton label="Add to Plan →" onPress={handleFinish} variant="rose" disabled={!addonType} />
        <AnimatedOutlineButton label="Skip" onPress={handleSkip} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  // Outer layout only
  row: { marginBottom: 10 },
  // Inner visual + padding
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
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
  bbar: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 12, backgroundColor: colors.cream },
});