import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { colors } from '../../constants/theme';

export default function PlanTab() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/plan/details');
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
}