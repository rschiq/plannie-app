import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, radius, shadow } from '../constants/theme';

export function ScreenHeader({ title, italic, subtitle, onBack }) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack || (() => router.back())} style={styles.backBtn} activeOpacity={0.7}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>
        {title}
        {italic ? <Text style={styles.titleItalic}>{italic}</Text> : null}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function ProgressBar({ total = 7, current = 1 }) {
  return (
    <View style={styles.progRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[
          styles.progStep,
          i + 1 < current && styles.progDone,
          i + 1 === current && styles.progCur,
        ]} />
      ))}
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled, variant = 'dark', style }) {
  const bg = variant === 'rose' ? colors.rose : variant === 'gold' ? colors.gold2 : colors.charcoal;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.88}
      style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }, style]}>
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function OutlineButton({ label, onPress, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.outlineBtn, style]}>
      <Text style={styles.outlineBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function GhostButton({ label, onPress, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.ghostBtn, style]}>
      <Text style={styles.ghostBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SmallButton({ label, onPress, variant = 'default' }) {
  const bg = variant === 'red' ? '#FDECEA' : variant === 'green' ? '#EAF5EA' : variant === 'active' ? colors.rose : colors.cream2;
  const tc = variant === 'red' ? colors.rose : variant === 'green' ? colors.green : variant === 'active' ? colors.white : colors.charcoal;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.smallBtn, { backgroundColor: bg }]}>
      <Text style={[styles.smallBtnText, { color: tc }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SectionLabel({ text }) {
  return <Text style={styles.secLabel}>{text}</Text>;
}

export function Tag({ label, variant = 'default' }) {
  const bg = variant === 'rose' ? '#FDECEA' : variant === 'gold' ? '#FDF5E8' : variant === 'green' ? '#EAF5EA' : colors.cream2;
  const tc = variant === 'rose' ? colors.rose : variant === 'gold' ? colors.gold2 : variant === 'green' ? colors.green : colors.gray;
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagText, { color: tc }]}>{label}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 44, paddingBottom: 12 },
  backBtn: { marginBottom: 10 },
  backText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.gray2 },
  title: { fontFamily: fonts.display, fontSize: 32, color: colors.charcoal, lineHeight: 36, letterSpacing: -0.3 },
  titleItalic: { fontFamily: fonts.displayItalic, color: colors.rose },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginTop: 5, lineHeight: 19 },
  progRow: { flexDirection: 'row', gap: 5, paddingHorizontal: 24, paddingBottom: 20 },
  progStep: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.cream2 },
  progDone: { backgroundColor: colors.rose },
  progCur: { backgroundColor: colors.gold },
  btn: { borderRadius: 999, paddingVertical: 18, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
btnText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.white, letterSpacing: 0.2, textAlign: 'center' },
outlineBtn: { borderRadius: 999, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.gray3, marginTop: 10, minHeight: 52 },
outlineBtnText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.gray, textAlign: 'center' },
ghostBtn: { borderRadius: 999, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream2, marginTop: 8, minHeight: 52 },
ghostBtnText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.charcoal, textAlign: 'center' },
smallBtn: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, minWidth: 90, alignItems: 'center', justifyContent: 'center' },
smallBtnText: { fontFamily: fonts.bodyMedium, fontSize: 12, textAlign: 'center' },
  secLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.gray2, marginBottom: 12 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
  divider: { height: 1, backgroundColor: colors.cream2, marginVertical: 14 },
});