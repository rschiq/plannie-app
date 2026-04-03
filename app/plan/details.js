import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
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

export default function DetailsScreen() {
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const today = new Date().toISOString().split('T')[0];

  const [dateVal, setDateVal]       = useState(plan.date || today);
  const [cityVal, setCityVal]       = useState(plan.city || '');
  const [timeVal, setTimeVal]       = useState(plan.time || '17:00');
  const [budget, setBudget]         = useState(plan.budget || '$$');
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop]     = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [coords, setCoords]         = useState(plan.coords || null);
  const debounceRef = useRef(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
const [dateObj, setDateObj] = useState(() => {
  const d = new Date((plan.date || today) + 'T00:00');
  return d;
});
  const [showTimePicker, setShowTimePicker] = useState(false);
const [timeDate, setTimeDate] = useState(() => {
  const d = new Date();
  const [h, m] = (plan.time || '17:00').split(':');
  d.setHours(parseInt(h), parseInt(m), 0, 0);
  return d;
});

  // ── Google Places Autocomplete ──
  async function fetchSuggestions(text) {
    if (text.length < 2) { setSuggestions([]); setShowDrop(false); return; }
    try {
      const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?' +
        'input=' + encodeURIComponent(text) +
        '&types=(cities)' +
        '&key=' + GOOGLE_API_KEY;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.predictions) {
        setSuggestions(data.predictions.slice(0, 6));
        setShowDrop(data.predictions.length > 0);
      }
    } catch (e) {
      console.log('Autocomplete error:', e.message);
    }
  }

  function onCityChange(text) {
    setCityVal(text);
    setCoords(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 350);
  }

  // ── Pick suggestion → geocode for coords ──
  async function pickSuggestion(prediction) {
    const name = prediction.description;
    setCityVal(name);
    setShowDrop(false);
    setSuggestions([]);
    try {
      const url = 'https://maps.googleapis.com/maps/api/geocode/json?' +
        'place_id=' + prediction.place_id +
        '&key=' + GOOGLE_API_KEY;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.results?.[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        setCoords({ lat, lng });
      }
    } catch (e) {
      console.log('Geocode error:', e.message);
    }
  }

  // ── Use current location ──
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

      // Reverse geocode to get city name
      const url = 'https://maps.googleapis.com/maps/api/geocode/json?' +
        'latlng=' + latitude + ',' + longitude +
        '&key=' + GOOGLE_API_KEY;
      const res  = await fetch(url);
      const data = await res.json();

      if (data.results?.[0]) {
        // Extract city name from address components
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
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
  const mm = String(selected.getMonth() + 1).padStart(2, '0');
  const dd = String(selected.getDate()).padStart(2, '0');
  setDateVal(yyyy + '-' + mm + '-' + dd);
}
function onTimeChange(event, selected) {
  setShowTimePicker(false);
  if (!selected) return;
  setTimeDate(selected);
  const h = selected.getHours();
  const m = selected.getMinutes();
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  setTimeVal(hh + ':' + mm);
}
  function handleNext() {
  const finalDate = dateVal || today;
  updatePlan({
    date:        finalDate,
    dateDisplay: formatDateDisplay(finalDate),
    city:        cityVal,
    coords:      coords,
    time:        timeVal,
    timeDisplay: fmtTime(timeVal),
    budget,
  });
  router.push('/plan/how');
}

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
        {/* Date */}
<View style={styles.fg}>
  <Text style={styles.fl}>Date</Text>
  <TouchableOpacity
    style={styles.timePicker}
    onPress={() => setShowDatePicker(true)}
    activeOpacity={0.8}
  >
    <Text style={styles.timePickerIcon}>📅</Text>
    <Text style={styles.timePickerText}>
  {dateVal ? formatDateDisplay(dateVal) : formatDateDisplay(today)}
</Text>
    <Text style={styles.timePickerChevron}>›</Text>
  </TouchableOpacity>
  {showDatePicker && (
    <DateTimePicker
      value={dateObj}
      mode="date"
      display="spinner"
      onChange={onDateChange}
      minimumDate={new Date()}
    />
  )}
