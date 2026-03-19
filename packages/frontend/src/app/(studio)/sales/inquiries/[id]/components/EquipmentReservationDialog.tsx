"use client";

import React from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";
import { EventAvailable } from "@mui/icons-material";
import type { InquiryEquipmentAvailabilityRow } from "@/lib/types";
import InquiryActionDialog from "./InquiryActionDialog";

type ReservationStatus = "reserved" | "cancelled";

interface EquipmentReservationDialogProps {
  open: boolean;
  onClose: () => void;
  rows: InquiryEquipmentAvailabilityRow[];
  ownerName: string;
  reservationStatuses?: Map<number, { status: "reserved" | "cancelled" }>;
  emailSubject: string;
  emailBody: string;
  onEmailSubjectChange: (value: string) => void;
  onEmailBodyChange: (value: string) => void;
  onConfirm: () => void;
  onCancelReservation?: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function EquipmentReservationDialog({
  open,
  onClose,
  rows,
  ownerName,
  reservationStatuses = new Map(),
  emailSubject,
  emailBody,
  onEmailSubjectChange,
  onEmailBodyChange,
  onConfirm,
  onCancelReservation,
  loading = false,
  error,
}: EquipmentReservationDialogProps) {
  const allReserved = rows.length > 0 && rows.every((row) => reservationStatuses?.get(row.id)?.status === "reserved");
  const ownerEmail = rows[0]?.equipment.owner?.email;

  return (
    <InquiryActionDialog
      open={open}
      onClose={onClose}
      title={allReserved ? "Update Equipment Reservation" : "Reserve Equipment"}
      subtitle={`Confirm this equipment action for ${ownerName}`}
      icon={<EventAvailable sx={{ color: "#60a5fa", fontSize: 20 }} />}
      maxWidth="lg"
      primaryLabel={allReserved ? "Keep Reserved" : "Confirm Reservations"}
      primaryAction={onConfirm}
      secondaryLabel={allReserved && onCancelReservation ? "Cancel Reservations" : "Close"}
      secondaryAction={allReserved && onCancelReservation ? onCancelReservation : onClose}
      loading={loading}
      error={error}
      primaryDisabled={rows.length === 0}
    >
      {rows.length === 0 ? null : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: allReserved
              ? "1fr"
              : { xs: "1fr", md: "minmax(260px, 32%) minmax(0, 1fr)" },
            gap: 1.5,
            alignItems: "start",
          }}
        >
          <Stack spacing={0.75}>
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#e2e8f0" }}>
              {ownerName}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>
              {rows.length} item{rows.length !== 1 ? "s" : ""}
            </Typography>

            <Box
              sx={{
                mt: 1,
                p: 1,
                bgcolor: "rgba(15,23,42,0.3)",
                borderRadius: 1,
                border: "1px solid rgba(52,58,68,0.3)",
                maxHeight: { xs: 220, md: 420 },
                overflowY: "auto",
              }}
            >
              <Stack spacing={0.65}>
                {rows.map((row) => {
                  const rentalPrice = row.equipment.rental_price_per_day;
                  const fmtPrice = (n: number) => `£${Number.isInteger(n) ? n : n.toFixed(2)}`;
                  return (
                    <Box
                      key={row.id}
                      sx={{
                        p: 0.75,
                        borderRadius: 1,
                        border: "1px solid rgba(52,58,68,0.35)",
                        bgcolor: "rgba(2,6,23,0.35)",
                      }}
                    >
                      <Typography sx={{ fontSize: "0.78rem", color: "#e2e8f0", fontWeight: 600 }}>
                        {row.equipment.item_name}
                        {row.equipment.category ? ` (${row.equipment.category})` : ""}
                      </Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.15, flexWrap: "wrap" }}>
                        {row.event_day?.date ? (
                          <Typography sx={{ fontSize: "0.71rem", color: "#cbd5e1" }}>
                            {new Date(row.event_day.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                            {row.event_day.start_time || row.event_day.end_time ? ` · ${[row.event_day.start_time, row.event_day.end_time].filter(Boolean).join(" - ")}` : ""}
                          </Typography>
                        ) : null}
                        {rentalPrice != null && (
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#34d399" }}>
                            {fmtPrice(rentalPrice)} / day
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Stack>

          {!allReserved && (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
                {ownerEmail ? "Notification email to owner" : "Owner notification"}
              </Typography>
              {ownerEmail ? (
                <Stack spacing={1}>
                  <TextField
                    size="small"
                    label="Subject"
                    value={emailSubject}
                    onChange={(e) => onEmailSubjectChange(e.target.value)}
                    fullWidth
                    sx={textFieldSx}
                  />
                  <TextField
                    size="small"
                    label="Body"
                    value={emailBody}
                    onChange={(e) => onEmailBodyChange(e.target.value)}
                    fullWidth
                    multiline
                    rows={18}
                    sx={textFieldSx}
                  />
                </Stack>
              ) : (
                <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>
                  No email on file for this owner — reservation will be recorded internally.
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}
    </InquiryActionDialog>
  );
}

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(15,23,42,0.3)",
    "& fieldset": { borderColor: "rgba(52,58,68,0.6)" },
    "&:hover fieldset": { borderColor: "rgba(96,165,250,0.4)" },
    "&.Mui-focused fieldset": { borderColor: "#60a5fa" },
  },
  "& .MuiInputLabel-root": { color: "#64748b" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#60a5fa" },
  "& .MuiInputBase-input": { color: "#e2e8f0", fontSize: "0.8rem" },
  "& .MuiInputBase-inputMultiline": { fontSize: "0.78rem" },
};
