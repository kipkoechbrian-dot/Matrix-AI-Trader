import { useState, useContext, useEffect } from "react";

import {
    Card,
    CardContent,
    Typography,
    TextField,
    MenuItem,
    Button
} from "@mui/material";

import {
    openTrade,
    getMarketPrice
} from "../../services/tradeService";

import { DashboardContext } from "../../contexts/DashboardContext";
import { TradesContext } from "../../contexts/TradesContext";

export default function TradePanel() {

    const { refreshDashboard } = useContext(DashboardContext);
    const { refreshTrades } = useContext(TradesContext);

    const [symbol, setSymbol] = useState("EURUSD");
    const [type, setType] = useState("BUY");
    const [amount, setAmount] = useState("");
    const [entryPrice, setEntryPrice] = useState(0);

    useEffect(() => {

        async function loadPrice() {

            try {

                const data = await getMarketPrice(symbol);

                setEntryPrice(data.price);

            }

            catch (err) {

                console.log(err);

            }

        }

        loadPrice();

    }, [symbol]);

    async function handleTrade() {

        try {

            await openTrade({

                symbol,

                trade_type: type,

                amount: Number(amount),

                entry_price: Number(entryPrice)

            });

            await refreshDashboard();

            await refreshTrades();

            setAmount("");

            alert("Trade Opened Successfully");

        }

        catch (err) {

            console.log(err);

            alert("Trade Failed");

        }

    }

    return (

        <Card sx={{ mt: 3 }}>

            <CardContent>

                <Typography variant="h6">

                    Open Trade

                </Typography>

                <TextField
                    select
                    fullWidth
                    margin="normal"
                    label="Symbol"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                >

                    <MenuItem value="EURUSD">

                        EURUSD

                    </MenuItem>

                    <MenuItem value="AAPL">

                        AAPL

                    </MenuItem>

                </TextField>

                <TextField
                    select
                    fullWidth
                    margin="normal"
                    label="Trade Type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >

                    <MenuItem value="BUY">

                        BUY

                    </MenuItem>

                    <MenuItem value="SELL">

                        SELL

                    </MenuItem>

                </TextField>

                <TextField
                    fullWidth
                    margin="normal"
                    label="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="Current Market Price"
                    value={entryPrice}
                    InputProps={{
                        readOnly: true
                    }}
                />

                <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={handleTrade}
                >

                    Open Trade

                </Button>

            </CardContent>

        </Card>

    );

}