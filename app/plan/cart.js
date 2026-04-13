import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert, Linking, Share, ActivityIndicator, Switch, TextInput, KeyboardAvoidingView, Platform, Image, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ACTIVITIES, RESTAURANTS, ADDONS } from '../../data';
import { getPlacesByCategory, getPlacesNearby, getCurationLabel } from '../../services/placesService';

// ─── Item Action Sheet ───────────────────────────────────────
function ItemActionSheet({ visible, item, onClose, onSwap, onRemove }) {
  if (!item) return null;

  function openInMaps() {
    if (item.location?.lat && item.location?.lng) {
      const url = 'https://www.google.com/maps/search/?api=1&query=' +
        item.location.lat + ',' + item.location.lng +
        '&query_place_id=' + (item.id || '');
      Linking.openURL(url);
    } else {
      const query = encodeURIComponent(item.name + ' ' + (item.address || ''));
      Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + query);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <Text style={styles.detailName}>{item.name}</Text>
          <Text style={styles.detailCategory}>{item.sub || item.type || ''}</Text>

          {item.rating && (
            <View style={styles.detailRatingRow}>
              <Text style={styles.detailRating}>⭐ {item.rating}</Text>
              {item.totalRatings > 0 && (
                <Text style={styles.detailReviews}>({item.totalRatings.toLocaleString()} reviews)</Text>
              )}
            </View>
          )}

          {item.address && (
            <View style={styles.detailAddressRow}>
              <Text style={styles.detailAddressIcon}>📍</Text>
              <Text style={styles.detailAddress}>{item.address}</Text>
            </View>
          )}

          {/* ✅ detailRow now defined in StyleSheet below */}
          {item.distance != null && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🚗</Text>
              <Text style={styles.detailAddress}>{item.distance} mi away</Text>
            </View>
          )}

          <View style={styles.detailDivider} />

          <TouchableOpacity style={styles.btnPrimary} onPress={openInMaps} activeOpacity={0.88}>
            <Text style={styles.btnPrimaryText}>🗺️ Open in Maps</Text>
          </TouchableOpacity>

          <View style={styles.rowActions}>
            <TouchableOpacity style={styles.btnSecondary} onPress={onSwap} activeOpacity={0.8}>
              <Text style={styles.btnSecondaryText}>🔄 Swap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSecondary, { borderWidth: 1, borderColor: 'rgba(212,149,111,0.3)' }]}
              onPress={onRemove} activeOpacity={0.8}
            >
              <Text style={[styles.btnSecondaryText, { color: colors.rose }]}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Helpers ─────────────────────────────────────────────────
const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';
const SCREEN_W = Dimensions.get('window').width;

// Readable type labels from raw Google types
const TYPE_MAP = {
  escape_room:        'Escape Room',
  amusement_park:     'Amusement Park',
  bowling_alley:      'Bowling Alley',
  movie_theater:      'Cinema',
  night_club:         'Night Club',
  bar:                'Bar & Lounge',
  restaurant:         'Restaurant',
  cafe:               'Café',
  park:               'Park',
  museum:             'Museum',
  art_gallery:        'Art Gallery',
  gym:                'Gym',
  spa:                'Spa',
  shopping_mall:      'Shopping Mall',
  tourist_attraction: 'Attraction',
  point_of_interest:  'Local Spot',
  bakery:             'Bakery',
  florist:            'Flower Shop',
  lodging:            'Hotel',
  stadium:            'Stadium',
  aquarium:           'Aquarium',
  zoo:                'Zoo',
  casino:             'Casino',
};

function getReadableType(types = []) {
  for (const t of types) {
    if (TYPE_MAP[t]) return TYPE_MAP[t];
  }
  return 'Place';
}

// Extract a clean neighborhood or city name from a vicinity/address string.
// Priority: sublocality → neighborhood → city → fallback last 2 segments
// Examples:
//   "10250 Santa Monica Blvd, Century City, Los Angeles" → "Century City"
//   "5517 Santa Monica Blvd, Hollywood, Los Angeles"     → "Hollywood"
//   "3341 S La Cienega Blvd, Los Angeles, CA 90016"      → "Los Angeles"
//   "123 Main St, Seattle, WA, USA"                      → "Seattle"
function shortenVicinity(vicinity = '') {
  if (!vicinity) return '';

  const parts = vicinity.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];

  // Skip the first part if it looks like a street address
  // (starts with a number, or contains common street words)
  const streetPattern = /^\d+\s|^([\d]+\s)|(blvd|ave|st|rd|dr|ln|way|pkwy|fwy|hwy)/i;

  const meaningful = parts.filter((p, i) => {
    // Skip state abbreviations (e.g. "CA", "WA", "NY")
    if (/^[A-Z]{2}$/.test(p)) return false;
    // Skip US ZIP codes
    if (/^\d{5}(-\d{4})?$/.test(p)) return false;
    // Skip country names
    if (/^(USA|United States|US)$/i.test(p)) return false;
    // Skip first part if it's a street address
    if (i === 0 && streetPattern.test(p)) return false;
    return true;
  });

  // Return first meaningful part (neighborhood/city)
  if (meaningful.length > 0) return meaningful[0];

  // Fallback: last 2 non-junk segments joined
  return parts.slice(-2).join(', ');
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
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

