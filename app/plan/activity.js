// app/plan/activity.js
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius } from '../../constants/theme';
import { ACTIVITIES } from '../../data';
import { getPlacesByVibe, getReadableType, shortenVicinity, getCurationLabel, fetchPlaceDetails } from '../../services/placesService';
import { ScreenHeader, ProgressBar, PrimaryButton, OutlineButton } from '../../components/UI';
import { ItemCard } from '../../components/ItemCard';

const VIBE_MAP = {
  Chill: 'chill', Fun: 'fun', Romantic: 'romantic', Adventure: 'adventure',
};

// Radius per vibe — tight around selected neighborhood
// Adventure needs wider net since escape rooms are sparse
const VIBE_RADIUS = {
  chill: 2000, fun: 2000, romantic: 2000,
  adventure: 15000, foodie: 2000,
};

function getTag(p) {
  if (p.rating >= 4.8)                         return 'Top rated';
  if (p.totalRatings > 1000)                   return 'Popular';
  if (p.isOpenNow === true)                    return 'Open now';
  if (p.priceLevel === 0 || p.priceLevel === 1)return 'Budget friendly';
  if (p.rating >= 4.5)                         return 'Highly rated';
  return 'Nearby';
}

function calcDistMiles(from, to) {
  if (!from || !to) return null;
  const R = 3958.8;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
    Math.cos((to.lat  * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

export default function ActivityScreen() {
  const router = useRouter();
  const { plan, updatePlan, getTimeLabel } = usePlan();
  const [selected, setSelected] = useState(plan.activity);
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const timeLabel = getTimeLabel();

  useEffect(() => { loadPlaces(); }, []);

  async function loadPlaces() {
    setLoading(true);
    try {
      const vibe   = VIBE_MAP[plan.vibe] || 'chill';
      const searchRadius = VIBE_RADIUS[vibe] ?? 2000;

      // ✅ CRITICAL: Always use stored coords from autocomplete selection.
      // Never geocode city name — "Studio City" geocodes to a broad LA area,
      // returning results from Burbank, Hollywood, etc.
      // If no coords (unlikely), show fallback data — don't guess location.
      if (!plan.coords?.lat || !plan.coords?.lng) {
        console.log('[Activity] No coords stored — using local fallback data');
        setItems(ACTIVITIES[plan.vibe] || ACTIVITIES.Romantic);
        setLoading(false);
        return;
      }

      const { lat, lng } = plan.coords;

      // Extract area name for local boost — "Studio City, Los Angeles" → "Studio City"
      const selectedArea = (plan.city || '').split(',')[0].trim();

      // First pass — tight radius around selected neighborhood
      let places = await getPlacesByVibe(vibe, { lat, lng }, {
        radius: searchRadius, maxResults: 12, selectedArea,
      });

      // Widen gradually if sparse — but never to full city level
      if (places.length < 4 && vibe !== 'adventure') {
        places = await getPlacesByVibe(vibe, { lat, lng }, {
          radius: 5000, maxResults: 12, selectedArea,
        });
      }
      if (places.length < 3) {
        places = await getPlacesByVibe(vibe, { lat, lng }, {
          radius: 10000, maxResults: 12, selectedArea,
        });
      }

      if (places.length > 0) {
        // PART 5: enrich photos for any place missing them (parallel, capped at 4)
        const needsPhoto = places.filter(p => !p.photoUrl).slice(0, 4);
        if (needsPhoto.length > 0) {
          await Promise.allSettled(needsPhoto.map(async p => {
            const d = await fetchPlaceDetails(p.id);
            if (d?.photos?.[0]) p.photoUrl = d.photos[0];
          }));
        }

        const mapped = places.map(p => {
          const dist = p.distanceMiles ?? calcDistMiles({ lat, lng }, p.location);
          // PART 6: consistent full data object
          return {
            id:            p.id,
            place_id:      p.id,
            name:          p.name,
            category:      getReadableType(p.types),
            type:          getReadableType(p.types),
            shortLocation: p.shortLocation || shortenVicinity(p.address) || '',
            desc:          p.shortLocation || shortenVicinity(p.address) || '',
            address:       p.address || '',
            rating:        p.rating  != null ? Number(p.rating) : null,
            totalRatings:  p.totalRatings || 0,
            isOpenNow:     p.isOpenNow ?? null,
            distance:      dist,
            tag:           getTag(p),
            featured:      p.rating >= 4.5,
            popular:       p.totalRatings > 500,
            photoUrl:      p.photoUrl ?? null,
            location:      p.location || null,
            curationLabel: getCurationLabel({ ...p, distance: dist }, vibe),
          };
        });
        setItems(mapped);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.log('Places API failed, using local data:', e.message);
    }
    setItems(ACTIVITIES[plan.vibe] || ACTIVITIES.Romantic);
    setLoading(false);
  }

  function handleAdd() { updatePlan({ activity: selected }); router.push('/plan/food-ask'); }
  function handleSkip() { updatePlan({ activity: null });   router.push('/plan/food-ask'); }

  const btnLabel = selected
    ? `✓ Add "${selected.name.split(' ').slice(0, 3).join(' ')}" →`
    : 'Add Activity →';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={'Your best\n'}
        italic="matches."
        subtitle={`Top ${plan.vibe?.toLowerCase() || ''} activities near ${plan.city?.split(',')[0] || 'you'}.`}
      />
      <ProgressBar total={7} current={4} />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.rose} />
          <Text style={styles.loadingText}>Finding real spots near you…</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {timeLabel && (
            <View style={styles.todBanner}>
              <Text style={styles.todIcon}>{timeLabel.icon}</Text>
              <Text style={styles.todText}>{timeLabel.msg}</Text>
            </View>
          )}
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              selected={selected?.id === item.id}
              onSelect={setSelected}
              type="activity"
            />
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      <View style={styles.bbar}>
        <PrimaryButton label={btnLabel} onPress={handleAdd} variant="rose" disabled={!selected} />
        <OutlineButton label="Skip for now" onPress={handleSkip} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.cream },
  scroll:      { flex: 1 },
  content:     { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  loader:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: fonts.body, fontSize: 14, color: colors.gray2 },
  todBanner:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1E1A0E', borderRadius: radius.sm, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(201,169,110,0.3)' },
  todIcon:     { fontSize: 22 },
  todText:     { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold, flex: 1, lineHeight: 18 },
  bbar:        { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, backgroundColor: colors.cream },
});