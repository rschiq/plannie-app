// app/plan/activity.js
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius } from '../../constants/theme';
import { ACTIVITIES } from '../../data';
import { getPlacesByCategory, getReadableType, shortenVicinity, getCurationLabel, fetchPlaceDetails } from '../../services/placesService';
import { ScreenHeader, ProgressBar, PrimaryButton, OutlineButton } from '../../components/UI';
import { ItemCard } from '../../components/ItemCard';
import RizzLoader from '../../components/RizzLoader';
import { minLoadingDisplaySince } from '../../utils/minLoadingDisplay';

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
    const startTime = Date.now();

    try {
      let lat, lng;

      if (plan.coords?.lat && plan.coords?.lng) {
        lat = plan.coords.lat;
        lng = plan.coords.lng;
      } else if (plan.city) {
        // Geocode the city name as fallback
        const geoRes  = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(plan.city)}&key=AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w`
        );
        const geoData = await geoRes.json();
        if (geoData.status === 'OK') {
          lat = geoData.results[0].geometry.location.lat;
          lng = geoData.results[0].geometry.location.lng;
        } else {
          Alert.alert('Geocode Failed', `status: ${geoData.status}`);
          setItems(ACTIVITIES[plan.vibe] || ACTIVITIES.Romantic);
          await minLoadingDisplaySince(startTime);
          setLoading(false);
          return;
        }
      } else {
        setItems(ACTIVITIES[plan.vibe] || ACTIVITIES.Romantic);
        await minLoadingDisplaySince(startTime);
        setLoading(false);
        return;
      }

      const selectedArea = (plan.city || '').split(',')[0].trim();

      let places = await getPlacesByCategory('activity', { lat, lng }, {
        radius: 8000, maxResults: 12, selectedArea, budget: plan.budget,
      });

      if (places.length < 4) {
        places = await getPlacesByCategory('activity', { lat, lng }, {
          radius: 20000, maxResults: 12, selectedArea, budget: plan.budget,
        });
      }
      if (places.length < 3) {
        places = await getPlacesByCategory('activity', { lat, lng }, {
          radius: 35000, maxResults: 12, selectedArea, budget: plan.budget,
        });
      }

      if (places.length > 0) {
        const needsPhoto = places.filter(p => !p.photoUrl).slice(0, 4);
        if (needsPhoto.length > 0) {
          await Promise.allSettled(needsPhoto.map(async p => {
            const d = await fetchPlaceDetails(p.id);
            if (d?.photos?.[0]) p.photoUrl = d.photos[0];
          }));
        }

        const mapped = places.map(p => {
          const dist = p.distanceMiles ?? calcDistMiles({ lat, lng }, p.location);
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
            curationLabel: getCurationLabel({ ...p, distance: dist }, 'activity'),
          };
        });
        setItems(mapped);
        await minLoadingDisplaySince(startTime);
        setLoading(false);
        return;
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setItems(ACTIVITIES[plan.vibe] || ACTIVITIES.Romantic);
    await minLoadingDisplaySince(startTime);
    setLoading(false);
  }

  function handleAdd()  { updatePlan({ activity: selected }); router.push('/plan/food-ask'); }
  function handleSkip() { updatePlan({ activity: null });     router.push('/plan/food-ask'); }

  const btnLabel = selected
    ? `✓ Add "${selected.name.split(' ').slice(0, 3).join(' ')}" →`
    : 'Add Activity →';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={'Your best\n'}
        italic="matches."
        subtitle={`Top activities near ${plan.city?.split(',')[0] || 'you'}.`}
      />
      <ProgressBar total={7} current={4} />

      {loading ? (
        <View style={styles.loaderBody}>
          <RizzLoader embedded />
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
  loaderBody:  { flex: 1, minHeight: 0, alignSelf: 'stretch' },
  scroll:      { flex: 1 },
  content:     { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  todBanner:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1E1A0E', borderRadius: radius.sm, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(201,169,110,0.3)' },
  todIcon:     { fontSize: 22 },
  todText:     { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold, flex: 1, lineHeight: 18 },
  bbar:        { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, backgroundColor: colors.cream },
});