// ─── Place Detail Sheet ───────────────────────────────────────
// Shows full details of a swap candidate before confirming
function PlaceDetailSheet({ visible, place, swapKey, onConfirm, onClose, onSwap, onRemove }) {
  const sheetInsets = useSafeAreaInsets();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !place?.id) return;
    setDetails(null);
    fetchDetails(place.id);
  }, [visible, place?.id]);

  async function fetchDetails(placeId) {
    setLoading(true);
    try {
      const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,photos';
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.result) setDetails(data.result);
    } catch (e) {
      console.log('[PlaceDetail] fetch error:', e.message);
    }
    setLoading(false);
  }

  function buildPhotoUrl(ref) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
  }

  function openWebsite() {
    if (details?.website) Linking.openURL(details.website).catch(() => {});
  }

  function callPlace() {
    if (details?.formatted_phone_number) {
      const tel = 'tel:' + details.formatted_phone_number.replace(/\s/g, '');
      Linking.openURL(tel).catch(() => {});
    }
  }

  function openInMaps() {
    if (place?.location?.lat) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`);
    } else {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place?.name || '')}`);
    }
  }

  if (!place) return null;

  const photos = details?.photos || [];
  const hasPhone   = !!details?.formatted_phone_number;
  const hasWebsite = !!details?.website;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { maxHeight: '90%', padding: 0, overflow: 'hidden', paddingBottom: Math.max(sheetInsets?.bottom ?? 0, 0) }]}>

          {/* ── Photos ── */}
          {photos.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={detail.photoScroll}
              pagingEnabled
            >
              {photos.slice(0, 5).map((ph, i) => (
                <Image
                  key={i}
                  source={{ uri: buildPhotoUrl(ph.photo_reference) }}
                  style={detail.photo}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          {/* No photo placeholder */}
          {photos.length === 0 && !loading && (
            <View style={detail.photoPlaceholder}>
              <Text style={detail.photoPlaceholderIcon}>📍</Text>
            </View>
          )}

          <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
            {/* Handle */}
            <View style={[styles.sheetHandle, { alignSelf: 'center', marginBottom: 16 }]} />

            {loading ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.rose} />
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginTop: 10 }}>
                  Loading details…
                </Text>
              </View>
            ) : (
              <>
                {/* Name + type */}
                <Text style={detail.name}>{place.name}</Text>
                <Text style={detail.type}>{place.category}</Text>

                {/* Rating row */}
                <View style={detail.ratingRow}>
                  <Text style={detail.rating}>⭐ {place.rating}</Text>
                  {place.totalRatings > 0 && (
                    <Text style={detail.reviewCount}>
                      ({place.totalRatings.toLocaleString()} reviews)
                    </Text>
                  )}
                  {place.dist && (
                    <Text style={detail.dist}>🚗 {place.dist} mi</Text>
                  )}
                </View>

                {/* Address */}
                {(details?.formatted_address || place.vicinity) && (
                  <View style={detail.row}>
                    <Text style={detail.rowIcon}>📍</Text>
                    <Text style={detail.rowText}>
                      {details?.formatted_address || place.vicinity}
                    </Text>
                  </View>
                )}

                {/* Phone */}
                {hasPhone && (
                  <TouchableOpacity style={detail.row} onPress={callPlace} activeOpacity={0.8}>
                    <Text style={detail.rowIcon}>📞</Text>
                    <Text style={[detail.rowText, detail.rowLink]}>
                      {details.formatted_phone_number}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Website */}
                {hasWebsite && (
                  <TouchableOpacity style={detail.row} onPress={openWebsite} activeOpacity={0.8}>
                    <Text style={detail.rowIcon}>🌐</Text>
                    <Text style={[detail.rowText, detail.rowLink]} numberOfLines={1}>
                      {details.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={detail.divider} />

                {/* Action buttons — context aware */}
                {onSwap ? (
                  // ── Opened from card tap — show Open in Maps + Swap + Remove ──
                  <>
                    <TouchableOpacity style={detail.primaryBtn} onPress={openInMaps} activeOpacity={0.88}>
                      <Text style={detail.primaryBtnText}>🗺️ Open in Maps</Text>
                    </TouchableOpacity>
                    <View style={detail.secondaryRow}>
                      <TouchableOpacity style={detail.secondaryBtn} onPress={onSwap} activeOpacity={0.8}>
                        <Text style={detail.secondaryBtnText}>🔄 Swap</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={detail.secondaryBtn} onPress={onRemove} activeOpacity={0.8}>
                        <Text style={[detail.secondaryBtnText, { color: '#E57373' }]}>🗑️ Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  // ── Opened from swap list — show Select + Open in Maps + Cancel ──
                  <>
                    <TouchableOpacity style={detail.primaryBtn} onPress={onConfirm} activeOpacity={0.88}>
                      <Text style={detail.primaryBtnText}>
                        ✓ Select this {swapKey === 'food' ? 'restaurant' : 'activity'}
                      </Text>
                    </TouchableOpacity>
                    <View style={detail.secondaryRow}>
                      <TouchableOpacity style={detail.secondaryBtn} onPress={openInMaps} activeOpacity={0.8}>
                        <Text style={detail.secondaryBtnText}>🗺️ Open in Maps</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={detail.secondaryBtn} onPress={onClose} activeOpacity={0.8}>
                        <Text style={detail.secondaryBtnText}>✕ Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Swap Sheet ───────────────────────────────────────────────
// Single Modal with two views: list → detail (no nested Modals)
function SwapSheet({ visible, swapKey, plan, onClose, onSwap }) {
  const insets = useSafeAreaInsets();
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [preview, setPreview]   = useState(null);   // place being previewed
  const [details, setDetails]   = useState(null);   // fetched place details
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!visible || !swapKey) return;
    setItems([]);
    setPreview(null);
    setDetails(null);
    fetchSwapItems();
  }, [visible, swapKey]);

  // Fetch details whenever a place is previewed
  useEffect(() => {
    if (!preview?.id) { setDetails(null); return; }
    fetchPlaceDetails(preview.id);
  }, [preview?.id]);

  async function fetchSwapItems() {
    setLoading(true);
    try {
      // ✅ Use stored coords first — more accurate than geocoding city string
      let lat, lng;

if (plan.coords?.lat && plan.coords?.lng) {
  lat = plan.coords.lat;
  lng = plan.coords.lng;

} else if (plan.city) {

  const geoUrl = 'https://maps.googleapis.com/maps/api/geocode/json?' +
    'address=' + encodeURIComponent(plan.city) +
    '&key=' + GOOGLE_API_KEY;

  const geoRes = await fetch(geoUrl);
  const geoData = await geoRes.json();

  if (geoData.status !== 'OK') {
    throw new Error('Geocode failed: ' + geoData.status);
  }

  lat = geoData.results[0].geometry.location.lat;
  lng = geoData.results[0].geometry.location.lng;

} else {
  throw new Error('No location provided');
}

      // ── ADDON SWAP ────────────────────────────────────────────
      if (swapKey === 'addon') {
        const types = ['flowers', 'dessert'].filter((t) => t !== plan.addonType);
        const addonSearches = {
          flowers: [
            { type: 'florist', keyword: 'florist flower shop' },
          ],
          dessert: [
            { type: 'bakery',     keyword: 'dessert bakery cakes' },
            { type: 'cafe',       keyword: 'dessert cafe' },
            { type: 'ice_cream',  keyword: 'ice cream gelato' },
          ],
        };
        const nonFoodKeywords = [
          'recreation area', 'state park', 'national park', 'reservoir',
          'lake', 'river', 'trail', 'campground', 'park', 'school',
          'hospital', 'clinic', 'auto', 'tire', 'supply', 'storage',
        ];

        const results = await Promise.all(types.map(async (t) => {
          const searches = addonSearches[t];
          const seen = new Set();
          const allResults = [];

          for (const r of [10000, 20000, 40000]) {
            for (const { type: placeType, keyword } of searches) {
              const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?' +
                'location=' + lat + ',' + lng + '&radius=' + r +
                '&type=' + placeType + '&keyword=' + encodeURIComponent(keyword) +
                '&key=' + GOOGLE_API_KEY;
              const res  = await fetch(url);
              const data = await res.json();
              for (const p of data.results || []) {
                if (!seen.has(p.place_id)) {
                  seen.add(p.place_id);
                  allResults.push(p);
                }
              }
            }
            if (allResults.length > 0) break; // found results — stop expanding
          }

          // Filter out non-food/non-relevant places
          const valid = allResults.filter(p => {
            const name = (p.name || '').toLowerCase();
            if (nonFoodKeywords.some(kw => name.includes(kw))) return false;
            if (t === 'dessert') {
              const foodTypes = ['bakery', 'cafe', 'restaurant', 'food', 'ice_cream_shop', 'meal_takeaway'];
              if (!(p.types || []).some(ft => foodTypes.includes(ft))) return false;
            }
            return true;
          });

          const best = valid.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
          if (!best) return null;

          const placeLocation = best.geometry?.location
            ? { lat: best.geometry.location.lat, lng: best.geometry.location.lng } : null;
          return {
            id: best.place_id, name: best.name,
            category: t === 'flowers' ? 'Flower Shop' : 'Dessert Stop',
            rating: best.rating ? parseFloat(best.rating).toFixed(1) : null,
            totalRatings: best.user_ratings_total || 0,
            vicinity: best.vicinity || '', location: placeLocation,
            dist: calcDistMiles({ lat, lng }, placeLocation),
            photoUrl: best.photos?.[0]?.photo_reference
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=120&photoreference=${best.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
              : null,
            _addonType: t,
          };
        }));
        setItems(results.filter(Boolean));
        setLoading(false);
        return;
      }

      // ── ACTIVITY / FOOD SWAP — progressive radius expansion ──
      const currentItem  = swapKey === 'food' ? plan.food : plan.activity;
      const swapCategory = swapKey === 'food' ? 'food' : 'activity';
      const selectedArea = (plan.city || '').split(',')[0].trim();

      // Helper — exclude current item and already-planned items
      function excludeCurrent(list) {
        return list.filter((p) => {
          if (currentItem?.id   && p.id   === currentItem.id)   return false;
          if (currentItem?.name && p.name === currentItem.name) return false;
          if (swapKey !== 'food' && (p.id === plan.food?.id))   return false;
          if (swapKey !== 'activity' && (p.id === plan.activity?.id)) return false;
          return true;
        });
      }

      // Helper — quality filter with fallback
      function qualityFilter(list) {
        const strict = list.filter(p => (p.rating || 0) >= 4.2 && (p.totalRatings || 0) >= 20);
        const lenient = list.filter(p => (p.rating || 0) >= 3.8);
        return strict.length >= 3 ? strict : lenient.length > 0 ? lenient : list;
      }

      // Map to swap item shape
      function mapToSwapItem(p) {
        return {
          id:           p.id,
          name:         p.name,
          category:     getReadableType(p.types || []),
          rating:       p.rating ? parseFloat(p.rating).toFixed(1) : null,
          totalRatings: p.totalRatings || 0,
          isOpenNow:    p.isOpenNow ?? null,
          vicinity:     shortenVicinity(p.address),
          fullVicinity: p.address || '',
          location:     p.location || null,
          dist:         calcDistMiles({ lat, lng }, p.location),
          photoUrl:     p.photoUrl || null,
        };
      }

      let finalList = [];

      const categoryOpts = { maxResults: 15, selectedArea, budget: plan.budget };

      // ── PASS 1: tight radius around selected area (5km) ──
      const pass1 = await getPlacesByCategory(swapCategory, { lat, lng }, {
        ...categoryOpts, radius: 5000,
      });
      finalList = qualityFilter(excludeCurrent(pass1));

      // ── PASS 2: medium radius (12km) if not enough ──
      if (finalList.length < 4) {
        const pass2 = await getPlacesByCategory(swapCategory, { lat, lng }, {
          ...categoryOpts, radius: 12000,
        });
        finalList = qualityFilter(excludeCurrent(pass2));
      }

      // ── PASS 3: wide radius (25km) — nearby cities ──
      if (finalList.length < 3) {
        const pass3 = await getPlacesByCategory(swapCategory, { lat, lng }, {
          ...categoryOpts, radius: 25000, selectedArea: '',
        });
        finalList = qualityFilter(excludeCurrent(pass3));
      }

      // ── PASS 4: very wide (50km) — last resort ──
      if (finalList.length < 2) {
        const pass4 = await getPlacesByCategory(swapCategory, { lat, lng }, {
          ...categoryOpts, radius: 50000, selectedArea: '',
        });
        finalList = excludeCurrent(pass4);
      }

      setItems(finalList.slice(0, 10).map(mapToSwapItem));

    } catch (e) {
      console.log('[SwapSheet] error:', e.message);
      setItems([]);
    }
    setLoading(false);
  }

  async function fetchPlaceDetails(placeId) {
    setDetailLoading(true);
    try {
      const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,photos';
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.result) setDetails(data.result);
    } catch (e) { console.log('[PlaceDetail] fetch error:', e.message); }
    setDetailLoading(false);
  }

  function buildPhotoUrl(ref) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
  }

  function handleConfirmSwap() {
    if (!preview) return;
    onSwap(swapKey, {
      ...preview,
      type: preview.category, cuisine: preview.category,
      note: preview.isOpenNow ? 'Open now' : 'Nearby',
      tag:  (preview.rating >= 4.5) ? 'Highly rated' : 'Nearby',
    });
    setPreview(null);
    onClose();
  }

  function openInMaps() {
    if (preview?.location?.lat) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${preview.location.lat},${preview.location.lng}`);
    } else {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(preview?.name || '')}`);
    }
  }

  if (!swapKey) return null;
  const title = swapKey === 'activity' ? 'Swap Activity'
              : swapKey === 'food'     ? 'Swap Restaurant'
              :                          'Swap Add-On';

  const photos     = details?.photos || [];
  const hasPhone   = !!details?.formatted_phone_number;
  const hasWebsite = !!details?.website;

  return (
    // ✅ Single Modal — Pressable backdrop + plain View sheet
    // This cleanly separates backdrop tap (close) from sheet content (card taps)
    // No nested TouchableOpacity = no gesture conflicts
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => {
      if (preview) { setPreview(null); setDetails(null); }
      else onClose();
    }}>
      {/* Backdrop — catches taps outside the sheet */}
      <Pressable
        style={sw.backdrop}
        onPress={() => {
          if (preview) { setPreview(null); setDetails(null); }
          else onClose();
        }}
      />

      {/* Sheet — plain View, no TouchableOpacity, so inner taps work */}
      <View style={sw.sheet}>

          {/* ── VIEW 1: List ── */}
          {!preview && (
            <View style={sw.listContainer}>
              <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetName}>{title}</Text>
                <Text style={styles.sheetSub}>Tap a place to preview before swapping</Text>
              </View>

              {loading ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.rose} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginTop: 10 }}>
                    Finding alternatives…
                  </Text>
                </View>
              ) : items.length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, marginBottom: 12 }}>😅</Text>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.charcoal }}>
                    No alternatives found nearby
                  </Text>
                </View>
              ) : (
                // ✅ flex: 1 so ScrollView can grow, paddingBottom clears cancel button
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                  showsVerticalScrollIndicator={false}
                >
                  {items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={swap.card}
                      onPress={() => setPreview(item)}
                      activeOpacity={0.85}
                    >
                      {item.photoUrl ? (
                        <Image source={{ uri: item.photoUrl }} style={swap.thumb} resizeMode="cover" />
                      ) : (
                        <View style={swap.thumbPlaceholder}>
                          <Text style={swap.thumbIcon}>📍</Text>
                        </View>
                      )}
                      <View style={swap.info}>
                        <Text style={swap.name} numberOfLines={1}>{item.name}</Text>
                        <Text style={swap.category}>{item.category}</Text>
                        {item.rating && (
                          <View style={swap.metaRow}>
                            <Text style={swap.rating}>⭐ {item.rating}</Text>
                            {item.totalRatings > 0 && (
                              <Text style={swap.reviews}>({item.totalRatings.toLocaleString()})</Text>
                            )}
                          </View>
                        )}
                        <View style={swap.locationRow}>
                          {item.vicinity ? <Text style={swap.location} numberOfLines={1}>📍 {item.vicinity}</Text> : null}
                          {item.dist ? <Text style={swap.dist}>🚗 {item.dist} mi</Text> : null}
                        </View>
                      </View>
                      <Text style={swap.arrow}>›</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Cancel pinned at bottom, outside ScrollView */}
              <TouchableOpacity style={[styles.cancelBtn, { margin: 24, marginTop: 0, marginBottom: Math.max(insets.bottom + 8, 24) }]} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── VIEW 2: Detail ── */}
          {preview && (
            <>
              {/* Photos */}
              {photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={detail.photoScroll} pagingEnabled>
                  {photos.slice(0, 5).map((ph, i) => (
                    <Image key={i} source={{ uri: buildPhotoUrl(ph.photo_reference) }} style={detail.photo} resizeMode="cover" />
                  ))}
                </ScrollView>
              )}
              {photos.length === 0 && !detailLoading && (
                <View style={detail.photoPlaceholder}>
                  <Text style={detail.photoPlaceholderIcon}>📍</Text>
                </View>
              )}

              <ScrollView style={{ paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
                {/* Back button + handle */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
                  <TouchableOpacity
                    onPress={() => { setPreview(null); setDetails(null); }}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Text style={{ fontSize: 18, color: colors.rose }}>←</Text>
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.rose }}>
                      Back to list
                    </Text>
                  </TouchableOpacity>
                </View>

                {detailLoading ? (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={colors.rose} />
                    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginTop: 10 }}>
                      Loading details…
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={detail.name}>{preview.name}</Text>
                    <Text style={detail.type}>{preview.category}</Text>

                    <View style={detail.ratingRow}>
                      <Text style={detail.rating}>⭐ {preview.rating}</Text>
                      {preview.totalRatings > 0 && (
                        <Text style={detail.reviewCount}>({preview.totalRatings.toLocaleString()} reviews)</Text>
                      )}
                      {preview.dist && <Text style={detail.dist}>🚗 {preview.dist} mi</Text>}
                    </View>

                    {(details?.formatted_address || preview.fullVicinity) && (
                      <View style={detail.row}>
                        <Text style={detail.rowIcon}>📍</Text>
                        <Text style={detail.rowText}>{details?.formatted_address || preview.fullVicinity}</Text>
                      </View>
                    )}

                    {hasPhone && (
                      <TouchableOpacity style={detail.row} onPress={() => Linking.openURL('tel:' + details.formatted_phone_number.replace(/\s/g, ''))} activeOpacity={0.8}>
                        <Text style={detail.rowIcon}>📞</Text>
                        <Text style={[detail.rowText, detail.rowLink]}>{details.formatted_phone_number}</Text>
                      </TouchableOpacity>
                    )}

                    {hasWebsite && (
                      <TouchableOpacity style={detail.row} onPress={() => Linking.openURL(details.website)} activeOpacity={0.8}>
                        <Text style={detail.rowIcon}>🌐</Text>
                        <Text style={[detail.rowText, detail.rowLink]} numberOfLines={1}>
                          {details.website.replace(/^https?:\/\/(www\.)?/, '')}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <View style={detail.divider} />

                    <TouchableOpacity style={detail.primaryBtn} onPress={handleConfirmSwap} activeOpacity={0.88}>
                      <Text style={detail.primaryBtnText}>
                        ✓ Select this {swapKey === 'food' ? 'restaurant' : 'activity'}
                      </Text>
                    </TouchableOpacity>

                    <View style={detail.secondaryRow}>
                      <TouchableOpacity style={detail.secondaryBtn} onPress={openInMaps} activeOpacity={0.8}>
                        <Text style={detail.secondaryBtnText}>🗺️ Open in Maps</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={detail.secondaryBtn} onPress={onClose} activeOpacity={0.8}>
                        <Text style={detail.secondaryBtnText}>✕ Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
                <View style={{ height: 32 }} />
              </ScrollView>
            </>
          )}

        </View>
    </Modal>
  );
}

