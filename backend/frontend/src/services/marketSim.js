/**
 * marketSim — Matrix AI Trader's realtime market engine (browser side).
 *
 * Every symbol runs a regime-switching random walk: it trends hard up,
 * hard down, and chops sideways — so charts are always visibly moving.
 * The backend API, when reachable, takes precedence on the trade/account
 * side (see contexts + services); this feed guarantees the terminal is
 * alive the moment anyone opens it.
 *
 * Public API:
 *   SYMBOLS                 -> ordered list of tradable symbols
 *   getState(symbol)        -> { price, prevPrice, open24, changePct, spark, candles, decimals, name }
 *   getCandles(symbol)      -> array of { time, open, high, low, close, volume }
 *   getEquity()             -> array of { t, v } portfolio equity points
 *   getDemoTrades()         -> open positions with entry metadata
 *   subscribe(listener)     -> called every tick (1s), returns unsubscribe
 */

export const TICK_MS = 1000;
const CANDLE_TICKS = 3; // ticks aggregated into one candle (≈ 3s candles)
const CANDLE_COUNT = 220; // candles kept per symbol
const SPARK_POINTS = 48; // sparkline resolution
const EQUITY_POINTS = 240; // portfolio curve resolution

export const SYMBOLS = [
  { symbol: "BTCUSD", name: "Bitcoin", base: 68400, vol: 0.0022, decimals: 0 },
  { symbol: "ETHUSD", name: "Ethereum", base: 3520, vol: 0.0026, decimals: 1 },
  { symbol: "EURUSD", name: "Euro / US Dollar", base: 1.0846, vol: 0.00055, decimals: 5 },
  { symbol: "GBPUSD", name: "Pound / US Dollar", base: 1.2721, vol: 0.00065, decimals: 5 },
  { symbol: "USDJPY", name: "US Dollar / Yen", base: 149.84, vol: 0.00075, decimals: 3 },
  { symbol: "XAUUSD", name: "Gold Spot", base: 2413.6, vol: 0.001, decimals: 2 },
  { symbol: "AAPL", name: "Apple Inc.", base: 228.4, vol: 0.0012, decimals: 2 },
  { symbol: "TSLA", name: "Tesla Inc.", base: 246.9, vol: 0.003, decimals: 2 },
];

/* ---------- small utils ---------- */

