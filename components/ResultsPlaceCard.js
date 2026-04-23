import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ToastAndroid, Platform, Alert } from 'react-native';
import { colors, fonts, shadow } from '../constants/theme';
import { saveFavorite, removeFavorite, isFavorite as isFavoriteStored } from '../services/favoritesStorage';

export default function ResultsPlaceCard({
  place,
  onPress,
  variant = 'default',
  rank,
  isFavorite,
  onToggleFavorite,
  showFavorite = false,
}) {
  const [liked, setLiked] = useState(false);
  const isTopPick = variant === 'top';
  const priceStr = place.priceLevel != null ? '$'.repeat(place.priceLevel + 1) : null;
  const placeWithId = { ...place, place_id: place.place_id || place.id };

  useEffect(() => {
    const checkLiked = async () => {
      if (!placeWithId.place_id) {
        setLiked(false);
        return;
      }
      const alreadySaved = await isFavoriteStored(placeWithId.place_id);
      setLiked(alreadySaved);
    };
    checkLiked();
  }, [placeWithId.place_id]);

  const handleHeartPress = async () => {
    if (!placeWithId.place_id) return;

    if (liked) {
      await removeFavorite(placeWithId.place_id);
      setLiked(false);
      const msg = 'Removed from Favorites';
      if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
      else Alert.alert('', msg);
    } else {
      await saveFavorite(placeWithId);
      setLiked(true);
      const msg = 'Added to Favorites ❤️';
      if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
      else Alert.alert('', msg);
    }
  };

  return (
    <TouchableOpacity
      style={[card.wrap, isTopPick && card.wrapTop]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {place.photoUrl ? (
        <Image source={{ uri: place.photoUrl }} style={card.photo} resizeMode="cover" />
      ) : (
        <View style={[card.photoPlaceholder, isTopPick && card.photoPlaceholderTop]}>
          <Text style={card.photoIcon}>🍽️</Text>
          <Text style={card.photoPlaceholderText}>Tap to see details</Text>
        </View>
      )}

      {isTopPick && rank != null && (
        <View style={card.rankBadge}>
          <Text style={card.rankText}>#{rank}</Text>
        </View>
      )}

      {showFavorite && (
        <TouchableOpacity
          style={card.favoriteBtn}
          onPress={async (e) => {
            e.stopPropagation?.();
            await handleHeartPress();
            onToggleFavorite?.(placeWithId);
          }}
          activeOpacity={0.8}
        >
          <Text style={card.favoriteText}>
            {liked ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={card.body}>
        <View style={card.titleRow}>
          <Text style={[card.name, isTopPick && card.nameTop]} numberOfLines={1}>{place.name}</Text>
          {priceStr && <Text style={card.price}>{priceStr}</Text>}
        </View>

        <View style={card.metaRow}>
          {place.rating && <Text style={card.rating}>⭐ {place.rating}</Text>}
          {place.totalRatings > 0 && <Text style={card.reviews}>({place.totalRatings.toLocaleString()})</Text>}
          {place.openNow != null && (
            <Text style={[card.openTag, place.openNow ? card.openNow : card.closedNow]}>
              {place.openNow ? '● Open' : '● Closed'}
            </Text>
          )}
        </View>

        {(place.cuisine || place.distance) && (
          <View style={card.tagsRow}>
            {place.cuisine && <Text style={card.cuisine}>{place.cuisine}</Text>}
            {place.distance && <Text style={card.distance}>📍 {place.distance} mi away</Text>}
          </View>
        )}

        {place.address ? <Text style={card.address} numberOfLines={1}>{place.address}</Text> : null}
        {place.hoursToday ? <Text style={card.hours} numberOfLines={1}>🕐 {place.hoursToday}</Text> : null}
        {place.reviewSnippet ? (
          <Text style={card.review} numberOfLines={2}>"{place.reviewSnippet}"</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  wrap: {
    backgroundColor: colors.cream2,
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray4,
    ...shadow.sm,
  },
  wrapTop: {
    backgroundColor: colors.white,
    borderColor: 'rgba(212,149,111,0.35)',
    borderWidth: 1.5,
    ...shadow.md,
  },
  photo: { width: '100%', height: 170 },
  photoPlaceholder: {
    width: '100%',
    height: 110,
    backgroundColor: colors.cream3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoPlaceholderTop: { backgroundColor: 'rgba(212,149,111,0.06)' },
  photoIcon: { fontSize: 26, opacity: 0.5 },
  photoPlaceholderText: { fontFamily: fonts.body, fontSize: 11, color: colors.gray3 },
  rankBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.rose,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    ...shadow.rose,
  },
  rankText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: '#F2EDE8' },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
  },
  favoriteText: { fontSize: 18 },
  body: { padding: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.charcoal, flex: 1, marginRight: 8 },
  nameTop: { fontSize: 17 },
  price: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.gold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  rating: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold },
  reviews: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  openTag: { fontFamily: fonts.bodyMedium, fontSize: 11, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  openNow: { color: colors.green, backgroundColor: 'rgba(91,191,133,0.12)' },
  closedNow: { color: colors.gray2, backgroundColor: colors.gray4 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  cuisine: { fontFamily: fonts.body, fontSize: 12, color: colors.rose, backgroundColor: 'rgba(212,149,111,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  distance: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2 },
  address: { fontFamily: fonts.body, fontSize: 11, color: colors.gray3, marginBottom: 2 },
  hours: { fontFamily: fonts.body, fontSize: 11, color: colors.gray2, marginTop: 2 },
  review: { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginTop: 6, fontStyle: 'italic', lineHeight: 17, opacity: 0.85 },
});
