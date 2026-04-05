// services/placesService.js
// ─────────────────────────────────────────────────────────────
// Google Places API — Plannie
// Upgraded: neighborhood support, vibe filtering, multi-stop
// distance logic, category cleanup, curation labels
// ─────────────────────────────────────────────────────────────

const GOOGLE_API_KEY = 'AIzaSyCzjURXBC65HTlaZnYyGbCF6JJ1eMYQcq8';
const BASE_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

// ─────────────────────────────────────────────────────────────
// PART 5 — Readable type labels (no "point of interest")
// ─────────────────────────────────────────────────────────────
export const TYPE_LABELS = {
  restaurant:         'Restaurant',
  cafe:               'Café',
  bar:                'Bar',
  night_club:         'Night Club',
  park:               'Park',
  museum:             'Museum',
  art_gallery:        'Art Gallery',
  bowling_alley:      'Bowling Alley',
  amusement_park:     'Amusement Park',
  movie_theater:      'Cinema',
  spa:                'Spa',
  bakery:             'Bakery',
  florist:            'Flower Shop',
  tourist_attraction: 'Attraction',
  stadium:            'Stadium',
  aquarium:           'Aquarium',
  zoo:                'Zoo',
  casino:             'Casino',
  shopping_mall:      'Shopping Mall',
  gym:                'Gym',
  // Adventure-specific
  escape_room:        'Escape Room',
  amusement_center:   'Fun Activity',
  // Generics to skip
  point_of_interest:  null,   // null = skip this type
  establishment:      null,
  locality:           null,
  political:          null,
};

export function getReadableType(types = []) {
  for (const t of types) {
    const label = TYPE_LABELS[t];
    if (label === null) continue; // explicitly skip generic types
    if (label)         return label;
  }
  return 'Place';
}

// ─────────────────────────────────────────────────────────────
// PART 6 — Short location display for cards
// "123 Main St, Hollywood, Los Angeles" → "Hollywood"
// ─────────────────────────────────────────────────────────────
export function shortenVicinity(vicinity = '') {
  if (!vicinity) return '';
  const parts = vicinity.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length <= 1) return parts[0] || '';

  const streetPattern = /^\d+\s|blvd|ave|st\b|rd\b|dr\b|ln\b|way|pkwy|fwy|hwy/i;
  const SKIP = /^(USA|United States|United Kingdom|CA|NY|TX|FL|WA|OR|NV|AZ|CO)$/i;

  const meaningful = parts.filter((p, i) => {
    if (SKIP.test(p))                        return false;
    if (/^\d{5}(-\d{4})?$/.test(p))         return false;
    if (i === 0 && streetPattern.test(p))    return false;
    return true;
  });

  // Return just the neighborhood/area name (first meaningful part)
  return meaningful[0] || parts.slice(-2)[0] || '';
}

// ─────────────────────────────────────────────────────────────
// PART 3 — Vibe config: correct types per vibe, no irrelevant
// ─────────────────────────────────────────────────────────────
export const VIBE_CONFIG = {
  chill: {
    emoji: '☕',
    label: 'Chill',
    // Cafes, parks, cinemas — slow, cozy, easy
    types: ['cafe', 'movie_theater', 'park', 'spa'],
    keywords: ['coffee shop', 'scenic park', 'bookstore cafe', 'spa day'],
    color: '#A8DADC',
  },
  fun: {
    emoji: '🎉',
    label: 'Fun',
    // Bowling, clubs — playful and loud
    types: ['bowling_alley', 'night_club', 'amusement_park'],
    keywords: ['karaoke', 'comedy club', 'arcade games', 'dance club'],
    color: '#FFB347',
  },
  romantic: {
    emoji: '💕',
    label: 'Romantic',
    // Restaurants, bars, parks — dreamy and intimate
    types: ['restaurant', 'bar', 'park', 'art_gallery'],
    keywords: ['rooftop bar', 'wine bar', 'scenic viewpoint', 'botanical garden', 'jazz bar'],
    color: '#FF8FAB',
  },
  adventure: {
    emoji: '🏕️',
    label: 'Adventure',
    // Keyword-only — avoids generic tourist_attraction results
    types: [],
    keywords: [
      'go kart', 'escape room', 'axe throwing', 'arcade',
      'vr gaming', 'shooting range', 'topgolf',
      'trampoline park', 'climbing gym', 'paintball', 'laser tag',
    ],
    keywordsOnly: true,
    color: '#90BE6D',
  },
  foodie: {
    emoji: '🍜',
    label: 'Foodie',
    types: ['restaurant', 'cafe', 'bakery'],
    keywords: ['best restaurant', 'popular dining', 'highly rated restaurant', 'tasting menu'],
    color: '#F4A261',
  },
};

