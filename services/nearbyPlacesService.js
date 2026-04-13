// services/nearbyPlacesService.js
// ─────────────────────────────────────────────────────────────
// Plannie — Places Search Service
// Architecture: Local-first multi-pass pipeline
//
// PIPELINE:
//   Pass A → strict local search (tight radius, area-matched only)
//   Pass B → local radius expansion (still area-first)
//   Pass C → nearby expansion (only if A+B insufficient)
//
// SORTING ORDER:
//   1. isInArea (locality match) — ALWAYS first
//   2. distance from selected coords
//   3. rating + reviews — ONLY within same locality group
//
// ROOT CAUSE OF STUDIO CITY PROBLEM (now fixed):
//   Old code sorted globally by rating BEFORE locality filtering.
//   A 4.8★ Los Angeles restaurant beat a 4.4★ Studio City restaurant
//   even though the user selected Studio City. Fixed by splitting
//   results into local vs non-local buckets FIRST, sorting each
//   bucket independently, then combining local-first.
// ─────────────────────────────────────────────────────────────

import { activityVenueSignals } from './placesService';

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';
const TARGET_COUNT   = 15;

const CATEGORY_TYPES = {
  food:     ['restaurant'],
  drinks:   ['bar', 'night_club'],
  coffee:   ['cafe'],
  activity: [],
};

const MOMENT_KEYWORDS = {
  first_date:       { food: 'romantic restaurant date night',  drinks: 'cocktail bar',       coffee: 'cozy cafe',       activity: 'topgolf mini golf ice skating karaoke stand up comedy' },
  casual_hangout:   { food: 'casual restaurant',               drinks: 'pub bar sports',     coffee: 'coffee shop',     activity: 'bowling karaoke mini golf skating' },
  date_night:       { food: 'fine dining dinner upscale',      drinks: 'wine bar lounge',    coffee: 'dessert cafe',    activity: 'topgolf stand up comedy movie theater karaoke' },
  special_occasion: { food: 'upscale fine dining',             drinks: 'rooftop bar',        coffee: 'patisserie',      activity: 'topgolf golf driving range comedy show' },
  chill:            { food: 'casual dining',                   drinks: 'sports bar pub',     coffee: 'coffee tea',      activity: 'mini golf ice skating bowling movie theater' },
  going_out:        { food: 'popular restaurant nightlife',    drinks: 'nightclub bar',      coffee: 'late night cafe', activity: 'karaoke stand up comedy escape room' },
  activity:         { food: 'quick bite',                      drinks: 'game bar',           coffee: 'boba cafe',       activity: 'topgolf bowling axe throwing skating' },
};

const ACTIVITY_KEYWORD_SEARCHES = [
  { keyword: 'escape room' },
  { keyword: 'bowling alley' },
  { keyword: 'mini golf' },
  { keyword: 'go kart' },
  { keyword: 'axe throwing' },
  { keyword: 'vr experience' },
  { keyword: 'skating rink' },
  { keyword: 'billiards' },
  { keyword: 'comedy club' },
  { keyword: 'movie theater' },
];

const BLOCKED = [
  'park', 'trail', 'garden', 'national', 'state park',
  'gamestop','game stop','best buy','walmart','target','costco',
  'home depot','dollar tree','dollar general','marshalls','ross ',
  'walgreens','cvs','rite aid','dollar store','five below',
  'dave and buster','dave & buster','round 1','round one',
  'main event','palace entertainment','chuck e cheese',
  'arcade','barcade',
  'kids','kiddie','kidz','children','toddler','indoor playground',
  'soft play','bounce','trampoline','sky zone','urban air',
  'gym','fitness','crossfit','ymca','planet fitness','orangetheory',
  'hospital','clinic','medical','dental','pharmacy',
  'school','church','storage','auto repair',
];

function isBlocked(name) {
  const n = (name || '').toLowerCase();
  return BLOCKED.some(kw => n.includes(kw));
}

