// utils/devConfig.js — API cost protection for dev/test sessions
export const TEST_MODE = __DEV__;
export const SESSION_LIMIT = 25;

let _callCount = 0;
const _cache = new Map();

export function trackApiCall({ fn, category = '', dateIdea = '', keyword = '', radius = 0 }) {
  _callCount += 1;
  console.log(
    `[API_CALL] Places:${fn} count=${_callCount} category=${category} dateIdea=${dateIdea} keyword=${keyword} radius=${radius}`
  );
}

export function isLimitReached() {
  if (_callCount >= SESSION_LIMIT) {
    console.log('[API_LIMIT] Places session limit reached');
    return true;
  }
  return false;
}

export function getCallCount() {
  return _callCount;
}

function _round2(n) {
  return Math.round(n * 100) / 100;
}

export function makeCacheKey(lat, lng, fn, ...rest) {
  return [_round2(lat), _round2(lng), fn, ...rest.filter((x) => x != null && x !== '')].join('|');
}

export function getApiCache(key) {
  if (_cache.has(key)) {
    console.log(`[CACHE_HIT] ${key} — no API call`);
    return _cache.get(key);
  }
  return null;
}

export function setApiCache(key, data) {
  _cache.set(key, data);
}

// ── Test location detection ──────────────────────────────────────
const TEST_LOCATIONS = [
  { name: 'stanwood', lat: 48.237, lng: -122.373 },
  { name: 'studio_city', lat: 34.14, lng: -118.397 },
];
const DETECTION_RADIUS_KM = 30;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function detectLocation(lat, lng) {
  for (const loc of TEST_LOCATIONS) {
    if (haversineKm(lat, lng, loc.lat, loc.lng) <= DETECTION_RADIUS_KM) return loc.name;
  }
  return null;
}

// ── Mock place factory ───────────────────────────────────────────
function mp(id, name, lat, lng, types, rating, totalRatings, address, distanceMiles, priceLevel = 2) {
  return {
    id,
    name,
    rating,
    totalRatings,
    address,
    shortLocation: address.split(',').slice(-2).join(',').trim(),
    types,
    photoUrl: null,
    location: { lat, lng },
    distanceMiles,
    isOpenNow: null,
    priceLevel,
  };
}

// ── Stanwood WA mock data (lat≈48.237, lng≈-122.373) ────────────
const STANWOOD_FOOD = [
  mp('m_sw_f1', 'Stanwood Inn Restaurant',   48.239, -122.371, ['restaurant','food'],       4.4, 280, '9405 271st St NW, Stanwood, WA', 0.2),
  mp('m_sw_f2', 'Village Kitchen',           48.234, -122.375, ['restaurant','food'],       4.3, 195, '27125 102nd Ave NW, Stanwood, WA', 0.4),
  mp('m_sw_f3', 'Old Stanwood Cafe',         48.238, -122.370, ['restaurant','cafe','food'],4.6, 410, '8820 271st St NW, Stanwood, WA', 0.3),
  mp('m_sw_f4', 'Brew Coffee & Tap',         48.236, -122.376, ['cafe','bar','food'],       4.5, 315, '9320 270th St NW, Stanwood, WA', 0.5),
  mp('m_sw_f5', 'Rustic Table Bistro',       48.241, -122.372, ['restaurant','food'],       4.7, 520, '102 1st Ave N, Stanwood, WA',    0.8),
  mp('m_sw_f6', 'Harbor Light Diner',        48.232, -122.369, ['restaurant','food'],       4.2, 180, '8905 271st St NW, Stanwood, WA', 1.1),
];

const STANWOOD_DRINKS = [
  mp('m_sw_d1', 'Stanwood Taphouse',  48.238, -122.374, ['bar','food'],       4.4, 230, '9212 271st St NW, Stanwood, WA', 0.3),
  mp('m_sw_d2', 'Coastal Wine Bar',   48.235, -122.370, ['bar'],              4.3, 178, '8801 270th St NW, Stanwood, WA', 0.6),
  mp('m_sw_d3', 'Twin Oaks Pub',      48.240, -122.377, ['bar','restaurant'], 4.5, 340, '102nd Ave NW, Stanwood, WA',    0.9),
  mp('m_sw_d4', 'The Corner Bar',     48.234, -122.371, ['bar'],              4.1, 125, '9410 271st St NW, Stanwood, WA', 1.2),
  mp('m_sw_d5', 'Salish Brewing Co',  48.242, -122.374, ['bar','restaurant'], 4.6, 480, '12 Maple St, Stanwood, WA',     1.5),
];

