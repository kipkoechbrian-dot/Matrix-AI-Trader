# Deployment — Matrix AI Trader

The platform ships as an **all-in-one Docker image**: FastAPI serves the built
React site, the JSON API, the AI engine and the trade monitor from a single
port — so any host that runs Docker runs Matrix AI Trader like a normal website.

```text
https://your-domain.com/          →  marketing site + terminal (React)
https://your-domain.com/api/v1/…  →  JSON API (FastAPI)
https://your-domain.com/healthz   →  health check for the host
```

---

## 1 · Local production run (30 seconds, zero setup)

Requires only Docker.

```bash
docker build -t matrix-ai-trader .
docker run -p 8000:8000 matrix-ai-trader
```

Open http://localhost:8000 — that's the *real* production shape (SQLite wallet
DB inside the container; fine for demos).

## 2 · Full stack with PostgreSQL (docker compose)

```bash
docker compose up --build
```

App on http://localhost:8000, Postgres on an internal network with a persistent
volume. Shut down with `docker compose down` (add `-v` to also wipe the data).

## 3 · Deploy to Render (easiest public URL — free tier)

1. Push this repo to GitHub (done ✅)
2. On [render.com](https://render.com) → **New → Blueprint** → connect the repo
   (it reads `render.yaml` automatically)
3. Render builds the Docker image, provisions `matrix-db` (free Postgres) and
   wires `DATABASE_URL` + a generated `SECRET_KEY`
4. After ~4 minutes you get `https://matrix-ai-trader.onrender.com` — live,
   HTTPS included, like any website in the world

**Set these env vars in the Render dashboard** (the `sync: false` entries):
`SMTP_*` (email receipts), `MPESA_*` (live Daraja pushes), `STRIPE_SECRET_KEY`,
`TWELVE_DATA_API_KEY`, `CORS_ORIGINS` (your domain, e.g.
`https://matrix-ai-trader.onrender.com`).

## 4 · Deploy anywhere else (Railway / Fly.io / a VPS)

Any Docker host works — the image only needs:

| Variable          | Required | Notes                                        |
| ----------------- | -------- | -------------------------------------------- |
| `PORT`            | auto     | Hosts inject it (default 8000)               |
| `DATABASE_URL`    | yes*     | Postgres URL; *SQLite is the include-able dev default |
| `SECRET_KEY`      | yes      | long random string (JWT signing)             |
| `CORS_ORIGINS`    | yes      | `https://your-domain.com`                    |
| `SMTP_*`          | optional | email receipts                               |
| `MPESA_*`         | optional | real Safaricom STK pushes (Daraja)           |
| `STRIPE_SECRET_KEY` | optional | real card charges                          |
| `TWELVE_DATA_API_KEY` | optional | real market data (sim engine otherwise)  |

VPS quick-run:

```bash
docker run -d --name matrix -p 80:8000 \
  -e SECRET_KEY=$(openssl rand -hex 32) \
  -e DATABASE_URL=sqlite:////srv/matrix.db \
  matrix-ai-trader
```

Put Nginx/Caddy in front for TLS, or use the host's built-in proxy.

## 5 · Your own domain (e.g. `matrixaitrader.com`)

1. Buy the domain (Namecheap, Cloudflare, Truehost — ~KES 1k/yr)
2. Point it at the host:
   - **Render/Railway**: dashboard → Custom Domain → add a `CNAME` record as shown
   - **VPS**: create an `A` record → your server IP
3. HTTPS issues automatically on managed hosts (Let’s Encrypt)
4. Update these for polish:
   - `CORS_ORIGINS=https://matrixaitrader.com`
   - domain strings in `frontend/index.html` (og:url), `frontend/public/robots.txt` and `frontend/public/sitemap.xml`

## 6 · Common production gotchas handled already

- SPA deep links (`/dashboard` on refresh) → answered with `index.html` ✅
- Chunked JS bundles (mui/charts/graphs split) ✅ · GZip on responses ✅
- Health check at `/healthz` for uptime checks ✅
- Secrets never baked into the image — env vars only ✅
- Simulated market engine needs no external API keys — the site is alive
  even before you add `TWELVE_DATA_API_KEY` ✅
