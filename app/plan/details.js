import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Animated, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { usePlan } from '../../hooks/usePlan';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ScreenHeader, ProgressBar, PrimaryButton } from '../../components/UI';

const GOOGLE_API_KEY = 'AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8';

const BUDGETS = [
  { key: '$',   label: 'Keep It Simple', desc: 'Great dates on a budget', emoji: '💚' },
  { key: '$$',  label: 'Nice Night Out',  desc: 'A nice night out',        emoji: '💛' },
  { key: '$$$', label: 'Go All Out',      desc: 'Pull out all the stops',  emoji: '❤️' },
];

// ── Animated tappable card ──────────────────────────────────────
function TapCard({ onPress, selected, children, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style, selected && styles.cardSelected]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function DetailsScreen() {
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const today = new Date().toISOString().split('T')[0];

  const [dateVal, setDateVal]         = useState(plan.date || today);
  const [cityVal, setCityVal]         = useState(plan.city || '');
  const [timeVal, setTimeVal]         = useState(plan.time || '17:00');
  const [budget, setBudget]           = useState(plan.budget || '$$');
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

  // ── Autocomplete ────────────────────────────────────────────
  async function fetchSuggestions(text) {
    if (text.length < 2) { setSuggestions([]); setShowDrop(false); return; }
    try {
      const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?' +
        'input=' + encodeURIComponent(text) + '&types=(cities)&key=' + GOOGLE_API_KEY;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.predictions) {
        setSuggestions(data.predictions.slice(0, 6));
        setShowDrop(data.predictions.length > 0);
      }
    } catch (e) { console.log('Autocomplete error:', e.message); }
  }

  function onCityChange(text) {
    setCityVal(text);
    setCoords(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 350);
  }

  async function pickSuggestion(prediction) {
    const name = prediction.description;
    setCityVal(name);
    setShowDrop(false);
    setSuggestions([]);
    try {
      const url = 'https://maps.googleapis.com/maps/api/geocode/json?place_id=' +
        prediction.place_id + '&key=' + GOOGLE_API_KEY;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.results?.[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        setCoords({ lat, lng });
      }
    } catch (e) { console.log('Geocode error:', e.message); }
  }

  async function useCurrentLocation() {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission denied. Please enable it in Settings.');
        setLocLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      const url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
        latitude + ',' + longitude + '&key=' + GOOGLE_API_KEY;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.results?.[0]) {
        const components = data.results[0].address_components;
        const city    = components.find(c => c.types.includes('locality'))?.long_name || '';
        const state   = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '';
        const country = components.find(c => c.types.includes('country'))?.long_name || '';
        const cityName = city
          ? (state ? city + ', ' + state : city + ', ' + country)
          : data.results[0].formatted_address.split(',').slice(0, 2).join(',');
        setCityVal(cityName);
        setCoords({ lat: latitude, lng: longitude });
      }
    } catch (e) {
      console.log('Location error:', e.message);
      alert('Could not get your location. Please type a city instead.');
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
    const finalDate = dateVal || today;
    updatePlan({
      date:        finalDate,
      dateDisplay: formatDateDisplay(finalDate),
      city:        cityVal,
      coords,
      time:        timeVal,
      timeDisplay: fmtTime(timeVal),
      budget,
    });
    router.push('/plan/how');
  }

  const canContinue = cityVal.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={"Let's build\n"}
        italic="your date."
        subtitle="Let's set the details"
        onBack={() => router.push('/(tabs)/')}
      />
      <ProgressBar total={7} current={1} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── DATE CARD ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>📅  When's the date?</Text>
        <TapCard
          onPress={() => setShowDatePicker(true)}
          selected={!!dateVal}
          style={styles.card}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardIconWrap}>
              <Text style={styles.cardIcon}>📅</Text>
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>
                {dateVal ? formatDateDisplay(dateVal) : 'Pick a date'}
              </Text>
              <Text style={styles.cardSub}>Tap to choose</Text>
            </View>
            <Text style={styles.cardChevron}>›</Text>
          </View>
        </TapCard>
        {showDatePicker && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          </View>
        )}

        {/* ── LOCATION CARD ─────────────────────────────── */}
        <Text style={styles.sectionLabel}>📍  Where are you headed?</Text>

        {/* Use current location */}
        <TapCard onPress={useCurrentLocation} style={styles.locCard}>
          <View style={styles.cardRow}>
            <View style={[styles.cardIconWrap, styles.iconRose]}>
              {locLoading
                ? <ActivityIndicator size="small" color={colors.rose} />
                : <Text style={styles.cardIcon}>📍</Text>
              }
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={[styles.cardTitle, { color: colors.rose }]}>Use my current location</Text>
              <Text style={styles.cardSub}>Detect automatically</Text>
            </View>
            {coords && <Text style={styles.savedBadge}>✓ Saved</Text>}
          </View>
        </TapCard>

        {/* City search input — card style */}
        <View style={[styles.card, cityFocused && styles.cardSelected, styles.searchCard]}>
          <View style={styles.cardRow}>
            <View style={styles.cardIconWrap}>
              <Text style={styles.cardIcon}>🔍</Text>
            </View>
            <TextInput
              style={styles.cityInput}
              value={cityVal}
              onChangeText={onCityChange}
              onFocus={() => setCityFocused(true)}
              onBlur={() => { setCityFocused(false); setTimeout(() => setShowDrop(false), 200); }}
              placeholder="Search city or neighborhood…"
              placeholderTextColor={colors.gray3}
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Autocomplete dropdown */}
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
                  <Text style={styles.dropMain} numberOfLines={1}>
                    {p.structured_formatting?.main_text || p.description}
                  </Text>
                  <Text style={styles.dropSub} numberOfLines={1}>
                    {p.structured_formatting?.secondary_text || ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── TIME CARD ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>🕐  What time?</Text>
        <TapCard
          onPress={() => setShowTimePicker(true)}
          selected={!!timeVal}
          style={styles.card}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardIconWrap}>
              <Text style={styles.cardIcon}>🕐</Text>
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>
                {timeVal ? fmtTime(timeVal) : 'Pick a time'}
              </Text>
              <Text style={styles.cardSub}>Tap to choose · optional</Text>
            </View>
            {timeVal ? (
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation?.(); setTimeVal(''); }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.cardChevron}>›</Text>
            )}
          </View>
        </TapCard>
        {showTimePicker && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={timeDate}
              mode="time"
              display="spinner"
              onChange={onTimeChange}
              minuteInterval={15}
            />
          </View>
        )}

        {/* ── BUDGET CARDS ──────────────────────────────── */}
        <Text style={styles.sectionLabel}>💰  What's your budget?</Text>
        <View style={styles.budgetRow}>
          {BUDGETS.map((b) => {
            const sel = budget === b.key;
            const scaleAnim = useRef(new Animated.Value(1)).current;

            function pressIn() {
              Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
            }
            function pressOut() {
              Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
            }

            return (
              <TouchableOpacity
                key={b.key}
                onPress={() => setBudget(b.key)}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={1}
                style={{ flex: 1 }}
              >
                <Animated.View
                  style={[
                    styles.budgetCard,
                    sel && styles.budgetCardSel,
                    { transform: [{ scale: scaleAnim }] },
                  ]}
                >
                  <Text style={styles.budgetEmoji}>{b.emoji}</Text>
                  <Text style={[styles.budgetKey, sel && styles.budgetKeyActive]}>{b.key}</Text>
                  <Text style={[styles.budgetLabel, sel && styles.budgetLabelActive]} numberOfLines={2}>
                    {b.label}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={styles.bbar}>
        <PrimaryButton label="Next →" onPress={handleNext} disabled={!canContinue} />
      </View>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 14;

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.cream },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },

  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.gray2,
    marginBottom: 6,
    marginTop: 4,
  },

  // ── Base card ──────────────────────────────────────────────
  card: {
    backgroundColor: colors.white,
    borderRadius: CARD_RADIUS,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    ...Platform.select({
      ios: {
        shadowColor: '#C9A96E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.09,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },

  // ── Selected glow ─────────────────────────────────────────
  cardSelected: {
    borderColor: colors.rose,
    backgroundColor: colors.cream3,
    ...Platform.select({
      ios: {
        shadowColor: colors.rose,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
    }),
  },

  // ── Location card ─────────────────────────────────────────
  locCard: {
    backgroundColor: colors.cream2,
    borderRadius: CARD_RADIUS,
    borderWidth: 1.5,
    borderColor: 'rgba(212,149,111,0.25)',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    ...Platform.select({
      ios: {
        shadowColor: colors.rose,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },

  // ── City search card (non-tappable shell) ─────────────────
  searchCard: {
    paddingVertical: 2,
    marginBottom: 0,
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRose: {
    backgroundColor: 'rgba(212,149,111,0.15)',
  },

  cardIcon:    { fontSize: 16 },
  cardTextWrap: { flex: 1 },
  cardTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 1,
  },
  cardSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.gray3,
  },
  cardChevron: {
    fontSize: 18,
    color: colors.gray3,
    marginRight: -2,
  },

  savedBadge: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: '#4CAF50',
    backgroundColor: '#F0FFF0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    overflow: 'hidden',
  },

  clearBtn: {
    fontSize: 14,
    color: colors.rose,
    paddingHorizontal: 4,
  },

  // ── City text input inside card ───────────────────────────
  cityInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.charcoal,
    paddingVertical: 10,
  },

  // ── Autocomplete dropdown ─────────────────────────────────
  dropdown: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cream2,
    marginTop: 4,
    marginBottom: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
      },
      android: { elevation: 5 },
    }),
  },
  dropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.cream2 },
  dropIcon:  { fontSize: 13 },
  dropMain:  { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.charcoal },
  dropSub:   { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, marginTop: 1 },

  // ── Budget cards ──────────────────────────────────────────
  budgetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  budgetCard: {
    backgroundColor: colors.white,
    borderRadius: CARD_RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#C9A96E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.09,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  budgetCardSel: {
    borderColor: colors.rose,
    backgroundColor: colors.cream3,
    ...Platform.select({
      ios: {
        shadowColor: colors.rose,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
    }),
  },
  budgetEmoji:      { fontSize: 18, marginBottom: 6 },
  budgetKey:        { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.gray2, marginBottom: 3 },
  budgetKeyActive:  { color: colors.rose },
  budgetLabel:      { fontFamily: fonts.body, fontSize: 10, color: colors.gray3, textAlign: 'center', lineHeight: 13 },
  budgetLabelActive:{ color: colors.rose },

  // ── Native date/time picker wrap ─────────────────────────
  // iOS spinner renders with dark text — needs light bg to be readable
  pickerWrap: {
    backgroundColor: '#F2EDE8',
    borderRadius: 14,
    marginTop: 8,
    overflow: 'hidden',
  },

  bbar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, backgroundColor: colors.cream },
});