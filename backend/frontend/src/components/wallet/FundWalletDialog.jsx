import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { toast } from "react-toastify";
import { deposit, withdraw } from "../../services/walletService";

const QUICK = [1000, 10000, 50000];

export default function FundWalletDialog({ open, handleClose, balance, onChanged }) {
  const [mode, setMode] = useState("deposit"); // deposit | withdraw
  const [amount, setAmount] = useState("10000");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const value = Number(amount);
    if (!value || value <= 0) return;
    setBusy(true);
    try {
      const fn = mode === "deposit" ? deposit : withdraw;
      const data = await fn(value);
      toast.success(
        `${mode === "deposit" ? "Deposited" : "Withdrew"} $${value.toLocaleString()} — balance now $${Number(data.wallet_balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      );
      onChanged?.();
      handleClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Transaction failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
        <AccountBalanceWalletOutlinedIcon sx={{ color: "#3b82f6" }} />
        Fund Wallet
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.2} sx={{ mt: 0.5 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ px: 0.4 }}>
            <Typography sx={{ fontSize: "0.76rem", color: "#8ba3cf" }}>
              Current balance
            </Typography>
            <Typography sx={{ fontFamily: "monospace", fontWeight: 800, color: "#60a5fa" }}>
              ${Number(balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </Typography>
          </Stack>

          <ToggleButtonGroup
            fullWidth
            exclusive
            value={mode}
            onChange={(_, v) => v && setMode(v)}
          >
            <ToggleButton
              value="deposit"
              sx={{
                fontWeight: 800,
                "&.Mui-selected": { background: "rgba(34,211,238,0.2)", color: "#22d3ee" },
              }}
            >
              DEPOSIT
            </ToggleButton>
            <ToggleButton
              value="withdraw"
              sx={{
                fontWeight: 800,
                "&.Mui-selected": { background: "rgba(255,92,122,0.18)", color: "#ff5c7a" },
              }}
            >
              WITHDRAW
            </ToggleButton>
          </ToggleButtonGroup>

          <TextField
            label="Amount (USD)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 1, step: "any" }}
          />

          <Stack direction="row" spacing={1}>
            {QUICK.map((q) => (
              <Chip
                key={q}
                label={`$${q.toLocaleString()}`}
                onClick={() => setAmount(String(q))}
                sx={{
                  cursor: "pointer",
                  fontWeight: 700,
                  color: "#93c5fd",
                  border: "1px solid rgba(59,130,246,0.35)",
                  background: "rgba(59,130,246,0.08)",
                  "&:hover": { background: "rgba(59,130,246,0.2)" },
                }}
              />
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.4 }}>
        <Button onClick={handleClose} sx={{ color: "#8ba3cf" }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={busy || !Number(amount)}>
          {busy ? "Processing…" : mode === "deposit" ? "Deposit" : "Withdraw"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
