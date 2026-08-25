import { useEffect, useRef, useState } from "react";

/**
 * Smoothly tweens toward `value` whenever it changes.
 * Great for balances / P&L that tick live.
 */
export default function AnimatedNumber({
  value,
  duration = 500,
  format = (v) => v.toLocaleString("en-US"),
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return undefined;

    const start = performance.now();

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [value, duration]);

  return <>{format(display)}</>;
}
