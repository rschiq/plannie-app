// app/pro.js
// ─────────────────────────────────────────────────────────────
// Plannie Premium Upgrade Screen
// Simulates payment — replace the onPress handler with Stripe
// when ready. Sets isPremium = true via usePremium hook.
// ─────────────────────────────────────────────────────────────
import { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { usePremium } from '../hooks/usePremium';
import { colors, fonts, radius } from '../constants/theme';

const BENEFITS = [
  { icon: '∞',  label: 'Unlimited date plans',           sub: 'No caps, no limits' },
  { icon: '🎲', label: 'Surprise Date Generator',        sub: 'One tap, a full night planned' },
  { icon: '💍', label: 'Special Dates',                 sub: 'Never miss your important dates' },
  { icon: '✨', label: 'Premium date ideas',             sub: 'Curated for unforgettable nights' },
  { icon: '🔄', label: 'Unlimited swaps',                sub: 'Swap until it\'s perfect' },
];

export default function ProScreen() {
  const router   = useRouter();
  const { setIsPremium } = usePremium();
  const [loading, setLoading] = useState(false);

  // Button press animation
  const btnScale = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }
  function onPressOut() {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }

  async function handleUpgrade() {
    setLoading(true);

    // ── Simulated payment delay ──────────────────────────────
    // Replace this block with your Stripe payment sheet call:
    //   const { error } = await presentPaymentSheet();
    await new Promise(resolve => setTimeout(resolve, 1400));

    // ── Set premium ──────────────────────────────────────────
    await setIsPremium(true);

    setLoading(false);

    Alert.alert(
      "You're now Premium 🎉",
      "Welcome to Plannie Premium. Enjoy unlimited dates, surprise generators, and more.",
      [{
        text: "Let's go!",
        onPress: () => router.replace('/(tabs)/profile'),
      }]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Hero gradient header ── */}
      <LinearGradient
        colors={['#1C1628', '#241A38', '#1A1428']}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✦ PLANNIE PREMIUM</Text>
        </View>

        {/* Title */}
        <Text style={styles.heroTitle}>Unlock Better{'\n'}Dates ✨</Text>
        <Text style={styles.heroSub}>
          Keep things exciting, effortless,{'\n'}and unforgettable.
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Benefits ── */}
        <Text style={styles.sectionLabel}>Everything included</Text>

        {BENEFITS.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Text style={styles.benefitIconText}>{b.icon}</Text>
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitLabel}>{b.label}</Text>
              <Text style={styles.benefitSub}>{b.sub}</Text>
            </View>
            <View style={styles.check}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          </View>
        ))}

        {/* ── Price card ── */}
        <View style={styles.priceCard}>
          <LinearGradient
            colors={[colors.gold2, colors.blush2]}
            style={styles.priceGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.priceAmount}>$4.99</Text>
            <Text style={styles.pricePer}>per month</Text>
            <Text style={styles.priceNote}>Cancel anytime · No commitment</Text>
          </LinearGradient>
        </View>

        {/* ── CTA ── */}
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={handleUpgrade}
          activeOpacity={1}
          disabled={loading}
        >
          <Animated.View
            style={[
              styles.ctaBtn,
              loading && styles.ctaBtnLoading,
              { transform: [{ scale: btnScale }] },
            ]}
          >
            <Text style={styles.ctaBtnText}>
              {loading ? 'Processing…' : 'Continue to Payment'}
            </Text>
          </Animated.View>
        </TouchableOpacity>

        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service.{'\n'}
          Subscription renews monthly. Cancel anytime.
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  content:{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },

  // ── Hero ──────────────────────────────────────────────────
  hero:    { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 32 },
  backBtn: { marginBottom: 20 },
  backText:{ fontFamily: fonts.bodyMedium, fontSize: 14, color: 'rgba(242,237,232,0.55)' },

  badge:    {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,169,110,0.15)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  badgeText:{ fontFamily: fonts.bodySemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.gold },

  heroTitle:{
    fontFamily: fonts.display,
    fontSize: 36,
    color: '#F2EDE8',
    lineHeight: 42,
    marginBottom: 10,
  },
  heroSub:  {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(242,237,232,0.55)',
    lineHeight: 22,
  },

  // ── Benefits ──────────────────────────────────────────────
  sectionLabel:{
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.gray2,
    marginBottom: 14,
  },

  benefitRow:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.cream2,
    borderRadius: radius.sm,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray4,
  },
  benefitIcon:{
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(201,169,110,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.18)',
  },
  benefitIconText:{ fontSize: 18 },
  benefitText:    { flex: 1 },
  benefitLabel:   { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.charcoal, marginBottom: 2 },
  benefitSub:     { fontFamily: fonts.body, fontSize: 11, color: colors.gray2 },
  check:          { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(201,169,110,0.15)', alignItems: 'center', justifyContent: 'center' },
  checkText:      { fontSize: 11, color: colors.gold, fontFamily: fonts.bodySemiBold },

  // ── Price card ────────────────────────────────────────────
  priceCard:{ borderRadius: radius.md, overflow: 'hidden', marginTop: 8, marginBottom: 20 },
  priceGrad:{ padding: 24, alignItems: 'center' },
  priceAmount:{ fontFamily: fonts.display, fontSize: 52, color: '#1C1628', lineHeight: 56 },
  pricePer:   { fontFamily: fonts.body, fontSize: 15, color: 'rgba(28,22,40,0.65)', marginBottom: 6 },
  priceNote:  { fontFamily: fonts.body, fontSize: 12, color: 'rgba(28,22,40,0.50)' },

  // ── CTA button ────────────────────────────────────────────
  ctaBtn:{
    backgroundColor: colors.rose,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.rose,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaBtnLoading:{ opacity: 0.7 },
  ctaBtnText:{
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#F2EDE8',
    letterSpacing: 0.2,
  },

  // ── Legal ─────────────────────────────────────────────────
  legal:{
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.gray3,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 14,
  },
});