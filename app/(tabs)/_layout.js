import { Tabs } from 'expo-router';
import { Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../constants/theme';

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 64 }}>
      <Text style={{ fontSize: 20, lineHeight: 24, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
      <Text
        numberOfLines={1}
        style={{
          fontSize: 10,
          lineHeight: 13,
          marginTop: 1,
          fontFamily: focused ? fonts.bodyMedium : fonts.body,
          color: focused ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom + (Platform.OS === 'android' ? 10 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 0,
          paddingBottom: 0,
          marginBottom: 0,
        },
        tabBarStyle: {
          backgroundColor: '#1A1612',
          borderTopWidth: 0,
          height: 64 + safeBottom,
          paddingTop: 18,
          paddingBottom: safeBottom || 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💫" label="Plan" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🗂️" label="Saved" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