export function calcDistance(from, to) {
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

export function isInArea(place, areaName) {
  if (!areaName) return false;
  const area     = areaName.toLowerCase().trim();
  const vicinity = (place.vicinity || '').toLowerCase();
  const addr     = (place.formatted_address || place.vicinity || '').toLowerCase();
  if (vicinity.includes(area) || addr.includes(area)) return true;
  const words = area.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 1) {
    if (words.every(w => vicinity.includes(w))) return true;
    if (words.every(w => addr.includes(w)))     return true;
  }
  return false;
}

function passesQuality(place, minRating = 3.8, minReviews = 10, category = '') {
  if ((place.rating ?? 0) < minRating)             return false;
  if ((place.user_ratings_total ?? 0) < minReviews) return false;
  const hybrid = category === 'activity' && activityVenueSignals(place);
  if (!hybrid) {
    if (place.types?.includes('store')) return false;
    if (place.types?.includes('park')) return false;
    if (place.types?.includes('tourist_attraction')) return false;
  }
  if (isBlocked(place.name))                        return false;
  return true;
}

async function nearbySearch({ lat, lng, type, keyword, radius }) {
  const params = new URLSearchParams({ location: `${lat},${lng}`, radius: String(radius), key: GOOGLE_API_KEY });
  if (type) params.set('type', type);
  if (keyword) params.set('keyword', keyword);
  try {
    const res  = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`);
    const data = await res.json();
    return data.results || [];
  } catch { return []; }
}

async function batchSearch({ lat, lng, types, keyword, radius, seen }) {
  const results = [];
  await Promise.allSettled(
    types.map(async (type) => {
      const places = await nearbySearch({ lat, lng, type, keyword, radius });
      for (const p of places) {
        if (!seen.has(p.place_id)) { seen.add(p.place_id); results.push(p); }
      }
    })
  );
  return results;
}

async function activityKeywordSearch({ lat, lng, radius, seen }) {
  const results = [];
  await Promise.allSettled(
    ACTIVITY_KEYWORD_SEARCHES.map(async ({ keyword: kw }) => {
      const places = await nearbySearch({ lat, lng, type: '', keyword: kw, radius });
      for (const p of places) {
        if (!seen.has(p.place_id)) { seen.add(p.place_id); results.push(p); }
      }
    })
  );
  return results;
}

function sortBucket(places, origin) {
  return places.slice().sort((a, b) => {
    const dA = calcDistance(origin, a.geometry?.location);
    const dB = calcDistance(origin, b.geometry?.location);
    if (Math.abs(dA - dB) < 1.0) return (b.rating ?? 0) - (a.rating ?? 0);
    return dA - dB;
  });
}

// 0 = exact (area string or ≤2 mi), 1 = adjacent local (≤3 mi), 2 = wider — distance only, no hardcoded cities
function localityTier(place, origin, areaName) {
  const loc = place.geometry?.location;
  const dMi = calcDistance(origin, loc);
  const inAreaStr = areaName && isInArea(place, areaName);
  if (inAreaStr || dMi <= 2) return 0;
  if (dMi <= 3) return 1;
  return 2;
}

function mapPlace(p, origin, areaName, isExpanded = false) {
  const dist = calcDistance(origin, p.geometry?.location);
  const tier = areaName ? localityTier(p, origin, areaName) : 2;
  const expanded = areaName ? tier >= 1 : isExpanded;
  return {
    id:           p.place_id,
    name:         p.name,
    rating:       p.rating ? parseFloat(p.rating).toFixed(1) : null,
    totalRatings: p.user_ratings_total || 0,
    address:      p.vicinity || '',
    distance:     dist.toFixed(1),
    inArea:       isInArea(p, areaName),
    isExpanded:   expanded,
    types:        p.types || [],
    photoUrl:     p.photos?.[0]?.photo_reference
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
      : null,
    location: {
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
    },
  };
}

// ── MAIN: getNearbyPlaces ─────────────────────────────────────
function pushByTier(p, origin, areaName, tier0, tier1, tier2, placedIds) {
  const id = p.place_id;
  if (!id || placedIds.has(id)) return;
  placedIds.add(id);
  const t = areaName ? localityTier(p, origin, areaName) : 2;
  if (t === 0) tier0.push(p);
  else if (t === 1) tier1.push(p);
  else tier2.push(p);
}

export async function getNearbyPlaces({ lat, lng, category = 'food', moment = 'casual_hangout', areaName = '' }) {
  const types   = CATEGORY_TYPES[category] || ['restaurant'];
  const keyword = MOMENT_KEYWORDS[moment]?.[category] || '';
  const origin  = { lat, lng };
  const seen    = new Set();
  const tier0Raw = [];
  const tier1Raw = [];
  const tier2Raw = [];
  const placedInTiers = new Set();

  // Pass A: tight local search (3km)
  let passA = [];
  if (category === 'activity') {
    passA = await activityKeywordSearch({ lat, lng, radius: 5000, seen });
  } else {
    passA = await batchSearch({ lat, lng, types, keyword, radius: 3000, seen });
  }
  for (const p of passA) {
    if (!passesQuality(p, 3.8, 10, category)) continue;
    pushByTier(p, origin, areaName, tier0Raw, tier1Raw, tier2Raw, placedInTiers);
  }

  // Pass B: expand radius if not enough in exact + adjacent tiers
  if (tier0Raw.length + tier1Raw.length < TARGET_COUNT) {
    for (const radius of [5000, 8000, 12000]) {
      let more = [];
      if (category === 'activity') {
        more = await activityKeywordSearch({ lat, lng, radius, seen });
      } else {
        more = await batchSearch({ lat, lng, types, keyword, radius, seen });
      }
      for (const p of more) {
        if (!passesQuality(p, 3.8, 10, category)) continue;
        pushByTier(p, origin, areaName, tier0Raw, tier1Raw, tier2Raw, placedInTiers);
      }
      if (tier0Raw.length + tier1Raw.length >= TARGET_COUNT) break;
    }
  }

  // Pass C: wider fallback to fill remaining slots
  if (tier0Raw.length + tier1Raw.length + tier2Raw.length < TARGET_COUNT) {
    const more = category === 'activity'
      ? await activityKeywordSearch({ lat, lng, radius: 20000, seen })
      : await batchSearch({ lat, lng, types, keyword, radius: 20000, seen });
    for (const p of more) {
      if (!passesQuality(p, 3.8, 10, category)) continue;
      pushByTier(p, origin, areaName, tier0Raw, tier1Raw, tier2Raw, placedInTiers);
    }
  }

  const combined = [
    ...sortBucket(tier0Raw, origin),
    ...sortBucket(tier1Raw, origin),
    ...sortBucket(tier2Raw, origin),
  ];

  return combined.slice(0, 20).map(p => mapPlace(p, origin, areaName, localityTier(p, origin, areaName) >= 1));
}

// ── EXPORT: getExpandedPlaces ─────────────────────────────────
// Called by "Expand to Nearby Areas" button.
// Returns NEW places not already shown, from wider radius.
export async function getExpandedPlaces({ lat, lng, category = 'food', moment = 'casual_hangout', areaName = '', existingIds = [] }) {
  const types   = CATEGORY_TYPES[category] || ['restaurant'];
  const keyword = MOMENT_KEYWORDS[moment]?.[category] || '';
  const origin  = { lat, lng };
  const seen    = new Set(existingIds);
  const all     = [];

  for (const radius of [15000, 25000, 40000]) {
    const results = category === 'activity'
      ? await activityKeywordSearch({ lat, lng, radius, seen })
      : await batchSearch({ lat, lng, types, keyword, radius, seen });
    for (const p of results) {
      if (!passesQuality(p, 3.8, 10, category)) continue;
      all.push(p);
    }
    if (all.length >= 15) break;
  }

  return sortBucket(all, origin).slice(0, 15).map(p => mapPlace(p, origin, areaName, true));
}