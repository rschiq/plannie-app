import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow, VIBE_COLORS } from '../../constants/theme';
import { SmallButton } from '../../components/UI';

function SavedCard({ plan, onOpen, onCalendar, onDelete, onFavorite }) {
  const vc = VIBE_COLORS[plan.vibe] || VIBE_COLORS.Custom;
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onOpen} activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{plan.title}{plan.favorite ? '  ❤️' : ''}</Text>
            <Text style={styles.cardDate}>{plan.dateDisplay} · {plan.city}</Text>
          </View>
          <View style={[styles.vibeBadge, { backgroundColor: vc.bg }]}>
            <Text style={[styles.vibeBadgeText, { color: vc.text }]}>{plan.vibe}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          {plan.items.map((item, i) => <Text key={i} style={styles.cardItem}>{item}</Text>)}
        </View>
      </TouchableOpacity>
      <View style={styles.cardFooter}>
        <SmallButton label="Open" onPress={onOpen} />
        <SmallButton label={plan.favorite ? '❤️ Saved' : '🤍 Fave'} onPress={onFavorite} />
        <SmallButton label="📅 Cal" onPress={onCalendar} variant="green" />
        <SmallButton label="Delete" onPress={onDelete} variant="red" />
      </View>
    </View>
  );
}

export default function SavedScreen() {
  const router = useRouter();
  const { savedPlans, deletePlan, toggleFavorite } = usePlan();

  function openCalendar(plan) {
    const title = encodeURIComponent(plan.title || 'Plannie Date Night');
    const loc = encodeURIComponent(plan.city || 'Los Angeles, CA');
    const url = `https://calendar.google.com/calendar/r/eventedit?text=${title}&location=${loc}&details=${encodeURIComponent('Planned with Plannie 💕')}`;
    Linking.openURL(url).catch(() => Alert.alert('Could not open Calendar'));
  }

  function confirmDelete(id) {
    Alert.alert('Delete Plan', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlan(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved{'\n'}<Text style={styles.titleItalic}>Plans.</Text></Text>
        <Text style={styles.subtitle}>Your dates, ready to revisit anytime.</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {savedPlans.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No saved plans yet.</Text>
            <Text style={styles.emptySub}>Start planning your first date!</Text>
            <TouchableOpacity style={styles.startBtn} onPress={() => router.push('/plan/details')} activeOpacity={0.88}>
              <Text style={styles.startBtnText}>✦ Start Planning</Text>
            </TouchableOpacity>
          </View>
        ) : (
          savedPlans.map((p) => (
            <SavedCard key={p.id} plan={p}
              onOpen={() => router.push('/plan/cart')}
              onCalendar={() => openCalendar(p)}
              onDelete={() => confirmDelete(p.id)}
              onFavorite={() => toggleFavorite(p.id)} />
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 },
  title: { fontFamily: fonts.display, fontSize: 40, color: colors.charcoal, lineHeight: 44 },
  titleItalic: { fontFamily: fonts.displayItalic, color: colors.rose },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.gray2, marginTop: 6 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: radius.md, marginBottom: 14, overflow: 'hidden', ...shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.cream2, gap: 10 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.charcoal },
  cardDate: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 3 },
  vibeBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  vibeBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { padding: 16, paddingTop: 12, gap: 5 },
  cardItem: { fontFamily: fonts.body, fontSize: 13, color: colors.gray },
  cardFooter: { flexDirection: 'row', gap: 8, padding: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.cream2, flexWrap: 'wrap' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.gray2 },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.gray3, marginTop: 6 },
  startBtn: { marginTop: 24, backgroundColor: colors.charcoal, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 16 },
  startBtnText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.white },
});