import AsyncStorage from '@react-native-async-storage/async-storage';

const RUNS_USED_KEY  = '@plannie_runs_used';
const EXTRA_RUNS_KEY = '@plannie_extra_runs';
const LAST_RESET_KEY = '@plannie_last_reset';
const FREE_RUN_LIMIT    = 3;
const RESET_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Automatically true in Expo dev builds, false in production.
const DEV_MODE = __DEV__;

async function checkMonthlyReset() {
  try {
    const raw = await AsyncStorage.getItem(LAST_RESET_KEY);
    const lastReset = raw ? parseInt(raw, 10) : null;
    const now = Date.now();
    if (!lastReset || now - lastReset >= RESET_INTERVAL_MS) {
      await AsyncStorage.setItem(RUNS_USED_KEY, '0');
      await AsyncStorage.setItem(LAST_RESET_KEY, String(now));
      console.log('[RunLimit] monthly reset applied');
    }
  } catch {}
}

export async function getRunsUsed() {
  try {
    const raw = await AsyncStorage.getItem(RUNS_USED_KEY);
    const parsed = Number.parseInt(raw ?? '0', 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function getExtraRuns() {
  try {
    const raw = await AsyncStorage.getItem(EXTRA_RUNS_KEY);
    const parsed = Number.parseInt(raw ?? '0', 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function addExtraRuns(amount) {
  const current = await getExtraRuns();
  const next = current + amount;
  try {
    await AsyncStorage.setItem(EXTRA_RUNS_KEY, String(next));
  } catch {}
  console.log('[AddOn] extraRuns:', next);
  return next;
}

export async function consumeRunIfAvailable() {
  if (DEV_MODE) {
    console.log('[RunLimit] DEV MODE - bypassing limit');
    return { allowed: true, runsUsed: null, extraRuns: null };
  }

  await checkMonthlyReset();

  const runsUsed  = await getRunsUsed();
  const extraRuns = await getExtraRuns();
  console.log('[RunLimit] runsUsed:', runsUsed, 'extraRuns:', extraRuns);

  if (runsUsed < FREE_RUN_LIMIT) {
    const next = runsUsed + 1;
    try { await AsyncStorage.setItem(RUNS_USED_KEY, String(next)); } catch {}
    return { allowed: true, runsUsed: next, extraRuns };
  }

  if (extraRuns > 0) {
    const next = extraRuns - 1;
    try { await AsyncStorage.setItem(EXTRA_RUNS_KEY, String(next)); } catch {}
    return { allowed: true, runsUsed, extraRuns: next };
  }

  return { allowed: false, runsUsed, extraRuns };
}
