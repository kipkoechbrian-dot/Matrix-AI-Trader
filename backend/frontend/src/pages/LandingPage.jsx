import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PsychologyIcon from "@mui/icons-material/Psychology";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import MailOutlineIcon from "@mui/icons-material/MailOutlineOutlined";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import BoltIcon from "@mui/icons-material/Bolt";

import Logo from "../components/brand/Logo";
import TickerTape from "../components/dashboard/TickerTape";
import PriceChart from "../components/charts/PriceChart";
import { AuthContext } from "../contexts/AuthContext";
import { useMarket } from "../hooks/useMarket";
import { formatPrice } from "../services/marketSim";

/* ------------------------------------------------------------------ */
/* animated counter                                                    */
/* ------------------------------------------------------------------ */
function Counter({ to, suffix = "", decimals = 0, duration = 1400 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf;
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      setV(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <>
      {v.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* floating notification card used in the hero                         */
/* ------------------------------------------------------------------ */
function FloatCard({ icon, title, sub, sx, delay = 0 }) {
  return (
    <Box
      className="glass-panel"
      sx={{
        position: "absolute",
        px: 1.6,
        py: 1.1,
        display: "flex",
        alignItems: "center",
        gap: 1.1,
        borderRadius: "14px",
        animation: `floaty 5.5s ease-in-out ${delay}s infinite`,
        zIndex: 3,
        ...sx,
      }}
    >
      <Box sx={{ color: "#22d3ee", display: "flex" }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#e6efff" }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: "0.66rem", color: "#8ba3cf" }}>{sub}</Typography>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* landing sections                                                    */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: <PsychologyIcon />,
    title: "AI Signal Engine",
    text: "EMA cross, RSI and MACD confluence score every setup — each call arrives with confidence, entry, stop loss and risk:reward.",
  },
  {
    icon: <ShieldOutlinedIcon />,
    title: "Auto SL / TP Guardian",
    text: "A 5-second monitor watches every open position. Stop loss caps damage, take profit locks wins, liquidation protects the wallet.",
  },
  {
    icon: <PhoneIphoneIcon />,
    title: "M-Pesa & Card Deposits",
    text: "Fund the wallet with an STK push on your Safaricom line or any card. KES conversion, pending states, settlement callbacks.",
  },
  {
    icon: <MailOutlineIcon />,
    title: "Email Receipts",
    text: "Every deposit lands a branded receipt in your inbox — amount, method, reference and new balance, instantly.",
  },
  {
    icon: <ShowChartIcon />,
    title: "Institutional Charting",
    text: "TradingView-grade candlesticks with volume, symbol switching and live repaints — the terminal feels like a bank desk.",
  },
  {
    icon: <QueryStatsIcon />,
    title: "Portfolio Analytics",
    text: "Win rate, equity curve, floating P&L and a full trade journal — every number streams as the market moves.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create your account",
    text: "JWT-secured sign up spins up a personal trading wallet automatically.",
  },
  {
    n: "02",
    title: "Fund via M-Pesa or card",
    text: "One STK push — approve with your PIN — and the balance credits in seconds with an email receipt.",
  },
  {
    n: "03",
    title: "Trade with the AI",
    text: "Follow the signal engine, set your exits, and let the guardian monitor close winners and cut losers.",
  },
];

const STACK = [
  "React 19", "Vite", "MUI", "lightweight-charts", "Recharts",
  "FastAPI", "SQLAlchemy 2", "PostgreSQL", "SQLite dev mode",
  "JWT Auth", "pandas", "Safaricom Daraja", "Stripe", "TwelveData",
  "Docker-ready",
];

function LandingNav() {
  const navigate = useNavigate();
  const { user, loginDemo } = useContext(AuthContext);

  function launch() {
    if (!user) loginDemo();
    navigate("/dashboard");
  }

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "blur(16px)",
        background: "rgba(2,6,23,0.7)",
        borderBottom: "1px solid rgba(59,130,246,0.16)",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ maxWidth: 1420, mx: "auto", px: { xs: 2, md: 4 }, py: 1.6 }}
      >
        <Logo size={32} />
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" } }}>
          {[
            ["Features", "#features"],
            ["How it works", "#how"],
            ["Technology", "#stack"],
          ].map(([label, href]) => (
            <Box
              key={label}
              component="a"
              href={href}
              sx={{
                color: "#8ba3cf",
                fontSize: "0.86rem",
                fontWeight: 700,
                textDecoration: "none",
                "&:hover": { color: "#e6efff" },
              }}
            >
              {label}
            </Box>
          ))}
        </Stack>
        <Button
          variant="text"
          onClick={() => navigate("/login")}
          sx={{ color: "#93c5fd", fontWeight: 800 }}
        >
          Sign in
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={launch}
          sx={{ px: 2.2 }}
        >
          Launch Terminal
        </Button>
      </Stack>
    </Box>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  const { user, loginDemo } = useContext(AuthContext);
  const market = useMarket();
  const btc = market.find((s) => s.symbol === "BTCUSD");

  function launch() {
    if (!user) loginDemo();
    navigate("/dashboard");
  }

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        pt: { xs: 6, md: 9 },
        pb: { xs: 7, md: 10 },
        px: { xs: 2, md: 4 },
      }}
    >
      {/* ambient orbs */}
      <Box sx={{ position: "absolute", top: -180, left: "38%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.28), transparent 65%)", pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", bottom: -220, left: -120, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.14), transparent 65%)", pointerEvents: "none" }} />

      <Box
        sx={{
          position: "relative",
          maxWidth: 1400,
          mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1.15fr" },
          gap: { xs: 5, lg: 6 },
          alignItems: "center",
        }}
      >
        {/* left copy */}
        <Box className="anim-fade-up">
          <Chip
            icon={<BoltIcon sx={{ fontSize: 16, color: "#22d3ee !important" }} />}
            label="PAPER-TRADING PLATFORM · FULL STACK"
            sx={{
              mb: 2.4,
              px: 0.6,
              fontWeight: 800,
              fontSize: "0.64rem",
              letterSpacing: "0.16em",
              color: "#93c5fd",
              border: "1px solid rgba(59,130,246,0.4)",
              background: "rgba(37,99,235,0.1)",
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.04,
              fontSize: { xs: "2.4rem", md: "3.6rem" },
              background: "linear-gradient(120deg,#f0f6ff 25%,#60a5fa 60%,#22d3ee 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Trade the market like a machine.
          </Typography>
          <Typography sx={{ mt: 2.2, color: "#8ba3cf", fontSize: { xs: "1rem", md: "1.12rem" }, maxWidth: 540, lineHeight: 1.7 }}>
            Matrix AI Trader is a complete trading platform — live charts, an AI
            signal engine, automated stop-loss protection and M-Pesa wallet
            funding — built to feel like a city trading desk in your browser.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.6} sx={{ mt: 3.4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<RocketLaunchIcon />}
              onClick={launch}
              sx={{ px: 3, py: 1.5, fontSize: "1rem" }}
            >
              Launch the Terminal
            </Button>
            <Button
              variant="outlined"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate("/login")}
              sx={{ px: 3, py: 1.5, fontSize: "1rem", borderWidth: 2, "&:hover": { borderWidth: 2 } }}
            >
              Create account
            </Button>
          </Stack>

          <Stack direction="row" spacing={3} sx={{ mt: 4 }} flexWrap="wrap" useFlexGap>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: "1.4rem", color: "#e6efff", fontFamily: "monospace" }}>
                <Counter to={8} />
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#5b6e96", letterSpacing: "0.1em" }}>LIVE INSTRUMENTS</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: "1.4rem", color: "#e6efff", fontFamily: "monospace" }}>
                <Counter to={5} suffix="s" />
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#5b6e96", letterSpacing: "0.1em" }}>RISK MONITOR SWEEPS</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: "1.4rem", color: "#e6efff", fontFamily: "monospace" }}>
                <Counter to={3} />
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#5b6e96", letterSpacing: "0.1em" }}>AI CONFLUENCE LAYERS</Typography>
            </Box>
          </Stack>
        </Box>

        {/* right — live terminal card */}
        <Box sx={{ position: "relative" }} className="anim-fade-up" style={{ animationDelay: "140ms" }}>
          <FloatCard
            icon={<NotificationsActiveOutlinedIcon />}
            title="Take profit hit"
            sub={`BTCUSD closed +$128.40`}
            sx={{ top: -18, right: { xs: 6, md: -14 }, display: { xs: "none", md: "flex" } }}
            delay={0.4}
          />
          <FloatCard
            icon={<PhoneIphoneIcon />}
            title="M-Pesa deposit settled"
            sub="KSh 64,500 → wallet credited"
            sx={{ bottom: -20, left: { xs: 6, md: -18 }, display: { xs: "none", md: "flex" } }}
            delay={1.6}
          />
          <Box
            className="glass-panel"
            sx={{
              p: 1.4,
              borderRadius: "20px",
              boxShadow: "0 40px 90px rgba(2,6,23,0.8), var(--glow)",
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, pb: 1 }}>
              <Stack direction="row" spacing={0.8}>
                {["#ff5c7a", "#fbbf24", "#22d3ee"].map((c) => (
                  <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.85 }} />
                ))}
              </Stack>
              <Typography sx={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#5b6e96" }}>
                matrix-terminal — live
              </Typography>
            </Stack>
            <PriceChart symbol="BTCUSD" compact height={330} />
            <Stack direction="row" spacing={1} sx={{ px: 1, pt: 1.2, pb: 0.4 }} flexWrap="wrap" useFlexGap>
              {market.slice(0, 4).map((s) => (
                <Chip
                  key={s.symbol}
                  size="small"
                  label={`${s.symbol} ${s.changePct >= 0 ? "+" : ""}${s.changePct.toFixed(2)}%`}
                  sx={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    fontSize: "0.66rem",
                    color: s.changePct >= 0 ? "#22d3ee" : "#ff5c7a",
                    border: `1px solid ${s.changePct >= 0 ? "rgba(34,211,238,0.35)" : "rgba(255,92,122,0.35)"}`,
                    background: "rgba(2,6,23,0.5)",
                  }}
                />
              ))}
              <Box sx={{ flex: 1 }} />
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 800, color: "#60a5fa", alignSelf: "center" }}>
                BTC {btc ? formatPrice(btc.price, 0) : "—"}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function FeaturesSection() {
  return (
    <Box id="features" sx={{ px: { xs: 2, md: 4 }, py: { xs: 7, md: 10 }, maxWidth: 1400, mx: "auto" }}>
      <Stack alignItems="center" spacing={1.4} sx={{ mb: 5, textAlign: "center" }}>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.22em", color: "#3b82f6" }}>
          EVERYTHING A DESK NEEDS
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: "-0.02em", fontSize: { xs: "1.8rem", md: "2.6rem" } }}>
          One platform. Every tool.
        </Typography>
        <Typography sx={{ color: "#8ba3cf", maxWidth: 620 }}>
          Not a mockup — a working trading backend wired into a realtime terminal.
          Every feature below runs end-to-end.
        </Typography>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2.4 }}>
        {FEATURES.map((f, i) => (
          <Box
            key={f.title}
            className="glass-panel anim-fade-up"
            sx={{
              p: 3,
              animationDelay: `${i * 70}ms`,
              transition: "transform .25s ease, border-color .25s ease, box-shadow .25s ease",
              "&:hover": {
                transform: "translateY(-6px)",
                borderColor: "rgba(59,130,246,0.5)",
                boxShadow: "0 20px 50px rgba(37,99,235,0.3)",
              },
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                display: "grid",
                placeItems: "center",
                borderRadius: "12px",
                mb: 1.8,
                color: "#22d3ee",
                background: "linear-gradient(135deg, rgba(37,99,235,0.3), rgba(34,211,238,0.12))",
                border: "1px solid rgba(59,130,246,0.35)",
                "& svg": { fontSize: 26 },
              }}
            >
              {f.icon}
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", mb: 0.8 }}>{f.title}</Typography>
            <Typography sx={{ color: "#8ba3cf", fontSize: "0.88rem", lineHeight: 1.65 }}>{f.text}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function HowSection() {
  return (
    <Box id="how" sx={{ px: { xs: 2, md: 4 }, py: { xs: 7, md: 9 }, background: "linear-gradient(180deg, transparent, rgba(37,99,235,0.06), transparent)" }}>
      <Stack alignItems="center" spacing={1.4} sx={{ mb: 5, textAlign: "center" }}>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.22em", color: "#3b82f6" }}>
          FROM SIGN-UP TO SETTLED PROFIT
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: "-0.02em", fontSize: { xs: "1.8rem", md: "2.4rem" } }}>
          Three steps. Under a minute.
        </Typography>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: 2.6, maxWidth: 1200, mx: "auto" }}>
        {STEPS.map((s, i) => (
          <Box key={s.n} className="glass-panel anim-fade-up" sx={{ p: 3.2, animationDelay: `${i * 90}ms`, position: "relative", overflow: "hidden" }}>
            <Typography
              sx={{
                position: "absolute",
                top: -18,
                right: 8,
                fontSize: "4.6rem",
                fontWeight: 900,
                color: "rgba(59,130,246,0.14)",
                fontFamily: "monospace",
              }}
            >
              {s.n}
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "1.12rem", mb: 1, position: "relative" }}>{s.title}</Typography>
            <Typography sx={{ color: "#8ba3cf", fontSize: "0.9rem", lineHeight: 1.7, position: "relative" }}>{s.text}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function StackSection() {
  return (
    <Box id="stack" sx={{ px: { xs: 2, md: 4 }, py: { xs: 7, md: 9 }, maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr" }, gap: 5, alignItems: "center" }}>
        <Box>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.22em", color: "#3b82f6" }}>
            BUILT LIKE A PRODUCTION PLATFORM
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: "-0.02em", mt: 1, fontSize: { xs: "1.8rem", md: "2.2rem" } }}>
            Serious engineering under the glass.
          </Typography>
          <Typography sx={{ color: "#8ba3cf", mt: 2, lineHeight: 1.75 }}>
            A FastAPI + PostgreSQL core with JWT authentication, a risk engine,
            background trade monitoring and provider-based market data — wrapped
            in a React terminal that streams everything in real time.
          </Typography>
        </Box>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.1}>
          {STACK.map((s) => (
            <Chip
              key={s}
              label={s}
              sx={{
                fontWeight: 700,
                color: "#b6c8ea",
                border: "1px solid rgba(59,130,246,0.32)",
                background: "rgba(37,99,235,0.08)",
                "&:hover": { background: "rgba(37,99,235,0.2)", color: "#fff" },
              }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

function CTASection() {
  const navigate = useNavigate();
  const { user, loginDemo } = useContext(AuthContext);

  function launch() {
    if (!user) loginDemo();
    navigate("/dashboard");
  }

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, pb: { xs: 8, md: 12 } }}>
      <Box
        className="glass-panel"
        sx={{
          maxWidth: 1100,
          mx: "auto",
          textAlign: "center",
          px: { xs: 3, md: 6 },
          py: { xs: 6, md: 8 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box className="blueprint-grid" sx={{ position: "absolute", inset: 0, opacity: 0.35 }} />
        <Box sx={{ position: "relative" }}>
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: "-0.02em", fontSize: { xs: "1.9rem", md: "2.6rem" } }}>
            Your desk is open.
          </Typography>
          <Typography sx={{ color: "#8ba3cf", mt: 1.6, maxWidth: 520, mx: "auto" }}>
            Launch the terminal now — no card, no signup required for the guided
            tour. The market is already moving.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<RocketLaunchIcon />}
            onClick={launch}
            sx={{ mt: 3.4, px: 4, py: 1.6, fontSize: "1.05rem", animation: "glowPulse 2.6s infinite" }}
          >
            Enter Matrix AI Trader
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function LandingFooter() {
  return (
    <Box sx={{ borderTop: "1px solid rgba(59,130,246,0.14)", py: 3.4, px: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ maxWidth: 1400, mx: "auto" }}
      >
        <Logo size={26} />
        <Typography sx={{ fontSize: "0.74rem", color: "#5b6e96", textAlign: "center" }}>
          Built by <b style={{ color: "#93c5fd" }}>Brian Kipkoech</b> · Nairobi, Kenya ·
          Paper-trading platform — no real money at risk.
        </Typography>
        <IconButton
          component="a"
          href="https://github.com/kipkoechbrian-dot/Matrix-AI-Trader"
          target="_blank"
          rel="noreferrer"
          sx={{ color: "#8ba3cf", border: "1px solid rgba(59,130,246,0.3)", "&:hover": { color: "#fff", background: "rgba(37,99,235,0.2)" } }}
          size="small"
          aria-label="GitHub repository"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
          </svg>
        </IconButton>
      </Stack>
    </Box>
  );
}

/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes floaty {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      <LandingNav />
      <Box sx={{ flex: 1 }}>
        <HeroSection />
        <TickerTape />
        <FeaturesSection />
        <HowSection />
        <StackSection />
        <CTASection />
      </Box>
      <LandingFooter />
    </Box>
  );
}
