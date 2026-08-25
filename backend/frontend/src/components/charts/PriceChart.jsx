import { useEffect, useRef, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import {
  getCandles,
  getState,
  subscribe,
  formatPrice,
  SYMBOLS,
} from "../../services/marketSim";

/** (Re)load a symbol's full candle + volume history into the series. */
function loadSymbol(chart, candleSeries, volumeSeries, sym) {
  const candles = getCandles(sym);
  candleSeries.setData(candles);
  volumeSeries.setData(
    candles.map((c) => ({
      time: c.time,
      value: c.volume,
      color:
        c.close >= c.open
          ? "rgba(34, 211, 238, 0.35)"
          : "rgba(255, 92, 122, 0.35)",
    }))
  );
  chart.timeScale().fitContent();
}

/**
 * TradingView-grade live candlestick chart.
 * Streams candles from the market engine and repaints the latest
 * bar in real time. No API key required — always alive.
 */
export default function PriceChart({
  symbol: controlledSymbol,
  onSymbolChange,
  height = 380,
  compact = false,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const [internalSymbol, setInternalSymbol] = useState(
    controlledSymbol || "BTCUSD"
  );
  const symbol = controlledSymbol || internalSymbol;
  const [tick, setTick] = useState(() => getState(symbol));

  /* Create chart once */
  useEffect(() => {
    let disposed = false;
    let resizeObserver;

    async function create() {
      const { createChart, CrosshairMode } = await import(
        "lightweight-charts"
      );
      if (disposed || !containerRef.current) return;

      const chart = createChart(containerRef.current, {
        autoSize: true,
        layout: {
          background: { color: "transparent" },
          textColor: "#5b6e96",
          fontSize: 11,
          fontFamily: "ui-monospace, Consolas, monospace",
        },
        grid: {
          vertLines: { color: "rgba(59, 130, 246, 0.07)" },
          horzLines: { color: "rgba(59, 130, 246, 0.07)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: "rgba(96, 165, 250, 0.45)",
            labelBackgroundColor: "#1d4ed8",
          },
          horzLine: {
            color: "rgba(96, 165, 250, 0.45)",
            labelBackgroundColor: "#1d4ed8",
          },
        },
        rightPriceScale: {
          borderColor: "rgba(59, 130, 246, 0.2)",
        },
        timeScale: {
          borderColor: "rgba(59, 130, 246, 0.2)",
          timeVisible: true,
          secondsVisible: true,
        },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: "#22d3ee",
        downColor: "#ff5c7a",
        borderUpColor: "#22d3ee",
        borderDownColor: "#ff5c7a",
        wickUpColor: "rgba(34, 211, 238, 0.7)",
        wickDownColor: "rgba(255, 92, 122, 0.7)",
      });

      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;

      loadSymbol(chart, candleSeries, volumeSeries, symbol);

      resizeObserver = new ResizeObserver(() => chart.timeScale().fitContent());
      resizeObserver.observe(containerRef.current);
    }

    create();

    return () => {
      disposed = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Reload data when symbol switches */
  useEffect(() => {
    if (chartRef.current && candleSeriesRef.current) {
      loadSymbol(
        chartRef.current,
        candleSeriesRef.current,
        volumeSeriesRef.current,
        symbol
      );
    }
    setTick(getState(symbol));
  }, [symbol]);

  /* Stream live updates */
  useEffect(() => {
    const unsub = subscribe(() => {
      const state = getState(symbol);
      setTick(state);
      const candle = state.candles[state.candles.length - 1];
      if (candleSeriesRef.current && candle) {
        candleSeriesRef.current.update(candle);
        volumeSeriesRef.current?.update({
          time: candle.time,
          value: candle.volume,
          color:
            candle.close >= candle.open
              ? "rgba(34, 211, 238, 0.35)"
              : "rgba(255, 92, 122, 0.35)",
        });
      }
    });
    return unsub;
  }, [symbol]);

  const up = tick.changePct >= 0;
  const flashClass =
    tick.price > tick.prevPrice
      ? "tick-up"
      : tick.price < tick.prevPrice
        ? "tick-down"
        : "";

  const chartHeight = compact ? height - 104 : height;

  return (
    <Box
      className="glass-panel"
      sx={{
        p: compact ? 1.5 : 2.5,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 1.5 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {tick.name}
            </Typography>
            <Chip
              size="small"
              icon={
                <ShowChartIcon sx={{ fontSize: 14, color: "#22d3ee !important" }} />
              }
              label="LIVE"
              sx={{
                height: 20,
                fontSize: "0.62rem",
                letterSpacing: "0.12em",
                color: "#22d3ee",
                border: "1px solid rgba(34, 211, 238, 0.45)",
                background: "rgba(34, 211, 238, 0.08)",
                animation: "pulseDot 2s infinite",
              }}
            />
          </Stack>
          <Stack direction="row" spacing={1.4} alignItems="baseline">
            <Typography
              key={tick.price.toFixed(6)}
              className={flashClass}
              sx={{
                fontFamily: "monospace",
                fontSize: compact ? "1.15rem" : "1.5rem",
                fontWeight: 700,
                color: "#e6efff",
              }}
            >
              {formatPrice(tick.price, tick.decimals)}
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.85rem",
                color: up ? "#22d3ee" : "#ff5c7a",
              }}
            >
              {up ? "▲" : "▼"} {Math.abs(tick.changePct).toFixed(2)}%
            </Typography>
          </Stack>
        </Box>

        {!compact && (
          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
            {SYMBOLS.map((s) => (
              <Chip
                key={s.symbol}
                label={s.symbol}
                size="small"
                onClick={() =>
                  onSymbolChange
                    ? onSymbolChange(s.symbol)
                    : setInternalSymbol(s.symbol)
                }
                sx={{
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  letterSpacing: "0.04em",
                  color: symbol === s.symbol ? "#fff" : "#8ba3cf",
                  background:
                    symbol === s.symbol
                      ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
                      : "rgba(59,130,246,0.08)",
                  border:
                    symbol === s.symbol
                      ? "1px solid #3b82f6"
                      : "1px solid rgba(59,130,246,0.25)",
                  "&:hover": {
                    background:
                      symbol === s.symbol
                        ? "linear-gradient(135deg,#3b82f6,#2563eb)"
                        : "rgba(59,130,246,0.2)",
                  },
                }}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minHeight: chartHeight,
          "& canvas": { borderRadius: "10px" },
        }}
      />
    </Box>
  );
}
