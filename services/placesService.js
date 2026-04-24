// services/placesService.js
// Category search + helpers used across plan flow, cart, and results.
import { getNearbyPlaces } from './nearbyPlacesService';

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';

const TYPE_READABLE_ORDER = [
  'restaurant',
  'food',
  'bar',
  'night_club',
  'cafe',
  'movie_theater',
  'drive-in_theater', 
  'bowling_alley',
  'tourist_attraction',
  'amusement_park',
  'spa',
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
  const searchTypes = requestedTypes.length > 0 ? requestedTypes : ['tourist_attraction'];
  const radius = options.radius ?? 8000;
  const maxResults = Math.min(Math.max(options.maxResults ?? 12, 1), 40);

  const customKw =
    options.keyword != null && String(options.keyword).trim() !== ''
      ? String(options.keyword).trim()
      : null;

  /** Types where Google "type" is enough unless caller passes a single refinement keyword. */
  const TYPE_ONLY = new Set([
    'movie_theater',
    'drive-in_theater',
    'bowling_alley',
    'amusement_park',
    'amusement_center',
    'spa',
    'night_club',
  ]);

  function resolveKeywordForType(type) {
    if (TYPE_ONLY.has(type)) return customKw || null;
    if (customKw) return customKw;
    switch (type) {
      case 'restaurant':
        return 'restaurant';
      case 'cafe':
        return 'coffee';
      case 'bar':
        return 'bar';
      default:
        return null;
    }
  }

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
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: String(radius),
        key: GOOGLE_API_KEY,
      });

      if (type) params.set('type', type);
      const keyword = resolveKeywordForType(type);
      if (keyword) params.set('keyword', keyword);

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
            priceLevel: p.price_level ?? null,
          });
        });
      } catch {}
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

  return results.filter((p) => p.location).slice(0, maxResults);
}

/** Parks, trails, passive nature — exclude from activity keyword results. */
export function isPassiveOutdoorActivityPlace(place) {
  const n = (place.name || '').toLowerCase();
  const types = place.types || [];
  const BAD = [
    'dog park', 'dog run', 'off-leash', 'off leash', 'bark park',
    'trail', 'trailhead', 'hiking', 'hike ', 'walkway',
    'national park', 'state park', 'provincial park', 'county park',
    'nature preserve', 'nature reserve', 'natural area', 'open space',
    'scenic overlook', 'scenic viewpoint', 'lookout point',
    'campground', 'rv park', 'picnic grove',
    'botanical garden', 'arboretum', 'national forest',
    'wildlife refuge', 'wetland', 'conservation area',
  ];
  if (BAD.some((k) => n.includes(k))) return true;
  if (types.includes('park')) return true;
  if (types.includes('campground')) return true;
  if (types.includes('rv_park')) return true;
  if (types.includes('natural_feature')) return true;
  return false;
}

/** Single-keyword nearby searches merged (no OR strings). No park / tourist_attraction type. */
const ACTIVITY_MERGE_KEYWORDS = [
  'bowling alley',
  'billiards',
  'pool hall',
  'arcade bar',
  'go kart',
  'mini golf',
  'golf driving range',
  'driving range',
  'Topgolf',
  'roller skating rink',
  'skating rink',
  'skate center',
  'ice skating rink',
  'ice arena',
  'axe throwing',
  'axe throwing bar',
  'escape room',
  'VR experience',
  'fun center',
  'rage room',
  'paint and sip',
];

const INDOOR_ACTIVITY_KEYWORDS = [
  'bowling alley',
  'billiards',
  'pool hall',
  'arcade bar',
  'escape room',
  'VR experience',
  'rage room',
  'paint and sip',
];

const OUTDOOR_ACTIVITY_KEYWORDS = [
  'go kart',
  'mini golf',
  'golf driving range',
  'driving range',
  'Topgolf',
];

