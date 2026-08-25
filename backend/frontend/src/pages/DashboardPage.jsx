import { useState } from "react";
import { Button } from "@mui/material";

import OpenTradeDialog from "../components/trade/OpenTradeDialog";

import DashboardLayout from "../layouts/DashboardLayout";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import WalletCard from "../components/dashboard/WalletCard";
import PortfolioCard from "../components/dashboard/PortfolioCard";
import AISignalCard from "../components/dashboard/AISignalCard";
import TradeTable from "../components/trade/TradeTable";
import TradePanel from "../components/trade/TradePanel";
import MarketPanel from "../components/dashboard/MarketPanel";

export default function DashboardPage() {
  const [openTrade, setOpenTrade] = useState(false);  
  return (
    <DashboardLayout>
      <DashboardHeader />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <WalletCard />
        </Grid>

        <Grid item xs={12} md={4}>
          <PortfolioCard />
        </Grid>

        <Grid item xs={12} md={4}>
          <AISignalCard />
        </Grid>
      </Grid>

      <Button
    variant="contained"
    sx={{ mt: 3, mb: 2 }}
    onClick={() => setOpenTrade(true)}
>
    + Open Trade
</Button>

<OpenTradeDialog
    open={openTrade}
    handleClose={() => setOpenTrade(false)}
/>

      <TradePanel />
      <MarketPanel />
    </DashboardLayout>
  );
}