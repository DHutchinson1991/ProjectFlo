/**
 * Film Operators Tab - Shows operators assigned from the linked package
 * and which timeline tracks each operator owns
 *
 * Read-only view — operator-equipment assignments happen at the package level
 * Track → Operator assignments can be done in the timeline.
 */
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Avatar,
  Paper,
  CircularProgress,
  Button,
  alpha,
  useTheme,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import VideocamIcon from "@mui/icons-material/Videocam";
import MicIcon from "@mui/icons-material/Mic";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PaletteIcon from "@mui/icons-material/Palette";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import Link from "next/link";

import { api } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface EquipmentRecord {
  id: number;
  equipment_id: number;
  is_primary: boolean;
  equipment?: {
    id: number;
    item_name: string;
    model?: string | null;
    type?: string;
    category?: string;
  };
}

interface PackageDayOperator {
  id: number;
  package_id: number;
  event_day_template_id: number;
  operator_template_id: number;
  hours: number;
  notes?: string | null;
  order_index: number;
  operator_template: {
    id: number;
    name: string;
    role?: string | null;
    color?: string | null;
    default_equipment: EquipmentRecord[];
  };
  equipment: EquipmentRecord[];
  event_day?: { id: number; name: string };
}

interface TrackRecord {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  operator_template_id: number | null;
  operator_template: { id: number; name: string; role: string; color: string } | null;
}

interface FilmOperatorsTabProps {
  filmId: number;
  packageId?: number | null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const FilmOperatorsTab: React.FC<FilmOperatorsTabProps> = ({
  filmId,
  packageId,
}) => {
  const [operators, setOperators] = useState<PackageDayOperator[]>([]);
  const [tracks, setTracks] = useState<TrackRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!packageId) {
      setOperators([]);
      setTracks([]);
      return;
    }

    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [opData, trackData] = await Promise.all([
          api.operators.packageDay.getAll(packageId),
          api.films.tracks.getAll(filmId),
        ]);
        if (isMounted) {
          setOperators(opData || []);
          setTracks((trackData || []) as unknown as TrackRecord[]);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load operators"
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [packageId, filmId]);

