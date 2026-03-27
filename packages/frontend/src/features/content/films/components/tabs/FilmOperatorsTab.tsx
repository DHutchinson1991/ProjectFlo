/**
 * Film Operators Tab - Shows operators assigned from the linked package
 * and which timeline tracks each operator owns
 *
 * Read-only view — operator-equipment assignments happen at the package level
 * Track → Operator assignments can be done in the timeline.
 */
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Stack, Chip, CircularProgress, Button,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import Link from "next/link";
import { filmsApi } from "../../api";
import { crewSlotsApi } from "@/features/workflow/scheduling/api";
import { PackageCrewSlot, TrackRecord, FilmOperatorsTabProps } from "../../types/operators-tab.types";
import { OperatorRow } from "./OperatorRow";

export const FilmOperatorsTab: React.FC<FilmOperatorsTabProps> = ({
  filmId,
  packageId,
}) => {
  const [operators, setOperators] = useState<PackageCrewSlot[]>([]);
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
          crewSlotsApi.packageDay.getAll(packageId),
          filmsApi.tracks.getAll(filmId),
        ]);
        if (isMounted) {
          setOperators(opData || []);
          setTracks((trackData || []) as unknown as TrackRecord[]);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load operators");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [packageId, filmId]);

  if (!packageId) {
    return (
      <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
        <LinkOffIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }} />
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          No Package Linked
        </Typography>
        <Typography variant="caption" color="text.disabled" display="block">
          This film isn&apos;t linked to a package yet. Operator assignments
          are managed at the package level — open the film from a package to see its crew.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 2, px: 2 }}>
        <Typography variant="caption" color="error">{error}</Typography>
      </Box>
    );
  }

  const dayMap = new Map<number, { name: string; operators: PackageCrewSlot[] }>();
  for (const op of operators) {
    const dayId = op.event_day_template_id;
    const dayName = op.event_day?.name || `Day ${dayId}`;
    if (!dayMap.has(dayId)) dayMap.set(dayId, { name: dayName, operators: [] });
    dayMap.get(dayId)!.operators.push(op);
  }
  const days = Array.from(dayMap.entries());

  if (operators.length === 0) {
    return (
      <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
        <GroupsIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }} />
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          No Operators Assigned
        </Typography>
        <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 2 }}>
          No crew has been assigned to this package yet.
        </Typography>
        <Button size="small" variant="outlined" component={Link} href={`/designer/packages/${packageId}`}
          endIcon={<OpenInNewIcon sx={{ fontSize: "0.85rem !important" }} />}
          sx={{ textTransform: "none", fontSize: "0.75rem" }}
        >
          Assign in Package
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <GroupsIcon sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography variant="subtitle2" fontWeight={700}>Crew ({operators.length})</Typography>
        </Stack>
        <Button size="small" component={Link} href={`/designer/packages/${packageId}`}
          endIcon={<OpenInNewIcon sx={{ fontSize: "0.8rem !important" }} />}
          sx={{ textTransform: "none", fontSize: "0.7rem", minWidth: 0 }}
        >
          Edit
        </Button>
      </Box>

      <Stack spacing={2}>
        {days.map(([dayId, { name, operators: dayOps }]) => (
          <Box key={dayId}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="overline" fontWeight={700} color="text.secondary"
                sx={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}
              >
                {name}
              </Typography>
              <Chip label={dayOps.length} size="small" sx={{ height: 16, fontSize: "0.55rem", fontWeight: 700 }} />
            </Box>
            <Stack spacing={1}>
              {dayOps.map((op) => (
                <OperatorRow key={op.id} operator={op}
                  assignedTracks={tracks.filter((t) => t.crew_member_id === op.crew_member_id)}
                />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
