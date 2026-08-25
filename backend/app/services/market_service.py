import logging
import os

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

API_KEY = os.getenv("TWELVE_DATA_API_KEY")

REQUEST_TIMEOUT = 8  # seconds — never hang a request on a third-party API


# Forex symbol conversion
FOREX_PAIRS = {
    "EURUSD": "EUR/USD",
    "GBPUSD": "GBP/USD",
    "USDJPY": "USD/JPY",
    "AUDUSD": "AUD/USD",
    "USDCAD": "USD/CAD",
    "USDCHF": "USD/CHF",
    "NZDUSD": "NZD/USD"
}


def normalize_symbol(symbol: str):
    """
    Converts stored symbols into the format expected by TwelveData.
    Stocks like AAPL remain unchanged.
    """
    return FOREX_PAIRS.get(symbol.upper(), symbol.upper())


def _get(url: str, params: dict):
    """Small guarded HTTP helper — returns parsed JSON or None."""
    try:
        response = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as exc:
        logger.warning("Market data request failed: %s", exc)
        return None


def get_live_price(symbol: str):

    api_symbol = normalize_symbol(symbol)

    data = _get(
        "https://api.twelvedata.com/price",
        {"symbol": api_symbol, "apikey": API_KEY},
    )

    if not data or "price" not in data:
        return None

    return {
        "symbol": symbol.upper(),
        "price": float(data["price"])
    }


def get_market_history(symbol: str):

    api_symbol = normalize_symbol(symbol)

    data = _get(
        "https://api.twelvedata.com/time_series",
        {
            "symbol": api_symbol,
            "interval": "1day",
            "outputsize": 100,
            "apikey": API_KEY,
        },
    )

    if not data or "values" not in data:
        return None

    # TwelveData returns newest candles first.
    # Reverse them so indicators calculate correctly.
    candles = list(reversed(data["values"]))

    return candles
