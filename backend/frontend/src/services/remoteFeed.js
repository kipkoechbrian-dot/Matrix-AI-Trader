/**
 * remoteFeed — bridges the frontend to the FastAPI market engine.
 *
 * When the backend answers, the ENTIRE app switches to server truth:
 * charts, watchlist, ticker, entries, exits and the trade monitor all
 * observe the same prices that trades execute at. When the backend is
 * unreachable the app seamlessly runs on the local simulated feed.
 */

import api from "./api";
import {
  SYMBOLS,
  setRemoteQuotes,
  setRemoteCandles,
  setRemoteMode,
  isRemoteMode,
} from "./marketSim";

/* -------- tiny status store (for the navbar badge) -------- */

const statusListeners = new Set();
let status = "connecting"; // connecting | live | offline

export function getFeedStatus() {
  return status;
}

function setStatus(next) {
  if (next === status) return;
  status = next;
  statusListeners.forEach((fn) => fn(next));
}

export function subscribeFeedStatus(fn) {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}

/* -------- polling engine -------- */

let started = false;
let candleIndex = 0;

const QUOTES_EVERY = 3000;  // whole-market snapshot
const CANDLES_EVERY = 6000; // one symbol per sweep, round-robin

async function pollQuotes() {
  try {
    const { data } = await api.get("/market/quotes");
    if (Array.isArray(data) && data.length) {
      setRemoteQuotes(data);
      setRemoteMode(true);
      setStatus("live");
      return;
    }
    throw new Error("empty quotes");
  } catch {
    setRemoteMode(false);
    setStatus("offline");
  }
}

async function fetchCandles(symbol) {
  try {
    const { data } = await api.get(`/market/${symbol}/candles`, {
      params: { limit: 220 },
    });
    if (Array.isArray(data) && data.length) {
      setRemoteCandles(symbol, data);
    }
  } catch {
    /* single-symbol failure is harmless */
  }
}

async function pollNextCandles() {
  if (getFeedStatus() !== "live") return;
  const symbol = SYMBOLS[candleIndex % SYMBOLS.length].symbol;
  candleIndex += 1;
  await fetchCandles(symbol);
}

/**
 * Boot the feed. Idempotent — call once on app start.
 */
export function startRemoteFeed() {
  if (started) return;
  started = true;

  pollQuotes(); // first probe immediately
  setInterval(pollQuotes, QUOTES_EVERY);
  setInterval(pollNextCandles, CANDLES_EVERY);

  // Prime candle history for every symbol once (staggered)
  SYMBOLS.forEach((s, i) => {
    setTimeout(() => fetchCandles(s.symbol), 350 * (i + 1));
  });
}

export { isRemoteMode };
