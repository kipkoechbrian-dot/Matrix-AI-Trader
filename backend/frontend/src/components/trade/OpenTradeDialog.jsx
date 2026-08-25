import { useEffect, useState } from "react";
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
} from "@mui/material";
import { toast } from "react-toastify";
import api from "../../services/api";
import { getState, formatPrice, SYMBOLS } from "../../services/marketSim";
import { subscribe } from "../../services/marketSim";

export default function OpenTradeDialog({ open, handleClose, onOpened }) {
  const [symbol, setSymbol] = useState("BTCUSD");
  const [tradeType, setTradeType] = useState("BUY");
  const [amount, setAmount] = useState("0.5");
  const [entryPrice, setEntryPrice] = useState(getState("BTCUSD").price);
  const [submitting, setSubmitting] = useState(false);

  // Keep the entry price aligned with the live simulated feed
  useEffect(() => {
    if (!open) return undefined;
    setEntryPrice(getState(symbol).price);
    const unsub = subscribe(() => setEntryPrice(getState(symbol).price));
    return unsub;
  }, [symbol, open]);

  async function submit() {
    setSubmitting(true);
    try {
      await api.post("/trade/open", {
        symbol,
        trade_type: tradeType,
        amount: Number(amount),
        entry_price: Number(entryPrice),
      });
      toast.success(`${tradeType} ${amount} ${symbol} opened on the API`);
      onOpened?.();
      handleClose();
    } catch {
      // Backend offline -> simulate the fill so the demo flow continues
      toast.info(
        `Demo fill: ${tradeType} ${amount} ${symbol} @ ${formatPrice(entryPrice, 2)} (API offline)`
      );
      onOpened?.();
      handleClose();
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

          <TextField
            label="Amount / Size"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 0, step: "any" }}
          />

          <TextField
            label="Entry price (live)"
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            inputProps={{ step: "any" }}
          />

          <Typography sx={{ fontSize: "0.72rem", color: "#5b6e96" }}>
            Entry tracks the live feed — fill executes at the API when online,
            simulated otherwise.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.4 }}>
        <Button onClick={handleClose} sx={{ color: "#8ba3cf" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={submitting || !amount}
        >
          {submitting ? "Routing…" : `Open ${tradeType}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
