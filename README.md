# Matrix AI Trader

**An AI-assisted trading terminal** — FastAPI backend, React trading dashboard, live market streaming, technical-signal engine (EMA/RSI), wallets, portfolios and risk management.

The frontend ships with a **built-in simulated market feed**, so the whole terminal is alive the moment you open it — candles, prices, equity curves and P&L all tick in real time with **zero external API keys required**. When the backend is reachable, the UI talks to it directly.

---

## Highlights

- 📈 **Live candlestick terminal** — TradingView-style charts (lightweight-charts) streaming 8 instruments (crypto, FX, metals, equities)
- 🤖 **AI signal engine** — EMA 20/50 cross + RSI(14) analysis with confidence scoring, computed both server-side (`app/ai/`) and live in the browser
- 💼 **Portfolio & wallet system** — balances, floating P&L, win-rate analytics, transaction ledger
- 🛡️ **Risk engine** — position sizing and margin checks before every trade (`app/services/risk_service.py`)
- 🔐 **JWT auth** — registration, login, role-based permissions
- ⚡ **Realtime architecture** — WebSocket manager, trade monitor that auto-tracks open positions
- 🎨 **Blue-first design system** — custom MUI dark theme, glass panels, animated ticker tape, live sparklines everywhere

## Tech Stack

| Layer     | Technology                                                                 |
| --------- | -------------------------------------------------------------------------- |
| Frontend  | React 19, Vite, MUI, lightweight-charts, Recharts, React Router, Axios     |
| Backend   | FastAPI, SQLAlchemy 2, Pydantic, JWT (python-jose), Uvicorn                |
| Data      | PostgreSQL (schema + seeds in `database/`), TwelveData market API          |
| Analytics | pandas, numpy, `ta` technical-analysis library                             |

## Project Structure

```
├── backend/               FastAPI application
│   ├── app/
│   │   ├── ai/            Indicator + signal engine (EMA / RSI)
│   │   ├── api/           REST + WebSocket routes (v1 router)
│   │   ├── authentication/ JWT auth, permissions
│   │   ├── core/          Settings / env config
│   │   ├── database/      Engine, session, ORM models
│   │   ├── schemas/       Pydantic schemas
│   │   └── services/      Trading, wallet, risk, market, AI services
│   ├── frontend/          React trading terminal (Vite)
│   └── main.py            App entrypoint (CORS, startup monitor, routers)
├── database/              schema.sql + seed.sql
├── docs/                  API reference, architecture, roadmap
└── tests/                 Test suite home
```

## Quick Start

### 1 — Frontend (instant demo, no backend needed)

```bash
cd backend/frontend
npm install
npm run dev
```

Open http://localhost:5173 and press **“Explore the Live Demo”** — the terminal streams simulated-but-live markets immediately.

### 2 — Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                # then fill in your values
uvicorn main:app --reload
```

API docs: http://127.0.0.1:8000/docs — interactive Swagger for every endpoint.

### 3 — Database (PostgreSQL)

```bash
psql -U postgres -f database/schema.sql
psql -U postgres -d matrix_ai_trader -f database/seed.sql
```

Set `DATABASE_URL` in `backend/.env` accordingly.

## Environment Variables

See [`backend/.env.example`](backend/.env.example) — database credentials, JWT secret, TwelveData API key, CORS origins, and optional SMTP.

The Vite dev server proxies `/api/*` to `127.0.0.1:8000` out of the box; for deployments, point the frontend at your API with `VITE_API_URL`.

## Key API Surface

| Endpoint                        | Description                               |
| ------------------------------- | ----------------------------------------- |
| `POST /api/v1/register` `/login` | Account creation + JWT login              |
| `GET  /api/v1/dashboard`         | Wallet, profit, win-rate summary          |
| `GET  /api/v1/ai/signal/{symbol}`| AI trading signal for a symbol            |
| `POST /api/v1/ai/auto-trade/{symbol}` | Execute the AI's recommendation      |
| `POST /api/v1/trade/open` `close`| Position lifecycle                        |
| `GET  /api/v1/market/{symbol}`   | Live price proxy (TwelveData)             |

Full reference: [`docs/API.md`](docs/API.md)

## Roadmap

- [ ] Swap simulated feed → WebSocket market stream end-to-end
- [ ] ML model layer beyond indicator heuristics
- [ ] Order management: stops, limits, trailing exits
- [ ] Coverage for the test suite (`tests/`)
- [ ] Docker Compose one-command deployment

See [`docs/Roadmap.md`](docs/Roadmap.md) for the full plan.

---

*Built by Brian Kipkoech — market data in demo mode is simulated for presentation purposes.*
