// app/plan/results.js
// Results list + in-app detail sheet + bottom nav + save
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Linking, Modal, Dimensions, Alert,
  TextInput, KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import {
  getPlacesNearby,
  getActivityPlacesMerged,
  getMoviePlacesMerged,
  isPassiveOutdoorActivityPlace,
} from '../../services/placesService';
import RizzLoader from '../../components/RizzLoader';
import { minLoadingDisplaySince } from '../../utils/minLoadingDisplay';
import { addExtraRuns, consumeRunIfAvailable } from '../../utils/runLimiter';
import PaywallModal from '../../components/PaywallModal';
import { useSavedPlaces } from '../../hooks/useSavedPlaces';
import ResultsPlaceCard from '../../components/ResultsPlaceCard';

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';
const SCREEN_W = Dimensions.get('window').width;

// ── Category config ────────────────────────────────────────────
const SUBCATEGORY_CONFIG = {
  brunch_dinner: {
    fetchTypes: ['restaurant'],
    keyword: 'restaurant',
    excludeKeywords: ['cafe', 'coffee', 'tea'],
    displayTitle: 'Restaurants',
    minRating: 4.3,
  },
  coffee_dessert: {
    fetchTypes: ['cafe'],
    keyword: 'coffee',
    excludeKeywords: [],
    displayTitle: 'Cafes',
    minRating: 4.3,
  },
  drinks: {
    fetchTypes: ['bar'],
    keyword: 'bar',
    excludeKeywords: [],
    displayTitle: 'Bars',
    minRating: 4.3,
  },
  indoor: {
    useActivityKeywordSearch: true,
    fetchTypes: [],
    keyword: null,
    excludeKeywords: [],
    displayTitle: 'Indoor Activities',
    minRating: 4.0,
    minReviews: 20,
    fetchRadius: 3500,
  },
  outdoor: {
    useActivityKeywordSearch: true,
    fetchTypes: [],
    keyword: null,
    excludeKeywords: [],
    displayTitle: 'Outdoor Activities',
    minRating: 4.0,
    minReviews: 20,
    fetchRadius: 3500,
  },
  movies: {
    useMovieKeywordSearch: true,
    fetchTypes: [],
    keyword: null,
    excludeKeywords: [],
    displayTitle: 'Movies',
    minRating: 4.2,
    minReviews: 30,
    fetchRadius: 3000,
  },
};

// ── Cuisine tabs (brunch_dinner only) ─────────────────────────
const CUISINE_TABS = [
  { key: 'japanese',  label: 'Japanese',  keyword: 'japanese' },
  { key: 'korean',    label: 'Korean',    keyword: 'korean bbq' },
  { key: 'chinese',   label: 'Chinese',   keyword: 'chinese restaurant' },
  { key: 'italian',   label: 'Italian',   keyword: 'italian restaurant' },
  { key: 'mexican',   label: 'Mexican',   keyword: 'mexican restaurant' },
  { key: 'american',  label: 'American',  keyword: 'steakhouse' },
];

function getSubcategoryConfig(category, dateIdea) {
  const key = dateIdea;
  if (SUBCATEGORY_CONFIG[key]) return SUBCATEGORY_CONFIG[key];
  if (category === 'activity') return SUBCATEGORY_CONFIG.indoor;
  return SUBCATEGORY_CONFIG.brunch_dinner;
}

// ── Activity diversity (max 2 per type group) ─────────────────
const ACTIVITY_GROUPS = [
  ['arcade'],
  ['escape'],
  ['billiard', 'pool hall', 'billiards'],
  ['skate', 'skating', 'roller'],
  ['ice skat', 'ice rink'],
  ['vr', 'virtual reality'],
  ['trampoline', 'sky zone', 'urban air', 'bounce'],
  ['laser'],
  ['bowling', 'bowl'],
  ['kart', 'go kart', 'karting'],
  ['paintball'],
  ['mini golf', 'putt', 'putt-putt'],
  ['driving range', 'topgolf'],
  ['axe throw', 'batting cage', 'batting'],
];

function getActivityGroup(place) {
  const n = (place.name || '').toLowerCase();
  for (let i = 0; i < ACTIVITY_GROUPS.length; i++) {
    if (ACTIVITY_GROUPS[i].some(m => n.includes(m))) return i;
  }
  const types = place.types || [];
  if (types.includes('bowling_alley')) return 100;
  if (types.includes('movie_theater')) return 101;
  if (types.includes('amusement_park')) return 102;
  if (types.includes('amusement_center')) return 103;
  return 200 + (place.id || '').charCodeAt(0);
}

function diversifyActivities(places, limit = 3) {
  const counts = {};
  return places.filter((p) => {
    const g = String(getActivityGroup(p));
    counts[g] = (counts[g] || 0) + 1;
    return counts[g] <= limit;
  });
}

function lightFilter(results) {
  return (results || []).filter((place) => {
    const name = (place.name || '').toLowerCase();
    const types = place.types || [];

    // remove only obvious junk
    if (
      name.includes('walmart') ||
      name.includes('target') ||
      name.includes('whole foods') ||
      name.includes('pavilions') ||
      name.includes('ralphs') ||
      types.includes('grocery_or_supermarket') ||
      types.includes('supermarket') ||
      types.includes('department_store')
    ) {
      return false;
    }

    return true;
  });
}


