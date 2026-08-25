import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getTrades } from "../services/tradeService";

export const TradesContext = createContext();

const POLL_EVERY = 4000;

export default function TradesProvider({ children }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  // track which trades we've already announced as auto-closed
  const announcedRef = useRef(new Set());

  const refreshTrades = useCallback(async () => {
    try {
      const data = await getTrades();
      const rows = Array.isArray(data) ? data : [];
      setTrades(rows);
      setApiOnline(true);

      // Toast when the monitor auto-closes a position
      rows.forEach((t) => {
        if (
          t.status === "CLOSED" &&
          t.close_reason &&
          t.close_reason !== "MANUAL" &&
          !announcedRef.current.has(t.id)
        ) {
          announcedRef.current.add(t.id);
          const label = {
            STOP_LOSS: "Stop loss",
            TAKE_PROFIT: "Take profit",
            LIQUIDATION: "Liquidation",
          }[t.close_reason] || t.close_reason;
          const pnl = `${t.profit >= 0 ? "+" : ""}$${Math.abs(t.profit).toFixed(2)}`;
          if (t.profit >= 0) {
            toast.success(`${label} hit — ${t.symbol} closed for ${pnl}`);
          } else {
            toast.error(`${label} hit — ${t.symbol} closed for ${pnl}`);
          }
        }
      });
    } catch {
      // API offline -> dashboard uses the simulated feed instead
      setTrades([]);
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTrades();
    const timer = setInterval(() => {
      if (localStorage.getItem("token")) {
        refreshTrades();
      }
    }, POLL_EVERY);
    return () => clearInterval(timer);
  }, [refreshTrades]);

  return (
    <TradesContext.Provider
      value={{ trades, loading, apiOnline, refreshTrades }}
    >
      {children}
    </TradesContext.Provider>
  );
}
