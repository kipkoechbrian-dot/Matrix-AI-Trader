import { useContext } from "react";
import { DashboardContext } from "../../contexts/DashboardContext";

import {
    Card,
    CardContent,
    Typography,
    CircularProgress
} from "@mui/material";

export default function PortfolioCard() {

    const { dashboard, loading } = useContext(DashboardContext);

    return (
        <Card
            sx={{
                backgroundColor: "#1e293b",
                color: "white"
            }}
        >
            <CardContent>

                <Typography variant="h6">
                    Total Profit
                </Typography>

                {loading ? (

                    <CircularProgress color="inherit" />

                ) : (

                    <Typography
                        variant="h4"
                        color={
                            dashboard?.total_profit >= 0
                                ? "lime"
                                : "red"
                        }
                    >
                        $
                        {dashboard?.total_profit?.toFixed(2)}
                    </Typography>

                )}

                <Typography
                    sx={{
                        mt: 2
                    }}
                >
                    Win Rate:
                    {" "}
                    {dashboard?.win_rate}%
                </Typography>

            </CardContent>
        </Card>
    );
}