import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Image, Modal, Share, Linking } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius } from '../../constants/theme';
import { fetchPlaceDetails, getPlacesByCategory } from '../../services/placesService';
import RizzLoader from '../../components/RizzLoader';
import { minLoadingDisplaySince } from '../../utils/minLoadingDisplay';
import { addExtraRuns, consumeRunIfAvailable } from '../../utils/runLimiter';
import PaywallModal from '../../components/PaywallModal';

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';

export default function SurpriseActivity() {
  const router = useRouter();
  const { plan } = usePlan();
  const insets = useSafeAreaInsets();
  console.log('PLAN DATA:', plan);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [expandedSearch, setExpandedSearch] = useState(false);

  const generateActivity = useCallback(async (expanded = false) => {
    setLoading(true);
    setActivity(null);
    setNeedsLocation(false);
    setExpandedSearch(expanded);
    const startTime = Date.now();

    try {
      let lat;
      let lng;
      const locationText = (plan.city || plan.location || plan.selectedArea || '').trim();

      if (plan.coords?.lat && plan.coords?.lng) {
        lat = plan.coords.lat;
        lng = plan.coords.lng;
      } else if (locationText) {
        console.log('Missing coords, fallback to city');
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationText)}&key=${GOOGLE_API_KEY}`
        );
        const geoData = await geoRes.json();
        if (geoData.status !== 'OK') {
          setNeedsLocation(true);
          await minLoadingDisplaySince(startTime);
          setLoading(false);
          return;
        }
        lat = geoData.results[0].geometry.location.lat;
        lng = geoData.results[0].geometry.location.lng;
      } else {
        setNeedsLocation(true);
        await minLoadingDisplaySince(startTime);
        setLoading(false);
        return;
      }

      const selectedArea = (locationText || '').split(',')[0].trim();
      const runGate = await consumeRunIfAvailable();
      if (!runGate.allowed) {
        setShowPaywall(true);
        await minLoadingDisplaySince(startTime);
        setLoading(false);
        return;
      }

      const places = await getPlacesByCategory('activity', { lat, lng }, {
        radius: expanded ? 30000 : 8000,
        maxResults: 24,
        selectedArea: expanded ? '' : selectedArea,
        budget: plan.budget,
      });

      if (places.length > 0) {
        const pick = places[Math.floor(Math.random() * places.length)];
        setActivity(pick);
      }
    } catch (err) {
      console.log('[Surprise]', err);
    }

    await minLoadingDisplaySince(startTime);
    setLoading(false);
  }, [plan.coords?.lat, plan.coords?.lng, plan.city, plan.location, plan.selectedArea, plan.budget]);

  useEffect(() => {
    generateActivity();
  }, [generateActivity]);

  async function openDetails() {
    if (!activity?.id) return;
    setDetailsVisible(true);
    setDetailsLoading(true);
    const full = await fetchPlaceDetails(activity.id);
    setDetails(full);
    setDetailsLoading(false);
  }

  async function handleShare() {
    if (!activity) return;
    const mapsUrl = activity.location?.lat && activity.location?.lng
      ? `https://www.google.com/maps/search/?api=1&query=${activity.location.lat},${activity.location.lng}&query_place_id=${activity.id || ''}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.name)}`;
    await Share.share({
      message: `${activity.name}\n${activity.address || activity.shortLocation || ''}\n${mapsUrl}`,
      title: 'Surprise Activity',
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.topActionBtn}>
            <Text style={styles.backLabel}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loaderFlex}>
          <RizzLoader embedded />
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.topActionBtn}>
            <Text style={styles.backLabel}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.title}>{needsLocation ? 'You need to select a location first' : 'No activity found'}</Text>
          <Text style={styles.muted}>
            {needsLocation
              ? 'Please set your city or location in Planning, then try Surprise again.'
              : 'We could not find a match nearby. Try again or set a different area in your plan.'}
          </Text>
          <View style={styles.actionRow}>
            {needsLocation ? (
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => router.push('/plan/details')} activeOpacity={0.85}>
                <Text style={styles.actionPrimaryLabel}>Go to Planning</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => generateActivity(false)} activeOpacity={0.85}>
                <Text style={styles.actionPrimaryLabel}>Try Again</Text>
              </TouchableOpacity>
            )}
            {!needsLocation && !expandedSearch && (
              <TouchableOpacity style={styles.actionBtnGhost} onPress={() => generateActivity(true)} activeOpacity={0.85}>
                <Text style={styles.actionGhostLabel}>Expand Search</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionBtnGhost} onPress={() => router.back()} activeOpacity={0.85}>
              <Text style={styles.actionGhostLabel}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.topActionBtn}>
            <Text style={styles.backLabel}>← Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heading}>🎯 Surprise Activity</Text>

        <View style={styles.card}>
          {activity.photoUrl ? (
            <Image source={{ uri: activity.photoUrl }} style={styles.heroImage} />
          ) : null}
          <Text style={styles.name}>{activity.name}</Text>
          {activity.rating != null && (
            <Text style={styles.gold}>
              ⭐ {activity.rating} ({activity.totalRatings ?? 0} reviews)
            </Text>
          )}
          <Text style={styles.address}>
            {activity.shortLocation || activity.address || ''}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => generateActivity(false)} activeOpacity={0.85}>
            <Text style={styles.actionPrimaryLabel}>Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnGhost} onPress={openDetails} activeOpacity={0.85}>
            <Text style={styles.actionGhostLabel}>View Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtnGhostWide} onPress={handleShare} activeOpacity={0.85}>
            <Text style={styles.actionGhostLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnGhostWide} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.actionGhostLabel}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={detailsVisible} animationType="slide" onRequestClose={() => setDetailsVisible(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => setDetailsVisible(false)} activeOpacity={0.8} style={styles.topActionBtn}>
              <Text style={styles.backLabel}>← Back</Text>
            </TouchableOpacity>
            {activity?.location?.lat && activity?.location?.lng ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${activity.location.lat},${activity.location.lng}&query_place_id=${activity.id || ''}`)}
                activeOpacity={0.8}
                style={styles.topActionBtn}
              >
                <Text style={styles.backLabel}>Open Maps</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {detailsLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={styles.muted}>Loading details...</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.modalBody}>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carousel}>
                {(details?.photos?.length ? details.photos : (activity?.photoUrl ? [activity.photoUrl] : [])).map((uri, idx) => (
                  <Image key={`${uri}_${idx}`} source={{ uri }} style={styles.carouselImage} />
                ))}
              </ScrollView>

              <Text style={styles.modalTitle}>{details?.name || activity?.name || ''}</Text>
              {details?.rating != null ? (
                <Text style={styles.gold}>⭐ {details.rating} ({details.totalRatings || 0} reviews)</Text>
              ) : null}
              <Text style={styles.address}>{details?.formattedAddress || activity?.address || activity?.shortLocation || ''}</Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => {
          console.log('[Paywall] upgrade clicked');
          setShowPaywall(false);
        }}
        onGet20MorePlans={async () => {
          await addExtraRuns(20);
          setShowPaywall(false);
        }}
        onGet50MorePlans={async () => {
          await addExtraRuns(50);
          setShowPaywall(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.cream },
  loaderFlex: { flex: 1, minHeight: 0, width: '100%' },
  topBar:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 20 },
  topActionBtn: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
  backLabel:  { color: colors.gold, fontFamily: fonts.bodySemiBold, fontSize: 15 },
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  content:    { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  heading:    { fontSize: 28, color: colors.charcoal, marginBottom: 20, fontFamily: fonts.display },
  title:      { fontSize: 20, color: colors.charcoal, marginBottom: 12, textAlign: 'center', fontFamily: fonts.bodySemiBold },
  muted:      { color: colors.gray, marginTop: 8, textAlign: 'center', lineHeight: 22, fontFamily: fonts.body },
  card:       { backgroundColor: colors.cream2, padding: 16, borderRadius: radius.md },
  heroImage:  { width: '100%', height: 180, borderRadius: radius.sm, marginBottom: 12 },
  name:       { fontSize: 20, color: colors.charcoal, fontFamily: fonts.bodySemiBold },
  gold:       { color: colors.gold, marginTop: 8, fontFamily: fonts.body },
  address:    { color: colors.gray, marginTop: 8, fontFamily: fonts.body, lineHeight: 22 },
  actionRow:  { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtnPrimary: {
    flex: 1,
    marginTop: 28,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radius.md,
  },
  actionBtnGhost: {
    flex: 1,
    marginTop: 28,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  actionBtnGhostWide: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray3,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  actionPrimaryLabel: { textAlign: 'center', color: '#1a1525', fontFamily: fonts.bodySemiBold },
  actionGhostLabel: { textAlign: 'center', color: colors.charcoal, fontFamily: fonts.bodySemiBold },
  modalSafe:   { flex: 1, backgroundColor: colors.cream },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  modalBody:   { padding: 20, paddingBottom: 36 },
  carousel:    { width: '100%', marginBottom: 16 },
  carouselImage: { width: 320, height: 220, borderRadius: radius.md, marginRight: 12, backgroundColor: colors.cream2 },
  modalTitle:  { fontSize: 24, color: colors.charcoal, fontFamily: fonts.display, marginBottom: 8 },
});
