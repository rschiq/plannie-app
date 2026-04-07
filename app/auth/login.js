// app/auth/login.js
// ─────────────────────────────────────────────────────────────
// Plannie — Login Screen
// TODO: replace placeholder handlers with Firebase auth calls
// ─────────────────────────────────────────────────────────────
import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { colors, fonts, radius } from '../../constants/theme';

// ── Animated primary button ───────────────────────────────────
function PrimaryBtn({ label, onPress, loading, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  function onPressIn() {
    if (disabled) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }
  return (
    <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1} disabled={disabled}>
      <Animated.View style={[s.primaryBtn, disabled && s.primaryBtnDisabled, { transform: [{ scale }] }]}>
        {loading
          ? <ActivityIndicator size="small" color="#F2EDE8" />
          : <Text style={s.primaryBtnText}>{label}</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Social row button ─────────────────────────────────────────
function SocialBtn({ label, icon, onPress }) {
  return (
    <TouchableOpacity style={s.socialBtn} onPress={onPress} activeOpacity={0.8}>
      <Text style={s.socialIcon}>{icon}</Text>
      <Text style={s.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const passRef = useRef(null);

  const canSubmit = email.trim().length > 0 && password.length >= 6;

  // ── Handlers — wire to Firebase ───────────────────────────
  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem('@plannie_is_logged_in', 'true');
      await AsyncStorage.setItem('@plannie_user_email', email);
      router.replace('/');
    } catch (e) {
      setError(e.message || 'Incorrect email or password. Please try again.');
    }
    setLoading(false);
  }

  function handleApple() {
    // TODO: Apple sign-in
    console.log('[Auth] Apple login');
  }

  function handleGoogle() {
    // TODO: Google sign-in
    console.log('[Auth] Google login');
  }

  function handleForgotPassword() {
    // TODO: await sendPasswordResetEmail(auth, email)
    console.log('[Auth] Forgot password for:', email);
  }

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#0A0814', '#12102A', '#0E0C1E']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={s.backText}>← Back</Text>
            </TouchableOpacity>

            <Text style={s.title}>Welcome{'\n'}<Text style={s.titleAccent}>back.</Text></Text>
            <Text style={s.subtitle}>Sign in to your Plannie account.</Text>

            {/* ── Form ── */}
            <View style={s.form}>
              {/* Email */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Email</Text>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={t => { setEmail(t); setError(''); }}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(242,237,232,0.25)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passRef.current?.focus()}
                />
              </View>

              {/* Password */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Password</Text>
                <View style={s.passWrap}>
                  <TextInput
                    ref={passRef}
                    style={[s.input, { flex: 1, borderWidth: 0, padding: 0 }]}
                    value={password}
                    onChangeText={t => { setPassword(t); setError(''); }}
                    placeholder="Min. 6 characters"
                    placeholderTextColor="rgba(242,237,232,0.25)"
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={canSubmit ? handleLogin : undefined}
                  />
                  <TouchableOpacity onPress={() => setShowPass(v => !v)} activeOpacity={0.7}>
                    <Text style={s.showPass}>{showPass ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot password */}
              <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7} style={s.forgotWrap}>
                <Text style={s.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Error */}
              {error ? <Text style={s.errorText}>{error}</Text> : null}

              {/* CTA */}
              <PrimaryBtn
                label="Sign In →"
                onPress={handleLogin}
                loading={loading}
                disabled={!canSubmit || loading}
              />
            </View>

            {/* ── Social ── */}
            <View style={s.socialSection}>
              <View style={s.divider}>
                <View style={s.divLine} /><Text style={s.divText}>or sign in with</Text><View style={s.divLine} />
              </View>
              <View style={s.socialRow}>
                <SocialBtn label="Apple"  icon="🍎" onPress={handleApple} />
                <SocialBtn label="Google" icon="G"  onPress={handleGoogle} />
              </View>
            </View>

            {/* ── Signup link ── */}
            <TouchableOpacity style={s.signupLink} onPress={() => router.push('/auth/signup')} activeOpacity={0.7}>
              <Text style={s.signupLinkText}>
                Don't have an account?{' '}
                <Text style={s.signupLinkAccent}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0814' },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },

  backBtn: { paddingTop: 16, paddingBottom: 8 },
  backText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: 'rgba(242,237,232,0.45)' },

  title:       { fontFamily: fonts.display, fontSize: 42, color: '#F2EDE8', lineHeight: 48, marginTop: 24, marginBottom: 6 },
  titleAccent: { color: colors.gold },
  subtitle:    { fontFamily: fonts.body, fontSize: 14, color: 'rgba(242,237,232,0.45)', marginBottom: 36 },

  // ── Form ──────────────────────────────────────────────────
  form: { gap: 16 },

  fieldWrap:  { gap: 6 },
  fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: 'rgba(242,237,232,0.50)', letterSpacing: 0.8, textTransform: 'uppercase' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(242,237,232,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: fonts.body,
    fontSize: 15,
    color: '#F2EDE8',
  },

  passWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(242,237,232,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  showPass: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold, paddingVertical: 12, paddingLeft: 8 },

  forgotWrap: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: 'rgba(201,169,110,0.70)' },

  errorText: { fontFamily: fonts.body, fontSize: 13, color: '#FF6B6B', textAlign: 'center', marginTop: -4 },

  // ── Primary button ────────────────────────────────────────
  primaryBtn: {
    backgroundColor: colors.rose,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: colors.rose,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: '#F2EDE8', letterSpacing: 0.2 },

  // ── Social ────────────────────────────────────────────────
  socialSection: { marginTop: 28, gap: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(242,237,232,0.08)' },
  divText: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(242,237,232,0.30)' },

  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(242,237,232,0.10)',
  },
  socialIcon:  { fontSize: 16, width: 20, textAlign: 'center' },
  socialLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: '#F2EDE8' },

  // ── Signup link ───────────────────────────────────────────
  signupLink:       { alignItems: 'center', paddingVertical: 20 },
  signupLinkText:   { fontFamily: fonts.body, fontSize: 14, color: 'rgba(242,237,232,0.40)' },
  signupLinkAccent: { color: colors.gold, fontFamily: fonts.bodyMedium },
});