import { createContext, useEffect, useState } from "react";
import { getDashboard } from "../services/tradeService";

export const DashboardContext = createContext();

export default function DashboardProvider({ children }) {

    const [dashboard, setDashboard] = useState(null);

    async function refreshDashboard() {

        try {

            const data = await getDashboard();

            setDashboard(data);

        }

        catch (err) {

            console.log(err);

        }

    }

    useEffect(() => {

        refreshDashboard();

    }, []);

    return (

        <DashboardContext.Provider
            value={{
                dashboard,
                refreshDashboard
            }}
        >

            {children}

        </DashboardContext.Provider>

    );

}  