export async function getActivityPlacesMerged(coords, options = {}) {
  const lat = coords?.lat;
  const lng = coords?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return [];

  const radius = options.radius ?? 10000;
  const maxPerKeyword = Math.min(Math.max(options.maxPerKeyword ?? 10, 1), 20);
  const dateIdea = String(options.dateIdea || '').toLowerCase();
  const activeKeywords =
    dateIdea === 'indoor'
      ? INDOOR_ACTIVITY_KEYWORDS
      : dateIdea === 'outdoor'
        ? OUTDOOR_ACTIVITY_KEYWORDS
        : ACTIVITY_MERGE_KEYWORDS;
  console.log('[ActivityEngine] start radius:', radius);

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
  const inferActivityCategory = (name = '') => {
    const n = String(name).toLowerCase();
    if (n.includes('bowling')) return 'bowling';
    if (n.includes('billiard') || n.includes('pool hall')) return 'billiards';
    if (n.includes('go kart') || n.includes('kart')) return 'go_kart';
    if (n.includes('mini golf') || n.includes('putt')) return 'mini_golf';
    if (n.includes('topgolf') || n.includes('driving range')) return 'golf_driving_range';
    if (n.includes('roller') || n.includes('skating rink')) return 'roller_skating';
    if (n.includes('ice skating') || n.includes('ice rink') || n.includes('ice arena')) return 'ice_skating';
    if (n.includes('axe throw')) return 'axe_throwing';
    if (n.includes('escape')) return 'escape_room';
    if (n.includes('vr ') || n.includes('virtual reality')) return 'vr_experience';
    if (n.includes('rage room')) return 'rage_room';
    if (n.includes('paint and sip') || (n.includes('paint') && n.includes('sip'))) return 'paint_and_sip';
    return 'other';
  };

  await Promise.all(
    activeKeywords.map(async (keyword) => {
      console.log('[ActivityEngine] keyword:', keyword);
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: String(radius),
        keyword,
        key: GOOGLE_API_KEY,
      });
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        const results = (data.results || []).slice(0, maxPerKeyword);
        console.log('[ActivityEngine] keyword results:', keyword, results.length);

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
            priceLevel: p.price_level ?? null,
            // Include keyword context so pool-hall/billiards aliases collapse reliably.
            activityCategory: inferActivityCategory(`${p.name || ''} ${keyword}`),
          });
        });
      } catch {}
    })
  );

  const mergedResults = Array.from(byId.values())
    .filter((p) => p.location)
    .filter((p) => !isPassiveOutdoorActivityPlace(p));
  console.log('[ActivityEngine] merged total:', mergedResults.length);
  return mergedResults;
}

const MOVIE_MERGE_KEYWORDS = ['movie theater', 'drive-in theater', 'drive in movie'];

export async function getMoviePlacesMerged(coords, options = {}) {
  const lat = coords?.lat;
  const lng = coords?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return [];

  const radius = options.radius ?? 5000;
  const maxPerKeyword = Math.min(Math.max(options.maxPerKeyword ?? 10, 1), 20);
  const maxPerChain = Math.min(Math.max(options.maxPerChain ?? 3, 1), 5);
  const maxTotal = Math.min(Math.max(options.maxTotal ?? 10, 1), 20);

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

  const inferChain = (name = '') => {
    const n = String(name).toLowerCase();
    if (n.includes('amc')) return 'amc';
    if (n.includes('regal')) return 'regal';
    if (n.includes('cinemark')) return 'cinemark';
    if (n.includes('harkins')) return 'harkins';
    if (n.includes('landmark')) return 'landmark';
    if (n.includes('alamo drafthouse')) return 'alamo';
    if (n.includes('cinepolis') || n.includes('cinépolis')) return 'cinepolis';
    if (n.includes('ipic')) return 'ipic';
    if (n.includes('showcase')) return 'showcase';
    return 'independent';
  };

  const byId = new Map();
  await Promise.all(
    MOVIE_MERGE_KEYWORDS.map(async (keyword) => {
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: String(radius),
        keyword,
        key: GOOGLE_API_KEY,
      });
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        const results = (data.results || []).slice(0, maxPerKeyword);

        results.forEach((p) => {
          if (!p?.place_id || byId.has(p.place_id)) return;

          const location =
            p.geometry?.location &&
            typeof p.geometry.location.lat === 'number' &&
            typeof p.geometry.location.lng === 'number'
              ? { lat: p.geometry.location.lat, lng: p.geometry.location.lng }
              : null;
          const distanceMiles = toMiles({ lat, lng }, location);
          const lowerName = String(p.name || '').toLowerCase();
          const movieFormat = lowerName.includes('drive-in') || lowerName.includes('drive in')
            ? 'drive_in'
            : 'standard_theater';

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
            priceLevel: p.price_level ?? null,
            movieFormat,
            movieChain: inferChain(p.name),
          });
        });
      } catch {}
    })
  );

  const merged = Array.from(byId.values()).filter((p) => p.location);
  merged.sort((a, b) => {
    const aDrive = a.movieFormat === 'drive_in' ? 1 : 0;
    const bDrive = b.movieFormat === 'drive_in' ? 1 : 0;
    if (bDrive !== aDrive) return bDrive - aDrive;
    const ar = Number(a.rating || 0);
    const br = Number(b.rating || 0);
    if (br !== ar) return br - ar;
    return (b.totalRatings || 0) - (a.totalRatings || 0);
  });

  const chainCounts = {};
  const balanced = merged.filter((p) => {
    const c = p.movieChain || 'independent';
    chainCounts[c] = (chainCounts[c] || 0) + 1;
    return chainCounts[c] <= maxPerChain;
  });

  return balanced.slice(0, maxTotal);
}

export async function fetchPlaceDetails(placeId) {
  if (!placeId) return null;
  const fields = 'name,rating,user_ratings_total,formatted_address,photos,opening_hours,reviews,price_level';
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
      openNow:       r.opening_hours?.open_now ?? null,
      hoursToday:    (() => {
        const wt = r.opening_hours?.weekday_text;
        if (!wt?.length) return null;
        const day = new Date().getDay();
        const idx = day === 0 ? 6 : day - 1;
        return wt[idx] || null;
      })(),
      reviewSnippet: r.reviews?.[0]?.text?.slice(0, 150) || null,
      priceLevel:    r.price_level ?? null,
    };
  } catch {
    return null;
  }
}
