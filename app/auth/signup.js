// app/auth/signup.js
// ─────────────────────────────────────────────────────────────
// Plannie — Sign Up Screen
// TODO: replace placeholder handler with Firebase auth call
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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { colors, fonts, radius } from '../../constants/theme';

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

// ── Password strength indicator ───────────────────────────────
function StrengthBar({ password }) {
  let strength = 0;
  if (password.length >= 8)                        strength++;
  if (/[A-Z]/.test(password))                      strength++;
  if (/[0-9]/.test(password))                      strength++;
  if (/[^A-Za-z0-9]/.test(password))              strength++;

  const labels  = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors_ = ['transparent', '#FF6B6B', '#FFB347', '#C9A96E', '#5BBF85'];

  if (!password) return null;

  return (
    <View style={s.strengthWrap}>
      <View style={s.strengthBars}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              s.strengthBar,
              { backgroundColor: i <= strength ? colors_[strength] : 'rgba(242,237,232,0.10)' },
            ]}
          />
        ))}
      </View>
      <Text style={[s.strengthLabel, { color: colors_[strength] }]}>
        {labels[strength]}
      </Text>
    </View>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const passRef    = useRef(null);
  const confirmRef = useRef(null);

  const passwordsMatch = password === confirm;
  const canSubmit = email.trim().length > 0 && password.length >= 6 && passwordsMatch;

  // ── Handler — wire to Firebase ────────────────────────────
  async function handleSignup() {
    setError('');
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem('@plannie_is_logged_in', 'true');
      await AsyncStorage.setItem('@plannie_user_email', email);
      router.replace('/');
    } catch (e) {
      setError(e.message || 'Could not create account. Please try again.');
    }
    setLoading(false);
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

            <Text style={s.title}>Create your{'\n'}<Text style={s.titleAccent}>account.</Text></Text>
            <Text style={s.subtitle}>Start planning unforgettable dates.</Text>

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
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                  />
                  <TouchableOpacity onPress={() => setShowPass(v => !v)} activeOpacity={0.7}>
                    <Text style={s.showPass}>{showPass ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                <StrengthBar password={password} />
              </View>

              {/* Confirm password */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Confirm Password</Text>
                <TextInput
                  ref={confirmRef}
                  style={[
                    s.input,
                    confirm.length > 0 && !passwordsMatch && s.inputError,
                  ]}
                  value={confirm}
                  onChangeText={t => { setConfirm(t); setError(''); }}
                  placeholder="Re-enter password"
                  placeholderTextColor="rgba(242,237,232,0.25)"
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  onSubmitEditing={canSubmit ? handleSignup : undefined}
                />
                {confirm.length > 0 && !passwordsMatch && (
                  <Text style={s.matchError}>Passwords don't match</Text>
                )}
              </View>

              {/* Error */}
              {error ? <Text style={s.errorText}>{error}</Text> : null}

              {/* CTA */}
              <PrimaryBtn
                label="Create Account →"
                onPress={handleSignup}
                loading={loading}
                disabled={!canSubmit || loading}
              />

              {/* Benefits list */}
              <View style={s.benefits}>
                {[
                  '✦  Unlimited date plans',
                  '✦  Curated local spots',
                  '✦  Save & revisit your nights',
                ].map((b, i) => (
                  <Text key={i} style={s.benefitText}>{b}</Text>
                ))}
              </View>
            </View>

            {/* ── Login link ── */}
            <TouchableOpacity
              style={s.loginLink}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.7}
            >
              <Text style={s.loginLinkText}>
                Already have an account?{' '}
                <Text style={s.loginLinkAccent}>Sign in</Text>
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
  inputError: { borderColor: '#FF6B6B' },

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

  matchError: { fontFamily: fonts.body, fontSize: 12, color: '#FF6B6B', marginTop: 2 },
  errorText:  { fontFamily: fonts.body, fontSize: 13, color: '#FF6B6B', textAlign: 'center' },

  // Password strength
  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar:  { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel:{ fontFamily: fonts.bodySemiBold, fontSize: 11 },

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

  // ── Benefits ──────────────────────────────────────────────
  benefits: {
    backgroundColor: 'rgba(201,169,110,0.07)',
    borderRadius: radius.sm,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.15)',
  },
  benefitText: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(242,237,232,0.55)', lineHeight: 18 },

  // ── Login link ────────────────────────────────────────────
  loginLink:       { alignItems: 'center', paddingVertical: 20 },
  loginLinkText:   { fontFamily: fonts.body, fontSize: 14, color: 'rgba(242,237,232,0.40)' },
  loginLinkAccent: { color: colors.gold, fontFamily: fonts.bodyMedium },
});