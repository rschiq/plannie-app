import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../constants/theme';
import { usePlan } from '../../hooks/usePlan';

export default function HomeScreen() {
  const router = useRouter();
  const { resetPlan } = usePlan();

  return (
    // ✅ Midnight Velvet gradient — deep purple-black with subtle depth
    // No more warm browns. Three stops give dimension without being flat.
    <LinearGradient
      colors={['#13101E', '#0E0C15', '#080610']}
      style={styles.container}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>

          {/* Pill badge */}
          <View style={styles.pill}>
            <Text style={styles.pillText}>💫  Smart Date Planning</Text>
          </View>

          {/* App name */}
          <Text style={styles.appName}>
            Plan<Text style={styles.appNameItalic}>nie</Text>
          </Text>

          <Text style={styles.tagline}>"Plan Your Perfect Date in Minutes"</Text>
          <Text style={styles.sub}>
            Activities, food, flowers, and date ideas — guided by your vibe, ready in minutes.
          </Text>

          {/* ✅ Primary button: warm cream bg + dark text (explicit — not theme tokens) */}
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => { resetPlan(); router.push('/plan/details'); }}
            activeOpacity={0.9}
          >
            <Text style={styles.btnPrimaryText}>✦  Start Planning</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push('/(tabs)/saved')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSecondaryText}>View Saved Plans</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.stats}>
          {[
            { n: '4.9★', l: 'Rating' },
            { n: '18k+', l: 'Dates Planned' },
            { n: '5 min', l: 'Avg Setup' },
          ].map((s) => (
            <View key={s.l} style={styles.stat}>
              <Text style={styles.statNum}>{s.n}</Text>
              <Text style={styles.statLabel}>{s.l}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe:      { flex: 1 },
  body:      { flex: 1, justifyContent: 'center', paddingHorizontal: 32, paddingTop: 24 },

  // Pill
  pill: {
    backgroundColor: 'rgba(201,169,110,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.28)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 28,
  },
  pillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.gold,
  },

  // ✅ App name — explicit warm white, NOT colors.cream (now dark)
  appName: {
    fontFamily: fonts.displayLight,
    fontSize: 58,
    color: '#F2EDE8',
    lineHeight: 72,
    letterSpacing: -1,
    marginBottom: 8,
  },
  appNameItalic: {
    fontFamily: fonts.displayLightItalic,
    color: colors.gold,
  },

  tagline: {
    fontFamily: fonts.displayLightItalic,
    fontSize: 20,
    color: 'rgba(242,237,232,0.60)',
    marginBottom: 14,
    lineHeight: 28,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(242,237,232,0.38)',
    lineHeight: 21,
    marginBottom: 44,
    maxWidth: 280,
  },

  // ✅ Primary button — explicit warm cream + explicit dark text
  // Cannot use colors.cream (now #0E0C15) or colors.charcoal (now warm white)
  btnPrimary: {
    backgroundColor: '#F2EDE8',
    borderRadius: 999,
    paddingVertical: 19,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.rose,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 10,
  },
  btnPrimaryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#12101C',   // explicit dark — NOT colors.charcoal (now white)
    letterSpacing: 0.2,
  },

  // Secondary button — subtle border
  btnSecondary: {
    backgroundColor: 'transparent',
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(242,237,232,0.18)',
  },
  btnSecondaryText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(242,237,232,0.50)',
  },

  // Stats
  stats: { flexDirection: 'row', paddingHorizontal: 32, paddingBottom: 48, gap: 32 },
  stat:  {},
  statNum: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.gold,
    lineHeight: 34,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: 'rgba(242,237,232,0.35)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});