"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

interface BeatEditorBeat {
  id?: number;
  name: string;
  duration_seconds: number;
  order_index?: number;
  shot_count?: number | null;
  recording_setup?: {
    camera_track_ids: number[];
    audio_track_ids: number[];
    graphics_enabled: boolean;
  } | null;
}

interface BeatEditorProps {
  open: boolean;
  beat: BeatEditorBeat | null;
  allTracks?: Array<{ id: number; name: string; track_type?: string }>;
  sceneRecordingSetup?: {
    camera_assignments?: Array<{ track_id: number }>;
    audio_track_ids?: number[];
    graphics_enabled?: boolean;
  } | null;
  onClose: () => void;
  onSave: (beat: BeatEditorBeat) => void;
  onDelete?: (beatId?: number) => void;
  /** The activity linked to this beat's parent scene */
  activity?: {
    id: number;
    name: string;
    start_time?: string | null;
    end_time?: string | null;
    duration_minutes?: number | null;
    package_event_day_id?: number | null;
    event_day_template_id?: number | null;
    dayName?: string | null;
  } | null;
  /** All package subjects (will be filtered to activity-inherited) */
  activitySubjects?: any[];
  /** All package operators (will be filtered to activity-inherited) */
  activityOperators?: any[];
}

const BeatEditor: React.FC<BeatEditorProps> = ({ open, beat, allTracks = [], sceneRecordingSetup, onClose, onSave, onDelete, activity, activitySubjects = [], activityOperators = [] }) => {
  const [name, setName] = React.useState(beat?.name || "");
  const [durationSeconds, setDurationSeconds] = React.useState<number>(beat?.duration_seconds || 10);
  const [shotCount, setShotCount] = React.useState<number>(beat?.shot_count || 0);
  const [selectedCameraTrackIds, setSelectedCameraTrackIds] = React.useState<number[]>([]);
  const [selectedAudioTrackIds, setSelectedAudioTrackIds] = React.useState<number[]>([]);
  const [graphicsEnabled, setGraphicsEnabled] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Derive subjects inherited from the linked activity
  const inheritedSubjects = React.useMemo(() => {
    if (!activity) return [];
    const eventDayTemplateId = activity.event_day_template_id ?? activity.package_event_day_id;
    return activitySubjects.filter((s: any) => {
      if (s.package_activity_id === activity.id) return true;
      if (s.activity_assignments?.some((a: any) => a.package_activity_id === activity.id)) return true;
      const hasNoAssignment = !s.package_activity_id && (!s.activity_assignments || s.activity_assignments.length === 0);
      if (hasNoAssignment && s.event_day_template_id === eventDayTemplateId) return true;
      return false;
    });
  }, [activitySubjects, activity]);

  // Derive crew inherited from the linked activity (deduplicated by template)
  const inheritedCrew = React.useMemo(() => {
    if (!activity) return [];
    const eventDayTemplateId = activity.event_day_template_id ?? activity.package_event_day_id;
    const matched = activityOperators.filter((o: any) => {
      if (o.package_activity_id === activity.id) return true;
      if (o.activity_assignments?.some((a: any) => a.package_activity_id === activity.id)) return true;
      const hasNoAssignment = !o.package_activity_id && (!o.activity_assignments || o.activity_assignments.length === 0);
      if (hasNoAssignment && o.event_day_template_id === eventDayTemplateId) return true;
      return false;
    });
    const seen = new Map<number, any>();
    matched.forEach((o: any) => {
      const crewId = o.contributor_id ?? o.id;
      if (!seen.has(crewId)) seen.set(crewId, o);
    });
    return Array.from(seen.values());
  }, [activityOperators, activity]);

  // Helper: format "HH:MM" → "12:30 PM"
  const fmtTime = (t: string | null | undefined) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return t;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  React.useEffect(() => {
    if (!open) return;
    setName(beat?.name || "");
    setDurationSeconds(beat?.duration_seconds || 10);
    setShotCount(beat?.shot_count || 0);

    const videoTracks = allTracks.filter((track) => (track.track_type || "").toLowerCase() === "video");
    const audioTracks = allTracks.filter((track) => (track.track_type || "").toLowerCase() === "audio");

    const sceneCameraIds = sceneRecordingSetup?.camera_assignments?.map((a) => a.track_id)
      || videoTracks.map((track) => track.id);
    const sceneAudioIds = sceneRecordingSetup?.audio_track_ids || audioTracks.map((track) => track.id);
    const sceneGraphicsEnabled = sceneRecordingSetup ? !!sceneRecordingSetup.graphics_enabled : false;

    setSelectedCameraTrackIds(beat?.recording_setup?.camera_track_ids || sceneCameraIds);
    setSelectedAudioTrackIds(beat?.recording_setup?.audio_track_ids || sceneAudioIds);
    setGraphicsEnabled(beat?.recording_setup?.graphics_enabled ?? sceneGraphicsEnabled);
    setError(null);
  }, [open, beat, allTracks, sceneRecordingSetup]);

  const toggleIdInList = (list: number[], id: number) => (
    list.includes(id) ? list.filter((value) => value !== id) : [...list, id]
  );

  const handleSave = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    onSave({
      id: beat?.id,
      name: name.trim(),
      duration_seconds: durationSeconds || 1,
      order_index: beat?.order_index,
      shot_count: shotCount || 0,
      recording_setup: {
        camera_track_ids: selectedCameraTrackIds,
        audio_track_ids: selectedAudioTrackIds,
        graphics_enabled: graphicsEnabled,
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={activity ? "sm" : "xs"} fullWidth PaperProps={{ sx: { bgcolor: '#1a1a1a', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.1)' } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: 'white' }}>
        <Typography sx={{ fontWeight: 600 }}>{beat?.id ? "Edit Beat" : "New Beat"}</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: activity ? '1fr 220px' : '1fr', gap: 2.5, mt: 1 }}>
          {/* ─── LEFT COLUMN: Fields + Recording Setup ─── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Beat Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!error}
              helperText={error || " "}
              autoFocus
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
              sx={{ input: { color: 'white' }, '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } }}
            />
            <TextField
              label="Duration (seconds)"
              type="number"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              inputProps={{ min: 1 }}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
              sx={{ input: { color: 'white' }, '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } }}
            />
            <TextField
              label="Shot Count"
              type="number"
              value={shotCount}
              onChange={(e) => setShotCount(Number(e.target.value))}
              inputProps={{ min: 0 }}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
              sx={{ input: { color: 'white' }, '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } }}
            />

            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", mb: 1 }}>
                Recording Setup (inherits scene by default)
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Video Tracks</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {allTracks.filter((track) => (track.track_type || "").toLowerCase() === "video").map((track) => (
                    <Button
                      key={track.id}
                      variant={selectedCameraTrackIds.includes(track.id) ? "contained" : "outlined"}
                      size="small"
                      onClick={() => setSelectedCameraTrackIds((prev) => toggleIdInList(prev, track.id))}
                      sx={{
                        bgcolor: selectedCameraTrackIds.includes(track.id) ? "#7B61FF" : "transparent",
                        color: "white",
                        borderColor: "rgba(255,255,255,0.2)",
                      }}
                    >
                      {track.name}
                    </Button>
                  ))}
                </Box>

                <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", mt: 1 }}>Audio Tracks</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {allTracks.filter((track) => (track.track_type || "").toLowerCase() === "audio").map((track) => (
                    <Button
                      key={track.id}
                      variant={selectedAudioTrackIds.includes(track.id) ? "contained" : "outlined"}
                      size="small"
                      onClick={() => setSelectedAudioTrackIds((prev) => toggleIdInList(prev, track.id))}
                      sx={{
                        bgcolor: selectedAudioTrackIds.includes(track.id) ? "#7B61FF" : "transparent",
                        color: "white",
                        borderColor: "rgba(255,255,255,0.2)",
                      }}
                    >
                      {track.name}
                    </Button>
                  ))}
                </Box>

                <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", mt: 1 }}>Graphics</Typography>
                <Button
                  variant={graphicsEnabled ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setGraphicsEnabled((prev) => !prev)}
                  sx={{
                    alignSelf: "flex-start",
                    bgcolor: graphicsEnabled ? "#7B61FF" : "transparent",
                    color: "white",
                    borderColor: "rgba(255,255,255,0.2)",
                  }}
                >
                  {graphicsEnabled ? "Graphics On" : "Graphics Off"}
                </Button>
              </Box>
            </Box>
          </Box>

          {/* ─── RIGHT COLUMN: Activity Context ─── */}
          {activity && (
            <Box sx={{ borderLeft: '1px solid rgba(255,255,255,0.06)', pl: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{
                bgcolor: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.12)',
                borderRadius: 1,
                px: 1.5,
                py: 1,
              }}>
                <Typography sx={{ fontSize: 10, color: 'rgba(245,158,11,0.55)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, mb: 0.5 }}>
                  Inherited from activity
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'rgba(245,158,11,1)', fontWeight: 700 }}>
                  {activity.name}
                </Typography>
                {(activity.start_time || activity.end_time) && (
                  <Typography sx={{ fontSize: 11, color: 'rgba(245,158,11,0.85)', fontWeight: 600, mt: 0.25 }}>
                    {fmtTime(activity.start_time)}
                    {activity.end_time && ` – ${fmtTime(activity.end_time)}`}
                  </Typography>
                )}
              </Box>

              {inheritedSubjects.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 10, color: 'rgba(167,139,250,0.6)', textTransform: 'uppercase', fontWeight: 700, mb: 0.5, letterSpacing: '0.05em' }}>
                    {inheritedSubjects.length} Subject{inheritedSubjects.length !== 1 && 's'}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {inheritedSubjects.map((s: any) => (
                      <Box key={s.id} sx={{
                        bgcolor: 'rgba(167,139,250,0.08)',
                        border: '1px solid rgba(167,139,250,0.12)',
                        borderRadius: 0.75,
                        px: 1,
                        py: 0.35,
                      }}>
                        <Typography sx={{ fontSize: 11, color: '#c4b5fd', fontWeight: 500 }}>{s.name}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {inheritedCrew.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 10, color: 'rgba(236,72,153,0.6)', textTransform: 'uppercase', fontWeight: 700, mb: 0.5, letterSpacing: '0.05em' }}>
                    {inheritedCrew.length} Crew
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {inheritedCrew.map((o: any) => (
                      <Box key={o.id} sx={{
                        bgcolor: 'rgba(236,72,153,0.08)',
                        border: '1px solid rgba(236,72,153,0.12)',
                        borderRadius: 0.75,
                        px: 1,
                        py: 0.35,
                      }}>
                        <Typography sx={{ fontSize: 11, color: '#f9a8d4', fontWeight: 500 }}>
                          {o.position_name || o.name || 'Crew'}
                          {(o.job_role?.display_name || o.job_role?.name) && ` · ${o.job_role?.display_name || o.job_role?.name}`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {beat?.id && onDelete ? (
          <Button color="error" startIcon={<DeleteIcon />} onClick={() => onDelete(beat.id)}>
            Delete
          </Button>
        ) : (
          <Box sx={{ flex: 1 }} />
        )}
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} sx={{ bgcolor: "#7B61FF" }}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BeatEditor;
