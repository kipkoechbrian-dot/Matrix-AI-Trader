import { useState } from "react";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem
} from "@mui/material";

import api from "../../services/api";

export default function OpenTradeDialog({ open, handleClose }) {

    const [symbol, setSymbol] = useState("BTC/USD");

    const [tradeType, setTradeType] = useState("BUY");

    const [amount, setAmount] = useState("");

    const [entryPrice, setEntryPrice] = useState("");

    async function openTrade() {

        try {

            await api.post("/trade/open", {

                symbol,

                trade_type: tradeType,

                amount: Number(amount),

                entry_price: Number(entryPrice)

            });

            alert("Trade Opened Successfully!");

            handleClose();

        }

        catch (err) {

            console.error(err);

            alert("Failed to open trade.");

        }

    }

    return (

        <Dialog open={open} onClose={handleClose}>

            <DialogTitle>

                Open New Trade

            </DialogTitle>

            <DialogContent>

                <TextField

                    fullWidth

                    select

                    label="Symbol"

                    margin="normal"

                    value={symbol}

                    onChange={(e)=>setSymbol(e.target.value)}

                >

                    <MenuItem value="BTC/USD">BTC/USD</MenuItem>

                    <MenuItem value="ETH/USD">ETH/USD</MenuItem>

                    <MenuItem value="EUR/USD">EUR/USD</MenuItem>

                    <MenuItem value="GBP/USD">GBP/USD</MenuItem>

                    <MenuItem value="XAU/USD">XAU/USD</MenuItem>

                </TextField>

                <TextField

                    fullWidth

                    select

                    label="Trade Type"

                    margin="normal"

                    value={tradeType}

                    onChange={(e)=>setTradeType(e.target.value)}

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

                    label="Amount"

                    margin="normal"

                    value={amount}

                    onChange={(e)=>setAmount(e.target.value)}

                />

                <TextField

                    fullWidth

                    label="Entry Price"

                    margin="normal"

                    value={entryPrice}

                    onChange={(e)=>setEntryPrice(e.target.value)}

                />

            </DialogContent>

            <DialogActions>

                <Button onClick={handleClose}>

                    Cancel

                </Button>

                <Button

                    variant="contained"

                    onClick={openTrade}

                >

                    Open Trade

                </Button>

            </DialogActions>

        </Dialog>

    );

}