// ─────────────────────────────────────────────────────────────
// PART 7 — Curation label per place
// "We picked this because it's nearby, highly rated..."
// ─────────────────────────────────────────────────────────────
export function getCurationLabel(place, vibe) {
  const reasons = [];
  if (place.rating >= 4.8)           reasons.push('top-rated');
  else if (place.rating >= 4.5)      reasons.push('highly rated');
  if (place.totalRatings > 1000)     reasons.push('very popular');
  if (place.isOpenNow)               reasons.push('open now');
  if (place.distance && place.distance <= 2) reasons.push('close by');

  if (reasons.length === 0) reasons.push('nearby');

  const vibeReasons = {
    romantic:  'perfect for a romantic night',
    chill:     'great for a relaxed evening',
    fun:       'guaranteed to be a good time',
    adventure: 'an exciting experience',
    foodie:    'a great dining choice',
  };

  const vibeNote = vibeReasons[vibe?.toLowerCase()] || 'fits your vibe';
  return `We picked this because it's ${reasons.slice(0, 2).join(' and ')}, and ${vibeNote}.`;
}

// ─────────────────────────────────────────────────────────────
// Internal: fetch by keyword only (adventure path)
// ─────────────────────────────────────────────────────────────
async function fetchByKeywordOnly({ lat, lng, keyword, radius }) {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radius),
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
// Internal: fetch by type + optional keyword
// ─────────────────────────────────────────────────────────────
async function fetchByType({ lat, lng, type, keyword, radius }) {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radius),
    type,
    key: GOOGLE_API_KEY,
  });
  if (keyword) params.set('keyword', keyword);
  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API: ${data.status}`);
  }
  return data.results ?? [];
}

// ─────────────────────────────────────────────────────────────
// Internal: normalize a raw Google result
// ─────────────────────────────────────────────────────────────
function normalize(raw) {
  const photoRef = raw.photos?.[0]?.photo_reference ?? null;
  const types    = raw.types ?? [];
  return {
    id:            raw.place_id,
    name:          raw.name,
    address:       raw.vicinity ?? '',
    shortLocation: shortenVicinity(raw.vicinity ?? ''),
    rating:        raw.rating ?? null,
    totalRatings:  raw.user_ratings_total ?? 0,
    priceLevel:    raw.price_level ?? null,
    isOpenNow:     raw.opening_hours?.open_now ?? null,
    types,
    readableType:  getReadableType(types),  // for variety enforcement
    location: {
      lat: raw.geometry.location.lat,
      lng: raw.geometry.location.lng,
    },
    photoUrl:      photoRef ? buildPhotoUrl(photoRef) : null,
    photoRef,                               // keep raw ref for detail fetch
    distanceMiles: 0,                       // filled in by screen after geocoding
  };
}

// ─────────────────────────────────────────────────────────────
// Public: build Place Photo URL
// ─────────────────────────────────────────────────────────────
export function buildPhotoUrl(ref, maxWidth = 400) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
}

// ─────────────────────────────────────────────────────────────
// Internal: filter + sort pipeline
// PART 3: rating >= 4.2, reviews > 20 (lowered — smaller venues matter)
// Fallback: if strict filter gives <3 results, relax and return what we have
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Internal: haversine distance in miles
// ─────────────────────────────────────────────────────────────
function calcDistMiles(from, to) {
  if (!from?.lat || !to?.lat) return 0;
  const R    = 3958.8;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a    = Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
    Math.cos((to.lat  * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

// ─────────────────────────────────────────────────────────────
// PART 1 — Smart scoring formula
// score = (rating*2) + (reviews/1000) - (distance*1.5)
// ─────────────────────────────────────────────────────────────
function scorePlace(p, selectedArea = '') {
  const rating   = p.rating       || 0;
  const reviews  = p.totalRatings || 0;
  const distance = p.distanceMiles || 0;

  let score = (rating * 2) + (reviews / 1000) - (distance * 1.5);

  // PART 2 — Local area boost: +3 if address mentions selected area
  if (selectedArea) {
    const addr = (p.address || '').toLowerCase();
    const area = selectedArea.toLowerCase();
    if (addr.includes(area)) score += 3;
  }

  // PART 2 — Distance penalty: -3 if more than 3 miles away
  if (distance > 3) score -= 3;

  return score;
}

// ─────────────────────────────────────────────────────────────
// PART 3 — Category variety: cap bars/nightlife at 4,
// ensure mixed types in final list
// ─────────────────────────────────────────────────────────────
const BAR_TYPES  = new Set(['bar', 'night_club', 'Bar', 'Night Club', 'Bar & Lounge']);
const FOOD_TYPES = new Set(['restaurant', 'cafe', 'bakery', 'Restaurant', 'Café', 'Bakery']);

function enforceVariety(places, maxResults = 12) {
  const barSlots    = 4;
  const result      = [];
  let   barCount    = 0;

  for (const p of places) {
    if (result.length >= maxResults) break;

    const type = p.readableType || p.type || '';
    const isBar = BAR_TYPES.has(type) ||
      (p.types || []).some(t => t === 'bar' || t === 'night_club');

    if (isBar && barCount >= barSlots) continue; // skip excess bars
    if (isBar) barCount++;
    result.push(p);
  }

  // If we didn't fill 12, pull from remainder without bar cap
  if (result.length < maxResults) {
    const existing = new Set(result.map(p => p.id));
    for (const p of places) {
      if (result.length >= maxResults) break;
      if (!existing.has(p.id)) result.push(p);
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// Internal: filter + sort + variety pipeline
// ─────────────────────────────────────────────────────────────
function filterAndSort(places, {
  minRating    = 4.0,
  minReviews   = 10,
  maxResults   = 12,
  selectedArea = '',
} = {}) {
  // Quality filter — 3-tier fallback so we never return empty
  const strict  = places.filter(p => (p.rating ?? 0) >= 4.2 && (p.totalRatings ?? 0) >= 20);
  const lenient = places.filter(p => (p.rating ?? 0) >= minRating);
  const pool    = strict.length >= 3 ? strict
                : lenient.length > 0 ? lenient
                : places;

  // Attach score to each place
  const scored = pool.map(p => ({
    ...p,
    _score: scorePlace(p, selectedArea),
  }));

  // Sort by score DESC
  scored.sort((a, b) => b._score - a._score);

  // Apply variety cap then slice to maxResults
  return enforceVariety(scored, maxResults);
}

// ─────────────────────────────────────────────────────────────
// Public: main helper — used by activity.js, food.js, etc.
// PART 2: always uses lat/lng directly
// PART 3: vibe-based type filtering
// ─────────────────────────────────────────────────────────────
export async function getPlacesByVibe(vibe, location, options = {}) {
  const { radius = 8000, maxResults = 12, selectedArea = '' } = options;
  const config = VIBE_CONFIG[vibe?.toLowerCase()];

  if (!config) throw new Error(`Unknown vibe: "${vibe}"`);
  if (!location?.lat || !location?.lng) throw new Error('location must have lat and lng');

  const { lat, lng } = location;
  const seen = new Set();
  const allPlaces = [];

  if (config.keywordsOnly) {
    // ── Adventure: keyword-only, parallel fetch ──
    const results = await Promise.allSettled(
      config.keywords.map(keyword =>
        fetchByKeywordOnly({ lat, lng, keyword, radius })
      )
    );
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const raw of r.value) {
        if (!seen.has(raw.place_id)) {
          seen.add(raw.place_id);
          allPlaces.push(normalize(raw));
        }
      }
    }
  } else {
    // ── All other vibes: type + keyword ──
    const typeResults = await Promise.allSettled(
      config.types.map(type =>
        fetchByType({ lat, lng, type, keyword: config.keywords[0], radius })
      )
    );
    for (const r of typeResults) {
      if (r.status !== 'fulfilled') continue;
      for (const raw of r.value) {
        if (!seen.has(raw.place_id)) {
          seen.add(raw.place_id);
          allPlaces.push(normalize(raw));
        }
      }
    }

    // Additional keyword passes (capped at 3)
    const kwResults = await Promise.allSettled(
      config.keywords.slice(0, 3).map(keyword =>
        fetchByType({ lat, lng, type: config.types[0], keyword, radius })
      )
    );
    for (const r of kwResults) {
      if (r.status !== 'fulfilled') continue;
      for (const raw of r.value) {
        if (!seen.has(raw.place_id)) {
          seen.add(raw.place_id);
          allPlaces.push(normalize(raw));
        }
      }
    }
  }

  // Attach real distance before scoring so scorePlace can use it
  const withDist = allPlaces.map(p => ({
    ...p,
    distanceMiles: calcDistMiles({ lat, lng }, p.location),
  }));

  return filterAndSort(withDist, { maxResults, selectedArea });
}

// ─────────────────────────────────────────────────────────────
// PART 4 — Multi-stop search: find next place near a previous one
// Used by food.js to search near the selected activity location
// radius 1500–2500m keeps stops geographically close
// ─────────────────────────────────────────────────────────────
export async function getPlacesNearby(types, nearLocation, options = {}) {
  const { radius = 5000, maxResults = 12, keyword = '', selectedArea = '' } = options;
  const { lat, lng } = nearLocation;

  const seen = new Set();
  const allPlaces = [];

  const results = await Promise.allSettled(
    types.map(type => fetchByType({ lat, lng, type, keyword, radius }))
  );

  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const raw of r.value) {
      if (!seen.has(raw.place_id)) {
        seen.add(raw.place_id);
        allPlaces.push(normalize(raw));
      }
    }
  }

  const withDist = allPlaces.map(p => ({
    ...p,
    distanceMiles: calcDistMiles({ lat, lng }, p.location),
  }));

  return filterAndSort(withDist, { minRating: 3.8, minReviews: 10, maxResults, selectedArea });
}

// ─────────────────────────────────────────────────────────────
// PART 5 + 6 — Fetch full Place Details
// Use when a place needs photos, phone, website for the detail view
// or when photos are missing from the nearby search result
// ─────────────────────────────────────────────────────────────
export async function fetchPlaceDetails(placeId) {
  if (!placeId) return null;
  try {
    const fields = 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,photos,geometry';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.result) {
      const r = data.result;
      return {
        name:          r.name,
        phone:         r.formatted_phone_number || null,
        website:       r.website || null,
        formattedAddress: r.formatted_address || null,
        photos:        (r.photos || []).map(p => buildPhotoUrl(p.photo_reference, 600)),
        rating:        r.rating ?? null,
        totalRatings:  r.user_ratings_total ?? 0,
        lat:           r.geometry?.location?.lat ?? null,
        lng:           r.geometry?.location?.lng ?? null,
      };
    }
  } catch (e) {
    console.log('[fetchPlaceDetails] error:', e.message);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Public: price level formatter
// ─────────────────────────────────────────────────────────────
export function formatPrice(level) {
  if (level === null || level === undefined) return null;
  return '$'.repeat(level + 1);
}