function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const BLOCK_LIST = [
  'walmart','target','costco','home depot','best buy','gamestop',
  'dollar tree','dollar general','marshalls','ross ','five below',
  'walgreens','cvs','rite aid','dollar store','whole foods','ralphs','pavilions','safeway','vons',
  'liquor store','gas station',
  'gym','fitness center','crossfit','ymca','planet fitness','orangetheory',
  'hospital','urgent care','clinic','dental','pharmacy',
  'school','church','storage','auto repair','car wash',
  'trampoline','sky zone','urban air','bounce','chuck e cheese',
  'hard rock cafe','cheesecake factory','buffalo wild wings',
  'ihop',"denny's",
  "bob's big boy",'cracker barrel','red lobster','hooters',
  'mcdonald','burger king','wendy','jack in the box','kfc','taco bell',
];

function isBlockedPlace(place) {
  const name  = (place.name || '').toLowerCase();
  const types = place.types || [];
  if (BLOCK_LIST.some(k => name.includes(k))) return true;
  if (types.includes('grocery_or_supermarket') || types.includes('supermarket')) return true;
  if (types.includes('department_store') || types.includes('shopping_mall')) return true;
  if (types.includes('lodging')) return true;
  return false;
}

function getCuisine(types = [], name = '') {
  const n = name.toLowerCase();
  if (n.includes('sushi') || n.includes('japanese')) return 'Japanese';
  if (n.includes('italian'))                          return 'Italian';
  if (n.includes('mexican') || n.includes('taco'))   return 'Mexican';
  if (n.includes('chinese'))                          return 'Chinese';
  if (n.includes('thai'))                             return 'Thai';
  if (n.includes('indian'))                           return 'Indian';
  if (n.includes('korean'))                           return 'Korean';
  if (n.includes('french'))                           return 'French';
  if (n.includes('steak') || n.includes('steakhouse')) return 'Steakhouse';
  if (n.includes('pizza'))                            return 'Pizza';
  if (n.includes('bbq') || n.includes('barbecue'))   return 'BBQ';
  if (n.includes('coffee') || n.includes('cafe'))    return 'Cafe';
  if (n.includes('bar') || n.includes('pub'))        return 'Bar';
  if (types.includes('restaurant'))  return 'Restaurant';
  if (types.includes('cafe'))        return 'Cafe';
  if (types.includes('bar'))         return 'Bar';
  return null;
}

function curateResults(raw) {
  raw.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  return raw;
}

function buildPhotoUrl(ref, maxW = 400) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxW}&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
}
function openMaps(place) {
  if (place.location?.lat) {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}&query_place_id=${place.id}`);
  } else {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`);
  }
}

