// app/plan/choose-for-me.js — Tonight's Plan For You
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, Linking,
  Modal, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import {
  getPlacesNearby,
  getActivityPlacesMerged,
  isPassiveOutdoorActivityPlace,
} from '../../services/placesService';

const SCREEN_W = Dimensions.get('window').width;
const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';

// ── Filters — mirrors results.js ──────────────────────────────
const BAD_TYPES = new Set([
  'clothing_store','shoe_store','jewelry_store','electronics_store',
  'furniture_store','home_goods_store','department_store','shopping_mall',
  'convenience_store','liquor_store','pet_store','book_store',
  'supermarket','grocery_or_supermarket','gas_station',
  'lodging','hospital','pharmacy','school','church',
]);

const BAD_KEYWORDS = [
  'bakery','donut','cupcake','dessert','bakeshop','patisserie',
  'in-n-out','mcdonald','burger king','wendy','jack in the box','kfc','taco bell',
  'fast food','starbucks','dunkin',
  "applebee's","applebee",'ihop','denny',"bob's big boy",'chili',
  'cracker barrel','red lobster','hooters','olive garden','outback steakhouse',
  'hard rock cafe','cheesecake factory','buffalo wild wings','rainforest cafe',
  'walmart','target','costco','home depot','best buy','gamestop',
  'dollar tree','dollar general','walgreens','cvs','rite aid',
  'whole foods','ralphs','pavilions','safeway','vons',
  'gym','crossfit','ymca','planet fitness','orangetheory',
  'chuck e cheese','sky zone','urban air','bounce',
  'gun range','shooting range','firearms','ammo',
];

const ACTIVITY_BLOCKED_TYPES = new Set([
  'restaurant','cafe','bar','lodging',
  'grocery_or_supermarket','supermarket','store','shopping_mall','department_store',
]);
const GUN_KEYWORDS = ['gun','firearm','ammo','shooting range','gun range'];

// ── Cuisine tabs + name-match classifier ──────────────────────
const CUISINE_TABS = [
  { key: 'all',           label: 'All' },
  { key: 'japanese',      label: 'Japanese',     keyword: 'japanese sushi restaurant' },
  { key: 'korean',        label: 'Korean',        keyword: 'korean bbq restaurant' },
  { key: 'chinese',       label: 'Chinese',       keyword: 'chinese restaurant' },
  { key: 'italian',       label: 'Italian',       keyword: 'italian restaurant' },
  { key: 'mexican',       label: 'Mexican',       keyword: 'mexican restaurant' },
  { key: 'mediterranean', label: 'Mediterranean', keyword: 'mediterranean restaurant' },
  { key: 'american',      label: 'American',      keyword: 'american grill restaurant' },
];

const CUISINE_NAME_MATCH = {
  japanese:      ['japanese','sushi','ramen','izakaya','udon','tempura','yakitori','hibachi'],
  korean:        ['korean','kbbq','galbi','bulgogi','bibimbap'],
  chinese:       ['chinese','dim sum','cantonese','szechuan','mandarin'],
  italian:       ['italian','pizza','pasta','trattoria','pizzeria'],
  mexican:       ['mexican','taco','burrito','cantina','cocina'],
  mediterranean: ['mediterranean','greek','lebanese','falafel','shawarma'],
  american:      ['american','steakhouse','burger','smokehouse'],
};

function buildCuisineMap(restaurants) {
  const map = { all: restaurants };
  for (const [cuisine, keywords] of Object.entries(CUISINE_NAME_MATCH)) {
    map[cuisine] = restaurants.filter(p =>
      keywords.some(k => (p.name || '').toLowerCase().includes(k))
    );
  }
  return map;
}

function isBlockedPlace(place) {
  const name  = (place.name || '').toLowerCase();
  const types = place.types || [];
  if (types.some(t => BAD_TYPES.has(t))) return true;
  if (BAD_KEYWORDS.some(k => name.includes(k))) return true;
  return false;
}

function isBlockedActivity(place) {
  const name  = (place.name || '').toLowerCase();
  const types = place.types || [];
  if (GUN_KEYWORDS.some(k => name.includes(k))) return true;
  if (types.some(t => ACTIVITY_BLOCKED_TYPES.has(t))) return true;
  return false;
}

