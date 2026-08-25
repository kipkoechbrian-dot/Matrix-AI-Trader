import { useEffect, useState } from "react";

import {
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Divider,
    List,
    ListItem
} from "@mui/material";

import { getAISignal } from "../../services/tradeService";

export default function AISignalCard() {

    const [signal, setSignal] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        async function loadSignal() {

            try {

                const data = await getAISignal("EURUSD");

                setSignal(data);

            } catch (err) {

                console.log(err);

            } finally {

                setLoading(false);

            }

        }

        loadSignal();

    }, []);

    return (

        <Card
            sx={{
                backgroundColor: "#1e293b",
                color: "white"
            }}
        >

            <CardContent>

                <Typography variant="h6">

                    AI Trading Signal

                </Typography>

                {loading ? (

                    <CircularProgress color="inherit"/>

                ) : (

                    <>

                        <Typography
                            variant="h4"
                            sx={{
                                color:
                                    signal.signal === "BUY"
                                        ? "#22c55e"
                                        : "#ef4444"
                            }}
                        >
                            {signal.signal}
                        </Typography>

                        <Typography>

                            {signal.symbol}

                        </Typography>

                        <Typography>

                            Confidence:
                            {" "}
                            {signal.confidence}%

                        </Typography>

                        <Divider
                            sx={{
                                my:2,
                                background:"#334155"
                            }}
                        />

                        <Typography>

                            Entry:
                            {" "}
                            {signal.entry_price}

                        </Typography>

                        <Typography>

                            Stop Loss:
                            {" "}
                            {signal.stop_loss}

                        </Typography>

                        <Typography>

                            Take Profit:
                            {" "}
                            {signal.take_profit}

                        </Typography>

                        <Typography>

                            Risk / Reward:
                            {" "}
                            {signal.risk_reward_ratio}

                        </Typography>

                        <Divider
                            sx={{
                                my:2,
                                background:"#334155"
                            }}
                        />

                        <Typography variant="subtitle2">

                            AI Reason

                        </Typography>

                        <List dense>

                            {signal.reason.map((item,index)=>(
                                <ListItem key={index}>
                                    • {item}
                                </ListItem>
                            ))}

                        </List>

                    </>

                )}

            </CardContent>

        </Card>

    );

}