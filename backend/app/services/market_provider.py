"""
Market data provider — the single source of truth for prices.

Two providers behind one interface:

  1. TwelveDataProvider — real market data, used when
     TWELVE_DATA_API_KEY is configured (or MARKET_PROVIDER=twelvedata).

  2. SimProvider — a self-contained market engine that generates
     realistic, continuously-moving candles for every supported symbol.
     Used automatically when no API key is present, so the entire
     platform (trading, AI signals, stop-loss monitor, charts) runs
     end-to-end with zero external dependencies.

The SimProvider advances on a background tick (every PRICE_TICK_SECONDS)
so every request, every open trade, and the trade monitor all observe
the SAME price — one consistent market.
"""

import os
import random
import threading
import time

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("TWELVE_DATA_API_KEY", "").strip()
PROVIDER = os.getenv("MARKET_PROVIDER", "auto").lower()

# Ticks advance the market; N ticks are aggregated into one candle.
PRICE_TICK_SECONDS = 2
TICKS_PER_CANDLE = 3          # => 6-second candles
CANDLES_KEPT = 300
REQUEST_TIMEOUT = 8

# ---------------------------------------------------------------------------
# Supported instruments
# ---------------------------------------------------------------------------

SYMBOLS = {
    "BTCUSD": {"name": "Bitcoin",          "base": 68400.0, "vol": 0.0022, "td": "BTC/USD"},
    "ETHUSD": {"name": "Ethereum",         "base": 3520.0,  "vol": 0.0026, "td": "ETH/USD"},
    "EURUSD": {"name": "Euro / US Dollar", "base": 1.0846,  "vol": 0.00055, "td": "EUR/USD"},
    "GBPUSD": {"name": "Pound / US Dollar","base": 1.2721,  "vol": 0.00065, "td": "GBP/USD"},
    "USDJPY": {"name": "US Dollar / Yen",  "base": 149.84,  "vol": 0.00075, "td": "USD/JPY"},
    "XAUUSD": {"name": "Gold Spot",        "base": 2413.6,  "vol": 0.0010,  "td": "XAU/USD"},
    "AAPL":   {"name": "Apple Inc.",       "base": 228.4,   "vol": 0.0012,  "td": "AAPL"},
    "TSLA":   {"name": "Tesla Inc.",       "base": 246.9,   "vol": 0.0030,  "td": "TSLA"},
}

# Legacy aliases used elsewhere in the codebase
FOREX_PAIRS = {
    "EURUSD": "EUR/USD",
    "GBPUSD": "GBP/USD",
    "USDJPY": "USD/JPY",
    "AUDUSD": "AUD/USD",
    "USDCAD": "USD/CAD",
    "USDCHF": "USD/CHF",
    "NZDUSD": "NZD/USD",
}


def normalize_symbol(symbol: str) -> str:
    """EURUSD -> EUR/USD for TwelveData; stocks/crypto pass through."""
    s = symbol.upper().replace("/", "")
    if s in SYMBOLS:
        return SYMBOLS[s]["td"]
    return FOREX_PAIRS.get(s, s)


def canonical_symbol(symbol: str) -> str:
    """Accept BTCUSD / BTC/USD / btcusd -> BTCUSD."""
    return symbol.upper().replace("/", "")


# ---------------------------------------------------------------------------
# Simulated market engine
# ---------------------------------------------------------------------------

class _SymbolEngine:
    """Regime-switching random walk — rallies, sell-offs, chop."""

    REGIMES = ["rally", "up", "chop", "down", "selloff"]
    DRIFT = {"rally": 1.6, "up": 0.8, "chop": 0.05, "down": -0.8, "selloff": -1.6}

    def __init__(self, symbol: str, base: float, vol: float):
        self.symbol = symbol
        self.vol = vol
        self.price = base * (1 + random.uniform(-0.005, 0.005))
        self.base = base
        self.regime = random.choice(self.REGIMES)
        self.regime_ticks = random.randint(20, 80)
        self.candles = []
        self.ticks_in_candle = 0
        self.current = None
        self._lock = threading.Lock()
        self._open24 = self.price * (1 + random.gauss(0, 0.004))

    def _step_regime(self):
        self.regime_ticks -= 1
        if self.regime_ticks <= 0 or random.random() < 0.03:
            self.regime = random.choice(self.REGIMES)
            self.regime_ticks = random.randint(20, 90)

    def _next_price(self):
        shock = random.gauss(0, 1)
        burst = 2.6 if random.random() < 0.02 else 1.0
        drift = self.DRIFT[self.regime] * 0.9
        change = self.price * self.vol * (drift + shock * burst)
        self.price = max(self.price + change, self.base * 0.2)

    def tick(self, now: int):
        with self._lock:
            self._step_regime()
            self._next_price()

            if self.current is None:
                self.current = {
                    "time": now,
                    "open": self.price,
                    "high": self.price,
                    "low": self.price,
                    "close": self.price,
                    "volume": 0.0,
                }

            c = self.current
            c["close"] = self.price
            c["high"] = max(c["high"], self.price)
            c["low"] = min(c["low"], self.price)
            c["volume"] += random.uniform(40, 260)
            self.ticks_in_candle += 1

            if self.ticks_in_candle >= TICKS_PER_CANDLE:
                self.candles.append(dict(c))
                if len(self.candles) > CANDLES_KEPT:
                    self.candles.pop(0)
                self.current = {
                    "time": now,
                    "open": c["close"],
                    "high": c["close"],
                    "low": c["close"],
                    "close": c["close"],
                    "volume": 0.0,
                }
                self.ticks_in_candle = 0

    def backfill(self, now: int):
        """Build history so charts and indicators start fully formed."""
        candle_secs = TICKS_PER_CANDLE * PRICE_TICK_SECONDS
        cursor = now - CANDLES_KEPT * candle_secs
        for _ in range(CANDLES_KEPT):
            self.tick(cursor)
            cursor += candle_secs
        # Anchor the 24h reference near the settled price so the
        # displayed daily change stays realistic
        self._open24 = self.price * (1 + random.gauss(0, 0.008))

    def snapshot(self) -> dict:
        with self._lock:
            change = (self.price - self._open24) / self._open24 * 100
            return {
                "price": self.price,
                "change_pct": change,
                "spark": [c["close"] for c in self.candles[-48:]],
            }

    def history(self, limit: int = 120) -> list:
        with self._lock:
            data = self.candles[-limit:]
            return [dict(c) for c in data]


