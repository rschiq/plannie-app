import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ScreenHeader, ProgressBar } from '../../components/UI';

export default function FoodAskScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={'Continue the\n'} italic="evening?"
        subtitle="Would you like to eat after your activity?" />
      <ProgressBar total={7} current={5} />
      <View style={styles.content}>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/plan/food')} activeOpacity={0.85}>
          <Text style={styles.rowEmoji}>🍽️</Text>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Yes, let's eat</Text>
            <Text style={styles.rowSub}>Find perfect spots to continue the night</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/plan/addons')} activeOpacity={0.85}>
          <Text style={styles.rowEmoji}>⏭️</Text>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Skip for now</Text>
            <Text style={styles.rowSub}>Head straight to finishing touches</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 24, paddingTop: 8 },
  row: { backgroundColor: colors.white, borderRadius: radius.sm, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, borderWidth: 2, borderColor: 'transparent', ...shadow.sm },
  rowEmoji: { fontSize: 26 },
  rowContent: { flex: 1 },
  rowTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal },
  rowSub: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 2 },
  arrow: { fontSize: 20, color: colors.gray3 },
});