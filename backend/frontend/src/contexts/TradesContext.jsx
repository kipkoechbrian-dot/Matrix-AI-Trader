import { createContext, useEffect, useState } from "react";

import { getTrades } from "../services/tradeService";

export const TradesContext = createContext();

export default function TradesProvider({ children }) {

    const [trades, setTrades] = useState([]);

    const [loading, setLoading] = useState(true);

    async function refreshTrades() {

        try {

            setLoading(true);

            const data = await getTrades();

            setTrades(data);

        }

        catch (err) {

            console.log(err);

        }

        finally {

            setLoading(false);

        }

    }

    useEffect(() => {

        refreshTrades();

    }, []);

    return (

        <TradesContext.Provider
            value={{
                trades,
                loading,
                refreshTrades
            }}
        >

            {children}

        </TradesContext.Provider>

    );

}