class SimProvider:
    def __init__(self):
        self.engines = {
            sym: _SymbolEngine(sym, meta["base"], meta["vol"])
            for sym, meta in SYMBOLS.items()
        }
        now = int(time.time())
        for eng in self.engines.values():
            eng.backfill(now)

        self._running = False

    def start(self):
        if self._running:
            return
        self._running = True

        def loop():
            while self._running:
                now = int(time.time())
                for eng in self.engines.values():
                    eng.tick(now)
                time.sleep(PRICE_TICK_SECONDS)

        threading.Thread(target=loop, daemon=True).start()

    def price(self, symbol: str) -> dict | None:
        eng = self.engines.get(canonical_symbol(symbol))
        if eng is None:
            return None
        snap = eng.snapshot()
        return {
            "symbol": canonical_symbol(symbol),
            "price": round(snap["price"], 6),
            "change_pct": round(snap["change_pct"], 3),
            "provider": "simulated",
        }

    def quotes(self) -> list:
        out = []
        for sym, eng in self.engines.items():
            snap = eng.snapshot()
            out.append(
                {
                    "symbol": sym,
                    "name": SYMBOLS[sym]["name"],
                    "price": round(snap["price"], 6),
                    "change_pct": round(snap["change_pct"], 3),
                    "spark": [round(v, 6) for v in snap["spark"]],
                }
            )
        return out

    def candles(self, symbol: str, limit: int = 220) -> list | None:
        eng = self.engines.get(canonical_symbol(symbol))
        if eng is None:
            return None
        return eng.history(limit)

    def history(self, symbol: str) -> list | None:
        """Candles in the shape the AI service consumes."""
        return self.candles(symbol, CANDLES_KEPT)


class TwelveDataProvider:
    BASE = "https://api.twelvedata.com"

    def _get(self, path: str, params: dict):
        try:
            params["apikey"] = API_KEY
            res = requests.get(
                f"{self.BASE}{path}", params=params, timeout=REQUEST_TIMEOUT
            )
            res.raise_for_status()
            return res.json()
        except (requests.RequestException, ValueError):
            return None

    def price(self, symbol: str) -> dict | None:
        data = self._get("/price", {"symbol": normalize_symbol(symbol)})
        if not data or "price" not in data:
            return None
        return {
            "symbol": canonical_symbol(symbol),
            "price": float(data["price"]),
            "provider": "twelvedata",
        }

    def history(self, symbol: str) -> list | None:
        data = self._get(
            "/time_series",
            {
                "symbol": normalize_symbol(symbol),
                "interval": "1h",
                "outputsize": 120,
            },
        )
        if not data or "values" not in data:
            return None
        candles = []
        for v in reversed(data["values"]):
            try:
                candles.append(
                    {
                        "time": int(
                            time.mktime(
                                time.strptime(
                                    v["datetime"], "%Y-%m-%d %H:%M:%S"
                                )
                            )
                        ),
                        "open": float(v["open"]),
                        "high": float(v["high"]),
                        "low": float(v["low"]),
                        "close": float(v["close"]),
                        "volume": float(v.get("volume", 0) or 0),
                    }
                )
            except (KeyError, ValueError):
                continue
        return candles

    def quotes(self) -> list | None:
        # Rate-limit friendly: caller falls back to sim for the snapshot
        return None

    def candles(self, symbol: str, limit: int = 220) -> list | None:
        hist = self.history(symbol)
        return hist[-limit:] if hist else None

    def start(self):  # interface parity
        return None


# ---------------------------------------------------------------------------
# Provider selection (auto: real key wins, otherwise simulated)
# ---------------------------------------------------------------------------

_sim = SimProvider()
_twelvedata = TwelveDataProvider()


def use_real() -> bool:
    return bool(API_KEY) and PROVIDER in ("auto", "twelvedata")


def active() -> SimProvider | TwelveDataProvider:
    return _twelvedata if use_real() else _sim


def start_provider():
    """Called once on app startup — the simulated engine ticks in
    the background so every consumer sees a consistent market."""
    _sim.start()


def quotes() -> list:
    """All-instrument snapshot; sim always backs this up."""
    q = active().quotes()
    if not q:
        q = _sim.quotes()
    return q


def candles(symbol: str, limit: int = 220):
    """OHLC history; falls back to sim when the real provider
    can't serve (unknown symbol, rate limit)."""
    provider = active()
    data = provider.candles(symbol, limit)
    if data is None and provider is not _sim:
        data = _sim.candles(symbol, limit)
    return data
