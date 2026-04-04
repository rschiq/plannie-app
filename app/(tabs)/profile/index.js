import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { usePlan } from '../../../hooks/usePlan';
import { usePremium } from '../../../hooks/usePremium';
import { colors, fonts, radius, shadow } from '../../../constants/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

function ProfileRow({ icon, title, sub, badge, onPress, isPremium }) {
  return (
    <TouchableOpacity style={styles.prow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.prowLeft}>
        <Text style={styles.prowIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.prowTitle}>{title}</Text>
          {sub ? <Text style={styles.prowSub}>{sub}</Text> : null}
        </View>
      </View>
      {badge && !isPremium ? (
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>{badge}</Text>
        </View>
      ) : (
        <Text style={styles.prowArrow}>›</Text>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { savedPlans, plan } = usePlan();
  const { setIsPremium } = usePremium();
  const [isPremium, setIsPremiumLocal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('@plannie_is_premium').then(val => {
        setIsPremiumLocal(val === 'true');
      });
    }, [])
  );

  const comingSoon = () => router.push('/pro');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Hero — Midnight Velvet ── */}
        {/* ✅ Deep purple gradient — NOT warm brown ['#2C2520', '#4A3830'] */}
        <LinearGradient
          colors={['#1C1628', '#241A38', '#1A1428']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>👫</Text>
          </View>
          {/* ✅ Explicit warm white — colors.cream is now dark #0E0C15 */}
          <Text style={styles.heroName}>Your Couple Profile</Text>
          <Text style={styles.heroSub}>
            Member since 2024 · {savedPlans.length} plans saved
          </Text>
        </LinearGradient>

        {/* ── Premium Banner — gold-to-rose-gold gradient (kept, looks great) ── */}
        <LinearGradient
          colors={[colors.gold2, colors.blush2]}
          style={styles.premBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* ✦ Subtle sparkle badge */}
          <View style={styles.premBadge}>
            <Text style={styles.premBadgeText}>✦ PLANNIE PREMIUM</Text>
          </View>

          {/* Emotional headline — value over features */}
          <Text style={styles.premTitle}>Never run out of{'\n'}date ideas again.</Text>

          {/* Supporting line — feeling, not a feature list */}
          <Text style={styles.premSub}>
            Keep things exciting, effortless,{'\n'}and unforgettable.
          </Text>

          {/* High-converting CTA */}
          <TouchableOpacity
            style={styles.premBtn}
            onPress={() => router.push('/pro')}
            activeOpacity={0.88}
          >
            <Text style={styles.premBtnText}>Unlock Better Dates ✨</Text>
          </TouchableOpacity>

          {/* Low-friction price anchor below button */}
          <Text style={styles.premPrice}>$4.99 / month · Cancel anytime</Text>
        </LinearGradient>

        {/* ── Menu ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Account</Text>

          <ProfileRow
            icon="💌"
            title="Partner Details"
            sub="Add preferences & favorites"
            onPress={() => router.push('/profile/partner-details')}
          />
          <ProfileRow
            icon="💍"
            title="Special Dates"
            sub="Never miss your important dates"
            onPress={() => router.push('/profile/special-dates')}
          />
          <ProfileRow
            icon="🎲"
            title="Surprise Date Generator"
            sub="One tap, full plan"
            badge="PRO"
            isPremium={isPremium}
            onPress={() => isPremium ? router.push('/plan/how?surprise=true') : router.push('/pro')}
          />
          <ProfileRow
            icon="❤️"
            title="Couple Favorites"
            sub="Your go-to spots, saved"
            onPress={() => router.push('/profile/couple-favorites')}
          />
          <ProfileRow
            icon="🔗"
            title="Share a Plan"
            sub="Send your date plan to your partner"
            badge="PRO"
            isPremium={isPremium}
            onPress={() => {
              if (!isPremium) { router.push('/pro'); return; }
              const latest = savedPlans[0];
              const lines  = [];
              if (latest) {
                const vibeTitles = {
                  Romantic:  'Romantic Evening Escape 🌹',
                  Adventure: 'Epic Adventure Date ⚡',
                  Chill:     'Chill Night Out ☕',
                  Fun:       'Fun Date Night 🎉',
                  Custom:    'A Night to Remember 🌟',
                };
                lines.push(vibeTitles[latest.vibe] || latest.title);
                lines.push('');
                const times = ['7:00 PM', '8:30 PM', '10:00 PM'];
                latest.items.forEach((item, idx) => {
                  const parts = item.split(' ');
                  const emoji = parts[0];
                  const name  = parts.slice(1).join(' ');
                  const time  = times[idx] || '';
                  let line = '';
                  if (idx === 0)           line = `${time} — 🎯 Start with a great time at ${name}`;
                  else if (emoji === '🍽️') line = `${time} — 🍽️ Enjoy dinner at ${name}`;
                  else if (emoji === '🍰') line = `${time} — 🍰 End the night with dessert at ${name}`;
                  else if (emoji === '💐') line = `${time} — 🌸 End the night with flowers from ${name}`;
                  else if (emoji === '🌅') line = `${time} — 🌅 End with a scenic stop at ${name}`;
                  else                     line = `${time} — ✨ Round off the night at ${name}`;
                  lines.push(line);
                });
                lines.push('');
                lines.push(`📍 ${latest.city}`);
                lines.push('');
              }
              lines.push('Planned with Plannie 💕');
              Share.share({ message: lines.join('\n') });
            }}
          />
          <ProfileRow
            icon="⚙️"
            title="Settings"
            sub="Notifications, preferences"
            onPress={() => router.push('/profile/settings')}
          />
        </View>

        {/* ── Footer ── */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Plannie  ·  v1.0.0</Text>
          <Text style={styles.appInfoSub}>Made with 💕 for couples everywhere</Text>
          {isPremium && (
            <TouchableOpacity onPress={() => setIsPremium(false)} style={{ marginTop: 16 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.gray3, textDecorationLine: 'underline' }}>
                Reset Pro (Test Only)
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },

  // ── Hero ──────────────────────────────────────────────────
  hero: { padding: 32, paddingTop: 48, paddingBottom: 32, alignItems: 'center' },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(201,169,110,0.20)',
    borderWidth: 1, borderColor: 'rgba(201,169,110,0.35)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, ...shadow.lg,
  },
  avatarEmoji: { fontSize: 38 },

  // ✅ Explicit warm white — colors.cream is now #0E0C15 (dark bg)
  heroName: { fontFamily: fonts.display, fontSize: 28, color: '#F2EDE8' },
  heroSub:  { fontFamily: fonts.body, fontSize: 13, color: 'rgba(242,237,232,0.45)', marginTop: 4 },

  // ── Premium banner ─────────────────────────────────────────
  premBanner:   { margin: 20, borderRadius: radius.md, padding: 24, gap: 0 },

  // Small badge above headline
  premBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(28,22,40,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  premBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#1C1628',
  },

  // Emotional headline — larger, bolder
  premTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: '#1C1628',
    marginBottom: 10,
  },

  // Supporting line — shorter, punchier
  premSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(28,22,40,0.70)',
    lineHeight: 20,
    marginBottom: 20,
  },

  // Main CTA button — confident, not timid
  premBtn: {
    backgroundColor: '#1C1628',
    borderRadius: radius.full,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  premBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.gold,
    letterSpacing: 0.2,
  },

  // Price anchor — small, below button, reduces friction
  premPrice: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(28,22,40,0.50)',
  },

  // ── Menu rows ─────────────────────────────────────────────
  section:      { paddingHorizontal: 20, marginTop: 4 },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.gray2, marginBottom: 12 },

  prow:      { backgroundColor: colors.cream2, borderRadius: radius.sm, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, ...shadow.sm },
  prowLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  prowIcon:  { fontSize: 20, width: 32 },
  prowTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.charcoal },
  prowSub:   { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, marginTop: 1 },
  prowArrow: { fontSize: 20, color: colors.gray3 },

  proBadge:     { backgroundColor: colors.gold, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  // ✅ Dark text on gold badge — readable and premium looking
  proBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: '#1C1628', letterSpacing: 0.4 },

  // ── Footer ────────────────────────────────────────────────
  appInfo:    { alignItems: 'center', marginTop: 32 },
  appInfoText:{ fontFamily: fonts.body, fontSize: 12, color: colors.gray3 },
  appInfoSub: { fontFamily: fonts.body, fontSize: 12, color: colors.gray3, marginTop: 4 },
});