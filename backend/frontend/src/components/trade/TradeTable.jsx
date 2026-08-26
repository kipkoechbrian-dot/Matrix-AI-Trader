import { useContext, useState } from "react";
import {
  Box,
  Chip,
  Stack,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@mui/material";
import { toast } from "react-toastify";
import { TradesContext } from "../../contexts/TradesContext";
import { DashboardContext } from "../../contexts/DashboardContext";
import { useDemoTrades, useSymbol } from "../../hooks/useMarket";
import { formatPrice } from "../../services/marketSim";
import { closeTrade } from "../../services/tradeService";
import { getSettings } from "../../services/settingsStore";

const DECIMALS = { BTCUSD: 0, ETHUSD: 1, EURUSD: 5, GBPUSD: 5, USDJPY: 3, XAUUSD: 2, AAPL: 2, TSLA: 2 };

function SideChip({ side }) {
  const buy = side === "BUY";
  return (
    <Chip
      size="small"
      label={side}
      sx={{
        fontWeight: 800,
        fontSize: "0.68rem",
        letterSpacing: "0.08em",
        color: buy ? "#22d3ee" : "#ff5c7a",
        background: buy ? "rgba(34,211,238,0.1)" : "rgba(255,92,122,0.1)",
        border: `1px solid ${buy ? "rgba(34,211,238,0.4)" : "rgba(255,92,122,0.4)"}`,
      }}
    />
  );
}

function ReasonChip({ reason }) {
  const map = {
    STOP_LOSS: { label: "Stop Loss", color: "#ff5c7a" },
    TAKE_PROFIT: { label: "Take Profit", color: "#22d3ee" },
    LIQUIDATION: { label: "Liquidated", color: "#fbbf24" },
    MANUAL: { label: "Manual", color: "#8ba3cf" },
  };
  const m = map[reason] || { label: reason || "—", color: "#8ba3cf" };
  return (
    <Chip
      size="small"
      label={m.label}
      sx={{
        fontSize: "0.64rem",
        fontWeight: 700,
        color: m.color,
        border: `1px solid ${m.color}55`,
        background: `${m.color}14`,
      }}
    />
  );
}

/** One open API position — live mark + close action. */
function ApiOpenRow({ trade: t, onClosed }) {
  const live = useSymbol(t.symbol);
  const [closing, setClosing] = useState(false);

  const decimals = DECIMALS[t.symbol] ?? 2;
  const mark = live.price;
  const dir = t.trade_type === "BUY" ? 1 : -1;
  const pnl = ((mark - t.entry_price) / t.entry_price) * t.amount * dir;
  const winning = pnl >= 0;

  async function handleClose() {
    if (getSettings().confirmClose) {
      const ok = window.confirm(
        `Close this ${t.symbol} ${t.trade_type} position now?\n` +
          `Estimated result: ${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`
      );
      if (!ok) return;
    }
    setClosing(true);
    try {
      await closeTrade(t.id, mark);
      toast[pnl >= 0 ? "success" : "error"](
        `${t.symbol} closed manually for ${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`
      );
      onClosed();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to close trade.");
      setClosing(false);
    }
  }

  return (
    <TableRow sx={{ "&:hover": { background: "rgba(37,99,235,0.08)" } }}>
      <TableCell sx={{ fontWeight: 800 }}>{t.symbol}</TableCell>
      <TableCell><SideChip side={t.trade_type} /></TableCell>
      <TableCell align="right" sx={{ fontFamily: "monospace" }}>${t.amount}</TableCell>
      <TableCell align="right" sx={{ fontFamily: "monospace" }}>
        {formatPrice(t.entry_price, decimals)}
      </TableCell>
      <TableCell align="right" sx={{ fontFamily: "monospace", color: "#93c5fd" }}>
        {formatPrice(mark, decimals)}
      </TableCell>
      <TableCell align="right">
        <Stack spacing={0.3} alignItems="flex-end">
          {t.stop_loss && (
            <Typography sx={{ fontSize: "0.66rem", color: "#ff8fa5", fontFamily: "monospace" }}>
              SL {formatPrice(t.stop_loss, decimals)}
            </Typography>
          )}
          {t.take_profit && (
            <Typography sx={{ fontSize: "0.66rem", color: "#67e8f9", fontFamily: "monospace" }}>
              TP {formatPrice(t.take_profit, decimals)}
            </Typography>
          )}
        </Stack>
      </TableCell>
      <TableCell
        align="right"
        sx={{ fontFamily: "monospace", fontWeight: 800, color: winning ? "#22d3ee" : "#ff5c7a" }}
      >
        {winning ? "+" : "-"}${Math.abs(pnl).toFixed(2)}
      </TableCell>
      <TableCell align="right">
        <Button
          size="small"
          variant="outlined"
          disabled={closing}
          onClick={handleClose}
          sx={{ fontSize: "0.7rem", py: 0.2, minWidth: 72 }}
        >
          {closing ? "…" : "Close"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

/** Simulated-book row (offline demo). */
function DemoRow({ t }) {
  const winning = (t.pnlGross ?? 0) >= 0;
  return (
    <TableRow sx={{ "&:hover": { background: "rgba(37,99,235,0.08)" } }}>
      <TableCell sx={{ fontWeight: 800 }}>{t.symbol}</TableCell>
      <TableCell><SideChip side={t.type} /></TableCell>
      <TableCell align="right" sx={{ fontFamily: "monospace" }}>{t.amount}</TableCell>
      <TableCell align="right" sx={{ fontFamily: "monospace" }}>{formatPrice(t.entry, 2)}</TableCell>
      <TableCell align="right" sx={{ fontFamily: "monospace", color: "#93c5fd" }}>{formatPrice(t.current, 2)}</TableCell>
      <TableCell align="right">—</TableCell>
      <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 800, color: winning ? "#22d3ee" : "#ff5c7a" }}>
        {winning ? "+" : "-"}${Math.abs(t.pnlGross).toFixed(2)}
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

/**
 * Positions ledger. Uses the real API book when the backend is online
 * (with live marks and one-click close); simulated book otherwise.
 */
export default function TradeTable() {
  const { trades, apiOnline, refreshTrades } = useContext(TradesContext);
  const { refreshDashboard } = useContext(DashboardContext);
  const demoTrades = useDemoTrades();

  const usingApi = apiOnline && localStorage.getItem("token");
  const openApi = trades.filter((t) => t.status === "OPEN");
  const closedApi = trades.filter((t) => t.status === "CLOSED");

  function afterChange() {
    refreshTrades();
    refreshDashboard();
  }

  return (
    <Box className="glass-panel" sx={{ overflow: "hidden" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 1.8 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1rem" }}>
          Positions
        </Typography>
        <Typography
          sx={{
            fontSize: "0.68rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: usingApi ? "#22d3ee" : "#fbbf24",
          }}
        >
          {usingApi ? "● API BOOK" : "● SIMULATED BOOK"}
        </Typography>
      </Stack>

      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Side</TableCell>
              <TableCell align="right">Stake</TableCell>
              <TableCell align="right">Entry</TableCell>
              <TableCell align="right">Mark</TableCell>
              <TableCell align="right">SL / TP</TableCell>
              <TableCell align="right">Floating P&L</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {usingApi && openApi.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3.4, color: "#5b6e96" }}>
                  No open positions — press <b>Open Trade</b> to enter the market
                </TableCell>
              </TableRow>
            )}
            {usingApi
              ? openApi.map((t) => <ApiOpenRow key={t.id} trade={t} onClosed={afterChange} />)
              : demoTrades.map((t) => <DemoRow key={t.id} t={t} />)}
          </TableBody>
        </Table>
      </Box>

      {usingApi && closedApi.length > 0 && (
        <>
          <Typography sx={{ px: 2.5, pt: 1.5, pb: 0.5, fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.14em", color: "#5b6e96" }}>
            CLOSED TODAY
          </Typography>
          <Box sx={{ overflowX: "auto", maxHeight: 220, overflowY: "auto" }}>
            <Table size="small">
              <TableBody>
                {closedApi.slice(0, 15).map((t) => (
                  <TableRow key={t.id} sx={{ "&:hover": { background: "rgba(37,99,235,0.06)" } }}>
                    <TableCell sx={{ fontWeight: 700 }}>{t.symbol}</TableCell>
                    <TableCell><SideChip side={t.trade_type} /></TableCell>
                    <TableCell align="right" sx={{ fontFamily: "monospace" }}>${t.amount}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: "monospace", color: "#8ba3cf" }}>
                      {formatPrice(t.entry_price, DECIMALS[t.symbol] ?? 2)} → {formatPrice(t.exit_price ?? 0, DECIMALS[t.symbol] ?? 2)}
                    </TableCell>
                    <TableCell align="right"><ReasonChip reason={t.close_reason} /></TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontFamily: "monospace", fontWeight: 800, color: t.profit >= 0 ? "#22d3ee" : "#ff5c7a" }}
                    >
                      {t.profit >= 0 ? "+" : "-"}${Math.abs(t.profit).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Box>
  );
}
