import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import {
  getSettings,
  getDefaultSettings,
  saveSettings,
} from "../../services/settingsStore";

function SectionLabel({ children }) {
  return (
    <Typography
      sx={{ fontSize: "0.66rem", fontWeight: 900, letterSpacing: "0.18em", color: "#3b82f6" }}
    >
      {children}
    </Typography>
  );
}

/**
 * Terminal preferences — every switch in here genuinely changes
 * behavior (trade ticket defaults, close confirmation). Saved on-device.
 */
export default function SettingsDialog({ open, handleClose }) {
  const [form, setForm] = useState(getDefaultSettings());

  // Load the saved snapshot every time the dialog opens
  useEffect(() => {
    if (open) setForm({ ...getSettings() });
  }, [open]);

  const field = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSave() {
    saveSettings({
      defaultStake: String(Number(form.defaultStake) > 0 ? Number(form.defaultStake) : 100),
      defaultStopLossPct: String(Math.max(0, Number(form.defaultStopLossPct) || 0)),
      defaultTakeProfitPct: String(Math.max(0, Number(form.defaultTakeProfitPct) || 0)),
      confirmClose: Boolean(form.confirmClose),
    });
    toast.success("Settings saved — applied to your next trades.");
    handleClose();
  }

  function handleReset() {
    const defaults = getDefaultSettings();
    setForm(defaults);
    saveSettings(defaults);
    toast.info("Settings restored to factory defaults.");
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Terminal Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2.4} sx={{ mt: 0.5 }}>
          <SectionLabel>TRADE TICKET DEFAULTS</SectionLabel>

          <TextField
            label="Default stake (USD)"
            type="number"
            value={form.defaultStake}
            onChange={field("defaultStake")}
            helperText="Pre-filled on every new trade ticket."
            inputProps={{ min: 0, step: "any" }}
          />

          <Stack direction="row" spacing={1.4}>
            <TextField
              label="Stop-loss %"
              type="number"
              value={form.defaultStopLossPct}
              onChange={field("defaultStopLossPct")}
              inputProps={{ min: 0, step: "any" }}
              fullWidth
            />
            <TextField
              label="Take-profit %"
              type="number"
              value={form.defaultTakeProfitPct}
              onChange={field("defaultTakeProfitPct")}
              inputProps={{ min: 0, step: "any" }}
              fullWidth
            />
          </Stack>
          <Typography sx={{ fontSize: "0.72rem", color: "#5b6e96", mt: -1.2 }}>
            % distance from the live price used to pre-fill protection levels.
            Set 0 to leave them blank. The AI autofill can still overwrite.
          </Typography>

          <Divider sx={{ borderColor: "rgba(59,130,246,0.16)" }} />

          <SectionLabel>SAFETY</SectionLabel>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              px: 1.6,
              py: 1.2,
              borderRadius: "10px",
              border: "1px solid rgba(59,130,246,0.25)",
              background: "rgba(2,6,23,0.5)",
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>
                Confirm before closing
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#8ba3cf" }}>
                Shows live P&amp;L and asks before a manual close executes.
              </Typography>
            </Box>
            <Switch
              checked={Boolean(form.confirmClose)}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirmClose: e.target.checked }))
              }
            />
          </Box>

          <Button variant="text" onClick={handleReset} sx={{ alignSelf: "flex-start", color: "#8ba3cf" }}>
            Reset to factory defaults
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.4 }}>
        <Button onClick={handleClose} sx={{ color: "#8ba3cf" }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Save settings
        </Button>
      </DialogActions>
    </Dialog>
  );
}
