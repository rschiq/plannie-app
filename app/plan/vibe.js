import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlan } from '../../hooks/usePlan';
import { usePremium } from '../../hooks/usePremium';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ScreenHeader, ProgressBar, PrimaryButton } from '../../components/UI';
import { SelectableCard } from '../../components/SelectableCard';
import { AnimatedPrimaryButton } from '../../components/ScreenTransition';
import { getPlacesByVibe } from '../../services/placesService';

const VIBES = [
  { id: 'Adventure', emoji: '⚡', desc: 'Active, exciting, and bold',    pro: true  },
  { id: 'Chill',     emoji: '☕', desc: 'Slow, cozy, and easy',           pro: false },
  { id: 'Romantic',  emoji: '🌹', desc: 'Dreamy, intimate, and special',  pro: true  },
  { id: 'Fun',       emoji: '🎉', desc: 'Playful, loud, and joyful',      pro: false },
];

const LOADING_MESSAGES = [
  (vibe) => `Creating your perfect ${vibe} date...`,
  () => 'Finding the best spots near you...',
  () => 'Matching your vibe...',
  () => 'Building your perfect plan...',
];

// ── Vibe Loader ───────────────────────────────────────────────
function VibeLoader({ visible, vibe }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!visible) return;
    setMsgIndex(0);

    const msgTimer = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 1200);

    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      ]).start(() => animateDots());
    };
    animateDots();
    return () => clearInterval(msgTimer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={loader.overlay}>
        {/* ✅ Midnight Velvet loader — deep purple, NOT warm brown */}
        <LinearGradient
          colors={['#1E1C2C', '#2A2240', '#1A1828']}
          style={loader.box}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Rose gold glow ring */}
          <View style={loader.glowRing}>
            <Text style={loader.emoji}>✨</Text>
          </View>

          <Animated.Text style={[loader.message, { opacity: fadeAnim }]}>
            {LOADING_MESSAGES[msgIndex](vibe)}
          </Animated.Text>

          <View style={loader.dots}>
            <Animated.View style={[loader.dot, { opacity: dot1 }]} />
            <Animated.View style={[loader.dot, { opacity: dot2 }]} />
            <Animated.View style={[loader.dot, { opacity: dot3 }]} />
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

