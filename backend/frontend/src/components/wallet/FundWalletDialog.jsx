import { useEffect, useRef, useState } from "react";
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
  Box,
  CircularProgress,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { toast } from "react-toastify";
import api from "../../services/api";
import { withdraw } from "../../services/walletService";

const QUICK = [500, 1000, 10000];
const KES_PER_USD = 129;

export default function FundWalletDialog({ open, handleClose, balance, onChanged, userEmail }) {
  const [tab, setTab] = useState("deposit"); // deposit | withdraw
  const [method, setMethod] = useState("MPESA"); // MPESA | CARD
  const [amount, setAmount] = useState("1000");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // pending payment tracking
  const [pending, setPending] = useState(null); // { id, message }
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const poller = useRef(null);

  // Poll a PENDING payment until it settles
  useEffect(() => {
    if (!pending?.id) return undefined;
    poller.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/${pending.id}`);
        if (data.status === "COMPLETED") {
          clearInterval(poller.current);
          setDone(true);
          onChanged?.();
        } else if (data.status === "FAILED") {
          clearInterval(poller.current);
          setPending(null);
          toast.error(data.failure_reason || "Payment failed — no money moved.");
          onChanged?.();
        }
      } catch {
        /* keep polling */
      }
    }, 2000);
    return () => clearInterval(poller.current);
  }, [pending?.id, onChanged]);

  function resetFlow() {
    setPending(null);
    setDone(false);
    setBusy(false);
  }

  function close() {
    clearInterval(poller.current);
    resetFlow();
    handleClose();
  }

  async function submitDeposit() {
    setBusy(true);
    try {
      const payload =
        method === "MPESA"
          ? { method, amount: Number(amount), phone }
          : {
              method,
              amount: Number(amount),
              card_number: cardNumber,
              card_expiry: cardExpiry,
              card_cvc: cardCvc,
            };

      const { data } = await api.post("/payments/deposit", payload);
      setPending({ id: data.payment.id, message: data.message });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Payment initiation failed.");
      setBusy(false);
    }
  }

  async function submitWithdraw() {
    setBusy(true);
    try {
      const data = await withdraw(Number(amount));
      toast.success(`Withdrew $${Number(amount).toLocaleString()} — balance $${data.wallet_balance.toFixed(2)}`);
      onChanged?.();
      close();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Withdrawal failed.");
      setBusy(false);
    }
  }

  const kesEstimate = method === "MPESA" && Number(amount) > 0
    ? `≈ KSh ${(Number(amount) * KES_PER_USD).toLocaleString()} charged to your phone`
    : null;

  /* ---------- settled state ---------- */
  if (done) {
    return (
      <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
        <DialogContent>
          <Stack alignItems="center" spacing={2} sx={{ py: 3, textAlign: "center" }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: "#22d3ee", filter: "drop-shadow(0 0 18px rgba(34,211,238,0.6))" }} />
            <Typography variant="h6" fontWeight={800}>
              Deposit settled
            </Typography>
            <Typography sx={{ color: "#8ba3cf", fontSize: "0.9rem" }}>
              ${Number(amount).toLocaleString()} is now in your wallet and ready to trade.
            </Typography>
            <Chip
              icon={<MarkEmailReadOutlinedIcon sx={{ fontSize: 16 }} />}
              label={`Receipt emailed to ${userEmail || "your inbox"}`}
              sx={{ color: "#93c5fd", border: "1px solid rgba(59,130,246,0.4)", background: "rgba(37,99,235,0.1)" }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4, justifyContent: "center" }}>
          <Button variant="contained" onClick={close}>Back to Terminal</Button>
        </DialogActions>
      </Dialog>
    );
  }

  /* ---------- pending state ---------- */
  if (pending) {
    return (
      <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
        <DialogContent>
          <Stack alignItems="center" spacing={2.2} sx={{ py: 3, textAlign: "center" }}>
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress size={64} thickness={3} sx={{ color: "#3b82f6" }} />
              <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {method === "MPESA" ? <PhoneIphoneIcon sx={{ color: "#22d3ee" }} /> : <CreditCardIcon sx={{ color: "#22d3ee" }} />}
              </Box>
            </Box>
            <Typography variant="h6" fontWeight={800}>
              {method === "MPESA" ? "Check your phone 📲" : "Authorizing…"}
            </Typography>
            <Typography sx={{ color: "#8ba3cf", fontSize: "0.88rem", maxWidth: 300 }}>
              {pending.message}
              {method === "MPESA" && " Enter your M-Pesa PIN to approve the payment."}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: "#5b6e96", letterSpacing: "0.1em", animation: "pulseDot 1.6s infinite" }}>
              ● WAITING FOR SETTLEMENT
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  /* ---------- entry form ---------- */
  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
        <AccountBalanceWalletOutlinedIcon sx={{ color: "#3b82f6" }} />
        Fund Wallet
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.2} sx={{ mt: 0.5 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ px: 0.4 }}>
            <Typography sx={{ fontSize: "0.76rem", color: "#8ba3cf" }}>Current balance</Typography>
            <Typography sx={{ fontFamily: "monospace", fontWeight: 800, color: "#60a5fa" }}>
              ${Number(balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </Typography>
          </Stack>

          <ToggleButtonGroup fullWidth exclusive value={tab} onChange={(_, v) => v && setTab(v)}>
            <ToggleButton value="deposit" sx={{ fontWeight: 800, "&.Mui-selected": { background: "rgba(34,211,238,0.2)", color: "#22d3ee" } }}>
              DEPOSIT
            </ToggleButton>
            <ToggleButton value="withdraw" sx={{ fontWeight: 800, "&.Mui-selected": { background: "rgba(255,92,122,0.18)", color: "#ff5c7a" } }}>
              WITHDRAW
            </ToggleButton>
          </ToggleButtonGroup>

          {tab === "deposit" && (
            <ToggleButtonGroup fullWidth exclusive value={method} onChange={(_, v) => v && setMethod(v)}>
              <ToggleButton value="MPESA" sx={{ fontWeight: 800, gap: 0.8 }}>
                <PhoneIphoneIcon sx={{ fontSize: 18 }} /> M-PESA
              </ToggleButton>
              <ToggleButton value="CARD" sx={{ fontWeight: 800, gap: 0.8 }}>
                <CreditCardIcon sx={{ fontSize: 18 }} /> CARD
              </ToggleButton>
            </ToggleButtonGroup>
          )}

          <TextField
            label="Amount (USD)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            helperText={tab === "deposit" ? kesEstimate : "Paid back to your funding source"}
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

          {tab === "deposit" && method === "MPESA" && (
            <TextField
              label="Safaricom phone number"
              placeholder="0712 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              helperText="You'll receive an STK push to approve with your PIN"
            />
          )}

          {tab === "deposit" && method === "CARD" && (
            <Stack spacing={1.6}>
              <TextField
                label="Card number"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
              <Stack direction="row" spacing={1.4}>
                <TextField label="Expiry (MM/YY)" placeholder="12/28" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} fullWidth />
                <TextField label="CVC" placeholder="123" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} fullWidth />
              </Stack>
              <Typography sx={{ fontSize: "0.68rem", color: "#5b6e96" }}>
                Test gateway — use 4242 4242 4242 4242. Full numbers are never stored.
              </Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.4 }}>
        <Button onClick={close} sx={{ color: "#8ba3cf" }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={tab === "deposit" ? submitDeposit : submitWithdraw}
          disabled={busy || !Number(amount) || (tab === "deposit" && method === "MPESA" && !phone)}
          startIcon={tab === "deposit" && method === "MPESA" ? <PhoneIphoneIcon /> : null}
        >
          {busy
            ? "Processing…"
            : tab === "deposit"
              ? method === "MPESA"
                ? `Send STK Push ($${Number(amount).toLocaleString()})`
                : `Pay $${Number(amount).toLocaleString()}`
              : "Withdraw"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
