// components/ScreenTransition.js
// ─────────────────────────────────────────────────────────────
// Plannie — Screen Transition Wrapper + Animated Button
// ─────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { colors, fonts, radius } from '../constants/theme';
import { usePressAnimation, usePulseFeedback } from '../hooks/useAnimations';

// ─────────────────────────────────────────────────────────────
// SCREEN TRANSITION WRAPPER
// Wrap your screen's main content (below header/progress bar)
// for a smooth fade + slide-up entrance on every screen mount.
//
// Usage:
//   <ScreenTransition>
//     <ScrollView>...</ScrollView>
//   </ScreenTransition>
//
// Use `delay` to stagger after a header animation:
//   <ScreenTransition delay={100}>...</ScreenTransition>
// ─────────────────────────────────────────────────────────────
export function ScreenTransition({ children, style, delay = 0 }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 14,
        bounciness: 3,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        { flex: 1 },
        style,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// ANIMATED PRIMARY BUTTON
// Drop-in replacement for your existing PrimaryButton.
// Adds scale + opacity press feedback + optional pulse on mount.
//
// Usage:
//   <AnimatedPrimaryButton
//     label="Next →"
//     onPress={handleNext}
//     variant="rose"        // 'rose' | 'gold' | 'dark'
//     disabled={!selected}
//     pulseOnMount={true}   // subtle attention pulse when button appears
//   />
// ─────────────────────────────────────────────────────────────
export function AnimatedPrimaryButton({
  label,
  onPress,
  variant = 'rose',
  disabled = false,
  pulseOnMount = false,
  style,
}) {
  const { scale, opacity, onPressIn, onPressOut } = usePressAnimation({ scaleDown: 0.97 });
  const { scale: pulseScale, pulse } = usePulseFeedback();

  useEffect(() => {
    if (pulseOnMount && !disabled) {
      // Small attention pulse 600ms after mount
      const t = setTimeout(pulse, 600);
      return () => clearTimeout(t);
    }
  }, [disabled]);

  const bgColor = disabled
    ? colors.gray4
    : variant === 'gold' ? colors.gold
    : variant === 'dark' ? '#1C1628'
    : colors.rose;  // default rose gold

  const textColor = disabled
    ? colors.gray2
    : variant === 'dark' ? '#F2EDE8'
    : '#F2EDE8';

  const combinedScale = Animated.multiply(scale, pulseScale);

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      activeOpacity={1}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.btn,
          { backgroundColor: bgColor },
          disabled && styles.btnDisabled,
          !disabled && Platform.select({
            ios: {
              shadowColor: bgColor,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
            },
            android: { elevation: 8 },
          }),
          style,
          { transform: [{ scale: combinedScale }], opacity },
        ]}
      >
        <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// ANIMATED OUTLINE BUTTON
// ─────────────────────────────────────────────────────────────
export function AnimatedOutlineButton({ label, onPress, style }) {
  const { scale, opacity, onPressIn, onPressOut } = usePressAnimation({ scaleDown: 0.97 });

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.outlineBtn,
          style,
          { transform: [{ scale }], opacity },
        ]}
      >
        <Text style={styles.outlineBtnText}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  outlineBtn: {
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray4,
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.gray2,
  },
});