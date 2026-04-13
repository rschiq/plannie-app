import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { colors } from '../../constants/theme';

const ACTIVITY_KEYWORDS = [
  "axe throwing",
  "escape room",
  "go kart",
  "bowling",
  "karaoke",
  "paint and sip",
  "shooting range",
  "topgolf",
  "ice skating",
  "roller skating",
  "comedy club",
  "live music",
  "cooking class",
  "wine tasting",
  "rage room",
  "dance class",
];

const BLOCKED_WORDS = [
  "smoke",
  "vape",
  "pawn",
  "liquor",
  "store",
  "mart",
  "shop",
  "arcade"
];

export default function SurpriseActivity() {
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    generateActivity();
  }, []);

  const generateActivity = async () => {
    setLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const keyword =
        ACTIVITY_KEYWORDS[Math.floor(Math.random() * ACTIVITY_KEYWORDS.length)];

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.coords.latitude},${location.coords.longitude}&radius=8000&keyword=${keyword}&key=AIzaSyBuaZy0PskAbddfeyxarwdMRsUa6WiRP9w`;

      const res = await fetch(url);
      const data = await res.json();

      const valid = data.results.filter(place => {
        const name = place.name.toLowerCase();

        if (BLOCKED_WORDS.some(word => name.includes(word))) return false;
        if (place.rating < 4.2) return false;
        if (place.user_ratings_total < 50) return false;

        return true;
      });

      if (valid.length > 0) {
        const pick = valid[Math.floor(Math.random() * valid.length)];
        setActivity(pick);
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0E0B16' }}>
        <ActivityIndicator size="large" color="#C9A96E" />
        <Text style={{ marginTop: 12, color: 'white' }}>Finding something fun...</Text>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0E0B16' }}>
        <Text style={{ color: 'white' }}>No activity found. Try again.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#0E0B16' }}>
      <Text style={{ fontSize: 28, color: 'white', marginBottom: 20 }}>
        🎯 Surprise Activity
      </Text>

      <View style={{ backgroundColor: '#1C1A2E', padding: 16, borderRadius: 16 }}>
        <Text style={{ fontSize: 20, color: 'white' }}>{activity.name}</Text>
        <Text style={{ color: '#C9A96E', marginTop: 6 }}>
          ⭐ {activity.rating} ({activity.user_ratings_total})
        </Text>
        <Text style={{ color: '#aaa', marginTop: 6 }}>
          {activity.vicinity}
        </Text>
      </View>

      <TouchableOpacity
        onPress={generateActivity}
        style={{
          marginTop: 30,
          backgroundColor: '#C9A96E',
          padding: 14,
          borderRadius: 12,
        }}
      >
        <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
          Try Another
        </Text>
      </TouchableOpacity>
    </View>
  );
}