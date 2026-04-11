import React, { createContext, useContext, useState } from 'react';
import { SAMPLE_SAVED_PLANS, PLAN_DATA } from '../data';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PlanContext = createContext(null);

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function getBudgetKey(budget) {
  if (budget === '$') return '$';
  if (budget === '$$$') return '$$$';
  return '$$';
}

function getAddonKey(hr) {
  if (hr < 12) return 'scenic';
  if (hr < 15) return 'dessert';
  if (hr < 19) return 'flowers';
  return 'scenic';
}

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState({
    date: '',
    dateDisplay: '',
    city: 'Los Angeles, CA',
    time: '',
    timeDisplay: '',
    vibe: '',
    mode: 'manual',
    budget: '$$',
    activity: null,
    food: null,
    addonType: null,
    addonItem: null,
    // ── New structured flow fields ──
    group: null,       // 'couples' | 'friends'
    moment: null,      // e.g. 'First Date' | 'Going Out'
    category: null,    // 'food' | 'drinks' | 'coffee' | 'activity'
  });

  const [savedPlans, setSavedPlans] = useState([]);

  // ── Load saved plans from AsyncStorage on mount ───────────────
  useEffect(() => {
    AsyncStorage.getItem('@plannie_saved_plans')
      .then(data => { if (data) setSavedPlans(JSON.parse(data)); })
      .catch(() => {});
  }, []);

  // ── Persist saved plans to AsyncStorage on every change ───────
  useEffect(() => {
    AsyncStorage.setItem('@plannie_saved_plans', JSON.stringify(savedPlans))
      .catch(() => {});
  }, [savedPlans]);

  const updatePlan = (updates) => setPlan((prev) => ({ ...prev, ...updates }));

  const resetPlan = () =>
    setPlan({
      date: '',
      dateDisplay: '',
      city: 'Los Angeles, CA',
      time: '',
      timeDisplay: '',
      vibe: '',
      mode: 'manual',
      budget: '$$',
      activity: null,
      food: null,
      addonType: null,
      addonItem: null,
      group: null,
      moment: null,
      category: null,
    });

  const generatePlan = (vibe, budget, time) => {
    const budgetKey = getBudgetKey(budget);
    const hr = time ? parseInt(time.split(':')[0]) : 17;
    const addonKey = getAddonKey(hr);
    const vibeData = PLAN_DATA[vibe]?.[budgetKey];
    if (!vibeData) return null;
    const activity = pickRandom(vibeData.activities);
    const food = pickRandom(vibeData.restaurants);
    const addonItems = vibeData.addons.filter(a => a.type === addonKey);
    const addonItem = pickRandom(addonItems) || pickRandom(vibeData.addons);
    return { activity, food, addonType: addonItem?.type || addonKey, addonItem };
  };

  // ─── Save Plan ─────────────────────────────────────────────
  const savePlan = () => {
    const addonEmoji =
      plan.addonType === 'flowers' ? '💐' :
      plan.addonType === 'dessert' ? '🍰' : '🌅';

    const items = [
      plan.activity  ? `🎯 ${plan.activity.name}`  : null,
      plan.food      ? `🍽️ ${plan.food.name}`      : null,
      plan.addonItem ? `${addonEmoji} ${plan.addonItem.name}` : null,
    ].filter(Boolean);

    const titles = {
      Romantic:  'Romantic Evening Escape 🌙💖',
      Adventure: 'Epic Adventure Date 🏔️⚡',
      Chill:     'Chill & Cozy Date Night 🕯️🍷',
      Fun:       'Playful Night Out 🎳✨',
      Custom:    'A Night to Remember 🌟💕',
    };

    const newPlan = {
      id:          `sp_${Date.now()}`,
      title:       titles[plan.vibe] || 'A Night to Remember 🌟💕',
      date:        plan.date        || '',
      dateDisplay: plan.dateDisplay || 'Upcoming',
      city:        plan.city,
      vibe:        plan.vibe   || 'Custom',
      budget:      plan.budget || '$$',
      items,
      favorite:    false,
      note:        '',
      rating:      0,
      favoriteMoment: '',
      // ── Full place objects so Open restores correctly ──────
      activity:  plan.activity  || null,
      food:      plan.food      || null,
      addonItem: plan.addonItem || null,
      addonType: plan.addonType || null,
      group:     plan.group     || null,
      moment:    plan.moment    || null,
      category:  plan.category  || null,
      coords:    plan.coords    || null,
    };

    setSavedPlans((prev) => [newPlan, ...prev]);
    return newPlan;
  };

  const deletePlan = (id) => {
    setSavedPlans((prev) => prev.filter((p) => p.id !== id));
  };

  // ── Save a single place (from new results flow) ───────────────
  const saveSinglePlace = (place, context = {}) => {
    const CATEGORY_EMOJIS = { food: '🍽️', drinks: '🍸', coffee: '☕', activity: '🎯' };
    const emoji = CATEGORY_EMOJIS[context.category] || '📍';
    const newPlan = {
      id:          `sp_${Date.now()}`,
      title:       place.name,
      date:        '',
      dateDisplay: 'Saved Place',
      city:        context.city || '',
      vibe:        context.moment || 'Custom',
      budget:      '$$',
      items:       [`${emoji} ${place.name}`, place.address].filter(Boolean),
      favorite:    false,
      note:        '',
      rating:      0,
      favoriteMoment: '',
      // ── Extra data for single-place saves ──
      placeData: {
        id:           place.id,
        name:         place.name,
        category:     place.category || context.category || '',
        address:      place.address  || '',
        distance:     place.distance || null,
        rating:       place.rating   || null,
        totalRatings: place.totalRatings || 0,
        photoUrl:     place.photoUrl || null,
        location:     place.location || null,
      },
      plannerContext: {
        group:    context.group    || null,
        moment:   context.moment   || null,
        category: context.category || null,
        city:     context.city     || null,
      },
    };
    setSavedPlans((prev) => [newPlan, ...prev]);
    return newPlan;
  };

  const toggleFavorite = (id) =>
    setSavedPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
    );

  // ─── Update memory fields (note / rating / favoriteMoment) ─
  const updatePlanMeta = (id, updates) =>
    setSavedPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

  const getTimeLabel = () => {
    if (!plan.time) return null;
    const hr = parseInt(plan.time.split(':')[0]);
    if (hr < 11) return { icon: '☀️', msg: "Morning date — we've highlighted the best daytime options." };
    if (hr < 15) return { icon: '🌤️', msg: 'Afternoon plan — perfect for an active, laid-back date.' };
    if (hr < 19) return { icon: '🌅', msg: "Evening date — we've curated our top romantic picks." };
    return { icon: '🌙', msg: 'Night out — expect great vibes and unforgettable moments.' };
  };

  const fmtHM = (h, m = 0) => {
    h = h % 24;
    const isPM = h >= 12;
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display}:${String(m).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
  };

  const getBaseHour = () => plan.time ? parseInt(plan.time.split(':')[0]) : 17;
  const getBaseMin  = () => plan.time ? parseInt(plan.time.split(':')[1]) : 0;

  return (
    <PlanContext.Provider
      value={{
        plan,
        updatePlan,
        resetPlan,
        savedPlans,
        savePlan,
        deletePlan,
        saveSinglePlace,
        toggleFavorite,
        updatePlanMeta,   // ✅ new
        generatePlan,
        getTimeLabel,
        fmtHM,
        getBaseHour,
        getBaseMin,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be inside PlanProvider');
  return ctx;
};