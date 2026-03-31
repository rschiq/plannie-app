import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ACTIVITIES, RESTAURANTS, ADDONS } from '../../data';
import { SmallButton } from '../../components/UI';

function TimelineItem({ emoji, time, label, name, sub, isLast, onSwap, onRemove }) {
  return (
    <View style={styles.tiRow}>
      <View style={styles.tiLeft}>
        <View style={styles.tiDot}><Text style={styles.tiEmoji}>{emoji}</Text></View>
        {!isLast && <View style={styles.tiLine} />}
      </View>
      <View style={[styles.tiContent, !isLast && { paddingBottom: 28 }]}>
        <Text style={styles.tiTime}>{time} · {label}</Text>
        <Text style={styles.tiName}>{name}</Text>
        <Text style={styles.tiSub}>{sub}</Text>
        <View style={styles.tiActions}>
          <SmallButton label="🔄 Swap" onPress={onSwap} />
          <SmallButton label="✕ Remove" onPress={onRemove} variant="red" />
        </View>
      </View>
    </View>
  );
}

function SwapSheet({ visible, swapKey, plan, onClose, onSwap }) {
  if (!swapKey) return null;
  const vibe = plan.vibe || 'Romantic';
  let items = [], title = '', sub = '';
  if (swapKey === 'activity') {
    title = 'Swap Activity'; sub = 'Choose a different activity.';
    items = (ACTIVITIES[vibe] || []).filter((a) => a.id !== plan.activity?.id).slice(0, 3);
  } else if (swapKey === 'food') {
    title = 'Swap Restaurant'; sub = 'A few more great options nearby.';
    items = (RESTAURANTS[vibe] || []).filter((r) => r.id !== plan.food?.id).slice(0, 3);
  } else {
    title = 'Swap Add-On'; sub = 'Other finishing touches to consider.';
    const types = ['flowers', 'dessert', 'scenic'].filter((t) => t !== plan.addonType);
    items = types.map((t) => ({ ...ADDONS[t][0], _addonType: t })).slice(0, 3);
  }
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheetBody}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <Text style={styles.sheetSub}>{sub}</Text>
          {items.map((item) => (
            <TouchableOpacity key={item.id} style={styles.swapCard}
              onPress={() => onSwap(swapKey, item)} activeOpacity={0.85}>
              <View style={styles.swapCardInner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.swapCardTitle}>{item.name}</Text>
                  <Text style={styles.swapCardSub}>{item.type || item.cuisine || item.note}</Text>
                  <View style={styles.swapCardMeta}>
                    <Text style={styles.swapRating}>★ {item.rating}</Text>
                    <Text style={styles.swapDist}>{item.dist}</Text>
                    {(item.tag || item.note) && (
                      <Text style={styles.swapTag}>{item.tag || item.note}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.swapArrow}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function SaveModal({ visible, onViewSaved, onCalendar, onKeepEditing }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.saveOverlay}>
        <View style={styles.saveBox}>
          <Text style={styles.saveIcon}>🎉</Text>
          <Text style={styles.saveTitle}>Your date plan{'\n'}is ready.</Text>
          <Text style={styles.saveSub}>Saved and waiting. Time to look forward to something wonderful.</Text>
          <TouchableOpacity style={styles.savePrimary} onPress={onViewSaved} activeOpacity={0.88}>
            <Text style={styles.savePrimaryText}>View Saved Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveSecondary} onPress={onCalendar} activeOpacity={0.8}>
            <Text style={styles.saveSecondaryText}>📅  Add to Google Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveGhost} onPress={onKeepEditing} activeOpacity={0.8}>
            <Text style={styles.saveGhostText}>Keep Editing</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const { plan, updatePlan, savePlan, fmtHM, getBaseHour, getBaseMin } = usePlan();
  const [swapKey, setSwapKey] = useState(null);
  const [showSave, setShowSave] = useState(false);

  const baseH = getBaseHour();
  const baseM = getBaseMin();

  const timelineItems = [];
  if (plan.activity) timelineItems.push({ key: 'activity', emoji: '🎯', label: 'Activity', time: fmtHM(baseH, baseM), name: plan.activity.name, sub: plan.activity.type });
  if (plan.food) timelineItems.push({ key: 'food', emoji: '🍽️', label: 'Dinner', time: fmtHM(baseH + 2, baseM), name: plan.food.name, sub: plan.food.cuisine });
  if (plan.addonItem) {
    const emoji = plan.addonType === 'flowers' ? '💐' : plan.addonType === 'dessert' ? '🍰' : '🌅';
    const label = plan.addonType === 'flowers' ? 'Flowers' : plan.addonType === 'dessert' ? 'Dessert' : 'Scenic Stop';
    timelineItems.push({ key: 'addon', emoji, label, time: fmtHM(baseH + 3, 30), name: plan.addonItem.name, sub: plan.addonItem.note });
  }

  function removeItem(key) {
    if (key === 'activity') updatePlan({ activity: null });
    else if (key === 'food') updatePlan({ food: null });
    else updatePlan({ addonType: null, addonItem: null });
  }

  function handleSwap(key, item) {
    const vibe = plan.vibe || 'Romantic';
    if (key === 'activity') updatePlan({ activity: item });
    else if (key === 'food') updatePlan({ food: item });
    else updatePlan({ addonType: item._addonType, addonItem: item });
    setSwapKey(null);
  }

  function handleSave() { savePlan(); setShowSave(true); }

  function handleCalendar() {
    const title = encodeURIComponent(plan.vibe ? `${plan.vibe} Date Night` : 'Plannie Date Night');
    const loc = encodeURIComponent(plan.city || 'Los Angeles, CA');
    const details = encodeURIComponent('Planned with Plannie 💕');
    const url = `https://calendar.google.com/calendar/r/eventedit?text=${title}&location=${loc}&details=${details}`;
    Linking.openURL(url).catch(() => Alert.alert('Could not open Calendar', 'Please open Google Calendar manually.'));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient colors={['#2C2520', '#4A3830', '#6B4F45']} style={styles.hero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.heroLabel}>Your Date Plan</Text>
          <Text style={styles.heroTitle}>{plan.vibe ? `${plan.vibe} Date Night` : 'Your Date Plan'}</Text>
          <Text style={styles.heroMeta}>{plan.dateDisplay || 'Upcoming'} · {plan.city}</Text>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>✦  {plan.vibe || 'Custom'} Vibe</Text>
          </View>
        </LinearGradient>

        {timelineItems.length > 0 ? (
          <View style={styles.timeline}>
            {timelineItems.map((item, idx) => (
              <TimelineItem key={item.key} emoji={item.emoji} time={item.time}
                label={item.label} name={item.name} sub={item.sub}
                isLast={idx === timelineItems.length - 1}
                onSwap={() => setSwapKey(item.key)}
                onRemove={() => removeItem(item.key)} />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Your plan is empty.</Text>
            <Text style={styles.emptySub}>Go back and add some items to your date!</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bbar}>
        <TouchableOpacity style={styles.btnSave} onPress={handleSave} activeOpacity={0.88}>
          <Text style={styles.btnSaveText}>✦  Save This Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGhost} onPress={() => router.push('/plan/activity')} activeOpacity={0.8}>
          <Text style={styles.btnGhostText}>← Edit Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={handleCalendar} activeOpacity={0.8}>
          <Text style={styles.btnOutlineText}>📅  Add to Google Calendar</Text>
        </TouchableOpacity>
      </View>

      <SwapSheet visible={!!swapKey} swapKey={swapKey} plan={plan}
        onClose={() => setSwapKey(null)} onSwap={handleSwap} />
      <SaveModal visible={showSave}
        onViewSaved={() => { setShowSave(false); router.push('/(tabs)/saved'); }}
        onCalendar={() => { handleCalendar(); setShowSave(false); }}
        onKeepEditing={() => setShowSave(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  hero: { padding: 28, paddingTop: 40, paddingBottom: 24 },
  heroLabel: { fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.gold, marginBottom: 6 },
  heroTitle: { fontFamily: fonts.displayLight, fontSize: 32, color: colors.cream, lineHeight: 36, letterSpacing: -0.3 },
  heroMeta: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(251,247,242,0.55)', marginTop: 8 },
  heroPill: { marginTop: 12, backgroundColor: 'rgba(201,169,110,0.18)', borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5, alignSelf: 'flex-start' },
  heroPillText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.gold },
  timeline: { padding: 24, paddingBottom: 8 },
  tiRow: { flexDirection: 'row', gap: 14 },
  tiLeft: { alignItems: 'center', width: 40 },
  tiDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cream2, justifyContent: 'center', alignItems: 'center', ...shadow.sm, zIndex: 1 },
  tiEmoji: { fontSize: 18 },
  tiLine: { flex: 1, width: 2, backgroundColor: colors.cream2, marginTop: 4 },
  tiContent: { flex: 1, paddingBottom: 8 },
  tiTime: { fontFamily: fonts.bodySemiBold, fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.gray2, marginBottom: 2 },
  tiName: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal, marginBottom: 2 },
  tiSub: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginBottom: 8 },
  tiActions: { flexDirection: 'row', gap: 8 },
  empty: { padding: 44, alignItems: 'center' },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.gray2 },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.gray3, marginTop: 6, textAlign: 'center' },
  bbar: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 10, backgroundColor: colors.cream, gap: 8 },
  btnSave: { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 18, alignItems: 'center', marginBottom: 10 },
  btnSaveText: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.white },
  btnGhost: { backgroundColor: colors.cream2, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  btnGhostText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.charcoal },
  btnOutline: { borderRadius: 999, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray3, marginTop: 0 },
  btnOutlineText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.gray },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(44,37,32,0.6)', justifyContent: 'flex-end' },
  sheetBody: { backgroundColor: colors.cream, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.charcoal, marginBottom: 4 },
  sheetSub: { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginBottom: 20 },
  swapCard: { backgroundColor: colors.white, borderRadius: radius.sm, marginBottom: 10, ...shadow.sm },
  swapCardInner: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  swapCardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal },
  swapCardSub: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 2 },
  swapCardMeta: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  swapRating: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.gold2 },
  swapDist: { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, backgroundColor: colors.cream2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  swapTag: { fontFamily: fonts.body, fontSize: 11, color: colors.rose, backgroundColor: '#FDECEA', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  swapArrow: { fontSize: 20, color: colors.gray3 },
  cancelBtn: { marginTop: 8, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray3, borderRadius: 999 },
  cancelBtnText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.gray },
  saveOverlay: { flex: 1, backgroundColor: 'rgba(44,37,32,0.7)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  saveBox: { backgroundColor: colors.cream, borderRadius: radius.lg, padding: 40, width: '100%', alignItems: 'center' },
  saveIcon: { fontSize: 52, marginBottom: 16 },
  saveTitle: { fontFamily: fonts.display, fontSize: 34, color: colors.charcoal, textAlign: 'center', marginBottom: 8, lineHeight: 38 },
  saveSub: { fontFamily: fonts.body, fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  savePrimary: { width: '100%', backgroundColor: colors.charcoal, borderRadius: 999, paddingVertical: 18, alignItems: 'center', marginBottom: 10 },
  savePrimaryText: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.white },
  saveSecondary: { width: '100%', borderWidth: 1.5, borderColor: colors.gray3, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  saveSecondaryText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.gray },
  saveGhost: { width: '100%', backgroundColor: colors.cream2, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  saveGhostText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.charcoal },
});