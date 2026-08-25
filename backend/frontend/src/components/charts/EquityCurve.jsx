import { useMemo } from "react";
import { Box, Stack, Typography, Chip } from "@mui/material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useEquity } from "../../hooks/useMarket";

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        background: "rgba(2, 6, 23, 0.92)",
        border: "1px solid rgba(59,130,246,0.4)",
        borderRadius: "10px",
        px: 1.5,
        py: 0.8,
      }}
    >
      <Typography
        sx={{ fontFamily: "monospace", fontWeight: 700, color: "#60a5fa" }}
      >
        ${payload[0].value.toLocaleString("en-US")}
      </Typography>
      <Typography sx={{ fontSize: "0.68rem", color: "#8ba3cf" }}>
        {new Date(payload[0].payload.t).toLocaleTimeString()}
      </Typography>
    </Box>
  );
}

export default function EquityCurve({ height = 260 }) {
  const data = useEquity();

  const { change, start } = useMemo(() => {
    if (data.length < 2) return { change: 0, start: data[0]?.v || 0 };
    const s = data[0].v;
    const e = data[data.length - 1].v;
    return { change: ((e - s) / s) * 100, start: s };
  }, [data]);

  const up = change >= 0;

  return (
    <Box className="glass-panel" sx={{ p: 2.5, height: "100%" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Portfolio Equity
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "#8ba3cf" }}>
            Streaming account value
          </Typography>
        </Box>
        <Chip
          label={`${up ? "+" : ""}${change.toFixed(2)}% session`}
          size="small"
          sx={{
            fontWeight: 800,
            color: up ? "#22d3ee" : "#ff5c7a",
            background: up
              ? "rgba(34,211,238,0.1)"
              : "rgba(255,92,122,0.1)",
            border: `1px solid ${up ? "rgba(34,211,238,0.4)" : "rgba(255,92,122,0.4)"}`,
          }}
        />
      </Stack>

      <Box sx={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                <stop offset="55%" stopColor="#2563eb" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#020617" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="t"
              tickFormatter={(t) =>
                new Date(t).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
              stroke="#5b6e96"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(59,130,246,0.2)" }}
              minTickGap={60}
            />
            <YAxis
              domain={["dataMin - 40", "dataMax + 40"]}
              stroke="#5b6e96"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine
              y={start}
              stroke="rgba(139,163,207,0.45)"
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke="#3b82f6"
              strokeWidth={2.4}
              fill="url(#eqFill)"
              isAnimationActive={false}
              style={{ filter: "drop-shadow(0 0 10px rgba(59,130,246,0.5))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
