import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, shadow, type } from '../../constants/theme';

const FEATURES = [
  '✨ Smarter date ideas, every time',
  '🎯 Plan your full date instantly',
  '🔄 Re-roll until it feels right',
  '📍 Discover better spots nearby',
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={s.safe} edges={[]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom + 32, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <Text style={s.headline}>Never run out of{'\n'}date ideas again.</Text>
        <Text style={s.sub}>Let Plannie do the thinking for you.</Text>

        {/* Feature list */}
        <View style={s.featureList}>
          {FEATURES.map((item, i) => (
            <Text key={i} style={s.featureItem}>{item}</Text>
          ))}
        </View>

        {/* Pro plan — primary */}
        <LinearGradient
          colors={['#C9A96E', '#D4956F']}
          style={s.planCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={s.planBadge}>
            <Text style={s.planBadgeText}>MOST POPULAR</Text>
          </View>
          <Text style={s.planName}>Plannie Pro</Text>
          <Text style={s.planDesc}>120 plans per month</Text>
          <Text style={s.planPrice}>$9.99 <Text style={s.planPer}>/ month</Text></Text>
          <TouchableOpacity
            style={s.planBtn}
            onPress={() => console.log('Subscribe Pro')}
            activeOpacity={0.88}
          >
            <Text style={s.planBtnText}>Start Pro ✨</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Basic plan — secondary */}
        <View style={[s.planCard, s.planCardSecondary]}>
          <Text style={[s.planName, s.textLight]}>Basic Pro</Text>
          <Text style={s.planDesc}>80 plans per month</Text>
          <Text style={[s.planPrice, s.textLight]}>$7.99 <Text style={s.planPer}>/ month</Text></Text>
          <TouchableOpacity
            style={s.planBtnSecondary}
            onPress={() => console.log('Subscribe Basic')}
            activeOpacity={0.88}
          >
            <Text style={s.planBtnSecondaryText}>Choose Basic</Text>
          </TouchableOpacity>
        </View>

        {/* Extra packs */}
        <Text style={s.packsLabel}>Need more right now?</Text>
        <View style={s.packsRow}>
          <TouchableOpacity
            style={s.packCard}
            onPress={() => console.log('Pack 40')}
            activeOpacity={0.85}
          >
            <Text style={s.packCount}>40 plans</Text>
            <Text style={s.packPrice}>$2.99</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.packCard}
            onPress={() => console.log('Pack 80')}
            activeOpacity={0.85}
          >
            <Text style={s.packCount}>80 plans</Text>
            <Text style={s.packPrice}>$4.99</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={s.footer}>Cancel anytime · No commitment</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.cream },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 24 },

  backBtn:  { marginBottom: 24 },
  backText: { fontFamily: fonts.bodyMedium, fontSize: type.body, color: colors.rose },

  headline: {
    fontFamily: fonts.display,
    fontSize: type.titleLarge,
    lineHeight: 30,
    color: colors.charcoal,
    marginBottom: 10,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: type.body,
    color: colors.gray2,
    marginBottom: 28,
  },

  featureList: { marginBottom: 28 },
  featureItem: {
    fontFamily: fonts.body,
    fontSize: type.body,
    color: colors.gray,
    marginBottom: 10,
    lineHeight: 22,
  },

  // Plan cards
  planCard: {
    borderRadius: radius.md,
    padding: 24,
    marginBottom: 16,
    ...shadow.gold,
  },
  planCardSecondary: {
    backgroundColor: colors.cream2,
    borderWidth: 1,
    borderColor: colors.gray4,
  },

  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(28,22,40,0.20)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  planBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.caption,
    letterSpacing: 1.2,
    color: '#1C1628',
  },

  planName: {
    fontFamily: fonts.display,
    fontSize: type.titleLarge,
    color: '#1C1628',
    marginBottom: 4,
  },
  planDesc: {
    fontFamily: fonts.body,
    fontSize: type.body,
    color: 'rgba(28,22,40,0.65)',
    marginBottom: 12,
  },
  planPrice: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 28,
    color: '#1C1628',
    marginBottom: 18,
  },
  planPer: {
    fontFamily: fonts.body,
    fontSize: type.body,
    color: 'rgba(28,22,40,0.55)',
  },

  planBtn: {
    backgroundColor: '#1C1628',
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  planBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.body,
    color: colors.gold,
    letterSpacing: 0.3,
  },

  planBtnSecondary: {
    backgroundColor: colors.cream3,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray3,
  },
  planBtnSecondaryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.body,
    color: colors.charcoal,
  },

  textLight: { color: colors.charcoal },

  // Extra packs
  packsLabel: {
    fontFamily: fonts.body,
    fontSize: type.body,
    color: colors.gray2,
    marginBottom: 12,
  },
  packsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  packCard: {
    flex: 1,
    backgroundColor: colors.cream2,
    borderRadius: radius.sm,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray4,
  },
  packCount: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.body,
    color: colors.charcoal,
    marginBottom: 4,
  },
  packPrice: {
    fontFamily: fonts.bodySemiBold,
    fontSize: type.titleMedium,
    color: colors.gold,
  },

  footer: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.gray3,
    textAlign: 'center',
  },
});
