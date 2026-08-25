import {
    Card,
    CardContent,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody
} from "@mui/material";

export default function TradeTable() {

    const trades = [
        {
            symbol: "BTC/USD",
            type: "BUY",
            amount: 500,
            profit: "+$45"
        },
        {
            symbol: "EUR/USD",
            type: "SELL",
            amount: 200,
            profit: "-$12"
        }
    ];

    return (
        <Card
            sx={{
                mt: 3,
                background: "#1e293b",
                color: "white"
            }}
        >
            <CardContent>

                <Typography
                    variant="h6"
                    mb={2}
                >
                    Open Trades
                </Typography>

                <Table>

                    <TableHead>

                        <TableRow>

                            <TableCell sx={{ color: "white" }}>
                                Symbol
                            </TableCell>

                            <TableCell sx={{ color: "white" }}>
                                Type
                            </TableCell>

                            <TableCell sx={{ color: "white" }}>
                                Amount
                            </TableCell>

                            <TableCell sx={{ color: "white" }}>
                                Profit
                            </TableCell>

                        </TableRow>

                    </TableHead>

                    <TableBody>

                        {trades.map((trade, index) => (

                            <TableRow key={index}>

                                <TableCell sx={{ color: "white" }}>
                                    {trade.symbol}
                                </TableCell>

                                <TableCell sx={{ color: "white" }}>
                                    {trade.type}
                                </TableCell>

                                <TableCell sx={{ color: "white" }}>
                                    ${trade.amount}
                                </TableCell>

                                <TableCell sx={{ color: "lime" }}>
                                    {trade.profit}
                                </TableCell>

                            </TableRow>

                        ))}

                    </TableBody>

                </Table>

            </CardContent>
        </Card>
    );
}