function gaussian() {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const REGIMES = [
  { name: "rally", drift: 1.6, weight: 3 },
  { name: "up", drift: 0.8, weight: 4 },
  { name: "chop", drift: 0.05, weight: 4 },
  { name: "down", drift: -0.8, weight: 4 },
  { name: "selloff", drift: -1.6, weight: 3 },
];
const REGIME_POOL = REGIMES.flatMap((r) => Array(r.weight).fill(r));

/* ---------- symbol state ---------- */

function makeSymbolState(meta) {
  const now = Math.floor(Date.now() / 1000);
  const candleSecs = (CANDLE_TICKS * TICK_MS) / 1000;

  let price = meta.base * (1 + (Math.random() - 0.5) * 0.01);
  let regime = pick(REGIME_POOL);
  let regimeTicks = 20 + Math.floor(Math.random() * 60);
  const open24 = price * (1 + gaussian() * 0.004);

  const candles = [];
  const spark = [];

  // Backfill candles so charts open fully formed
  let cursor = now - CANDLE_COUNT * candleSecs;
  for (let i = 0; i < CANDLE_COUNT; i++) {
    const start = price;
    let high = start;
    let low = start;
    for (let t = 0; t < CANDLE_TICKS; t++) {
      price = nextPrice(price, meta.vol, regime);
      high = Math.max(high, price);
      low = Math.min(low, price);
      stepRegime();
    }
    candles.push({
      time: cursor,
      open: start,
      high,
      low,
      close: price,
      volume: Math.round(120 + Math.abs(gaussian()) * 480),
    });
    cursor += candleSecs;
  }

  candles.slice(-SPARK_POINTS).forEach((c) => spark.push(c.close));

  function stepRegime() {
    regimeTicks -= 1;
    if (regimeTicks <= 0 || Math.random() < 0.03) {
      regime = pick(REGIME_POOL);
      regimeTicks = 20 + Math.floor(Math.random() * 70);
    }
  }

  function nextPrice(px, vol, reg) {
    const shock = gaussian();
    // occasional volatility burst -> big visible candles
    const burst = Math.random() < 0.02 ? 2.8 : 1;
    const change = px * vol * (reg.drift * 0.9 + shock * burst);
    return Math.max(px + change, meta.base * 0.2);
  }

  const state = {
    ...meta,
    price,
    prevPrice: price,
    open24,
    candles,
    spark,
    regime,
    regimeTicks,
    currentCandle: {
      time: now,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 0,
    },
    ticksInCandle: 0,
  };

  state.step = function step(nowSec) {
    this.prevPrice = this.price;
    stepRegime();
    this.price = nextPrice(this.price, this.vol, this.regime);

    // live candle updates
    const c = this.currentCandle;
    c.close = this.price;
    c.high = Math.max(c.high, this.price);
    c.low = Math.min(c.low, this.price);
    c.volume += Math.round(40 + Math.random() * 220);
    this.ticksInCandle += 1;

    if (this.ticksInCandle >= CANDLE_TICKS) {
      this.candles.push({ ...c });
      if (this.candles.length > CANDLE_COUNT) this.candles.shift();
      this.spark.push(c.close);
      if (this.spark.length > SPARK_POINTS) this.spark.shift();

      this.currentCandle = {
        time: nowSec,
        open: c.close,
        high: c.close,
        low: c.close,
        close: c.close,
        volume: 0,
      };
      this.ticksInCandle = 0;
    }
  };

  return state;
}

/* ---------- singleton engine ---------- */

const states = new Map();
const listeners = new Set();

// Demo portfolio — equity curve walks with a gentle positive drift
const equity = [];
let equityValue = 12480;

// Demo open positions (P&L computed live from prices)
const demoTrades = [
  { id: 101, symbol: "BTCUSD", type: "BUY", amount: 0.45, entry: null, entryOffset: -0.012, openedAgoMin: 42 },
  { id: 102, symbol: "ETHUSD", type: "BUY", amount: 3.2, entry: null, entryOffset: -0.006, openedAgoMin: 18 },
  { id: 103, symbol: "EURUSD", type: "SELL", amount: 4000, entry: null, entryOffset: 0.004, openedAgoMin: 73 },
  { id: 104, symbol: "XAUUSD", type: "BUY", amount: 1.5, entry: null, entryOffset: -0.003, openedAgoMin: 9 },
  { id: 105, symbol: "TSLA", type: "SELL", amount: 12, entry: null, entryOffset: 0.009, openedAgoMin: 125 },
];

function init() {
  SYMBOLS.forEach((meta) => states.set(meta.symbol, makeSymbolState(meta)));

  // Anchor demo entries near current prices
  demoTrades.forEach((t) => {
    const s = states.get(t.symbol);
    t.entry = s.price * (1 + t.entryOffset);
  });

  // Backfill equity curve
  const now = Date.now();
  let v = equityValue * 0.93;
  for (let i = EQUITY_POINTS; i > 0; i--) {
    v += v * (gaussian() * 0.004 + 0.0008);
    equity.push({ t: now - i * 15000, v: Math.round(v) });
  }
  equityValue = v;

  setInterval(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    states.forEach((s) => s.step(nowSec));

    equityValue += equityValue * (gaussian() * 0.0035 + 0.00035);
    equity.push({ t: Date.now(), v: Math.round(equityValue) });
    if (equity.length > EQUITY_POINTS) equity.shift();

    listeners.forEach((fn) => fn());
  }, TICK_MS);
}

init();

/* ---------- public API ---------- */

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getCandles(symbol) {
  const s = states.get(symbol) || states.get(SYMBOLS[0].symbol);
  return [...s.candles, s.currentCandle];
}

export function getState(symbol) {
  const s = states.get(symbol) || states.get(SYMBOLS[0].symbol);
  return {
    symbol: s.symbol,
    name: s.name,
    decimals: s.decimals,
    price: s.price,
    prevPrice: s.prevPrice,
    changePct: ((s.price - s.open24) / s.open24) * 100,
    spark: [...s.spark],
    regime: s.regime.name,
    candles: getCandles(symbol),
  };
}

export function getAllStates() {
  return SYMBOLS.map((m) => getState(m.symbol));
}

export function getEquity() {
  return [...equity];
}

export function getEquityValue() {
  return equityValue;
}

export function getDemoTrades() {
  return demoTrades.map((t) => {
    const s = states.get(t.symbol);
    const dir = t.type === "BUY" ? 1 : -1;
    const pnl = ((s.price - t.entry) / t.entry) * 100 * dir;
    const gross = (s.price - t.entry) * t.amount * dir;
    return {
      ...t,
      current: s.price,
      pnlPct: pnl,
      pnlGross: gross,
    };
  });
}

export function formatPrice(value, decimals) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