// ── Local-only fetch + filter ─────────────────────────────────
async function fetchLocalRestaurants(coords, areaName, fetchRadius = 10000) {
  const { lat, lng } = coords;
  const raw = await getPlacesNearby(['restaurant'], { lat, lng }, { radius: fetchRadius, maxResults: 30 });
  const areaLower = (areaName || '').toLowerCase();

  const FAST_FOOD = ['mcdonald','burger king','wendy','jack in the box','in-n-out',"bob's big boy",'taco bell','kfc'];
  const CLEARLY_WRONG = new Set(['bar','night_club','lodging','store','shopping_mall']);

  const sortFn = (a, b) =>
    (Number(b.rating) - Number(a.rating)) ||
    ((b.totalRatings || 0) - (a.totalRatings || 0));

  const sortedQuality = raw
    .filter((p) => !isBlockedPlace(p))
    .filter((p) => {
      const name = (p.name || '').toLowerCase();
      const types = p.types || [];
      if (FAST_FOOD.some((k) => name.includes(k))) return false;
      if (types.some((t) => CLEARLY_WRONG.has(t))) return false;
      return true;
    })
    .filter((p) => p.rating != null && Number(p.rating) >= 4.3)
    .sort(sortFn);
  if (!areaLower) return sortedQuality;

  const addressMatch = sortedQuality.filter((p) =>
    (p.address || '').toLowerCase().includes(areaLower)
  );
  return addressMatch.length > 0 ? addressMatch : sortedQuality;
}

async function fetchLocalActivities(coords, areaName, fetchRadius = 3500, dateIdea = null) {
  const { lat, lng } = coords;
  const raw = await getActivityPlacesMerged(
    { lat, lng },
    { radius: fetchRadius, maxPerKeyword: 8, maxPerCategory: 2, maxTotal: 80, dateIdea }
  );

  const sortFn = (a, b) =>
    (Number(b.rating) - Number(a.rating)) ||
    ((b.totalRatings || 0) - (a.totalRatings || 0));

  const sortedQuality = raw
    .filter((p) => !isBlockedPlace(p))
    .filter((p) => !isBlockedActivity(p))
    .filter((p) => !isPassiveOutdoorActivityPlace(p))
    .filter((p) => p.rating != null && Number(p.rating) >= 4.0)
    .filter((p) => (p.totalRatings || 0) >= 20)
    .sort(sortFn);
  return sortedQuality;
}

