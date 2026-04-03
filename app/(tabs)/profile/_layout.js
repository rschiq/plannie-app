import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="partner-details" />
      <Stack.Screen name="couple-favorites" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}