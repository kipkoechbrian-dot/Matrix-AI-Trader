import { useContext, useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useNavigate } from "react-router-dom";
import Logo from "../components/brand/Logo";
import TickerTape from "../components/dashboard/TickerTape";
import { AuthContext } from "../contexts/AuthContext";
import { getEquityValue } from "../services/marketSim";

const NAV_ITEMS = ["Dashboard", "Markets", "Portfolio", "Signals", "Analytics"];

export default function AppShell({ children }) {
  const { user, logout, demoMode } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const [active, setActive] = useState("Dashboard");

  function handleLogout() {
    setAnchor(null);
    logout();
    navigate("/");
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "rgba(2, 6, 23, 0.82)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(59,130,246,0.16)",
        }}
      >
        <Toolbar sx={{ gap: 3, minHeight: { xs: 62, md: 68 } }}>
          <Logo size={34} />

          <Stack
            direction="row"
            spacing={0.5}
            sx={{ display: { xs: "none", lg: "flex" }, ml: 2 }}
          >
            {NAV_ITEMS.map((item) => (
              <Box
                key={item}
                onClick={() => setActive(item)}
                sx={{
                  px: 1.6,
                  py: 0.7,
                  borderRadius: "9px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  color: active === item ? "#fff" : "#8ba3cf",
                  background:
                    active === item ? "rgba(37,99,235,0.35)" : "transparent",
                  "&:hover": { color: "#e6efff", background: "rgba(37,99,235,0.18)" },
                  transition: "all 0.18s ease",
                }}
              >
                {item}
              </Box>
            ))}
          </Stack>

          <Box sx={{ flex: 1 }} />

          <Chip
            label={demoMode ? "SIMULATED FEED" : "LIVE API"}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: "0.64rem",
              letterSpacing: "0.14em",
              color: "#22d3ee",
              border: "1px solid rgba(34,211,238,0.45)",
              background: "rgba(34,211,238,0.07)",
              animation: "pulseDot 2.2s infinite",
              display: { xs: "none", sm: "flex" },
            }}
          />

          <Chip
            label={`$${getEquityValue().toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            size="small"
            sx={{
              fontFamily: "monospace",
              fontWeight: 800,
              color: "#e6efff",
              border: "1px solid rgba(59,130,246,0.4)",
              background: "rgba(37,99,235,0.14)",
              display: { xs: "none", md: "flex" },
            }}
          />

          <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ p: 0.4 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                fontWeight: 800,
                fontSize: "0.9rem",
                background: "linear-gradient(135deg,#2563eb,#0ea5e9)",
                border: "2px solid rgba(96,165,250,0.6)",
              }}
            >
              {(user?.email || "T")[0].toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchor}
            open={Boolean(anchor)}
            onClose={() => setAnchor(null)}
            PaperProps={{
              sx: {
                mt: 1.2,
                background: "#0a142e",
                border: "1px solid rgba(59,130,246,0.28)",
                minWidth: 200,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography sx={{ fontSize: "0.78rem", color: "#8ba3cf" }}>
                Signed in as
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>
                {user?.email || "demo@matrixai.trade"}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: "rgba(59,130,246,0.14)" }} />
            <MenuItem sx={{ gap: 1.2, fontSize: "0.85rem" }}>
              <PersonOutlineIcon fontSize="small" /> Profile
            </MenuItem>
            <MenuItem sx={{ gap: 1.2, fontSize: "0.85rem" }}>
              <SettingsOutlinedIcon fontSize="small" /> Settings
            </MenuItem>
            <Divider sx={{ borderColor: "rgba(59,130,246,0.14)" }} />
            <MenuItem onClick={handleLogout} sx={{ gap: 1.2, fontSize: "0.85rem", color: "#ff8fa5" }}>
              <LogoutIcon fontSize="small" /> Log out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <TickerTape />

      <Box
        component="main"
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: 1560,
          mx: "auto",
          px: { xs: 2, md: 3.5 },
          py: { xs: 2.5, md: 3.5 },
        }}
      >
        {children}
      </Box>

      <Box
        component="footer"
        sx={{
          py: 2.2,
          textAlign: "center",
          borderTop: "1px solid rgba(59,130,246,0.12)",
        }}
      >
        <Typography sx={{ fontSize: "0.72rem", color: "#5b6e96" }}>
          Matrix AI Trader — Intelligent trading terminal · Market data simulated
          for demonstration
        </Typography>
      </Box>
    </Box>
  );
}
