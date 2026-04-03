import React, { createContext, useContext, useState } from 'react';
import { SAMPLE_SAVED_PLANS, PLAN_DATA } from '../data';

const PlanContext = createContext(null);

// ─── Helper: pick a random item from an array ───────────────
function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Helper: get budget key from plan.budget ────────────────
function getBudgetKey(budget) {
  if (budget === '$') return '$';
  if (budget === '$$$') return '$$$';
  return '$$'; // default
}

// ─── Helper: get addon key from time ────────────────────────
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
  });

  const [savedPlans, setSavedPlans] = useState(SAMPLE_SAVED_PLANS);

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
    });

  // ─── Smart Plan Generation ─────────────────────────────────
  // Uses vibe + budget to pull from the right data bucket
  // Then randomly selects from available options for variety
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

    return {
      activity,
      food,
      addonType: addonItem?.type || addonKey,
      addonItem,
    };
  };

  // ─── Save Plan ─────────────────────────────────────────────
  const savePlan = () => {
    const addonEmoji =
      plan.addonType === 'flowers' ? '💐' :
      plan.addonType === 'dessert' ? '🍰' : '🌅';

    const items = [
      plan.activity ? `🎯 ${plan.activity.name}` : null,
      plan.food ? `🍽️ ${plan.food.name}` : null,
      plan.addonItem ? `${addonEmoji} ${plan.addonItem.name}` : null,
    ].filter(Boolean);

    const newPlan = {
      id: `sp_${Date.now()}`,
      title: (() => {
  const titles = {
    Romantic: 'Romantic Evening Escape 🌙💖',
    Adventure: 'Epic Adventure Date 🏔️⚡',
    Chill: 'Chill & Cozy Date Night 🕯️🍷',
    Fun: 'Playful Night Out 🎳✨',
    Custom: 'A Night to Remember 🌟💕',
  };
  return titles[plan.vibe] || 'A Night to Remember 🌟💕';
})(),
      dateDisplay: plan.dateDisplay || 'Upcoming',
      city: plan.city,
      vibe: plan.vibe || 'Custom',
      budget: plan.budget || '$$',
      items,
      favorite: false,
    };
    setSavedPlans((prev) => [newPlan, ...prev]);
    return newPlan;
  };

  const deletePlan = (id) => {
  console.log('Deleting plan with id:', id);
  setSavedPlans((prev) => {
    const updated = prev.filter((p) => p.id !== id);
    console.log('Updated plans:', updated.length);
    return updated;
  });
};

  const toggleFavorite = (id) =>
    setSavedPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
    );

  // ─── Time of Day Label ─────────────────────────────────────
  const getTimeLabel = () => {
    if (!plan.time) return null;
    const hr = parseInt(plan.time.split(':')[0]);
    if (hr < 11) return { icon: '☀️', msg: "Morning date — we've highlighted the best daytime options." };
    if (hr < 15) return { icon: '🌤️', msg: 'Afternoon plan — perfect for an active, laid-back date.' };
    if (hr < 19) return { icon: '🌅', msg: "Evening date — we've curated our top romantic picks." };
    return { icon: '🌙', msg: 'Night out — expect great vibes and unforgettable moments.' };
  };

  // ─── Time Formatters ───────────────────────────────────────
  const fmtHM = (h, m = 0) => {
    h = h % 24;
    const isPM = h >= 12;
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display}:${String(m).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
  };

  const getBaseHour = () =>
    plan.time ? parseInt(plan.time.split(':')[0]) : 17;

  const getBaseMin = () =>
    plan.time ? parseInt(plan.time.split(':')[1]) : 0;

  return (
    <PlanContext.Provider
      value={{
        plan,
        updatePlan,
        resetPlan,
        savedPlans,
        savePlan,
        deletePlan,
        toggleFavorite,
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