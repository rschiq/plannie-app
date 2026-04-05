import { useState } from 'react';
import { View, Text, StyleSheet, Linking, Modal, ScrollView, TouchableOpacity, ActivityIndicator, Image, Pressable } from 'react-native';
import { colors, fonts, radius, shadow } from '../constants/theme';
import { Tag, SmallButton } from './UI';
import { SelectableCard } from './SelectableCard';

const GOOGLE_API_KEY = 'AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8';

function shortenAddress(address = '') {
  if (!address) return '';
  const parts = address.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length <= 1) return parts[0] || '';
  const streetPattern = /^\d+\s|blvd|ave|st\b|rd\b|dr\b|ln\b|way|pkwy/i;
  const meaningful = parts.filter((p, i) => {
    if (/^[A-Z]{2}$/.test(p)) return false;
    if (/^\d{5}/.test(p)) return false;
    if (/^(USA|United States)$/i.test(p)) return false;
    if (i === 0 && streetPattern.test(p)) return false;
    return true;
  });
  return meaningful[0] || parts.slice(-2)[0] || '';
}

function PlaceDetailModal({ visible, item, onClose }) {
  const [details, setDetails]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [lastId, setLastId]     = useState(null);

  if (visible && item?.id && item.id !== lastId) {
    setLastId(item.id);
    setDetails(null);
    setLoading(true);
    const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,photos';
    fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.id}&fields=${fields}&key=${GOOGLE_API_KEY}`)
      .then(r => r.json())
      .then(d => { if (d.result) setDetails(d.result); })
      .catch(e => console.log('[PlaceDetail]', e.message))
      .finally(() => setLoading(false));
  }

  function buildPhotoUrl(ref) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
  }

  function openInMaps() {
    if (item?.location?.lat) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.location.lat},${item.location.lng}`);
    } else {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item?.name || '')}`);
    }
  }

  const photos     = details?.photos || [];
  const hasPhone   = !!details?.formatted_phone_number;
  const hasWebsite = !!details?.website;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={dm.backdrop} onPress={onClose} />
      <View style={dm.sheet}>
        {photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dm.photoScroll} pagingEnabled>
            {photos.slice(0, 5).map((ph, i) => (
              <Image key={i} source={{ uri: buildPhotoUrl(ph.photo_reference) }} style={dm.photo} resizeMode="cover" />
            ))}
          </ScrollView>
        )}
        {photos.length === 0 && !loading && (
          <View style={dm.photoPlaceholder}><Text style={{ fontSize: 40 }}>📍</Text></View>
        )}
        <ScrollView style={{ paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
          <View style={dm.handle} />
          {loading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.rose} />
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginTop: 10 }}>Loading details…</Text>
            </View>
          ) : (
            <>
              <Text style={dm.name}>{item?.name}</Text>
              <Text style={dm.type}>{item?.type || item?.category || ''}</Text>
              <View style={dm.ratingRow}>
                {item?.rating ? <Text style={dm.rating}>⭐ {item.rating}</Text> : null}
                {item?.totalRatings > 0 && <Text style={dm.reviews}>({item.totalRatings.toLocaleString()} reviews)</Text>}
                {item?.distance ? <Text style={dm.dist}>🚗 {item.distance} mi</Text> : null}
              </View>
              {(details?.formatted_address || item?.address) && (
                <View style={dm.row}>
                  <Text style={dm.rowIcon}>📍</Text>
                  <Text style={dm.rowText}>{details?.formatted_address || item.address}</Text>
                </View>
              )}
              {hasPhone && (
                <TouchableOpacity style={dm.row} onPress={() => Linking.openURL('tel:' + details.formatted_phone_number.replace(/\s/g, ''))} activeOpacity={0.8}>
                  <Text style={dm.rowIcon}>📞</Text>
                  <Text style={[dm.rowText, dm.rowLink]}>{details.formatted_phone_number}</Text>
                </TouchableOpacity>
              )}
              {hasWebsite && (
                <TouchableOpacity style={dm.row} onPress={() => Linking.openURL(details.website)} activeOpacity={0.8}>
                  <Text style={dm.rowIcon}>🌐</Text>
                  <Text style={[dm.rowText, dm.rowLink]} numberOfLines={1}>
                    {details.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </Text>
                </TouchableOpacity>
              )}
              <View style={dm.divider} />
              <TouchableOpacity style={dm.mapsBtn} onPress={openInMaps} activeOpacity={0.88}>
                <Text style={dm.mapsBtnText}>🗺️ Open in Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dm.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={dm.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export function ItemCard({ item, selected, onSelect, type = 'activity' }) {
  const [showDetail, setShowDetail] = useState(false);
  // ✅ PART 3: prefer shortLocation field (set by activity/food screens),
  // fall back to shortenAddress on raw address, then desc
  const shortLocation = item.shortLocation
    || (item.address ? shortenAddress(item.address) : '')
    || (item.desc || '');

  return (
    <>
      <SelectableCard
        selected={selected}
        onPress={() => onSelect(item)}
        style={[styles.cardOuter, item.featured && styles.cardFeatured]}
        innerStyle={styles.cardInner}
      >
        {item.featured && (
          <View style={styles.featBadge}>
            <Text style={styles.featBadgeText}>✦ Featured Date Spot</Text>
          </View>
        )}
        {selected && (
          <View style={styles.checkCircle}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardType}>{item.type || item.cuisine}</Text>
        {/* ✅ PART 3: Always show location with 📍 — never empty */}
        {shortLocation ? (
          <Text style={styles.cardLocation}>📍 {shortLocation}</Text>
        ) : null}
        <View style={styles.metaRow}>
          {item.rating ? <Text style={styles.rating}>★ {item.rating}</Text> : null}
          {item.dist   ? <Tag label={`${item.dist} mi`} /> : null}
          {type === 'food' && item.price && <Tag label={item.price} variant="gold" />}
          {item.tag    ? <Tag label={item.tag} variant="rose" /> : null}
        </View>
        {item.popular && <Text style={styles.popularText}>⭐  Popular with couples</Text>}
        <View style={styles.cardActions}>
          <SmallButton label="View Details" onPress={() => setShowDetail(true)} />
        </View>
      </SelectableCard>

      <PlaceDetailModal visible={showDetail} item={item} onClose={() => setShowDetail(false)} />
    </>
  );
}

export function AddonCard({ item, selected, onSelect }) {
  return (
    <SelectableCard
      selected={selected}
      onPress={() => onSelect(item)}
      style={[styles.cardOuter, item.featured && styles.cardFeatured]}
      innerStyle={styles.cardInner}
    >
      {item.featured && (
        <View style={styles.featBadge}>
          <Text style={styles.featBadgeText}>✦ Featured Spot</Text>
        </View>
      )}
      {selected && (
        <View style={styles.checkCircle}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardType}>{item.note}</Text>
      <Text style={styles.cardDesc}>{item.desc}</Text>
      <View style={styles.metaRow}>
        {item.rating ? <Text style={styles.rating}>★ {item.rating}</Text> : null}
        {item.dist   ? <Tag label={item.dist} /> : null}
      </View>
    </SelectableCard>
  );
}

const styles = StyleSheet.create({
  cardOuter:    { marginBottom: 13 },
  cardInner:    { padding: 20 },
  cardFeatured: { borderTopWidth: 3, borderTopColor: colors.gold, paddingTop: 30 },
  featBadge:    { position: 'absolute', top: 0, right: 16, backgroundColor: colors.gold, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  featBadgeText:{ fontFamily: fonts.bodySemiBold, fontSize: 9, color: '#1C1628', letterSpacing: 0.7, textTransform: 'uppercase' },
  checkCircle:  { position: 'absolute', top: 16, right: 16, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.rose, justifyContent: 'center', alignItems: 'center' },
  checkText:    { color: '#F2EDE8', fontSize: 13, fontFamily: fonts.bodySemiBold },
  cardTitle:    { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.charcoal, marginBottom: 2, paddingRight: 32 },
  cardType:     { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginBottom: 4 },
  cardLocation: { fontFamily: fonts.body, fontSize: 12, color: colors.rose, marginBottom: 8 },
  cardDesc:     { fontFamily: fonts.body, fontSize: 12, color: colors.gray3, marginBottom: 8 },
  metaRow:      { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 },
  rating:       { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.gold },
  popularText:  { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.rose, marginBottom: 6 },
  cardActions:  { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.gray4 },
});

const dm = StyleSheet.create({
  backdrop:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,6,14,0.80)' },
  sheet:            { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '90%', backgroundColor: colors.cream2, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, overflow: 'hidden' },
  handle:           { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray3, alignSelf: 'center', marginVertical: 16 },
  photoScroll:      { height: 200 },
  photo:            { width: 300, height: 200 },
  photoPlaceholder: { height: 140, backgroundColor: colors.cream3, alignItems: 'center', justifyContent: 'center' },
  name:             { fontFamily: fonts.display, fontSize: 22, color: colors.charcoal, marginBottom: 4 },
  type:             { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginBottom: 10 },
  ratingRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  rating:           { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.gold },
  reviews:          { fontFamily: fonts.body, fontSize: 13, color: colors.gray2 },
  dist:             { fontFamily: fonts.body, fontSize: 13, color: colors.gray2, marginLeft: 'auto' },
  row:              { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  rowIcon:          { fontSize: 15, marginTop: 1, width: 20 },
  rowText:          { fontFamily: fonts.body, fontSize: 13, color: colors.gray, flex: 1, lineHeight: 20 },
  rowLink:          { color: colors.rose },
  divider:          { height: 1, backgroundColor: colors.gray4, marginVertical: 18 },
  mapsBtn:          { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  mapsBtnText:      { fontFamily: fonts.bodySemiBold, fontSize: 15, color: '#F2EDE8' },
  closeBtn:         { backgroundColor: colors.cream3, borderRadius: 999, paddingVertical: 13, alignItems: 'center' },
  closeBtnText:     { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.charcoal },
});