</View>

        {/* City with Autocomplete */}
        <View style={styles.fg}>
          <Text style={styles.fl}>City / Location</Text>

          {/* Use current location button */}
          <TouchableOpacity
            style={styles.locBtn}
            onPress={useCurrentLocation}
            activeOpacity={0.8}
            disabled={locLoading}
          >
            {locLoading ? (
              <ActivityIndicator size="small" color={colors.rose} />
            ) : (
              <Text style={styles.locBtnText}>📍 Use my current location</Text>
            )}
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <Text style={styles.locIcon}>🔍</Text>
            <TextInput
              style={[styles.fi, { paddingLeft: 44, flex: 1 }]}
              value={cityVal}
              onChangeText={onCityChange}
              onBlur={() => setTimeout(() => setShowDrop(false), 200)}
              placeholder="Search city or neighborhood…"
              placeholderTextColor={colors.gray3}
              autoCorrect={false}
              autoCapitalize="words"
            />
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

          {/* Coords saved indicator */}
          {coords && (
            <Text style={styles.coordsLabel}>✅ Location saved</Text>
          )}
        </View>

        {/* Time */}
<View style={styles.fg}>
  <Text style={styles.fl}>Time (optional)</Text>
  <TouchableOpacity
    style={styles.timePicker}
    onPress={() => setShowTimePicker(true)}
    activeOpacity={0.8}
  >
    <Text style={styles.timePickerIcon}>🕐</Text>
    <Text style={styles.timePickerText}>
      {timeVal ? fmtTime(timeVal) : 'Select a time'}
    </Text>
    <Text style={styles.timePickerChevron}>›</Text>
  </TouchableOpacity>
  {timeVal ? (
    <TouchableOpacity onPress={() => setTimeVal('')}>
      <Text style={styles.timeClear}>✕ Clear time</Text>
    </TouchableOpacity>
  ) : null}
  {showTimePicker && (
    <DateTimePicker
      value={timeDate}
      mode="time"
      display="spinner"
      onChange={onTimeChange}
      minuteInterval={15}
    />
  )}
</View>

        {/* Budget */}
        <View style={styles.fg}>
          <Text style={styles.fl}>Budget</Text>
          <View style={styles.budgetRow}>
            {BUDGETS.map((b) => {
              const selected = budget === b.key;
              return (
                <TouchableOpacity
                  key={b.key}
                  style={[styles.budgetCard, selected && styles.budgetCardSel]}
                  onPress={() => setBudget(b.key)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.budgetEmoji}>{b.emoji}</Text>
                  <Text style={[styles.budgetKey, selected && styles.budgetKeyActive]}>{b.key}</Text>
                  <Text style={[styles.budgetLabel, selected && styles.budgetLabelActive]}>{b.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.bbar}>
        <PrimaryButton label="Next →" onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.cream },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 40 },

  fg: { marginBottom: 20 },
  fl: { fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.gray2, marginBottom: 7 },
  fi: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.cream2, borderRadius: radius.sm, paddingHorizontal: 18, paddingVertical: 15, fontFamily: fonts.body, fontSize: 16, color: colors.charcoal },

  // Current location button
  locBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0F0', borderWidth: 1.5, borderColor: colors.rose, borderRadius: radius.sm, paddingVertical: 12, marginBottom: 10 },
  locBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },

  // Input wrapper
  inputWrap: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  locIcon: { position: 'absolute', left: 14, top: 16, fontSize: 16, zIndex: 1 },

  // Dropdown
  dropdown: { position: 'absolute', top: 115, left: 0, right: 0, backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.cream2, zIndex: 999, ...shadow.lg },
  dropItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 13 },
  dropItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.cream2 },
  dropIcon: { fontSize: 16 },
  dropMain: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.charcoal },
  dropSub:  { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 1 },

  coordsLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.green, marginTop: 6 },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.gray3, marginTop: 6 },

  // Budget
  budgetRow:     { flexDirection: 'row', gap: 10 },
  budgetCard:    { flex: 1, backgroundColor: colors.white, borderRadius: radius.sm, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', borderWidth: 2, borderColor: colors.cream2, ...shadow.sm },
  budgetCardSel: { borderColor: colors.rose, backgroundColor: '#FFF9F8' },
  budgetEmoji:   { fontSize: 20, marginBottom: 6 },
  budgetKey:     { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.gray2, marginBottom: 3 },
  budgetKeyActive:  { color: colors.rose },
  budgetLabel:      { fontFamily: fonts.body, fontSize: 10, color: colors.gray3, textAlign: 'center', lineHeight: 13 },
  budgetLabelActive: { color: colors.rose },

  bbar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, backgroundColor: colors.cream },
  timePicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.cream2, borderRadius: radius.sm, paddingHorizontal: 18, paddingVertical: 15, gap: 12 },
  timePickerIcon: { fontSize: 18 },
  timePickerText: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.charcoal },
  timePickerChevron: { fontSize: 20, color: colors.gray3 },
  timeClear: { fontFamily: fonts.body, fontSize: 12, color: colors.rose, marginTop: 6 },
});