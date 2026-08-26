import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import LogoutIcon from "@mui/icons-material/Logout";

function StatTile({ icon, label, value, color = "#e6efff" }) {
  return (
    <Box
      sx={{
        p: 1.6,
        borderRadius: "12px",
        border: "1px solid rgba(59,130,246,0.25)",
        background: "rgba(2,6,23,0.5)",
        display: "flex",
        alignItems: "center",
        gap: 1.4,
      }}
    >
      <Box sx={{ color: "#22d3ee", display: "flex" }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontSize: "0.62rem", color: "#5b6e96", fontWeight: 800, letterSpacing: "0.1em" }}>
          {label}
        </Typography>
        <Typography sx={{ fontFamily: "monospace", fontWeight: 900, fontSize: "1.02rem", color }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Account profile — identity + live trading stats pulled from the
 * dashboard stream (falls back to the demo snapshot when offline).
 */
export default function ProfileDialog({ open, handleClose, user, dashboard, onFund, onLogout }) {
  const email = user?.email || "trader@matrixai.trade";
  const name = user?.name || email.split("@")[0];
  const profit = Number(dashboard?.total_profit ?? 0);
  const profitColor = profit >= 0 ? "#22d3ee" : "#ff5c7a";

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogContent sx={{ pt: 4 }}>
        <Stack alignItems="center" spacing={0.6}>
          <Avatar
            sx={{
              width: 76,
              height: 76,
              fontSize: "1.9rem",
              fontWeight: 900,
              background: "linear-gradient(135deg,#2563eb,#0ea5e9)",
              border: "3px solid rgba(96,165,250,0.55)",
              boxShadow: "0 10px 34px rgba(37,99,235,0.5)",
            }}
          >
            {email[0].toUpperCase()}
          </Avatar>
          <Typography sx={{ fontWeight: 900, fontSize: "1.2rem", mt: 1.2 }}>
            {name}
          </Typography>
          <Typography sx={{ color: "#8ba3cf", fontSize: "0.82rem" }}>{email}</Typography>
          <Chip
            size="small"
            label={user?.demo ? "GUIDED DEMO" : "PAPER-TRADING ACCOUNT"}
            sx={{
              mt: 0.6,
              fontWeight: 800,
              fontSize: "0.62rem",
              letterSpacing: "0.12em",
              color: "#93c5fd",
              border: "1px solid rgba(59,130,246,0.4)",
              background: "rgba(37,99,235,0.12)",
            }}
          />
        </Stack>

        <Box
          sx={{
            mt: 3,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1.4,
          }}
        >
          <StatTile
            icon={<AccountBalanceWalletOutlinedIcon />}
            label="WALLET BALANCE"
            value={`$${Number(dashboard?.wallet_balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <StatTile
            icon={profit >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label="TOTAL P&L"
            value={`${profit >= 0 ? "+" : "-"}$${Math.abs(profit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color={profitColor}
          />
          <StatTile
            icon={<QueryStatsIcon />}
            label="WIN RATE"
            value={`${Number(dashboard?.win_rate ?? 0).toFixed(1)}%`}
          />
          <StatTile
            icon={<ShowChartIcon />}
            label="OPEN TRADES"
            value={String(dashboard?.open_trades ?? 0)}
          />
        </Box>

        <Typography sx={{ mt: 1.8, textAlign: "center", fontSize: "0.68rem", color: "#5b6e96" }}>
          {dashboard?.fallback
            ? "Demo snapshot — sign in to stream your live account figures."
            : "Live account figures · refreshed every 5 seconds."}
        </Typography>

        <Divider sx={{ my: 2.2, borderColor: "rgba(59,130,246,0.16)" }} />

        <Stack spacing={1.2}>
          {onFund && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<AccountBalanceWalletOutlinedIcon />}
              onClick={onFund}
            >
              Fund wallet
            </Button>
          )}
          <Button
            fullWidth
            variant="text"
            startIcon={<LogoutIcon />}
            onClick={onLogout}
            sx={{ color: "#ff8fa5" }}
          >
            Log out
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
