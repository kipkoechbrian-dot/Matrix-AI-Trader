import { useMemo } from "react";
import { Box, Stack, Typography, LinearProgress, Chip, Divider } from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { useSymbol } from "../../hooks/useMarket";
import { analyze } from "../../services/indicatorUtils";
import { formatPrice } from "../../services/marketSim";

const SIGNAL_STYLE = {
  BUY: { color: "#22d3ee", bg: "rgba(34,211,238,0.12)", border: "rgba(34,211,238,0.5)", glow: "0 0 28px rgba(34,211,238,0.35)" },
  SELL: { color: "#ff5c7a", bg: "rgba(255,92,122,0.12)", border: "rgba(255,92,122,0.5)", glow: "0 0 28px rgba(255,92,122,0.3)" },
  HOLD: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.45)", glow: "0 0 28px rgba(251,191,36,0.25)" },
};

export default function AISignalCard({ symbol = "BTCUSD" }) {
  const live = useSymbol(symbol);

  const result = useMemo(
    () => analyze(live.candles),
    [live.candles] // updates each tick as the newest candle mutates
  );

  const style = SIGNAL_STYLE[result.signal];

  return (
    <Box className="glass-panel" sx={{ p: 2.5, height: "100%", position: "relative", overflow: "hidden" }}>
      {/* ambient glow */}
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

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <PsychologyIcon sx={{ color: "#60a5fa", fontSize: 26 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1rem" }}>
            AI Signal Engine
          </Typography>
          <Typography sx={{ fontSize: "0.7rem", color: "#8ba3cf" }}>
            EMA cross + RSI on the live {symbol} chart
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          key={result.signal}
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
            sx={{
              fontWeight: 900,
              fontSize: "1.5rem",
              letterSpacing: "0.08em",
              color: style.color,
            }}
          >
            {result.signal}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
            <Typography sx={{ fontSize: "0.7rem", color: "#8ba3cf", fontWeight: 700 }}>
              CONFIDENCE
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#e6efff" }}>
              {result.confidence}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={result.confidence}
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
        <Chip size="small" label={`EMA20 ${formatPrice(result.ema20, 2)}`} sx={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#93c5fd", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)" }} />
        <Chip size="small" label={`EMA50 ${formatPrice(result.ema50, 2)}`} sx={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#8ba3cf", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }} />
        <Chip size="small" label={`RSI ${result.rsi.toFixed(0)}`} sx={{ fontSize: "0.68rem", fontFamily: "monospace", color: result.rsi > 70 ? "#ff5c7a" : result.rsi < 30 ? "#22d3ee" : "#93c5fd", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)" }} />
      </Stack>

      <Divider sx={{ my: 1.8, borderColor: "rgba(59,130,246,0.14)" }} />

      <Stack spacing={0.8}>
        {result.reasons.map((r) => (
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
