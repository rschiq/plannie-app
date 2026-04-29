import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../constants/theme';

export default function PaywallModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.emoji}>✨</Text>
          <Text style={s.title}>You've used your 3 free plans this month</Text>
          <Text style={s.message}>
            Your free plans reset in 30 days. Unlimited access is coming soon.
          </Text>

          <View style={s.valueList}>
            <Text style={s.valueItem}>✔  See more places nearby</Text>
            <Text style={s.valueItem}>✔  Try different ideas instantly</Text>
            <Text style={s.valueItem}>✔  Get better matches</Text>
          </View>

          <TouchableOpacity style={s.comingSoonBtn} activeOpacity={0.75}>
            <Text style={s.comingSoonText}>Unlock unlimited — coming soon</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.closeBtnText}>Come back next month</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.cream2,
    borderRadius: radius.lg,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.gray4,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 36,
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  valueList: {
    alignSelf: 'stretch',
    backgroundColor: colors.cream3,
    borderRadius: radius.sm,
    padding: 16,
    gap: 10,
    marginBottom: 24,
  },
  valueItem: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoal2,
    lineHeight: 20,
  },
  comingSoonBtn: {
    alignSelf: 'stretch',
    borderRadius: radius.full,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.rose,
    marginBottom: 12,
    opacity: 0.5,
  },
  comingSoonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.rose,
  },
  closeBtn: {
    alignSelf: 'stretch',
    borderRadius: radius.full,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: colors.rose,
  },
  closeBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: '#F2EDE8',
  },
});
