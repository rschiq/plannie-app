// constants/theme.js
// ─────────────────────────────────────────────────────────────
// ✦ MIDNIGHT VELVET — Plannie Premium Theme
//
// Inspired by: luxury jewelry boxes, Raya, high-end perfume
// Base:   Deep purple-black  (#0E0C15) — like velvet in low light
// Accent: Rose gold           (#D4956F) — warm, romantic, premium
// The purple-black makes rose gold GLOW. Navy/charcoal don't.
//
// All existing token names kept → entire app updates automatically
// ─────────────────────────────────────────────────────────────

export const colors = {

  // ── App backgrounds ───────────────────────────────────────
  cream:       '#0E0C15',   // main screen bg   — deep purple-black
  cream2:      '#181626',   // card surfaces     — slightly lifted
  cream3:      '#221F32',   // elevated cards    — another step up
  background:  '#07060E',   // deepest layer     — pure near-black

  // ── Warm rose gold scale ──────────────────────────────────
  blush:       '#E8B090',   // soft rose gold highlight
  blush2:      '#D4956F',   // mid rose gold

  // ── PRIMARY ACCENT — rose gold (replaces terracotta rose) ─
  // Every button, border, highlight → rose gold warmth
  rose:        '#D4956F',   // rose gold        — replaces #C4726A
  rose2:       '#C4855F',   // deeper rose gold  — replaces #B5625A

  // ── Secondary gold scale (kept, used for stars/labels) ────
  gold:        '#C9A96E',   // warm gold
  gold2:       '#A8843E',   // deep gold
  gold3:       '#1C1610',   // near-black gold tint — banner backgrounds

  // ── Text hierarchy — warm whites, never harsh ─────────────
  charcoal:    '#F2EDE8',   // primary text     — warm off-white
  charcoal2:   '#D4CECC',   // secondary text
  gray:        '#A09AB0',   // body text        — purple-tinted grey
  gray2:       '#7A7688',   // label text
  gray3:       '#4A4758',   // placeholder text
  gray4:       '#2A2838',   // subtle dividers

  // ── Utility ───────────────────────────────────────────────
  white:       '#1E1C2C',   // "white" cards = elevated dark surface
  green:       '#5BBF85',   // success / open now — stays legible
};

export const fonts = {
  display:            'CormorantGaramond_400Regular',
  displayItalic:      'CormorantGaramond_400Regular_Italic',
  displayMedium:      'CormorantGaramond_500Medium',
  displayLight:       'CormorantGaramond_300Light',
  displayLightItalic: 'CormorantGaramond_300Light_Italic',
  body:               'DMSans_400Regular',
  bodyMedium:         'DMSans_500Medium',
  bodySemiBold:       'DMSans_600SemiBold',
  bodyLight:          'DMSans_300Light',
};

export const radius = { sm: 12, md: 20, lg: 28, xl: 40, full: 999 };

export const shadow = {
  // Deep blacks — cards feel like they float above the dark bg
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 9,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 30,
    elevation: 15,
  },

  // ✦ Rose gold glow — selected cards, active states, buttons
  // This is the "it" effect: cards appear to radiate warmth
  rose: {
    shadowColor: '#D4956F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 18,
    elevation: 10,
  },

  // Subtle gold glow for secondary elements
  gold: {
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 8,
  },
};

// ── Gradient definitions ───────────────────────────────────────
// Use these with expo-linear-gradient for hero areas, buttons, cards
// import { LinearGradient } from 'expo-linear-gradient';
// <LinearGradient colors={gradients.roseGold} ... />
export const gradients = {
  // Primary button gradient — rose gold shimmer
  roseGold:    ['#E8B090', '#D4956F', '#C4855F'],

  // Screen background — subtle depth, not flat
  background:  ['#0E0C15', '#13101E', '#0E0C15'],

  // Hero/header gradient — used in cart, home
  hero:        ['#1C1628', '#0E0C15'],

  // Card gradient — subtle lift
  card:        ['#201E2F', '#181626'],

  // Overlay for bottom sheets
  overlay:     ['rgba(14,12,21,0)', 'rgba(14,12,21,0.98)'],

  // Gold shimmer — for special badges
  goldShimmer: ['#F0D5A0', '#C9A96E', '#A8843E'],
};

// ── Vibe color chips — updated for dark theme ──────────────────
export const VIBE_COLORS = {
  Adventure: { bg: '#0D1E2A', text: '#6BC5D8' },   // deep teal
  Chill:     { bg: '#0D1E14', text: '#6BCF92' },   // deep emerald
  Romantic:  { bg: '#1E0D18', text: '#E8B090' },   // deep rose → rose gold text
  Fun:       { bg: '#1E1A0A', text: '#D4B85A' },   // deep amber
  Custom:    { bg: '#14102A', text: '#A08ED4' },   // deep violet
};