  // ─── No package linked ──────────────────────────────────────────────
  if (!packageId) {
    return (
      <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
        <LinkOffIcon
          sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }}
        />
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          No Package Linked
        </Typography>
        <Typography variant="caption" color="text.disabled" display="block">
          This film isn&apos;t linked to a package yet. Operator assignments
          are managed at the package level — open the film from a package to
          see its crew.
        </Typography>
      </Box>
    );
  }

  // ─── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        py={4}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <Box sx={{ py: 2, px: 2 }}>
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  // ─── Group operators by event day ───────────────────────────────────
  const dayMap = new Map<
    number,
    { name: string; operators: PackageDayOperator[] }
  >();
  for (const op of operators) {
    const dayId = op.event_day_template_id;
    const dayName = op.event_day?.name || `Day ${dayId}`;
    if (!dayMap.has(dayId)) {
      dayMap.set(dayId, { name: dayName, operators: [] });
    }
    dayMap.get(dayId)!.operators.push(op);
  }
  const days = Array.from(dayMap.entries());

  // ─── Empty state ────────────────────────────────────────────────────
  if (operators.length === 0) {
    return (
      <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
        <GroupsIcon
          sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }}
        />
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          No Operators Assigned
        </Typography>
        <Typography
          variant="caption"
          color="text.disabled"
          display="block"
          sx={{ mb: 2 }}
        >
          No crew has been assigned to this package yet.
        </Typography>
        <Button
          size="small"
          variant="outlined"
          component={Link}
          href={`/designer/packages/${packageId}`}
          endIcon={<OpenInNewIcon sx={{ fontSize: "0.85rem !important" }} />}
          sx={{ textTransform: "none", fontSize: "0.75rem" }}
        >
          Assign in Package
        </Button>
      </Box>
    );
  }

  // ─── Operator list grouped by day ───────────────────────────────────
  return (
    <Box sx={{ px: 1 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <GroupsIcon sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography variant="subtitle2" fontWeight={700}>
            Crew ({operators.length})
          </Typography>
        </Stack>
        <Button
          size="small"
          component={Link}
          href={`/designer/packages/${packageId}`}
          endIcon={<OpenInNewIcon sx={{ fontSize: "0.8rem !important" }} />}
          sx={{ textTransform: "none", fontSize: "0.7rem", minWidth: 0 }}
        >
          Edit
        </Button>
      </Box>

      <Stack spacing={2}>
        {days.map(([dayId, { name, operators: dayOps }]) => (
          <Box key={dayId}>
            {/* Day header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <Typography
                variant="overline"
                fontWeight={700}
                color="text.secondary"
                sx={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}
              >
                {name}
              </Typography>
              <Chip
                label={dayOps.length}
                size="small"
                sx={{
                  height: 16,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                }}
              />
            </Box>

            {/* Operator cards */}
            <Stack spacing={1}>
              {dayOps.map((op) => (
                <OperatorRow
                  key={op.id}
                  operator={op}
                  assignedTracks={tracks.filter(
                    (t) => t.operator_template_id === op.operator_template_id
                  )}
                />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

// ─── Operator Row ───────────────────────────────────────────────────────────

function OperatorRow({ operator, assignedTracks }: { operator: PackageDayOperator; assignedTracks: TrackRecord[] }) {
  const theme = useTheme();
  const tmpl = operator.operator_template;
  const gear = operator.equipment || [];
  const color = tmpl?.color || "#EC4899";

  // Split by equipment category (more reliable than type)
  const cameraCategories = new Set(["CAMERA", "LENS"]);
  const audioCategories = new Set(["AUDIO"]);

  const cameras = gear.filter(
    (g) => g.equipment && cameraCategories.has((g.equipment as any).category || "")
  );
  const audio = gear.filter(
    (g) => g.equipment && audioCategories.has((g.equipment as any).category || "")
  );
  const other = gear.filter(
    (g) =>
      g.equipment &&
      !cameraCategories.has((g.equipment as any).category || "") &&
      !audioCategories.has((g.equipment as any).category || "")
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        borderLeft: "3px solid",
        borderLeftColor: color,
        bgcolor: alpha(theme.palette.background.default, 0.4),
      }}
    >
      {/* Operator header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: gear.length > 0 ? 1 : 0 }}>
        <Avatar
          sx={{
            bgcolor: color,
            width: 28,
            height: 28,
            fontSize: "0.75rem",
          }}
        >
          <PersonIcon sx={{ fontSize: 16 }} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {tmpl?.name || "Operator"}
          </Typography>
          {tmpl?.role && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.65rem" }}
            >
              {tmpl.role}
            </Typography>
          )}
        </Box>
        <Chip
          label={`${Number(operator.hours)}h`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
        />
      </Box>

      {/* Equipment list */}
      {gear.length > 0 && (
        <Stack spacing={0.5} sx={{ ml: 5 }}>
          {cameras.map((g) => (
            <GearChip
              key={g.id}
              name={g.equipment?.item_name || "Camera"}
              model={g.equipment?.model}
              isPrimary={g.is_primary}
              icon={<VideocamIcon sx={{ fontSize: 11 }} />}
              accentColor={theme.palette.primary.main}
            />
          ))}
          {audio.map((g) => (
            <GearChip
              key={g.id}
              name={g.equipment?.item_name || "Audio"}
              model={g.equipment?.model}
              isPrimary={g.is_primary}
              icon={<MicIcon sx={{ fontSize: 11 }} />}
              accentColor={theme.palette.success.main}
            />
          ))}
          {other.map((g) => (
            <GearChip
              key={g.id}
              name={g.equipment?.item_name || "Gear"}
              model={g.equipment?.model}
              isPrimary={g.is_primary}
              accentColor={theme.palette.text.secondary}
            />
          ))}
        </Stack>
      )}

      {gear.length === 0 && (
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ ml: 5, fontSize: "0.65rem" }}
        >
          No equipment assigned
        </Typography>
      )}

      {/* Assigned timeline tracks */}
      {assignedTracks.length > 0 && (
        <Box sx={{ ml: 5, mt: gear.length > 0 ? 0.75 : 0 }}>
          <Typography
            variant="caption"
            color="text.disabled"
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
                <Chip
                  key={trk.id}
                  icon={trackIcon || undefined}
                  label={trk.name}
                  size="small"
                  sx={{
                    height: 18, fontSize: "0.55rem", fontWeight: 600,
                    bgcolor: alpha(color, 0.12),
                    color: color,
                    border: `1px solid ${alpha(color, 0.3)}`,
                    "& .MuiChip-icon": { color: color },
                    "& .MuiChip-label": { px: 0.5 },
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

// ─── Gear Chip ──────────────────────────────────────────────────────────────

function GearChip({
  name,
  model,
  isPrimary,
  icon,
  accentColor,
}: {
  name: string;
  model?: string | null;
  isPrimary: boolean;
  icon?: React.ReactNode;
  accentColor: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        py: 0.25,
      }}
    >
      {icon && (
        <Box sx={{ color: accentColor, display: "flex", alignItems: "center" }}>
          {icon}
        </Box>
      )}
      <Typography
        variant="caption"
        sx={{
          fontSize: "0.65rem",
          color: "text.secondary",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
        {model && ` (${model})`}
      </Typography>
      {isPrimary && (
        <Chip
          label="Primary"
          size="small"
          color="primary"
          variant="outlined"
          sx={{
            height: 14,
            fontSize: "0.5rem",
            "& .MuiChip-label": { px: 0.5 },
          }}
        />
      )}
    </Box>
  );
}
