// hooks/useAnimations.js
// ─────────────────────────────────────────────────────────────
// Plannie — Shared Animation Hooks
// All use useNativeDriver: true for 60fps performance
// ─────────────────────────────────────────────────────────────
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

// ─────────────────────────────────────────────────────────────
// 1. PRESS ANIMATION — buttons & tappable cards
//    Scale down slightly + fade on press, spring back on release
// ─────────────────────────────────────────────────────────────
export function usePressAnimation({ scaleDown = 0.96 } = {}) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: scaleDown,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(opacity, {
        toValue: 0.78,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function onPressOut() {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 22,
        bounciness: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }

  return { scale, opacity, onPressIn, onPressOut };
}

// ─────────────────────────────────────────────────────────────
// 2. SELECTION ANIMATION — vibe cards, budget cards, item cards
//    Pulse to 1.05 then settle at 1.02 on select; snap back on deselect
// ─────────────────────────────────────────────────────────────
export function useSelectionAnimation(selected) {
  const scale       = useRef(new Animated.Value(1)).current;
  const wasSelected = useRef(false);

  useEffect(() => {
    if (selected && !wasSelected.current) {
      // Pulse outward then gently settle
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: true,
          speed: 45,
          bounciness: 10,
        }),
        Animated.spring(scale, {
          toValue: 1.02,
          useNativeDriver: true,
          speed: 18,
          bounciness: 4,
        }),
      ]).start();
    } else if (!selected && wasSelected.current) {
      // Snap back cleanly
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 25,
        bounciness: 0,
      }).start();
    }
    wasSelected.current = selected;
  }, [selected]);

  return { scale };
}

// ─────────────────────────────────────────────────────────────
// 3. ENTRANCE ANIMATION — screen content fade + slide up on mount
//    Use on ScrollView content or individual sections
// ─────────────────────────────────────────────────────────────
export function useEntranceAnimation({ delay = 0, slideDistance = 18 } = {}) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideDistance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
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

  return { opacity, translateY };
}

// ─────────────────────────────────────────────────────────────
// 4. STAGGER ANIMATION — for lists of cards loading in sequence
//    Pass index to offset each card's entrance
// ─────────────────────────────────────────────────────────────
export function useStaggerEntrance(index, { baseDelay = 80, slideDistance = 14 } = {}) {
  const delay = index * baseDelay;
  return useEntranceAnimation({ delay, slideDistance });
}

// ─────────────────────────────────────────────────────────────
// 5. PULSE FEEDBACK — momentary highlight after a successful action
//    e.g. location saved, plan saved, item added
// ─────────────────────────────────────────────────────────────
export function usePulseFeedback() {
  const scale = useRef(new Animated.Value(1)).current;

  function pulse() {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.08,
        useNativeDriver: true,
        speed: 60,
        bounciness: 12,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }),
    ]).start();
  }

  return { scale, pulse };
}