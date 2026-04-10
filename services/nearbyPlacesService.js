// services/nearbyPlacesService.js
// ─────────────────────────────────────────────────────────────
// Plannie — Nearby Places Service
// Uses Google Places Nearby Search (NOT text search)
// Coordinates-first, area-aware, scored, variety-controlled
// ─────────────────────────────────────────────────────────────

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';

// ── Vibe → place types mapping ────────────────────────────────
const VIBE_TYPES = {
  // New flow moments
  first_date:       ['restaurant', 'cafe', 'bakery'],
  casual_hangout:   ['restaurant', 'cafe', 'bar'],
  date_night:       ['restaurant', 'bar', 'night_club'],
  special_occasion: ['restaurant', 'bar'],
  chill:            ['cafe', 'park', 'museum', 'restaurant'],
  going_out:        ['bar', 'night_club', 'restaurant'],
  activity:         ['bowling_alley', 'amusement_center', 'tourist_attraction'],

  // Category overrides
  food:     ['restaurant'],
  drinks:   ['bar', 'night_club'],
  coffee:   ['cafe'],
  activity: [
    'bowling_alley', 'amusement_center',
    'tourist_attraction', 'night_club',
  ],
};

// ── Keywords per category+moment ──────────────────────────────
const MOMENT_KEYWORDS = {
  first_date:       { food: 'romantic restaurant',  drinks: 'cocktail bar',      coffee: 'cozy cafe',       activity: 'bowling mini golf' },
  casual_hangout:   { food: 'casual restaurant',    drinks: 'pub bar',           coffee: 'coffee shop',     activity: 'arcade games' },
  date_night:       { food: 'fine dining',          drinks: 'wine bar lounge',   coffee: 'dessert cafe',    activity: 'entertainment' },
  special_occasion: { food: 'upscale restaurant',   drinks: 'rooftop bar',       coffee: 'patisserie',      activity: 'topgolf' },
  chill:            { food: 'casual dining',        drinks: 'sports bar',        coffee: 'coffee tea',      activity: 'park museum' },
  going_out:        { food: 'popular restaurant',   drinks: 'nightclub bar',     coffee: 'late night',      activity: 'escape room' },
  activity:         { food: 'quick bite',           drinks: 'game bar',          coffee: 'boba cafe',       activity: 'axe throwing' },
};

// ── Blocked name keywords ─────────────────────────────────────
const BLOCKED_KEYWORDS = [
  'gym', 'fitness', 'crossfit', 'ymca', 'planet fitness',
  'hospital', 'clinic', 'medical', 'dental', 'pharmacy',
  'chuck e cheese', 'kids', 'kiddie', 'kidz',
  'trampoline park', 'sky zone', 'urban air',
  'school', 'church', 'storage', 'auto repair',
  'state recreation area', 'park recreation',
];

