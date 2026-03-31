import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ACTIVITIES, RESTAURANTS, ADDONS } from '../../data';
import { ScreenHeader, ProgressBar } from '../../components/UI';

export default function HowScreen() {
  const router = useRouter();
  const { plan, updatePlan } = usePlan();

  function chooseManual() {
    updatePlan({ mode: 'manual' });
    router.push('/plan/vibe');
  }

  function choosePlanItForMe() {
    updatePlan({ mode: 'auto' });
    router.push('/plan/vibe');
  }

  function doSurprise() {
    const vibes = Object.keys(ACTIVITIES);
    const vibe = vibes[Math.floor(Math.random() * vibes.length)];
    const hr = plan.time ? parseInt(plan.time.split(':')[0]) : 17;
    const acts = ACTIVITIES[vibe];
    const rests = RESTAURANTS[vibe];
    let actIdx = 0, addonKey = 'dessert';
    if (hr < 12) { actIdx = 2; addonKey = 'scenic'; }
    else if (hr < 15) { actIdx = 1; addonKey = 'dessert'; }
    else if (hr < 19) { actIdx = 0; addonKey = 'flowers'; }
    else { actIdx = 0; addonKey = 'scenic'; }
    updatePlan({
      vibe, mode: 'auto',
      activity: acts[actIdx] || acts[0],
      food: rests[1] || rests[0],
      addonType: addonKey,
      addonItem: ADDONS[addonKey][0],
    });
    router.push('/plan/cart');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={'How would you\n'}
        italic="like to plan?"
        subtitle="Pick your style — we'll do the rest."
      />
      <ProgressBar total={7} current={2} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        <View style={styles.grid}>
          {/* Manual card */}
          <TouchableOpacity
            style={styles.manualCard}
            onPress={chooseManual}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardIcon}>🛠️</Text>
              <Text style={[styles.cardTitle, { color: colors.charcoal }]}>
                Build it{'\n'}myself
              </Text>
              <Text style={[styles.cardSub, { color: colors.gray2 }]}>
                Pick each part{'\n'}step by step
              </Text>
            </View>
            <View style={styles.cardBottom} />
          </TouchableOpacity>

          {/* Auto card */}
          <TouchableOpacity
            onPress={choosePlanItForMe}
            activeOpacity={0.85}
            style={styles.autoCardWrap}
          >
            <LinearGradient
              colors={[colors.charcoal, colors.charcoal2]}
              style={styles.autoCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardIcon}>✨</Text>
                <Text style={[styles.cardTitle, { color: colors.white }]}>
                  Plan it{'\n'}for me
                </Text>
                <Text style={[styles.cardSub, { color: 'rgba(251,247,242,0.6)' }]}>
                  Full plan in{'\n'}seconds
                </Text>
              </View>
              <View style={styles.cardBottom}>
                <View style={styles.smartBadge}>
                  <Text style={styles.smartBadgeText}>✦ SMART</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Surprise Me */}
        <TouchableOpacity
          style={styles.surpriseBtn}
          onPress={doSurprise}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.charcoal, colors.charcoal2]}
            style={styles.surpriseInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.surpriseBtnText}>
              🎲  Surprise Me — generate a random plan
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_HEIGHT = 240;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 4 },

  grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },

  manualCard: {
    width: '48%',
    height: CARD_HEIGHT,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.cream2,
    justifyContent: 'space-between',
    ...shadow.sm,
  },

  autoCardWrap: {
    width: '48%',
    height: CARD_HEIGHT,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.md,
  },

  autoCard: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },

  cardTop: { flex: 1 },
  cardBottom: { justifyContent: 'flex-end' },

  cardIcon: { fontSize: 30, marginBottom: 10 },
  cardTitle: {
    fontFamily: fonts.displayMedium,
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 6,
  },
  cardSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
  },

  smartBadge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  smartBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    color: colors.charcoal,
    letterSpacing: 0.8,
  },

  surpriseBtn: { borderRadius: radius.md, overflow: 'hidden', ...shadow.sm },
  surpriseInner: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  surpriseBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.gold,
  },
});