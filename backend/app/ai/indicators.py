import pandas as pd
from ta.trend import EMAIndicator
from ta.momentum import RSIIndicator


def analyze_market(prices):

    df = pd.DataFrame({
        "close": prices
    })

    df["ema20"] = EMAIndicator(
        close=df["close"],
        window=20
    ).ema_indicator()

    df["ema50"] = EMAIndicator(
        close=df["close"],
        window=50
    ).ema_indicator()

    df["rsi"] = RSIIndicator(
        close=df["close"],
        window=14
    ).rsi()

    latest = df.iloc[-1]

    return {
        "price": latest["close"],
        "ema20": round(latest["ema20"], 4),
        "ema50": round(latest["ema50"], 4),
        "rsi": round(latest["rsi"], 2)
    }