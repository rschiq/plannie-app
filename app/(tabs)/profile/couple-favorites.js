import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal,
  Image, ScrollView, Linking, Dimensions, FlatList, ToastAndroid, Platform, Alert, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts } from '../../../constants/theme';
import { getFavorites, removeFavorite } from '../../../services/favoritesStorage';
import ResultsPlaceCard from '../../../components/ResultsPlaceCard';

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';
const SCREEN_W = Dimensions.get('window').width;

function buildPhotoUrl(ref, maxW = 600) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxW}&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
}

function openMaps(place) {
  if (place.location?.lat) {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}&query_place_id=${place.place_id || place.id}`);
  } else {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`);
  }
}

function PlaceDetailSheet({ place, visible, onClose }) {
  const insets = useSafeAreaInsets();
  const [details, setDetails] = useState(null);
  const [detLoad, setDetLoad] = useState(false);

  useEffect(() => {
    if (!visible || !(place?.place_id || place?.id)) return;
    const placeId = place.place_id || place.id;
    setDetails(null);
    setDetLoad(true);
    fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,photos,opening_hours,reviews&key=${GOOGLE_API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => { if (data.result) setDetails(data.result); })
      .catch(() => {})
      .finally(() => setDetLoad(false));
  }, [visible, place?.place_id, place?.id]);

  if (!place) return null;

  const photos = details?.photos || [];
  const address = details?.formatted_address || place.vicinity || place.formatted_address || place.address;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={det.overlay}>
        <View style={det.sheet}>
          <View style={det.handle} />
          <TouchableOpacity style={det.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={det.closeText}>✕</Text>
          </TouchableOpacity>

          {detLoad ? (
            <View style={det.photoPlaceholder}>
              <ActivityIndicator size="small" color={colors.rose} />
            </View>
          ) : photos.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={det.photoScroll}>
              {photos.slice(0, 5).map((ph, i) => (
                <Image key={i} source={{ uri: buildPhotoUrl(ph.photo_reference) }} style={[det.photo, { width: SCREEN_W }]} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : place.photoUrl ? (
            <Image source={{ uri: place.photoUrl }} style={[det.photo, { width: SCREEN_W }]} resizeMode="cover" />
          ) : (
            <View style={det.photoPlaceholder}><Text style={det.photoIcon}>📍</Text></View>
          )}

          <ScrollView
            style={det.body}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 18, 26) }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={det.name}>{place.name}</Text>
            {(place.type || place.category) ? <Text style={det.category}>{place.type || place.category}</Text> : null}

            {place.rating && (
              <View style={det.ratingRow}>
                <Text style={det.rating}>⭐ {place.rating}</Text>
                {place.totalRatings > 0 && (
                  <Text style={det.reviews}>({place.totalRatings.toLocaleString()} reviews)</Text>
                )}
              </View>
            )}

            {address ? (
              <View style={det.row}>
                <Text style={det.rowIcon}>📍</Text>
                <Text style={det.rowText}>{address}</Text>
              </View>
            ) : null}

            <View style={det.divider} />

            <TouchableOpacity style={det.outlineBtn} onPress={() => openMaps(place)} activeOpacity={0.88}>
              <Text style={det.outlineBtnText}>🗺️ Open in Maps</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function CoupleFavoritesScreen() {
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [animatedRemovingId, setAnimatedRemovingId] = useState(null);
  const [removeAnim] = useState(() => new Animated.Value(1));

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    const data = await getFavorites();
    setFavorites(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const handleRemove = async (placeId) => {
    setRemovingId(placeId);
    setAnimatedRemovingId(placeId);
    removeAnim.setValue(1);
    await new Promise((resolve) => {
      Animated.timing(removeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => resolve());
    });
    const updated = await removeFavorite(placeId);
    setFavorites(updated);
    setRemovingId(null);
    setAnimatedRemovingId(null);
    removeAnim.setValue(1);
    const msg = 'Removed from Favorites';
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert('', msg);
  };

  const openDetail = (place) => {
    setSelected(place);
    setShowDetail(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Couple Favorites</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold2} />
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No favorites yet ❤️</Text>
          <Text style={styles.emptySubText}>Start saving places you love</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.place_id}
          ListHeaderComponent={<Text style={styles.listSubText}>Saved for your next date</Text>}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(insets.bottom + 30, 42) }}
          renderItem={({ item }) => (
            <Animated.View
              style={[
                styles.itemWrap,
                animatedRemovingId === item.place_id
                  ? {
                      opacity: removeAnim,
                      transform: [{ scale: removeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
                    }
                  : null,
                removingId === item.place_id && styles.itemWrapRemoving,
              ]}
            >
              <ResultsPlaceCard
                place={item}
                onPress={() => openDetail(item)}
                variant="default"
                showFavorite
                isFavorite
                onToggleFavorite={() => handleRemove(item.place_id)}
              />
            </Animated.View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <PlaceDetailSheet
        place={selected}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.charcoal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  backArrow: {
    fontSize: 26, color: colors.cream,
    lineHeight: 30, marginLeft: 2,
  },
  headerTitle: {
    fontFamily: fonts.display, fontSize: 22,
    color: colors.cream, flex: 1, textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.gray2,
    marginBottom: 6,
  },
  emptySubText: { fontFamily: fonts.body, fontSize: 13, color: colors.gray3 },
  listSubText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.gray2,
    marginBottom: 10,
    marginLeft: 2,
  },
  itemWrap: { opacity: 1, transform: [{ scale: 1 }] },
  itemWrapRemoving: { opacity: 0.35, transform: [{ scale: 0.97 }] },
});

const det = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', overflow: 'hidden' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray3, alignSelf: 'center', marginTop: 12 },
  closeBtn: { position: 'absolute', top: 10, right: 10, zIndex: 4, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.22)' },
  closeText: { fontFamily: fonts.bodyMedium, fontSize: 18, color: '#F2EDE8', lineHeight: 20 },
  photoScroll: { height: 220, width: SCREEN_W },
  photo: { height: 220 },
  photoPlaceholder: { height: 120, backgroundColor: colors.gray4, alignItems: 'center', justifyContent: 'center' },
  photoIcon: { fontSize: 40 },
  body: { paddingHorizontal: 18, paddingTop: 16 },
  name: { fontFamily: fonts.display, fontSize: 19, color: colors.charcoal, marginBottom: 2, marginTop: 4 },
  category: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginBottom: 7 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  rating: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.gold },
  reviews: { fontFamily: fonts.body, fontSize: 13, color: colors.gray2 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 5 },
  rowIcon: { fontSize: 13, marginTop: 1 },
  rowText: { fontFamily: fonts.body, fontSize: 13, color: colors.gray, flex: 1, lineHeight: 17 },
  divider: { height: 1, backgroundColor: colors.gray4, marginVertical: 10 },
  outlineBtn: { borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1.5, borderColor: colors.rose },
  outlineBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },
});