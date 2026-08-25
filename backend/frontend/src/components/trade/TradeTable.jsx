import { useContext } from "react";

import {
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell
} from "@mui/material";

import { TradesContext } from "../../contexts/TradesContext";

export default function TradeTable() {

    const {
        trades,
        loading
    } = useContext(TradesContext);

    return (

        <Card sx={{ mt: 3 }}>

            <CardContent>

                <Typography variant="h6">

                    Recent Trades

                </Typography>

                {loading ? (

                    <CircularProgress />

                ) : (

                    <Table>

                        <TableHead>

                            <TableRow>

                                <TableCell>Symbol</TableCell>

                                <TableCell>Type</TableCell>

                                <TableCell>Status</TableCell>

                                <TableCell>Profit</TableCell>

                            </TableRow>

                        </TableHead>

                        <TableBody>

                            {trades.map((trade) => (

                                <TableRow key={trade.id}>

                                    <TableCell>

                                        {trade.symbol}

                                    </TableCell>

                                    <TableCell>

                                        {trade.trade_type}

                                    </TableCell>

                                    <TableCell>

                                        {trade.status}

                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            color:
                                                trade.profit >= 0
                                                    ? "green"
                                                    : "red"
                                        }}
                                    >

                                        ${trade.profit.toFixed(2)}

                                    </TableCell>

                                </TableRow>

                            ))}

                        </TableBody>

                    </Table>

                )}

            </CardContent>

        </Card>

    );

}