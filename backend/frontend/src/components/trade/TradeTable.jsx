import { useContext } from "react";
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
} from "@mui/material";
import { TradesContext } from "../../contexts/TradesContext";
import { useDemoTrades } from "../../hooks/useMarket";
import { formatPrice } from "../../services/marketSim";

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

/**
 * Open positions. Uses real API trades when the backend is online;
 * otherwise renders the simulated book with live ticking P&L.
 */
export default function TradeTable() {
  const { trades, apiOnline } = useContext(TradesContext);
  const demoTrades = useDemoTrades();

  const rows =
    apiOnline && trades.length
      ? trades.map((t, i) => ({
          id: t.id ?? i,
          symbol: t.symbol,
          type: t.trade_type || t.type || "BUY",
          amount: t.amount,
          entry: t.entry_price,
          current: t.exit_price ?? null,
          pnlGross: t.profit,
        }))
      : demoTrades;

  return (
    <Box className="glass-panel" sx={{ overflow: "hidden" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 2.5, py: 1.8 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1rem" }}>
          Open Positions
        </Typography>
        <Typography
          sx={{
            fontSize: "0.68rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: apiOnline ? "#22d3ee" : "#fbbf24",
          }}
        >
          {apiOnline ? "● API BOOK" : "● SIMULATED BOOK"}
        </Typography>
      </Stack>

      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Side</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell align="right">Entry</TableCell>
              <TableCell align="right">Mark</TableCell>
              <TableCell align="right">Unrealized P&L</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((t) => {
              const decimals = t.symbol?.includes("JPY")
                ? 3
                : t.symbol?.includes("USD") && t.entry < 10
                  ? 5
                  : 2;
              const pnl = t.pnlGross ?? 0;
              const winning = pnl >= 0;
              return (
                <TableRow
                  key={t.id}
                  sx={{ "&:hover": { background: "rgba(37,99,235,0.08)" } }}
                >
                  <TableCell sx={{ fontWeight: 800 }}>{t.symbol}</TableCell>
                  <TableCell>
                    <SideChip side={t.type} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                    {t.amount}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                    {t.entry != null ? formatPrice(t.entry, decimals) : "—"}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontFamily: "monospace", color: "#93c5fd" }}
                  >
                    {t.current != null ? formatPrice(t.current, decimals) : "—"}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      color: winning ? "#22d3ee" : "#ff5c7a",
                    }}
                  >
                    {t.pnlGross == null
                      ? "—"
                      : `${winning ? "+" : ""}$${Math.abs(pnl).toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#5b6e96" }}>
                  No open positions
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
