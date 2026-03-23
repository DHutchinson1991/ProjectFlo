"use client";

import Dialog, { DialogProps } from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { ReactNode } from "react";

export interface FormDialogProps extends Omit<DialogProps, "children"> {
  /** Dialog title text */
  title: string;
  /** Form body */
  children: ReactNode;
  /** Label for submit button */
  submitLabel?: string;
  /** Called on submit click */
  onSubmit: () => void;
  /** Called on cancel / close */
  onCancel: () => void;
  /** Disables submit and shows spinner */
  submitting?: boolean;
  /** Disables submit without spinner */
  submitDisabled?: boolean;
}

/**
 * Standard dialog shell for create/edit forms.
 *
 * ```tsx
 * <FormDialog
 *   open={open}
 *   title="Create Estimate"
 *   onSubmit={handleSave}
 *   onCancel={() => setOpen(false)}
 *   submitting={isPending}
 * >
 *   <TextField ... />
 * </FormDialog>
 * ```
 */
export function FormDialog({
  title,
  children,
  submitLabel = "Save",
  onSubmit,
  onCancel,
  submitting = false,
  submitDisabled = false,
  ...rest
}: FormDialogProps) {
  return (
    <Dialog onClose={onCancel} maxWidth="sm" fullWidth {...rest}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={submitting || submitDisabled}
        >
          {submitting ? <CircularProgress size={20} /> : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
