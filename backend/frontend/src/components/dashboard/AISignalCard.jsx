import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Stack, Typography, LinearProgress, Chip, Divider } from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { useSymbol } from "../../hooks/useMarket";
import { analyze } from "../../services/indicatorUtils";
import { getAISignal } from "../../services/tradeService";
import { formatPrice, isRemoteMode } from "../../services/marketSim";

const SIGNAL_STYLE = {
  BUY: { color: "#22d3ee", bg: "rgba(34,211,238,0.12)", border: "rgba(34,211,238,0.5)", glow: "0 0 28px rgba(34,211,238,0.35)" },
  SELL: { color: "#ff5c7a", bg: "rgba(255,92,122,0.12)", border: "rgba(255,92,122,0.5)", glow: "0 0 28px rgba(255,92,122,0.3)" },
  HOLD: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.45)", glow: "0 0 28px rgba(251,191,36,0.25)" },
};

/**
 * AI trading brain for the selected symbol.
 *
 * Prefers the backend engine (EMA + RSI + MACD confluence with
 * stop loss / take profit / risk-reward) when the API is live;
 * falls back to the identical client-side analysis otherwise.
 */
export default function AISignalCard({ symbol = "BTCUSD" }) {
  const live = useSymbol(symbol);
  const [serverSignal, setServerSignal] = useState(null);
  const failCount = useRef(0);

  // Poll the AI engine whenever we're in remote (API) mode
  useEffect(() => {
    let cancelled = false;
    let timer;

    async function fetchSignal() {
      if (!isRemoteMode()) {
        setServerSignal(null);
        return;
      }
      try {
        const data = await getAISignal(symbol);
        if (!cancelled) {
          setServerSignal(data);
          failCount.current = 0;
        }
      } catch {
        failCount.current += 1;
        if (!cancelled && failCount.current > 2) setServerSignal(null);
      }
    }

    fetchSignal();
    timer = setInterval(fetchSignal, 6000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [symbol]);

  const local = useMemo(() => analyze(live.candles), [live.candles]);

  // Normalize both shapes into one view model
  const view = serverSignal
    ? {
        signal: serverSignal.signal,
        confidence: serverSignal.confidence,
        reasons: serverSignal.reason || [],
        ema20: serverSignal.analysis?.EMA20,
        ema50: serverSignal.analysis?.EMA50,
        rsi: serverSignal.analysis?.RSI,
        stopLoss: serverSignal.stop_loss,
        takeProfit: serverSignal.take_profit,
        rr: serverSignal.risk_reward_ratio,
        source: "server",
      }
    : {
        signal: local.signal,
        confidence: local.confidence,
        reasons: local.reasons,
        ema20: local.ema20,
        ema50: local.ema50,
        rsi: local.rsi,
        stopLoss: null,
        takeProfit: null,
        rr: null,
        source: "local",
      };

  const style = SIGNAL_STYLE[view.signal] || SIGNAL_STYLE.HOLD;

  return (
    <Box className="glass-panel" sx={{ p: 2.5, height: "100%", position: "relative", overflow: "hidden" }}>
      <Box
        sx={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.25), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PsychologyIcon sx={{ color: "#60a5fa", fontSize: 26 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1rem" }}>
              AI Signal Engine
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: "#8ba3cf" }}>
              EMA + RSI + MACD on live {symbol} data
            </Typography>
          </Box>
        </Stack>
        <Chip
          size="small"
          label={view.source === "server" ? "AI SERVER" : "LOCAL"}
          sx={{
            fontSize: "0.6rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            height: 18,
            color: view.source === "server" ? "#22d3ee" : "#8ba3cf",
            border: `1px solid ${view.source === "server" ? "rgba(34,211,238,0.4)" : "rgba(139,163,207,0.3)"}`,
            background: "transparent",
          }}
        />
      </Stack>

      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          key={view.signal + String(view.confidence)}
          className="anim-fade-up"
          sx={{
            px: 2.6,
            py: 1.2,
            borderRadius: "12px",
            background: style.bg,
            border: `1px solid ${style.border}`,
            boxShadow: style.glow,
          }}
        >
          <Typography
            sx={{ fontWeight: 900, fontSize: "1.5rem", letterSpacing: "0.08em", color: style.color }}
          >
            {view.signal}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
            <Typography sx={{ fontSize: "0.7rem", color: "#8ba3cf", fontWeight: 700 }}>
              CONFIDENCE
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#e6efff" }}>
              {view.confidence}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={view.confidence}
            sx={{
              height: 8,
              borderRadius: 6,
              background: "rgba(37,99,235,0.15)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 6,
                background: `linear-gradient(90deg, #1d4ed8, ${style.color})`,
                boxShadow: `0 0 12px ${style.color}`,
              },
            }}
          />
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
        {view.ema20 != null && (
          <Chip size="small" label={`EMA20 ${formatPrice(view.ema20, 2)}`} sx={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#93c5fd", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)" }} />
        )}
        {view.ema50 != null && (
          <Chip size="small" label={`EMA50 ${formatPrice(view.ema50, 2)}`} sx={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#8ba3cf", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }} />
        )}
        {view.rsi != null && (
          <Chip size="small" label={`RSI ${Number(view.rsi).toFixed(0)}`} sx={{ fontSize: "0.68rem", fontFamily: "monospace", color: view.rsi > 70 ? "#ff5c7a" : view.rsi < 30 ? "#22d3ee" : "#93c5fd", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)" }} />
        )}
        {view.rr != null && (
          <Chip size="small" label={`R:R ${view.rr}`} sx={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#67e8f9", background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.3)" }} />
        )}
      </Stack>

      {view.stopLoss != null && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.2 }} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`SL ${formatPrice(view.stopLoss, 2)}`} sx={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#ff8fa5", background: "rgba(255,92,122,0.08)", border: "1px solid rgba(255,92,122,0.35)" }} />
          <Chip size="small" label={`TP ${formatPrice(view.takeProfit, 2)}`} sx={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#67e8f9", background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.35)" }} />
        </Stack>
      )}

      <Divider sx={{ my: 1.8, borderColor: "rgba(59,130,246,0.14)" }} />

      <Stack spacing={0.8}>
        {view.reasons.map((r) => (
          <Stack key={r} direction="row" spacing={1} alignItems="flex-start">
            <Typography sx={{ color: "#3b82f6", lineHeight: 1.5, fontSize: "0.8rem" }}>▸</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "#b6c8ea", lineHeight: 1.5 }}>
              {r}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
