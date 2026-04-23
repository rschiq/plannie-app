import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'FAVORITES_PLACES';

export const getFavorites = async () => {
  try {
    const data = await AsyncStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveFavorite = async (place) => {
  try {
    const existing = await getFavorites();

    // prevent duplicates
    const already = existing.find((p) => p.place_id === place.place_id);
    if (already) return existing;

    const updated = [place, ...existing];
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

export const removeFavorite = async (place_id) => {
  try {
    const existing = await getFavorites();
    const updated = existing.filter((p) => p.place_id !== place_id);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

export const isFavorite = async (place_id) => {
  const existing = await getFavorites();
  return existing.some((p) => p.place_id === place_id);
};
