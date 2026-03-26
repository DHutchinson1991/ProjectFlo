"use client";

import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
} from "@mui/material";

interface EquipmentConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function EquipmentConfirmDialog({ open, onClose, onConfirm }: EquipmentConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#141416",
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ color: "white", fontWeight: 700 }}>
        Reduce equipment?
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>
          Reducing cameras or audio will remove track assignments on those tracks. Continue?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{ bgcolor: "#FF6B6B", "&:hover": { bgcolor: "#e65a5a" } }}
        >
          Remove
        </Button>
      </DialogActions>
    </Dialog>
  );
}
