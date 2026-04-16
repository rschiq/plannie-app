// app/plan/results.js
// Results list + in-app detail sheet + bottom nav + save
import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Linking, Modal, Dimensions, Alert,
  TextInput, KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { isInArea, calcDistance } from '../../services/nearbyPlacesService';
import { getPlacesNearby } from '../../services/placesService';
import RizzLoader from '../../components/RizzLoader';
import { minLoadingDisplaySince } from '../../utils/minLoadingDisplay';
import { addExtraRuns, consumeRunIfAvailable } from '../../utils/runLimiter';
import PaywallModal from '../../components/PaywallModal';

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';
const SCREEN_W = Dimensions.get('window').width;

// ── Category config ────────────────────────────────────────────
const CATEGORY_LABELS = {
  activity: 'Activities',
};

const FOOD_SUBCATEGORY_CONFIG = {
  brunch_dinner: {
    mode: 'brunch_dinner',
    displayTitle: 'Restaurants',
    fetchTypes: ['restaurant', 'bakery'],
    includeKeywords: ['brunch', 'dinner', 'grill', 'kitchen', 'eatery', 'restaurant'],
    excludeKeywords: ['bar only', 'nightclub', 'coffee roasters', 'cafe'],
    rankingBoostKeywords: ['restaurant', 'brunch', 'grill', 'kitchen', 'steak', 'wine'],
    rejectedTypes: ['grocery_or_supermarket', 'supermarket', 'department_store', 'shopping_mall'],
  },
  coffee_dessert: {
    mode: 'coffee_dessert',
    displayTitle: 'Cafes',
    fetchTypes: ['cafe', 'bakery'],
    includeKeywords: ['coffee', 'cafe', 'espresso', 'tea', 'dessert', 'bakery', 'starbucks'],
    excludeKeywords: ['steakhouse', 'grill house', 'nightclub', 'sports bar'],
    rankingBoostKeywords: ['local', 'artisan', 'espresso', 'cafe', 'bakery', 'dessert'],
    rejectedTypes: ['bar', 'night_club', 'liquor_store', 'grocery_or_supermarket', 'supermarket', 'department_store', 'shopping_mall'],
  },
  drinks: {
    mode: 'drinks',
    displayTitle: 'Bars',
    fetchTypes: ['bar'],
    includeKeywords: ['bar', 'cocktail', 'wine', 'pub', 'speakeasy', 'lounge', 'rooftop', 'bistro'],
    excludeKeywords: ['coffee', 'cafe', 'espresso', 'bakery'],
    rankingBoostKeywords: ['cocktail', 'wine', 'speakeasy', 'rooftop', 'lounge', 'pub'],
    rejectedTypes: ['cafe', 'bakery', 'grocery_or_supermarket', 'supermarket', 'department_store', 'shopping_mall'],
  },
};

function resolveResultsMode(category, dateIdea) {
  if (category === 'food') {
    const resolved = FOOD_SUBCATEGORY_CONFIG[dateIdea] || FOOD_SUBCATEGORY_CONFIG.brunch_dinner;
    return {
      ...resolved,
      isFoodMode: true,
    };
  }

  return {
    mode: category || 'activity',
    displayTitle: CATEGORY_LABELS[category] || 'Places',
    fetchTypes: getPlaceTypes(category, dateIdea),
    includeKeywords: [],
    excludeKeywords: [],
    rankingBoostKeywords: [],
    rejectedTypes: [],
    isFoodMode: false,
  };
}

function getPlaceTypes(category, dateIdea) {
  if (category === 'food') {
    return (FOOD_SUBCATEGORY_CONFIG[dateIdea]?.fetchTypes || FOOD_SUBCATEGORY_CONFIG.brunch_dinner.fetchTypes).slice();
  }

  if (category === 'activity') {
    switch (dateIdea) {
      case 'fun':
        return ['amusement_center', 'bowling_alley'];
      case 'movies':
        return ['movie_theater'];
      case 'outdoor':
        return ['park'];
      case 'scenic':
        return ['tourist_attraction'];
      case 'arcade':
        return ['amusement_center'];
      case 'unique':
        return ['tourist_attraction'];
      default:
        return ['tourist_attraction'];
    }
  }

  return [];
}

