import React, { createContext, useContext, useState } from 'react';
import { SAMPLE_SAVED_PLANS } from '../data';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState({
    date: '', dateDisplay: '', city: 'Los Angeles, CA',
    time: '', timeDisplay: '', vibe: '', mode: 'manual',
    activity: null, food: null, addonType: null, addonItem: null,
  });

  const [savedPlans, setSavedPlans] = useState(SAMPLE_SAVED_PLANS);

  const updatePlan = (updates) => setPlan((prev) => ({ ...prev, ...updates }));

  const resetPlan = () => setPlan({
    date: '', dateDisplay: '', city: 'Los Angeles, CA',
    time: '', timeDisplay: '', vibe: '', mode: 'manual',
    activity: null, food: null, addonType: null, addonItem: null,
  });

  const savePlan = () => {
    const addonEmoji = plan.addonType === 'flowers' ? '💐' : plan.addonType === 'dessert' ? '🍰' : '🌅';
    const items = [
      plan.activity ? `🎯 ${plan.activity.name}` : null,
      plan.food ? `🍽️ ${plan.food.name}` : null,
      plan.addonItem ? `${addonEmoji} ${plan.addonItem.name}` : null,
    ].filter(Boolean);

    const newPlan = {
      id: `sp_${Date.now()}`,
      title: plan.vibe ? `${plan.vibe} Date Night` : 'My Date Plan',
      dateDisplay: plan.dateDisplay || 'Upcoming',
      city: plan.city,
      vibe: plan.vibe || 'Custom',
      items,
      favorite: false,
    };
    setSavedPlans((prev) => [newPlan, ...prev]);
    return newPlan;
  };

  const deletePlan = (id) => setSavedPlans((prev) => prev.filter((p) => p.id !== id));

  const toggleFavorite = (id) =>
    setSavedPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
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
  const getBaseMin = () => plan.time ? parseInt(plan.time.split(':')[1]) : 0;

  return (
    <PlanContext.Provider value={{
      plan, updatePlan, resetPlan, savedPlans,
      savePlan, deletePlan, toggleFavorite,
      getTimeLabel, fmtHM, getBaseHour, getBaseMin,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be inside PlanProvider');
  return ctx;
};