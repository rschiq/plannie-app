import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../../constants/theme';

export default function FoodScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Food Preferences</Text>
        <Text style={styles.body}>
          Tell us what you love to eat so date ideas can match your favorite flavors.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F0B1A',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: '#F2EDE8',
    marginBottom: 14,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: 'rgba(242,237,232,0.85)',
    lineHeight: 24,
  },
});
