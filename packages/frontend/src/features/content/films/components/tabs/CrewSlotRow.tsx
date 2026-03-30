import React from "react";
import {
  Box, Typography, Stack, Chip, Avatar, Paper, alpha, useTheme,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import VideocamIcon from "@mui/icons-material/Videocam";
import MicIcon from "@mui/icons-material/Mic";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PaletteIcon from "@mui/icons-material/Palette";
import { PackageCrewSlot, TrackRecord, EquipmentRecord } from "../../types/crew-slots-tab.types";

function GearChip({
  name, model, isPrimary, icon, accentColor,
}: {
  name: string; model?: string | null; isPrimary: boolean; icon?: React.ReactNode; accentColor: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, py: 0.25 }}>
      {icon && (
        <Box sx={{ color: accentColor, display: "flex", alignItems: "center" }}>{icon}</Box>
      )}
      <Typography
        variant="caption"
        sx={{ fontSize: "0.65rem", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {name}{model && ` (${model})`}
      </Typography>
      {isPrimary && (
        <Chip label="Primary" size="small" color="primary" variant="outlined"
          sx={{ height: 14, fontSize: "0.5rem", "& .MuiChip-label": { px: 0.5 } }}
        />
      )}
    </Box>
  );
}

const CAMERA_CATEGORIES = new Set(["CAMERA", "LENS"]);
const AUDIO_CATEGORIES = new Set(["AUDIO"]);

function categorizeGear(gear: EquipmentRecord[]) {
  const cameras = gear.filter((g) => g.equipment && CAMERA_CATEGORIES.has(g.equipment.category || ""));
  const audio = gear.filter((g) => g.equipment && AUDIO_CATEGORIES.has(g.equipment.category || ""));
  const other = gear.filter(
    (g) => g.equipment && !CAMERA_CATEGORIES.has(g.equipment.category || "") && !AUDIO_CATEGORIES.has(g.equipment.category || "")
  );
  return { cameras, audio, other };
}

export function CrewSlotRow({ crewSlot, assignedTracks }: { crewSlot: PackageCrewSlot; assignedTracks: TrackRecord[] }) {
  const theme = useTheme();
  const gear = crewSlot.equipment || [];
  const color = crewSlot.crew?.crew_color || "#EC4899";
  const displayName = crewSlot.label || crewSlot.job_role?.display_name || crewSlot.job_role?.name || "Crew";
  const displayRole = crewSlot.job_role?.display_name || crewSlot.job_role?.name || null;
  const { cameras, audio, other } = categorizeGear(gear);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5, borderRadius: 2, borderLeft: "3px solid", borderLeftColor: color,
        bgcolor: alpha(theme.palette.background.default, 0.4),
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: gear.length > 0 ? 1 : 0 }}>
        <Avatar sx={{ bgcolor: color, width: 28, height: 28, fontSize: "0.75rem" }}>
          <PersonIcon sx={{ fontSize: 16 }} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </Typography>
          {displayRole && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>{displayRole}</Typography>
          )}
        </Box>
        <Chip label={`${Number(crewSlot.hours)}h`} size="small" color="primary" variant="outlined"
          sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
        />
      </Box>

      {gear.length > 0 && (
        <Stack spacing={0.5} sx={{ ml: 5 }}>
          {cameras.map((g) => (
            <GearChip key={g.id} name={g.equipment?.item_name || "Camera"} model={g.equipment?.model}
              isPrimary={g.is_primary} icon={<VideocamIcon sx={{ fontSize: 11 }} />} accentColor={theme.palette.primary.main} />
          ))}
          {audio.map((g) => (
            <GearChip key={g.id} name={g.equipment?.item_name || "Audio"} model={g.equipment?.model}
              isPrimary={g.is_primary} icon={<MicIcon sx={{ fontSize: 11 }} />} accentColor={theme.palette.success.main} />
          ))}
          {other.map((g) => (
            <GearChip key={g.id} name={g.equipment?.item_name || "Gear"} model={g.equipment?.model}
              isPrimary={g.is_primary} accentColor={theme.palette.text.secondary} />
          ))}
        </Stack>
      )}

      {gear.length === 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ ml: 5, fontSize: "0.65rem" }}>
          No equipment assigned
        </Typography>
      )}

      {assignedTracks.length > 0 && (
        <Box sx={{ ml: 5, mt: gear.length > 0 ? 0.75 : 0 }}>
          <Typography variant="caption" color="text.disabled"
            sx={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", mb: 0.5 }}
          >
            Timeline Tracks
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {assignedTracks.map((trk) => {
              const trackType = (trk.type || "").toUpperCase();
              const trackIcon = trackType === "VIDEO" ? <VideocamIcon sx={{ fontSize: "10px !important" }} />
                : trackType === "AUDIO" ? <MicIcon sx={{ fontSize: "10px !important" }} />
                : trackType === "GRAPHICS" ? <PaletteIcon sx={{ fontSize: "10px !important" }} />
                : trackType === "MUSIC" ? <MusicNoteIcon sx={{ fontSize: "10px !important" }} />
                : null;
              return (
                <Chip key={trk.id} icon={trackIcon || undefined} label={trk.name} size="small"
                  sx={{
                    height: 18, fontSize: "0.55rem", fontWeight: 600,
                    bgcolor: alpha(color, 0.12), color,
                    border: `1px solid ${alpha(color, 0.3)}`,
                    "& .MuiChip-icon": { color }, "& .MuiChip-label": { px: 0.5 },
                  }}
                />
              );
            })}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
