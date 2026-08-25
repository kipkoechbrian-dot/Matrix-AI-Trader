import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import App from "./App";
import theme from "./theme";
import "./index.css";

import AuthProvider from "./contexts/AuthContext";
import DashboardProvider from "./contexts/DashboardContext";
import TradesProvider from "./contexts/TradesContext";
import { startRemoteFeed } from "./services/remoteFeed";

// Probe the backend market engine — flips the whole app to
// LIVE (server truth) when reachable, simulated feed otherwise.
startRemoteFeed();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DashboardProvider>
          <TradesProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </TradesProvider>
        </DashboardProvider>
      </AuthProvider>
      <ToastContainer
        position="bottom-right"
        theme="dark"
        toastStyle={{
          background: "#0a142e",
          border: "1px solid rgba(59,130,246,0.35)",
          color: "#e6efff",
        }}
      />
    </ThemeProvider>
  </React.StrictMode>
);
