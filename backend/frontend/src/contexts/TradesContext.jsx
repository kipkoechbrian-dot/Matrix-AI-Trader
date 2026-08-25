import { createContext, useCallback, useEffect, useState } from "react";
import { getTrades } from "../services/tradeService";

export const TradesContext = createContext();

export default function TradesProvider({ children }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  const refreshTrades = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTrades();
      setTrades(Array.isArray(data) ? data : []);
      setApiOnline(true);
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
  }, [refreshTrades]);

  return (
    <TradesContext.Provider
      value={{ trades, loading, apiOnline, refreshTrades }}
    >
      {children}
    </TradesContext.Provider>
  );
}
