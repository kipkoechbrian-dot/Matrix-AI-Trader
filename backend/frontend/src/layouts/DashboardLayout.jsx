import AppShell from "./AppShell";

/**
 * Kept for backward compatibility with existing imports —
 * the real shell (navbar, ticker, footer) lives in AppShell.
 */
export default function DashboardLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
