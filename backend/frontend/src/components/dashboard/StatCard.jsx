import { Box, Stack, Typography } from "@mui/material";
import Sparkline from "../charts/Sparkline";
import AnimatedNumber from "../common/AnimatedNumber";

/**
 * KPI stat card: label, big animated value, live sparkline + delta chip.
 */
export default function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  delta,
  spark,
  accent = "#3b82f6",
  delay = 0,
}) {
  const up = (delta ?? 0) >= 0;

  return (
    <Box
      className="glass-panel anim-fade-up"
      sx={{
        p: 2.4,
        animationDelay: `${delay}ms`,
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          borderColor: "rgba(59,130,246,0.45)",
          boxShadow: "0 16px 44px rgba(37,99,235,0.28)",
        },
      }}
    >
      {/* top accent beam */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: 0.85,
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "#8ba3cf",
              textTransform: "uppercase",
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              mt: 0.8,
              fontSize: "1.75rem",
              fontWeight: 800,
              fontFamily: "monospace",
              letterSpacing: "-0.02em",
              color: "#e6efff",
              textShadow: "0 0 24px rgba(59,130,246,0.35)",
            }}
          >
            {prefix}
            <AnimatedNumber
              value={value}
              format={(v) =>
                v.toLocaleString("en-US", {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                })
              }
            />
            {suffix}
          </Typography>
          {delta !== undefined && (
            <Typography
              sx={{
                mt: 0.4,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: up ? "#22d3ee" : "#ff5c7a",
              }}
            >
              {up ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}% vs session open
            </Typography>
          )}
        </Box>

        {spark && (
          <Box sx={{ opacity: 0.95, mt: 0.5 }}>
            <Sparkline
              data={spark}
              width={110}
              height={44}
              stroke={accent}
              fillId={`stat-${label.replace(/\W+/g, "-")}`}
            />
          </Box>
        )}
      </Stack>
    </Box>
  );
}
