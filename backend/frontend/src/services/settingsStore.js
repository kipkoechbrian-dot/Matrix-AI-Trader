/* ------------------------------------------------------------------ */
/* User preferences — persisted locally, applied across the terminal. */
/* A tiny module store: dialogs read a snapshot when they open.       */
/* ------------------------------------------------------------------ */

const KEY = "matrix_settings";

const DEFAULTS = Object.freeze({
  defaultStake: "100", // USD stake suggested on each new ticket
  defaultStopLossPct: "1", // % distance used to prefill stop loss (0 = off)
  defaultTakeProfitPct: "2", // % distance used to prefill take profit (0 = off)
  confirmClose: true, // ask before manually closing a position
});

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

let cache = load();

/** Current snapshot of the user's settings. */
export function getSettings() {
  return cache;
}

/** Immutable copy of the factory defaults (for the reset button). */
export function getDefaultSettings() {
  return { ...DEFAULTS };
}

/** Persist a new partial/complete settings object. */
export function saveSettings(next) {
  cache = { ...DEFAULTS, ...next };
  localStorage.setItem(KEY, JSON.stringify(cache));
  return cache;
}
