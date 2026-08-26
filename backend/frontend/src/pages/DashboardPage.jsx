import { useContext, useState } from "react";
import { Box, Button, Stack, Typography, IconButton, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

import AppShell from "../layouts/AppShell";
import PriceChart from "../components/charts/PriceChart";
import EquityCurve from "../components/charts/EquityCurve";
import StatCard from "../components/dashboard/StatCard";
import MarketWatchlist from "../components/dashboard/MarketWatchlist";
import AISignalCard from "../components/dashboard/AISignalCard";
import TradeTable from "../components/trade/TradeTable";
import OpenTradeDialog from "../components/trade/OpenTradeDialog";

import { DashboardContext } from "../contexts/DashboardContext";
import { TradesContext } from "../contexts/TradesContext";
import { useEquity, useSymbol } from "../hooks/useMarket";
import { getEquityValue } from "../services/marketSim";

export default function DashboardPage() {
  const { dashboard, refreshDashboard } = useContext(DashboardContext);
  const { refreshTrades } = useContext(TradesContext);

  const [symbol, setSymbol] = useState("BTCUSD");
  const [openTrade, setOpenTrade] = useState(false);

  const equity = useEquity();
  const active = useSymbol(symbol);
  const equityNow = getEquityValue();

  const stats = [
    {
      label: "Wallet Balance",
      value: dashboard?.wallet_balance ?? equityNow,
      prefix: "$",
      spark: equity.slice(-48).map((p) => p.v),
      accent: "#3b82f6",
      delta: 2.4,
    },
    {
      label: "Equity",
      value: equityNow,
      prefix: "$",
      spark: equity.slice(-48).map((p) => p.v),
      accent: "#22d3ee",
      delta: 1.1,
    },
    {
      label: "Total P&L",
      value: dashboard?.total_profit ?? 1284.32,
      prefix: "+$",
      spark: active.spark,
      accent: "#60a5fa",
      delta: 4.8,
    },
    {
      label: "Win Rate",
      value: dashboard?.win_rate ?? 68.4,
      suffix: "%",
      spark: active.spark,
      accent: "#818cf8",
      delta: 0.6,
    },
  ];

  function refreshAll() {
    refreshDashboard();
    refreshTrades();
  }

  return (
    <AppShell>
      {/* header row */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
        className="anim-fade-up"
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, fontSize: { xs: "1.5rem", md: "2rem" } }}>
            Trading Command Center
          </Typography>
          <Typography sx={{ color: "#8ba3cf", fontSize: "0.9rem", mt: 0.3 }}>
            All systems nominal — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.2} alignItems="center">
          <Tooltip title="Refresh account data">
            <IconButton
              onClick={refreshAll}
              sx={{
                border: "1px solid rgba(59,130,246,0.35)",
                color: "#60a5fa",
                "&:hover": { background: "rgba(37,99,235,0.15)" },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenTrade(true)}
            sx={{ px: 2.6, py: 1.1, fontSize: "0.9rem" }}
          >
            Open Trade
          </Button>
        </Stack>
      </Stack>

      {/* KPI cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          gap: 2.2,
          mb: 2.6,
        }}
      >
        {stats.map((s, i) => (
          <Box key={s.label} sx={{ minWidth: 0 }}>
            <StatCard {...s} delay={i * 80} />
          </Box>
        ))}
      </Box>

      {/* live chart + watchlist */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2.1fr 1fr" },
          gap: 2.2,
          mb: 2.6,
        }}
        className="anim-fade-up"
        style={{ animationDelay: "200ms" }}
      >
        <Box sx={{ minWidth: 0 }}>
          <PriceChart
            symbol={symbol}
            onSymbolChange={setSymbol}
            height={430}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <MarketWatchlist selected={symbol} onSelect={setSymbol} />
        </Box>
      </Box>

      {/* AI signal + equity curve */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1.6fr" },
          gap: 2.2,
          mb: 2.6,
        }}
        className="anim-fade-up"
        style={{ animationDelay: "300ms" }}
      >
        <Box sx={{ minWidth: 0 }}>
          <AISignalCard symbol={symbol} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <EquityCurve height={240} />
        </Box>
      </Box>

      {/* open positions */}
      <Box className="anim-fade-up" style={{ animationDelay: "400ms" }}>
        <TradeTable />
      </Box>

      <OpenTradeDialog
        open={openTrade}
        handleClose={() => setOpenTrade(false)}
        onOpened={refreshAll}
      />
    </AppShell>
  );
}