// ─── Summary Card ─────────────────────────────────────────────
// Rich plan item card: photo thumb, rating, distance, tags, why, View Details
function TimelineItem({ emoji, time, label, name, sub, isLast, onTap, onViewDetails, onRemove, onSwap,
  rating, distance, isOpenNow, shortLocation, curationLabel, photoUrl }) {

  // Build category tags from label + sub
  const tags = [sub, isOpenNow === true ? 'Open now' : null].filter(Boolean);

  return (
    <View style={styles.tiRow}>
      {/* ── Left column: dot + line ── */}
      <View style={styles.tiLeft}>
        <View style={styles.tiDot}><Text style={styles.tiEmoji}>{emoji}</Text></View>
        {!isLast && <View style={styles.tiLine} />}
      </View>

      {/* ── Card ── */}
      <View style={[styles.tiCard, !isLast && { marginBottom: 16 }]}>
        {/* Thumbnail + header row */}
        <TouchableOpacity onPress={onTap} activeOpacity={0.85}>
          <View style={styles.tiCardHeader}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.tiThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.tiThumb, styles.tiThumbEmpty]}>
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.tiTime}>{time} · {label}</Text>
              <Text style={styles.tiName} numberOfLines={2}>{name}</Text>
              {/* Location */}
              {shortLocation ? (
                <Text style={styles.tiLocation}>📍 {shortLocation}</Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>

        {/* Rating + distance */}
        {(rating || distance) ? (
          <View style={styles.tiMeta}>
            {rating ? <Text style={styles.tiRating}>⭐ {rating}</Text> : null}
            {rating && distance ? <Text style={styles.tiDot2}> · </Text> : null}
            {distance ? <Text style={styles.tiDistance}>🚗 {distance} mi away</Text> : null}
          </View>
        ) : null}

        {/* Category tags */}
        {tags.length > 0 ? (
          <View style={styles.tiTags}>
            {tags.map((t, i) => (
              <View key={i} style={styles.tiTag}>
                <Text style={styles.tiTagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Why this place */}
        {curationLabel ? (
          <Text style={styles.tiWhy}>{curationLabel}</Text>
        ) : null}

        {/* Actions row — Swap + Remove only (tap card to view details) */}
        <View style={styles.tiActions}>
          <TouchableOpacity style={styles.tiActionBtnOutline} onPress={onSwap} activeOpacity={0.8}>
            <Text style={styles.tiActionBtnOutlineText}>🔄 Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tiActionBtnRemove} onPress={onRemove} activeOpacity={0.8}>
            <Text style={styles.tiActionBtnRemoveText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plan, updatePlan, savePlan, savedPlans, fmtHM, getBaseHour, getBaseMin } = usePlan();

  const [swapKey, setSwapKey]               = useState(null);
  const [activeItem, setActiveItem]         = useState(null);
  const [detailItem, setDetailItem]         = useState(null);  // for View Details modal
  const [isSaved, setIsSaved]               = useState(false);
  const [isSpecial, setIsSpecial]           = useState(false);
  const [specialTitle, setSpecialTitle]     = useState('');
  const [showSpecialInput, setShowSpecialInput] = useState(false);
  const [locationSyncing, setLocationSyncing] = useState(false);

  // ✅ Moved after state declarations to fix reference-before-declaration bug
  useEffect(() => {
    if (activeItem) console.log('Active item distance:', activeItem.distance);
  }, [activeItem]);

  const baseH = getBaseHour() || 17;
  const baseM = getBaseMin()  || 0;

  const timelineItems = [];
  if (plan.activity) timelineItems.push({
    key: 'activity', emoji: '🎯', label: 'Activity',
    time: fmtHM(baseH, baseM),
    name: plan.activity.name, sub: plan.activity.category,
    rating: plan.activity.rating, totalRatings: plan.activity.totalRatings,
    address: plan.activity.address, isOpenNow: plan.activity.isOpenNow,
    location: plan.activity.location, id: plan.activity.id,
    distance: plan.activity.distance,
    shortLocation: plan.activity.shortLocation || '',
    curationLabel: plan.activity.curationLabel || '',
    photoUrl: plan.activity.photoUrl || null,
  });
  if (plan.food) timelineItems.push({
    key: 'food', emoji: '🍽️', label: 'Dinner',
    time: fmtHM(baseH + 2, baseM),
    name: plan.food.name, sub: plan.food.category,
    rating: plan.food.rating, totalRatings: plan.food.totalRatings,
    address: plan.food.address, isOpenNow: plan.food.isOpenNow,
    location: plan.food.location, id: plan.food.id,
    distance: plan.food.distance,
    shortLocation: plan.food.shortLocation || '',
    curationLabel: plan.food.curationLabel || '',
    photoUrl: plan.food.photoUrl || null,
  });
  if (plan.addonItem) {
    const emoji = plan.addonType === 'flowers' ? '💐' : plan.addonType === 'dessert' ? '🍰' : '🌅';
    const label = plan.addonType === 'flowers' ? 'Flowers' : 'Dessert Stop';
    timelineItems.push({
      key: 'addon', emoji, label,
      time: fmtHM(baseH + 3, 30),
      name: plan.addonItem.name, sub: plan.addonItem.note,
      rating: plan.addonItem.rating, totalRatings: plan.addonItem.totalRatings,
      address: plan.addonItem.address || plan.addonItem.desc,
      isOpenNow: plan.addonItem.isOpenNow,
      location: plan.addonItem.location, id: plan.addonItem.id,
      distance: plan.addonItem.distance,
      shortLocation: plan.addonItem.shortLocation || '',
      curationLabel: plan.addonItem.curationLabel || '',
      photoUrl: plan.addonItem.photoUrl || null,
    });
  }

  // ── "Why this plan works" bullets ────────────────────────────
  const whyBullets = [];
  if (plan.vibe)     whyBullets.push(`✦ Curated for a ${plan.vibe.toLowerCase()} vibe from start to finish`);
  if (plan.activity && plan.food) whyBullets.push('✦ Activity and dinner are close together — no long drives');
  if (plan.activity) whyBullets.push(`✦ ${plan.activity.name} is highly rated and fits the mood`);
  if (plan.food)     whyBullets.push(`✦ ${plan.food.name} pairs perfectly as a follow-up`);
  if (plan.addonItem)whyBullets.push(`✦ ${plan.addonItem.name} rounds out the night beautifully`);
  if (plan.budget === '$$$') whyBullets.push('✦ Premium picks selected for a special night out');
  else if (plan.budget === '$') whyBullets.push('✦ Great value spots — quality without overspending');

  function removeItem(key) {
    if (key === 'activity') updatePlan({ activity: null });
    else if (key === 'food') updatePlan({ food: null });
    else updatePlan({ addonType: null, addonItem: null });
    setActiveItem(null);
    setDetailItem(null);
  }

  async function handleSwap(key, item) {
    // Apply the swap immediately so UI updates right away
    if (key === 'activity') updatePlan({ activity: item });
    else if (key === 'food') updatePlan({ food: item });
    else updatePlan({ addonType: item._addonType, addonItem: item });
    setSwapKey(null);

    // ✅ Location sync — re-fetch the complementary item near the new location
    // If activity swapped → find food near new activity
    // If food swapped → find activity near new food
    const newLocation = item?.location;
    if (!newLocation?.lat || !newLocation?.lng) return;

    if (key === 'activity' && plan.food) {
      // Activity moved — silently refresh food near new activity location
      setLocationSyncing(true);
      try {
        const nearbyFood = await getPlacesNearby(
          ['restaurant'],
          newLocation,
          { radius: 3000, maxResults: 8, category: 'food', budget: plan.budget }
        );
        if (nearbyFood.length > 0) {
          // Pick the best option that isn't the current food item
          const best = nearbyFood.find(p =>
            p.id !== plan.food?.id && p.name !== plan.food?.name
          ) || nearbyFood[0];
          if (best && best.id !== plan.food?.id) {
            const dist = best.distanceMiles ?? 0;
            updatePlan({
              food: {
                id:            best.id,
                place_id:      best.id,
                name:          best.name,
                category:      getReadableType(best.types || []),
                type:          getReadableType(best.types || []),
                shortLocation: best.shortLocation || shortenVicinity(best.address) || '',
                desc:          best.shortLocation || shortenVicinity(best.address) || '',
                address:       best.address || '',
                rating:        best.rating != null ? Number(best.rating) : null,
                totalRatings:  best.totalRatings || 0,
                isOpenNow:     best.isOpenNow ?? null,
                distance:      dist,
                location:      best.location || null,
                photoUrl:      best.photoUrl ?? null,
                tag:           (best.rating ?? 0) >= 4.8 ? 'Top rated' : 'Nearby',
                featured:      (best.rating ?? 0) >= 4.5,
                curationLabel: getCurationLabel({ ...best, distance: dist }, 'food'),
              }
            });
          }
        }
      } catch (e) {
        console.log('[LocationSync] food re-fetch failed:', e.message);
      }
      setLocationSyncing(false);

    } else if (key === 'food' && plan.activity) {
      // Food moved — silently refresh activity near new food location
      setLocationSyncing(true);
      try {
        const nearbyActivity = await getPlacesByCategory('activity', newLocation, {
          radius: 3000, maxResults: 8, budget: plan.budget,
        });
        if (nearbyActivity.length > 0) {
          const best = nearbyActivity.find(p =>
            p.id !== plan.activity?.id && p.name !== plan.activity?.name
          ) || nearbyActivity[0];
          if (best && best.id !== plan.activity?.id) {
            const dist = best.distanceMiles ?? 0;
            updatePlan({
              activity: {
                id:            best.id,
                place_id:      best.id,
                name:          best.name,
                category:      getReadableType(best.types || []),
                type:          getReadableType(best.types || []),
                shortLocation: best.shortLocation || shortenVicinity(best.address) || '',
                desc:          best.shortLocation || shortenVicinity(best.address) || '',
                address:       best.address || '',
                rating:        best.rating != null ? Number(best.rating) : null,
                totalRatings:  best.totalRatings || 0,
                isOpenNow:     best.isOpenNow ?? null,
                distance:      dist,
                location:      best.location || null,
                photoUrl:      best.photoUrl ?? null,
                tag:           (best.rating ?? 0) >= 4.8 ? 'Top rated' : 'Nearby',
                featured:      (best.rating ?? 0) >= 4.5,
                curationLabel: getCurationLabel({ ...best, distance: dist }, 'activity'),
              }
            });
          }
        }
      } catch (e) {
        console.log('[LocationSync] activity re-fetch failed:', e.message);
      }
      setLocationSyncing(false);
    }
  }

  async function handleSave() {
    if (isSaved) return;
    savePlan();
    setIsSaved(true);
    if (isSpecial && specialTitle.trim()) {
      try {
        const raw      = await AsyncStorage.getItem('@plannie_special_dates');
        const existing = raw ? JSON.parse(raw) : [];
        const newEntry = {
          id: 'sd_' + Date.now(),
          title: specialTitle.trim(),
          date: plan.date || new Date().toISOString().split('T')[0],
          planTitle: plan.vibe ? plan.vibe + ' Date Night' : 'Date Night',
          city: plan.city || '', vibe: plan.vibe || '',
        };
        await AsyncStorage.setItem('@plannie_special_dates', JSON.stringify([newEntry, ...existing]));
      } catch (e) { console.log('Special date save error:', e.message); }
    }
  }

  function handleShare() {
    const latest = savedPlans[0];
    const lines  = [];
    if (latest) {
      lines.push(`${latest.title} 🎉`);
      lines.push('');
      const times = ['7:00 PM', '8:30 PM', '10:00 PM'];
      latest.items.forEach((item, idx) => {
        const parts = item.split(' ');
        const emoji = parts[0];
        const name  = parts.slice(1).join(' ');
        const time  = times[idx] || '';
        let line = '';
        if (idx === 0)           line = `${time} — 🎯 Start with a great time at ${name}`;
        else if (emoji === '🍽️') line = `${time} — 🍽️ Enjoy dinner at ${name}`;
        else if (emoji === '🍰') line = `${time} — 🍰 End the night with dessert at ${name}`;
        else if (emoji === '💐') line = `${time} — 🌸 End the night with flowers from ${name}`;
        else if (emoji === '🌅') line = `${time} — 🌅 End with a scenic stop at ${name}`;
        else                     line = `${time} — ✨ Round off the night at ${name}`;
        lines.push(line);
      });
      lines.push('');
      lines.push(`📍 ${latest.city}`);
      lines.push('');
    }
    lines.push('Planned with Plannie 💕');
    Share.share({ message: lines.join('\n') });
  }

  function handleCalendar() {
    const title = encodeURIComponent(plan.vibe ? `${plan.vibe} Date Night` : 'Plannie Date Night');
    const loc = encodeURIComponent(plan.city || '');
    const url   = `https://calendar.google.com/calendar/r/eventedit?text=${title}&location=${loc}&details=${encodeURIComponent('Planned with Plannie 💕')}`;
    Linking.openURL(url).catch(() => Alert.alert('Could not open Calendar'));
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Hero ── */}
        {/* ✅ Midnight Velvet hero — deep purple with rose gold warmth, no warm brown */}
        <LinearGradient
          colors={['#1C1628', '#241A38', '#1A1428']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.heroLabel}>Your Date Plan</Text>
          {/* ✅ Explicit warm white — NOT colors.cream (now dark #0E0C15) */}
          <Text style={styles.heroTitle}>
            {plan.vibe ? `${plan.vibe} Date Night` : 'Your Date Plan'}
          </Text>
          <Text style={styles.heroMeta}>{plan.dateDisplay || 'Upcoming'} · {plan.city}</Text>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>✦  {plan.vibe || 'Custom'} Vibe</Text>
          </View>
        </LinearGradient>

        {/* ── Location sync indicator ── */}
        {locationSyncing && (
          <View style={styles.syncBanner}>
            <ActivityIndicator size="small" color={colors.gold} />
            <Text style={styles.syncText}>Updating nearby suggestions…</Text>
          </View>
        )}

        {/* ── Why this plan works ── */}
        {whyBullets.length > 0 && (
          <View style={styles.whySection}>
            <Text style={styles.whyTitle}>Why this plan works</Text>
            {whyBullets.slice(0, 4).map((b, i) => (
              <Text key={i} style={styles.whyBullet}>{b}</Text>
            ))}
          </View>
        )}

        {/* ── Timeline ── */}
        {timelineItems.length > 0 ? (
          <View style={styles.timeline}>
            {timelineItems.map((item, idx) => (
              <TimelineItem
                key={item.key}
                emoji={item.emoji}
                time={item.time}
                label={item.label}
                name={item.name}
                sub={item.sub}
                rating={item.rating}
                distance={item.distance}
                isOpenNow={item.isOpenNow}
                shortLocation={item.shortLocation}
                curationLabel={item.curationLabel}
                photoUrl={item.photoUrl}
                isLast={idx === timelineItems.length - 1}
                onTap={() => setDetailItem(item)}
                onViewDetails={() => setDetailItem(item)}
                onSwap={() => setSwapKey(item.key)}
                onRemove={() => removeItem(item.key)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Your plan is empty.</Text>
            <Text style={styles.emptySub}>Go back and add some items to your date!</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Bar ── */}
      <View style={[styles.bbar, { paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
        {isSaved ? (
          <View style={styles.savedState}>
            <Text style={styles.savedBannerText}>🎉 Plan saved!</Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleShare} activeOpacity={0.88}>
              <Text style={styles.btnPrimaryText}>🔗 Share Plan</Text>
            </TouchableOpacity>
            <View style={styles.rowActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={handleCalendar} activeOpacity={0.8}>
                <Text style={styles.btnSecondaryText}>📅 Add to Calendar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => router.replace('/(tabs)')} activeOpacity={0.8}>
                <Text style={styles.btnSecondaryText}>🏠 Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.unsavedState}>
            <View style={styles.specialRow}>
              <Text style={styles.specialLabel}>💍 Mark as special date</Text>
              <Switch
                value={isSpecial}
                onValueChange={(val) => { setIsSpecial(val); setShowSpecialInput(val); }}
                trackColor={{ false: colors.gray4, true: colors.rose }}
                thumbColor={'#F2EDE8'}
                ios_backgroundColor={colors.gray4}
              />
            </View>
            {showSpecialInput && (
              <TextInput
                style={styles.specialInput}
                placeholder='"First Date", "Anniversary"…'
                placeholderTextColor={colors.gray3}
                value={specialTitle}
                onChangeText={setSpecialTitle}
                returnKeyType="done"
              />
            )}
            <TouchableOpacity
              style={[styles.btnPrimary, timelineItems.length === 0 && { backgroundColor: colors.gray4 }]}
              onPress={timelineItems.length > 0 ? handleSave : null}
              activeOpacity={timelineItems.length > 0 ? 0.88 : 1}
            >
              <Text style={styles.btnPrimaryText}>
                {timelineItems.length === 0 ? 'Add items to save' : '✦ Save & Start This Date'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ItemActionSheet
        visible={!!activeItem}
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onSwap={() => { setSwapKey(activeItem?.key); setActiveItem(null); }}
        onRemove={() => removeItem(activeItem?.key)}
      />

      {/* ── View Details modal — full API details with photos ── */}
      <PlaceDetailSheet
        visible={!!detailItem}
        place={detailItem}
        swapKey={detailItem?.key}
        onConfirm={() => setDetailItem(null)}
        onSwap={() => { setSwapKey(detailItem?.key); setDetailItem(null); }}
        onRemove={() => { removeItem(detailItem?.key); setDetailItem(null); }}
        onClose={() => setDetailItem(null)}
      />

      <SwapSheet
        visible={!!swapKey}
        swapKey={swapKey}
        plan={plan}
        onClose={() => setSwapKey(null)}
        onSwap={handleSwap}
      />
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },

  // ── Hero ────────────────────────────────────────────────────
  hero:      { padding: 28, paddingTop: 40, paddingBottom: 24 },
  backBtn:   { paddingBottom: 12 },
  backText:  { fontFamily: fonts.bodyMedium, fontSize: 14, color: 'rgba(242,237,232,0.55)' },
  heroLabel: { fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.gold, marginBottom: 6 },

  // ✅ Explicit warm white — colors.cream is now dark background
  heroTitle: { fontFamily: fonts.displayLight, fontSize: 32, color: '#F2EDE8', lineHeight: 36, letterSpacing: -0.3 },
  heroMeta:  { fontFamily: fonts.body, fontSize: 13, color: 'rgba(242,237,232,0.50)', marginTop: 8 },
  heroPill:  { marginTop: 12, backgroundColor: 'rgba(201,169,110,0.15)', borderWidth: 1, borderColor: 'rgba(201,169,110,0.28)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5, alignSelf: 'flex-start' },
  heroPillText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.gold },

  // ── Timeline ────────────────────────────────────────────────
  timeline: { padding: 24, paddingBottom: 8 },
  tiRow:    { flexDirection: 'row', gap: 14, marginBottom: 4 },
  tiLeft:   { alignItems: 'center', width: 40 },
  tiDot:    { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cream2, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  tiEmoji:  { fontSize: 18 },
  tiLine:   { flex: 1, width: 2, backgroundColor: colors.cream2, marginTop: 4 },

  // Rich summary card
  tiCard:   { flex: 1, backgroundColor: colors.cream2, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.gray4, marginBottom: 4 },
  tiCardHeader: { flexDirection: 'row', gap: 12, padding: 14, paddingBottom: 10 },
  tiThumb:  { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.cream3, flexShrink: 0 },
  tiThumbEmpty: { alignItems: 'center', justifyContent: 'center' },

  tiTime:     { fontFamily: fonts.bodySemiBold, fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.gray2, marginBottom: 3 },
  tiName:     { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal, marginBottom: 2, lineHeight: 20 },
  tiLocation: { fontFamily: fonts.body, fontSize: 11, color: colors.rose, marginTop: 2 },

  tiMeta:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 8 },
  tiRating:   { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.gold },
  tiDot2:     { fontFamily: fonts.body, fontSize: 12, color: colors.gray3 },
  tiDistance: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  tiOpen:     { fontFamily: fonts.bodyMedium, fontSize: 11, color: '#5BBF85', marginTop: 3 },

  // Category tags
  tiTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', paddingHorizontal: 14, marginBottom: 8 },
  tiTag:  { backgroundColor: 'rgba(201,169,110,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(201,169,110,0.20)' },
  tiTagText: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: colors.gold, letterSpacing: 0.3 },

  // Why this place
  tiWhy: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, paddingHorizontal: 14, marginBottom: 12, lineHeight: 18, fontStyle: 'italic' },

  // Action buttons inside card
  tiActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.gray4, paddingTop: 12, alignItems: 'center' },
  tiActionBtn: { flex: 1, backgroundColor: colors.rose, borderRadius: 999, height: 40, alignItems: 'center', justifyContent: 'center' },
  tiActionBtnText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#F2EDE8' },
  tiActionBtnOutline: { flex: 1, backgroundColor: colors.cream3, borderRadius: 999, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.gray4 },
  tiActionBtnOutlineText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.charcoal },
  // ✅ Remove button — compact X, destructive but subtle
  tiActionBtnRemoveText: { fontSize: 16 },
  tiActionBtnRemove: { width: 38, height: 38, borderRadius: 999, backgroundColor: 'rgba(255,100,100,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,100,100,0.20)' },

  // ── Why this plan works ─────────────────────────────────────
  whySection: { marginHorizontal: 24, marginTop: 20, marginBottom: 4, backgroundColor: 'rgba(201,169,110,0.08)', borderRadius: radius.md, padding: 18, borderWidth: 1, borderColor: 'rgba(201,169,110,0.18)' },
  whyTitle:   { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.gold, marginBottom: 10, letterSpacing: 0.3 },
  whyBullet:  { fontFamily: fonts.body, fontSize: 13, color: colors.gray, lineHeight: 22, marginBottom: 2 },
  // ── Location sync banner ────────────────────────────────────
  syncBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24, marginTop: 12, backgroundColor: 'rgba(201,169,110,0.08)', borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(201,169,110,0.15)' },
  syncText:   { fontFamily: fonts.body, fontSize: 12, color: colors.gold },

  // ── Empty ───────────────────────────────────────────────────
  empty:      { padding: 44, alignItems: 'center' },
  emptyIcon:  { fontSize: 44, marginBottom: 14 },
  emptyTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.gray2 },
  emptySub:   { fontFamily: fonts.body, fontSize: 13, color: colors.gray3, marginTop: 6, textAlign: 'center' },

  // ── Bottom bar ──────────────────────────────────────────────
  bbar:            { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 12, backgroundColor: colors.cream },
  savedState:      { gap: 8 },
  unsavedState:    { gap: 8 },
  savedBannerText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.green, textAlign: 'center', marginBottom: 4 },

  // ── Buttons ─────────────────────────────────────────────────
  btnPrimary:     { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  // ✅ Explicit warm white text — colors.white is now dark surface #1E1C2C
  btnPrimaryText: { fontFamily: fonts.bodyMedium, fontSize: 16, color: '#F2EDE8', letterSpacing: 0.2 },
  rowActions:     { flexDirection: 'row', gap: 8, width: '100%', marginTop: 4 },
  btnSecondary:   { flex: 1, backgroundColor: colors.cream2, borderRadius: 999, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText:{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.charcoal },

  // ── Special date ────────────────────────────────────────────
  specialRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cream2, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 12 },
  specialLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.charcoal },
  specialInput: { backgroundColor: colors.cream2, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 12, fontFamily: fonts.body, fontSize: 14, color: colors.charcoal, borderWidth: 1.5, borderColor: colors.rose },

  // ── Sheets ──────────────────────────────────────────────────
  overlay:     { flex: 1, backgroundColor: 'rgba(8,6,14,0.80)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: colors.cream2, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '85%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray3, alignSelf: 'center', marginBottom: 20 },
  sheetName:   { fontFamily: fonts.display, fontSize: 22, color: colors.charcoal, marginBottom: 4 },
  sheetSub:    { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginBottom: 20 },
  cancelBtn:   { marginTop: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray4, borderRadius: 999 },
  cancelBtnText:{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.gray2 },

  // Detail modal
  detailName:       { fontFamily: fonts.display, fontSize: 22, color: colors.charcoal, marginBottom: 4 },
  detailCategory:   { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginBottom: 10 },
  detailRatingRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  detailRating:     { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.gold },
  detailReviews:    { fontFamily: fonts.body, fontSize: 13, color: colors.gray2 },
  detailAddressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  detailAddressIcon:{ fontSize: 14, marginTop: 2 },
  detailAddress:    { fontFamily: fonts.body, fontSize: 13, color: colors.gray, flex: 1, lineHeight: 20 },
  detailDivider:    { height: 1, backgroundColor: colors.gray4, marginVertical: 16 },
  detailRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  detailIcon: { fontSize: 14 },
});

// ── Pressable backdrop + positioned sheet ───────────────────
const sw = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,6,14,0.80)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90%',
    backgroundColor: colors.cream2,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
  },
  // ✅ flex: 1 so the list fills the sheet and ScrollView can scroll
  listContainer: {
    flex: 1,
    maxHeight: '100%',
  },
});

// ── Rich swap card styles ────────────────────────────────────
const swap = StyleSheet.create({
  card: {
    backgroundColor: colors.cream3,
    borderRadius: radius.sm,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray4,
  },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.gray4, flexShrink: 0 },
  thumbPlaceholder: { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.gray4, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  thumbIcon:   { fontSize: 24 },
  info:        { flex: 1, gap: 2 },
  name:        { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.charcoal, lineHeight: 18 },
  category:    { fontFamily: fonts.body, fontSize: 11, color: colors.gray2 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  rating:      { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.gold },
  reviews:     { fontFamily: fonts.body, fontSize: 11, color: colors.gray2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' },
  location:    { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, flex: 1 },
  dist:        { fontFamily: fonts.body, fontSize: 11, color: colors.gray2 },
  arrow:       { fontSize: 20, color: colors.gray3, flexShrink: 0 },
});

// ── Place detail sheet styles ────────────────────────────────
const detail = StyleSheet.create({
  photoScroll:      { height: 220, width: SCREEN_W },
  photo:            { width: SCREEN_W, height: 220 },
  photoPlaceholder: { height: 160, backgroundColor: colors.cream3, alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderIcon: { fontSize: 40 },
  name:        { fontFamily: fonts.display, fontSize: 22, color: colors.charcoal, marginBottom: 4 },
  type:        { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginBottom: 10 },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  rating:      { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.gold },
  reviewCount: { fontFamily: fonts.body, fontSize: 13, color: colors.gray2 },
  dist:        { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginLeft: 'auto' },
  row:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  rowIcon:     { fontSize: 15, marginTop: 1, width: 20 },
  rowText:     { fontFamily: fonts.body, fontSize: 13, color: colors.gray, flex: 1, lineHeight: 20 },
  rowLink:     { color: colors.rose },
  divider:     { height: 1, backgroundColor: colors.gray4, marginVertical: 18 },
  primaryBtn:       { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  primaryBtnText:   { fontFamily: fonts.bodySemiBold, fontSize: 15, color: '#F2EDE8', letterSpacing: 0.2 },
  secondaryRow:     { flexDirection: 'row', gap: 8, marginBottom: 8 },
  secondaryBtn:     { flex: 1, backgroundColor: colors.cream3, borderRadius: 999, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  secondaryBtnText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.charcoal, textAlign: 'center' },
});