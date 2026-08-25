import { useContext } from "react";
import { DashboardContext } from "../../contexts/DashboardContext";

import {
    Card,
    CardContent,
    Typography,
    CircularProgress
} from "@mui/material";

export default function WalletCard() {

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
                    Wallet Balance
                </Typography>

                {loading ? (

                    <CircularProgress color="inherit" />

                ) : (

                    <Typography variant="h4">
                        $
                        {dashboard?.wallet_balance?.toLocaleString(
                            undefined,
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }
                        )}
                    </Typography>

                )}

            </CardContent>
        </Card>
    );
}