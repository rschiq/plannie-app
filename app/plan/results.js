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
import { isInArea } from '../../services/nearbyPlacesService';
import { getPlacesNearby } from '../../services/placesService';
import RizzLoader from '../../components/RizzLoader';
import { minLoadingDisplaySince } from '../../utils/minLoadingDisplay';
import { addExtraRuns, consumeRunIfAvailable } from '../../utils/runLimiter';
import PaywallModal from '../../components/PaywallModal';

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';
const SCREEN_W = Dimensions.get('window').width;

// ── Category config ────────────────────────────────────────────
const ACTIVITY_TITLES = {
  fun:        'Fun',
  movies:     'Movies',
  outdoor:    'Outdoor',
  hidden_gem: 'Hidden Gems',
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

// ── Moment Profiles ───────────────────────────────────────────
const MOMENT_PROFILES = {
  first_date: {
    // Intimate, low-pressure, conversation-friendly
    boostKeywords:   ['wine', 'bistro', 'garden', 'patio', 'romantic', 'dessert', 'coffee', 'cafe', 'intimate', 'cozy', 'candlelit', 'tea'],
    penaltyKeywords: ['sports bar', 'nightclub', 'dive bar', 'buffet', 'karaoke', 'arcade', 'bowling', 'loud'],
    minRating: 4.2,
    boostScore: 2.0,
  },
  casual_hangout: {
    // Easy, unpretentious, approachable — the opposite of first_date and date_night
    boostKeywords:   ['brunch', 'pizza', 'burger', 'taco', 'local', 'neighborhood', 'patio', 'casual', 'diner', 'sandwich', 'bbq'],
    penaltyKeywords: ['fine dining', 'tasting menu', 'prix fixe', 'rooftop', 'lounge', 'speakeasy', 'cocktail bar'],
    minRating: 3.9,
    boostScore: 1.5,
  },
  date_night: {
    // Elevated, intentional — a real night out, not just dinner
    boostKeywords:   ['rooftop', 'cocktail', 'speakeasy', 'lounge', 'steak', 'sushi', 'wine bar', 'italian', 'view', 'upscale', 'tasting'],
    penaltyKeywords: ['fast food', 'buffet', 'counter service', 'drive-thru', 'cafe', 'diner', 'casual', 'family restaurant'],
    minRating: 4.3,
    boostScore: 2.0,
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
    displayTitle: category === 'activity' ? (ACTIVITY_TITLES[dateIdea] || 'Activities') : 'Places',
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
      case 'fun':        return ['amusement_center', 'bowling_alley'];
      case 'movies':     return ['movie_theater'];
      case 'outdoor':    return ['park'];
      default:           return ['tourist_attraction'];
    }
  }

  return [];
}

function applyBudgetFilter(results, budget) {
  if (!results?.length || !budget) return results;

  // $ → price_level 0,1,2  |  $$ → price_level 3,4
  const allowedLevels = budget === '$' ? [0, 1, 2] : [3, 4];

  const byPrice = results.filter(p => {
    const level = p.priceLevel;
    if (level == null) return (Number(p.rating) || 0) >= 4.5;
    return allowedLevels.includes(level);
  });

  const final = byPrice.length >= 0 ? byPrice : results;
  console.log('[BudgetFilter] after:', final.length);
  return final;
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

  // Activity: never mix with restaurants, cafes, hotels
  if (category === 'activity') {
    filtered = filtered.filter(p => {
      const t = p.types || [];
      return !t.includes('restaurant') && !t.includes('lodging') &&
             !t.includes('grocery_or_supermarket');
    });
  }

  // Movies: require movie_theater type, exclude non-cinemas
  if (dateIdea === 'movies') {
    const MOVIES_JUNK = ['home theater', 'installation', 'repair', 'security'];
    filtered = filtered.filter(p => {
      const t = p.types || [];
      const n = (p.name || '').toLowerCase();
      if (!t.includes('movie_theater')) return false;
      if (MOVIES_JUNK.some(k => n.includes(k))) return false;
      return true;
    });
  }

  if (category === 'food' && resolvedMode?.isFoodMode) {
    if (dateIdea === 'drinks') {
      filtered = filtered.filter(p => {
        const t = p.types || [];
        const n = (p.name || '').toLowerCase();
        return t.includes('bar') || n.includes('bar') || n.includes('lounge') ||
               n.includes('pub') || n.includes('cocktail');
      });
    }

    if (dateIdea === 'coffee_dessert') {
      filtered = filtered.filter(p => {
        const t = p.types || [];
        const n = (p.name || '').toLowerCase();
        const isCafe = t.includes('cafe') || t.includes('bakery') ||
          ['coffee','cafe','dessert','bakery','espresso','tea','boba'].some(k => n.includes(k));
        const isRestaurant = ['cuisine','steakhouse','grill','bbq','big boy','brasserie'].some(k => n.includes(k));
        return isCafe && !isRestaurant;
      });
    }

    if (dateIdea === 'brunch_dinner') {
      filtered = filtered.filter(p => {
        const t = p.types || [];
        const n = (p.name || '').toLowerCase();
        if (['mcdonald','burger king','wendy','jack in the box','in-n-out',"bob's big boy"].some(k => n.includes(k))) return false;
        return t.includes('restaurant');
      });
    }
  }

  return filtered;
}

