import { createTheme } from "@mui/material/styles";

/**
 * Matrix AI Trader — blue-first dark theme.
 * Every MUI surface inherits the deep-navy / electric-blue language
 * defined in index.css so the whole product feels like one terminal.
 */
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#1d4ed8",
    },
    secondary: {
      main: "#22d3ee",
      light: "#67e8f9",
      dark: "#0891b2",
    },
    success: { main: "#22d3ee" },
    error: { main: "#ff5c7a" },
    warning: { main: "#fbbf24" },
    background: {
      default: "#020617",
      paper: "#0a142e",
    },
    text: {
      primary: "#e6efff",
      secondary: "#8ba3cf",
    },
    divider: "rgba(59, 130, 246, 0.16)",
  },
  typography: {
    fontFamily:
      '"Inter", "SF Pro Display", system-ui, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 800, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: "rgba(13, 27, 62, 0.55)",
          border: "1px solid rgba(59, 130, 246, 0.16)",
          backdropFilter: "blur(14px)",
          backgroundImage: "none",
          boxShadow: "0 12px 32px rgba(2, 6, 23, 0.55)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          boxShadow: "0 6px 24px rgba(37, 99, 235, 0.45)",
          "&:hover": {
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            boxShadow: "0 8px 32px rgba(37, 99, 235, 0.65)",
          },
        },
        outlined: {
          borderColor: "rgba(59, 130, 246, 0.45)",
          "&:hover": {
            borderColor: "#60a5fa",
            background: "rgba(37, 99, 235, 0.12)",
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            background: "rgba(2, 6, 23, 0.5)",
            "& fieldset": { borderColor: "rgba(59, 130, 246, 0.25)" },
            "&:hover fieldset": { borderColor: "rgba(59, 130, 246, 0.5)" },
            "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: "#0a142e",
          border: "1px solid rgba(59, 130, 246, 0.25)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "rgba(59, 130, 246, 0.12)",
        },
        head: {
          color: "#8ba3cf",
          fontWeight: 700,
          letterSpacing: "0.08em",
          fontSize: "0.72rem",
          textTransform: "uppercase",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
  },
});

export default theme;