const STANWOOD_WATER = [
  mp('m_sw_w1', 'Kayak Puget Sound',            48.227, -122.393, ['tourist_attraction'], 4.7, 390, '27th Beach Rd, Stanwood, WA',   2.1),
  mp('m_sw_w2', 'Port Susan Paddle Co',         48.222, -122.398, ['tourist_attraction'], 4.5, 220, 'Port Susan Rd, Stanwood, WA',   3.0),
  mp('m_sw_w3', 'Camano Island Kayak Tours',    48.187, -122.453, ['tourist_attraction'], 4.6, 310, 'Camano Island, WA',            5.2),
  mp('m_sw_w4', 'Stanwood Boat Launch',         48.225, -122.391, ['tourist_attraction'], 4.2,  98, 'Leque Island Rd, Stanwood, WA', 1.8),
  mp('m_sw_w5', 'Stillaguamish River Paddle',   48.257, -122.403, ['tourist_attraction'], 4.4, 165, 'Old Beach Rd, Stanwood, WA',   3.5),
];

// ── Studio City CA mock data (lat≈34.14, lng≈-118.397) ──────────
const STUDIO_CITY_FOOD = [
  mp('m_sc_f1', 'Aroma Cafe',                 34.143, -118.395, ['restaurant','cafe','food'], 4.5,  820, '4360 Tujunga Ave, Studio City, CA',     0.3, 2),
  mp('m_sc_f2', "Firefly Restaurant",          34.137, -118.400, ['restaurant','food'],        4.5,  940, '11720 Ventura Blvd, Studio City, CA',   0.7, 3),
  mp('m_sc_f3', 'The Great Greek',            34.141, -118.393, ['restaurant','food'],        4.6, 1200, '13362 Ventura Blvd, Studio City, CA',   0.5, 2),
  mp('m_sc_f4', 'Katsuya Studio City',        34.144, -118.399, ['restaurant','food'],        4.4, 1560, '11777 Ventura Blvd, Studio City, CA',   0.8, 3),
  mp('m_sc_f5', 'Casa Vega',                  34.138, -118.394, ['restaurant','food'],        4.5, 2100, '13301 Ventura Blvd, Studio City, CA',   0.9, 2),
  mp('m_sc_f6', 'Pinches Tacos Studio City',  34.142, -118.402, ['restaurant','food'],        4.3,  710, '12025 Ventura Blvd, Studio City, CA',   1.0, 1),
  mp('m_sc_f7', "La Loggia Ristorante",       34.136, -118.396, ['restaurant','food'],        4.4,  580, '11814 Ventura Blvd, Studio City, CA',   0.6, 3),
];

const STUDIO_CITY_DRINKS = [
  mp('m_sc_d1', 'Boneyard Bistro',        34.142, -118.394, ['bar','restaurant'], 4.5,  890, '13539 Ventura Blvd, Studio City, CA', 0.4, 2),
  mp('m_sc_d2', 'Federal Bar Studio City',34.137, -118.399, ['bar','night_club'], 4.4, 1250, '5303 Laurel Canyon Blvd, Studio City, CA', 0.9, 2),
  mp('m_sc_d3', 'Laurel Tavern',          34.141, -118.396, ['bar','restaurant'], 4.6, 1040, '11938 Ventura Blvd, Studio City, CA', 0.6, 2),
  mp('m_sc_d4', 'Idle Hour',              34.136, -118.395, ['bar'],              4.7, 1870, '4824 Vineland Ave, Studio City, CA',  1.1, 2),
  mp('m_sc_d5', 'The Rendez-Vous',        34.143, -118.400, ['bar','restaurant'], 4.3,  560, '12013 Ventura Blvd, Studio City, CA', 0.8, 2),
  mp('m_sc_d6', "Rock & Reilly's",        34.139, -118.393, ['bar'],              4.2,  430, '11887 Ventura Blvd, Studio City, CA', 0.5, 1),
];

const STUDIO_CITY_WATER = [
  mp('m_sc_w1', 'LA River Kayak Safari',  34.190, -118.377, ['tourist_attraction'], 4.6, 520, '3400 Casitas Ave, Los Angeles, CA',  4.2),
  mp('m_sc_w2', 'Balboa Lake Paddle',     34.204, -118.495, ['tourist_attraction'], 4.4, 285, 'Balboa Blvd, Lake Balboa, CA',       6.5),
  mp('m_sc_w3', 'Santa Monica Kayak',     33.995, -118.469, ['tourist_attraction'], 4.7, 910, '2427 Main St, Santa Monica, CA',    14.2),
  mp('m_sc_w4', 'Malibu Kayak Rentals',   34.014, -118.680, ['tourist_attraction'], 4.5, 640, '23000 PCH, Malibu, CA',            15.8),
  mp('m_sc_w5', 'SUP Valley',             34.145, -118.385, ['tourist_attraction'], 4.3, 195, '4525 Laurel Canyon Blvd, Valley Village, CA', 1.0),
];