// ── Place Detail Sheet ─────────────────────────────────────────
function PlaceDetailSheet({ place, visible, onClose, onSave, isSaved }) {
  const insets  = useSafeAreaInsets();
  const [details, setDetails]   = useState(null);
  const [detLoad, setDetLoad]   = useState(false);

  // ✅ Fetch full Place Details when sheet opens — same as cart.js swap detail
  useEffect(() => {
    if (!visible || !place?.id) return;
    setDetails(null);
    fetchFullDetails(place.id);
  }, [visible, place?.id]);

  async function fetchFullDetails(placeId) {
    setDetLoad(true);
    try {
      const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,photos,opening_hours,reviews';
      const res  = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      if (data.result) setDetails(data.result);
    } catch (e) {
      console.log('[PlaceDetail] error:', e.message);
    }
    setDetLoad(false);
  }

  if (!place) return null;

  // Use fetched details if available, fall back to nearby search data
  const photos      = details?.photos || [];
  const phone       = details?.formatted_phone_number;
  const website     = details?.website;
  const fullAddress = details?.formatted_address || place.address;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={det.overlay} pointerEvents="box-none">
        <View style={det.sheet}>
          <View style={det.handle} />
          <TouchableOpacity style={det.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={det.closeText}>✕</Text>
          </TouchableOpacity>

          {/* ── Photos — swipeable ── */}
          {detLoad ? (
            <View style={det.photoPlaceholder}>
              <ActivityIndicator size="small" color={colors.rose} />
            </View>
          ) : photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={det.photoScroll}
              scrollEnabled
            >
              {photos.slice(0, 5).map((ph, i) => (
                <Image
                  key={i}
                  source={{ uri: buildPhotoUrl(ph.photo_reference, 600) }}
                  style={[det.photo, { width: SCREEN_W }]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : place.photoUrl ? (
            <Image source={{ uri: place.photoUrl }} style={[det.photo, { width: SCREEN_W }]} resizeMode="cover" />
          ) : (
            <View style={det.photoPlaceholder}><Text style={det.photoIcon}>📍</Text></View>
          )}

          <ScrollView
            style={det.body}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 18, 26) }}
            showsVerticalScrollIndicator={false}
          >
            {/* Name + category */}
            <Text style={det.name}>{place.name}</Text>
            {place.category ? <Text style={det.category}>{place.category}</Text> : null}

            {/* Rating */}
            {place.rating && (
              <View style={det.ratingRow}>
                <Text style={det.rating}>⭐ {place.rating}</Text>
                {place.totalRatings > 0 && (
                  <Text style={det.reviews}>({place.totalRatings.toLocaleString()} reviews)</Text>
                )}
              </View>
            )}

            {/* Distance */}
            {place.distance && (
              <View style={det.row}>
                <Text style={det.rowIcon}>🚗</Text>
                <Text style={det.rowText}>{place.distance} mi away</Text>
              </View>
            )}

            {/* Address */}
            {fullAddress ? (
              <View style={det.row}>
                <Text style={det.rowIcon}>📍</Text>
                <Text style={det.rowText}>{fullAddress}</Text>
              </View>
            ) : null}

            {/* Hours today */}
            {details?.opening_hours?.weekday_text?.length > 0 && (() => {
              const day = new Date().getDay();
              const idx = day === 0 ? 6 : day - 1;
              const todayLine = details.opening_hours.weekday_text[idx];
              return todayLine ? (
                <View style={det.row}>
                  <Text style={det.rowIcon}>🕐</Text>
                  <Text style={det.rowText}>{todayLine}</Text>
                </View>
              ) : null;
            })()}

            {/* Top review snippet */}
            {details?.reviews?.[0]?.text ? (
              <View style={[det.row, { marginTop: 4 }]}>
                <Text style={det.rowIcon}>💬</Text>
                <Text style={[det.rowText, { fontStyle: 'italic' }]} numberOfLines={4}>
                  "{details.reviews[0].text}"
                </Text>
              </View>
            ) : null}

            {/* Phone */}
            {phone ? (
              <TouchableOpacity style={det.row} onPress={() => Linking.openURL(`tel:${phone}`)}>
                <Text style={det.rowIcon}>📞</Text>
                <Text style={[det.rowText, det.rowLink]}>{phone}</Text>
              </TouchableOpacity>
            ) : null}

            {/* Website */}
            {website ? (
              <TouchableOpacity style={det.row} onPress={() => Linking.openURL(website)}>
                <Text style={det.rowIcon}>🌐</Text>
                <Text style={[det.rowText, det.rowLink]} numberOfLines={1}>{website}</Text>
              </TouchableOpacity>
            ) : null}

            <View style={det.divider} />

            {/* Save */}
            <TouchableOpacity
              style={[det.primaryBtn, isSaved && det.primaryBtnSaved]}
              onPress={onSave}
              activeOpacity={0.88}
              disabled={isSaved}
            >
              <Text style={det.primaryBtnText}>
                {isSaved ? '✓ Saved!' : '🔖 Save Place'}
              </Text>
            </TouchableOpacity>

            {/* Open in Maps */}
            <TouchableOpacity style={det.outlineBtn} onPress={() => openMaps(place)} activeOpacity={0.88}>
              <Text style={det.outlineBtnText}>🗺️ Open in Maps</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const det = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', overflow: 'hidden' },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray3, alignSelf: 'center', marginTop: 12 },
  closeBtn:     { position: 'absolute', top: 10, right: 10, zIndex: 4, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.22)' },
  closeText:    { fontFamily: fonts.bodyMedium, fontSize: 18, color: '#F2EDE8', lineHeight: 20 },
  photoScroll:  { height: 220, width: SCREEN_W },
  photo:        { height: 220 },
  photoPlaceholder: { height: 120, backgroundColor: colors.gray4, alignItems: 'center', justifyContent: 'center' },
  photoIcon:    { fontSize: 40 },
  body:         { paddingHorizontal: 18, paddingTop: 16 },
  name:         { fontFamily: fonts.display, fontSize: 19, color: colors.charcoal, marginBottom: 2, marginTop: 4 },
  category:     { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginBottom: 7 },
  ratingRow:    { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  rating:       { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.gold },
  reviews:      { fontFamily: fonts.body, fontSize: 13, color: colors.gray2 },
  row:          { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 5 },
  rowIcon:      { fontSize: 13, marginTop: 1 },
  rowText:      { fontFamily: fonts.body, fontSize: 13, color: colors.gray, flex: 1, lineHeight: 17 },
  rowLink:      { color: colors.rose, textDecorationLine: 'underline' },
  divider:      { height: 1, backgroundColor: colors.gray4, marginVertical: 10 },
  // Save — primary gold action
  primaryBtn:      { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  primaryBtnSaved: { backgroundColor: colors.gray3 },
  primaryBtnText:  { fontFamily: fonts.bodyMedium, fontSize: 15, color: '#F2EDE8' },
  // Maps — outline
  outlineBtn:     { borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1.5, borderColor: colors.rose },
  outlineBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },
});


// ── Bottom Nav ─────────────────────────────────────────────────
function BottomNav() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabs = [
    { label: 'Home',    icon: '🏠', route: '/(tabs)/'        },
    { label: 'Plan',    icon: '✨', route: '/plan/details'    },
    { label: 'Saved',   icon: '📅', route: '/(tabs)/saved'   },
    { label: 'Profile', icon: '👤', route: '/(tabs)/profile' },
  ];
  return (
    <View style={[nav.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tabs.map(t => (
        <TouchableOpacity key={t.label} style={nav.tab} onPress={() => router.replace(t.route)} activeOpacity={0.7}>
          <Text style={nav.tabIcon}>{t.icon}</Text>
          <Text style={nav.tabLabel}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const nav = StyleSheet.create({
  bar:      { flexDirection: 'row', backgroundColor: colors.cream2, borderTopWidth: 1, borderTopColor: colors.gray4, paddingTop: 8 },
  tab:      { flex: 1, alignItems: 'center', gap: 2 },
  tabIcon:  { fontSize: 20 },
  tabLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.gray2 },
});

// ── Main Screen ────────────────────────────────────────────────
export default function ResultsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { plan, saveSinglePlace } = usePlan();

  const [places,     setPlaces]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [savedIds,   setSavedIds]   = useState(new Set());
  const [expanded,      setExpanded]      = useState(false);
  const [expandLoading, setExpandLoading] = useState(false);
  const [showSearch,    setShowSearch]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState(null);
  const { saved, savePlace, removePlace } = useSavedPlaces();

  const enrichedRef = useRef(new Set());

  const category = plan.category || 'food';
  const subcategoryConfig = getSubcategoryConfig(category, plan.dateIdea);
  const label = subcategoryConfig.displayTitle;
  const locationLabel = plan.location || '';
  const topPicks = places.slice(0, 5);
  const moreOptions = places.slice(5);
  const brunchKeyword =
    plan.dateIdea === 'brunch_dinner' && selectedCuisine
      ? CUISINE_TABS.find((t) => t.key === selectedCuisine)?.keyword
      : null;
  const showFavoritesOnCards =
    category === 'food' ||
    category === 'activity' ||
    ['brunch_dinner', 'coffee_dessert', 'drinks', 'indoor', 'outdoor', 'movies'].includes(plan.dateIdea);

  const activityKeywordAreaEmpty =
    !loading &&
    !error &&
    places.length === 0 &&
    !!subcategoryConfig.useActivityKeywordSearch &&
    !expanded;

  useEffect(() => { fetchPlaces(); }, []);

  // ── Cuisine select — refetch with new keyword ────────────────
  function handleCuisineSelect(key) {
    const next = key === selectedCuisine ? null : key;
    const tab  = CUISINE_TABS.find(t => t.key === next);
    setSelectedCuisine(next);
    setPlaces([]);
    setExpanded(false);
    enrichedRef.current = new Set();
    fetchPlaces(tab?.keyword ?? null);
  }

  // ── Fetch ────────────────────────────────────────────────────
  async function fetchPlaces(cuisineKeyword = null) {
    setLoading(true);
    setError(null);
    const startTime = Date.now();
    try {
      const runGate = await consumeRunIfAvailable();
      if (!runGate.allowed) {
        setShowPaywall(true);
        await minLoadingDisplaySince(startTime);
        setLoading(false);
        return;
      }

      let lat, lng;
      if (plan.coords?.lat && plan.coords?.lng) {
        lat = plan.coords.lat;
        lng = plan.coords.lng;
      } else {
        const city = locationLabel;
        const res  = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();
        if (data.status !== 'OK') throw new Error('Could not find location: ' + (city || '(empty)'));
        lat = data.results[0].geometry.location.lat;
        lng = data.results[0].geometry.location.lng;
      }

      const areaName = locationLabel.split(',')[0].trim();
      const areaNameLower = areaName.toLowerCase();
      const cfg = getSubcategoryConfig(category, plan.dateIdea);
      const fetchRadius = cfg.fetchRadius || (category === 'activity' ? 3000 : 3500);

      let raw;
      if (cfg.useActivityKeywordSearch) {
        raw = await getActivityPlacesMerged(
          { lat, lng },
          {
            radius: fetchRadius,
            maxPerKeyword: 10,
            maxPerCategory: 2,
            maxTotal: 100,
            dateIdea: plan.dateIdea,
          }
        );
      } else if (cfg.useMovieKeywordSearch) {
        raw = await getMoviePlacesMerged(
          { lat, lng },
          { radius: fetchRadius, maxPerKeyword: 10, maxPerChain: 3, maxTotal: 10 }
        );
      } else {
        raw = await getPlacesNearby(cfg.fetchTypes, { lat, lng }, {
          radius: fetchRadius,
          maxResults: 30,
          keyword: cuisineKeyword || cfg.keyword || undefined,
        });
      }

      raw = lightFilter(raw);
      raw = raw.filter((p) => !isBlockedPlace(p));
      const usesControlledKeywordSearch = cfg.useActivityKeywordSearch || cfg.useMovieKeywordSearch;
      if (cfg.useActivityKeywordSearch) {
        raw = raw.filter((p) => !isPassiveOutdoorActivityPlace(p));
      }

      if (cfg.excludeKeywords?.length) {
        raw = raw.filter((p) => {
          const n = (p.name || '').toLowerCase();
          return !cfg.excludeKeywords.some((k) => n.includes(k));
        });
      }

      const minRev = cfg.minReviews ?? 0;
      raw = raw.filter(
        (p) =>
          p.rating != null &&
          Number(p.rating) >= cfg.minRating &&
          (minRev <= 0 || (p.totalRatings || 0) >= minRev)
      );
      // Keep closed places as fallback so lists don't collapse too aggressively.

      const byAddress = raw.filter((p) => (p.address || '').toLowerCase().includes(areaNameLower));
      const isActivityLike =
        category === 'activity' ||
        ['indoor', 'outdoor', 'movies'].includes(plan.dateIdea);
      const shouldDiversifyActivities =
        category === 'activity' || ['indoor', 'outdoor'].includes(plan.dateIdea);

      let mainPool;
      if (cfg.useActivityKeywordSearch || cfg.useMovieKeywordSearch) {
        // Activity local-first is radius-based, not address-substring based.
        mainPool = raw;
      } else if (isActivityLike && byAddress.length === 0 && raw.length > 0) {
        mainPool = raw;
      } else {
        mainPool = byAddress;
      }

      if (shouldDiversifyActivities) {
        mainPool = diversifyActivities(mainPool);
      }

      const curated = curateResults(mainPool);

      const mapped = curated.map((p) => {
        const distMeters = getDistanceMeters(lat, lng, p.location?.lat, p.location?.lng);
        const distMiles  = distMeters / 1609.34;
        const inArea =
          cfg.useActivityKeywordSearch || cfg.useMovieKeywordSearch
            ? distMiles <= 2.1
            : (p.address || '').toLowerCase().includes(areaNameLower);
        return {
          id:           p.id,
          name:         p.name,
          rating:       p.rating != null ? parseFloat(p.rating).toFixed(1) : null,
          totalRatings: p.totalRatings || 0,
          address:      p.address || '',
          distance:     distMiles.toFixed(1),
          inArea,
          isExpanded:   false,
          types:        p.types || [],
          photoUrl:     p.photoUrl,
          location:     p.location,
          priceLevel:   p.priceLevel ?? null,
          openNow:      p.isOpenNow ?? null,
          cuisine:      getCuisine(p.types || [], p.name || ''),
          reviewSnippet: null,
          hoursToday:    null,
        };
      });

      setPlaces(mapped);
      enrichTopPlaces(mapped);
    } catch (e) {
      console.log('[Results] fetch error:', e.message);
      setError(e.message);
    }
    await minLoadingDisplaySince(startTime);
    setLoading(false);
  }


  function openDetail(place) {
    setSelected(place);
    setShowDetail(true);
  }

  const isFavorite = (item) => {
    return saved.some((p) => p.place_id === (item.place_id || item.id));
  };

  const toggleFavorite = (item) => {
    const placeId = item.place_id || item.id;
    if (!placeId) return;
    if (saved.some((p) => p.place_id === placeId)) {
      removePlace(placeId);
    } else {
      savePlace({ ...item, place_id: placeId });
    }
  };

  async function enrichTopPlaces(topPlaces) {
    const toEnrich = (topPlaces || []).filter(p => p.id && !enrichedRef.current.has(p.id));
    for (const place of toEnrich) {
      enrichedRef.current.add(place.id);
      try {
        const fields = 'opening_hours,reviews,price_level,formatted_address';
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.id}&fields=${encodeURIComponent(fields)}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();
        if (!data.result) continue;
        const r = data.result;
        const day = new Date().getDay();
        const idx = day === 0 ? 6 : day - 1;
        setPlaces(prev => prev.map(p => p.id !== place.id ? p : {
          ...p,
          openNow:       r.opening_hours?.open_now ?? p.openNow,
          hoursToday:    r.opening_hours?.weekday_text?.[idx] || p.hoursToday,
          reviewSnippet: r.reviews?.[0]?.text?.slice(0, 150) || p.reviewSnippet,
          fullAddress:   r.formatted_address || p.address,
          priceLevel:    r.price_level ?? p.priceLevel,
        }));
      } catch {}
    }
  }

  // ── Expand to nearby areas (wider radius; new rows merged + sorted) ──
  async function expandSearch() {
    if (expanded) return;
    setExpandLoading(true);
    console.log('[Results] expand triggered');

    try {
      let lat, lng;
      if (plan.coords?.lat && plan.coords?.lng) {
        lat = plan.coords.lat;
        lng = plan.coords.lng;
      } else {
        const city = locationLabel;
        const res  = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();
        lat = data.results[0].geometry.location.lat;
        lng = data.results[0].geometry.location.lng;
      }

      const areaNameLower = locationLabel.split(',')[0].trim().toLowerCase();
      const existingIds = new Set(places.map(p => p.id));
      const cfg = getSubcategoryConfig(category, plan.dateIdea);

      const EXPAND_RADIUS_M = 24000;
      const expandKeyword = brunchKeyword || cfg.keyword || undefined;
      let rawMore;
      if (cfg.useActivityKeywordSearch) {
        rawMore = await getActivityPlacesMerged(
          { lat, lng },
          {
            radius: EXPAND_RADIUS_M,
            maxPerKeyword: 4,
            maxPerCategory: 3,
            maxTotal: 20,
            dateIdea: plan.dateIdea,
          }
        );
      } else if (cfg.useMovieKeywordSearch) {
        rawMore = await getMoviePlacesMerged(
          { lat, lng },
          { radius: EXPAND_RADIUS_M, maxPerKeyword: 12, maxPerChain: 3, maxTotal: 14 }
        );
      } else {
        rawMore = await getPlacesNearby(cfg.fetchTypes, { lat, lng }, {
          radius: EXPAND_RADIUS_M,
          maxResults: 50,
          keyword: expandKeyword,
        });
      }

      rawMore = lightFilter(rawMore);
      rawMore = rawMore.filter((p) => !isBlockedPlace(p));
      if (cfg.useActivityKeywordSearch) {
        rawMore = rawMore.filter((p) => !isPassiveOutdoorActivityPlace(p));
      }

      if (cfg.excludeKeywords?.length) {
        rawMore = rawMore.filter((p) => {
          const n = (p.name || '').toLowerCase();
          return !cfg.excludeKeywords.some((k) => n.includes(k));
        });
      }

      const minRevMore = cfg.minReviews ?? 0;
      rawMore = rawMore.filter(
        (p) =>
          p.rating != null &&
          Number(p.rating) >= cfg.minRating &&
          (minRevMore <= 0 || (p.totalRatings || 0) >= minRevMore)
      );
      // Keep closed places as fallback so expand can still add new options.

      const shouldDiversifyActivitiesExpand =
        category === 'activity' || ['indoor', 'outdoor'].includes(plan.dateIdea);
      if (shouldDiversifyActivitiesExpand) {
        rawMore = diversifyActivities(rawMore);
      }

      const curatedMore = curateResults(rawMore);
      console.log('[Results] expand rawMore length:', rawMore.length);

      const moreResults = curatedMore
        .filter(p => !existingIds.has(p.id))
        .map((p) => {
          const distMeters = getDistanceMeters(lat, lng, p.location?.lat, p.location?.lng);
          const distMiles  = distMeters / 1609.34;
          const inArea =
            cfg.useActivityKeywordSearch || cfg.useMovieKeywordSearch
              ? distMiles <= 2.1
              : (p.address || '').toLowerCase().includes(areaNameLower);
          return {
            id:           p.id,
            name:         p.name,
            rating:       p.rating != null ? parseFloat(p.rating).toFixed(1) : null,
            totalRatings: p.totalRatings || 0,
            address:      p.address || '',
            distance:     distMiles.toFixed(1),
            inArea,
            isExpanded:   !inArea,
            types:        p.types || [],
            photoUrl:     p.photoUrl,
            location:     p.location,
            priceLevel:   p.priceLevel ?? null,
            openNow:      p.isOpenNow ?? null,
            cuisine:      getCuisine(p.types || [], p.name || ''),
            reviewSnippet: null,
            hoursToday:    null,
          };
        });
      console.log('[Results] expand merged length:', places.length + moreResults.length);

      setPlaces((prev) => {
        const merged = [...prev, ...moreResults];
        merged.sort((a, b) => {
          if (a.inArea !== b.inArea) return a.inArea ? -1 : 1;
          const ra = parseFloat(a.rating) || 0;
          const rb = parseFloat(b.rating) || 0;
          if (rb !== ra) return rb - ra;
          return (b.totalRatings || 0) - (a.totalRatings || 0);
        });
        return merged;
      });
      if (moreResults.length > 0) {
        setExpanded(true);
        enrichTopPlaces(moreResults);
      }
      console.log('[Results] expand final result count:', places.length + moreResults.length);
    } catch (e) {
      console.log('[Results] expand error:', e.message);
    }
    setExpandLoading(false);
  }


  // ── Manual search for specific place ─────────────────────────
  async function runManualSearch() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      let lat, lng;
      if (plan.coords?.lat && plan.coords?.lng) {
        lat = plan.coords.lat;
        lng = plan.coords.lng;
      } else {
        const city = locationLabel;
        const res  = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();
        lat = data.results[0].geometry.location.lat;
        lng = data.results[0].geometry.location.lng;
      }

      const areaName = locationLabel.split(',')[0].trim();
      const areaNameLower = areaName.toLowerCase();

      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: '12000',
        keyword: searchQuery.trim(),
        key: GOOGLE_API_KEY,
      });
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`);
      const data = await res.json();
      const raw = data.results || [];

      // Map and sort — local area first
      const existingPlaceIds = new Set(places.map(p => p.id));
      const mapped = raw
        .filter(p => (p.rating ?? 0) >= 4.3)
        .map(p => {
          const distMeters = getDistanceMeters(lat, lng, p.geometry?.location?.lat ?? 0, p.geometry?.location?.lng ?? 0);
          const dist = distMeters / 1609.34;
          return {
            id:           p.place_id,
            name:         p.name,
            rating:       p.rating ? parseFloat(p.rating).toFixed(1) : null,
            totalRatings: p.user_ratings_total || 0,
            address:      p.vicinity || '',
            distance:     dist.toFixed(1),
            inArea:       (p.vicinity || '').toLowerCase().includes(areaNameLower),
            alreadyInList: existingPlaceIds.has(p.place_id),
            types:        p.types || [],
            photoUrl:     p.photos?.[0]?.photo_reference
              ? buildPhotoUrl(p.photos[0].photo_reference)
              : null,
            location: { lat: p.geometry?.location?.lat, lng: p.geometry?.location?.lng },
          };
        })
        // Local results first
        .sort((a, b) => {
          if (a.inArea !== b.inArea) return a.inArea ? -1 : 1;
          return parseFloat(a.distance) - parseFloat(b.distance);
        });

      setSearchResults(mapped.slice(0, 15));
    } catch (e) {
      console.log('[ManualSearch] error:', e.message);
    }
    setSearchLoading(false);
  }

  function addSearchedPlace(place) {
    if (place.alreadyInList) {
      Alert.alert('Already in list', `${place.name} is already in your results.`);
      return;
    }

    // Save directly to Saved tab
    saveSinglePlace(place, {
      category: plan.category,
      city:     locationLabel,
    });
    setSavedIds(prev => new Set([...prev, place.id]));

    // Also add to top of current results list
    setPlaces(prev => {
      const filtered = prev.filter(p => p.id !== place.id);
      return [{ ...place, _manualAdd: true }, ...filtered];
    });

    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);

    Alert.alert('Saved! 🔖', `${place.name} has been saved. Check your Saved tab to view and share it.`);
  }

  function handleSave(place) {
    if (!place || savedIds.has(place.id)) return;
    saveSinglePlace(place, {
      category: plan.category,
      city:     locationLabel,
    });
    setSavedIds(prev => new Set([...prev, place.id]));
    Alert.alert('Saved! 🔖', `${place.name} has been saved to your Saved tab.`);
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => (showDetail ? setShowDetail(false) : router.back())} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>{label}</Text>
          <Text style={s.sub}>Near {locationLabel || 'your location'} · sorted by rating</Text>
        </View>

        {/* ── Cuisine tabs — brunch/dinner only ── */}
        {plan.dateIdea === 'brunch_dinner' && (
          <View style={s.cuisineTabsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.cuisineTabsContent}
            >
              {CUISINE_TABS.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[s.cuisineTab, selectedCuisine === t.key && s.cuisineTabActive]}
                  onPress={() => handleCuisineSelect(t.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.cuisineTabText, selectedCuisine === t.key && s.cuisineTabTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {loading ? (
          <View style={s.loaderBody}>
            <RizzLoader embedded />
          </View>
        ) : error ? (
          <View style={s.center}>
            <Text style={s.errorText}>😕 {error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={fetchPlaces} activeOpacity={0.8}>
              <Text style={s.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : places.length === 0 ? (
          <View style={s.center}>
            <Text style={s.errorText}>
              {activityKeywordAreaEmpty ? 'No activities found in this area' : 'Not enough nearby.'}
            </Text>
            <Text style={s.errorSub}>
              {activityKeywordAreaEmpty
                ? 'Tap Expand to load more activities from nearby areas.'
                : 'Tap Expand to see results from nearby areas.'}
            </Text>
            <TouchableOpacity style={s.retryBtn} onPress={expandSearch} activeOpacity={0.8} disabled={expandLoading}>
              {expandLoading
                ? <ActivityIndicator size="small" color="#F2EDE8" />
                : <Text style={s.retryBtnText}>Expand to Nearby Areas</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={[s.retryBtn, { marginTop: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.gray3 }]} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={[s.retryBtnText, { color: colors.charcoal }]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={s.scroll}
            contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom + 32, 40) }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.count}>{places.length} place{places.length !== 1 ? 's' : ''} near {locationLabel.split(',')[0]}</Text>

            {/* ── Top Picks ── */}
            {topPicks.length > 0 && (
              <View style={s.sectionHeaderRow}>
                <View style={s.sectionAccentDot} />
                <Text style={s.sectionTitleTop}>Top Picks</Text>
              </View>
            )}
            {topPicks.map((p, i) => (
              <View key={p.id}>
                {p.isExpanded && places.indexOf(p) === places.findIndex(x => x.isExpanded) && (
                  <View style={s.expandedLabel}>
                    <Text style={s.expandedLabelText}>📍 Nearby</Text>
                  </View>
                )}
                <ResultsPlaceCard
                  place={p}
                  onPress={() => openDetail(p)}
                  variant="top"
                  rank={i + 1}
                  isFavorite={isFavorite(p)}
                  onToggleFavorite={toggleFavorite}
                  showFavorite={showFavoritesOnCards}
                />
              </View>
            ))}

            {/* ── More Options ── */}
            {moreOptions.length > 0 && (
              <View style={s.sectionHeaderRow}>
                <View style={[s.sectionAccentDot, { backgroundColor: colors.gray3 }]} />
                <Text style={s.sectionTitleMore}>More Options</Text>
              </View>
            )}
            {moreOptions.map((p, i) => (
              <View key={p.id}>
                {p.isExpanded && places.indexOf(p) === places.findIndex(x => x.isExpanded) && (
                  <View style={s.expandedLabel}>
                    <Text style={s.expandedLabelText}>📍 Nearby</Text>
                  </View>
                )}
                <ResultsPlaceCard
                  place={p}
                  onPress={() => openDetail(p)}
                  variant="default"
                  rank={topPicks.length + i + 1}
                  isFavorite={isFavorite(p)}
                  onToggleFavorite={toggleFavorite}
                  showFavorite={showFavoritesOnCards}
                />
              </View>
            ))}

            {/* ── Expand button at bottom of local results ── */}
            {!expanded && (
              <View style={[s.expandBanner, { marginTop: places.length < 3 ? 16 : 24 }]}>
                <Text style={s.expandBannerText}>
                  {places.length < 3
                    ? 'Not enough nearby. Tap Expand to see nearby areas.'
                    : 'Want to see more options from nearby areas?'}
                </Text>
                <TouchableOpacity
                  style={s.expandBtn}
                  onPress={expandSearch}
                  activeOpacity={0.85}
                  disabled={expandLoading}
                >
                  {expandLoading
                    ? <ActivityIndicator size="small" color="#F2EDE8" />
                    : <Text style={s.expandBtnText}>🔍 Expand to Nearby Areas</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            {expanded && (
              <View style={[s.expandedLabel, { marginTop: 8 }]}>
                <Text style={s.expandedLabelText}>📍 Showing nearby results</Text>
              </View>
            )}

            {/* ── Manual search button ── */}
            <TouchableOpacity style={s.manualSearchBtn} onPress={() => setShowSearch(true)} activeOpacity={0.85}>
              <Text style={s.manualSearchBtnText}>🔎 Search for a specific place</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Bottom Nav */}
      <BottomNav />

      {/* Detail Sheet */}
      <PlaceDetailSheet
        place={selected}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        onSave={() => handleSave(selected)}
        isSaved={selected ? savedIds.has(selected.id) : false}
      />

      {/* ── Manual Search Modal ── */}
      <Modal
        visible={showSearch}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSearch(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.searchOverlay}
        >
          <View style={s.searchSheet}>
            <View style={s.searchHandle} />
            <Text style={s.searchTitle}>Search for a Place</Text>
            <Text style={s.searchSub}>
              Search near {locationLabel.split(',')[0] || 'your location'}
            </Text>

            {/* Search input */}
            <View style={s.searchInputRow}>
              <TextInput
                style={s.searchInput}
                placeholder="e.g. skating rink, hot pot, karaoke..."
                placeholderTextColor={colors.gray3}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={runManualSearch}
                returnKeyType="search"
                autoFocus
              />
              <TouchableOpacity
                style={s.searchGoBtn}
                onPress={runManualSearch}
                activeOpacity={0.85}
                disabled={searchLoading || !searchQuery.trim()}
              >
                {searchLoading
                  ? <ActivityIndicator size="small" color="#F2EDE8" />
                  : <Text style={s.searchGoBtnText}>Go</Text>
                }
              </TouchableOpacity>
            </View>

            {/* Search results */}
            <ScrollView style={s.searchResults} showsVerticalScrollIndicator={false}>
              {searchResults.length === 0 && !searchLoading && searchQuery.length > 0 && (
                <Text style={s.searchEmpty}>No results. Try a different search term.</Text>
              )}
              {searchResults.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[s.searchResultCard, p.alreadyInList && s.searchResultDim]}
                  onPress={() => addSearchedPlace(p)}
                  activeOpacity={0.85}
                >
                  {p.photoUrl ? (
                    <Image source={{ uri: p.photoUrl }} style={s.searchResultPhoto} resizeMode="cover" />
                  ) : (
                    <View style={[s.searchResultPhoto, s.searchResultPhotoEmpty]}>
                      <Text style={{ fontSize: 20 }}>📍</Text>
                    </View>
                  )}
                  <View style={s.searchResultInfo}>
                    <Text style={s.searchResultName} numberOfLines={1}>{p.name}</Text>
                    <Text style={s.searchResultAddr} numberOfLines={1}>{p.address}</Text>
                    <View style={s.searchResultMeta}>
                      {p.rating && <Text style={s.searchResultRating}>⭐ {p.rating}</Text>}
                      <Text style={s.searchResultDist}>🚗 {p.distance} mi</Text>
                      {!p.inArea && <Text style={s.searchResultNearby}>· Nearby</Text>}
                      {p.alreadyInList && <Text style={s.searchResultExists}>· Already listed</Text>}
                    </View>
                  </View>
                  {!p.alreadyInList && (
                    <View style={s.searchAddBtn}>
                      <Text style={s.searchAddBtnText}>+ Add</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>

            <TouchableOpacity style={s.searchCancelBtn} onPress={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
              <Text style={s.searchCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => {
          console.log('[Paywall] upgrade clicked');
          setShowPaywall(false);
        }}
        onGet20MorePlans={async () => {
          await addExtraRuns(20);
          setShowPaywall(false);
        }}
        onGet50MorePlans={async () => {
          await addExtraRuns(50);
          setShowPaywall(false);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.cream },
  safe:        { flex: 1 },
  header:      { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.gray4 },
  backBtn:     { marginBottom: 8 },
  backText:    { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },
  title:       { fontFamily: fonts.display, fontSize: 28, color: colors.charcoal, marginBottom: 3 },
  sub:         { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  scroll:      { flex: 1 },
  content:     { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  count: { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, marginBottom: 16, letterSpacing: 0.3 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 },
  sectionAccentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.rose },
  sectionTitleTop: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.charcoal,
    letterSpacing: 0.3,
  },
  sectionTitleMore: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.gray2,
    marginBottom: 10,
    marginTop: 14,
  },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loaderBody:  { flex: 1, minHeight: 0, width: '100%' },
  errorText:   { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.gray, textAlign: 'center', marginBottom: 8 },
  errorSub:    { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, textAlign: 'center', marginBottom: 20 },
  retryBtn:    { backgroundColor: colors.rose, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  retryBtnText:{ fontFamily: fonts.bodyMedium, fontSize: 14, color: '#F2EDE8' },

  // ── Expand banner ───────────────────────────────────────────
  expandBanner: {
    backgroundColor: 'rgba(212,149,111,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,149,111,0.20)',
  },
  expandBannerText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  expandBtn: {
    backgroundColor: colors.rose,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  expandBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#F2EDE8',
  },
  expandedLabel: {
    backgroundColor: 'rgba(212,149,111,0.08)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  expandedLabelText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.gold,
  },

  // ── Manual search button ─────────────────────────────────────
  manualSearchBtn: {
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray3,
    marginTop: 10,
    marginBottom: 4,
  },
  manualSearchBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.gray,
  },

  // ── Manual search modal ──────────────────────────────────────
  searchOverlay:       { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  searchSheet:         { backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: 24 },
  searchHandle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray3, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  searchTitle:         { fontFamily: fonts.display, fontSize: 22, color: colors.charcoal, paddingHorizontal: 20, marginBottom: 4 },
  searchSub:           { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, paddingHorizontal: 20, marginBottom: 16 },
  searchInputRow:      { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  searchInput:         { flex: 1, backgroundColor: colors.cream2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontFamily: fonts.body, fontSize: 14, color: colors.charcoal, borderWidth: 1, borderColor: colors.gray4 },
  searchGoBtn:         { backgroundColor: colors.rose, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', minWidth: 56 },
  searchGoBtnText:     { fontFamily: fonts.bodyMedium, fontSize: 15, color: '#F2EDE8' },
  searchResults:       { paddingHorizontal: 20, maxHeight: 400 },
  searchEmpty:         { fontFamily: fonts.body, fontSize: 14, color: colors.gray2, textAlign: 'center', paddingVertical: 30 },
  searchResultCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cream2, borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.gray4 },
  searchResultDim:     { opacity: 0.6 },
  searchResultPhoto:   { width: 64, height: 64 },
  searchResultPhotoEmpty: { backgroundColor: colors.gray4, alignItems: 'center', justifyContent: 'center' },
  searchResultInfo:    { flex: 1, padding: 10 },
  searchResultName:    { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.charcoal, marginBottom: 2 },
  searchResultAddr:    { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginBottom: 4 },
  searchResultMeta:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchResultRating:  { fontFamily: fonts.body, fontSize: 12, color: colors.charcoal },
  searchResultDist:    { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  searchResultNearby:  { fontFamily: fonts.body, fontSize: 12, color: colors.gold },
  searchResultExists:  { fontFamily: fonts.body, fontSize: 12, color: colors.rose },
  searchAddBtn:        { backgroundColor: colors.rose, paddingHorizontal: 12, paddingVertical: 8, marginRight: 10, borderRadius: 8 },
  searchAddBtnText:    { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#F2EDE8' },
  searchCancelBtn:     { marginHorizontal: 20, marginTop: 8, borderRadius: 999, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray4 },
  searchCancelText:    { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.gray2 },

  // ── Cuisine tabs ─────────────────────────────────────────────
  cuisineTabsWrapper: { height: 48, borderBottomWidth: 1, borderBottomColor: colors.gray4, justifyContent: 'center' },
  cuisineTabsContent: { paddingHorizontal: 20, gap: 8, flexDirection: 'row', alignItems: 'center' },
  cuisineTab:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: colors.gray4, backgroundColor: colors.cream2 },
  cuisineTabActive:   { borderColor: colors.rose, backgroundColor: 'rgba(212,149,111,0.10)' },
  cuisineTabText:     { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gray2 },
  cuisineTabTextActive: { color: colors.rose },
});