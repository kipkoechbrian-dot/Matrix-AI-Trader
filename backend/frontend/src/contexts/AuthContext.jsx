import { createContext, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    async function login(email, password) {

        const form = new URLSearchParams();

        form.append("username", email);
        form.append("password", password);

        const response = await api.post(
            "/login",
            form,
            {
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",
                },
            }
        );

        localStorage.setItem(
            "token",
            response.data.access_token
        );

        return response.data;
    }

    function logout() {

        localStorage.removeItem("token");

        setUser(null);

    }

    return (

        <AuthContext.Provider
            value={{
                login,
                logout,
                user,
                setUser
            }}
        >

            {children}

        </AuthContext.Provider>

    );

}