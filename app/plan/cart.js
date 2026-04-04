import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert, Linking, Share, ActivityIndicator, Switch, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlan } from '../../hooks/usePlan';
import { colors, fonts, radius, shadow } from '../../constants/theme';
import { ACTIVITIES, RESTAURANTS, ADDONS } from '../../data';
import { getPlacesByVibe } from '../../services/placesService';

// ─── Item Action Sheet ───────────────────────────────────────
function ItemActionSheet({ visible, item, onClose, onSwap, onRemove }) {
  if (!item) return null;

  function openInMaps() {
    if (item.location?.lat && item.location?.lng) {
      const url = 'https://www.google.com/maps/search/?api=1&query=' +
        item.location.lat + ',' + item.location.lng +
        '&query_place_id=' + (item.id || '');
      Linking.openURL(url);
    } else {
      const query = encodeURIComponent(item.name + ' ' + (item.address || ''));
      Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + query);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <Text style={styles.detailName}>{item.name}</Text>
          <Text style={styles.detailCategory}>{item.sub || item.type || ''}</Text>

          {item.rating && (
            <View style={styles.detailRatingRow}>
              <Text style={styles.detailRating}>⭐ {item.rating}</Text>
              {item.totalRatings > 0 && (
                <Text style={styles.detailReviews}>({item.totalRatings.toLocaleString()} reviews)</Text>
              )}
            </View>
          )}

          {item.address && (
            <View style={styles.detailAddressRow}>
              <Text style={styles.detailAddressIcon}>📍</Text>
              <Text style={styles.detailAddress}>{item.address}</Text>
            </View>
          )}

          {/* ✅ detailRow now defined in StyleSheet below */}
          {item.distance != null && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🚗</Text>
              <Text style={styles.detailAddress}>{item.distance} mi away</Text>
            </View>
          )}

          <View style={styles.detailDivider} />

          <TouchableOpacity style={styles.btnPrimary} onPress={openInMaps} activeOpacity={0.88}>
            <Text style={styles.btnPrimaryText}>🗺️ Open in Maps</Text>
          </TouchableOpacity>

          <View style={styles.rowActions}>
            <TouchableOpacity style={styles.btnSecondary} onPress={onSwap} activeOpacity={0.8}>
              <Text style={styles.btnSecondaryText}>🔄 Swap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSecondary, { borderWidth: 1, borderColor: 'rgba(212,149,111,0.3)' }]}
              onPress={onRemove} activeOpacity={0.8}
            >
              <Text style={[styles.btnSecondaryText, { color: colors.rose }]}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Swap Sheet ──────────────────────────────────────────────