// ── Haversine distance (miles) ────────────────────────────────
export function calculateDistance(from, to) {
  if (!from?.lat || !to?.lat) return 99;
  const R    = 3958.8;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a    = Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
    Math.cos((to.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Area match check ──────────────────────────────────────────
export function isInArea(place, areaName) {
  if (!areaName) return false;
  const area     = areaName.toLowerCase().trim();
  const vicinity = (place.vicinity || '').toLowerCase();
  const addr     = (place.formatted_address || place.vicinity || '').toLowerCase();

  // Full phrase match first — most reliable
  if (vicinity.includes(area) || addr.includes(area)) return true;

  // All significant words must appear (handles "North Hollywood", "Studio City")
  const words = area.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 1) {
    if (words.every(w => vicinity.includes(w))) return true;
    if (words.every(w => addr.includes(w)))     return true;
  }

  return false;
}

// ── Smart scoring ─────────────────────────────────────────────
export function scorePlace(place, originCoords, areaName) {
  const rating   = place.rating || 0;
  const reviews  = place.user_ratings_total || 0;
  const dist     = calculateDistance(originCoords, {
    lat: place.geometry?.location?.lat,
    lng: place.geometry?.location?.lng,
  });

  // Base score
  let score = (rating * 2) + (reviews / 1000) - (dist * 1.5);

  // Area bonus/penalty — most important factor
  if (isInArea(place, areaName)) {
    score += 3;  // in selected area → big boost
  } else {
    score -= 3;  // outside area → penalty
  }

  return score;
}

// ── Block check ───────────────────────────────────────────────
function isBlocked(place) {
  const name = (place.name || '').toLowerCase();
  return BLOCKED_KEYWORDS.some(kw => name.includes(kw));
}

// ── Single nearby search pass ─────────────────────────────────
async function nearbySearch({ lat, lng, type, keyword, radius }) {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius:   String(radius),
    type,
    key:      GOOGLE_API_KEY,
  });
  if (keyword) params.set('keyword', keyword);

  const res  = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`
  );
  const data = await res.json();
  return data.results || [];
}

// ── Variety cap: max N places per type ───────────────────────
function enforceVariety(places, maxPerType = 4) {
  const typeCounts = {};
  const result     = [];
  for (const p of places) {
    const primaryType = (p.types || ['other'])[0];
    typeCounts[primaryType] = (typeCounts[primaryType] || 0);
    if (typeCounts[primaryType] < maxPerType) {
      typeCounts[primaryType]++;
      result.push(p);
    }
  }
  return result;
}

// ── Main export ───────────────────────────────────────────────
export async function getNearbyPlaces({
  lat,
  lng,
  category,       // 'food' | 'drinks' | 'coffee' | 'activity'
  moment,         // e.g. 'first_date' | 'going_out'
  areaName,       // e.g. 'Studio City'
  expandedRadius, // true = wider search, relax area filter
}) {
  const types   = VIBE_TYPES[category]  || ['restaurant'];
  const keyword = MOMENT_KEYWORDS[moment]?.[category] || '';

  // ── Adaptive radius: tight by default, wider when expanded ──
  const radiusSteps = expandedRadius ? [8000, 12000] : [2000, 3500, 5000];
  const seen        = new Set();
  const allRaw      = [];

  for (const radius of radiusSteps) {
    // Fetch all types in parallel for this radius
    await Promise.allSettled(
      types.map(async (type) => {
        const results = await nearbySearch({ lat, lng, type, keyword, radius });
        for (const p of results) {
          if (!seen.has(p.place_id)) {
            seen.add(p.place_id);
            allRaw.push(p);
          }
        }
      })
    );

    // Count valid results (after basic quality filter)
    const validCount = allRaw.filter(p =>
      (p.rating ?? 0) >= 4.0 &&
      (p.user_ratings_total ?? 0) >= 20 &&
      !isBlocked(p)
    ).length;

    // If we have enough, stop expanding
    if (validCount >= 8) break;
  }

  // ── Filter ────────────────────────────────────────────────
  const filtered = allRaw.filter(p => {
    if ((p.rating ?? 0) < 4.0)            return false;
    if ((p.user_ratings_total ?? 0) < 20)  return false;
    if (isBlocked(p))                      return false;
    return true;
  });

  // ── Score each place ──────────────────────────────────────
  const origin = { lat, lng };
  const scored = filtered.map(p => ({
    ...p,
    _score:    scorePlace(p, origin, areaName),
    _inArea:   isInArea(p, areaName),
    _distance: calculateDistance(origin, {
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
    }),
  }));

  // ── Sort ──────────────────────────────────────────────────
  // Expanded mode: sort purely by distance then score
  // Default mode: area-first 3-bucket sort
  let sorted;
  if (expandedRadius) {
    sorted = scored.sort((a, b) =>
      a._distance - b._distance || b._score - a._score
    );
  } else {
    const bucket1 = scored.filter(p => p._inArea)
      .sort((a, b) => b._score - a._score);
    const bucket2 = scored.filter(p => !p._inArea && p._distance <= 8)
      .sort((a, b) => a._distance - b._distance || b._score - a._score);
    const bucket3 = scored.filter(p => !p._inArea && p._distance > 8)
      .sort((a, b) => b._score - a._score);
    sorted = [...bucket1, ...bucket2, ...bucket3];
  }

  // ── Variety cap ───────────────────────────────────────────
  const varied = enforceVariety(sorted, 4);

  // ── Map to clean output shape ─────────────────────────────
  return varied.slice(0, 15).map(p => ({
    id:             p.place_id,
    name:           p.name,
    rating:         p.rating ? parseFloat(p.rating).toFixed(1) : null,
    totalRatings:   p.user_ratings_total || 0,
    address:        p.vicinity || '',
    distance:       p._distance.toFixed(1),
    inArea:         p._inArea,
    types:          p.types || [],
    photoReference: p.photos?.[0]?.photo_reference || null,
    photoUrl:       p.photos?.[0]?.photo_reference
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
      : null,
    location: {
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
    },
  }));
}