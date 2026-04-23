import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../constants/theme';
import { useSavedPlaces } from '../../hooks/useSavedPlaces';
import { usePlan } from '../../hooks/usePlan';
import ResultsPlaceCard from '../../components/ResultsPlaceCard';

function PlanSwipeRow({ children, onDelete }) {
  const translateX = useState(() => new Animated.Value(0))[0];
  const [open, setOpen] = useState(false);

  const animateTo = (toValue) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  const panResponder = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => {
      if (g.dx > 0) return;
      const next = Math.max(g.dx, -104);
      translateX.setValue(next);
    },
    onPanResponderRelease: (_, g) => {
      const shouldOpen = g.dx < -48 || g.vx < -0.4;
      setOpen(shouldOpen);
      animateTo(shouldOpen ? -104 : 0);
    },
    onPanResponderTerminate: () => {
      animateTo(open ? -104 : 0);
    },
  }))[0];

  return (
    <View style={styles.swipeWrap}>
      <TouchableOpacity style={styles.deleteAction} onPress={onDelete} activeOpacity={0.85}>
        <Ionicons name="trash-outline" size={18} color="#F2EDE8" />
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { saved, savePlace, removePlace } = useSavedPlaces();
  const { savedPlans, toggleSpecialDate, deletePlan } = usePlan();
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(''), 1800);
    return () => clearTimeout(timer);
  }, [feedback]);

  const isFavorite = (item) => {
    return saved.some((p) => p.place_id === item.place_id);
  };

  const toggleFavorite = (item) => {
    if (isFavorite(item)) {
      removePlace(item.place_id);
    } else {
      savePlace(item);
    }
  };

  const handleDeletePlan = (id) => {
    deletePlan(id);
    setFeedback('Removed from saved');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Places</Text>
      </View>
      {feedback ? (
        <View style={styles.feedbackBar}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {saved.length === 0 ? (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyText}>No saved places yet</Text>
          </View>
        ) : (
          <>
            {saved.map((item) => (
            <ResultsPlaceCard
              key={item.place_id}
              place={item}
              onPress={() => {}}
              variant="default"
              isFavorite={isFavorite(item)}
              onToggleFavorite={toggleFavorite}
              showFavorite
            />
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Saved Timeline Plans</Text>
        {savedPlans.length > 0 ? (
          <>
            {savedPlans.map((plan) => (
              <PlanSwipeRow key={plan.id} onDelete={() => handleDeletePlan(plan.id)}>
                <View style={styles.planCard}>
                  <View style={styles.planTopRow}>
                    <Text style={styles.planTitle} numberOfLines={1}>{plan.title}</Text>
                    <Text style={styles.planMeta}>{plan.dateDisplay || 'Upcoming'}</Text>
                  </View>
                  {plan.city ? <Text style={styles.planCity}>{plan.city}</Text> : null}
                  <Text style={styles.planItems} numberOfLines={2}>
                    {(plan.items || []).join(' • ')}
                  </Text>
                  <Text style={styles.specialBtn} onPress={() => toggleSpecialDate(plan.id)}>
                    {plan.isSpecialDate ? '💍 Unmark Special' : '💍 Mark Special'}
                  </Text>
                </View>
              </PlanSwipeRow>
            ))}
          </>
        ) : (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyText}>No saved plans yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.gray4 },
  title: { fontFamily: fonts.display, fontSize: 32, color: colors.charcoal },
  feedbackBar: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 2,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1C1628',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.22)',
  },
  feedbackText: { fontFamily: fonts.body, fontSize: 12, color: '#F2EDE8', textAlign: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyInline: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  emptyText: { fontFamily: fonts.body, fontSize: 16, color: colors.gray2 },
  sectionTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.gray2, marginTop: 10, marginBottom: 12 },
  swipeWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  planCard: {
    backgroundColor: colors.cream2,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray4,
  },
  planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  planTitle: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.charcoal },
  planMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.gray2 },
  planCity: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 3 },
  planItems: { fontFamily: fonts.body, fontSize: 12, color: colors.gray, marginTop: 6, lineHeight: 18 },
  specialBtn: { marginTop: 10, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.rose },
  deleteAction: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 104,
    borderRadius: 12,
    backgroundColor: '#A93F4D',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteActionText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: '#F2EDE8' },
});