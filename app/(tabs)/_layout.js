import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { colors, fonts } from '../../constants/theme';

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 8, width: 70 }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10,
        fontFamily: fonts.bodyMedium,
        color: focused ? colors.rose : colors.gray3,
        marginTop: 3,
        textAlign: 'center',
      }}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.cream2,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 14,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
        tabBarItemStyle: { paddingVertical: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="plan"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💫" label="Plan" focused={focused} /> }}
      />
      <Tabs.Screen
        name="saved"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🗂️" label="Saved" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} /> }}
      />
    </Tabs>
  );
}