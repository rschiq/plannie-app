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

// ─────────────────────────────────────────────────────────────
// SURPRISE ME — Message pools (4 rounds, random pick per round)
// ─────────────────────────────────────────────────────────────
const SURPRISE_POOLS = [
  ['🎲 Rolling the night...', '🎰 Spinning something good...', '🃏 Shuffling your date...', '🌀 Mixing things up...'],
  ['🍜 Finding something delicious...', '🥂 Somewhere fancy?', '🍣 Maybe sushi tonight?', '🍕 Or casual and fun?'],
  ['🎤 Karaoke maybe?', '🎳 Bowling night?', '🎭 Something unexpected...', '🎮 Game on!'],
  ['🌆 Found a great spot...', '✨ Almost ready...', '💫 One more second...', '🌟 Your night is ready!'],
];

const SLOT_EMOJIS = ['🎲', '🎰', '🎭', '🎤', '🍜', '🌆', '✨', '🎊'];

// ─────────────────────────────────────────────────────────────
// SURPRISE LOADER — playful, randomized, slot-machine feel
// ─────────────────────────────────────────────────────────────
function SurpriseLoader({ visible }) {
  const [message, setMessage]     = useState(SURPRISE_POOLS[0][0]);
  const [slotEmoji, setSlotEmoji] = useState('🎲');
  const [round, setRound]         = useState(0);

  const msgOpacity    = useRef(new Animated.Value(0)).current;
  const msgTranslateY = useRef(new Animated.Value(10)).current;
  const emojiScale    = useRef(new Animated.Value(1)).current;
  const emojiOpacity  = useRef(new Animated.Value(1)).current;
  const glowScale     = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!visible) return;

    // Pick one random message from each pool upfront
    const picked = SURPRISE_POOLS.map(
      (pool) => pool[Math.floor(Math.random() * pool.length)]
    );

    let currentRound = 0;
    let emojiIndex   = 0;

    // Show first message immediately
    setMessage(picked[0]);
    setRound(0);
    msgTranslateY.setValue(10);
    Animated.parallel([
      Animated.timing(msgOpacity,    { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(msgTranslateY, { toValue: 0, speed: 16, bounciness: 6, useNativeDriver: true }),
    ]).start();

    function showNextMessage() {
      // Slide out upward
      Animated.parallel([
        Animated.timing(msgOpacity,    { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(msgTranslateY, { toValue: -10, duration: 260, useNativeDriver: true }),
      ]).start(() => {
        currentRound = (currentRound + 1) % picked.length;
        setMessage(picked[currentRound]);
        setRound(currentRound);
        msgTranslateY.setValue(12);
        // Slide in from below
        Animated.parallel([
          Animated.timing(msgOpacity,    { toValue: 1, duration: 360, useNativeDriver: true }),
          Animated.spring(msgTranslateY, { toValue: 0, speed: 14, bounciness: 5, useNativeDriver: true }),
        ]).start();
      });
    }

    function flipEmoji() {
      Animated.parallel([
        Animated.timing(emojiScale,   { toValue: 0.5, duration: 130, useNativeDriver: true }),
        Animated.timing(emojiOpacity, { toValue: 0,   duration: 130, useNativeDriver: true }),
      ]).start(() => {
        emojiIndex = (emojiIndex + 1) % SLOT_EMOJIS.length;
        setSlotEmoji(SLOT_EMOJIS[emojiIndex]);
        Animated.parallel([
          Animated.spring(emojiScale,   { toValue: 1, speed: 22, bounciness: 14, useNativeDriver: true }),
          Animated.timing(emojiOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        ]).start();
      });
    }

    function pulseGlow() {
      Animated.sequence([
        Animated.spring(glowScale, { toValue: 1.14, speed: 7, bounciness: 5, useNativeDriver: true }),
        Animated.spring(glowScale, { toValue: 1.0,  speed: 7, bounciness: 5, useNativeDriver: true }),
      ]).start(() => pulseGlow());
    }

    function animateDots() {
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1,   duration: 240, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1,   duration: 240, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1,   duration: 240, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0.3, duration: 240, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0.3, duration: 240, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0.3, duration: 240, useNativeDriver: true }),
      ]).start(() => animateDots());
    }

    pulseGlow();
    animateDots();

    // Schedule message + emoji changes with randomized timing
    const timers = [];
    let elapsed  = 0;
    picked.forEach((_, idx) => {
      if (idx === 0) return;
      const delay = elapsed + 1000 + Math.floor(Math.random() * 400);
      elapsed = delay;
      timers.push(setTimeout(showNextMessage, delay));
      timers.push(setTimeout(flipEmoji, delay - 180));
    });

    return () => timers.forEach(clearTimeout);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={loader.overlay}>
        <LinearGradient
          colors={['#1E1C2C', '#2A2240', '#1A1828']}
          style={loader.box}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Pulsing glow ring with slot emoji */}
          <Animated.View style={[loader.glowRing, { transform: [{ scale: glowScale }] }]}>
            <Animated.Text
              style={[loader.slotEmoji, { opacity: emojiOpacity, transform: [{ scale: emojiScale }] }]}
            >
              {slotEmoji}
            </Animated.Text>
          </Animated.View>

          {/* Round progress dots */}
          <View style={loader.rounds}>
            {SURPRISE_POOLS.map((_, i) => (
              <View key={i} style={[loader.roundDot, i <= round && loader.roundDotActive]} />
            ))}
          </View>

          {/* Animated message — slides in from below */}
          <Animated.Text
            style={[loader.message, { opacity: msgOpacity, transform: [{ translateY: msgTranslateY }] }]}
          >
            {message}
          </Animated.Text>

          {/* Wave dots */}
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
        'address=' + encodeURIComponent(city) + '&key=AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';
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
          '&keyword=' + encodeURIComponent(o.keyword) + '&key=AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';
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

          {/* ── Manual Card ── */}
          <TouchableOpacity style={styles.manualCard} onPress={chooseManual} activeOpacity={0.85}>
            <Text style={styles.cardIcon}>🛠️</Text>
            <Text style={styles.cardTitleDark}>Build it{'\n'}myself</Text>
            <Text style={styles.cardSubDark}>Pick each part{'\n'}step by step</Text>
            <View style={styles.badgeMuted}>
              <Text style={styles.badgeMutedText}>MANUAL</Text>
            </View>
          </TouchableOpacity>

          {/* ── Plan it for me Card ── */}
          <TouchableOpacity style={styles.autoCardWrap} onPress={choosePlanItForMe} activeOpacity={0.85}>
            <LinearGradient
              colors={['#2A2240', '#1E1C2C', '#241E38']}
              style={styles.autoCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.cardIcon}>✨</Text>
              <Text style={styles.cardTitleLight}>Plan it{'\n'}for me</Text>
              <Text style={styles.cardSubLight}>Full plan in{'\n'}seconds</Text>
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

  // ── Manual card ─────────────────────────────────────────────
  manualCard: {
    width: '48%',
    height: CARD_HEIGHT,
    backgroundColor: colors.cream2,
    borderRadius: radius.md,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.gray4,
    ...shadow.sm,
  },

  // ── Auto card ────────────────────────────────────────────────
  autoCardWrap: { flex: 1, borderRadius: radius.md, overflow: 'hidden', ...shadow.md },
  autoCard:     { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },

  cardIcon: { fontSize: 26 },

  // ✅ Centered text — no more left-align or overlap
  cardTitleDark:  { fontFamily: fonts.displayMedium, fontSize: 17, lineHeight: 21, color: '#F2EDE8', textAlign: 'center' },
  cardSubDark:    { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: 'rgba(242,237,232,0.50)', textAlign: 'center' },
  cardTitleLight: { fontFamily: fonts.displayMedium, fontSize: 17, lineHeight: 21, color: '#F2EDE8', textAlign: 'center' },
  cardSubLight:   { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: 'rgba(242,237,232,0.60)', textAlign: 'center' },

  // Badges
  badgeMuted:     { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', backgroundColor: colors.gray4 },
  badgeMutedText: { fontFamily: fonts.bodySemiBold, fontSize: 9, letterSpacing: 0.8, color: colors.gray2 },

  badgeGold:      { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', backgroundColor: colors.gold },
  badgeGoldText:  { fontFamily: fonts.bodySemiBold, fontSize: 9, letterSpacing: 0.8, color: '#12101C' },

  surpriseBtn:     { borderRadius: radius.md, overflow: 'hidden', ...shadow.sm },
  surpriseInner:   { paddingVertical: 20, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  surpriseBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.gold, textAlign: 'center' },

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
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    width: 300,
    borderRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,149,111,0.18)',
  },
  // Pulsing glow ring
  glowRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(212,149,111,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(212,149,111,0.25)',
  },
  slotEmoji: { fontSize: 40 },

  // Round progress indicators
  rounds: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  roundDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(212,149,111,0.25)',
  },
  roundDotActive: {
    backgroundColor: colors.rose,
    width: 18,  // active dot is wider (pill shape)
  },

  // Message — slides in/out
  message: {
    fontFamily: fonts.bodyMedium,
    fontSize: 17,
    color: '#F2EDE8',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 26,
    minHeight: 52,  // reserve space so layout doesn't jump
  },

  // Wave dots
  dots: { flexDirection: 'row', gap: 8 },
  dot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.rose },
});