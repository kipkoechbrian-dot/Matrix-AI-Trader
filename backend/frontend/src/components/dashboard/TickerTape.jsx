import { Box, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { useMarket } from "../../hooks/useMarket";
import { formatPrice } from "../../services/marketSim";

function TapeItem({ s }) {
  const up = s.changePct >= 0;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 3,
        py: 0.6,
        whiteSpace: "nowrap",
      }}
    >
      <Typography
        component="span"
        sx={{
          fontWeight: 800,
          fontSize: "0.8rem",
          letterSpacing: "0.06em",
          color: "#93c5fd",
        }}
      >
        {s.symbol}
      </Typography>
      <Typography
        component="span"
        sx={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#e6efff" }}
      >
        {formatPrice(s.price, s.decimals > 3 ? s.decimals : Math.min(s.decimals, 2))}
      </Typography>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.3,
          color: up ? "#22d3ee" : "#ff5c7a",
          fontSize: "0.78rem",
          fontWeight: 700,
        }}
      >
        {up ? (
          <TrendingUpIcon sx={{ fontSize: 14 }} />
        ) : (
          <TrendingDownIcon sx={{ fontSize: 14 }} />
        )}
        {up ? "+" : ""}
        {s.changePct.toFixed(2)}%
      </Box>
    </Box>
  );
}

export default function TickerTape() {
  const market = useMarket();
  const doubled = [...market, ...market];

  return (
    <Box
      sx={{
        overflow: "hidden",
        borderTop: "1px solid rgba(59,130,246,0.16)",
        borderBottom: "1px solid rgba(59,130,246,0.16)",
        background: "rgba(2,6,23,0.75)",
        "&:hover .tape-track": { animationPlayState: "paused" },
      }}
    >
      <Box
        className="tape-track"
        sx={{
          display: "inline-flex",
          animation: "tickerScroll 36s linear infinite",
        }}
      >
        {doubled.map((s, i) => (
          <TapeItem key={`${s.symbol}-${i}`} s={s} />
        ))}
      </Box>
    </Box>
  );
}
