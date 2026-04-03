import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
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

        {/* Hero */}
        <LinearGradient
          colors={['#2C2520', '#4A3830']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>👫</Text>
          </View>
          <Text style={styles.heroName}>Your Couple Profile</Text>
          <Text style={styles.heroSub}>
            Member since 2024 · {savedPlans.length} plans saved
          </Text>
        </LinearGradient>

        {/* Premium Banner */}
        <LinearGradient
          colors={[colors.gold2, colors.blush2]}
          style={styles.premBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.premTitle}>Plannie Premium ✦</Text>
          <Text style={styles.premSub}>
            Unlimited plans, Surprise Date generator, anniversary reminders & premium ideas.
          </Text>
          <TouchableOpacity
            style={styles.premBtn}
            onPress={() => Alert.alert('Coming Soon', 'Premium subscription coming soon!')}
            activeOpacity={0.88}
          >
            <Text style={styles.premBtnText}>Upgrade — $4.99/mo</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Menu */}
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
  sub="Your most meaningful dates"
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
              const lines = [];
              if (latest) {
                const vibeTitles = {
  Romantic: 'Romantic Evening Escape 🌹',
  Adventure: 'Epic Adventure Date ⚡',
  Chill: 'Chill Night Out ☕',
  Fun: 'Fun Date Night 🎉',
  Custom: 'A Night to Remember 🌟',
};
const vibeTitle = vibeTitles[latest.vibe] || latest.title;
lines.push(vibeTitle);
                lines.push('');
                const times = ['7:00 PM', '8:30 PM', '10:00 PM'];
                latest.items.forEach((item, idx) => {
                  const parts = item.split(' ');
                  const emoji = parts[0];
                  const name = parts.slice(1).join(' ');
                  const time = times[idx] || '';
                  let line = '';
                  if (idx === 0) {
                    const activityPhrases = {
                      'Cliffs of Id Rock Climbing': 'an exciting rock climbing session at Cliffs of Id',
                      'Bowlero Hollywood': 'a fun bowling session at Bowlero Hollywood',
                      'Two Bit Circus': 'an epic night of games and VR at Two Bit Circus',
                      'Puttshack': 'a hilarious round of tech mini golf at Puttshack',
                      'Top Golf Hollywood': 'a competitive round at Topgolf Hollywood',
                      'Topgolf VIP Suite': 'a luxury golf experience at Topgolf VIP Suite',
                      'Blue Whale Jazz Club': 'a soulful evening at Blue Whale Jazz Club',
                      'Perch Rooftop Lounge': 'a stunning rooftop evening at Perch',
                      'Wine Tasting at Malibu Winery': 'a relaxed wine tasting at Malibu Winery',
                      'The Last Bookstore': 'a cozy browse through The Last Bookstore',
                      'Griffith Trail Walk': 'a scenic hike along the Griffith Trail',
                      'Runyon Canyon Hike': 'a refreshing hike up Runyon Canyon',
                      'Echo Park Lake Walk': 'a peaceful stroll around Echo Park Lake',
                      'The Landmark Westwood': 'a cozy movie night at The Landmark Westwood',
                      'Griffith Observatory Overlook': 'a magical visit to Griffith Observatory',
                      'Santa Monica Sunset Walk': 'a romantic sunset walk along Santa Monica',
                      'NoBar Karaoke': 'a hilarious karaoke session at NoBar',
                      'Dave & Busters Arcade': 'a competitive night at Dave & Busters',
                      'The Void VR Experience': 'a mind-blowing VR adventure at The Void',
                      'LA Ice Arena': 'a fun ice skating session at LA Ice Arena',
                      'Axe Throwing LA': 'an exciting axe throwing session at Axe Throwing LA',
                      'Helicopter Tour LA': 'a breathtaking helicopter tour over LA',
                      'Hot Air Balloon Temecula': 'a magical hot air balloon ride over Temecula',
                    };
                    const phrase = activityPhrases[name] || `a great time at ${name}`;
                    line = `${time} — 🎯 Start with ${phrase}`;
                  } else if (emoji === '🍽️') {
                    line = `${time} — 🍽️ Enjoy dinner at ${name}`;
                  } else if (emoji === '🍰') {
                    line = `${time} — 🍰 End the night with dessert at ${name}`;
                  } else if (emoji === '💐') {
                    line = `${time} — 🌸 End the night with a romantic stop at ${name} for fresh flowers`;
                  } else if (emoji === '🌅') {
                    line = `${time} — 🌅 End with a scenic stop at ${name}`;
                  } else {
                    line = `${time} — ✨ Round off the night at ${name}`;
                  }
                  lines.push(line);
                });
                lines.push('');
                lines.push(`📍 ${latest.city}`);
                lines.push('');
              }
              lines.push('Planned with Plannie 💕');
              const message = lines.length > 1 ? lines.join('\n') : 'Check out this date plan I made on Plannie 💕';
              Share.share({ message });
            }}
          />
          <ProfileRow
            icon="⚙️"
            title="Settings"
            sub="Notifications, preferences"
            onPress={() => router.push('/profile/settings')}
          />
        </View>

        {/* Footer */}
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
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },

  hero: {
    padding: 32, paddingTop: 48, paddingBottom: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.gold2,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, ...shadow.lg,
  },
  avatarEmoji: { fontSize: 38 },
  heroName: { fontFamily: fonts.display, fontSize: 28, color: colors.cream },
  heroSub: {
    fontFamily: fonts.body, fontSize: 13,
    color: 'rgba(251,247,242,0.45)', marginTop: 4,
  },

  premBanner: { margin: 20, borderRadius: radius.md, padding: 24 },
  premTitle: {
    fontFamily: fonts.display, fontSize: 26,
    color: colors.white, marginBottom: 8,
  },
  premSub: {
    fontFamily: fonts.body, fontSize: 13,
    color: 'rgba(255,255,255,0.8)', lineHeight: 20, marginBottom: 18,
  },
  premBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.full,
    paddingVertical: 13, paddingHorizontal: 24,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  premBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white },

  section: { paddingHorizontal: 20, marginTop: 4 },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 10,
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.gray2, marginBottom: 12,
  },

  prow: {
    backgroundColor: colors.white, borderRadius: radius.sm,
    padding: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8, ...shadow.sm,
  },
  prowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  prowIcon: { fontSize: 20, width: 32 },
  prowTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.charcoal },
  prowSub: { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, marginTop: 1 },
  prowArrow: { fontSize: 20, color: colors.gray3 },
  proBadge: {
    backgroundColor: colors.gold2, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  proBadgeText: {
    fontFamily: fonts.bodySemiBold, fontSize: 10,
    color: colors.white, letterSpacing: 0.4,
  },

  appInfo: { alignItems: 'center', marginTop: 32 },
  appInfoText: { fontFamily: fonts.body, fontSize: 12, color: colors.gray3 },
  appInfoSub: { fontFamily: fonts.body, fontSize: 12, color: colors.gray3, marginTop: 4 },
});