import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Tooltip,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { toast } from "react-toastify";
import api from "../../services/api";
import { getAISignal } from "../../services/tradeService";
import { getState, formatPrice, SYMBOLS, subscribe, isRemoteMode } from "../../services/marketSim";
import { getSettings } from "../../services/settingsStore";

const DECIMALS = { BTCUSD: 0, ETHUSD: 1, EURUSD: 5, GBPUSD: 5, USDJPY: 3, XAUUSD: 2, AAPL: 2, TSLA: 2 };

// Protection levels suggested from saved user preferences —
// computed fresh from the live price each time.
function protectionDefaults(sym, type) {
  const s = getSettings();
  const p = getState(sym).price;
  const dec = DECIMALS[sym] ?? 2;
  const slPct = Number(s.defaultStopLossPct) / 100;
  const tpPct = Number(s.defaultTakeProfitPct) / 100;
  return {
    sl: slPct > 0 ? (type === "BUY" ? p * (1 - slPct) : p * (1 + slPct)).toFixed(dec) : "",
    tp: tpPct > 0 ? (type === "BUY" ? p * (1 + tpPct) : p * (1 - tpPct)).toFixed(dec) : "",
  };
}

export default function OpenTradeDialog({ open, handleClose, onOpened }) {
  const [symbol, setSymbol] = useState("BTCUSD");
  const [tradeType, setTradeType] = useState("BUY");
  const [amount, setAmount] = useState(() => getSettings().defaultStake);
  const [mark, setMark] = useState(getState("BTCUSD").price);
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [aiLevels, setAiLevels] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const decimals = useMemo(() => DECIMALS[symbol] ?? 2, [symbol]);

  // Keep the live mark in sync while the dialog is open
  useEffect(() => {
    if (!open) return undefined;
    setMark(getState(symbol).price);
    const unsub = subscribe(() => setMark(getState(symbol).price));
    return unsub;
  }, [symbol, open]);

  // Fresh ticket on every open — honor the saved default stake
  useEffect(() => {
    if (open) setAmount(getSettings().defaultStake);
  }, [open]);

  // Prefill SL/TP from preferences as instrument/direction changes;
  // the AI autofill can still overwrite these afterwards.
  useEffect(() => {
    setAiLevels(null);
    if (!open) return;
    const { sl, tp } = protectionDefaults(symbol, tradeType);
    setStopLoss(sl);
    setTakeProfit(tp);
  }, [symbol, tradeType, open]);

  async function autofillAI() {
    try {
      setAiLoading(true);
      const sig = await getAISignal(symbol);
      setAiLevels(sig);
      setStopLoss(String(sig.stop_loss));
      setTakeProfit(String(sig.take_profit));
      toast.info(
        `AI suggests ${sig.signal} · confidence ${sig.confidence}% · R:R ${sig.risk_reward_ratio}`
      );
    } catch {
      // Local heuristic fallback when the API is offline
      const p = getState(symbol).price;
      const sl = tradeType === "BUY" ? p * 0.99 : p * 1.01;
      const tp = tradeType === "BUY" ? p * 1.02 : p * 0.98;
      setStopLoss(sl.toFixed(decimals));
      setTakeProfit(tp.toFixed(decimals));
    } finally {
      setAiLoading(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    const payload = {
      symbol,
      trade_type: tradeType,
      amount: Number(amount),
      stop_loss: stopLoss ? Number(stopLoss) : null,
      take_profit: takeProfit ? Number(takeProfit) : null,
    };

    try {
      const { data } = await api.post("/trade/open", payload);
      toast.success(
        `${tradeType} ${symbol} opened @ ${formatPrice(data.trade.entry_price, decimals)} · balance $${data.wallet_balance.toFixed(2)}`
      );
      onOpened?.();
      handleClose();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail) {
        toast.error(detail);
      } else if (isRemoteMode()) {
        toast.error("Failed to open trade — check the API.");
      } else {
        toast.warning("API offline — start the backend to execute real trades.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Open Position</DialogTitle>
      <DialogContent>
        <Stack spacing={2.2} sx={{ mt: 0.5 }}>
          <ToggleButtonGroup
            fullWidth
            exclusive
            value={tradeType}
            onChange={(_, v) => v && setTradeType(v)}
          >
            <ToggleButton
              value="BUY"
              sx={{
                fontWeight: 800,
                "&.Mui-selected": {
                  color: "#022c22",
                  background: "#22d3ee",
                  "&:hover": { background: "#67e8f9" },
                },
              }}
            >
              BUY / LONG
            </ToggleButton>
            <ToggleButton
              value="SELL"
              sx={{
                fontWeight: 800,
                "&.Mui-selected": {
                  color: "#450a0a",
                  background: "#ff5c7a",
                  "&:hover": { background: "#ff8fa5" },
                },
              }}
            >
              SELL / SHORT
            </ToggleButton>
          </ToggleButtonGroup>

          <TextField
            select
            label="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {SYMBOLS.map((s) => (
              <MenuItem key={s.symbol} value={s.symbol}>
                {s.symbol} — {s.name}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" alignItems="center" justifyContent="space-between"
            sx={{ px: 1.4, py: 1, borderRadius: "10px", border: "1px solid rgba(59,130,246,0.25)", background: "rgba(2,6,23,0.5)" }}
          >
            <Typography sx={{ fontSize: "0.72rem", color: "#8ba3cf", fontWeight: 700 }}>
              LIVE MARK PRICE
            </Typography>
            <Typography sx={{ fontFamily: "monospace", fontWeight: 800, color: "#60a5fa" }}>
              {formatPrice(mark, decimals)}
            </Typography>
          </Stack>

          <TextField
            label="Stake (USD)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            helperText="Margin reserved from your wallet. Max automatic loss: 50% of stake."
            inputProps={{ min: 0, step: "any" }}
          />

          <Stack direction="row" spacing={1.4}>
            <TextField
              label="Stop Loss"
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              inputProps={{ step: "any" }}
              fullWidth
            />
            <TextField
              label="Take Profit"
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              inputProps={{ step: "any" }}
              fullWidth
            />
          </Stack>

          <Tooltip title="Ask the AI engine for entry levels (EMA + RSI + MACD analysis)">
            <span>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                onClick={autofillAI}
                disabled={aiLoading}
              >
                {aiLoading ? "Analyzing…" : "Autofill with AI levels"}
              </Button>
            </span>
          </Tooltip>

          {aiLevels && (
            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={`Signal ${aiLevels.signal}`} sx={{ fontWeight: 800, color: "#22d3ee", border: "1px solid rgba(34,211,238,0.4)", background: "rgba(34,211,238,0.08)" }} />
              <Chip size="small" label={`${aiLevels.confidence}% confidence`} sx={{ color: "#93c5fd", border: "1px solid rgba(59,130,246,0.3)" }} />
              <Chip size="small" label={`R:R ${aiLevels.risk_reward_ratio}`} sx={{ color: "#93c5fd", border: "1px solid rgba(59,130,246,0.3)" }} />
            </Stack>
          )}

          <Typography sx={{ fontSize: "0.72rem", color: "#5b6e96" }}>
            Entry executes at the server's live price. The monitor auto-closes
            at SL/TP — day and night.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.4 }}>
        <Button onClick={handleClose} sx={{ color: "#8ba3cf" }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={submit} disabled={submitting || !amount}>
          {submitting ? "Routing…" : `Open ${tradeType}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