export default function VibeScreen() {
  const router = useRouter();
  const { plan, updatePlan, generatePlan } = usePlan();
  const [selected, setSelected]     = useState(plan.vibe || '');
  const [showLoader, setShowLoader] = useState(false);
  const { isPremium } = usePremium();
  const PRO_VIBES = ['Romantic', 'Adventure'];

  async function confirm() {
    if (!selected) return;

    if (plan.mode === 'auto') {
      setShowLoader(true);
      try {
        const city = plan.city || 'Los Angeles, CA';
        const vibeMap = { Adventure: 'adventure', Chill: 'chill', Romantic: 'romantic', Fun: 'fun' };
        const vibeKey = vibeMap[selected] || 'chill';

        const geoUrl = 'https://maps.googleapis.com/maps/api/geocode/json?' +
          'address=' + encodeURIComponent(city) + '&key=AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8';
        const geoRes  = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (geoData.status === 'OK') {
          const { lat, lng } = geoData.results[0].geometry.location;

          let activityPlaces = await getPlacesByVibe(vibeKey, { lat, lng }, { radius: 8000, maxResults: 6 });
          if (activityPlaces.length === 0) {
            activityPlaces = await getPlacesByVibe('chill', { lat, lng }, { radius: 8000, maxResults: 6 });
          }
          const foodPlaces = await getPlacesByVibe('foodie', { lat, lng }, { radius: 5000, maxResults: 6 });

          function calcDist(from, to) {
            if (!to) return null;
            const R = 3958.8;
            const dLat = ((to.lat - from.lat) * Math.PI) / 180;
            const dLng = ((to.lng - from.lng) * Math.PI) / 180;
            const a = Math.sin(dLat / 2) ** 2 +
              Math.cos((from.lat * Math.PI) / 180) *
              Math.cos((to.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
            return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
          }

          function mapPlace(p, typeOverride) {
            const TYPE_MAP = {
              cafe: 'Cafe', restaurant: 'Restaurant', bar: 'Bar', park: 'Park',
              night_club: 'Night Club', museum: 'Museum', art_gallery: 'Art Gallery',
              bowling_alley: 'Bowling Alley', tourist_attraction: 'Attraction',
              gym: 'Gym', bakery: 'Bakery', spa: 'Spa',
            };
            const category = typeOverride || p.types?.map(t => TYPE_MAP[t]).find(Boolean) || 'Place';
            return {
              id: p.id, name: p.name, category, type: category,
              desc: p.address || 'Near your location',
              address: p.address || 'Near your location',
              rating: p.rating != null ? Number(p.rating) : null,
              totalRatings: p.totalRatings || 0,
              isOpenNow: p.isOpenNow ?? null,
              distance: calcDist({ lat, lng }, p.location),
              location: p.location || null,
              photoUrl: p.photoUrl ?? null,
            };
          }

          const activity = activityPlaces.length > 0
            ? mapPlace(activityPlaces[Math.floor(Math.random() * activityPlaces.length)]) : null;
          const food = foodPlaces.length > 0
            ? mapPlace(foodPlaces[Math.floor(Math.random() * foodPlaces.length)], 'Restaurant') : null;

          const addonTypes = ['flowers', 'dessert', 'scenic'];
          const addonType  = addonTypes[Math.floor(Math.random() * addonTypes.length)];
          const addonOverride = {
            flowers: { type: 'florist',            keyword: 'flower shop' },
            dessert: { type: 'bakery',             keyword: 'dessert sweets' },
            scenic:  { type: 'tourist_attraction', keyword: 'scenic spot' },
          };
          const o = addonOverride[addonType];
          const addonUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?' +
            'location=' + lat + ',' + lng + '&radius=8000&type=' + o.type +
            '&keyword=' + encodeURIComponent(o.keyword) + '&key=AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8';
          const addonRes    = await fetch(addonUrl);
          const addonData   = await addonRes.json();
          const addonResults = addonData.results ?? [];
          const addonRaw    = addonResults.length > 0
            ? addonResults[Math.floor(Math.random() * Math.min(addonResults.length, 5))] : null;

          const addonItem = addonRaw ? {
            id: addonRaw.place_id, name: addonRaw.name, type: addonType,
            note: addonRaw.opening_hours?.open_now ? 'Open now' : 'Nearby',
            desc: addonRaw.vicinity || 'Near your location',
            address: addonRaw.vicinity || 'Near your location',
            rating: addonRaw.rating ? Number(addonRaw.rating) : null,
            totalRatings: addonRaw.user_ratings_total || 0,
            distance: calcDist({ lat, lng }, addonRaw.geometry?.location
              ? { lat: addonRaw.geometry.location.lat, lng: addonRaw.geometry.location.lng } : null),
            location: addonRaw.geometry?.location
              ? { lat: addonRaw.geometry.location.lat, lng: addonRaw.geometry.location.lng } : null,
          } : null;

          updatePlan({ vibe: selected, mode: 'auto', activity, food, addonType: addonItem ? addonType : null, addonItem });
        }
      } catch (e) {
        console.log('Plan it for me error:', e.message);
        const generated = generatePlan(selected, plan.budget, plan.time);
        updatePlan({ vibe: selected, ...generated });
      }

      setTimeout(() => { setShowLoader(false); router.push('/plan/cart'); }, 3000);

    } else {
      updatePlan({ vibe: selected });
      router.push('/plan/activity');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <VibeLoader visible={showLoader} vibe={selected} />

      <ScreenHeader
        title={'Pick the\n'}
        italic="vibe."
        subtitle="What kind of night are you going for?"
      />
      <ProgressBar total={7} current={3} />

      <View style={styles.grid}>
        {VIBES.map((item) => {
          const sel = selected === item.id;
          return (
            <SelectableCard
              key={item.id}
              selected={sel}
              onPress={() => {
                if (PRO_VIBES.includes(item.id) && !isPremium) {
                  router.push('/pro');
                  return;
                }
                setSelected(item.id);
              }}
              style={styles.card}
              innerStyle={styles.cardInner}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.name}>
                {item.id} {item.pro && !isPremium ? '🔒' : ''}
              </Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </SelectableCard>
          );
        })}
      </View>

      <View style={styles.bbar}>
        <AnimatedPrimaryButton label="Continue →" onPress={confirm} disabled={!selected} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 14,
    alignContent: 'flex-start',
    paddingTop: 4,
  },

  // ── Vibe card — outer layout only ────────────────────────
  card: { width: '47%' },
  // ── Vibe card — inner visual + padding ───────────────────
  cardInner: { padding: 20, alignItems: 'center' },

  emoji: { fontSize: 32, marginBottom: 8 },
  name: {
    fontFamily: fonts.displayMedium,
    fontSize: 20,
    color: '#F2EDE8',     // ✅ explicit warm white
    marginBottom: 4,
    textAlign: 'center',
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(242,237,232,0.50)',   // ✅ explicit muted warm white
    textAlign: 'center',
    lineHeight: 15,
  },

  bbar: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
    backgroundColor: colors.cream,
  },
});

// ── Loader styles ─────────────────────────────────────────────
const loader = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ✅ Midnight Velvet — deep purple, no warm brown
  box: {
    width: 280,
    borderRadius: 28,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,149,111,0.15)',
  },
  glowRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212,149,111,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,149,111,0.20)',
  },
  emoji:   { fontSize: 36 },
  message: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.gold,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot:  {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.rose,     // ✅ rose gold dots
  },
});