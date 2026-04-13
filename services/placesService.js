// services/placesService.js
// ─────────────────────────────────────────────────────────────
// Google Places API — Plannie
// Category-based search, neighborhood support, multi-stop
// distance logic, category cleanup, curation labels
// ─────────────────────────────────────────────────────────────

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';
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
// PART 7 — Curation label per place
// "We picked this because it's nearby, highly rated..."
// ─────────────────────────────────────────────────────────────
export function getCurationLabel(place, category) {
  const reasons = [];
  if (place.rating >= 4.8)           reasons.push('top-rated');
  else if (place.rating >= 4.5)      reasons.push('highly rated');
  if (place.totalRatings > 1000)     reasons.push('very popular');
  if (place.isOpenNow)               reasons.push('open now');
  if (place.distance && place.distance <= 2) reasons.push('close by');

  if (reasons.length === 0) reasons.push('nearby');

  const categoryNotes = {
    activity: 'a fun shared experience',
    food:     'a great dining choice',
    drinks:   'perfect for drinks together',
    coffee:   'ideal for a relaxed coffee date',
  };

  const key = String(category || '').toLowerCase();
  const note = categoryNotes[key] || 'a great fit for your plan';
  return `We picked this because it's ${reasons.slice(0, 2).join(' and ')}, and ${note}.`;
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
// ISSUE 4 — Improved smart scoring
// Quality signals weighted higher than distance
// Better places slightly farther should beat mediocre ones nearby
// ─────────────────────────────────────────────────────────────
function scorePlace(p, selectedArea = '') {
  const rating   = p.rating       || 0;
  const reviews  = p.totalRatings || 0;
  const distance = p.distanceMiles || 0;

  // Quality-first scoring:
  // rating*3 + log(reviews) - distance*0.8
  // Distance penalty is mild — a great place 4 miles away beats
  // a mediocre one 0.5 miles away
  const logReviews = reviews > 0 ? Math.log10(reviews) * 2 : 0;
  let score = (rating * 3) + logReviews - (distance * 0.8);

  // Local area boost: +2 if address mentions selected area
  if (selectedArea) {
    const addr = (p.address || '').toLowerCase();
    const area = selectedArea.toLowerCase();
    if (addr.includes(area)) score += 4;
  }

  // Distance penalty: -2 if more than 5 miles (less strict than before)
  if (distance > 5) score -= 2;
  // Hard penalty for very far places (>10 miles)
  if (distance > 10) score -= 4;

  // Boost for highly reviewed places (social proof)
  if (reviews > 500)  score += 0.5;
  if (reviews > 2000) score += 1.0;
  if (rating >= 4.7)  score += 1.0;

  return score;
}

// ─────────────────────────────────────────────────────────────
// PART 3 — Category variety: cap bars/nightlife at 4,
// ensure mixed types in final list
// ─────────────────────────────────────────────────────────────
const BAR_TYPES  = new Set(['bar', 'night_club', 'Bar', 'Night Club', 'Bar & Lounge']);
const FOOD_TYPES = new Set(['restaurant', 'cafe', 'bakery', 'Restaurant', 'Café', 'Bakery']);

function enforceVariety(places, maxResults = 12) {
  const barSlots    = 6;
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
// ─────────────────────────────────────────────────────────────
// ISSUE 3 — Retail/store exclusion
// These place types and name keywords should never appear
// as date activities unless the vibe explicitly allows shopping
// ─────────────────────────────────────────────────────────────
const RETAIL_TYPES = new Set([
  'store', 'clothing_store', 'shoe_store', 'home_goods_store',
  'furniture_store', 'hardware_store', 'electronics_store',
  'bicycle_store', 'book_store', 'pet_store', 'supermarket',
  'grocery_or_supermarket', 'convenience_store', 'department_store',
  'jewelry_store', 'liquor_store', 'pharmacy', 'car_dealer',
  'car_rental', 'car_repair', 'car_wash', 'locksmith', 'moving_company',
  'painter', 'plumber', 'roofing_contractor', 'storage',
]);

const RETAIL_NAME_KEYWORDS = [
  'store', ' shop', 'supply', 'supplies', 'outlet', 'warehouse',
  'dealer', 'equipment', 'retail', 'pro shop', 'sporting goods',
  'gun shop', 'paintball supply', 'gear',
];

// ─────────────────────────────────────────────────────────────
// Names that signal a cheap/generic place not worth a date
// ─────────────────────────────────────────────────────────────
const CHEAP_NAME_KEYWORDS = [
  'boba', 'bubble tea', '7-eleven', '7 eleven', 'wawa', 'sheetz',
  'dollar', 'subway', 'mcdonald', 'burger king', 'wendy', 'taco bell',
  'jack in the box', 'del taco', 'carl\'s jr', 'sonic drive',
  'domino', 'pizza hut', 'little caesars', 'church\'s chicken',
  'popeyes', 'raising cane', 'panda express', 'chipotle', 'wingstop',
  'habit burger', 'in-n-out', 'five guys', 'shake shack',
  'jamba', 'smoothie king', 'coffee bean', 'dutch bros',
  'starbucks', 'dunkin', 'krispy kreme', 'baskin',
  'supercuts', 'great clips', 'h&r block', 'uhaul',
];

function isRetailPlace(p, allowShopping = false) {
  if (allowShopping) return false;
  // Check Google place types
  const types = p.types || [];
  if (types.some(t => RETAIL_TYPES.has(t))) return true;
  // Check name for retail keywords
  const name = (p.name || '').toLowerCase();
  if (RETAIL_NAME_KEYWORDS.some(kw => name.includes(kw))) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────
// Dating suitability filter
// Excludes places intended for children/families
// Allows adult-friendly versions (bowling, arcade bars, D&B etc.)
// ─────────────────────────────────────────────────────────────
const KIDS_NAME_KEYWORDS = [
  'kids', 'kid\'s', 'children', 'child\'s', 'family fun center',
  'indoor playground', 'trampoline park', 'jump park', 'jump zone',
  'play zone', 'playzone', 'soft play', 'chuck e cheese', "chuck e. cheese",
  'kids gym', 'kiddie', 'kidz', 'little gym', 'bouncy castle',
  'toddler', 'tot ', 'pee-wee', 'peewee', 'junior', 'discovery zone',
  'fun factory', 'playplace', 'play place', 'play land', 'ninjump',
  'urban air', 'sky zone', 'altitude trampoline',
];

// Google types that are almost exclusively child-focused
const KIDS_TYPES = new Set([
  'amusement_park', // keep only if name sounds adult (checked below)
]);

// Adult-friendly overrides — these are OK even if they sound similar
const ADULT_FRIENDLY_NAMES = [
  'dave & buster', "dave and buster", 'main event',
  'bowlero', 'lucky strike', 'punch bowl',
  'topgolf', 'k1 speed', 'octane raceway',
  'axe', 'escape room', 'breakout',
];

export function isCoupleFriendly(place) {
  const name  = (place.name || '').toLowerCase();
  const types = place.types || [];

  // ✅ Always allow explicit adult-friendly venues
  if (ADULT_FRIENDLY_NAMES.some(kw => name.includes(kw))) return true;

  // ❌ Exclude by name keywords
  if (KIDS_NAME_KEYWORDS.some(kw => name.includes(kw))) return false;

  // ❌ Exclude pure amusement parks unless name signals adult venue
  if (types.includes('amusement_park')) {
    const adultSignals = ['bar', 'lounge', 'golf', 'speed', 'race', 'axe', 'escape'];
    if (!adultSignals.some(s => name.includes(s))) return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
// Budget → quality / price hints (category flows only)
// ─────────────────────────────────────────────────────────────
function thresholdsForBudget(budget) {
  if (budget === '$') return { minRating: 3.7, minReviews: 8 };
  if (budget === '$$$') return { minRating: 4.2, minReviews: 35 };
  return { minRating: 4.0, minReviews: 10 };
}

function passesCategoryRules(p, category) {
  if (!category) return true;
  const types = p.types || [];
  const tset = new Set(types);
  const nameLower = (p.name || '').toLowerCase();

  if (category === 'food') {
    return tset.has('restaurant');
  }
  if (category === 'drinks') {
    return tset.has('bar') || tset.has('night_club');
  }
  if (category === 'coffee') {
    return tset.has('cafe') || nameLower.includes('coffee') || nameLower.includes('tea');
  }
  if (category === 'activity') {
    const types = p.types || [];
    const name  = (p.name || '').toLowerCase();

    const isRealActivity =
      types.includes('bowling_alley') ||
      types.includes('movie_theater') ||
      name.includes('escape') ||
      name.includes('kart') ||
      name.includes('axe') ||
      name.includes('vr') ||
      name.includes('skate') ||
      name.includes('billiard') ||
      name.includes('comedy');

    // Only block restaurant if NOT a real activity
    if (types.includes('restaurant') && !isRealActivity) return false;

    // Always block these
    if (types.includes('cafe')) return false;
    if (types.includes('bakery')) return false;

    return true;
  }
  return true;
}

// Hard block — same rules for every category (before category allowlists)
function applyHardBlock(places) {
  return places.filter((p) => {
    const types = p.types || [];
    const name = (p.name || '').toLowerCase();

    if (types.includes('park')) return false;
    if (types.includes('tourist_attraction')) return false;
    if (types.includes('store')) return false;

    if (name.includes('park')) return false;
    if (name.includes('trail')) return false;
    if (name.includes('garden')) return false;
    if (name.includes('sporting goods')) return false;

    return true;
  });
}

function filterAndSort(places, {
  minRating    = 4.0,
  minReviews   = 10,
  maxResults   = 12,
  selectedArea = '',
  allowShopping = false,
  category       = '',
  budget         = null,
} = {}) {
  const b = budget != null ? thresholdsForBudget(budget) : null;
  if (b) {
    minRating = b.minRating;
    minReviews = b.minReviews;
  }

  const blocked = applyHardBlock(places);
  const categoryFiltered = category
    ? blocked.filter(p => passesCategoryRules(p, category))
    : blocked;

  const noRetail = categoryFiltered.filter(p => !isRetailPlace(p, allowShopping));

  // ✅ Remove cheap/fast-food/generic chains — not date-worthy
  const noCheap = noRetail.filter(p => {
    const name = (p.name || '').toLowerCase();
    return !CHEAP_NAME_KEYWORDS.some(kw => name.includes(kw));
  });

  // ✅ Remove kids/family-focused places — Plannie is for couples
  const coupleFriendly = noCheap.filter(p => isCoupleFriendly(p));

  // Fallback: relax downstream filters only — never bypass hard block or category rules
  const pool0 =
  coupleFriendly.length >= 5 ? coupleFriendly :
  noCheap.length >= 5        ? noCheap :
  noRetail.length >= 5       ? noRetail :
  categoryFiltered;

  // Quality filter — 3-tier fallback so we never return empty
  const strict  = pool0.filter(p => (p.rating ?? 0) >= minRating && (p.totalRatings ?? 0) >= minReviews);
  const lenient = pool0.filter(p => (p.rating ?? 0) >= minRating);
  let pool      = strict.length >= 3 ? strict
                : lenient.length > 0 ? lenient
                : pool0;

  if (budget === '$$$' && ['food', 'drinks', 'coffee'].includes(category)) {
    const upscale = pool.filter(p => (p.price_level ?? 0) >= 2);
    if (upscale.length >= 3) pool = upscale;
  }
  if (budget === '$' && ['food', 'drinks', 'coffee'].includes(category)) {
    const modest = pool.filter(p => p.price_level == null || p.price_level <= 2);
    if (modest.length >= 3) pool = modest;
  }

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
// PART 4 — Multi-stop search: find next place near a previous one
// Used by food.js to search near the selected activity location
// radius 1500–2500m keeps stops geographically close
// ─────────────────────────────────────────────────────────────
export async function getPlacesNearby(types, nearLocation, options = {}) {
  const {
    radius = 5000, maxResults = 12, keyword = '', selectedArea = '',
    category = 'food', budget = null,
  } = options;
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

  return filterAndSort(withDist, {
    minRating: 3.8, minReviews: 10, maxResults, selectedArea, category, budget,
  });
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
// ─────────────────────────────────────────────────────────────
// CATEGORY-BASED SEARCH (keyword-driven; shared filter pipeline)
// ─────────────────────────────────────────────────────────────
export async function getPlacesByCategory(category, location, options = {}) {
  console.log('USING CATEGORY SYSTEM');
  const { radius = 5000, maxResults = 12, selectedArea = '', budget = null } = options;
  if (!location?.lat || !location?.lng) throw new Error('location must have lat and lng');

  const { lat, lng } = location;

  let keywords = [];

  if (category === 'activity') {
    keywords = [
      'escape room',
      'bowling alley',
      'mini golf',
      'go kart',
      'axe throwing',
      'vr experience',
      'skating rink',
      'billiards',
      'comedy club',
      'movie theater',
    ];
  } else if (category === 'food') {
    keywords = ['restaurant'];
  } else if (category === 'drinks') {
    keywords = ['bar', 'cocktail bar', 'wine bar', 'lounge'];
  } else if (category === 'coffee') {
    keywords = ['cafe', 'coffee', 'tea house'];
  } else {
    throw new Error(`Unknown category: "${category}"`);
  }

  const seen = new Set();
  const results = await Promise.allSettled(
    keywords.map(keyword => fetchByKeywordOnly({ lat, lng, keyword, radius }))
  );

  const allPlaces = [];
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

  return filterAndSort(withDist, {
    maxResults,
    selectedArea,
    category,
    budget,
  });
}