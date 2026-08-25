import { Box } from "@mui/material";

export default function DashboardLayout({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "white",
        padding: 3,
      }}
    >
      {children}
    </Box>
  );
}