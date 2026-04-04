// components/SelectableCard.js
// ─────────────────────────────────────────────────────────────
// Two-prop design:
//   style      → TouchableOpacity  (layout: width, flex, margin, marginBottom)
//   innerStyle → Animated.View     (visual: padding, alignItems, flexDirection)
// This cleanly separates sizing from visual styling.
// ─────────────────────────────────────────────────────────────
import { Animated, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';
import { useSelectionAnimation, usePressAnimation } from '../hooks/useAnimations';

export function SelectableCard({
  selected,
  onPress,
  children,
  style,        // outer layout (width, flex, margin)
  innerStyle,   // inner visual (padding, alignItems, flexDirection)
  selectedBg,
  selectedBorder,
  pressScale = 0.97,
}) {
  const { scale: selScale }       = useSelectionAnimation(selected);
  const { scale: pressAnim,
          opacity, onPressIn,
          onPressOut }            = usePressAnimation({ scaleDown: pressScale });

  const combinedScale = Animated.multiply(selScale, pressAnim);

  return (
    // ✅ Outer TouchableOpacity controls layout (width, flex, margin)
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      style={style}
    >
      {/* ✅ Inner Animated.View controls visuals (bg, border, shadow, padding) */}
      {/* No flex:1 — sizes naturally based on content */}
      <Animated.View
        style={[
          styles.card,
          innerStyle,
          selected && {
            borderColor: selectedBorder || colors.rose,
            backgroundColor: selectedBg || colors.cream3,
            ...Platform.select({
              ios: {
                shadowColor: selectedBorder || colors.rose,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.28,
                shadowRadius: 14,
              },
              android: { elevation: 8 },
            }),
          },
          { transform: [{ scale: combinedScale }], opacity },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream2,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow.sm,
  },
});