const STUDIO_CITY_OUTDOOR_GAMES = [
  mp('m_sc_og1', 'K1 Speed Valley Village', 34.160, -118.379, ['amusement_center'],  4.6, 3200, '12490 Riverside Dr, Valley Village, CA',   2.1),
  mp('m_sc_og2', 'Mountasia Northridge',    34.234, -118.542, ['amusement_park'],    4.2, 1850, '9295 Balboa Blvd, Northridge, CA',          7.5),
  mp('m_sc_og3', 'Camelot Golfland',        34.147, -117.832, ['amusement_park'],    4.1, 2300, '3200 E Foothill Blvd, Pasadena, CA',        12.0),
  mp('m_sc_og4', 'Putting Edge Studio City',34.138, -118.396, ['amusement_center'],  4.3,  420, '4730 Lankershim Blvd, Studio City, CA',      0.8),
  mp('m_sc_og5', 'Sherman Oaks Castle Park',34.156, -118.468, ['amusement_center'],  4.0,  890, '4989 Sepulveda Blvd, Sherman Oaks, CA',      5.2),
];

const STUDIO_CITY_INDOOR = [
  mp('m_sc_i1', 'Pinz Bowling Center',       34.158, -118.422, ['bowling_alley'],              4.2, 2100, '12655 Ventura Blvd, Studio City, CA',   4.2),
  mp('m_sc_i2', 'Escape Room LA',            34.139, -118.394, ['tourist_attraction'],         4.6,  890, '4712 Lankershim Blvd, Studio City, CA',  0.9),
  mp('m_sc_i3', "Dave & Buster's Northridge",34.229, -118.544, ['amusement_center','bar'],     4.2, 5600, '9301 Tampa Ave, Northridge, CA',         7.8),
  mp('m_sc_i4', 'Round One Bowling Woodland Hills', 34.184, -118.606, ['bowling_alley','amusement_center'], 4.3, 4200, '6600 Topanga Canyon Blvd, Woodland Hills, CA', 10.5),
  mp('m_sc_i5', 'VR World LA',               34.141, -118.390, ['tourist_attraction'],         4.4,  380, '11150 Magnolia Blvd, Valley Village, CA', 1.5),
  mp('m_sc_i6', 'Junkyard Social Club',      34.142, -118.402, ['amusement_center','bar'],     4.5,  610, '11945 Ventura Blvd, Studio City, CA',    0.7),
];

// ── Mock data lookup ─────────────────────────────────────────────
const MOCK_DATA = {
  stanwood_food:         STANWOOD_FOOD,
  stanwood_drinks:       STANWOOD_DRINKS,
  stanwood_water:        STANWOOD_WATER,
  stanwood_indoor:       [],
  stanwood_outdoor_games:[],
  studio_city_food:      STUDIO_CITY_FOOD,
  studio_city_drinks:    STUDIO_CITY_DRINKS,
  studio_city_water:     STUDIO_CITY_WATER,
  studio_city_outdoor_games: STUDIO_CITY_OUTDOOR_GAMES,
  studio_city_indoor:    STUDIO_CITY_INDOOR,
};

const INDOOR_ACTIVITY_TYPES = new Set(['bowling_pool', 'arcade_gaming', 'escape_vr', 'arts_creative']);

export function getMockPlaces(lat, lng, dateIdea, activityType) {
  const locName = detectLocation(lat, lng);
  if (!locName) return null;

  const di = String(dateIdea || '').toLowerCase();
  const at = String(activityType || '').toLowerCase();

  if (at === 'water_activities') return MOCK_DATA[`${locName}_water`] || null;
  if (at === 'outdoor_games')    return MOCK_DATA[`${locName}_outdoor_games`] || null;
  if (INDOOR_ACTIVITY_TYPES.has(at)) return MOCK_DATA[`${locName}_indoor`] || null;

  if (di === 'drinks')  return MOCK_DATA[`${locName}_drinks`] || null;
  if (di === 'indoor')  return MOCK_DATA[`${locName}_indoor`] || null;
  if (di === 'outdoor') return MOCK_DATA[`${locName}_outdoor_games`] || null;
  if (['brunch_dinner','dinner','brunch','lunch','food','coffee_dessert'].includes(di))
    return MOCK_DATA[`${locName}_food`] || null;

  return null;
}
