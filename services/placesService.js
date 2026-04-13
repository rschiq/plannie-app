// services/placesService.js
import * as Location from 'expo-location';

const GOOGLE_API_KEY = 'AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w';

// Keep categories very strict
const CATEGORY_MAP = {
  restaurant: ['restaurant'],
  cafe: ['cafe'],
  drinks: ['bar', 'night_club'],
  activity: [
    'tourist_attraction',
    'amusement_park',
    'bowling_alley',
    'movie_theater',
    'arcade',
  ],
};

function normalizeCoords(coords) {
  if (!coords) return null;

  // supports either { lat, lng } or { latitude, longitude }
  if (
    typeof coords.lat === 'number' &&
    typeof coords.lng === 'number'
  ) {
    return {
      lat: coords.lat,
      lng: coords.lng,
    };
  }

  if (
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number'
  ) {
    return {
      lat: coords.latitude,
      lng: coords.longitude,
    };
  }

  return null;
}

async function geocodeCity(city) {
  if (!city || typeof city !== 'string') return null;

  const results = await Location.geocodeAsync(city);

  if (!results || !results.length) return null;

  return {
    lat: results[0].latitude,
    lng: results[0].longitude,
  };
}

function dedupePlaces(places) {
  const seen = new Set();
  const output = [];

  for (const place of places) {
    const key = place.place_id || place.name;
    if (!seen.has(key)) {
      seen.add(key);
      output.push(place);
    }
  }

  return output;
}

function scorePlace(place, selectedArea) {
  let score = 0;

  score += (place.rating || 0) * 2;
  score += (place.user_ratings_total || 0) / 1000;

  const vicinity = (place.vicinity || '').toLowerCase();
  const area = (selectedArea || '').toLowerCase();

  if (area && vicinity.includes(area)) {
    score += 5;
  }

  return score;
}

function filterByCategory(results, category) {
  const allowedTypes = CATEGORY_MAP[category] || [];

  if (!allowedTypes.length) return [];

  return results.filter((place) => {
    const types = Array.isArray(place.types) ? place.types : [];
    return types.some((type) => allowedTypes.includes(type));
  });
}

function prioritizeArea(results, city) {
  const selectedArea = (city || '').toLowerCase().trim();

  if (!selectedArea) return results;

  const inArea = results.filter((place) => {
    const vicinity = (place.vicinity || '').toLowerCase();
    const name = (place.name || '').toLowerCase();
    return (
      vicinity.includes(selectedArea) ||
      name.includes(selectedArea)
    );
  });

  const outOfArea = results.filter((place) => {
    const vicinity = (place.vicinity || '').toLowerCase();
    const name = (place.name || '').toLowerCase();
    return !(
      vicinity.includes(selectedArea) ||
      name.includes(selectedArea)
    );
  });

  // Always prefer local matches first, then fallback
  return [...inArea, ...outOfArea];
}

export async function getPlaces(params) {
  try {
    const coords = normalizeCoords(params?.coords);
    const city = params?.city || '';
    const category = params?.category;

    if (!category || !CATEGORY_MAP[category]) {
      console.log('Invalid category:', category);
      return [];
    }

    let finalCoords = coords;

    if (!finalCoords && city) {
      console.log('Missing coords, geocoding city:', city);
      finalCoords = await geocodeCity(city);
    }

    if (!finalCoords) {
      console.log('No valid location available');
      return [];
    }

    console.log('USING COORDS:', finalCoords);

    // Google Nearby Search only supports one type param
    // So we fetch using the first type, then filter again locally
    const primaryType = CATEGORY_MAP[category][0];
    const radius = 5000;

    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${finalCoords.lat},${finalCoords.lng}` +
      `&radius=${radius}` +
      `&type=${encodeURIComponent(primaryType)}` +
      `&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    const rawResults = Array.isArray(data.results) ? data.results : [];
    console.log('RAW COUNT:', rawResults.length);

    const filtered = filterByCategory(rawResults, category);
    console.log('AFTER TYPE FILTER:', filtered.map((p) => p.name));

    const prioritized = prioritizeArea(filtered, city);
    const unique = dedupePlaces(prioritized);

    unique.sort((a, b) => {
      return scorePlace(b, city) - scorePlace(a, city);
    });

    const finalResults = unique.slice(0, 10);
    console.log('FINAL RESULTS:', finalResults.map((p) => p.name));

    return finalResults;
  } catch (error) {
    console.log('ERROR in getPlaces:', error);
    return [];
  }
}