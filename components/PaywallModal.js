import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function PaywallModal({
  visible,
  onClose,
  onUpgrade,
  onGet20MorePlans,
  onGet50MorePlans,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>You&apos;ve used your free plans 🎯</Text>
          <Text style={s.message}>Want more ideas for your next date?</Text>

          <TouchableOpacity style={s.primaryBtn} onPress={onUpgrade} activeOpacity={0.85}>
            <Text style={s.primaryText}>Upgrade to Premium</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.addOnBtn} onPress={onGet20MorePlans} activeOpacity={0.85}>
            <Text style={s.addOnText}>Get 20 more plans</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.addOnBtn} onPress={onGet50MorePlans} activeOpacity={0.85}>
            <Text style={s.addOnText}>Get 50 more plans</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.secondaryText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#F2EDE8',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#1C1628',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5B5565',
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#D4956F',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryText: {
    color: '#F2EDE8',
    fontSize: 15,
    fontWeight: '600',
  },
  addOnBtn: {
    borderWidth: 1,
    borderColor: '#D4956F',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#FFF8F3',
  },
  addOnText: {
    color: '#8B5A3E',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#D8D2CD',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#1C1628',
    fontSize: 14,
    fontWeight: '500',
  },
});
