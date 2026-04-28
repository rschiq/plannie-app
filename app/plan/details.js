import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Animated, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { usePlan } from '../../hooks/usePlan';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ScreenHeader, ProgressBar, PrimaryButton } from '../../components/UI';
import { AnimatedPrimaryButton } from '../../components/ScreenTransition';

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';

function TapCard({ onPress, selected, children, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  function onPressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }
  return (
    <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
      <Animated.View style={[{ transform: [{ scale }] }, style, selected && styles.cardSelected]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function DetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const today = new Date().toISOString().split('T')[0];

  const [dateVal, setDateVal]         = useState(plan.date || today);
  const [cityVal, setCityVal]         = useState(plan.location || '');
  const [timeVal, setTimeVal]         = useState(plan.time || '17:00');
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop]       = useState(false);
  const [locLoading, setLocLoading]   = useState(false);
  const [coords, setCoords]           = useState(plan.coords || null);
  const [cityFocused, setCityFocused] = useState(false);
  const debounceRef = useRef(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(() => new Date((plan.date || today) + 'T00:00'));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeDate, setTimeDate] = useState(() => {
    const d = new Date();
    const [h, m] = (plan.time || '17:00').split(':');
    d.setHours(parseInt(h), parseInt(m), 0, 0);
    return d;
  });

  useEffect(() => {
    console.log('Location:', cityVal);
    console.log('Coords:', coords);
  }, [cityVal, coords]);

  // ── Smart display name formatter ────────────────────────────
  // "Studio City, Los Angeles, CA, USA" → "Studio City, Los Angeles"
  // "Los Angeles, CA, USA"              → "Los Angeles, CA"
  function formatPlaceName(prediction) {
    const main      = prediction.structured_formatting?.main_text || '';
    const secondary = prediction.structured_formatting?.secondary_text || '';
    if (!secondary) return main;

    const SKIP = /^(USA|United States|United Kingdom|Canada|Australia|Mexico|India|Japan|France|Germany|Spain|Italy|China|Brazil)$/i;
    const cleaned = secondary
      .split(',')
      .map(s => s.trim())
      .filter(s => s && !SKIP.test(s));

    // Take at most 1 part after main (city only, no state needed for neighborhoods)
    const short = cleaned.slice(0, 1).join(', ');
    return short ? `${main}, ${short}` : main;
  }

  // ── Autocomplete ────────────────────────────────────────────
  async function fetchSuggestions(text) {
    if (text.length < 2) { setSuggestions([]); setShowDrop(false); return; }
    try {
      // ✅ No types= restriction — critical fix for neighborhoods.
      // (regions) misses sublocalities like Studio City, Koreatown, West Hollywood.
      // Removing types lets Google return neighborhoods, districts, sublocalities,
      // cities, and admin areas — everything a user might search for.
      let url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?' +
        'input=' + encodeURIComponent(text) +
        '&key=' + GOOGLE_API_KEY;

      // Bias toward user detected location if available
      if (coords?.lat) {
        url += '&location=' + coords.lat + ',' + coords.lng + '&radius=80000';
      }

      const res  = await fetch(url);
      const data = await res.json();
      console.log('[Autocomplete] status:', data?.status, 'predictions:', data?.predictions?.length || 0);
      if (data?.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        setSuggestions([]);
        setShowDrop(false);
        return;
      }
      if (data.predictions) {
        // Keep only geographic results — filter out pure business listings
        const GEO = new Set([
          'locality','sublocality','sublocality_level_1','neighborhood',
          'administrative_area_level_1','administrative_area_level_2',
          'administrative_area_level_3','country','postal_code',
          'colloquial_area','natural_feature','geocode','political',
        ]);
        const geo = data.predictions.filter(p => p.types?.some(t => GEO.has(t)));
        const results = geo.length > 0 ? geo : data.predictions;
        setSuggestions(results.slice(0, 6));
        setShowDrop(results.length > 0);
      }
    } catch (e) { console.log('Autocomplete error:', e.message); }
  }

  function onCityChange(text) {
    setCityVal(text);
    setCoords(null);
    console.log('[Plan Step 1] location_input_changed', { location: text });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 350);
  }

  async function pickSuggestion(prediction) {
    const displayName = prediction?.description || formatPlaceName(prediction);
    setCityVal(displayName);
    console.log('[Plan Step 1] location_selected_from_autocomplete', { location: displayName });
    setShowDrop(false);
    setSuggestions([]);
    try {
      const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json?place_id=' +
        prediction.place_id + '&fields=geometry&key=' + GOOGLE_API_KEY;
      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();
      console.log('[Autocomplete] details status:', detailsData?.status);
      let lat = detailsData?.result?.geometry?.location?.lat;
      let lng = detailsData?.result?.geometry?.location?.lng;

      if (typeof lat !== 'number' || typeof lng !== 'number') {
        const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?place_id=' +
          prediction.place_id + '&key=' + GOOGLE_API_KEY;
        const geocodeRes  = await fetch(geocodeUrl);
        const geocodeData = await geocodeRes.json();
        console.log('[Autocomplete] geocode fallback status:', geocodeData?.status);
        lat = geocodeData?.results?.[0]?.geometry?.location?.lat;
        lng = geocodeData?.results?.[0]?.geometry?.location?.lng;
      }

        if (typeof lat === 'number' && typeof lng === 'number') {
          setCoords({ lat, lng });
          console.log('[Plan Step 1] coords_selected_from_autocomplete', { coords: { lat, lng } });
        } else {
          setCoords(null);
          console.log('[Autocomplete] failed to resolve numeric coords from selection');
        }
    } catch (e) { console.log('Geocode error:', e.message); }
  }

  async function useCurrentLocation() {
    setLocLoading(true);
    setCityVal('Detecting location…');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission denied. Please enable it in Settings.');
        setCityVal('');
        setLocLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc?.coords?.latitude;
      const lng = loc?.coords?.longitude;

      if (typeof lat !== 'number' || typeof lng !== 'number') {
        setCoords(null);
        setCityVal('');
        setLocLoading(false);
        return;
      }

      setCoords({ lat, lng });

      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const city    = place?.city || place?.subregion || '';
      const region  = place?.region || '';
      const country = place?.isoCountryCode === 'US' ? 'USA' : (place?.country || '');
      const label   = [city, region, country].filter(Boolean).join(', ') || 'My Location';

      setCityVal(label);
      console.log('[Plan Step 1] location_selected_from_device', { location: label, coords: { lat, lng } });
    } catch (e) {
      console.log('Location error:', e);
      setCityVal('');
    }
    setLocLoading(false);
  }

  function formatDateDisplay(str) {
    if (!str) return '';
    const d = new Date(str + 'T00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  }

  function fmtTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  }

  function onDateChange(event, selected) {
    setShowDatePicker(false);
    if (!selected) return;
    setDateObj(selected);
    const yyyy = selected.getFullYear();
    const mm   = String(selected.getMonth() + 1).padStart(2, '0');
    const dd   = String(selected.getDate()).padStart(2, '0');
    setDateVal(yyyy + '-' + mm + '-' + dd);
  }

  function onTimeChange(event, selected) {
    setShowTimePicker(false);
    if (!selected) return;
    setTimeDate(selected);
    const hh = String(selected.getHours()).padStart(2, '0');
    const mm = String(selected.getMinutes()).padStart(2, '0');
    setTimeVal(hh + ':' + mm);
  }

  function handleNext() {
    const isValidLocation =
      coords &&
      typeof coords.lat === 'number' &&
      typeof coords.lng === 'number';
    if (!isValidLocation) return;

    const updates = {
      location: cityVal,
      coords,
      category: null,
    };
    console.log('[Plan Step 1] committing_selection', {
      updates,
      nextPlanPreview: { ...plan, ...updates },
    });
    updatePlan(updates);
    router.push('/plan/category');
  }

  const isValidLocation =
    coords &&
    typeof coords.lat === 'number' &&
    typeof coords.lng === 'number';
  const canContinue = !!isValidLocation;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={"Let's build\n"}
        italic="your date."
        subtitle="Let's set the details"
        onBack={() => router.push('/(tabs)/')}
      />
      <ProgressBar total={3} current={1} />

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]} keyboardShouldPersistTaps="handled">

        {/* DATE */}
        <Text style={styles.sectionLabel}>📅  When's the date?</Text>
        <TapCard onPress={() => setShowDatePicker(true)} selected={!!dateVal} style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardIconWrap}><Text style={styles.cardIcon}>📅</Text></View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>{dateVal ? formatDateDisplay(dateVal) : 'Pick a date'}</Text>
              <Text style={styles.cardSub}>Tap to choose</Text>
            </View>
            <Text style={styles.cardChevron}>›</Text>
          </View>
        </TapCard>
        {showDatePicker && (
          <View style={styles.pickerWrap}>
            <DateTimePicker value={dateObj} mode="date" display="spinner" onChange={onDateChange} minimumDate={new Date()} />
          </View>
        )}

        {/* LOCATION */}
        <Text style={styles.sectionLabel}>📍  Where are you headed?</Text>
        <TapCard onPress={useCurrentLocation} style={styles.locCard}>
          <View style={styles.cardRow}>
            <View style={[styles.cardIconWrap, styles.iconRose]}>
              {locLoading ? <ActivityIndicator size="small" color={colors.rose} /> : <Text style={styles.cardIcon}>📍</Text>}
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={[styles.cardTitle, { color: colors.rose }]}>Use my current location</Text>
              <Text style={styles.cardSub}>Detect automatically</Text>
            </View>
            {coords && <Text style={styles.savedBadge}>✓ Saved</Text>}
          </View>
        </TapCard>

        <View style={[styles.card, cityFocused && styles.cardSelected, styles.searchCard]}>
          <View style={styles.cardRow}>
            <View style={styles.cardIconWrap}><Text style={styles.cardIcon}>🔍</Text></View>
            <TextInput
              style={styles.cityInput}
              value={cityVal}
              onChangeText={onCityChange}
              onFocus={() => setCityFocused(true)}
              onBlur={() => { setCityFocused(false); setTimeout(() => setShowDrop(false), 400); }}
              placeholder="Search city or neighborhood…"
              placeholderTextColor={colors.gray3}
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Dropdown */}
        {showDrop && suggestions.length > 0 && (
          <View style={styles.dropdown}>
            {suggestions.map((p, i) => (
              <TouchableOpacity
                key={p.place_id}
                style={[styles.dropItem, i < suggestions.length - 1 && styles.dropItemBorder]}
                onPress={() => pickSuggestion(p)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  {/* Main name — neighborhood or city */}
                  <Text style={styles.dropMain} numberOfLines={1}>
                    {p.structured_formatting?.main_text || p.description}
                  </Text>
                  {/* Secondary — strip country, keep city/state */}
                  <Text style={styles.dropSub} numberOfLines={1}>
                    {(p.structured_formatting?.secondary_text || '')
                      .split(',')
                      .map(s => s.trim())
                      .filter(s => !/^(USA|United States|United Kingdom|Canada|Australia|Mexico|India|Japan|France|Germany|Spain|Italy|China|Brazil)$/i.test(s))
                      .slice(0, 2)
                      .join(', ')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TIME */}
        <Text style={styles.sectionLabel}>🕐  What time?</Text>
        <TapCard onPress={() => setShowTimePicker(true)} selected={!!timeVal} style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardIconWrap}><Text style={styles.cardIcon}>🕐</Text></View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>{timeVal ? fmtTime(timeVal) : 'Pick a time'}</Text>
              <Text style={styles.cardSub}>Tap to choose · optional</Text>
            </View>
            {timeVal ? (
              <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); setTimeVal(''); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.cardChevron}>›</Text>
            )}
          </View>
        </TapCard>
        {showTimePicker && (
          <View style={styles.pickerWrap}>
            <DateTimePicker value={timeDate} mode="time" display="spinner" onChange={onTimeChange} minuteInterval={15} />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={[styles.bbar, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
        <AnimatedPrimaryButton label="Next →" onPress={handleNext} disabled={!canContinue} />
      </View>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 14;

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.cream },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.5, color: colors.gray2, marginBottom: 6, marginTop: 4 },
  card: { backgroundColor: colors.white, borderRadius: CARD_RADIUS, borderWidth: 1.5, borderColor: 'transparent', marginBottom: 8, paddingHorizontal: 14, paddingVertical: 11, ...Platform.select({ ios: { shadowColor: '#C9A96E', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 8 }, android: { elevation: 2 } }) },
  cardSelected: { borderColor: colors.rose, backgroundColor: colors.cream3, ...Platform.select({ ios: { shadowColor: colors.rose, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 14 }, android: { elevation: 6 } }) },
  locCard: { backgroundColor: colors.cream2, borderRadius: CARD_RADIUS, borderWidth: 1.5, borderColor: 'rgba(212,149,111,0.25)', marginBottom: 8, paddingHorizontal: 14, paddingVertical: 11, ...Platform.select({ ios: { shadowColor: colors.rose, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.20, shadowRadius: 8 }, android: { elevation: 2 } }) },
  searchCard: { paddingVertical: 2, marginBottom: 0 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIconWrap: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  iconRose: { backgroundColor: 'rgba(212,149,111,0.15)' },
  cardIcon: { fontSize: 16 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.charcoal, marginBottom: 1 },
  cardSub: { fontFamily: fonts.body, fontSize: 11, color: colors.gray3 },
  cardChevron: { fontSize: 18, color: colors.gray3, marginRight: -2 },
  savedBadge: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: '#4CAF50', backgroundColor: '#F0FFF0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, overflow: 'hidden' },
  clearBtn: { fontSize: 14, color: colors.rose, paddingHorizontal: 4 },
  cityInput: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.charcoal, paddingVertical: 10 },
  dropdown: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.cream2, marginTop: 4, marginBottom: 8, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12 }, android: { elevation: 5 } }) },
  dropItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  dropItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.cream2 },
  dropIcon: { fontSize: 13 },
  dropMain: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.charcoal },
  dropSub:  { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, marginTop: 1 },
  pickerWrap: { backgroundColor: '#F2EDE8', borderRadius: 14, marginTop: 8, overflow: 'hidden' },
  bbar:       { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 12, backgroundColor: colors.cream },
});