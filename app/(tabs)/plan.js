import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { colors } from '../../constants/theme';

export default function PlanTab() {
  const router = useRouter();
  useEffect(() => { router.replace('/plan/details'); }, []);
  return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
}