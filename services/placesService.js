// services/placesService.js
// Category search + helpers used across plan flow, cart, and results.
import { getNearbyPlaces } from './nearbyPlacesService';

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';

const TYPE_READABLE_ORDER = [
  'restaurant',
  'meal_takeaway',
  'food',
  'bar',
  'night_club',
  'cafe',
  'bakery',
  'movie_theater',
  'bowling_alley',
  'tourist_attraction',
  'amusement_park',
  'spa',
  'gym',
];

function titleCaseType(t) {
  return String(t)
    .split('_')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

export function getReadableType(types = []) {
  if (!Array.isArray(types) || types.length === 0) return 'Place';
  for (const t of TYPE_READABLE_ORDER) {
    if (types.includes(t)) return titleCaseType(t);
  }
  return titleCaseType(types[0]);
}

export function shortenVicinity(str = '') {
  if (!str || typeof str !== 'string') return '';
  const bits = str.split(',').map((s) => s.trim()).filter(Boolean);
  if (bits.length <= 2) return str.trim();
  return `${bits[0]}, ${bits[1]}`;
}

export function getCurationLabel(place, category = 'food') {
  const raw = place.distanceMiles ?? place.distance;
  const dist = typeof raw === 'string' ? parseFloat(raw, 10) : Number(raw);
  const rating = place.rating != null ? Number(place.rating) : 0;
  const reviews = place.totalRatings || 0;

  if (Number.isFinite(dist) && dist < 1) {
    if (rating >= 4.7) return 'Top pick near you';
    if (rating >= 4.4) return 'Highly rated nearby';
    return 'Close by';
  }
  if (Number.isFinite(dist) && dist < 3 && rating >= 4.5) return 'Worth the short trip';
  if (category === 'activity' && rating >= 4.3) return 'Fun spot with great reviews';
  if (reviews > 500) return 'Popular choice';
  return 'Solid option for your plan';
}

function mapUiCategory(cat) {
  const c = String(cat || 'food').toLowerCase();
  if (['food', 'restaurant', 'dining'].includes(c)) return 'food';
  if (c === 'drinks' || c === 'drink') return 'drinks';
  if (c === 'coffee') return 'coffee';
  if (c === 'activity') return 'activity';
  return 'food';
}

/**
 * Fetches places for a UI category using the shared nearby pipeline.
 * @param {'food'|'drinks'|'coffee'|'activity'} category
 * @param {{ lat: number, lng: number }} coords
 * @param {{ radius?: number, maxResults?: number, selectedArea?: string, budget?: string }} options
 */
export async function getPlacesByCategory(category, coords, options = {}) {
  const lat = coords?.lat;
  const lng = coords?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return [];

  const selectedArea = options.selectedArea ?? '';
  const maxResults = Math.min(Math.max(options.maxResults ?? 15, 1), 40);

  const raw = await getNearbyPlaces({
    lat,
    lng,
    category: mapUiCategory(category),
    moment: 'casual_hangout',
    areaName: selectedArea,
  });

  const mapped = raw.map((p) => {
    const distNum = parseFloat(String(p.distance), 10);
    return {
      id: p.id,
      name: p.name,
      rating: p.rating != null ? parseFloat(String(p.rating), 10) : null,
      totalRatings: p.totalRatings || 0,
      address: p.address || '',
      shortLocation: shortenVicinity(p.address || ''),
      types: p.types || [],
      photoUrl: p.photoUrl || null,
      location:
        p.location && typeof p.location.lat === 'number' && typeof p.location.lng === 'number'
          ? p.location
          : null,
      distanceMiles: Number.isFinite(distNum) ? distNum : null,
      isOpenNow: null,
    };
  });

  return mapped.filter((p) => p.location).slice(0, maxResults);
}

/**
 * Nearby search by Google types (e.g. ['restaurant']) — delegates to category pipeline.
 */
export async function getPlacesNearby(types, coords, options = {}) {
  const lat = coords?.lat;
  const lng = coords?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return [];

  const requestedTypes = Array.isArray(types) ? types.filter(Boolean) : [];
  const searchTypes = requestedTypes.length > 0 ? requestedTypes : ['restaurant'];
  const radius = options.radius ?? 8000;
  const maxResults = Math.min(Math.max(options.maxResults ?? 12, 1), 40);

  const toMiles = (from, to) => {
    if (!to || typeof to.lat !== 'number' || typeof to.lng !== 'number') return null;
    const R = 3958.8;
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const byId = new Map();

  await Promise.all(
    searchTypes.map(async (type) => {
      console.log('[API CALL] type used:', type);
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: String(radius),
        type,
        key: GOOGLE_API_KEY,
      });
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        const results = data.results || [];
        results.forEach((p) => {
          if (!p?.place_id || byId.has(p.place_id)) return;
          const location =
            p.geometry?.location &&
            typeof p.geometry.location.lat === 'number' &&
            typeof p.geometry.location.lng === 'number'
              ? { lat: p.geometry.location.lat, lng: p.geometry.location.lng }
              : null;
          const distanceMiles = toMiles({ lat, lng }, location);
          byId.set(p.place_id, {
            id: p.place_id,
            name: p.name,
            rating: p.rating != null ? parseFloat(String(p.rating), 10) : null,
            totalRatings: p.user_ratings_total || 0,
            address: p.vicinity || p.formatted_address || '',
            shortLocation: shortenVicinity(p.vicinity || p.formatted_address || ''),
            types: p.types || [],
            photoUrl: p.photos?.[0]?.photo_reference
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
              : null,
            location,
            distanceMiles: Number.isFinite(distanceMiles) ? distanceMiles : null,
            isOpenNow: p.opening_hours?.open_now ?? null,
          });
        });
      } catch {
        // ignore single-type failure and continue with other types
      }
    })
  );

  let results = Array.from(byId.values());

  const uniqueMap = new Map();
  results.forEach((place) => {
    if (place.id) {
      uniqueMap.set(place.id, place);
    }
  });
  results = Array.from(uniqueMap.values());
  console.log('[Dedup] total after dedupe:', results.length);

  return results.filter((p) => p.location).slice(0, maxResults);
}

export async function fetchPlaceDetails(placeId) {
  if (!placeId) return null;
  const fields = 'name,rating,user_ratings_total,formatted_address,photos';
  const url =
    'https://maps.googleapis.com/maps/api/place/details/json?' +
    `place_id=${encodeURIComponent(placeId)}&fields=${encodeURIComponent(fields)}&key=${GOOGLE_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const r = data.result;
    if (!r) return null;

    const photos = (r.photos || []).slice(0, 10).map(
      (ph) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ph.photo_reference}&key=${GOOGLE_API_KEY}`
    );

    return {
      name: r.name,
      rating: r.rating,
      totalRatings: r.user_ratings_total,
      formattedAddress: r.formatted_address,
      photos,
    };
  } catch {
    return null;
  }
}
