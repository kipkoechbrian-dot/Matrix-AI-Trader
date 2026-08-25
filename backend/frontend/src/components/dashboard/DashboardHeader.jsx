import { Typography, Box } from "@mui/material";

export default function DashboardHeader() {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" fontWeight="bold">
        Matrix AI Trader
      </Typography>

      <Typography color="gray">
        Welcome back, Trader 👋
      </Typography>
    </Box>
  );
}