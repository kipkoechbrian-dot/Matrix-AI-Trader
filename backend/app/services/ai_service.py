import pandas as pd

from app.services.market_service import get_market_history


def calculate_rsi(data, period=14):
    delta = data["close"].diff()

    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)

    avg_gain = gain.rolling(period).mean()
    avg_loss = loss.rolling(period).mean()

    rs = avg_gain / avg_loss

    return 100 - (100 / (1 + rs))


def get_ai_signal(symbol: str):

    candles = get_market_history(symbol)

    if candles is None:
        return None

    df = pd.DataFrame(candles)

    df["close"] = df["close"].astype(float)

    # EMA
    df["EMA20"] = df["close"].ewm(span=20).mean()
    df["EMA50"] = df["close"].ewm(span=50).mean()

    # RSI
    df["RSI"] = calculate_rsi(df)

    # MACD
    ema12 = df["close"].ewm(span=12).mean()
    ema26 = df["close"].ewm(span=26).mean()

    df["MACD"] = ema12 - ema26
    df["MACD_SIGNAL"] = df["MACD"].ewm(span=9).mean()

    latest = df.iloc[-1]

    confidence = 50
    reasons = []

    signal = "HOLD"

    if latest["EMA20"] > latest["EMA50"]:
        confidence += 15
        reasons.append("EMA20 is above EMA50")
    else:
        confidence -= 10
        reasons.append("EMA20 is below EMA50")

    if latest["RSI"] > 55:
        confidence += 10
        reasons.append("RSI supports bullish momentum")
    elif latest["RSI"] < 45:
        confidence -= 10
        reasons.append("RSI indicates bearish momentum")

    if latest["MACD"] > latest["MACD_SIGNAL"]:
        confidence += 15
        reasons.append("MACD bullish crossover")
    else:
        confidence -= 15
        reasons.append("MACD bearish crossover")

    if confidence >= 70:
        signal = "BUY"
    elif confidence <= 40:
        signal = "SELL"

    entry = round(latest["close"], 2)

    if signal == "BUY":
        stop_loss = round(entry * 0.98, 2)
        take_profit = round(entry * 1.04, 2)
    elif signal == "SELL":
        stop_loss = round(entry * 1.02, 2)
        take_profit = round(entry * 0.96, 2)
    else:
        stop_loss = entry
        take_profit = entry

    risk = abs(entry - stop_loss)
    reward = abs(take_profit - entry)

    rr = round(reward / risk, 2) if risk != 0 else 0

    return {
        "symbol": symbol,
        "signal": signal,
        "confidence": min(confidence, 100),
        "entry_price": entry,
        "stop_loss": stop_loss,
        "take_profit": take_profit,
        "risk_reward_ratio": rr,
        "analysis": {
    "price": float(round(latest["close"], 2)),
    "EMA20": float(round(latest["EMA20"], 2)),
    "EMA50": float(round(latest["EMA50"], 2)),
    "RSI": float(round(latest["RSI"], 2)),
    "MACD": float(round(latest["MACD"], 4)),
    "MACD_SIGNAL": float(round(latest["MACD_SIGNAL"], 4))
},
        "reason": reasons
    }