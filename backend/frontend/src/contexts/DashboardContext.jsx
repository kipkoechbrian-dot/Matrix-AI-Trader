import { createContext, useCallback, useEffect, useState } from "react";
import { getDashboard } from "../services/tradeService";

export const DashboardContext = createContext();

// Shown when the API is unreachable — keeps the terminal fully demonstrated.
const FALLBACK = {
  wallet_balance: 12480.55,
  total_profit: 1284.32,
  win_rate: 68.4,
  open_trades: 5,
  fallback: true,
};

export default function DashboardProvider({ children }) {
  const [dashboard, setDashboard] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  const refreshDashboard = useCallback(async () => {
    try {
      const data = await getDashboard();
      setDashboard({ ...FALLBACK, ...data, fallback: false });
      setApiOnline(true);
    } catch {
      setDashboard((prev) => prev || FALLBACK);
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
    // keep balances/navigation stats fresh while signed in
    const timer = setInterval(() => {
      if (localStorage.getItem("token")) {
        refreshDashboard();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [refreshDashboard]);

  return (
    <DashboardContext.Provider
      value={{ dashboard, loading, apiOnline, refreshDashboard }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
