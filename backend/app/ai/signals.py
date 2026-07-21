from app.ai.indicators import analyze_market


def generate_signal(symbol: str, price: float):
    """
    AI Trading Signal Engine
    """

    # Temporary historical prices
    prices = [
        price - 2,
        price - 1.8,
        price - 1.5,
        price - 1.2,
        price - 1,
        price - 0.8,
        price - 0.6,
        price - 0.5,
        price - 0.4,
        price - 0.3,
        price - 0.2,
        price - 0.1,
        price
    ] * 5

    analysis = analyze_market(prices)

    signal = "HOLD"
    confidence = 65
    reason = []

    if (
        analysis["ema20"] > analysis["ema50"]
        and analysis["rsi"] < 70
    ):
        signal = "BUY"
        confidence = 90
        reason.append("EMA20 is above EMA50")
        reason.append("RSI supports bullish momentum")

    elif (
        analysis["ema20"] < analysis["ema50"]
        and analysis["rsi"] > 30
    ):
        signal = "SELL"
        confidence = 88
        reason.append("EMA20 is below EMA50")
        reason.append("RSI supports bearish momentum")

    else:
        reason.append("No strong trend detected")

    return {
        "symbol": symbol,
        "price": price,
        "signal": signal,
        "confidence": confidence,
        "analysis": analysis,
        "reason": reason
    }