// ── Place Detail Sheet ────────────────────────────────────────
function PlaceDetailSheet({ place, onClose }) {
  const insets  = useSafeAreaInsets();
  const [details, setDetails] = useState(null);
  const [detLoad, setDetLoad] = useState(false);

  useEffect(() => {
    if (!place?.id) return;
    setDetails(null);
    setDetLoad(true);
    fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place.id)}&fields=photos,opening_hours,reviews&key=${GOOGLE_API_KEY}`
    )
      .then(r => r.json())
      .then(data => { if (data.result) setDetails(data.result); })
      .catch(() => {})
      .finally(() => setDetLoad(false));
  }, [place?.id]);

  if (!place) return null;

  function openInMaps() {
    if (place.location?.lat) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}&query_place_id=${place.id}`
      );
    } else {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`);
    }
  }

  // Photos: prefer fetched gallery, fall back to the single thumbnail
  const fetchedPhotoUris = (details?.photos || [])
    .slice(0, 5)
    .map(ph => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${ph.photo_reference}&key=${GOOGLE_API_KEY}`);
  const photoUris = fetchedPhotoUris.length > 0
    ? fetchedPhotoUris
    : place.photoUrl ? [place.photoUrl] : [];

  // Type label — skip generic Google meta-types
  const SKIP_TYPES = new Set(['point_of_interest', 'establishment', 'food', 'premise', 'geocode']);
  const readableType = (place.types || [])
    .filter(t => !SKIP_TYPES.has(t))
    .map(t => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    [0] || null;

  // Open status + today's hours
  const openNow = details?.opening_hours?.open_now ?? null;
  const day = new Date().getDay();
  const hoursToday = details?.opening_hours?.weekday_text?.[day === 0 ? 6 : day - 1] || null;
  const hoursValue = hoursToday ? hoursToday.replace(/^[^:]+:\s*/, '') : null;

  // Best single review, trimmed to 220 chars
  const reviewTexts = (details?.reviews || [])
    .filter(r => (r.text || '').trim().length > 30)
    .slice(0, 1)
    .map(r => r.text.trim().slice(0, 220));

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={det.overlay}>
        {/* Tapping the dimmed area above the sheet dismisses it */}
        <TouchableOpacity style={det.dismissArea} onPress={onClose} activeOpacity={1} />

        <View style={[det.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Handle row with close button */}
          <View style={det.topBar}>
            <View style={det.handle} />
            <TouchableOpacity style={det.closeX} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={det.closeXText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Photo gallery ── */}
          {detLoad && photoUris.length === 0 ? (
            <View style={det.photoPlaceholder}>
              <ActivityIndicator size="small" color={colors.rose} />
            </View>
          ) : photoUris.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={det.photoScroll}
            >
              {photoUris.map((uri, i) => (
                <Image key={i} source={{ uri }} style={[det.photo, { width: SCREEN_W }]} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={det.photoPlaceholder}>
              <Text style={{ fontSize: 40 }}>📍</Text>
            </View>
          )}

          <ScrollView
            style={det.bodyScroll}
            contentContainerStyle={[det.body, { paddingBottom: Math.max(insets.bottom + 24, 32) }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Type tag */}
            {readableType && <Text style={det.typeTag}>{readableType}</Text>}

            {/* Name */}
            <Text style={det.name}>{place.name}</Text>

            {/* Rating */}
            {place.rating != null && (
              <View style={det.ratingRow}>
                <Text style={det.rating}>⭐ {Number(place.rating).toFixed(1)}</Text>
                {place.totalRatings > 0 && (
                  <Text style={det.reviewCount}>({place.totalRatings.toLocaleString()} reviews)</Text>
                )}
              </View>
            )}

            {/* Open / closed */}
            {openNow != null && (
              <View style={det.statusRow}>
                <Text style={[det.openBadge, openNow ? det.openNowBadge : det.closedBadge]}>
                  {openNow ? '● Open now' : '● Closed'}
                </Text>
                {hoursValue && <Text style={det.hoursText}>{hoursValue}</Text>}
              </View>
            )}

            {/* Address */}
            {place.address ? (
              <View style={det.infoRow}>
                <Text style={det.infoIcon}>📍</Text>
                <Text style={det.infoText}>{place.address}</Text>
              </View>
            ) : null}

            {/* Reviews */}
            {reviewTexts.length > 0 && (
              <View style={det.reviewsSection}>
                <Text style={det.reviewsHeader}>What people say</Text>
                {reviewTexts.map((text, i) => (
                  <View key={i} style={det.reviewCard}>
                    <Text style={det.reviewText}>"{text}{text.length === 220 ? '…' : ''}"</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 12 }} />

            <TouchableOpacity style={det.mapsBtn} onPress={openInMaps} activeOpacity={0.88}>
              <Text style={det.mapsBtnText}>🗺️ Open in Maps</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Place Card ────────────────────────────────────────────────
function PlaceCard({
  label,
  emoji,
  place,
  onPress,
  onSwap,
  canSwap,
  tabsContent,
  loadingOverlay,
  emptyTitle,
  emptySubtext,
  emptyActionLabel,
  onEmptyAction,
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionEmoji}>{emoji}</Text>
        <Text style={s.sectionLabel}>{label}</Text>
      </View>

      {tabsContent}

      <View style={s.card}>
        {loadingOverlay ? (
          <View style={s.cardLoadingOverlay}>
            <Text style={s.cardLoadingText}>Finding options…</Text>
          </View>
        ) : place ? (
          <>
            <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
              {place.photoUrl ? (
                <Image source={{ uri: place.photoUrl }} style={s.cardPhoto} />
              ) : (
                <View style={s.cardPhotoFallback}>
                  <Text style={s.cardPhotoEmoji}>{emoji}</Text>
                </View>
              )}

              <View style={s.cardBody}>
                <Text style={s.cardName} numberOfLines={2}>{place.name}</Text>
                <View style={s.cardMeta}>
                  {place.rating != null && (
                    <Text style={s.cardRating}>⭐ {Number(place.rating).toFixed(1)}</Text>
                  )}
                  {place.address ? (
                    <Text style={s.cardAddress} numberOfLines={1}>{place.address}</Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>

            {canSwap && (
              <TouchableOpacity style={s.swapBtn} onPress={onSwap} activeOpacity={0.8}>
                <Text style={s.swapBtnText}>Swap</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={s.emptyCardWrap}>
            <Text style={s.emptyCardTitle}>{emptyTitle || label}</Text>
            <Text style={s.cardLoadingText}>
              {emptySubtext || 'No results for this cuisine nearby'}
            </Text>
            {emptyActionLabel ? (
              <TouchableOpacity style={s.emptyActionBtn} onPress={onEmptyAction} activeOpacity={0.85}>
                <Text style={s.emptyActionBtnText}>{emptyActionLabel}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────
export default function ChooseForMeScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { plan, saveSinglePlace } = usePlan();

  const [loading, setLoading]                     = useState(true);
  const [expandLoading, setExpandLoading]         = useState(false);
  const [cuisineExpandLoading, setCuisineExpandLoading] = useState(false);
  const [cuisineMap, setCuisineMap]               = useState({ all: [] });
  const [selectedCuisine, setSelectedCuisine]     = useState('all');
  const [activities, setActivities]               = useState([]);
  const [restaurantIdx, setRestaurantIdx]         = useState(0);
  const [activityIdx, setActivityIdx]             = useState(0);
  const [activityExpandLoading, setActivityExpandLoading] = useState(false);
  const [activityExpandTried, setActivityExpandTried] = useState(false);
  const [restaurantExpandLoading, setRestaurantExpandLoading] = useState(false);
  const [restaurantExpandTried, setRestaurantExpandTried] = useState(false);
  const [noResults, setNoResults]                 = useState(false);
  const [saved, setSaved]                         = useState(false);
  const [detailPlace, setDetailPlace]             = useState(null);
  const runRef            = useRef(false);
  const expandedCuisines  = useRef(new Set());

  async function load() {
    if (runRef.current) return;
    runRef.current = true;
    setLoading(true);
    setSaved(false);
    setNoResults(false);
    setRestaurantIdx(0);
    setActivityIdx(0);
    setActivityExpandTried(false);
    setRestaurantExpandTried(false);

    const coords   = plan.coords;
    const areaName = (plan.location || '').split(',')[0].trim();

    if (!coords?.lat || !coords?.lng) {
      setLoading(false);
      setNoResults(true);
      runRef.current = false;
      return;
    }

    const start = Date.now();
    const [rest, acts] = await Promise.all([
      fetchLocalRestaurants(coords, areaName),
      fetchLocalActivities(coords, areaName, 3500, plan.dateIdea),
    ]);

    // Minimum 3s loading so it feels intentional
    const elapsed = Date.now() - start;
    if (elapsed < 3000) await new Promise(r => setTimeout(r, 3000 - elapsed));

    setCuisineMap(buildCuisineMap(rest));
    setSelectedCuisine('all');
    expandedCuisines.current = new Set();
    setActivities(acts);
    // Only show empty state when BOTH are missing
    if (!rest.length && !acts.length) setNoResults(true);
    setLoading(false);
    runRef.current = false;
  }

  useEffect(() => { load(); }, []);

  function tryAgain() {
    runRef.current = false;
    load();
  }

  async function tryNearbyAreas() {
    setExpandLoading(true);
    setNoResults(false);
    const coords = plan.coords;
    const [rest, acts] = await Promise.all([
      fetchLocalRestaurants(coords, '', 25000),
      fetchLocalActivities(coords, '', 30000, plan.dateIdea),
    ]);
    setCuisineMap(buildCuisineMap(rest));
    setSelectedCuisine('all');
    expandedCuisines.current = new Set();
    setActivities(acts);
    setRestaurantIdx(0);
    setActivityIdx(0);
    setRestaurantExpandTried(false);
    setActivityExpandTried(false);
    if (!rest.length && !acts.length) setNoResults(true);
    setExpandLoading(false);
  }

  async function expandActivitySearch() {
    if (!plan.coords?.lat || !plan.coords?.lng) return;
    setActivityExpandLoading(true);
    const areaName = (plan.location || '').split(',')[0].trim();
    const local = await fetchLocalActivities(plan.coords, areaName, 12000, plan.dateIdea);
    const wider = await fetchLocalActivities(plan.coords, '', 28000, plan.dateIdea);
    const seen = new Set(local.map((p) => p.id));
    const extras = wider.filter((p) => !seen.has(p.id));
    setActivities([...local, ...extras]);
    setActivityIdx(0);
    setActivityExpandTried(true);
    setActivityExpandLoading(false);
  }

  async function expandRestaurantSearch() {
    if (!plan.coords?.lat || !plan.coords?.lng) return;
    setRestaurantExpandLoading(true);
    const areaName = (plan.location || '').split(',')[0].trim();
    const local = await fetchLocalRestaurants(plan.coords, areaName, 12000);
    const wider = await fetchLocalRestaurants(plan.coords, '', 25000);
    const seen = new Set(local.map((p) => p.id));
    const merged = [...local, ...wider.filter((p) => !seen.has(p.id))];
    setCuisineMap(buildCuisineMap(merged));
    setSelectedCuisine('all');
    expandedCuisines.current = new Set();
    setRestaurantIdx(0);
    setRestaurantExpandTried(true);
    setRestaurantExpandLoading(false);
  }

  // Expand a specific cuisine's list when it has fewer than 3 items
  async function expandCuisineIfThin(cuisine) {
    if (cuisine === 'all') return;
    const current = cuisineMap[cuisine] || [];
    if (current.length >= 3) return;
    if (expandedCuisines.current.has(cuisine)) return;
    expandedCuisines.current.add(cuisine);

    const tab = CUISINE_TABS.find(t => t.key === cuisine);
    if (!tab?.keyword) return;

    const { lat, lng } = plan.coords;
    const areaName = (plan.location || '').split(',')[0].trim();
    setCuisineExpandLoading(true);

    const FAST_FOOD    = ['mcdonald','burger king','wendy','jack in the box','in-n-out',"bob's big boy",'taco bell','kfc'];
    const CLEARLY_WRONG = new Set(['bar','night_club','lodging','store','shopping_mall']);

    const raw = await getPlacesNearby(
      ['restaurant'], { lat, lng },
      { radius: 20000, keyword: tab.keyword, maxResults: 20 }
    );
    const filtered = raw
      .filter(p => !isBlockedPlace(p))
      .filter(p => {
        const n = (p.name || '').toLowerCase();
        const t = p.types || [];
        if (FAST_FOOD.some(k => n.includes(k))) return false;
        if (t.some(bt => CLEARLY_WRONG.has(bt))) return false;
        return true;
      })
      .filter(p => p.rating != null && Number(p.rating) >= 4.3)
      .sort((a, b) => (Number(b.rating) - Number(a.rating)) || ((b.totalRatings || 0) - (a.totalRatings || 0)));

    const existingIds = new Set(current.map(p => p.id));
    const merged = [...current, ...filtered.filter(p => !existingIds.has(p.id))];
    setCuisineMap(prev => ({ ...prev, [cuisine]: merged }));
    setRestaurantIdx(0);
    setCuisineExpandLoading(false);
  }

  // Reset index and expand thin lists when cuisine tab changes
  useEffect(() => {
    setRestaurantIdx(0);
    setSaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCuisine]);

  // If the selected cuisine bucket is empty after a fetch/expand, fall back to All.
  useEffect(() => {
    const list = cuisineMap[selectedCuisine];
    const allLen = cuisineMap.all?.length || 0;
    if (allLen > 0 && (!list || list.length === 0) && selectedCuisine !== 'all') {
      setSelectedCuisine('all');
      setRestaurantIdx(0);
    }
  }, [cuisineMap, selectedCuisine]);

  function handleSavePlan() {
    const list       = cuisineMap[selectedCuisine] || [];
    const restaurant = list[restaurantIdx];
    const activity   = activities[activityIdx];
    if (restaurant) saveSinglePlace(restaurant, { category: 'food',     city: plan.location });
    if (activity)   saveSinglePlace(activity,   { category: 'activity', city: plan.location });
    setSaved(true);
    const names = [restaurant?.name, activity?.name].filter(Boolean).join(' + ');
    Alert.alert(
      'Plan Saved!',
      `${names} added to your saved plans.`,
      [
        { text: 'View Saved Plans', onPress: () => router.replace('/(tabs)/saved') },
        { text: 'Back Home',        onPress: () => router.replace('/(tabs)/') },
      ]
    );
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loadingWrap}>
          <Text style={s.loadingEmoji}>✨</Text>
          <Text style={s.loadingTitle}>Plannie is putting{'\n'}together your plan…</Text>
          <Text style={s.loadingSub}>Finding the best local spots</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Expanded search loading ───────────────────────────────
  if (expandLoading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loadingWrap}>
          <Text style={s.loadingEmoji}>🗺️</Text>
          <Text style={s.loadingTitle}>Searching{'\n'}nearby areas…</Text>
          <Text style={s.loadingSub}>Casting a wider net for you</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty state — BOTH missing ────────────────────────────
  if (noResults || (!(cuisineMap.all?.length) && !activities.length)) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={s.centeredMsg}>
          <Text style={s.errorEmoji}>🤔</Text>
          <Text style={s.errorTitle}>
            {!plan.coords?.lat ? 'Location needed' : 'Nothing found nearby'}
          </Text>
          <Text style={s.errorSub}>
            {!plan.coords?.lat
              ? 'Set your location first so we can build a plan for you.'
              : "We couldn't find good spots in your area. Try a wider search or pick manually."}
          </Text>
          {!!plan.coords?.lat && (
            <TouchableOpacity style={s.btnPrimary} onPress={tryNearbyAreas} activeOpacity={0.85}>
              <Text style={s.btnPrimaryText}>Try Nearby Areas</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.btnOutline, { marginTop: 12 }]} onPress={tryAgain} activeOpacity={0.85}>
            <Text style={s.btnOutlineText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnOutline, { marginTop: 12 }]} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={s.btnOutlineText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentList    = cuisineMap[selectedCuisine] || [];
  const restaurant     = currentList[restaurantIdx] || null;
  const activity       = activities[activityIdx] || null;
  const hasBoth        = !!restaurant && !!activity;
  // Always offer "All" when there are restaurants; add cuisine tabs only when that bucket has rows.
  const availableTabs = CUISINE_TABS.filter(
    (t) =>
      (t.key === 'all' && (cuisineMap.all?.length || 0) > 0) ||
      (t.key !== 'all' && (cuisineMap[t.key]?.length || 0) > 0)
  );

  // ── Plan view ─────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: Math.max(insets.bottom + 32, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.planLabel}>✨ TONIGHT'S PLAN FOR YOU</Text>
          <Text style={s.planTitle}>Date{'\n'}<Text style={s.planTitleAccent}>Night</Text></Text>
        </View>

        {/* Dinner — always shown (swap + cuisine tabs when we have a pool) */}
        <PlaceCard
          label="Dinner"
          emoji="🍽️"
          place={restaurant}
          onPress={() => restaurant && setDetailPlace(restaurant)}
          onSwap={() =>
            setRestaurantIdx((i) => (currentList.length ? (i + 1) % currentList.length : 0))
          }
          canSwap={currentList.length > 1}
          tabsContent={
            currentList.length > 0 && availableTabs.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.cuisineTabs}
                contentContainerStyle={s.cuisineTabsContent}
              >
                {availableTabs.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[s.cuisineTab, selectedCuisine === t.key && s.cuisineTabActive]}
                    onPress={() => {
                      setSelectedCuisine(t.key);
                      setRestaurantIdx(0);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.cuisineTabText, selectedCuisine === t.key && s.cuisineTabTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null
          }
          loadingOverlay={
            restaurantExpandLoading || (cuisineExpandLoading && selectedCuisine !== 'all')
          }
          emptyTitle="Dinner"
          emptySubtext={
            restaurantExpandTried
              ? 'Still no dinner spots in range. Try another area or pick manually.'
              : 'No dinner spots matched your area name.\nTry expanding search for more restaurants nearby.'
          }
          emptyActionLabel="Expand Search"
          onEmptyAction={expandRestaurantSearch}
        />

        {/* Flow text — only when both sections are shown */}
        {hasBoth && (
          <View style={s.flowRow}>
            <View style={s.flowLine} />
            <Text style={s.flowText}>Dinner first, then head to your activity.</Text>
            <View style={s.flowLine} />
          </View>
        )}

        {/* Activity section — always render with fallback copy */}
        <PlaceCard
          label="Activity"
          emoji="🎯"
          place={activity}
          onPress={() => activity && setDetailPlace(activity)}
          onSwap={() => setActivityIdx(i => (i + 1) % activities.length)}
          canSwap={activities.length > 1}
          loadingOverlay={activityExpandLoading}
          emptyTitle="Activity"
          emptySubtext={
            activityExpandTried
              ? 'Still no activities found nearby. Try another area.'
              : 'No activities found in this area\nTry expanding your search or choose manually'
          }
          emptyActionLabel="Expand Search"
          onEmptyAction={expandActivitySearch}
        />

        {/* Not feeling it? */}
        <View style={s.notFeeling}>
          <Text style={s.notFeelingText}>Not feeling it? Try picking your own plan instead.</Text>
          <TouchableOpacity
            style={s.manualBtn}
            onPress={() => router.push('/plan/category')}
            activeOpacity={0.8}
          >
            <Text style={s.manualBtnText}>Do it manually</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.btnPrimary, saved && s.btnSaved]}
            onPress={handleSavePlan}
            activeOpacity={0.85}
            disabled={saved}
          >
            <Text style={s.btnPrimaryText}>{saved ? '✓ Plan Saved' : 'Save Plan'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnOutline} onPress={tryAgain} activeOpacity={0.85}>
            <Text style={s.btnOutlineText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PlaceDetailSheet place={detailPlace} onClose={() => setDetailPlace(null)} />
    </SafeAreaView>
  );
}

const det = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  dismissArea:  { flex: 1 },
  sheet:        { backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', overflow: 'hidden' },
  topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  handle:       { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.gray3, marginHorizontal: 40 },
  closeX:       { padding: 4 },
  closeXText:   { fontSize: 16, color: colors.gray2 },

  photoScroll:      { height: 230 },
  photo:            { height: 230 },
  photoPlaceholder: { height: 160, backgroundColor: colors.gray4, alignItems: 'center', justifyContent: 'center' },

  body:         { padding: 20 },

  typeTag:      { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.rose, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6, opacity: 0.85 },
  name:         { fontFamily: fonts.display, fontSize: 20, color: colors.charcoal, marginBottom: 8, lineHeight: 26 },

  ratingRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rating:       { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold },
  reviewCount:  { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },

  statusRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  openBadge:    { fontFamily: fonts.bodyMedium, fontSize: 12, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  openNowBadge: { color: '#3a9c5e', backgroundColor: 'rgba(91,191,133,0.13)' },
  closedBadge:  { color: colors.gray2, backgroundColor: colors.gray4 },
  hoursText:    { fontFamily: fonts.body, fontSize: 11, color: colors.gray2 },

  infoRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  infoIcon:     { fontSize: 13, marginTop: 1 },
  infoText:     { fontFamily: fonts.body, fontSize: 12, color: colors.gray, flex: 1, lineHeight: 18 },

  reviewsSection: { marginTop: 4, marginBottom: 8 },
  reviewsHeader:  { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.charcoal, marginBottom: 8, letterSpacing: 0.2 },
  reviewCard:     { backgroundColor: colors.cream2, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.gray4 },
  reviewText:     { fontFamily: fonts.body, fontSize: 12, color: colors.gray, lineHeight: 17, fontStyle: 'italic' },

  mapsBtn:      { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  mapsBtnText:  { fontFamily: fonts.bodyMedium, fontSize: 15, color: '#F2EDE8' },
});

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingHorizontal: 20 },

  // Loading
  loadingWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingEmoji: { fontSize: 56, marginBottom: 24 },
  loadingTitle: { fontFamily: fonts.display, fontSize: 25, color: colors.charcoal, textAlign: 'center', lineHeight: 38, marginBottom: 12 },
  loadingSub:   { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, textAlign: 'center' },

  // Header
  header:         { paddingTop: 20, paddingBottom: 24 },
  backBtn:        { alignSelf: 'flex-start', marginBottom: 20 },
  backText:       { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },
  planLabel:      { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.rose, letterSpacing: 1.5, marginBottom: 8 },
  planTitle:      { fontFamily: fonts.display, fontSize: 40, color: colors.charcoal, lineHeight: 46 },
  planTitleAccent:{ fontFamily: fonts.displayItalic, color: colors.rose },

  // Section
  section:       { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionEmoji:  { fontSize: 20 },
  sectionLabel:  { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal2 },

  // Card
  card: {
    backgroundColor: colors.cream2,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.gray4,
    ...shadow.sm,
  },
  cardPhoto:        { width: '100%', height: 160 },
  cardPhotoFallback:{ width: '100%', height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream3 },
  cardPhotoEmoji:   { fontSize: 40 },
  cardBody:    { padding: 16, paddingBottom: 14 },
  cardName:    { fontFamily: fonts.bodySemiBold, fontSize: 18, color: colors.charcoal, marginBottom: 6 },
  cardMeta:    { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  cardRating:  { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.gold },
  cardAddress: { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, flex: 1 },
  swapBtn: {
    marginHorizontal: 16,
    marginBottom: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.rose,
    alignItems: 'center',
  },
  swapBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },

  // Flow divider
  flowRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, gap: 10 },
  flowLine: { flex: 1, height: 1, backgroundColor: colors.gray4 },
  flowText: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, textAlign: 'center', flexShrink: 1 },

  // Actions
  actions:   { gap: 12, marginTop: 28 },
  btnPrimary: {
    backgroundColor: colors.rose,
    borderRadius: radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    ...shadow.rose,
  },
  btnSaved:       { backgroundColor: colors.gray3 },
  btnPrimaryText: { fontFamily: fonts.bodyMedium, fontSize: 16, color: '#F2EDE8' },
  btnOutline: {
    borderRadius: radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray3,
  },
  btnOutlineText: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.charcoal },

  // Error state
  centeredMsg: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: 80 },
  errorEmoji:  { fontSize: 40, marginBottom: 16 },
  errorTitle:  { fontFamily: fonts.display, fontSize: 20, color: colors.charcoal, textAlign: 'center', marginBottom: 12 },
  errorSub:    { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, textAlign: 'center', lineHeight: 22, marginBottom: 32 },

  // Cuisine tabs
  cuisineTabs:        { marginBottom: 12 },
  cuisineTabsContent: { paddingHorizontal: 2, gap: 8, flexDirection: 'row' },
  cuisineTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.gray4,
    backgroundColor: colors.cream2,
  },
  cuisineTabActive:     { borderColor: colors.rose, backgroundColor: 'rgba(212,149,111,0.10)' },
  cuisineTabText:       { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gray2 },
  cuisineTabTextActive: { color: colors.rose },

  // Card loading / empty states
  cardLoadingOverlay: { height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream3 },
  cardLoadingText:    { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, textAlign: 'center', paddingHorizontal: 16, paddingVertical: 20 },
  emptyCardWrap:      { minHeight: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream3, paddingHorizontal: 18, paddingVertical: 18 },
  emptyCardTitle:     { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.charcoal, marginBottom: 4 },
  emptyActionBtn: {
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: colors.gray3,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  emptyActionBtnText: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.charcoal },

  // Not feeling it
  notFeeling: {
    marginTop: 24,
    marginBottom: 4,
    padding: 18,
    borderRadius: radius.md,
    backgroundColor: colors.cream2,
    borderWidth: 1,
    borderColor: colors.gray4,
    alignItems: 'center',
    gap: 12,
  },
  notFeelingText: { fontFamily: fonts.body, fontSize: 10, color: colors.gray2, textAlign: 'center', lineHeight: 20 },
  manualBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.gray3,
  },
  manualBtnText: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.charcoal },
});
