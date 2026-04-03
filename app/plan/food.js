import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius } from '../../constants/theme';
import { RESTAURANTS } from '../../data';
import { getPlacesByVibe } from '../../services/placesService';
import { ScreenHeader, ProgressBar, PrimaryButton, OutlineButton } from '../../components/UI';
import { ItemCard } from '../../components/ItemCard';

const VIBE_MAP = {
  Chill: 'chill',
  Fun: 'fun',
  Romantic: 'romantic',
  Adventure: 'adventure',
};

function cleanType(types = []) {
  const TYPE_MAP = {
    cafe: 'Cafe', restaurant: 'Restaurant', bar: 'Bar', park: 'Park',
    night_club: 'Night Club', museum: 'Museum', art_gallery: 'Art Gallery',
    bowling_alley: 'Bowling Alley', amusement_park: 'Amusement Park',
    gym: 'Gym', stadium: 'Stadium', tourist_attraction: 'Attraction',
    shopping_mall: 'Mall', movie_theater: 'Cinema', spa: 'Spa', bakery: 'Bakery',
  };
  for (const t of types) { if (TYPE_MAP[t]) return TYPE_MAP[t]; }
  return 'Place';
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

function getTag(p) {
  if (p.rating >= 4.8) return 'Top rated';
  if (p.totalRatings > 1000) return 'Popular';
  if (p.isOpenNow === true) return 'Open now';
  if (p.priceLevel === 0 || p.priceLevel === 1) return 'Budget friendly';
  if (p.rating >= 4.5) return 'Highly rated';
  return 'Nearby';
}

export default function FoodScreen() {
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const [selected, setSelected] = useState(plan.food);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRestaurants(); }, []);

  async function loadRestaurants() {
    setLoading(true);
    try {
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(plan.city)}&key=AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8`
      );
      const geoData = await geoRes.json();

      if (geoData.status === 'OK') {
        const { lat, lng } = geoData.results[0].geometry.location;

        // Always fetch restaurants for food screen regardless of vibe
        const places = await getPlacesByVibe('foodie', { lat, lng }, { radius: 8000, maxResults: 6 });

        if (places.length > 0) {
          const mapped = places.map((p) => ({
            id: p.id || p.place_id,
place_id: p.place_id || p.id,
name: p.name,
category: cleanType(p.types),
type: cleanType(p.types),
desc: p.address || 'Near your location',
address: p.address || 'Near your location',
rating: p.rating != null ? Number(p.rating) : null,
totalRatings: p.totalRatings || 0,
isOpenNow: p.isOpenNow ?? null,
distance: p.location
  ? Number(calcDistMiles(geoData.results[0].geometry.location, p.location))
  : null,
tag: getTag(p),
featured: p.rating >= 4.5,
popular: p.totalRatings > 500,
photoUrl: p.photoUrl ?? null,
location: p.location || null,
          }));
          setItems(mapped);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.log('Places API failed, using local data:', e.message);
    }
    setItems(RESTAURANTS[plan.vibe] || RESTAURANTS.Romantic);
    setLoading(false);
  }

  function handleAdd() { updatePlan({ food: selected }); router.push('/plan/addons'); }
  function handleSkip() { updatePlan({ food: null }); router.push('/plan/addons'); }

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
          {items.map((item) => (
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
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: fonts.body, fontSize: 14, color: colors.gray2 },
  bbar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, backgroundColor: colors.cream },
});