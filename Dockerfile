# ---------------------------------------------------------------------------
# Matrix AI Trader — all-in-one production image
# Frontend (React/Vite) is built and then served by the FastAPI app itself.
# One container, one port, one domain — like any production website.
# ---------------------------------------------------------------------------

# ---- Stage 1: build the frontend ----
FROM node:20-alpine AS frontend
WORKDIR /app
COPY backend/frontend/package.json backend/frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY backend/frontend/ ./
RUN npm run build

# ---- Stage 2: Python runtime ----
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /srv

# System deps for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY backend/ ./
# Built SPA from stage 1
COPY --from=frontend /app/dist ./frontend/dist

EXPOSE 8000

# Render/Railway/Fly inject $PORT; default 8000 locally
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
