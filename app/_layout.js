import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useFonts, CormorantGaramond_300Light, CormorantGaramond_300Light_Italic, CormorantGaramond_400Regular, CormorantGaramond_400Regular_Italic, CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond';
import { DMSans_300Light, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import { Baumans_400Regular } from '@expo-google-fonts/baumans';
import { View, ActivityIndicator } from 'react-native';
import { PlanProvider } from '../hooks/usePlan';
import { PremiumProvider } from '../hooks/usePremium';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_300Light_Italic,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    Baumans_400Regular,   // ✅ Loaded globally here
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#2C2520', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#C9A96E" size="large" />
      </View>
    );
  }

  return (
    <PremiumProvider>
      <PlanProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="plan/details" />
          <Stack.Screen name="plan/how" />
          <Stack.Screen name="plan/vibe" />
          <Stack.Screen name="plan/activity" />
          <Stack.Screen name="plan/food-ask" />
          <Stack.Screen name="plan/food" />
          <Stack.Screen name="plan/addons" />
          <Stack.Screen name="plan/cart" />
          <Stack.Screen name="pro" />
        </Stack>
      </PlanProvider>
    </PremiumProvider>
  );
}