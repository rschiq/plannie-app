import { View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VIBES = [
  'Romantic',
  'Chill',
  'Adventure',
  'Fun',
  'Luxury',
  'Spontaneous'
];

export default function VibesScreen() {
  const [selected, setSelected] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadVibes = async () => {
      try {
        const raw = await AsyncStorage.getItem('user:vibes');
        if (!mounted || !raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSelected(parsed);
        }
      } catch {
        // Intentionally silent: keep screen resilient if storage is unavailable.
      }
    };

    loadVibes();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const persistVibes = async () => {
      try {
        await AsyncStorage.setItem('user:vibes', JSON.stringify(selected));
        setSaved(true);
      } catch {
        setSaved(false);
      }
    };

    persistVibes();
  }, [selected]);

  const toggleVibe = (vibe) => {
    setSelected(prev => {
      if (prev.includes(vibe)) {
        return prev.filter(v => v !== vibe);
      } else {
        return [...prev, vibe];
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0B1A', padding: 20 }}>
      
      <Text style={{
        color: '#F2EDE8',
        fontSize: 24,
        marginBottom: 20
      }}>
        Your Vibes
      </Text>
      {saved ? (
        <Text style={{ color: '#AAA', fontSize: 12, marginTop: -10, marginBottom: 14 }}>
          Saved
        </Text>
      ) : null}

      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
      }}>
        {VIBES.map((vibe) => {
          const isSelected = selected.includes(vibe);

          return (
            <TouchableOpacity
              key={vibe}
              onPress={() => toggleVibe(vibe)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isSelected ? '#D6A14D' : '#333',
                backgroundColor: isSelected ? '#2A1F12' : '#151022'
              }}
            >
              <Text style={{
                color: isSelected ? '#D6A14D' : '#AAA',
                fontSize: 14
              }}>
                {vibe}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}
