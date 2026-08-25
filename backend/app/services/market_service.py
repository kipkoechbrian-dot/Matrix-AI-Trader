"""
Market service — thin facade over the active market provider.

Kept function names stable so every existing route/service
(trade open/close, AI engine, monitor) works unchanged while
gaining the simulated fallback automatically.
"""

from app.services.market_provider import active, normalize_symbol, _sim


def get_live_price(symbol: str):
    provider = active()
    price = provider.price(symbol)
    if price is None and provider is not _sim:
        # Real provider failed (rate limit / network) — degrade to sim
        return _sim.price(symbol)
    return price


def get_market_history(symbol: str):
    provider = active()
    hist = provider.history(symbol)
    if hist is None and provider is not _sim:
        return _sim.history(symbol)
    return hist
