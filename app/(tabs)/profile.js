import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';

function ProfileRow({ icon, title, sub, badge }) {
  return (
    <TouchableOpacity style={styles.prow}
      onPress={() => Alert.alert('Coming Soon', 'This feature is launching soon!')} activeOpacity={0.8}>
      <View style={styles.prowLeft}>
        <Text style={styles.prowIcon}>{icon}</Text>
        <View>
          <Text style={styles.prowTitle}>{title}</Text>
          {sub ? <Text style={styles.prowSub}>{sub}</Text> : null}
        </View>
      </View>
      {badge ? (
        <View style={styles.proBadge}><Text style={styles.proBadgeText}>{badge}</Text></View>
      ) : (
        <Text style={styles.prowArrow}>›</Text>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { savedPlans } = usePlan();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient colors={['#2C2520', '#4A3830']} style={styles.hero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatar}><Text style={styles.avatarEmoji}>👫</Text></View>
          <Text style={styles.heroName}>Your Couple Profile</Text>
          <Text style={styles.heroSub}>Member since 2024 · {savedPlans.length} plans saved</Text>
        </LinearGradient>

        <LinearGradient colors={[colors.gold2, colors.blush2]} style={styles.premBanner}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.premTitle}>Plannie Premium ✦</Text>
          <Text style={styles.premSub}>Unlimited plans, Surprise Date generator, anniversary reminders & premium ideas.</Text>
          <TouchableOpacity style={styles.premBtn}
            onPress={() => Alert.alert('Coming Soon', 'Premium subscription coming soon!')} activeOpacity={0.88}>
            <Text style={styles.premBtnText}>Upgrade — $4.99/mo</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Account</Text>
          <ProfileRow icon="💌" title="Partner Details" sub="Add preferences & favorites" />
          <ProfileRow icon="🔔" title="Anniversary Reminders" sub="Never forget a special date" badge="PRO" />
          <ProfileRow icon="🎲" title="Surprise Date Generator" sub="One tap, full plan" badge="PRO" />
          <ProfileRow icon="❤️" title="Couple Favorites" sub="Your go-to spots, saved" />
          <ProfileRow icon="🔗" title="Share a Plan" sub="Send your date plan to your partner" badge="PRO" />
          <ProfileRow icon="⚙️" title="Settings" sub="Notifications, preferences" />
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Plannie  ·  v1.0.0</Text>
          <Text style={styles.appInfoSub}>Made with 💕 for couples everywhere</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  hero: { padding: 32, paddingTop: 48, paddingBottom: 32, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.gold2, justifyContent: 'center', alignItems: 'center', marginBottom: 14, ...shadow.lg },
  avatarEmoji: { fontSize: 38 },
  heroName: { fontFamily: fonts.display, fontSize: 28, color: colors.cream },
  heroSub: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(251,247,242,0.45)', marginTop: 4 },
  premBanner: { margin: 20, borderRadius: radius.md, padding: 24 },
  premTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.white, marginBottom: 8 },
  premSub: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20, marginBottom: 18 },
  premBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingVertical: 13, paddingHorizontal: 24, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  premBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white },
  section: { paddingHorizontal: 24, marginTop: 4 },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.gray2, marginBottom: 12 },
  prow: { backgroundColor: colors.white, borderRadius: radius.sm, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, ...shadow.sm },
  prowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  prowIcon: { fontSize: 20, width: 32 },
  prowTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.charcoal },
  prowSub: { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, marginTop: 1 },
  prowArrow: { fontSize: 20, color: colors.gray3 },
  proBadge: { backgroundColor: colors.gold2, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  proBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: colors.white, letterSpacing: 0.4 },
  appInfo: { alignItems: 'center', marginTop: 32 },
  appInfoText: { fontFamily: fonts.body, fontSize: 12, color: colors.gray3 },
  appInfoSub: { fontFamily: fonts.body, fontSize: 12, color: colors.gray3, marginTop: 4 },
});