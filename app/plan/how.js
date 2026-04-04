import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ScreenHeader, ProgressBar } from '../../components/UI';
import { getPlacesByVibe } from '../../services/placesService';

const VIBES = ['Adventure', 'Chill', 'Romantic', 'Fun'];
const CARD_HEIGHT = 200;

const LOADING_MESSAGES = [
  'Finding the perfect vibe...',
  'Curating your night...',
  'Picking the best spots...',
  'Almost ready...',
];

// ── Loader ────────────────────────────────────────────────────
function SurpriseLoader({ visible }) {
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
        {/* ✅ Midnight Velvet loader — deep purple-black, no warm brown */}
        <LinearGradient
          colors={['#1E1C2C', '#2A2240', '#1A1828']}
          style={loader.box}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Rose gold glow ring */}
          <View style={loader.glowRing}>
            <Text style={loader.emoji}>🎲</Text>
          </View>

          <Animated.Text style={[loader.message, { opacity: fadeAnim }]}>
            {LOADING_MESSAGES[msgIndex]}
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

export default function HowScreen() {
  const router = useRouter();
  const { plan, updatePlan, generatePlan } = usePlan();
  const [showLoader, setShowLoader] = useState(false);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params?.surprise === 'true') doSurprise();
  }, []);

  function chooseManual() {
    updatePlan({ mode: 'manual' });
    router.push('/plan/vibe');
  }

  function choosePlanItForMe() {
    updatePlan({ mode: 'auto' });
    router.push('/plan/vibe');
  }

  async function doSurprise() {
    const vibe = VIBES[Math.floor(Math.random() * VIBES.length)];
    const vibeMap = { Adventure: 'adventure', Chill: 'chill', Romantic: 'romantic', Fun: 'fun' };
    setShowLoader(true);

    try {
      const city = plan.city || 'Los Angeles, CA';
      const geoUrl = 'https://maps.googleapis.com/maps/api/geocode/json?' +
        'address=' + encodeURIComponent(city) + '&key=AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8';
      const geoRes  = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (geoData.status === 'OK') {
        const { lat, lng } = geoData.results[0].geometry.location;
        const vibeKey = vibeMap[vibe] || 'chill';

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

        updatePlan({ vibe, mode: 'auto', activity, food, addonType: addonItem ? addonType : null, addonItem });
      }
    } catch (e) {
      console.log('Surprise fetch error:', e.message);
      const generated = generatePlan(vibe, plan.budget, plan.time);
      updatePlan({ ...generated });
    }

    setTimeout(() => { setShowLoader(false); router.push('/plan/cart'); }, 2000);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SurpriseLoader visible={showLoader} />

      <ScreenHeader
        title={'How would you\n'}
        italic="like to plan?"
        subtitle="Pick your style — we'll do the rest."
      />
      <ProgressBar total={7} current={2} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.grid}>

          {/* ── Manual Card — dark elevated surface ── */}
          <TouchableOpacity style={styles.manualCard} onPress={chooseManual} activeOpacity={0.85}>
            <Text style={styles.cardIcon}>🛠️</Text>
            <View style={styles.cardMiddle}>
              {/* ✅ Explicit warm white — NOT colors.charcoal (now light) */}
              <Text style={styles.cardTitleDark} numberOfLines={2}>Build it{'\n'}myself</Text>
              <Text style={styles.cardSubDark} numberOfLines={2}>Pick each part step by step</Text>
            </View>
            <View style={styles.badgeMuted}>
              <Text style={styles.badgeMutedText}>MANUAL</Text>
            </View>
          </TouchableOpacity>

          {/* ── Plan it for me Card — rose gold gradient ── */}
          <TouchableOpacity style={styles.autoCardWrap} onPress={choosePlanItForMe} activeOpacity={0.85}>
            {/* ✅ Explicit dark purple gradient — NOT colors.charcoal (now warm white) */}
            <LinearGradient
              colors={['#2A2240', '#1E1C2C', '#241E38']}
              style={styles.autoCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.cardIcon}>✨</Text>
              <View style={styles.cardMiddle}>
                {/* ✅ Explicit warm white text */}
                <Text style={styles.cardTitleLight} numberOfLines={2}>Plan it{'\n'}for me</Text>
                <Text style={styles.cardSubLight} numberOfLines={2}>Full plan in seconds</Text>
              </View>
              <View style={styles.badgeGold}>
                <Text style={styles.badgeGoldText}>✦ SMART</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Surprise Me — dark with gold text ── */}
        <TouchableOpacity style={styles.surpriseBtn} onPress={doSurprise} activeOpacity={0.85}>
          {/* ✅ Explicit dark gradient — NOT colors.charcoal */}
          <LinearGradient
            colors={['#221F32', '#1A1828']}
            style={styles.surpriseInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.surpriseBtnText}>🎲  Surprise Me — generate a random plan</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/(tabs)')} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/(tabs)/plan')} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>💫</Text>
          <Text style={[styles.tabLabel, { color: colors.rose }]}>Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/(tabs)/saved')} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>🗂️</Text>
          <Text style={styles.tabLabel}>Saved</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/(tabs)/profile')} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.cream },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 4 },

  grid: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'stretch' },

  // ── Manual card — dark surface ──────────────────────────────
  manualCard: {
    width: '48%',
    height: CARD_HEIGHT,
    backgroundColor: colors.cream2,   // #181626 dark elevated
    borderRadius: radius.md,
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.gray4,        // #2A2838 subtle border
    ...shadow.sm,
  },

  // ── Auto card ───────────────────────────────────────────────
  autoCardWrap: { flex: 1, borderRadius: radius.md, overflow: 'hidden', ...shadow.md },
  autoCard:     { flex: 1, padding: 20, justifyContent: 'space-between' },

  cardIcon:   { fontSize: 28, marginBottom: 8 },
  cardMiddle: { flex: 1, justifyContent: 'flex-start' },

  // ✅ Dark card text — warm white explicit
  cardTitleDark: { fontFamily: fonts.displayMedium, fontSize: 18, lineHeight: 22, marginBottom: 4, color: '#F2EDE8' },
  cardSubDark:   { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: 'rgba(242,237,232,0.50)' },

  // ✅ Light card text — explicit for gradient card
  cardTitleLight: { fontFamily: fonts.displayMedium, fontSize: 18, lineHeight: 22, marginBottom: 4, color: '#F2EDE8' },
  cardSubLight:   { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: 'rgba(242,237,232,0.60)' },

  // Badges
  badgeMuted:     { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', backgroundColor: colors.gray4 },
  badgeMutedText: { fontFamily: fonts.bodySemiBold, fontSize: 9, letterSpacing: 0.8, color: colors.gray2 },

  badgeGold:      { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', backgroundColor: colors.gold },
  badgeGoldText:  { fontFamily: fonts.bodySemiBold, fontSize: 9, letterSpacing: 0.8, color: '#12101C' },

  // ── Surprise Me ─────────────────────────────────────────────
  surpriseBtn:   { borderRadius: radius.md, overflow: 'hidden', ...shadow.sm },
  surpriseInner: { paddingVertical: 18, paddingHorizontal: 20, alignItems: 'center' },
  surpriseBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.gold },

  // ── Tab bar ─────────────────────────────────────────────────
  tabBar:  { flexDirection: 'row', backgroundColor: colors.cream2, borderTopWidth: 1, borderTopColor: colors.gray4, height: 80, paddingBottom: 14, paddingTop: 4 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  tabIcon:  { fontSize: 22 },
  tabLabel: { fontSize: 10, fontFamily: fonts.bodyMedium, color: colors.gray2, marginTop: 3 },
});

// ── Loader styles ────────────────────────────────────────────
const loader = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ✅ Midnight Velvet loader — deep purple, NOT warm brown
  box: {
    width: 280,
    borderRadius: 28,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,149,111,0.15)',  // subtle rose gold border
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
  dot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.rose },
});