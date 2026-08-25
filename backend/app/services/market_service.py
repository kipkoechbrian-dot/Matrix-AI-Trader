import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("TWELVE_DATA_API_KEY")


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


def get_live_price(symbol: str):

    api_symbol = normalize_symbol(symbol)

    url = "https://api.twelvedata.com/price"

    params = {
        "symbol": api_symbol,
        "apikey": API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    print(data)

    if "price" not in data:
        return None

    return {
        "symbol": symbol.upper(),
        "price": float(data["price"])
    }


def get_market_history(symbol: str):

    api_symbol = normalize_symbol(symbol)

    url = "https://api.twelvedata.com/time_series"

    params = {
        "symbol": api_symbol,
        "interval": "1day",
        "outputsize": 100,
        "apikey": API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    print(data)

    if "values" not in data:
        return None

    # TwelveData returns newest candles first.
    # Reverse them so indicators calculate correctly.
    candles = list(reversed(data["values"]))

    return candles