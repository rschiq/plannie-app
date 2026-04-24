import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../constants/theme';

const RIZZ_LINES = [
  "I didn’t plan this perfectly… but somehow it still led me to you.",
  "I hope this place is good… but I’m already having a great time.",
  "I picked the place, but you definitely made it worth it.",
  "No pressure tonight… just good vibes and better company.",
  "Be honest… did you come for the place or for me?",
  "If this date goes well, I’m taking full credit 😏",
  "I don’t know what’s better—the plan or the person I’m with.",
  "This spot looked good… but you look better.",
  "I feel like this is gonna be one of those nights we remember.",
  "I didn’t overthink this… I just knew you’d make it good."
];

/**
 * Full-screen loader with a random pickup line (stable for the mount session).
 * Pass embedded={true} when wrapping inside a parent that already handles top chrome (e.g. back row).
 */
export default function RizzLoader({ embedded = false }) {
  const [randomLine] = useState(
    () => RIZZ_LINES[Math.floor(Math.random() * RIZZ_LINES.length)]
  );

  const body = (
    <View style={styles.center}>
      <Text style={styles.topLine}>😏 Plannie is cooking something up...</Text>
      <Text style={styles.subLabel}>💬 Rizz of the Moment:</Text>
      <Text style={styles.rizz}>{randomLine}</Text>
    </View>
  );

  if (embedded) {
    return <View style={styles.embed}>{body}</View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  embed: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  center: {
    maxWidth: 360,
    width: '100%',
    alignItems: 'center',
  },
  topLine: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  subLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.gray2,
    textAlign: 'center',
    marginBottom: 10,
  },
  rizz: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 28,
    color: colors.charcoal,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
