"use client";

import { Equipment } from "@/lib/types";
import { getSelectedIds, formatOptionLabel } from "../utils/equipment-panel-utils";
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem, FormHelperText,
} from "@mui/material";

interface EquipmentSlotSectionProps {
  type: "camera" | "audio";
  label: string;
  emptyLabel: string;
  selectPlaceholder: string;
  quantity: number;
  options: Equipment[];
  selections: Record<number, number | "">;
  onSelectionChange: (slotIndex: number, value: number | "") => void;
}

export function EquipmentSlotSection({
  type, label, emptyLabel, selectPlaceholder, quantity, options, selections, onSelectionChange,
}: EquipmentSlotSectionProps) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
        {label}
      </Typography>
      {quantity === 0 ? (
        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12, mt: 1 }}>
          {emptyLabel}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
          {Array.from({ length: quantity }, (_, index) => {
            const slotIndex = index + 1;
            const slotSelection = selections[slotIndex] ?? "";
            const selectedIds = new Set(getSelectedIds(selections));
            const slotLabel = `${type === "camera" ? "Camera" : "Audio"} ${slotIndex}`;
            return (
              <FormControl key={`${type}-slot-${slotIndex}`} fullWidth size="small">
                <InputLabel shrink sx={{ color: "rgba(255,255,255,0.5)" }}>{slotLabel}</InputLabel>
                <Select
                  value={slotSelection}
                  label={slotLabel}
                  onChange={(e) => onSelectionChange(slotIndex, e.target.value as number | "")}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) return selectPlaceholder;
                    const item = options.find((o) => o.id === selected);
                    return item ? formatOptionLabel(item) : selectPlaceholder;
                  }}
                  sx={{ color: "white" }}
                >
                  <MenuItem value=""><em>{selectPlaceholder}</em></MenuItem>
                  {options.map((item) => {
                    const isSelectedElsewhere = selectedIds.has(item.id) && slotSelection !== item.id;
                    return (
                      <MenuItem key={`${type}-option-${item.id}`} value={item.id} disabled={isSelectedElsewhere}>
                        {formatOptionLabel(item)}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            );
          })}
          {options.length < quantity && (
            <FormHelperText sx={{ color: "rgba(255,255,255,0.6)" }}>
              Not enough available {type === "camera" ? "cameras" : "audio recorders"} in your library.
            </FormHelperText>
          )}
        </Box>
      )}
    </Box>
  );
}
