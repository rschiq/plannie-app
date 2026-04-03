import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, shadow } from '../constants/theme';
import { usePremium } from '../hooks/usePremium';

const FEATURES = [
  { icon: '🔔', title: 'Anniversary Reminders', sub: 'Never miss a special date' },
  { icon: '🎲', title: 'Surprise Date Generator', sub: 'One tap, full plan' },
  { icon: '🔗', title: 'Share a Plan', sub: 'Send your date plan to your partner' },
  { icon: '💡', title: 'Unlimited Plans', sub: 'Save as many date plans as you want' },
  { icon: '⭐', title: 'Premium Date Ideas', sub: 'Exclusive curated experiences' },
];

export default function ProScreen() {
  const { isPremium, setIsPremium } = usePremium();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Hero */}
        <LinearGradient
          colors={[colors.gold2, colors.blush2]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroIcon}>✦</Text>
          <Text style={styles.heroTitle}>Plannie Premium</Text>
          <Text style={styles.heroSub}>
            Plan better dates. Impress without the stress.
          </Text>

          <Text style={[styles.heroSub, { marginTop: 8 }]}>
            Unlock premium features and start planning better dates today.
            </Text>
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>$4.99 / month</Text>
          </View>
        </LinearGradient>

        {/* Features List */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What's Included</Text>
          <View style={styles.featureCard}>
            {FEATURES.map((f, idx) => (
              <View
                key={f.title}
                style={[styles.featureRow, idx < FEATURES.length - 1 && styles.featureBorder]}
              >
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
                <Text style={styles.featureCheck}>✓</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
  {isPremium ? (
    <View style={styles.successBox}>
      <Text style={styles.successIcon}>🎉</Text>
      <Text style={styles.successTitle}>You're Premium!</Text>
      <Text style={styles.successMsg}>All premium features are now unlocked.</Text>
      <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.88}>
        <Text style={styles.upgradeBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <>
      <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.88} onPress={() => { setIsPremium(true); router.replace('/(tabs)'); }}>
        <Text style={styles.upgradeBtnText}>Upgrade to Pro — $4.99/mo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.laterBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <Text style={styles.laterBtnText}>Maybe Later</Text>
      </TouchableOpacity>
      <Text style={styles.disclaimer}>
        Cancel anytime. Billed monthly.
      </Text>
    </>
  )}
</View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },

  header: {
    backgroundColor: colors.cream,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.cream2,
    justifyContent: 'center', alignItems: 'center',
  },
  backArrow: {
    fontSize: 26, color: colors.charcoal,
    lineHeight: 30, marginLeft: 2,
  },

  hero: {
    margin: 20,
    borderRadius: radius.md,
    padding: 32,
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 40, color: colors.white,
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: fonts.display, fontSize: 32,
    color: colors.white, marginBottom: 10,
  },
  heroSub: {
    fontFamily: fonts.body, fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', lineHeight: 21,
    marginBottom: 20,
  },
  pricePill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.full,
    paddingHorizontal: 20, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  priceText: {
    fontFamily: fonts.bodyMedium, fontSize: 15,
    color: colors.white,
  },

  section: { paddingHorizontal: 20, marginBottom: 8 },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 10,
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.gray2, marginBottom: 12,
  },
  featureCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    gap: 12,
  },
  featureBorder: {
    borderBottomWidth: 1, borderBottomColor: colors.cream2,
  },
  featureIcon: { fontSize: 20, width: 28 },
  featureContent: { flex: 1 },
  featureTitle: {
    fontFamily: fonts.bodyMedium, fontSize: 14,
    color: colors.charcoal,
  },
  featureSub: {
    fontFamily: fonts.body, fontSize: 11,
    color: colors.gray2, marginTop: 2,
  },
  featureCheck: {
    fontSize: 16, color: colors.gold2,
    fontFamily: fonts.bodySemiBold,
  },

  ctaSection: { paddingHorizontal: 20, marginTop: 8 },
  upgradeBtn: {
    backgroundColor: colors.gold2,
    borderRadius: radius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
    ...shadow.sm,
  },
  upgradeBtnText: {
    fontFamily: fonts.bodyMedium, fontSize: 16,
    color: colors.white,
  },
  laterBtn: {
    backgroundColor: colors.cream2,
    borderRadius: radius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  laterBtnText: {
    fontFamily: fonts.bodyMedium, fontSize: 15,
    color: colors.charcoal,
  },
  disclaimer: {
    fontFamily: fonts.body, fontSize: 12,
    color: colors.gray3, textAlign: 'center',
  },
  successBox: {
  alignItems: 'center',
  paddingVertical: 12,
},
successIcon: { fontSize: 48, marginBottom: 12 },
successTitle: {
  fontFamily: fonts.display, fontSize: 28,
  color: colors.charcoal, marginBottom: 8,
},
successMsg: {
  fontFamily: fonts.body, fontSize: 14,
  color: colors.gray, textAlign: 'center',
  lineHeight: 21, marginBottom: 24,
},
});