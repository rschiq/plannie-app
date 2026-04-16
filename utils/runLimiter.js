import AsyncStorage from '@react-native-async-storage/async-storage';

const RUNS_USED_KEY = '@plannie_runs_used';
const EXTRA_RUNS_KEY = '@plannie_extra_runs';
const FREE_RUN_LIMIT = 3;
const DEV_MODE = true;

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

  const runsUsed = await getRunsUsed();
  console.log('[RunLimit] runsUsed:', runsUsed);
  const extraRuns = await getExtraRuns();
  console.log('[AddOn] extraRuns:', extraRuns);

  // Priority: consume free runs first, then extra runs.
  if (runsUsed < FREE_RUN_LIMIT) {
    const nextRunsUsed = runsUsed + 1;
    try {
      await AsyncStorage.setItem(RUNS_USED_KEY, String(nextRunsUsed));
    } catch {}
    return { allowed: true, runsUsed: nextRunsUsed, extraRuns };
  }

  if (extraRuns > 0) {
    const nextExtraRuns = extraRuns - 1;
    try {
      await AsyncStorage.setItem(EXTRA_RUNS_KEY, String(nextExtraRuns));
    } catch {}
    console.log('[AddOn] extraRuns:', nextExtraRuns);
    return { allowed: true, runsUsed, extraRuns: nextExtraRuns };
  }

  return { allowed: false, runsUsed, extraRuns };
}
