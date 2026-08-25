/**
 * Client-side technical indicators used by the AI Signal card.
 * Mirrors the backend logic in app/ai (EMA cross + RSI) so the
 * signal shown in the UI reflects the live chart in front of you.
 */

export function ema(values, period) {
  if (values.length === 0) return null;
  const k = 2 / (period + 1);
  let result = values[0];
  for (let i = 1; i < values.length; i++) {
    result = values[i] * k + result * (1 - k);
  }
  return result;
}

export function rsi(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function analyze(candles) {
  const closes = candles.map((c) => c.close);
  const ema20 = ema(closes.slice(-60), 20);
  const ema50 = ema(closes, 50);
  const rsiValue = rsi(closes, 14);
  const price = closes[closes.length - 1];

  let signal = "HOLD";
  const reasons = [];
  let confidence = 62 + Math.round(Math.abs(rsiValue - 50) / 2);

  if (ema20 > ema50 && rsiValue < 70) {
    signal = "BUY";
    confidence = Math.min(96, 78 + Math.round((rsiValue < 40 ? 8 : 4)));
    reasons.push("EMA 20 crossed above EMA 50 — bullish structure");
    reasons.push(`RSI at ${rsiValue.toFixed(0)} — momentum supports upside`);
    if (rsiValue < 35) reasons.push("Oversold bounce in progress");
  } else if (ema20 < ema50 && rsiValue > 30) {
    signal = "SELL";
    confidence = Math.min(96, 78 + Math.round((rsiValue > 60 ? 8 : 4)));
    reasons.push("EMA 20 below EMA 50 — bearish structure");
    reasons.push(`RSI at ${rsiValue.toFixed(0)} — momentum favors downside`);
    if (rsiValue > 65) reasons.push("Overbought exhaustion forming");
  } else {
    reasons.push("EMA 20 / EMA 50 converging — no dominant trend");
    reasons.push(`RSI at ${rsiValue.toFixed(0)} — neutral zone`);
  }

  return { signal, confidence, reasons, ema20, ema50, rsi: rsiValue, price };
}
