import React, { createContext, useContext, useState, useEffect } from 'react';
import { SAMPLE_SAVED_PLANS, PLAN_DATA } from '../data';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PlanContext = createContext(null);
const PLAN_FLOW_KEYS = ['location', 'coords', 'budget', 'group', 'moment', 'category', 'dateIdea'];
const ALLOWED_CATEGORIES = new Set(['food', 'activity']);

const EMPTY_PLAN = {
  location: '',
  coords: null,
  budget: '$$',
  group: null,
  moment: null,
  category: null,
  dateIdea: null,
};

function normalizeCategory(category) {
  if (typeof category !== 'string') return null;
  return ALLOWED_CATEGORIES.has(category) ? category : null;
}

function toPlanFlowState(input) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    location: source.location ?? source.city ?? '',
    coords: source.coords ?? null,
    budget: source.budget ?? '$$',
    group: source.group ?? null,
    moment: source.moment ?? null,
    category: normalizeCategory(source.category),
    dateIdea: typeof source.dateIdea === 'string' ? source.dateIdea : null,
  };
}

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
  const [plan, setPlan] = useState(EMPTY_PLAN);

  const [savedPlans, setSavedPlans] = useState([]);

  // ── Load current in-progress plan from AsyncStorage ───────────
  useEffect(() => {
    AsyncStorage.getItem('@plannie_current_plan')
      .then(data => {
        if (!data) return;
        try {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === 'object') {
            setPlan(toPlanFlowState(parsed));
          }
        } catch {}
      })
      .catch(() => {});
  }, []);

  // ── Load saved plans from AsyncStorage on mount ───────────────
  useEffect(() => {
    AsyncStorage.getItem('@plannie_saved_plans')
      .then(data => {
        if (!data) return;
        const parsed = JSON.parse(data);
        // Deduplicate by id — existing data may have colliding ids from a
        // prior bug where Date.now() was used without a random suffix
        const seen = new Set();
        const deduped = parsed.filter(p => {
          if (!p.id || seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        setSavedPlans(deduped);
      })
      .catch(() => {});
  }, []);

  // ── Persist saved plans to AsyncStorage on every change ───────
  useEffect(() => {
    AsyncStorage.setItem('@plannie_saved_plans', JSON.stringify(savedPlans))
      .catch(() => {});
  }, [savedPlans]);

  // ── Persist current in-progress plan across app sessions ──────
  useEffect(() => {
    AsyncStorage.setItem('@plannie_current_plan', JSON.stringify(plan))
      .catch(() => {});
  }, [plan]);

  const updatePlan = (updates) =>
    setPlan((prev) => {
      const allowedUpdates = {};
      PLAN_FLOW_KEYS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(updates || {}, key)) {
          allowedUpdates[key] = key === 'category' ? normalizeCategory(updates[key]) : updates[key];
        }
      });
      if (Object.prototype.hasOwnProperty.call(allowedUpdates, 'category')) {
        console.log('[PlanState] category set:', allowedUpdates.category);
      }
      if (Object.prototype.hasOwnProperty.call(allowedUpdates, 'dateIdea')) {
        console.log('[PlanState] dateIdea set:', allowedUpdates.dateIdea);
      }
      const next = { ...prev, ...allowedUpdates };
      console.log('[PlanState] updatePlan', { updates: allowedUpdates, nextPlan: next });
      return next;
    });

  const resetPlan = () => {
    console.log('[PlanState] resetPlan', EMPTY_PLAN);
    setPlan(EMPTY_PLAN);
  };

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
      id:          `sp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title:       titles[plan.vibe] || 'A Night to Remember 🌟💕',
      date:        plan.date        || '',
      dateDisplay: plan.dateDisplay || 'Upcoming',
      city:        plan.location || '',
      vibe:        plan.moment   || 'Custom',
      budget:      plan.budget || '$$',
      items,
      favorite:    false,
      isSpecialDate: false,
      specialDateConfigured: false,
      specialDateNote: '',
      specialDateDate: '',
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
      id:          `sp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title:       place.name,
      date:        '',
      dateDisplay: 'Saved Place',
      city:        context.city || '',
      vibe:        context.moment || 'Custom',
      budget:      '$$',
      items:       [`${emoji} ${place.name}`, place.address].filter(Boolean),
      favorite:    false,
      isSpecialDate: false,
      specialDateConfigured: false,
      specialDateNote: '',
      specialDateDate: '',
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

  const toggleSpecialDate = (id) =>
    setSavedPlans((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextIsSpecial = !p.isSpecialDate;
        if (!nextIsSpecial) {
          return {
            ...p,
            isSpecialDate: false,
            specialDateConfigured: false,
            specialDateNote: '',
            specialDateDate: '',
          };
        }
        return {
          ...p,
          isSpecialDate: true,
          specialDateConfigured: false,
        };
      })
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
  const specialDates = savedPlans.filter((p) => p.isSpecialDate);

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
        toggleSpecialDate,
        specialDates,
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