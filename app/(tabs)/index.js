import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../constants/theme';
import { usePlan } from '../../hooks/usePlan';

export default function HomeScreen() {
  const router = useRouter();
const { resetPlan } = usePlan();
  return (
    <LinearGradient colors={['#2C2520', '#3D2D26', '#5C4038']} style={styles.container}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>💫  Smart Date Planning</Text>
          </View>
          <Text style={styles.appName}>
            Plan<Text style={styles.appNameItalic}>nie</Text>
          </Text>
          <Text style={styles.tagline}>"Plan Your Perfect Date in Minutes"</Text>
          <Text style={styles.sub}>
            Activities, food, flowers, and date ideas — guided by your vibe, ready in minutes.
          </Text>
          <TouchableOpacity style={styles.btnPrimary}
            onPress={() => { resetPlan(); router.push('/plan/details'); }} activeOpacity={0.9}>
            <Text style={styles.btnPrimaryText}>✦  Start Planning</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary}
            onPress={() => router.push('/(tabs)/saved')} activeOpacity={0.8}>
            <Text style={styles.btnSecondaryText}>View Saved Plans</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.stats}>
          {[{ n: '4.9★', l: 'Rating' }, { n: '18k+', l: 'Dates Planned' }, { n: '5 min', l: 'Avg Setup' }].map((s) => (
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
  safe: { flex: 1 },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, paddingTop: 24 },
  pill: {
    backgroundColor: 'rgba(201,169,110,0.15)', borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.25)', borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 28,
  },
  pillText: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.gold },
  appName: { fontFamily: fonts.displayLight, fontSize: 58, color: colors.cream, lineHeight: 72, letterSpacing: -1, marginBottom: 8 },
  appNameItalic: { fontFamily: fonts.displayLightItalic, color: colors.gold },
  tagline: { fontFamily: fonts.displayLightItalic, fontSize: 20, color: 'rgba(251,247,242,0.6)', marginBottom: 14, lineHeight: 28 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(251,247,242,0.4)', lineHeight: 21, marginBottom: 44, maxWidth: 280 },
  btnPrimary: {
    backgroundColor: colors.cream, borderRadius: 999, paddingVertical: 19,
    alignItems: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 10,
  },
  btnPrimaryText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.charcoal, letterSpacing: 0.2 },
  btnSecondary: {
    backgroundColor: 'transparent', borderRadius: 999, paddingVertical: 17,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(251,247,242,0.18)',
  },
  btnSecondaryText: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(251,247,242,0.55)' },
  stats: { flexDirection: 'row', paddingHorizontal: 32, paddingBottom: 48, gap: 32 },
  stat: {},
  statNum: { fontFamily: fonts.display, fontSize: 30, color: colors.gold, lineHeight: 34 },
  statLabel: { fontFamily: fonts.body, fontSize: 10, color: 'rgba(251,247,242,0.35)', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 },
});