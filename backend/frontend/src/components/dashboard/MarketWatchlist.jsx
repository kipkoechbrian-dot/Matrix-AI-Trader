import { Box, Stack, Typography, Divider } from "@mui/material";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useMarket } from "../../hooks/useMarket";
import { formatPrice } from "../../services/marketSim";
import Sparkline from "../charts/Sparkline";

function WatchRow({ s, selected, onSelect }) {
  const up = s.changePct >= 0;
  const flash =
    s.price > s.prevPrice ? "tick-up" : s.price < s.prevPrice ? "tick-down" : "";

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      onClick={() => onSelect?.(s.symbol)}
      sx={{
        px: 1.6,
        py: 1.1,
        borderRadius: "10px",
        cursor: onSelect ? "pointer" : "default",
        border:
          selected === s.symbol
            ? "1px solid rgba(59,130,246,0.55)"
            : "1px solid transparent",
        background:
          selected === s.symbol
            ? "rgba(37,99,235,0.16)"
            : "transparent",
        transition: "background 0.2s ease, border 0.2s ease",
        "&:hover": { background: "rgba(37,99,235,0.1)" },
      }}
    >
      <Box sx={{ minWidth: 92 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.86rem", color: "#dbeafe" }}>
          {s.symbol}
        </Typography>
        <Typography sx={{ fontSize: "0.68rem", color: "#5b6e96" }}>
          {s.name}
        </Typography>
      </Box>

      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <Sparkline
          data={s.spark}
          width={86}
          height={30}
          stroke={up ? "#22d3ee" : "#ff5c7a"}
          fillId={`wl-${s.symbol}`}
          strokeWidth={1.8}
        />
      </Box>

      <Box sx={{ textAlign: "right", minWidth: 96 }}>
        <Typography
          key={s.price.toFixed(6)}
          className={flash}
          sx={{
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: "0.88rem",
            color: "#e6efff",
          }}
        >
          {formatPrice(s.price, s.decimals)}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          sx={{ color: up ? "#22d3ee" : "#ff5c7a" }}
        >
          {up ? (
            <ArrowDropUpIcon sx={{ fontSize: 16 }} />
          ) : (
            <ArrowDropDownIcon sx={{ fontSize: 16 }} />
          )}
          <Typography sx={{ fontSize: "0.74rem", fontWeight: 700 }}>
            {up ? "+" : ""}
            {s.changePct.toFixed(2)}%
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}

export default function MarketWatchlist({ selected, onSelect }) {
  const market = useMarket();

  return (
    <Box className="glass-panel" sx={{ p: 2, height: "100%" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 0.6, pb: 0.5 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1rem" }}>
          Watchlist
        </Typography>
        <Typography
          sx={{
            fontSize: "0.68rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: "#22d3ee",
            animation: "pulseDot 2s infinite",
          }}
        >
          ● STREAMING
        </Typography>
      </Stack>
      <Divider sx={{ borderColor: "rgba(59,130,246,0.14)", mb: 0.5 }} />
      <Stack spacing={0.3} sx={{ maxHeight: 420, overflowY: "auto", pr: 0.5 }}>
        {market.map((s) => (
          <WatchRow key={s.symbol} s={s} selected={selected} onSelect={onSelect} />
        ))}
      </Stack>
    </Box>
  );
}
