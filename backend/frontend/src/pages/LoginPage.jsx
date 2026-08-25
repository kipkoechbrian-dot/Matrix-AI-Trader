import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";
import { AuthContext } from "../contexts/AuthContext";
import Logo from "../components/brand/Logo";
import TickerTape from "../components/dashboard/TickerTape";
import PriceChart from "../components/charts/PriceChart";

const FEATURES = [
  { icon: <AutoGraphIcon />, text: "Realtime multi-asset charting engine" },
  { icon: <PsychologyIcon />, text: "AI trade signals — EMA / RSI intelligence" },
  { icon: <SpeedIcon />, text: "Live portfolio analytics & P&L streaming" },
  { icon: <SecurityIcon />, text: "Risk engine with position sizing guardrails" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, loginDemo, user } = useContext(AuthContext);

  const [mode, setMode] = useState("signin"); // signin | register
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        detail ||
          "Couldn't reach the trading API. Use the demo tour to explore the terminal."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!username.trim()) {
      setError("Pick a username first.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await register(username.trim(), email, password);
      navigate("/dashboard");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Registration failed — is the API running?"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDemo() {
    loginDemo();
    navigate("/dashboard");
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* top brand bar */}
      <Box
        sx={{
          px: { xs: 2.5, md: 5 },
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Logo size={36} />
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 800,
            letterSpacing: "0.2em",
            color: "#22d3ee",
            animation: "pulseDot 2.4s infinite",
          }}
        >
          ● MARKETS LIVE
        </Typography>
      </Box>

      <TickerTape />

      {/* hero */}
      <Box
        sx={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.35fr 1fr" },
          gap: { xs: 3, lg: 5 },
          alignItems: "center",
          px: { xs: 2.5, md: 5 },
          py: { xs: 3, md: 4 },
          maxWidth: 1560,
          mx: "auto",
          width: "100%",
        }}
      >
        {/* left — brand + live chart showcase */}
        <Box className="anim-fade-up">
          <Typography
            sx={{
              display: "inline-block",
              px: 1.6,
              py: 0.5,
              mb: 2,
              borderRadius: "999px",
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              color: "#93c5fd",
              border: "1px solid rgba(59,130,246,0.4)",
              background: "rgba(37,99,235,0.1)",
            }}
          >
            INTELLIGENT TRADING TERMINAL
          </Typography>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              fontSize: { xs: "2.1rem", md: "3rem" },
              background:
                "linear-gradient(120deg, #f0f6ff 20%, #60a5fa 60%, #22d3ee 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Trade the future with machine intelligence.
          </Typography>

          <Typography
            sx={{ mt: 1.6, color: "#8ba3cf", maxWidth: 560, fontSize: "1rem" }}
          >
            Matrix AI Trader scans live markets, scores every setup with its AI
            signal engine, and streams your portfolio performance in real time —
            all inside one electric-blue command center.
          </Typography>

          <Box sx={{ mt: 3, maxWidth: 640 }}>
            <PriceChart symbol="BTCUSD" compact height={300} />
          </Box>

          <Stack
            direction="row"
            flexWrap="wrap"
            useFlexGap
            spacing={{ xs: 1.5, md: 3 }}
            sx={{ mt: 3 }}
          >
            {FEATURES.map((f) => (
              <Stack key={f.text} direction="row" spacing={1} alignItems="center">
                <Box sx={{ color: "#3b82f6", display: "flex" }}>{f.icon}</Box>
                <Typography sx={{ fontSize: "0.8rem", color: "#b6c8ea" }}>
                  {f.text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* right — auth card */}
        <Box
          className="glass-panel anim-fade-up"
          sx={{
            p: { xs: 3, md: 4.5 },
            animationDelay: "120ms",
            maxWidth: 440,
            width: "100%",
            mx: "auto",
            position: "relative",
            overflow: "hidden",
          }}
        >
            <Box
              className="blueprint-grid"
              sx={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none" }}
            />
            <Box sx={{ position: "relative" }}>
              {/* mode toggle */}
              <Stack
                direction="row"
                sx={{
                  mb: 2.5,
                  p: 0.4,
                  borderRadius: "10px",
                  background: "rgba(2,6,23,0.6)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                {[
                  ["signin", "Sign In"],
                  ["register", "Create Account"],
                ].map(([key, label]) => (
                  <Box
                    key={key}
                    onClick={() => {
                      setMode(key);
                      setError("");
                    }}
                    sx={{
                      flex: 1,
                      textAlign: "center",
                      py: 0.9,
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                      color: mode === key ? "#fff" : "#8ba3cf",
                      background:
                        mode === key
                          ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
                          : "transparent",
                      transition: "all 0.18s ease",
                    }}
                  >
                    {label}
                  </Box>
                ))}
              </Stack>

              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {mode === "signin" ? "Welcome back" : "Open your account"}
              </Typography>
              <Typography sx={{ color: "#8ba3cf", fontSize: "0.88rem", mt: 0.4, mb: 3 }}>
                {mode === "signin"
                  ? "Sign in to your terminal — or take the guided demo."
                  : "A wallet is created automatically — fund it and start trading."}
              </Typography>

              {error && (
                <Alert
                  severity="warning"
                  sx={{
                    mb: 2,
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.35)",
                    color: "#fcd34d",
                  }}
                >
                  {error}
                </Alert>
              )}

              <form onSubmit={mode === "signin" ? handleLogin : handleRegister}>
                {mode === "register" && (
                  <TextField
                    fullWidth
                    label="Username"
                    margin="normal"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                )}
                <TextField
                  fullWidth
                  label="Email"
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2.5, py: 1.4, fontSize: "0.95rem" }}
                >
                  {loading
                    ? "Connecting…"
                    : mode === "signin"
                      ? "Sign in to Terminal"
                      : "Create Account & Fund Wallet"}
                </Button>
              </form>

              <Divider sx={{ my: 3, borderColor: "rgba(59,130,246,0.18)" }}>
                <Typography sx={{ fontSize: "0.7rem", color: "#5b6e96", px: 1 }}>
                  NO ACCOUNT NEEDED
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<RocketLaunchIcon />}
                onClick={handleDemo}
                sx={{
                  py: 1.4,
                  fontSize: "0.95rem",
                  borderWidth: 2,
                  "&:hover": { borderWidth: 2 },
                }}
              >
                Explore the Live Demo
              </Button>

              <Typography
                sx={{
                  mt: 2.5,
                  textAlign: "center",
                  fontSize: "0.72rem",
                  color: "#5b6e96",
                }}
              >
                Demo mode uses the built-in simulated market feed.
              </Typography>
            </Box>
          </Box>
        </Box>
    </Box>
  );
}