function scorePlace(place, plan, resolvedMode) {
  const rating  = Number(place?.rating || 0);
  const reviews = Number(place?.user_ratings_total || place?.totalRatings || 0);
  const name    = (place.name || '').toLowerCase();

  // Base: rating × log10(reviews+1) — wide separation between quality tiers
  let score = rating * Math.log10(reviews + 1);

  // Moment profile boosts / penalties
  const profile = MOMENT_PROFILES[plan?.moment];
  if (profile) {
    if (profile.boostKeywords.some(k => name.includes(k)))   score += profile.boostScore;
    if (profile.penaltyKeywords.some(k => name.includes(k))) score -= profile.boostScore;
  }

  // Category mode keyword boosts
  if (resolvedMode?.isFoodMode) {
    const hits = (resolvedMode.rankingBoostKeywords || []).filter(w => name.includes(w)).length;
    score += hits * 0.3;
  }

  // Chain penalties
  if (['in-n-out', "bob's big boy"].some(k => name.includes(k))) score -= 2;

  return score;
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
  "applebee's","chili's",'olive garden','ihop',"denny's",
  "bob's big boy",'cracker barrel','red lobster','outback steakhouse','hooters',
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
  if (types.includes('bakery'))      return 'Bakery';
  return null;
}

function curateResults(raw, plan, resolvedMode, lat, lng) {
  const profile = MOMENT_PROFILES[plan?.moment];

  // Soft minRating gate — only tighten if enough results survive
  if (profile?.minRating) {
    const qualified = raw.filter(p => (Number(p.rating) || 0) >= profile.minRating);
    if (qualified.length >= 5) raw = qualified;
  }

  raw.sort((a, b) => {
    const diff = scorePlace(b, plan, resolvedMode) - scorePlace(a, plan, resolvedMode);
    if (diff !== 0) return diff;
    return getDistanceMeters(lat, lng, a.location?.lat, a.location?.lng) -
           getDistanceMeters(lat, lng, b.location?.lat, b.location?.lng);
  });

  console.log('[Curator] moment:', plan?.moment,
    'top5:', raw.slice(0, 5).map(p => `${p.name}(${p.rating})`));

  return raw.slice(0, 5);
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
  const priceStr  = place.priceLevel != null ? '$'.repeat(place.priceLevel + 1) : null;
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
        <View style={card.titleRow}>
          <Text style={card.name} numberOfLines={1}>{place.name}</Text>
          {priceStr && <Text style={card.price}>{priceStr}</Text>}
        </View>
        <View style={card.metaRow}>
          {place.rating && <Text style={card.rating}>⭐ {place.rating}</Text>}
          {place.totalRatings > 0 && <Text style={card.reviews}>({place.totalRatings.toLocaleString()})</Text>}
          {place.cuisine && <Text style={card.cuisine}>{place.cuisine}</Text>}
          {place.distance && <Text style={card.distance}>🚗 {place.distance} mi</Text>}
          {place.openNow != null && (
            <Text style={[card.openTag, place.openNow ? card.openNow : card.closedNow]}>
              {place.openNow ? 'Open' : 'Closed'}
            </Text>
          )}
        </View>
        {place.address ? <Text style={card.address} numberOfLines={1}>📍 {place.address}</Text> : null}
        {place.hoursToday ? <Text style={card.hours} numberOfLines={1}>🕐 {place.hoursToday}</Text> : null}
        {place.reviewSnippet ? (
          <Text style={card.review} numberOfLines={2}>"{place.reviewSnippet}"</Text>
        ) : null}
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
  name:  { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.charcoal, flex: 1, marginRight: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 3, flexWrap: 'wrap' },
  rating:   { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold },
  reviews:  { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  distance: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  address:  { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  price:     { fontFamily: fonts.body, fontSize: 12, color: colors.gold },
  cuisine:   { fontFamily: fonts.body, fontSize: 12, color: colors.rose, backgroundColor: 'rgba(212,149,111,0.10)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  openTag:   { fontFamily: fonts.body, fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  openNow:   { color: '#3d9970', backgroundColor: 'rgba(61,153,112,0.10)' },
  closedNow: { color: colors.gray2, backgroundColor: colors.gray4 },
  hours:     { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, marginTop: 2 },
  review:    { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, marginTop: 4, fontStyle: 'italic', lineHeight: 15 },
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
  const [comingSoon, setComingSoon] = useState(false);
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

  const enrichedRef = useRef(new Set());

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
    if (plan.dateIdea === 'hidden_gem') {
      setComingSoon(true);
      setLoading(false);
      return;
    }
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
      const LOCAL_RADIUS = 6437;
      const selectedArea = (plan.location || '').split(',')[0].trim().toLowerCase();

      const inArea  = raw.filter(p => (p.address || '').toLowerCase().includes(selectedArea));
      const nearby  = raw.filter(p => getDistanceMeters(lat, lng, p.location?.lat, p.location?.lng) <= LOCAL_RADIUS);

      console.log('[Area] selected:', selectedArea);
      console.log('[Area] inArea:', inArea.length);
      console.log('[Area] nearby:', nearby.length);

      if (inArea.length >= 5)       raw = inArea;
      else if (nearby.length >= 5)  raw = nearby;
      // else keep all raw results as fallback

      raw = raw.filter(p => !isBlockedPlace(p));
      console.log('[Block] passed:', raw.length);

      const MAX_DISTANCE = 6400;
      const withinRange = raw.filter(p => getDistanceMeters(lat, lng, p.location?.lat, p.location?.lng) <= MAX_DISTANCE);
      if (withinRange.length >= 5) raw = withinRange;
      console.log('[Distance] within 4mi:', withinRange.length, '→ using:', raw.length);

      const curated   = curateResults(raw, plan, resolvedMode, lat, lng);
      const inAreaIds = new Set(inArea.map(p => p.id));
      const mapped    = curated.map((p) => {
        const distMeters = getDistanceMeters(lat, lng, p.location?.lat, p.location?.lng);
        const distMiles  = distMeters / 1609.34;
        console.log('[Distance]', p.name, distMeters);
        return {
          id:           p.id,
          name:         p.name,
          rating:       p.rating != null ? parseFloat(p.rating).toFixed(1) : null,
          totalRatings: p.totalRatings || 0,
          address:      p.address || '',
          distance:     distMiles.toFixed(1),
          inArea:       inAreaIds.has(p.id),
          isExpanded:   !inAreaIds.has(p.id),
          types:        p.types || [],
          photoUrl:     p.photoUrl,
          location:     p.location,
          priceLevel:     p.priceLevel ?? null,
          openNow:        p.isOpenNow ?? null,
          cuisine:        getCuisine(p.types || [], p.name || ''),
          reviewSnippet:  null,
          hoursToday:     null,
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
      const LOCAL_RADIUS = 6437;
      const selectedArea = (plan.location || '').split(',')[0].trim().toLowerCase();

      const inArea  = rawMore.filter(p => (p.address || '').toLowerCase().includes(selectedArea));
      const nearby  = rawMore.filter(p => getDistanceMeters(lat, lng, p.location?.lat, p.location?.lng) <= LOCAL_RADIUS);

      console.log('[Area] selected:', selectedArea);
      console.log('[Area] inArea:', inArea.length);
      console.log('[Area] nearby:', nearby.length);

      if (inArea.length >= 5)       rawMore = inArea;
      else if (nearby.length >= 5)  rawMore = nearby;

      rawMore = rawMore.filter(p => !isBlockedPlace(p));
      console.log('[Block] expand passed:', rawMore.length);

      const curatedMore = curateResults(rawMore, plan, resolvedMode, lat, lng);
      const inAreaIds   = new Set(inArea.map(p => p.id));
      const moreResults = curatedMore
        .filter(p => !existingIds.has(p.id))
        .map((p) => {
          const distMeters = getDistanceMeters(lat, lng, p.location?.lat, p.location?.lng);
          const distMiles  = distMeters / 1609.34;
          console.log('[Distance]', p.name, distMeters);
          return {
            id:           p.id,
            name:         p.name,
            rating:       p.rating != null ? parseFloat(p.rating).toFixed(1) : null,
            totalRatings: p.totalRatings || 0,
            address:      p.address || '',
            distance:     distMiles.toFixed(1),
            inArea:       inAreaIds.has(p.id),
            isExpanded:   !inAreaIds.has(p.id),
            types:        p.types || [],
            photoUrl:     p.photoUrl,
            location:     p.location,
            priceLevel:     p.priceLevel ?? null,
            openNow:        p.isOpenNow ?? null,
            cuisine:        getCuisine(p.types || [], p.name || ''),
            reviewSnippet:  null,
            hoursToday:     null,
          };
        });

      setPlaces(prev => [...prev, ...moreResults]);
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
          const distMeters = getDistanceMeters(lat, lng, p.geometry?.location?.lat ?? 0, p.geometry?.location?.lng ?? 0);
          const dist = distMeters / 1609.34;
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

        {comingSoon ? (
          <View style={s.center}>
            <Text style={s.errorText}>🧩 Hidden Gems coming soon</Text>
            <Text style={s.errorSub}>We're curating something special. Check back soon!</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={s.retryBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
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