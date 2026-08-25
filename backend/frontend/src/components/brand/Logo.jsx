import { Box, Typography } from "@mui/material";

export function LogoMark({ size = 40 }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 64 64"
      sx={{ width: size, height: size, display: "block", flexShrink: 0 }}
      aria-label="Matrix AI Trader logo"
    >
      <defs>
        <linearGradient id="logoG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="0.55" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="#020617" />
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="14"
        fill="none"
        stroke="url(#logoG)"
        strokeWidth="3"
      />
      <path
        d="M17 44V20l9 12 6-8 6 8 9-12v24"
        fill="none"
        stroke="url(#logoG)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}

export default function Logo({ size = 40, subtitle = true }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <LogoMark size={size} />
      <Box>
        <Typography
          sx={{
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            fontSize: size * 0.42,
            background: "linear-gradient(90deg, #e6efff 30%, #60a5fa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          MATRIX AI
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              fontSize: size * 0.22,
              fontWeight: 700,
              letterSpacing: "0.34em",
              color: "#3b82f6",
              lineHeight: 1.2,
            }}
          >
            TRADER
          </Typography>
        )}
      </Box>
    </Box>
  );
}
