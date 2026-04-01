import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { CITY_SUGGESTIONS } from '../../data';
import { ScreenHeader, ProgressBar, PrimaryButton } from '../../components/UI';

const BUDGETS = [
  { key: '$', label: 'Keep It Simple', desc: 'Great dates on a budget', emoji: '💚' },
  { key: '$$', label: 'Nice Night Out', desc: 'A nice night out', emoji: '💛' },
  { key: '$$$', label: 'Go All Out', desc: 'Pull out all the stops', emoji: '❤️' },
];

export default function DetailsScreen() {
  const router = useRouter();
  const { plan, updatePlan } = usePlan();
  const today = new Date().toISOString().split('T')[0];
  const [dateVal, setDateVal] = useState(plan.date || today);
  const [cityVal, setCityVal] = useState(plan.city || 'Los Angeles, CA');
  const [timeVal, setTimeVal] = useState(plan.time || '17:00');
  const [budget, setBudget] = useState(plan.budget || '$$');
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop] = useState(false);

  function onCityChange(text) {
    setCityVal(text);
    if (text.length > 0) {
      const filtered = CITY_SUGGESTIONS.filter(
        (c) => c.main.toLowerCase().includes(text.toLowerCase()) ||
               c.sub.toLowerCase().includes(text.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowDrop(filtered.length > 0);
    } else { setShowDrop(false); }
  }

  function pickCity(c) {
    setCityVal(`${c.main}, ${c.sub}`);
    setShowDrop(false);
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

  function handleNext() {
    updatePlan({
      date: dateVal,
      dateDisplay: formatDateDisplay(dateVal),
      city: cityVal,
      time: timeVal,
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
          <TextInput
            style={styles.fi}
            value={dateVal}
            onChangeText={setDateVal}
            placeholder="MM-DD-YYYY"
            placeholderTextColor={colors.gray3}
          />
        </View>

        {/* City */}
        <View style={styles.fg}>
          <Text style={styles.fl}>City / Location</Text>
          <View>
            <View style={{ position: 'relative' }}>
              <Text style={styles.locIcon}>📍</Text>
              <TextInput
                style={[styles.fi, { paddingLeft: 44 }]}
                value={cityVal}
                onChangeText={onCityChange}
                onFocus={() => cityVal.length > 0 && setShowDrop(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                placeholder="Search a city or neighborhood…"
                placeholderTextColor={colors.gray3}
                autoCorrect={false}
              />
            </View>
            {showDrop && (
              <View style={styles.dropdown}>
                {suggestions.map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dropItem, i < suggestions.length - 1 && styles.dropItemBorder]}
                    onPress={() => pickCity(c)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropIcon}>{c.icon}</Text>
                    <View>
                      <Text style={styles.dropMain}>{c.main}</Text>
                      <Text style={styles.dropSub}>{c.sub}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Time */}
        <View style={styles.fg}>
          <Text style={styles.fl}>Time (optional)</Text>
          <TextInput
            style={styles.fi}
            value={timeVal}
            onChangeText={setTimeVal}
            placeholder="HH:MM  (e.g. 17:00 = 5 PM)"
            placeholderTextColor={colors.gray3}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.hint}>24hr format — 17:00 = 5 PM · 20:00 = 8 PM</Text>
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
                  <Text style={[styles.budgetKey, selected && styles.budgetKeyActive]}>
                    {b.key}
                  </Text>
                  <Text style={[styles.budgetLabel, selected && styles.budgetLabelActive]}>
                    {b.label}
                  </Text>
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
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 40 },

  fg: { marginBottom: 20 },
  fl: {
    fontFamily: fonts.bodySemiBold, fontSize: 11,
    letterSpacing: 0.9, textTransform: 'uppercase',
    color: colors.gray2, marginBottom: 7,
  },
  fi: {
    backgroundColor: colors.white, borderWidth: 1.5,
    borderColor: colors.cream2, borderRadius: radius.sm,
    paddingHorizontal: 18, paddingVertical: 15,
    fontFamily: fonts.body, fontSize: 16, color: colors.charcoal,
  },
  locIcon: { position: 'absolute', left: 14, top: 14, fontSize: 16, zIndex: 1 },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: colors.white, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.cream2, zIndex: 99, marginTop: 4, ...shadow.lg,
  },
  dropItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 13,
  },
  dropItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.cream2 },
  dropIcon: { fontSize: 18 },
  dropMain: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.charcoal },
  dropSub: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 1 },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.gray3, marginTop: 6 },

  // Budget
  budgetRow: { flexDirection: 'row', gap: 10 },
  budgetCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cream2,
    ...shadow.sm,
  },
  budgetCardSel: {
    borderColor: colors.rose,
    backgroundColor: '#FFF9F8',
  },
  budgetEmoji: { fontSize: 20, marginBottom: 6 },
  budgetKey: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.gray2,
    marginBottom: 3,
  },
  budgetKeyActive: { color: colors.rose },
  budgetLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.gray3,
    textAlign: 'center',
    lineHeight: 13,
  },
  budgetLabelActive: { color: colors.rose },

  bbar: {
    paddingHorizontal: 24, paddingBottom: 32,
    paddingTop: 12, backgroundColor: colors.cream,
  },
});