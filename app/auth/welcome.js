// app/auth/welcome.js
// ─────────────────────────────────────────────────────────────
// Plannie — Welcome / Auth Entry Screen
// Connects to: login.js, signup.js
// Firebase auth: wire up handlers marked with TODO
// ─────────────────────────────────────────────────────────────
import { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, fonts, radius } from '../../constants/theme';

const { height } = Dimensions.get('window');

// ── Social button ─────────────────────────────────────────────
function SocialButton({ label, icon, onPress, variant = 'dark' }) {
  const scale = useRef(new Animated.Value(1)).current;
  function onPressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }
  const bgColor = variant === 'gold'  ? colors.gold
                : variant === 'white' ? '#F2EDE8'
                : '#1E1C2C';
  const txtColor = variant === 'dark' ? '#F2EDE8' : '#1C1628';
  const borderColor = variant === 'dark'
    ? 'rgba(242,237,232,0.12)'
    : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[s.socialBtn, { backgroundColor: bgColor, borderColor, transform: [{ scale }] }]}>
        <Text style={s.socialIcon}>{icon}</Text>
        <Text style={[s.socialLabel, { color: txtColor }]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  // ── Handlers — wire these up to Firebase later ────────────
  function handleApple() {
    // TODO: await appleAuth.performRequest(...)
    console.log('[Auth] Apple sign-in tapped');
  }

  function handleGoogle() {
    // TODO: await Google.promptAsync(...)
    console.log('[Auth] Google sign-in tapped');
  }

  function handleEmail() {
    router.push('/auth/login');
  }

  return (
    <View style={s.root}>
      {/* Full-screen gradient background */}
      <LinearGradient
        colors={['#0A0814', '#12102A', '#0E0C1E']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Decorative glow orb */}
      <View style={s.orb} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* ── Hero ── */}
        <View style={s.hero}>
          {/* Logo mark */}
          <View style={s.logoMark}>
            <LinearGradient
              colors={['#EEC49A', '#D4956F', '#B8743E']}
              style={s.logoGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={s.logoLetter}>P</Text>
            </LinearGradient>
          </View>

          <Text style={s.appName}>Plannie</Text>
          <Text style={s.heroTitle}>Plan better{'\n'}dates.</Text>
          <Text style={s.heroSub}>Impress without the stress.</Text>
        </View>

        {/* ── Auth buttons ── */}
        <View style={s.buttons}>
          <SocialButton
            label="Continue with Apple"
            icon="🍎"
            onPress={handleApple}
            variant="white"
          />
          <SocialButton
            label="Continue with Google"
            icon="G"
            onPress={handleGoogle}
            variant="dark"
          />

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divText}>or</Text>
            <View style={s.divLine} />
          </View>

          <SocialButton
            label="Continue with Email"
            icon="✉️"
            onPress={handleEmail}
            variant="gold"
          />

          <TouchableOpacity
            style={s.signupLink}
            onPress={() => router.push('/auth/signup')}
            activeOpacity={0.7}
          >
            <Text style={s.signupLinkText}>
              New here?{' '}
              <Text style={s.signupLinkAccent}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fine print */}
        <Text style={s.legal}>
          By continuing you agree to our Terms of Service{'\n'}and Privacy Policy.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0814' },
  safe: { flex: 1, justifyContent: 'space-between' },

  // Decorative glow
  orb: {
    position: 'absolute',
    top: height * 0.15,
    left: '10%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(212,149,111,0.07)',
  },

  // ── Hero ──────────────────────────────────────────────────
  hero:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logoMark:   { marginBottom: 16, borderRadius: 22, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#D4956F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20 } }) },
  logoGrad:   { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontFamily: fonts.display, fontSize: 44, color: '#1C1628', lineHeight: 52 },
  appName:    { fontFamily: fonts.bodySemiBold, fontSize: 13, color: 'rgba(201,169,110,0.70)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24 },
  heroTitle:  { fontFamily: fonts.display, fontSize: 48, color: '#F2EDE8', textAlign: 'center', lineHeight: 54, marginBottom: 14 },
  heroSub:    { fontFamily: fonts.body, fontSize: 16, color: 'rgba(242,237,232,0.45)', textAlign: 'center', lineHeight: 24 },

  // ── Auth buttons ──────────────────────────────────────────
  buttons: { paddingHorizontal: 24, gap: 12, paddingBottom: 8 },

  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 17,
    borderRadius: 999,
    borderWidth: 1,
  },
  socialIcon:  { fontSize: 18, width: 22, textAlign: 'center' },
  socialLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, letterSpacing: 0.2 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(242,237,232,0.08)' },
  divText: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(242,237,232,0.30)' },

  signupLink:       { alignItems: 'center', paddingVertical: 10 },
  signupLinkText:   { fontFamily: fonts.body, fontSize: 14, color: 'rgba(242,237,232,0.40)' },
  signupLinkAccent: { color: colors.gold, fontFamily: fonts.bodyMedium },

  legal: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(242,237,232,0.22)', textAlign: 'center', lineHeight: 17, paddingHorizontal: 32, paddingBottom: 8 },
});