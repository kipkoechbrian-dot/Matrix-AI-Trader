import { useEffect, useState } from "react";
import {
  subscribe,
  getState,
  getAllStates,
  getEquity,
  getDemoTrades,
} from "../services/marketSim";

/** Live state for one symbol; re-renders on every engine tick. */
export function useSymbol(symbol) {
  const [state, setState] = useState(() => getState(symbol));

  useEffect(() => {
    setState(getState(symbol));
    const unsub = subscribe(() => setState(getState(symbol)));
    return unsub;
  }, [symbol]);

  return state;
}

/** Live snapshot of every symbol (watchlists, ticker tape). */
export function useMarket() {
  const [states, setStates] = useState(() => getAllStates());

  useEffect(() => {
    const unsub = subscribe(() => setStates(getAllStates()));
    return unsub;
  }, []);

  return states;
}

/** Live portfolio equity curve. */
export function useEquity() {
  const [curve, setCurve] = useState(() => getEquity());

  useEffect(() => {
    const unsub = subscribe(() => setCurve(getEquity()));
    return unsub;
  }, []);

  return curve;
}

/** Demo open positions with live P&L. */
export function useDemoTrades() {
  const [trades, setTrades] = useState(() => getDemoTrades());

  useEffect(() => {
    const unsub = subscribe(() => setTrades(getDemoTrades()));
    return unsub;
  }, []);

  return trades;
}
