import { useSyncExternalStore } from 'react';

let savedPlacesStore = [];
const listeners = new Set();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function normalizePlace(place) {
  const placeId = place?.place_id || place?.id;
  if (!placeId) return null;

  return {
    place_id: placeId,
    id: place?.id || placeId,
    name: place?.name || '',
    rating: place?.rating ?? null,
    address: place?.vicinity || place?.address || '',
    photoUrl: place?.photoUrl || null,
    totalRatings: place?.totalRatings || 0,
    distance: place?.distance || null,
    cuisine: place?.cuisine || null,
    openNow: place?.openNow ?? null,
    type: place?.type || 'unknown',
    location: place?.location || null,
  };
}

export function useSavedPlaces() {
  const saved = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => savedPlacesStore
  );

  const savePlace = (place) => {
    const normalized = normalizePlace(place);
    if (!normalized) return;
    if (savedPlacesStore.some((item) => item.place_id === normalized.place_id)) return;
    savedPlacesStore = [normalized, ...savedPlacesStore];
    emitChange();
  };

  const removePlace = (placeId) => {
    savedPlacesStore = savedPlacesStore.filter((item) => item.place_id !== placeId);
    emitChange();
  };

  return { saved, savePlace, removePlace };
}