function SwapSheet({ visible, swapKey, plan, onClose, onSwap }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const VIBE_MAP = { Chill: 'chill', Fun: 'fun', Romantic: 'romantic', Adventure: 'adventure' };

  useEffect(() => {
    if (!visible || !swapKey) return;
    fetchSwapItems();
  }, [visible, swapKey]);

  async function fetchSwapItems() {
    setLoading(true);
    try {
      const city = plan.city || 'Los Angeles';
      const geoUrl = 'https://maps.googleapis.com/maps/api/geocode/json?' +
        'address=' + encodeURIComponent(city) + '&key=AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8';
      const geoRes  = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (geoData.status === 'OK') {
        const { lat, lng } = geoData.results[0].geometry.location;

        if (swapKey === 'addon') {
          const types = ['flowers', 'dessert', 'scenic'].filter((t) => t !== plan.addonType);
          const addonOverride = {
            flowers: { type: 'florist',            keyword: 'flower shop' },
            dessert: { type: 'bakery',             keyword: 'dessert sweets' },
            scenic:  { type: 'tourist_attraction', keyword: 'scenic spot park' },
          };
          const results = await Promise.all(types.map(async (t) => {
            const o = addonOverride[t];
            const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?' +
              'location=' + lat + ',' + lng + '&radius=8000&type=' + o.type +
              '&keyword=' + encodeURIComponent(o.keyword) + '&key=AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8';
            const res  = await fetch(url);
            const data = await res.json();
            const p    = data.results?.[0];
            if (!p) return { ...ADDONS[t][0], _addonType: t };
            return {
              id: p.place_id, name: p.name, type: t,
              note: p.opening_hours?.open_now ? 'Open now' : 'Nearby',
              rating: p.rating ? parseFloat(p.rating).toFixed(1) : '4.0',
              dist: '', tag: p.rating >= 4.5 ? 'Highly rated' : 'Nearby',
              _addonType: t,
            };
          }));
          setItems(results);
          setLoading(false);
          return;
        }

        const vibe      = VIBE_MAP[plan.vibe] || 'romantic';
        const fetchVibe = swapKey === 'food' ? 'foodie' : vibe;
        const places    = await getPlacesByVibe(fetchVibe, { lat, lng }, { radius: 8000, maxResults: 15 });

        const filtered = places
          .filter((p) => p.id !== plan.activity?.id && p.id !== plan.food?.id)
          .filter((p) => (p.rating || 0) >= 4.0 && (p.totalRatings || 0) >= 50)
          .sort((a, b) => {
            const scoreA = (a.rating || 0) * Math.log(Math.max(a.totalRatings || 1, 1));
            const scoreB = (b.rating || 0) * Math.log(Math.max(b.totalRatings || 1, 1));
            return scoreB - scoreA;
          })
          .slice(0, 10);

        const finalList = filtered.length > 0
          ? filtered
          : places.filter((p) => p.id !== plan.activity?.id && p.id !== plan.food?.id).slice(0, 5);

        const mapped = finalList.map((p) => ({
          id: p.id, name: p.name,
          type: p.types?.[0]?.replace(/_/g, ' ') || 'Place',
          cuisine: p.types?.[0]?.replace(/_/g, ' ') || 'Restaurant',
          note: p.isOpenNow === true ? 'Open now' : 'Nearby',
          rating: p.rating ? parseFloat(p.rating).toFixed(1) : '4.0',
          dist: '', tag: p.rating >= 4.5 ? 'Highly rated' : 'Nearby',
        }));
        setItems(mapped);
      }
    } catch (e) {
      const vibe     = plan.vibe || 'Romantic';
      const fallback = swapKey === 'activity'
        ? (ACTIVITIES[vibe] || []).filter((a) => a.id !== plan.activity?.id).slice(0, 3)
        : swapKey === 'food'
        ? (RESTAURANTS[vibe] || []).filter((r) => r.id !== plan.food?.id).slice(0, 3)
        : ['flowers', 'dessert', 'scenic']
            .filter((t) => t !== plan.addonType)
            .map((t) => ({ ...ADDONS[t][0], _addonType: t }));
      setItems(fallback);
    }
    setLoading(false);
  }

  if (!swapKey) return null;
  const title = swapKey === 'activity' ? 'Swap Activity'
              : swapKey === 'food'     ? 'Swap Restaurant'
              :                          'Swap Add-On';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { maxHeight: '80%' }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetName}>{title}</Text>
          <Text style={styles.sheetSub}>Choose a different option nearby</Text>

          {loading ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.rose} />
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginTop: 10 }}>
                Finding alternatives…
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.swapCard}
                  onPress={() => onSwap(swapKey, item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.swapCardInner}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.swapCardTitle}>{item.name}</Text>
                      <Text style={styles.swapCardSub}>{item.type || item.cuisine || item.note}</Text>
                      <Text style={styles.swapRating}>★ {item.rating}</Text>
                    </View>
                    <Text style={styles.swapArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Timeline Item ────────────────────────────────────────────
function TimelineItem({ emoji, time, label, name, sub, isLast, onTap, rating, distance, isOpenNow }) {
  return (
    <TouchableOpacity style={styles.tiRow} onPress={onTap} activeOpacity={0.75}>
      <View style={styles.tiLeft}>
        <View style={styles.tiDot}><Text style={styles.tiEmoji}>{emoji}</Text></View>
        {!isLast && <View style={styles.tiLine} />}
      </View>
      <View style={[styles.tiContent, !isLast && { paddingBottom: 28 }]}>
        <Text style={styles.tiTime}>{time} · {label}</Text>
        <Text style={styles.tiName}>{name}</Text>
        {sub ? <Text style={styles.tiSub}>{sub}</Text> : null}
        {(rating || distance) && (
          <View style={styles.tiMeta}>
            {rating && <Text style={styles.tiRating}>⭐ {rating}</Text>}
            {rating && distance && <Text style={styles.tiDot2}> · </Text>}
            {distance && <Text style={styles.tiDistance}>{distance} mi</Text>}
          </View>
        )}
        {isOpenNow === true && <Text style={styles.tiOpen}>Open now</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function CartScreen() {
  const router = useRouter();
  const { plan, updatePlan, savePlan, savedPlans, fmtHM, getBaseHour, getBaseMin } = usePlan();

  const [swapKey, setSwapKey]               = useState(null);
  const [activeItem, setActiveItem]         = useState(null);
  const [isSaved, setIsSaved]               = useState(false);
  const [isSpecial, setIsSpecial]           = useState(false);
  const [specialTitle, setSpecialTitle]     = useState('');
  const [showSpecialInput, setShowSpecialInput] = useState(false);

  // ✅ Moved after state declarations to fix reference-before-declaration bug
  useEffect(() => {
    if (activeItem) console.log('Active item distance:', activeItem.distance);
  }, [activeItem]);

  const baseH = getBaseHour() || 17;
  const baseM = getBaseMin()  || 0;

  const timelineItems = [];
  if (plan.activity) timelineItems.push({
    key: 'activity', emoji: '🎯', label: 'Activity',
    time: fmtHM(baseH, baseM),
    name: plan.activity.name, sub: plan.activity.category,
    rating: plan.activity.rating, totalRatings: plan.activity.totalRatings,
    address: plan.activity.address, isOpenNow: plan.activity.isOpenNow,
    location: plan.activity.location, id: plan.activity.id,
    distance: plan.activity.distance,
  });
  if (plan.food) timelineItems.push({
    key: 'food', emoji: '🍽️', label: 'Dinner',
    time: fmtHM(baseH + 2, baseM),
    name: plan.food.name, sub: plan.food.category,
    rating: plan.food.rating, totalRatings: plan.food.totalRatings,
    address: plan.food.address, isOpenNow: plan.food.isOpenNow,
    location: plan.food.location, id: plan.food.id,
    distance: plan.food.distance,
  });
  if (plan.addonItem) {
    const emoji = plan.addonType === 'flowers' ? '💐' : plan.addonType === 'dessert' ? '🍰' : '🌅';
    const label = plan.addonType === 'flowers' ? 'Flowers' : plan.addonType === 'dessert' ? 'Dessert' : 'Scenic Stop';
    timelineItems.push({
      key: 'addon', emoji, label,
      time: fmtHM(baseH + 3, 30),
      name: plan.addonItem.name, sub: plan.addonItem.note,
      rating: plan.addonItem.rating, totalRatings: plan.addonItem.totalRatings,
      address: plan.addonItem.address || plan.addonItem.desc,
      isOpenNow: plan.addonItem.isOpenNow,
      location: plan.addonItem.location, id: plan.addonItem.id,
      distance: plan.addonItem.distance,
    });
  }

  function removeItem(key) {
    if (key === 'activity') updatePlan({ activity: null });
    else if (key === 'food') updatePlan({ food: null });
    else updatePlan({ addonType: null, addonItem: null });
    setActiveItem(null);
  }

  function handleSwap(key, item) {
    if (key === 'activity') updatePlan({ activity: item });
    else if (key === 'food') updatePlan({ food: item });
    else updatePlan({ addonType: item._addonType, addonItem: item });
    setSwapKey(null);
  }

  async function handleSave() {
    if (isSaved) return;
    savePlan();
    setIsSaved(true);
    if (isSpecial && specialTitle.trim()) {
      try {
        const raw      = await AsyncStorage.getItem('@plannie_special_dates');
        const existing = raw ? JSON.parse(raw) : [];
        const newEntry = {
          id: 'sd_' + Date.now(),
          title: specialTitle.trim(),
          date: plan.date || new Date().toISOString().split('T')[0],
          planTitle: plan.vibe ? plan.vibe + ' Date Night' : 'Date Night',
          city: plan.city || '', vibe: plan.vibe || '',
        };
        await AsyncStorage.setItem('@plannie_special_dates', JSON.stringify([newEntry, ...existing]));
      } catch (e) { console.log('Special date save error:', e.message); }
    }
  }

  function handleShare() {
    const latest = savedPlans[0];
    const lines  = [];
    if (latest) {
      lines.push(`${latest.title} 🎉`);
      lines.push('');
      const times = ['7:00 PM', '8:30 PM', '10:00 PM'];
      latest.items.forEach((item, idx) => {
        const parts = item.split(' ');
        const emoji = parts[0];
        const name  = parts.slice(1).join(' ');
        const time  = times[idx] || '';
        let line = '';
        if (idx === 0)           line = `${time} — 🎯 Start with a great time at ${name}`;
        else if (emoji === '🍽️') line = `${time} — 🍽️ Enjoy dinner at ${name}`;
        else if (emoji === '🍰') line = `${time} — 🍰 End the night with dessert at ${name}`;
        else if (emoji === '💐') line = `${time} — 🌸 End the night with flowers from ${name}`;
        else if (emoji === '🌅') line = `${time} — 🌅 End with a scenic stop at ${name}`;
        else                     line = `${time} — ✨ Round off the night at ${name}`;
        lines.push(line);
      });
      lines.push('');
      lines.push(`📍 ${latest.city}`);
      lines.push('');
    }
    lines.push('Planned with Plannie 💕');
    Share.share({ message: lines.join('\n') });
  }

  function handleCalendar() {
    const title = encodeURIComponent(plan.vibe ? `${plan.vibe} Date Night` : 'Plannie Date Night');
    const loc   = encodeURIComponent(plan.city || 'Los Angeles, CA');
    const url   = `https://calendar.google.com/calendar/r/eventedit?text=${title}&location=${loc}&details=${encodeURIComponent('Planned with Plannie 💕')}`;
    Linking.openURL(url).catch(() => Alert.alert('Could not open Calendar'));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Hero ── */}
        {/* ✅ Midnight Velvet hero — deep purple with rose gold warmth, no warm brown */}
        <LinearGradient
          colors={['#1C1628', '#241A38', '#1A1428']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.heroLabel}>Your Date Plan</Text>
          {/* ✅ Explicit warm white — NOT colors.cream (now dark #0E0C15) */}
          <Text style={styles.heroTitle}>
            {plan.vibe ? `${plan.vibe} Date Night` : 'Your Date Plan'}
          </Text>
          <Text style={styles.heroMeta}>{plan.dateDisplay || 'Upcoming'} · {plan.city}</Text>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>✦  {plan.vibe || 'Custom'} Vibe</Text>
          </View>
        </LinearGradient>

        {/* ── Timeline ── */}
        {timelineItems.length > 0 ? (
          <View style={styles.timeline}>
            {timelineItems.map((item, idx) => (
              <TimelineItem
                key={item.key}
                emoji={item.emoji}
                time={item.time}
                label={item.label}
                name={item.name}
                sub={item.sub}
                rating={item.rating}
                distance={item.distance}
                isOpenNow={item.isOpenNow}
                isLast={idx === timelineItems.length - 1}
                onTap={() => setActiveItem(item)}
              />
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

      {/* ── Bottom Bar ── */}
      <View style={styles.bbar}>
        {isSaved ? (
          <View style={styles.savedState}>
            <Text style={styles.savedBannerText}>🎉 Plan saved!</Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleShare} activeOpacity={0.88}>
              <Text style={styles.btnPrimaryText}>🔗 Share Plan</Text>
            </TouchableOpacity>
            <View style={styles.rowActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={handleCalendar} activeOpacity={0.8}>
                <Text style={styles.btnSecondaryText}>📅 Add to Calendar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => router.replace('/(tabs)')} activeOpacity={0.8}>
                <Text style={styles.btnSecondaryText}>🏠 Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.unsavedState}>
            <View style={styles.specialRow}>
              <Text style={styles.specialLabel}>💍 Mark as special date</Text>
              <Switch
                value={isSpecial}
                onValueChange={(val) => { setIsSpecial(val); setShowSpecialInput(val); }}
                trackColor={{ false: colors.gray4, true: colors.rose }}
                thumbColor={'#F2EDE8'}
                ios_backgroundColor={colors.gray4}
              />
            </View>
            {showSpecialInput && (
              <TextInput
                style={styles.specialInput}
                placeholder='"First Date", "Anniversary"…'
                placeholderTextColor={colors.gray3}
                value={specialTitle}
                onChangeText={setSpecialTitle}
                returnKeyType="done"
              />
            )}
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSave} activeOpacity={0.88}>
              <Text style={styles.btnPrimaryText}>✦ Save This Plan</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ItemActionSheet
        visible={!!activeItem}
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onSwap={() => { setSwapKey(activeItem?.key); setActiveItem(null); }}
        onRemove={() => removeItem(activeItem?.key)}
      />

      <SwapSheet
        visible={!!swapKey}
        swapKey={swapKey}
        plan={plan}
        onClose={() => setSwapKey(null)}
        onSwap={handleSwap}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },

  // ── Hero ────────────────────────────────────────────────────
  hero:      { padding: 28, paddingTop: 40, paddingBottom: 24 },
  backBtn:   { paddingBottom: 12 },
  backText:  { fontFamily: fonts.bodyMedium, fontSize: 14, color: 'rgba(242,237,232,0.55)' },
  heroLabel: { fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.gold, marginBottom: 6 },

  // ✅ Explicit warm white — colors.cream is now dark background
  heroTitle: { fontFamily: fonts.displayLight, fontSize: 32, color: '#F2EDE8', lineHeight: 36, letterSpacing: -0.3 },
  heroMeta:  { fontFamily: fonts.body, fontSize: 13, color: 'rgba(242,237,232,0.50)', marginTop: 8 },
  heroPill:  { marginTop: 12, backgroundColor: 'rgba(201,169,110,0.15)', borderWidth: 1, borderColor: 'rgba(201,169,110,0.28)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5, alignSelf: 'flex-start' },
  heroPillText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.gold },

  // ── Timeline ────────────────────────────────────────────────
  timeline: { padding: 24, paddingBottom: 8 },
  tiRow:    { flexDirection: 'row', gap: 14 },
  tiLeft:   { alignItems: 'center', width: 40 },
  tiDot:    { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cream2, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  tiEmoji:  { fontSize: 18 },
  tiLine:   { flex: 1, width: 2, backgroundColor: colors.cream2, marginTop: 4 },
  tiContent:{ flex: 1, paddingBottom: 8 },
  tiTime:   { fontFamily: fonts.bodySemiBold, fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.gray2, marginBottom: 2 },
  tiName:   { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal, marginBottom: 2 },
  tiSub:    { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  tiMeta:   { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  tiRating: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.gold },
  tiDot2:   { fontFamily: fonts.body, fontSize: 12, color: colors.gray3 },
  tiDistance:{ fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  tiOpen:   { fontFamily: fonts.bodyMedium, fontSize: 11, color: '#5BBF85', marginTop: 3 },

  // ── Empty ───────────────────────────────────────────────────
  empty:      { padding: 44, alignItems: 'center' },
  emptyIcon:  { fontSize: 44, marginBottom: 14 },
  emptyTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.gray2 },
  emptySub:   { fontFamily: fonts.body, fontSize: 13, color: colors.gray3, marginTop: 6, textAlign: 'center' },

  // ── Bottom bar ──────────────────────────────────────────────
  bbar:            { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 12, backgroundColor: colors.cream },
  savedState:      { gap: 8 },
  unsavedState:    { gap: 8 },
  savedBannerText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.green, textAlign: 'center', marginBottom: 4 },

  // ── Buttons ─────────────────────────────────────────────────
  btnPrimary:     { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  // ✅ Explicit warm white text — colors.white is now dark surface #1E1C2C
  btnPrimaryText: { fontFamily: fonts.bodyMedium, fontSize: 16, color: '#F2EDE8', letterSpacing: 0.2 },
  rowActions:     { flexDirection: 'row', gap: 8 },
  btnSecondary:   { flex: 1, backgroundColor: colors.cream2, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  btnSecondaryText:{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.charcoal },

  // ── Special date ────────────────────────────────────────────
  specialRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cream2, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 12 },
  specialLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.charcoal },
  specialInput: { backgroundColor: colors.cream2, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 12, fontFamily: fonts.body, fontSize: 14, color: colors.charcoal, borderWidth: 1.5, borderColor: colors.rose },

  // ── Sheets ──────────────────────────────────────────────────
  // ✅ Overlay — dark purple rgba, NOT warm brown rgba(44,37,32,0.6)
  overlay:     { flex: 1, backgroundColor: 'rgba(8,6,14,0.80)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: colors.cream2, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '85%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray3, alignSelf: 'center', marginBottom: 20 },
  sheetName:   { fontFamily: fonts.display, fontSize: 22, color: colors.charcoal, marginBottom: 4 },
  sheetSub:    { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginBottom: 20 },
  cancelBtn:   { marginTop: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray4, borderRadius: 999 },
  cancelBtnText:{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.gray2 },

  // ── Swap card ───────────────────────────────────────────────
  swapCard:      { backgroundColor: colors.cream3, borderRadius: radius.sm, marginBottom: 10 },
  swapCardInner: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  swapCardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.charcoal },
  swapCardSub:   { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 2 },
  swapRating:    { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.gold, marginTop: 4 },
  swapArrow:     { fontSize: 20, color: colors.gray2 },

  // ── Detail modal ────────────────────────────────────────────
  detailName:       { fontFamily: fonts.display, fontSize: 22, color: colors.charcoal, marginBottom: 4 },
  detailCategory:   { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginBottom: 10 },
  detailRatingRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  detailRating:     { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.gold },
  detailReviews:    { fontFamily: fonts.body, fontSize: 13, color: colors.gray2 },
  detailAddressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  detailAddressIcon:{ fontSize: 14, marginTop: 2 },
  detailAddress:    { fontFamily: fonts.body, fontSize: 13, color: colors.gray, flex: 1, lineHeight: 20 },
  detailDivider:    { height: 1, backgroundColor: colors.gray4, marginVertical: 16 },

  // ✅ detailRow — was referenced but never defined (caused silent layout bug)
  detailRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  detailIcon: { fontSize: 14 },
});