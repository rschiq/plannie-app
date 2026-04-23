import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Linking, Modal, Image, ActivityIndicator, Dimensions,
  TextInput, KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Calendar from 'expo-calendar';
import { usePlan } from '../../hooks/usePlan';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow, VIBE_COLORS } from '../../constants/theme';
import { SmallButton } from '../../components/UI';
const SCREEN_W = Dimensions.get('window').width;
const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';


// ─────────────────────────────────────────────────────────────
// HELPER — is this plan in the past?
// ─────────────────────────────────────────────────────────────
function isPast(plan) {
  if (!plan.date) return false; // no raw date = treat as upcoming
  const planDate = new Date(plan.date + 'T00:00');
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  return planDate < today;
}

// ─────────────────────────────────────────────────────────────
// STAR RATING — inline tappable 1-5 stars
// ─────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  return (
    <View style={star.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7}>
          <Text style={[star.star, n <= value && star.starFilled]}>
            {n <= value ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const star = StyleSheet.create({
  row:        { flexDirection: 'row', gap: 4 },
  star:       { fontSize: 22, color: colors.gray3 },
  starFilled: { color: colors.gold },
});

// ─────────────────────────────────────────────────────────────
// NOTE MODAL — add / edit a memory note
// ─────────────────────────────────────────────────────────────
function NoteModal({ visible, plan, onSave, onClose }) {
  const [text, setText] = useState(plan?.note || '');

  function handleSave() {
    onSave(text.trim());
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={modal.overlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={modal.sheet}>
            <View style={modal.handle} />
            <Text style={modal.title}>📝 Add a Memory</Text>
            <Text style={modal.sub}>What made this night special?</Text>
            <TextInput
              style={modal.input}
              value={text}
              onChangeText={setText}
              placeholder="Write something about this night…"
              placeholderTextColor={colors.gray3}
              multiline
              numberOfLines={4}
              autoFocus
            />
            <TouchableOpacity style={modal.saveBtn} onPress={handleSave} activeOpacity={0.88}>
              <Text style={modal.saveBtnText}>Save Memory ✨</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modal.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={modal.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// MOMENT MODAL — pick favourite moment from the timeline
// ─────────────────────────────────────────────────────────────
function MomentModal({ visible, plan, onSave, onClose }) {
  const [picked, setPicked] = useState(plan?.favoriteMoment || '');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={modal.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={modal.sheet}>
          <View style={modal.handle} />
          <Text style={modal.title}>❤️ Favorite Moment</Text>
          <Text style={modal.sub}>Which part of the night stood out?</Text>
          <View style={{ gap: 10, marginBottom: 20 }}>
            {plan?.items?.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[modal.momentRow, picked === item && modal.momentRowActive]}
                onPress={() => setPicked(item)}
                activeOpacity={0.85}
              >
                <Text style={[modal.momentText, picked === item && modal.momentTextActive]}>
                  {item}
                </Text>
                {picked === item && <Text style={modal.momentCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={modal.saveBtn}
            onPress={() => { onSave(picked); onClose(); }}
            activeOpacity={0.88}
          >
            <Text style={modal.saveBtnText}>Save Moment ❤️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modal.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={modal.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(8,6,14,0.80)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: colors.cream2, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 24, paddingBottom: 40 },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray3, alignSelf: 'center', marginBottom: 20 },
  title:     { fontFamily: fonts.display, fontSize: 22, color: colors.charcoal, marginBottom: 4 },
  sub:       { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginBottom: 16 },
  input:     { backgroundColor: colors.cream3, borderRadius: radius.sm, padding: 14, fontFamily: fonts.body, fontSize: 14, color: colors.charcoal, minHeight: 100, textAlignVertical: 'top', marginBottom: 16 },
  saveBtn:   { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: '#F2EDE8' },
  cancelBtn:   { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontFamily: fonts.body, fontSize: 14, color: colors.gray2 },
  momentRow:       { backgroundColor: colors.cream3, borderRadius: radius.sm, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: 'transparent' },
  momentRowActive: { borderColor: colors.rose, backgroundColor: 'rgba(212,149,111,0.10)' },
  momentText:      { fontFamily: fonts.body, fontSize: 13, color: colors.gray, flex: 1 },
  momentTextActive:{ color: colors.charcoal, fontFamily: fonts.bodyMedium },
  momentCheck:     { fontSize: 16, color: colors.rose },
});

// ─────────────────────────────────────────────────────────────
// UPCOMING CARD — editable, action buttons, standard look
// ─────────────────────────────────────────────────────────────
function UpcomingCard({ plan, onOpen, onCalendar, onDelete, onFavorite }) {
  const vc = VIBE_COLORS[plan.vibe] || VIBE_COLORS.Custom;
  return (
    <View style={styles.upcomingCard}>
      <TouchableOpacity onPress={onOpen} activeOpacity={0.85}>
        <View>
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
            {plan.items.map((item, i) => (
              <Text key={i} style={styles.cardItem}>{item}</Text>
            ))}
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.cardFooter}>
        {/* Primary action — Open */}
        <TouchableOpacity style={styles.openBtn} onPress={onOpen} activeOpacity={0.85}>
          <Text style={styles.openBtnText}>Open</Text>
        </TouchableOpacity>
        {/* Secondary icon-only actions */}
        <View style={styles.iconActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={onFavorite} activeOpacity={0.8}>
            <Text style={styles.iconBtnText}>{plan.favorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onCalendar} activeOpacity={0.8}>
            <Text style={styles.iconBtnText}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={onDelete} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color="#E57373" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MEMORY CARD — past date, read-only, nostalgic warm design
// ─────────────────────────────────────────────────────────────
function MemoryCard({ plan, onNote, onRate, onMoment }) {
  return (
    <View style={styles.memCard}>
      {/* Warm gradient header */}
      <LinearGradient
        colors={['#2A1E14', '#1E1710']}
        style={styles.memHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.memHeaderTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.memTitle}>{plan.title}</Text>
            <Text style={styles.memDate}>{plan.dateDisplay} · {plan.city}</Text>
          </View>
          <View style={styles.memBadge}>
            <Text style={styles.memBadgeText}>✨ Memory</Text>
          </View>
        </View>

        {/* Favorite moment highlight */}
        {plan.favoriteMoment ? (
          <View style={styles.memMomentRow}>
            <Text style={styles.memMomentIcon}>❤️</Text>
            <Text style={styles.memMomentText}>{plan.favoriteMoment}</Text>
          </View>
        ) : null}
      </LinearGradient>

      {/* Timeline — read-only, warm toned */}
      <View style={styles.memBody}>
        {plan.items.map((item, i) => (
          <View key={i} style={styles.memTimelineRow}>
            <View style={styles.memDot} />
            <Text style={styles.memItem}>{item}</Text>
          </View>
        ))}

        {/* User note */}
        {plan.note ? (
          <View style={styles.memNoteBox}>
            <Text style={styles.memNoteLabel}>Your note</Text>
            <Text style={styles.memNoteText}>"{plan.note}"</Text>
          </View>
        ) : null}

        {/* Star rating display */}
        {plan.rating > 0 && (
          <View style={styles.memRatingRow}>
            <StarRating value={plan.rating} onChange={onRate} />
            <Text style={styles.memRatingLabel}>You rated this night</Text>
          </View>
        )}

        {/* Nostalgic sign-off */}
        <Text style={styles.memSignOff}>You lived this night ✨</Text>
      </View>

      {/* Memory actions */}
      <View style={styles.memActions}>
        <TouchableOpacity style={styles.memAction} onPress={onNote} activeOpacity={0.8}>
          <Text style={styles.memActionIcon}>📝</Text>
          <Text style={styles.memActionLabel}>{plan.note ? 'Edit Note' : 'Add Note'}</Text>
        </TouchableOpacity>

        <View style={styles.memActionDivider} />

        <View style={styles.memAction}>
          <StarRating value={plan.rating} onChange={onRate} />
          <Text style={styles.memActionLabel}>Rate</Text>
        </View>

        <View style={styles.memActionDivider} />

        <TouchableOpacity style={styles.memAction} onPress={onMoment} activeOpacity={0.8}>
          <Text style={styles.memActionIcon}>❤️</Text>
          <Text style={styles.memActionLabel}>{plan.favoriteMoment ? 'Change' : 'Moment'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────
function SectionHeader({ label, count, sub }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionLabel}>{label}</Text>
        {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
      </View>
      <View style={styles.sectionCount}>
        <Text style={styles.sectionCountText}>{count}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────

// ── Place Detail Sheet for saved single places ────────────────
function SavedPlaceDetailSheet({ place, visible, onClose }) {
  const insets  = useSafeAreaInsets();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !place?.id) return;
    setDetails(null);
    setLoading(true);
    fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.id}&fields=name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,photos&key=${GOOGLE_API_KEY}`
    )
      .then(r => r.json())
      .then(d => { if (d.result) setDetails(d.result); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, place?.id]);

  if (!place) return null;

  const photos  = details?.photos || [];
  const phone   = details?.formatted_phone_number;
  const website = details?.website;
  const address = details?.formatted_address || place.address;

  function buildPhoto(ref) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ds.overlay}>
        <View style={[ds.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={ds.handle} />

          {/* Photos */}
          {loading ? (
            <View style={ds.photoPlaceholder}>
              <ActivityIndicator color={colors.rose} />
            </View>
          ) : photos.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={ds.photoScroll}>
              {photos.slice(0, 5).map((ph, i) => (
                <Image key={i} source={{ uri: buildPhoto(ph.photo_reference) }}
                  style={[ds.photo, { width: SCREEN_W }]} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : place.photoUrl ? (
            <Image source={{ uri: place.photoUrl }} style={[ds.photo, { width: SCREEN_W }]} resizeMode="cover" />
          ) : (
            <View style={ds.photoPlaceholder}><Text style={ds.photoIcon}>📍</Text></View>
          )}

          <ScrollView style={ds.body} showsVerticalScrollIndicator={false}>
            <Text style={ds.name}>{place.name}</Text>
            {place.category ? <Text style={ds.category}>{place.category}</Text> : null}

            {place.rating ? (
              <View style={ds.ratingRow}>
                <Text style={ds.rating}>⭐ {place.rating}</Text>
                {place.totalRatings > 0 && (
                  <Text style={ds.reviews}>({place.totalRatings.toLocaleString()} reviews)</Text>
                )}
              </View>
            ) : null}

            {place.distance ? (
              <View style={ds.row}>
                <Text style={ds.rowIcon}>🚗</Text>
                <Text style={ds.rowText}>{place.distance} mi away</Text>
              </View>
            ) : null}

            {address ? (
              <View style={ds.row}>
                <Text style={ds.rowIcon}>📍</Text>
                <Text style={ds.rowText}>{address}</Text>
              </View>
            ) : null}

            {phone ? (
              <TouchableOpacity style={ds.row} onPress={() => Linking.openURL(`tel:${phone}`)}>
                <Text style={ds.rowIcon}>📞</Text>
                <Text style={[ds.rowText, ds.link]}>{phone}</Text>
              </TouchableOpacity>
            ) : null}

            {website ? (
              <TouchableOpacity style={ds.row} onPress={() => Linking.openURL(website)}>
                <Text style={ds.rowIcon}>🌐</Text>
                <Text style={[ds.rowText, ds.link]} numberOfLines={1}>{website}</Text>
              </TouchableOpacity>
            ) : null}

            <View style={ds.divider} />

            {/* Share button */}
            <TouchableOpacity
              style={ds.shareBtn}
              onPress={async () => {
                try {
                  const msg = `Check out ${place.name}!\n📍 ${address || place.address}\n⭐ ${place.rating || 'N/A'}${place.location?.lat ? `\n📌 https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}` : ''}`;
                  await Share.share({ message: msg, title: place.name });
                } catch (e) { console.log('Share error:', e.message); }
              }}
              activeOpacity={0.85}
            >
              <Text style={ds.shareBtnText}>🔗 Share this Place</Text>
            </TouchableOpacity>

            {place.location?.lat ? (
              <TouchableOpacity style={ds.mapsBtn} onPress={() =>
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}&query_place_id=${place.id}`)
              } activeOpacity={0.85}>
                <Text style={ds.mapsBtnText}>🗺️ Open in Maps</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={ds.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={ds.closeBtnText}>← Back to Saved</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const ds = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', overflow: 'hidden' },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray3, alignSelf: 'center', marginTop: 12 },
  photoScroll:  { height: 220 },
  photo:        { height: 220 },
  photoPlaceholder: { height: 120, backgroundColor: colors.gray4, alignItems: 'center', justifyContent: 'center' },
  photoIcon:    { fontSize: 40 },
  body:         { padding: 20 },
  name:         { fontFamily: fonts.display, fontSize: 24, color: colors.charcoal, marginBottom: 4 },
  category:     { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginBottom: 10 },
  ratingRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  rating:       { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.charcoal },
  reviews:      { fontFamily: fonts.body, fontSize: 13, color: colors.gray2 },
  row:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  rowIcon:      { fontSize: 16, width: 22 },
  rowText:      { fontFamily: fonts.body, fontSize: 14, color: colors.gray, flex: 1, lineHeight: 20 },
  link:         { color: colors.rose },
  divider:      { height: 1, backgroundColor: colors.gray4, marginVertical: 16 },
  shareBtn:     { backgroundColor: '#1A0F30', borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(212,149,111,0.3)' },
  shareBtnText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.gold },
  mapsBtn:      { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  mapsBtnText:  { fontFamily: fonts.bodyMedium, fontSize: 15, color: '#F2EDE8' },
  closeBtn:     { borderRadius: 999, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray4 },
  closeBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.gray2 },
});

export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { savedPlans, deletePlan, toggleFavorite, updatePlanMeta, updatePlan } = usePlan();

  const [noteTarget,     setNoteTarget]     = useState(null);
  const [momentTarget,   setMomentTarget]   = useState(null);
  const [selectedPlace,  setSelectedPlace]  = useState(null);
  const [showPlaceDetail, setShowPlaceDetail] = useState(false);

  // Deduplicate by id before splitting — guards against duplicate ids in persisted data
  const seenIds = new Set();
  const uniquePlans = savedPlans.filter(p => {
    if (!p.id || seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });

  // Split into upcoming / past
  const upcoming = uniquePlans.filter((p) => !isPast(p));
  const past     = uniquePlans.filter((p) =>  isPast(p));

  async function openCalendar(plan) {
    const baseStart = plan?.date
      ? new Date(`${plan.date}T19:00:00`)
      : new Date(Date.now() + 60 * 60 * 1000);
    const startDate = Number.isNaN(baseStart.getTime())
      ? new Date(Date.now() + 60 * 60 * 1000)
      : baseStart;
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const eventData = {
      title: plan?.title || 'Plannie Date Night',
      location: plan?.city || '',
      notes: 'Planned with Plannie 💕',
      startDate,
      endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const title = encodeURIComponent(eventData.title);
    const loc = encodeURIComponent(eventData.location);
    const details = encodeURIComponent(eventData.notes);
    const dates = `${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`;
    const fallbackUrl = `https://calendar.google.com/calendar/r/eventedit?text=${title}&location=${loc}&details=${details}&dates=${dates}`;

    try {
      if (typeof Calendar.createEventInCalendarAsync === 'function') {
        await Calendar.createEventInCalendarAsync(eventData);
        return;
      }
      await Linking.openURL(fallbackUrl);
    } catch {
      Linking.openURL(fallbackUrl).catch(() => Alert.alert('Could not open Calendar'));
    }
  }

  function confirmDelete(id) {
    Alert.alert('Delete Plan', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlan(id) },
    ]);
  }

  const isEmpty = savedPlans.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Your{'\n'}<Text style={styles.titleItalic}>Timeline.</Text></Text>
        <Text style={styles.subtitle}>Every date, beautifully remembered.</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>

        {isEmpty ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🌟</Text>
            <Text style={styles.emptyTitle}>Your timeline is empty.</Text>
            <Text style={styles.emptySub}>Plan your first date to start your story.</Text>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => router.push('/plan/details')}
              activeOpacity={0.88}
            >
              <Text style={styles.startBtnText}>✦ Start Planning</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Upcoming ── */}
            {upcoming.length > 0 && (
              <>
                <SectionHeader
                  label="📅 Upcoming Dates"
                  count={upcoming.length}
                  sub="Tap to edit or reschedule"
                />
                {upcoming.map((p) => (
                  <UpcomingCard
                    key={p.id}
                    plan={p}
                    onOpen={() => {
                      if (p.placeData) {
                        // Single-place save (from results screen) → show detail sheet
                        setSelectedPlace(p.placeData);
                        setShowPlaceDetail(true);
                      } else if (p.activity || p.food) {
                        // Full plan save (from cart/surprise) → restore & go to cart
                        updatePlan({
                          activity:  p.activity  || null,
                          food:      p.food      || null,
                          addonType: p.addonType || null,
                          addonItem: p.addonItem || null,
                          city:      p.city      || '',
                          vibe:      p.vibe      || null,
                          group:     p.group     || null,
                          moment:    p.moment    || null,
                          category:  p.category  || null,
                          coords:    p.coords    || null,
                          date:      p.date      || '',
                          dateDisplay: p.dateDisplay || '',
                        });
                        // Small delay to let state update before navigating
                        setTimeout(() => router.push('/plan/cart'), 50);
                      } else {
                        // Legacy save with no place data — just go to cart
                        router.push('/plan/cart');
                      }
                    }}
                    onCalendar={() => void openCalendar(p)}
                    onDelete={() => confirmDelete(p.id)}
                    onFavorite={() => toggleFavorite(p.id)}
                  />
                ))}
              </>
            )}

            {/* ── Past / Memories ── */}
            {past.length > 0 && (
              <>
                <SectionHeader
                  label="✨ Past Dates"
                  count={past.length}
                  sub="Your relationship memories"
                />
                {past.map((p) => (
                  <MemoryCard
                    key={p.id}
                    plan={p}
                    onNote={() => setNoteTarget(p)}
                    onRate={(rating) => updatePlanMeta(p.id, { rating })}
                    onMoment={() => setMomentTarget(p)}
                  />
                ))}
              </>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Note Modal ── */}
      <NoteModal
        visible={!!noteTarget}
        plan={noteTarget}
        onSave={(note) => updatePlanMeta(noteTarget.id, { note })}
        onClose={() => setNoteTarget(null)}
      />

      {/* ── Moment Modal ── */}
      <MomentModal
        visible={!!momentTarget}
        plan={momentTarget}
        onSave={(favoriteMoment) => updatePlanMeta(momentTarget.id, { favoriteMoment })}
        onClose={() => setMomentTarget(null)}
      />

      {/* ── Saved Place Detail Sheet ── */}
      <SavedPlaceDetailSheet
        place={selectedPlace}
        visible={showPlaceDetail}
        onClose={() => { setShowPlaceDetail(false); setSelectedPlace(null); }}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.cream },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },

  // ── Page header ───────────────────────────────────────────
  header:       { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16 },
  title:        { fontFamily: fonts.display, fontSize: 40, color: colors.charcoal, lineHeight: 44 },
  titleItalic:  { fontFamily: fonts.displayItalic, color: colors.rose },
  subtitle:     { fontFamily: fonts.body, fontSize: 14, color: colors.gray2, marginTop: 6 },

  // ── Section header ────────────────────────────────────────
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 12 },
  sectionLabel:  { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.charcoal },
  sectionSub:    { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, marginTop: 2 },
  sectionCount:  { backgroundColor: colors.cream2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  sectionCountText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.gold },

  // ── Upcoming card ─────────────────────────────────────────
  upcomingCard:  { backgroundColor: colors.cream2, borderRadius: radius.md, marginBottom: 14, overflow: 'hidden', ...shadow.sm },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.gray4, gap: 10 },
  cardTitle:     { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal },
  cardDate:      { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 3 },
  vibeBadge:     { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  vibeBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody:      { padding: 16, paddingTop: 12, gap: 5 },
  cardItem:      { fontFamily: fonts.body, fontSize: 13, color: colors.gray },
  cardFooter:    { flexDirection: 'row', gap: 8, padding: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.gray4, alignItems: 'center', justifyContent: 'space-between' },
  // Primary Open button
  openBtn:       { flex: 1, backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  openBtnText:   { fontFamily: fonts.bodyMedium, fontSize: 14, color: '#F2EDE8' },
  // Icon-only secondary actions
  iconActions:   { flexDirection: 'row', gap: 6 },
  iconBtn:       { width: 38, height: 38, borderRadius: 999, backgroundColor: colors.cream2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.gray4 },
  iconBtnDanger: { backgroundColor: 'rgba(255,100,100,0.08)', borderColor: 'rgba(255,100,100,0.20)' },
  iconBtnText:   { fontSize: 16 },

  // ── Memory card ───────────────────────────────────────────
  memCard:       { borderRadius: radius.md, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201,169,110,0.18)', ...shadow.sm },

  // Warm gradient header
  memHeader:    { padding: 20, paddingBottom: 16 },
  memHeaderTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  memTitle:     { fontFamily: fonts.display, fontSize: 20, color: '#F0E8DC', lineHeight: 24, marginBottom: 4 },
  memDate:      { fontFamily: fonts.body, fontSize: 12, color: 'rgba(240,232,220,0.55)' },
  memBadge:     { backgroundColor: 'rgba(201,169,110,0.18)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)' },
  memBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: colors.gold, letterSpacing: 0.4 },

  // Favorite moment in header
  memMomentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(212,149,111,0.10)', borderRadius: 8, padding: 10 },
  memMomentIcon:{ fontSize: 14 },
  memMomentText:{ fontFamily: fonts.bodyMedium, fontSize: 12, color: '#F0E8DC', flex: 1 },

  // Memory body
  memBody:        { backgroundColor: '#161210', padding: 18, gap: 8 },
  memTimelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(201,169,110,0.45)', flexShrink: 0 },
  memItem:        { fontFamily: fonts.body, fontSize: 13, color: 'rgba(240,232,220,0.65)', flex: 1 },

  // User note
  memNoteBox:    { backgroundColor: 'rgba(201,169,110,0.07)', borderRadius: 8, padding: 12, borderLeftWidth: 2, borderLeftColor: 'rgba(201,169,110,0.35)', marginTop: 4 },
  memNoteLabel:  { fontFamily: fonts.bodySemiBold, fontSize: 10, color: colors.gold, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  memNoteText:   { fontFamily: fonts.displayLightItalic, fontSize: 14, color: 'rgba(240,232,220,0.80)', lineHeight: 20 },

  // Rating row
  memRatingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  memRatingLabel:{ fontFamily: fonts.body, fontSize: 11, color: colors.gray2 },

  // Sign off
  memSignOff:    { fontFamily: fonts.displayLightItalic, fontSize: 13, color: 'rgba(201,169,110,0.50)', textAlign: 'center', marginTop: 8 },

  // Memory actions bar
  memActions:        { backgroundColor: '#1A1610', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(201,169,110,0.12)' },
  memAction:         { alignItems: 'center', gap: 4, flex: 1 },
  memActionIcon:     { fontSize: 18 },
  memActionLabel:    { fontFamily: fonts.body, fontSize: 10, color: colors.gray2, letterSpacing: 0.3 },
  memActionDivider:  { width: 1, height: 32, backgroundColor: 'rgba(201,169,110,0.12)' },

  // ── Empty state ───────────────────────────────────────────
  empty:       { paddingTop: 60, alignItems: 'center' },
  emptyIcon:   { fontSize: 48, marginBottom: 14 },
  emptyTitle:  { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.gray2 },
  emptySub:    { fontFamily: fonts.body, fontSize: 13, color: colors.gray3, marginTop: 6, textAlign: 'center' },
  startBtn:    { marginTop: 24, backgroundColor: colors.rose, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 16 },
  startBtnText:{ fontFamily: fonts.bodyMedium, fontSize: 15, color: '#F2EDE8' },
});