function applyBudgetFilter(results, budget) {
  if (!results || results.length === 0) return results;

  let filtered = results;

  if (budget === '$$') {
    filtered = results.filter((place) => (place.rating || 0) >= 4.0);
  }

  if (budget === '$$$') {
    filtered = results.filter((place) => (place.rating || 0) >= 4.3);
  }

  return filtered;
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

function applyCategoryFilter(results, dateIdea, resolvedMode, category) {
  let filtered = results || [];

  // REMOVE FAST FOOD (ALL CATEGORIES)
  filtered = filtered.filter((place) => {
    const name = (place.name || '').toLowerCase();
    if (
      name.includes('mcdonald') ||
      name.includes('burger king') ||
      name.includes('wendy') ||
      name.includes('jack in the box') ||
      name.includes('kfc')
    ) {
      return false;
    }
    return true;
  });

  if (category === 'food' && resolvedMode?.isFoodMode) {
    if (dateIdea === 'drinks') {
      filtered = filtered.filter((place) => {
        const types = place.types || [];
        const name = (place.name || '').toLowerCase();
        return (
          types.includes('bar') ||
          name.includes('bar') ||
          name.includes('lounge') ||
          name.includes('pub') ||
          name.includes('cocktail')
        );
      });
    }

    if (dateIdea === 'coffee_dessert') {
      filtered = filtered.filter((place) => {
        const types = place.types || [];
        const name = (place.name || '').toLowerCase();
        return (
          types.includes('cafe') ||
          types.includes('bakery') ||
          name.includes('coffee') ||
          name.includes('cafe') ||
          name.includes('espresso') ||
          name.includes('starbucks')
        );
      });
    }

    if (dateIdea === 'brunch_dinner') {
      filtered = filtered.filter((place) => {
        const types = place.types || [];
        const name = (place.name || '').toLowerCase();

        // remove fast food and low-effort places
        if (
          name.includes('mcdonald') ||
          name.includes('burger king') ||
          name.includes('wendy') ||
          name.includes('jack in the box') ||
          name.includes('in-n-out') ||
          name.includes("bob's big boy")
        ) {
          return false;
        }

        return types.includes('restaurant');
      });
    }
  }

  return filtered;
}

function scorePlace(place, dateIdea, resolvedMode) {
  const rating = Number(place?.rating || 0);
  const reviews = Number(place?.user_ratings_total || place?.totalRatings || 0);
  const distanceRaw = place?.distanceMiles ?? place?.distance ?? 0;
  const distance = Number(distanceRaw) || 0;

  let score = rating + (reviews / 1000);
  // Penalize distance
  score -= distance * 0.5;

  const name = (place.name || '').toLowerCase();
  const types = place.types || [];

  // Penalize bad fast food
  if (
    name.includes('mcdonald') ||
    name.includes('burger king') ||
    name.includes('wendy') ||
    name.includes('jack in the box')
  ) {
    score -= 2;
  }

  // Slight penalty for casual chains
  if (
    name.includes('in-n-out') ||
    name.includes("bob's big boy")
  ) {
    score -= 1;
  }

  // BOOST Starbucks (IMPORTANT)
  if (name.includes('starbucks')) {
    score += 0.3;
  }

  // Boost cafes slightly
  if (
    name.includes('cafe') ||
    name.includes('coffee')
  ) {
    score += 0.3;
  }

  if (resolvedMode?.isFoodMode) {
    const boosts = resolvedMode.rankingBoostKeywords || [];
    const boostHits = boosts.filter((word) => name.includes(word)).length;
    score += boostHits * 0.2;

    if (resolvedMode.mode === 'coffee_dessert' && name.includes('starbucks')) {
      score -= 0.15;
    }
  }

  if (dateIdea === 'arcade') {
    if (
      name.includes('arcade') ||
      name.includes('game') ||
      name.includes('bowling')
    ) {
      score += 1;
    }

    if (
      name.includes('universal') ||
      name.includes('hotel')
    ) {
      score -= 2;
    }
  }

  return score;
}

// ── Activity: all search passes with subtype tags ─────────────
// Each entry has: type (Google Places type), keyword, tag (subtype bucket)
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
      const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,photos';
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
      <View style={det.overlay}>
        <View style={[det.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={det.handle} />

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

          <ScrollView style={det.body} showsVerticalScrollIndicator={false}>
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

            {/* Back */}
            <TouchableOpacity style={det.ghostBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={det.ghostBtnText}>← Back to Results</Text>
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
  photoScroll:  { height: 220, width: SCREEN_W },
  photo:        { height: 220 },
  photoPlaceholder: { height: 120, backgroundColor: colors.gray4, alignItems: 'center', justifyContent: 'center' },
  photoIcon:    { fontSize: 40 },
  body:         { padding: 20 },
  name:         { fontFamily: fonts.display, fontSize: 24, color: colors.charcoal, marginBottom: 4, marginTop: 8 },
  category:     { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginBottom: 10 },
  ratingRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rating:       { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.gold },
  reviews:      { fontFamily: fonts.body, fontSize: 13, color: colors.gray2 },
  row:          { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  rowIcon:      { fontSize: 14, marginTop: 1 },
  rowText:      { fontFamily: fonts.body, fontSize: 14, color: colors.gray, flex: 1, lineHeight: 20 },
  rowLink:      { color: colors.rose, textDecorationLine: 'underline' },
  divider:      { height: 1, backgroundColor: colors.gray4, marginVertical: 16 },
  // Save — primary gold action
  primaryBtn:      { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  primaryBtnSaved: { backgroundColor: colors.gray3 },
  primaryBtnText:  { fontFamily: fonts.bodyMedium, fontSize: 15, color: '#F2EDE8' },
  // Maps — outline
  outlineBtn:     { borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1.5, borderColor: colors.rose },
  outlineBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },
  // Back — ghost
  ghostBtn:     { borderRadius: 999, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.gray4, backgroundColor: colors.cream2 },
  ghostBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.charcoal },
});

// ── Place Card ─────────────────────────────────────────────────
function PlaceCard({ place, onPress, variant = 'default' }) {
  const isTopPick = variant === 'top';
  return (
    <TouchableOpacity
      style={[card.wrap, isTopPick && card.wrapTop]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {place.photoUrl ? (
        <Image source={{ uri: place.photoUrl }} style={card.photo} resizeMode="cover" />
      ) : (
        <View style={card.photoPlaceholder}><Text style={card.photoIcon}>📍</Text></View>
      )}
      <View style={card.body}>
        <Text style={card.name} numberOfLines={1}>{place.name}</Text>
        <View style={card.metaRow}>
          {place.rating    && <Text style={card.rating}>⭐ {place.rating}</Text>}
          {place.totalRatings > 0 && <Text style={card.reviews}>({place.totalRatings.toLocaleString()})</Text>}
          {place.distance  && <Text style={card.distance}>🚗 {place.distance} mi</Text>}
        </View>
        {place.address ? <Text style={card.address} numberOfLines={1}>📍 {place.address}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  wrap:  { backgroundColor: colors.cream2, borderRadius: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.gray4, ...shadow.sm },
  wrapTop: {
    backgroundColor: colors.white,
    borderColor: 'rgba(212,149,111,0.40)',
    borderWidth: 1.5,
    ...shadow.md,
  },
  photo: { width: '100%', height: 180 },
  photoPlaceholder: { width: '100%', height: 180, backgroundColor: colors.gray4, alignItems: 'center', justifyContent: 'center' },
  photoIcon: { fontSize: 28 },
  body:  { padding: 14 },
  name:  { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.charcoal, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 3, flexWrap: 'wrap' },
  rating:   { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold },
  reviews:  { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  distance: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  address:  { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
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
  const [showSearch,    setShowSearch]    = useState(false);  // manual search modal
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSelected, setSearchSelected] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const category = plan.category || 'food';
  const resolvedMode = resolveResultsMode(category, plan.dateIdea);
  const label = resolvedMode.displayTitle;
  const locationLabel = plan.location || '';
  const topPicks = places.slice(0, 5);
  const moreOptions = places.slice(5);

  useEffect(() => { fetchPlaces(); }, []);
  useEffect(() => {
    if (topPicks.length > 0) {
      console.log('[Ranking] Top Picks:', topPicks.map((p) => p.name));
    }
  }, [places]);

  // ── Fetch using nearbyPlacesService ─────────────────────────
  async function fetchPlaces() {
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

      // ✅ Use stored coords — set by location picker in details.js
      // Fall back to geocoding city string if coords missing
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

      // Extract clean area name from city string (e.g. "Studio City, CA" → "Studio City")
      const areaName = locationLabel.split(',')[0].trim();

      const types = resolvedMode.fetchTypes;
      console.log('[ResultsMode] selectedFoodSubcategory:', plan.dateIdea || null);
      console.log('[ResultsMode] resolvedMode:', resolvedMode.mode);
      console.log('[ResultsMode] headerTitle:', resolvedMode.displayTitle);
      console.log('[ResultsMode] fetchTypes:', types);
      console.log('[ResultsMode] includeKeywords:', resolvedMode.includeKeywords || []);
      console.log('[ResultsMode] excludeKeywords:', resolvedMode.excludeKeywords || []);
      console.log('[Search] using types:', types, 'category:', plan.category, 'dateIdea:', plan.dateIdea);
      let raw = await getPlacesNearby(types, { lat, lng }, {
        radius: 8000,
        maxResults: 24,
        selectedArea: areaName,
        budget: plan.budget,
      });
      raw = lightFilter(raw);
      raw = applyCategoryFilter(raw, plan.dateIdea, resolvedMode, plan.category);
      const beforeBudgetFilterCount = raw.length;
      console.log('[BudgetFilter] budget:', plan.budget, 'before:', beforeBudgetFilterCount);
      const budgetFiltered = applyBudgetFilter(raw, plan.budget);
      raw = budgetFiltered.length > 0 ? budgetFiltered : raw;
      const selectedArea = (plan.location || '')
        .split(',')[0]
        .trim()
        .toLowerCase();
      const inArea = raw.filter((place) => {
        const address = (place.vicinity || place.address || '').toLowerCase();
        return address.includes(selectedArea);
      });
      console.log('[Area] selectedArea:', selectedArea);
      console.log('[Area] strictMatches:', inArea.length);
      if (inArea.length >= 5) {
        raw = inArea;
      } else {
        console.log('[Area] not enough strict matches, adding nearby');
        const inAreaIds = new Set(inArea.map((p) => p.id));
        const nearby = raw.filter((p) => !inAreaIds.has(p.id));
        raw = [...inArea, ...nearby];
      }
      raw.sort((a, b) => {
        const scoreDiff = scorePlace(b, plan.dateIdea, resolvedMode) - scorePlace(a, plan.dateIdea, resolvedMode);
        if (scoreDiff !== 0) return scoreDiff;
        // tie-breaker: closer distance wins
        const aDist = Number(a?.distanceMiles ?? a?.distance ?? 99999) || 99999;
        const bDist = Number(b?.distanceMiles ?? b?.distance ?? 99999) || 99999;
        return aDist - bDist;
      });
      console.log('[Area] finalResults:', raw.length);
      console.log('[BudgetFilter] budget:', plan.budget, 'after:', raw.length);
      console.log('[ResultsMode] top10AfterFilterRanking:', raw.slice(0, 10).map((p) => p.name));

      const mapped = raw.map((p) => {
        const dist = p.distanceMiles ?? calcDistance({ lat, lng }, p.location);
        const placeForArea = { vicinity: p.address, formatted_address: p.address };
        return {
          id:           p.id,
          name:         p.name,
          rating:       p.rating != null ? parseFloat(p.rating).toFixed(1) : null,
          totalRatings: p.totalRatings || 0,
          address:      p.address || '',
          distance:     dist.toFixed(1),
          inArea:       isInArea(placeForArea, areaName),
          isExpanded:   !isInArea(placeForArea, areaName),
          types:        p.types || [],
          photoUrl:     p.photoUrl,
          location:     p.location,
        };
      });

      mapped.sort((a, b) => scorePlace(b, plan.dateIdea, resolvedMode) - scorePlace(a, plan.dateIdea, resolvedMode));
      setPlaces(mapped.slice(0, 20));
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

  // ── Expand search to nearby areas ────────────────────────────
  async function expandSearch() {
    setExpandLoading(true);
    try {
      // Use stored coords (works for ANY city worldwide — not just Studio City)
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

      const existingIds = new Set(places.map(p => p.id));
      const areaName = locationLabel.split(',')[0].trim();
      const types = resolvedMode.fetchTypes;
      console.log('[ResultsMode] selectedFoodSubcategory:', plan.dateIdea || null);
      console.log('[ResultsMode] resolvedMode:', resolvedMode.mode);
      console.log('[ResultsMode] headerTitle:', resolvedMode.displayTitle);
      console.log('[ResultsMode] fetchTypes:', types);
      console.log('[ResultsMode] includeKeywords:', resolvedMode.includeKeywords || []);
      console.log('[ResultsMode] excludeKeywords:', resolvedMode.excludeKeywords || []);
      console.log('[Search] using types:', types, 'category:', plan.category, 'dateIdea:', plan.dateIdea);

      let rawMore = await getPlacesNearby(types, { lat, lng }, {
        radius: 35000,
        maxResults: 40,
        selectedArea: areaName,
        budget: plan.budget,
      });
      rawMore = lightFilter(rawMore);
      rawMore = applyCategoryFilter(rawMore, plan.dateIdea, resolvedMode, plan.category);
      const beforeBudgetFilterCount = rawMore.length;
      console.log('[BudgetFilter] budget:', plan.budget, 'before:', beforeBudgetFilterCount);
      const budgetFiltered = applyBudgetFilter(rawMore, plan.budget);
      rawMore = budgetFiltered.length > 0 ? budgetFiltered : rawMore;
      const selectedArea = (plan.location || '')
        .split(',')[0]
        .trim()
        .toLowerCase();
      const inArea = rawMore.filter((place) => {
        const address = (place.vicinity || place.address || '').toLowerCase();
        return address.includes(selectedArea);
      });
      console.log('[Area] selectedArea:', selectedArea);
      console.log('[Area] strictMatches:', inArea.length);
      if (inArea.length >= 5) {
        rawMore = inArea;
      } else {
        console.log('[Area] not enough strict matches, adding nearby');
        const inAreaIds = new Set(inArea.map((p) => p.id));
        const nearby = rawMore.filter((p) => !inAreaIds.has(p.id));
        rawMore = [...inArea, ...nearby];
      }
      rawMore.sort((a, b) => {
        const scoreDiff = scorePlace(b, plan.dateIdea, resolvedMode) - scorePlace(a, plan.dateIdea, resolvedMode);
        if (scoreDiff !== 0) return scoreDiff;
        // tie-breaker: closer distance wins
        const aDist = Number(a?.distanceMiles ?? a?.distance ?? 99999) || 99999;
        const bDist = Number(b?.distanceMiles ?? b?.distance ?? 99999) || 99999;
        return aDist - bDist;
      });
      console.log('[Area] finalResults:', rawMore.length);
      console.log('[BudgetFilter] budget:', plan.budget, 'after:', rawMore.length);
      console.log('[ResultsMode] top10AfterFilterRanking:', rawMore.slice(0, 10).map((p) => p.name));

      const moreResults = rawMore
        .filter(p => !existingIds.has(p.id))
        .map((p) => {
          const dist = p.distanceMiles ?? calcDistance({ lat, lng }, p.location);
          const placeForArea = { vicinity: p.address, formatted_address: p.address };
          return {
            id:           p.id,
            name:         p.name,
            rating:       p.rating != null ? parseFloat(p.rating).toFixed(1) : null,
            totalRatings: p.totalRatings || 0,
            address:      p.address || '',
            distance:     dist.toFixed(1),
            inArea:       isInArea(placeForArea, areaName),
            isExpanded:   true,
            types:        p.types || [],
            photoUrl:     p.photoUrl,
            location:     p.location,
          };
        })
        .slice(0, 15);

      setPlaces(prev => {
        const combined = [...prev, ...moreResults];
        combined.sort((a, b) => scorePlace(b, plan.dateIdea, resolvedMode) - scorePlace(a, plan.dateIdea, resolvedMode));
        return combined;
      });
      setExpanded(true);
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

      // Search 1: tight local radius (5km) with user query
      const params1 = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: '5000',
        keyword: searchQuery.trim(),
        key: GOOGLE_API_KEY,
      });
      const res1  = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params1}`);
      const data1 = await res1.json();
      let raw = data1.results || [];

      // Search 2: if not enough, expand to 15km
      if (raw.length < 5) {
        const params2 = new URLSearchParams({
          location: `${lat},${lng}`,
          radius: '15000',
          keyword: searchQuery.trim(),
          key: GOOGLE_API_KEY,
        });
        const res2  = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params2}`);
        const data2 = await res2.json();
        const extra = data2.results || [];
        const existingIds = new Set(raw.map(p => p.place_id));
        for (const p of extra) {
          if (!existingIds.has(p.place_id)) raw.push(p);
        }
      }

      // Map and sort — local area first
      const existingPlaceIds = new Set(places.map(p => p.id));
      const mapped = raw
        .filter(p => (p.rating ?? 0) >= 3.5)
        .map(p => {
          const dist = calcDistance({ lat, lng }, p.geometry?.location);
          return {
            id:           p.place_id,
            name:         p.name,
            rating:       p.rating ? parseFloat(p.rating).toFixed(1) : null,
            totalRatings: p.user_ratings_total || 0,
            address:      p.vicinity || '',
            distance:     dist.toFixed(1),
            inArea:       isInArea(p, areaName),
            isExpanded:   !isInArea(p, areaName),
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
      group:    plan.group,
      moment:   plan.moment,
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
      group:    plan.group,
      moment:   plan.moment,
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
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>{label}</Text>
          <Text style={s.sub}>Near {locationLabel || 'your location'} · sorted by rating</Text>
        </View>

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
            <Text style={s.errorText}>No results found nearby.</Text>
            <Text style={s.errorSub}>Try a different category or location.</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={s.retryBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={s.scroll}
            contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom + 32, 40) }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.count}>{places.length} places found · tap for details</Text>

            {/* ── Top Picks ── */}
            {topPicks.length > 0 && <Text style={s.sectionTitleTop}>Top Picks</Text>}
            {topPicks.map(p => (
              <View key={p.id}>
                {/* Label when expanded results start */}
                {p.isExpanded && places.indexOf(p) === places.findIndex(x => x.isExpanded) && (
                  <View style={s.expandedLabel}>
                    <Text style={s.expandedLabelText}>📍 Nearby areas</Text>
                  </View>
                )}
                <PlaceCard place={p} onPress={() => openDetail(p)} variant="top" />
              </View>
            ))}

            {/* ── More Options ── */}
            {moreOptions.length > 0 && <Text style={s.sectionTitleMore}>More Options</Text>}
            {moreOptions.map(p => (
              <View key={p.id}>
                {p.isExpanded && places.indexOf(p) === places.findIndex(x => x.isExpanded) && (
                  <View style={s.expandedLabel}>
                    <Text style={s.expandedLabelText}>📍 Nearby areas</Text>
                  </View>
                )}
                <PlaceCard place={p} onPress={() => openDetail(p)} variant="default" />
              </View>
            ))}

            {/* ── Expand button at BOTTOM of list ── */}
            {!expanded && places.length > 0 && (
              <View style={s.expandBanner}>
                <Text style={s.expandBannerText}>
                  Want to see more options from nearby areas?
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
                <Text style={s.expandedLabelText}>✓ Showing results from nearby areas</Text>
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
  count:       { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, marginBottom: 12, letterSpacing: 0.3 },
  sectionTitleTop:  {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.charcoal,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitleMore: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.gray,
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
});