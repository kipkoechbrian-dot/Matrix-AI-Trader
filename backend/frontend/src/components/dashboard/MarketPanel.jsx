import { useEffect, useState } from "react";

import {
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Divider
} from "@mui/material";

import { getMarketPrice } from "../../services/tradeService";

export default function MarketPanel() {

    const [prices, setPrices] = useState(null);

    const [loading, setLoading] = useState(true);

    async function loadPrices() {

        try {

            const eurusd = await getMarketPrice("EURUSD");

            const aapl = await getMarketPrice("AAPL");

            setPrices({

                EURUSD: eurusd,

                AAPL: aapl

            });

        }

        catch (err) {

            console.log(err);

        }

        finally {

            setLoading(false);

        }

    }

    useEffect(() => {

        loadPrices();

        const timer = setInterval(loadPrices, 10000);

        return () => clearInterval(timer);

    }, []);

    return (

        <Card sx={{ mt: 3 }}>

            <CardContent>

                <Typography variant="h6">

                    Live Market

                </Typography>

                {loading ? (

                    <CircularProgress />

                ) : (

                    <>

                        <Typography>

                            EURUSD:
                            {" "}
                            {prices.EURUSD.price}

                        </Typography>

                        <Divider sx={{ my: 1 }} />

                        <Typography>

                            AAPL:
                            {" "}
                            {prices.AAPL.price}

                        </Typography>

                    </>

                )}

            </CardContent>

        </Card>

    );

}