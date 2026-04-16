// app/auth/welcome.js
import { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { fonts } from '../../constants/theme';

function AuthButton({ label, icon, onPress, variant = 'primary' }) {
  const scale = useRef(new Animated.Value(1)).current;
  function onPressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }
  if (variant === 'tertiary') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={s.tertiaryBtn}>
        <Text style={s.tertiaryText}>{label}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
      <Animated.View style={[s.btn, variant === 'primary' ? s.btnPrimary : s.btnSecondary, { transform: [{ scale }] }]}>
        {icon ? <Text style={s.btnIcon}>{icon}</Text> : null}
        <Text style={[s.btnLabel, variant === 'primary' ? s.btnLabelDark : s.btnLabelLight]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '147011410264-mmt9lk15c0ksc233ud65npa2u7uok91r.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  async function handleGoogleCredential(idToken) {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      await AsyncStorage.setItem('@plannie_is_logged_in', 'true');
      await AsyncStorage.setItem('@plannie_user_email', user.email || '');
      router.replace('/');
    } catch (e) {
      console.log('[Google Auth] Firebase error:', e.message);
      Alert.alert('Sign-In Failed', e.message);
    }
  }

  async function handleGoogle() {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;
      if (idToken) {
        await handleGoogleCredential(idToken);
      } else {
        Alert.alert('Sign-In Failed', 'No ID token received.');
      }
    } catch (e) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[Google Auth] Cancelled');
      } else if (e.code === statusCodes.IN_PROGRESS) {
        console.log('[Google Auth] Already in progress');
      } else {
        console.log('[Google Auth] Error:', e.message);
        Alert.alert('Sign-In Failed', e.message);
      }
    }
  }

  function handleApple() { console.log('[Auth] Apple tapped'); }
  function handleEmail() { router.push('/auth/login'); }

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#2D1B4E', '#1A0F30', '#0D0818', '#060410']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={s.topTint} />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.top}>
          <Text style={[s.bigP, { fontFamily: 'Baumans_400Regular' }]}>P</Text>
        </View>
        <View style={s.center}>
          <Text style={s.brandRow}>
            <Text style={[s.brandP, { fontFamily: 'Baumans_400Regular' }]}>P</Text>
            <Text style={s.brandRest}>lannie</Text>
          </Text>
          <Text style={s.version}>v1.0</Text>
        </View>
        <View style={s.bottom}>
          {Platform.OS === 'ios' && (
            <AuthButton label="Continue with Apple" icon="🍎" onPress={handleApple} variant="primary" />
          )}
          <AuthButton
            label="Continue with Google"
            icon="G"
            onPress={handleGoogle}
            variant={Platform.OS === 'ios' ? 'secondary' : 'primary'}
          />
          <AuthButton label="Continue with Email" onPress={handleEmail} variant="tertiary" />
          <TouchableOpacity onPress={() => router.push('/auth/signup')} activeOpacity={0.6} style={s.signupRow}>
            <Text style={s.signupText}>
              New here?{'  '}
              <Text style={s.signupAccent}>Create an account</Text>
            </Text>
          </TouchableOpacity>
          <Text style={s.legal}>By continuing you agree to our Terms & Privacy Policy.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060410' },
  safe: { flex: 1 },
  topTint: { position: 'absolute', top: -60, alignSelf: 'center', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(120,60,180,0.18)' },
  top: { flex: 1.2, alignItems: 'center', justifyContent: 'flex-end' },
  bigP: { fontFamily: fonts.displayMedium, fontSize: 110, color: '#F2EDE8', lineHeight: 120, letterSpacing: -2 },
  center: { flex: 0.8, alignItems: 'center', justifyContent: 'center', gap: 12 },
  brandRow: {},
  brandP: { fontFamily: fonts.displayMedium, fontSize: 42, color: '#F2EDE8', lineHeight: 50 },
  brandRest: { fontFamily: fonts.displayItalic, fontSize: 42, color: 'rgba(212,149,111,0.85)', lineHeight: 50 },
  version: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(242,237,232,0.22)', letterSpacing: 1 },
  bottom: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 28, paddingBottom: 8, gap: 10 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 999 },
  btnPrimary: { backgroundColor: '#F2EDE8' },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(242,237,232,0.10)' },
  btnIcon: { fontSize: 17, width: 22, textAlign: 'center' },
  btnLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, letterSpacing: 0.1 },
  btnLabelDark: { color: '#1C1628' },
  btnLabelLight: { color: '#F2EDE8' },
  tertiaryBtn: { alignItems: 'center', paddingVertical: 6 },
  tertiaryText: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(242,237,232,0.30)', letterSpacing: 0.2 },
  signupRow: { alignItems: 'center', paddingVertical: 2 },
  signupText: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(242,237,232,0.28)' },
  signupAccent: { fontFamily: fonts.bodyMedium, color: 'rgba(212,149,111,0.65)' },
  legal: { fontFamily: fonts.body, fontSize: 10, color: 'rgba(242,237,232,0.15)', textAlign: 'center', lineHeight: 15, paddingBottom: 4 },
});
