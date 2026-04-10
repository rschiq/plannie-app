// app/plan/results.js
// Results list + in-app detail sheet + bottom nav + save
import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Linking, Modal, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { getNearbyPlaces } from '../../services/nearbyPlacesService';

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';
const SCREEN_W = Dimensions.get('window').width;

// ── Category config ────────────────────────────────────────────
const CATEGORY_LABELS = {
  food: 'Restaurants', drinks: 'Bars & Nightlife',
  coffee: 'Coffee Shops', activity: 'Activities',
};

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
function PlaceCard({ place, onPress }) {
  return (
    <TouchableOpacity style={card.wrap} onPress={onPress} activeOpacity={0.88}>
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
  wrap:  { backgroundColor: colors.cream2, borderRadius: radius.md, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.gray4, ...shadow.sm },
  photo: { width: '100%', height: 160 },
  photoPlaceholder: { width: '100%', height: 80, backgroundColor: colors.gray4, alignItems: 'center', justifyContent: 'center' },
  photoIcon: { fontSize: 28 },
  body:  { padding: 14 },
  name:  { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal, marginBottom: 5 },
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
  const [expanded,   setExpanded]   = useState(false);  // tracks if user expanded search
  const [expandLoading, setExpandLoading] = useState(false); // track saved place IDs

  const category = plan.category || 'food';
  const label    = CATEGORY_LABELS[category] || 'Places';

  useEffect(() => { fetchPlaces(); }, []);

  // ── Fetch using nearbyPlacesService ─────────────────────────
  async function fetchPlaces() {
    setLoading(true);
    setError(null);
    try {
      // ✅ Use stored coords — set by location picker in details.js
      // Fall back to geocoding city string if coords missing
      let lat, lng;
      if (plan.coords?.lat && plan.coords?.lng) {
        lat = plan.coords.lat;
        lng = plan.coords.lng;
      } else {
        const city = plan.city || 'Los Angeles, CA';
        const res  = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();
        if (data.status !== 'OK') throw new Error('Could not find location: ' + city);
        lat = data.results[0].geometry.location.lat;
        lng = data.results[0].geometry.location.lng;
      }

      // Extract clean area name from city string (e.g. "Studio City, CA" → "Studio City")
      const areaName = (plan.city || '').split(',')[0].trim();

      // Call the service — handles nearby search, scoring, variety, area-first
      const results = await getNearbyPlaces({
        lat,
        lng,
        category: plan.category || 'food',
        moment:   plan.moment   || 'casual_hangout',
        areaName,
      });

      setPlaces(results);
    } catch (e) {
      console.log('[Results] fetch error:', e.message);
      setError(e.message);
    }
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
      let lat, lng;
      if (plan.coords?.lat && plan.coords?.lng) {
        lat = plan.coords.lat;
        lng = plan.coords.lng;
      } else {
        const city = plan.city || 'Los Angeles, CA';
        const res  = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();
        lat = data.results[0].geometry.location.lat;
        lng = data.results[0].geometry.location.lng;
      }

      // Wider radius, no strict area filter
      const results = await getNearbyPlaces({
        lat,
        lng,
        category: plan.category || 'food',
        moment:   plan.moment   || 'casual_hangout',
        areaName: '', // empty = no area filter, show everything nearby
        expandedRadius: true,
      });

      setPlaces(results);
      setExpanded(true);
    } catch (e) {
      console.log('[Results] expand error:', e.message);
    }
    setExpandLoading(false);
  }

  function handleSave(place) {
    if (!place || savedIds.has(place.id)) return;
    saveSinglePlace(place, {
      group:    plan.group,
      moment:   plan.moment,
      category: plan.category,
      city:     plan.city,
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
          <Text style={s.sub}>Near {plan.city || 'your location'} · sorted by rating</Text>
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.rose} />
            <Text style={s.loadingText}>Finding the best spots…</Text>
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

            {/* ── Low results banner ── */}
            {!expanded && places.length < 5 && places.length > 0 && (
              <View style={s.expandBanner}>
                <Text style={s.expandBannerText}>
                  Not many options in this area. Want to explore nearby places?
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

            {/* Expanded label */}
            {expanded && (
              <View style={s.expandedLabel}>
                <Text style={s.expandedLabelText}>📍 Showing nearby areas</Text>
              </View>
            )}
            {places.map(p => (
              <PlaceCard key={p.id} place={p} onPress={() => openDetail(p)} />
            ))}
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
  content:     { paddingHorizontal: 20, paddingTop: 14 },
  count:       { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, marginBottom: 12, letterSpacing: 0.3 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { fontFamily: fonts.body, fontSize: 14, color: colors.gray2, marginTop: 14 },
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
});