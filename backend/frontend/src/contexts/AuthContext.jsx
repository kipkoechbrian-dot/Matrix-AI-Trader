import { createContext, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext();

const DEMO_USER = { email: "demo@matrixai.trade", name: "Demo Trader", demo: true };

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore session across reloads
    const token = localStorage.getItem("token");
    const saved = localStorage.getItem("matrix_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* fall through */
      }
    }
    return token ? { email: "trader@matrixai.trade" } : null;
  });

  const demoMode = Boolean(user?.demo);

  async function login(email, password) {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);

    const response = await api.post("/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    localStorage.setItem("token", response.data.access_token);
    const profile = { email };
    localStorage.setItem("matrix_user", JSON.stringify(profile));
    setUser(profile);
    return response.data;
  }

  async function register(username, email, password) {
    // Create the account, then sign straight in with the new token.
    await api.post("/register", { username, email, password });
    return login(email, password);
  }

  /**
   * One-click demo session — lets anyone (recruiters included)
   * explore the full terminal without a backend running.
   */
  function loginDemo() {
    localStorage.setItem("matrix_user", JSON.stringify(DEMO_USER));
    setUser(DEMO_USER);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("matrix_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ login, register, loginDemo, logout, user, setUser, demoMode }}
    >
      {children}
    </AuthContext.Provider>
  );
}
