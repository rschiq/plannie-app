// services/placesService.js
// ─────────────────────────────────────────────────────────────
// Google Places API (Nearby Search) — Plannie MVP
// ─────────────────────────────────────────────────────────────

const GOOGLE_API_KEY = 'AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8';
const BASE_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

// ─────────────────────────────────────────────────────────────
// Vibe → Place type mapping
// ─────────────────────────────────────────────────────────────
export const VIBE_CONFIG = {
  chill: {
    emoji: '☕',
    label: 'Chill',
    types: ['movie_theater', 'spa', 'park'],
    keywords: ['beach', 'scenic viewpoint', 'spa', 'hotel lounge', 'park'],
    color: '#A8DADC',
  },
  fun: {
    emoji: '🎉',
    label: 'Fun',
    types: ['bowling_alley', 'night_club'],
    keywords: ['karaoke', 'comedy club', 'nightlife', 'dance club', 'arcade'],
    color: '#FFB347',
  },
  romantic: {
    emoji: '💕',
    label: 'Romantic',
    types: ['museum', 'art_gallery'],
    keywords: ['scenic viewpoint', 'beach', 'botanical garden', 'hotel lounge', 'art gallery'],
    color: '#FF8FAB',
  },
  adventure: {
    emoji: '🏕️',
    label: 'Adventure',
    types: ['tourist_attraction', 'bowling_alley'],
    keywords: ['escape room', 'arcade', 'axe throwing', 'go kart', 'climbing gym', 'trampoline park', 'golf course', 'gun range'],
    color: '#90BE6D',
  },
  foodie: {
    emoji: '🍜',
    label: 'Foodie',
    types: ['restaurant'],
    keywords: ['best restaurant', 'popular dining', 'highly rated restaurant'],
    color: '#F4A261',
  },
};

// ─────────────────────────────────────────────────────────────
// Internal: fetch one type
// ─────────────────────────────────────────────────────────────
async function fetchByType({ lat, lng, type, keyword, radius }) {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radius),
    type,
    keyword,
    key: GOOGLE_API_KEY,
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API: ${data.status}`);
  }

  return data.results ?? [];
}

// ─────────────────────────────────────────────────────────────
// Internal: normalize a raw result into a clean object
// ─────────────────────────────────────────────────────────────
function normalize(raw) {
  const photoRef = raw.photos?.[0]?.photo_reference ?? null;
  return {
    id: raw.place_id,
    name: raw.name,
    address: raw.vicinity ?? '',
    rating: raw.rating ?? null,
    totalRatings: raw.user_ratings_total ?? 0,
    priceLevel: raw.price_level ?? null,
    isOpenNow: raw.opening_hours?.open_now ?? null,
    types: raw.types ?? [],
    location: {
      lat: raw.geometry.location.lat,
      lng: raw.geometry.location.lng,
    },
    photoUrl: photoRef ? buildPhotoUrl(photoRef) : null,
  };
}

// ─────────────────────────────────────────────────────────────
// Public: build a Place Photo URL
// ─────────────────────────────────────────────────────────────
export function buildPhotoUrl(ref, maxWidth = 400) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
}

// ─────────────────────────────────────────────────────────────
// Public: main helper — call this from your screens
// ─────────────────────────────────────────────────────────────
/**
 * getPlacesByVibe(vibe, location, options?)
 *
 * @param {string} vibe  — 'chill' | 'fun' | 'romantic' | 'adventure' | 'foodie'
 * @param {{ lat: number, lng: number }} location
 * @param {{ radius?: number, maxResults?: number }} options
 * @returns {Promise<Place[]>}
 */
export async function getPlacesByVibe(vibe, location, options = {}) {
  const { radius = 8000, maxResults = 10 } = options;
  const config = VIBE_CONFIG[vibe?.toLowerCase()];

  if (!config) throw new Error(`Unknown vibe: "${vibe}"`);
  if (!location?.lat || !location?.lng) throw new Error('location must have lat and lng');

  const seen = new Set();
  const allPlaces = [];

  // Fetch by types
  const typeResults = await Promise.allSettled(
    config.types.map((type) =>
      fetchByType({ lat: location.lat, lng: location.lng, type, keyword: config.keywords[0], radius })
    )
  );

  for (const result of typeResults) {
    if (result.status !== 'fulfilled') continue;
    for (const raw of result.value) {
      if (!seen.has(raw.place_id)) {
        seen.add(raw.place_id);
        allPlaces.push(normalize(raw));
      }
    }
  }

  // Fetch by keywords
  const keywordResults = await Promise.allSettled(
    config.keywords.slice(0, 4).map((keyword) =>
      fetchByType({ lat: location.lat, lng: location.lng, type: config.types[0], keyword, radius })
    )
  );

  for (const result of keywordResults) {
    if (result.status !== 'fulfilled') continue;
    for (const raw of result.value) {
      if (!seen.has(raw.place_id)) {
        seen.add(raw.place_id);
        allPlaces.push(normalize(raw));
      }
    }
  }

  // Filter by quality
  const filtered = allPlaces.filter(
    (p) => p.rating >= 4.2 && p.totalRatings >= 50
  );

  // Sort by quality score: rating * log(totalRatings)
  const sorted = filtered.sort((a, b) => {
    const scoreA = (a.rating || 0) * Math.log(Math.max(a.totalRatings || 1, 1));
    const scoreB = (b.rating || 0) * Math.log(Math.max(b.totalRatings || 1, 1));
    return scoreB - scoreA;
  });

  // If filtered is empty, fall back to unfiltered sorted
  const finalList = sorted.length > 0 ? sorted : allPlaces.sort((a, b) =>
    ((b.rating || 0) - (a.rating || 0))
  );

  return finalList.slice(0, maxResults);
}

// ─────────────────────────────────────────────────────────────
// Public: price level formatter
// ─────────────────────────────────────────────────────────────
export function formatPrice(level) {
  if (level === null || level === undefined) return null;
  return '$'.repeat(level + 1);
}