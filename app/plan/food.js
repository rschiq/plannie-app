// app/plan/food.js
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius } from '../../constants/theme';
import { RESTAURANTS } from '../../data';
import { getPlacesNearby, getPlacesByVibe, getReadableType, shortenVicinity, getCurationLabel, fetchPlaceDetails } from '../../services/placesService';
import { ScreenHeader, ProgressBar, PrimaryButton, OutlineButton } from '../../components/UI';
import { ItemCard } from '../../components/ItemCard';

function getTag(p) {
  if (p.rating >= 4.8)                          return 'Top rated';
  if (p.totalRatings > 1000)                    return 'Popular';
  if (p.isOpenNow === true)                     return 'Open now';
  if (p.priceLevel === 0 || p.priceLevel === 1) return 'Budget friendly';
  if (p.rating >= 4.5)                          return 'Highly rated';
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

export default function FoodScreen() {
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const [selected, setSelected] = useState(plan.food);
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { loadRestaurants(); }, []);

  async function loadRestaurants() {
    setLoading(true);
    try {
      // ✅ Use stored coords only — no geocoding fallback
      // Geocoding "Studio City" returns broad LA coords → wrong results
      if (!plan.coords?.lat || !plan.coords?.lng) {
        console.log('[Food] No coords stored — using local fallback data');
        setItems(RESTAURANTS[plan.vibe] || RESTAURANTS.Romantic);
        setLoading(false);
        return;
      }

      const { lat: baseLat, lng: baseLng } = plan.coords;
      const selectedArea = (plan.city || '').split(',')[0].trim();

      // PART 4: Multi-stop — search near activity first
      const activityLocation = plan.activity?.location;
      let places = [];

      if (activityLocation?.lat && activityLocation?.lng) {
        places = await getPlacesNearby(
          ['restaurant', 'cafe', 'bar'],
          activityLocation,
          { radius: 1500, maxResults: 12, selectedArea }
        );
        if (places.length < 4) {
          places = await getPlacesNearby(
            ['restaurant', 'cafe', 'bar'],
            activityLocation,
            { radius: 3000, maxResults: 12, selectedArea }
          );
        }
      }

      // Fallback to plan coords if no activity or still sparse
      if (places.length < 3) {
        places = await getPlacesByVibe(
          'foodie',
          { lat: baseLat, lng: baseLng },
          { radius: 2000, maxResults: 12, selectedArea }
        );
        if (places.length < 4) {
          places = await getPlacesByVibe(
            'foodie',
            { lat: baseLat, lng: baseLng },
            { radius: 5000, maxResults: 12, selectedArea }
          );
        }
      }

      // PART 7: avoid showing same type as activity
      const activityType = plan.activity?.type || '';
      const filtered = places.filter(p => {
        const type = getReadableType(p.types);
        return type !== activityType;
      });

      const finalPlaces = filtered.length >= 3 ? filtered : places;

      if (finalPlaces.length > 0) {
        const refCoords = activityLocation || { lat: plan.coords.lat, lng: plan.coords.lng };

        // PART 5: enrich photos for places missing them (capped at 4)
        const needsPhoto = finalPlaces.filter(p => !p.photoUrl).slice(0, 4);
        if (needsPhoto.length > 0) {
          await Promise.allSettled(needsPhoto.map(async p => {
            const d = await fetchPlaceDetails(p.id);
            if (d?.photos?.[0]) p.photoUrl = d.photos[0];
          }));
        }

        const mapped = finalPlaces.map(p => {
          const dist = p.distanceMiles ?? calcDistMiles(refCoords, p.location);
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
            rating:        p.rating != null ? Number(p.rating) : null,
            totalRatings:  p.totalRatings || 0,
            isOpenNow:     p.isOpenNow ?? null,
            distance:      dist,
            tag:           getTag(p),
            featured:      p.rating >= 4.5,
            popular:       p.totalRatings > 500,
            photoUrl:      p.photoUrl ?? null,
            location:      p.location || null,
            curationLabel: getCurationLabel({ ...p, distance: dist }, 'foodie'),
          };
        });

        setItems(mapped);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.log('Places API failed, using local data:', e.message);
    }

    setItems(RESTAURANTS[plan.vibe] || RESTAURANTS.Romantic);
    setLoading(false);
  }

  function handleAdd()  { updatePlan({ food: selected }); router.push('/plan/addons'); }
  function handleSkip() { updatePlan({ food: null });     router.push('/plan/addons'); }

  const btnLabel = selected
    ? `✓ Add "${selected.name.split(' ').slice(0, 3).join(' ')}" →`
    : 'Add Restaurant →';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={'Perfect spots to\n'}
        italic="continue the night."
        subtitle="Curated restaurants that pair great with your date."
      />
      <ProgressBar total={7} current={5} />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.rose} />
          <Text style={styles.loadingText}>Finding restaurants near you…</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              selected={selected?.id === item.id}
              onSelect={setSelected}
              type="food"
            />
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      <View style={styles.bbar}>
        <PrimaryButton label={btnLabel} onPress={handleAdd} variant="rose" disabled={!selected} />
        <OutlineButton label="Skip" onPress={handleSkip} />
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
  bbar:        { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, backgroundColor: colors.cream },
});