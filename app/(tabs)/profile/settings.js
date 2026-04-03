import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, radius, shadow } from '../../../constants/theme';

const SETTINGS_KEY = '@plannie_settings';

const DEFAULT_SETTINGS = {
  pushNotifications: true,
  anniversaryReminders: false,
  weeklyDateIdeas: true,
  useLocation: true,
};

const GROUPS = [
  {
    label: 'Notifications',
    items: [
      { key: 'pushNotifications',    icon: '🔔', title: 'Push Notifications',    sub: 'Date reminders and plan updates' },
      { key: 'anniversaryReminders', icon: '💍', title: 'Anniversary Reminders', sub: 'Never miss a special date' },
      { key: 'weeklyDateIdeas',      icon: '💡', title: 'Weekly Date Ideas',      sub: 'Get inspired every week' },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { key: 'useLocation', icon: '📍', title: 'Use My Location', sub: 'For nearby date suggestions' },
    ],
  },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then(raw => { if (raw) setSettings(JSON.parse(raw)); })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Saved Data',
      'This will clear all your saved partner details, favorites, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                SETTINGS_KEY,
                '@plannie_partner_details',
                '@plannie_couple_favorites',
              ]);
              setSettings(DEFAULT_SETTINGS);
              Alert.alert('Done', 'All saved data has been reset.');
            } catch {
              Alert.alert('Error', 'Could not reset data. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}><ActivityIndicator color={colors.gold2} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
      >

        {GROUPS.map(group => (
          <View key={group.label}>
            <Text style={styles.sectionLabel}>{group.label}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, idx) => (
                <View
                  key={item.key}
                  style={[
                    styles.settingRow,
                    idx < group.items.length - 1 && styles.settingBorder,
                  ]}
                >
                  <Text style={styles.settingIcon}>{item.icon}</Text>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    <Text style={styles.settingSub}>{item.sub}</Text>
                  </View>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={() => handleToggle(item.key)}
                    trackColor={{ false: colors.gray4, true: colors.gold2 }}
                    thumbColor={colors.white}
                    ios_backgroundColor={colors.gray4}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Data / Reset */}
        <Text style={styles.sectionLabel}>Data</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.85}>
          <Text style={styles.resetBtnText}>Reset Saved Data</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Plannie · v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },

  header: {
    backgroundColor: colors.charcoal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  backArrow: {
    fontSize: 26, color: colors.cream,
    lineHeight: 30, marginLeft: 2,
  },
  headerTitle: {
    fontFamily: fonts.display, fontSize: 22,
    color: colors.cream, flex: 1, textAlign: 'center',
  },

  sectionLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 10,
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.gray2, marginBottom: 10, marginTop: 24,
  },

  groupCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  settingBorder: {
    borderBottomWidth: 1, borderBottomColor: colors.cream2,
  },
  settingIcon: { fontSize: 20, width: 28 },
  settingContent: { flex: 1 },
  settingTitle: {
    fontFamily: fonts.bodyMedium, fontSize: 14,
    color: colors.charcoal,
  },
  settingSub: {
    fontFamily: fonts.body, fontSize: 11,
    color: colors.gray2, marginTop: 2,
  },

  resetBtn: {
    backgroundColor: '#FDF0F0',
    borderRadius: radius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F7C1C1',
  },
  resetBtnText: {
    fontFamily: fonts.bodyMedium, fontSize: 15,
    color: colors.rose,
  },

  version: {
    fontFamily: fonts.body, fontSize: 12,
    color: colors.gray3, textAlign: 'center',
    marginTop: 32,
  },
});