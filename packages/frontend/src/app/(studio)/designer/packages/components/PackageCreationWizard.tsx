'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  Backdrop,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Stack,
  Alert,
  Collapse,
  Tooltip,
  Select,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import PlaceIcon from '@mui/icons-material/Place';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VideocamIcon from '@mui/icons-material/Videocam';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import GroupsIcon from '@mui/icons-material/Groups';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MicIcon from '@mui/icons-material/Mic';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EventTypeSelector, { EventTypeForWizard } from './EventTypeSelector';
import { api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';

// ── Types ────────────────────────────────────────────────────────────
interface CustomMoment {
  tempId: string;
  name: string;
  isKeyMoment: boolean;
}

interface CustomActivity {
  tempId: string;
  name: string;
  dayLinkId: number;
  startTime: string;
  durationMinutes: number;
  moments: CustomMoment[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CrewMember = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EquipmentItem = any;

interface CrewAssignment {
  contributorId: number;
  jobRoleIds: number[];
  positionColor?: string;
}

interface CameraAudioSlot {
  slotNumber: number;
  equipmentId: number | null;
  assignedContributorId: number | null;
  assignedJobRoleId: number | null;
}

interface PackageCreationWizardProps {
  open?: boolean;
  onClose: () => void;
  onPackageCreated: (packageId: number) => void;
  fullPage?: boolean;
}

export default function PackageCreationWizard({
  open = true,
  onClose,
  onPackageCreated,
  fullPage = false,
}: PackageCreationWizardProps) {
  const { currentBrand } = useBrand();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedEventType, setSelectedEventType] = useState<EventTypeForWizard | null>(null);
  const [selectedDayIds, setSelectedDayIds] = useState<Set<number>>(new Set());
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<number>>(new Set());
  const [selectedMomentIds, setSelectedMomentIds] = useState<Set<number>>(new Set());
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set());
  const [locationCount, setLocationCount] = useState(3);
  const [packageName, setPackageName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expand state
  const [expandedPresets, setExpandedPresets] = useState<Set<number>>(new Set());
  const [expandedReviewPresets, setExpandedReviewPresets] = useState<Set<number>>(new Set());

  // Activity time/duration overrides (preset ID → value)
  const [presetTimeOverrides, setPresetTimeOverrides] = useState<Record<number, string>>({});
  const [presetDurationOverrides, setPresetDurationOverrides] = useState<Record<number, number>>({});

  // Moment key-moment overrides (moment ID → is_key)
  const [momentKeyOverrides, setMomentKeyOverrides] = useState<Record<number, boolean>>({});

  // Custom activities with moments
  const [customActivities, setCustomActivities] = useState<CustomActivity[]>([]);
  const [addingActivityForDay, setAddingActivityForDay] = useState<number | null>(null);
  const [newActivityName, setNewActivityName] = useState('');
  const [addingMomentForActivity, setAddingMomentForActivity] = useState<string | null>(null);
  const [newMomentName, setNewMomentName] = useState('');

  // Crew state
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [crewAssignments, setCrewAssignments] = useState<CrewAssignment[]>([]);
  const [loadingCrew, setLoadingCrew] = useState(false);

  // Equipment state
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [cameraSlots, setCameraSlots] = useState<CameraAudioSlot[]>([
    { slotNumber: 1, equipmentId: null, assignedContributorId: null, assignedJobRoleId: null },
  ]);
  const [audioSlots, setAudioSlots] = useState<CameraAudioSlot[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const steps = [
    'Event', 'Days', 'Activities', 'Subjects', 'Locations', 'Name', 'Crew', 'Equipment', 'Review',
  ];

  // ── Fetch crew & equipment ─────────────────────────────────────────
  const fetchCrew = useCallback(async () => {
    if (!currentBrand?.id) return;
    setLoadingCrew(true);
    try {
      const data = await api.crew.getByBrand(currentBrand.id);
      setCrewMembers(data || []);
    } catch {
      setCrewMembers([]);
    } finally {
      setLoadingCrew(false);
    }
  }, [currentBrand?.id]);

  const fetchEquipment = useCallback(async () => {
    setLoadingEquipment(true);
    try {
      const data = await api.equipment.getAll();
      setEquipmentItems(data || []);
    } catch {
      setEquipmentItems([]);
    } finally {
      setLoadingEquipment(false);
    }
  }, []);

  // Fetch on step entry
  useEffect(() => {
    if (activeStep === 6 && crewMembers.length === 0) fetchCrew();
    if (activeStep === 7 && equipmentItems.length === 0) fetchEquipment();
  }, [activeStep, crewMembers.length, equipmentItems.length, fetchCrew, fetchEquipment]);

  // ── Helpers ────────────────────────────────────────────────────────
  const getPresetIdsForDays = (et: EventTypeForWizard, dayIds: Set<number>) => {
    const ids = new Set<number>();
    et.event_days.filter((ed) => dayIds.has(ed.id)).forEach((ed) =>
      ed.event_day_template.activity_presets.forEach((p) => ids.add(p.id)),
    );
    return ids;
  };

  const getAllMomentIdsForPresets = (et: EventTypeForWizard, presetIds: Set<number>) => {
    const ids = new Set<number>();
    et.event_days.forEach((ed) =>
      ed.event_day_template.activity_presets
        .filter((p) => presetIds.has(p.id))
        .forEach((p) => p.moments?.forEach((m) => ids.add(m.id))),
    );
    return ids;
  };

  const getAllRoleIds = (et: EventTypeForWizard) => {
    const ids = new Set<number>();
    et.subject_types.forEach((st) =>
      st.subject_type_template.roles.forEach((r) => ids.add(r.id)),
    );
    return ids;
  };

  const getPresetTime = (preset: { id: number; default_start_time?: string | null }) =>
    presetTimeOverrides[preset.id] ?? preset.default_start_time ?? '';

  const getPresetDuration = (preset: { id: number; default_duration_minutes?: number | null }) =>
    presetDurationOverrides[preset.id] ?? preset.default_duration_minutes ?? 60;

  const isMomentKey = (moment: { id: number; is_key_moment?: boolean }) =>
    momentKeyOverrides[moment.id] ?? moment.is_key_moment ?? false;

  const getCrewName = (cm: CrewMember) => {
    const c = cm.contact;
    if (c?.first_name || c?.last_name) return `${c.first_name || ''} ${c.last_name || ''}`.trim();
    return c?.email || 'Unnamed';
  };

  const getCrewPrimaryRole = (cm: CrewMember): string => {
    const primary = cm.contributor_job_roles?.find((r: { is_primary: boolean }) => r.is_primary);
    if (primary) return primary.job_role?.display_name || primary.job_role?.name || '';
    if (cm.contributor_job_roles?.length > 0) {
      const first = cm.contributor_job_roles[0];
      return first.job_role?.display_name || first.job_role?.name || '';
    }
    return '';
  };

  // ── Derived data ───────────────────────────────────────────────────
  const selectedDays = useMemo(() => {
    if (!selectedEventType) return [];
    return selectedEventType.event_days
      .filter((ed) => selectedDayIds.has(ed.id))
      .sort((a, b) => a.order_index - b.order_index);
  }, [selectedEventType, selectedDayIds]);

  const stats = useMemo(() => {
    if (!selectedEventType)
      return { days: 0, activities: 0, moments: 0, subjects: 0, locations: 0, crew: 0, equipment: 0 };
    const activities =
      selectedDays.reduce(
        (sum, ed) =>
          sum + ed.event_day_template.activity_presets.filter((p) => selectedPresetIds.has(p.id)).length,
        0,
      ) + customActivities.filter((ca) => selectedDayIds.has(ca.dayLinkId)).length;
    const moments =
      selectedDays.reduce(
        (sum, ed) =>
          sum +
          ed.event_day_template.activity_presets
            .filter((p) => selectedPresetIds.has(p.id))
            .reduce((ms, p) => ms + (p.moments?.filter((m) => selectedMomentIds.has(m.id)).length || 0), 0),
        0,
      ) + customActivities.reduce((s, ca) => s + ca.moments.length, 0);
    const subjects = selectedEventType.subject_types.reduce(
      (sum, st) =>
        sum + st.subject_type_template.roles.filter((r) => selectedRoleIds.has(r.id)).length,
      0,
    );
    return {
      days: selectedDays.length,
      activities,
      moments,
      subjects,
      locations: locationCount,
      crew: crewAssignments.length,
      equipment: cameraSlots.filter((s) => s.equipmentId !== null).length + audioSlots.filter((s) => s.equipmentId !== null).length,
    };
  }, [selectedEventType, selectedDays, selectedPresetIds, selectedMomentIds, selectedRoleIds, locationCount, customActivities, crewAssignments, cameraSlots, audioSlots]);

  const totalPresetsInSelectedDays = useMemo(
    () => selectedDays.reduce((s, ed) => s + ed.event_day_template.activity_presets.length, 0),
    [selectedDays],
  );

  const totalRoles = useMemo(() => {
    if (!selectedEventType) return 0;
    return selectedEventType.subject_types.reduce(
      (s, st) => s + st.subject_type_template.roles.length, 0,
    );
  }, [selectedEventType]);

  // Group equipment by category
  const equipmentByCategory = useMemo(() => {
    const groups: Record<string, EquipmentItem[]> = {};
    equipmentItems.forEach((eq) => {
      const cat = eq.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(eq);
    });
    return groups;
  }, [equipmentItems]);

  // Filtered equipment by camera/audio
  const cameraEquipment = useMemo(() => equipmentItems.filter((eq: EquipmentItem) => eq.category === 'CAMERA'), [equipmentItems]);
  const audioEquipment = useMemo(() => equipmentItems.filter((eq: EquipmentItem) => eq.category === 'AUDIO'), [equipmentItems]);

  const equipmentOperatorOptions = useMemo(() => {
    return crewAssignments.flatMap((assignment) => {
      const crewMember = crewMembers.find((cm: CrewMember) => cm.id === assignment.contributorId);
      if (!crewMember) return [];

      return assignment.jobRoleIds.map((jobRoleId) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const role = crewMember.contributor_job_roles?.find((r: any) => r.job_role.id === jobRoleId);
        const roleName = role?.job_role?.display_name || role?.job_role?.name || 'Crew';

        return {
          contributorId: assignment.contributorId,
          jobRoleId,
          label: `${getCrewName(crewMember)} · ${roleName}`,
          color: assignment.positionColor || crewMember.crew_color || '#818cf8',
        };
      });
    });
  }, [crewAssignments, crewMembers]);

  // Filtered options for camera slots — only show crew assigned with a Videographer role
  const cameraOperatorOptions = useMemo(() => {
    return equipmentOperatorOptions.filter((opt) => {
      const crewMember = crewMembers.find((cm: CrewMember) => cm.id === opt.contributorId);
      if (!crewMember) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const role = crewMember.contributor_job_roles?.find((r: any) => r.job_role.id === opt.jobRoleId);
      const roleName = (role?.job_role?.display_name || role?.job_role?.name || '').toLowerCase();
      return roleName.includes('videographer');
    });
  }, [equipmentOperatorOptions, crewMembers]);

  useEffect(() => {
    const isValidAssignment = (slot: CameraAudioSlot) => {
      if (!slot.assignedContributorId || !slot.assignedJobRoleId) return true;
      return equipmentOperatorOptions.some(
        (option) =>
          option.contributorId === slot.assignedContributorId
          && option.jobRoleId === slot.assignedJobRoleId,
      );
    };

    setCameraSlots((prev) => prev.map((slot) => (
      isValidAssignment(slot)
        ? slot
        : { ...slot, assignedContributorId: null, assignedJobRoleId: null }
    )));
    setAudioSlots((prev) => prev.map((slot) => (
      isValidAssignment(slot)
        ? slot
        : { ...slot, assignedContributorId: null, assignedJobRoleId: null }
    )));
  }, [equipmentOperatorOptions]);

  // Group crew by primary role
  const crewByRole = useMemo(() => {
    const groups: Record<string, CrewMember[]> = {};
    crewMembers.forEach((cm) => {
      const role = getCrewPrimaryRole(cm) || 'Unassigned';
      if (!groups[role]) groups[role] = [];
      groups[role].push(cm);
    });
    return groups;
  }, [crewMembers]);

  // ── Toggle handlers ────────────────────────────────────────────────
  const toggleDay = (dayId: number) => {
    if (!selectedEventType) return;
    const dayLink = selectedEventType.event_days.find((ed) => ed.id === dayId);
    if (!dayLink) return;
    const presetIds = dayLink.event_day_template.activity_presets.map((p) => p.id);
    const momentIds = dayLink.event_day_template.activity_presets.flatMap(
      (p) => p.moments?.map((m) => m.id) || [],
    );
    if (selectedDayIds.has(dayId)) {
      setSelectedDayIds((prev) => { const n = new Set(prev); n.delete(dayId); return n; });
      setSelectedPresetIds((prev) => { const n = new Set(prev); presetIds.forEach((id) => n.delete(id)); return n; });
      setSelectedMomentIds((prev) => { const n = new Set(prev); momentIds.forEach((id) => n.delete(id)); return n; });
    } else {
      setSelectedDayIds((prev) => new Set(prev).add(dayId));
      setSelectedPresetIds((prev) => { const n = new Set(prev); presetIds.forEach((id) => n.add(id)); return n; });
      setSelectedMomentIds((prev) => { const n = new Set(prev); momentIds.forEach((id) => n.add(id)); return n; });
    }
  };

  const togglePreset = (id: number) => {
    if (!selectedEventType) return;
    if (selectedPresetIds.has(id)) {
      const momentIdsToRemove: number[] = [];
      selectedEventType.event_days.forEach((ed) =>
        ed.event_day_template.activity_presets
          .filter((p) => p.id === id)
          .forEach((p) => p.moments?.forEach((m) => momentIdsToRemove.push(m.id))),
      );
      setSelectedPresetIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      setSelectedMomentIds((prev) => { const n = new Set(prev); momentIdsToRemove.forEach((mid) => n.delete(mid)); return n; });
    } else {
      setSelectedPresetIds((prev) => new Set(prev).add(id));
    }
  };

  const toggleMoment = (id: number) => {
    setSelectedMomentIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleMomentKey = (momentId: number, currentIsKey: boolean) => {
    setMomentKeyOverrides((prev) => ({ ...prev, [momentId]: !currentIsKey }));
  };

  const selectAllMomentsForPreset = (presetId: number) => {
    if (!selectedEventType) return;
    selectedEventType.event_days.forEach((ed) =>
      ed.event_day_template.activity_presets
        .filter((p) => p.id === presetId)
        .forEach((p) =>
          setSelectedMomentIds((prev) => { const n = new Set(prev); p.moments?.forEach((m) => n.add(m.id)); return n; }),
        ),
    );
  };

  const deselectAllMomentsForPreset = (presetId: number) => {
    if (!selectedEventType) return;
    selectedEventType.event_days.forEach((ed) =>
      ed.event_day_template.activity_presets
        .filter((p) => p.id === presetId)
        .forEach((p) =>
          setSelectedMomentIds((prev) => { const n = new Set(prev); p.moments?.forEach((m) => n.delete(m.id)); return n; }),
        ),
    );
  };

  const toggleRole = (id: number) => {
    setSelectedRoleIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleExpandPreset = (id: number) => {
    setExpandedPresets((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleExpandReviewPreset = (id: number) => {
    setExpandedReviewPresets((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  // ── Crew assignment handlers ───────────────────────────────────────
  const addCrewMember = (cm: CrewMember) => {
    if (crewAssignments.some((a) => a.contributorId === cm.id)) return;
    const primaryRole = cm.contributor_job_roles?.find((r: { is_primary: boolean }) => r.is_primary);
    const firstRole = primaryRole || cm.contributor_job_roles?.[0];
    if (!firstRole) return;
    setCrewAssignments((prev) => [
      ...prev,
      {
        contributorId: cm.id,
        jobRoleIds: [firstRole.job_role.id],
        positionColor: cm.crew_color,
      },
    ]);
  };

  const removeCrewMember = (contributorId: number) => {
    setCrewAssignments((prev) => prev.filter((a) => a.contributorId !== contributorId));
  };

  const toggleCrewRole = (contributorId: number, roleId: number) => {
    setCrewAssignments((prev) =>
      prev.map((a) => {
        if (a.contributorId !== contributorId) return a;
        const has = a.jobRoleIds.includes(roleId);
        // Don't allow removing the last role
        if (has && a.jobRoleIds.length <= 1) return a;
        return {
          ...a,
          jobRoleIds: has
            ? a.jobRoleIds.filter((id) => id !== roleId)
            : [...a.jobRoleIds, roleId],
        };
      }),
    );
  };

  // ── Equipment slot handlers ────────────────────────────────────────
  const addCameraSlot = () => {
    setCameraSlots((prev) => [
      ...prev,
      { slotNumber: prev.length + 1, equipmentId: null, assignedContributorId: null, assignedJobRoleId: null },
    ]);
  };
  const removeCameraSlot = (slotNumber: number) => {
    setCameraSlots((prev) => prev
      .filter((s) => s.slotNumber !== slotNumber)
      .map((s, i) => ({ ...s, slotNumber: i + 1 })));
  };
  const updateCameraSlot = (slotNumber: number, equipmentId: number | null) => {
    setCameraSlots((prev) => prev.map((s) => (
      s.slotNumber === slotNumber
        ? { ...s, equipmentId }
        : s
    )));
  };

  const addAudioSlot = () => {
    setAudioSlots((prev) => [
      ...prev,
      { slotNumber: prev.length + 1, equipmentId: null, assignedContributorId: null, assignedJobRoleId: null },
    ]);
  };
  const removeAudioSlot = (slotNumber: number) => {
    setAudioSlots((prev) => prev
      .filter((s) => s.slotNumber !== slotNumber)
      .map((s, i) => ({ ...s, slotNumber: i + 1 })));
  };
  const updateAudioSlot = (slotNumber: number, equipmentId: number | null) => {
    setAudioSlots((prev) => prev.map((s) => (
      s.slotNumber === slotNumber
        ? { ...s, equipmentId }
        : s
    )));
  };

  const updateSlotAssignment = (
    slotType: 'CAMERA' | 'AUDIO',
    slotNumber: number,
    value: string,
  ) => {
    const [contributorValue, roleValue] = value ? value.split(':') : [];
    const assignedContributorId = contributorValue ? Number(contributorValue) : null;
    const assignedJobRoleId = roleValue ? Number(roleValue) : null;
    const updater = (slots: CameraAudioSlot[]) => slots.map((slot) => (
      slot.slotNumber === slotNumber
        ? { ...slot, assignedContributorId, assignedJobRoleId }
        : slot
    ));

    if (slotType === 'CAMERA') {
      setCameraSlots(updater);
    } else {
      setAudioSlots(updater);
    }
  };

  // ── Custom activity handlers ───────────────────────────────────────
  const handleAddCustomActivity = (dayLinkId: number) => {
    if (!newActivityName.trim()) return;
    setCustomActivities((prev) => [
      ...prev,
      {
        tempId: `custom-${Date.now()}`,
        name: newActivityName.trim(),
        dayLinkId,
        startTime: '',
        durationMinutes: 60,
        moments: [],
      },
    ]);
    setNewActivityName('');
    setAddingActivityForDay(null);
  };

  const handleRemoveCustomActivity = (tempId: string) => {
    setCustomActivities((prev) => prev.filter((a) => a.tempId !== tempId));
  };

  const updateCustomActivity = (tempId: string, updates: Partial<CustomActivity>) => {
    setCustomActivities((prev) =>
      prev.map((a) => (a.tempId === tempId ? { ...a, ...updates } : a)),
    );
  };

  const handleAddCustomMoment = (activityTempId: string) => {
    if (!newMomentName.trim()) return;
    setCustomActivities((prev) =>
      prev.map((a) =>
        a.tempId === activityTempId
          ? {
              ...a,
              moments: [
                ...a.moments,
                { tempId: `moment-${Date.now()}`, name: newMomentName.trim(), isKeyMoment: false },
              ],
            }
          : a,
      ),
    );
    setNewMomentName('');
    setAddingMomentForActivity(null);
  };

  const handleRemoveCustomMoment = (activityTempId: string, momentTempId: string) => {
    setCustomActivities((prev) =>
      prev.map((a) =>
        a.tempId === activityTempId
          ? { ...a, moments: a.moments.filter((m) => m.tempId !== momentTempId) }
          : a,
      ),
    );
  };

  const toggleCustomMomentKey = (activityTempId: string, momentTempId: string) => {
    setCustomActivities((prev) =>
      prev.map((a) =>
        a.tempId === activityTempId
          ? {
              ...a,
              moments: a.moments.map((m) =>
                m.tempId === momentTempId ? { ...m, isKeyMoment: !m.isKeyMoment } : m,
              ),
            }
          : a,
      ),
    );
  };

  // ── Navigation ─────────────────────────────────────────────────────
  const handleEventTypeSelected = (eventType: EventTypeForWizard) => {
    setSelectedEventType(eventType);
    setSelectedDayIds(new Set());
    setSelectedPresetIds(new Set());
    setSelectedMomentIds(new Set());
    setSelectedRoleIds(getAllRoleIds(eventType));
    setCustomActivities([]);
    setPresetTimeOverrides({});
    setPresetDurationOverrides({});
    setMomentKeyOverrides({});
    setCrewAssignments([]);
    setCameraSlots([{ slotNumber: 1, equipmentId: null, assignedContributorId: null, assignedJobRoleId: null }]);
    setAudioSlots([]);
    setLocationCount(3);
    if (!packageName) setPackageName(`${eventType.name} Package`);
    setActiveStep(1);
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    if (activeStep > 0) setActiveStep((prev) => prev - 1);
  };

  const handleCreate = async () => {
    if (!selectedEventType || !packageName.trim() || !currentBrand?.id) return;
    setIsCreating(true);
    setError(null);
    try {
      // Build selected activities with time/duration overrides
      const selectedActivities = Array.from(selectedPresetIds).map((presetId) => ({
        presetId,
        startTime: presetTimeOverrides[presetId] || undefined,
        durationMinutes: presetDurationOverrides[presetId] || undefined,
      }));

      // Build custom activities mapped to day template IDs
      const customActivitiesData = customActivities
        .filter((ca) => selectedDayIds.has(ca.dayLinkId))
        .map((ca) => {
          const dayLink = selectedEventType.event_days.find((ed) => ed.id === ca.dayLinkId);
          return {
            name: ca.name,
            dayTemplateId: dayLink?.event_day_template.id || 0,
            startTime: ca.startTime || undefined,
            durationMinutes: ca.durationMinutes || undefined,
            moments: ca.moments.map((m) => ({ name: m.name, isKeyMoment: m.isKeyMoment })),
          };
        });

      // Build moment key overrides
      const momentKeyOverridesData = Object.entries(momentKeyOverrides).map(([id, isKey]) => ({
        momentId: parseInt(id),
        isKey,
      }));

      // Build equipment slots from camera + audio slots
      const equipmentSlotsData = [
        ...cameraSlots
          .filter((s) => s.equipmentId)
          .map((s) => ({
            equipmentId: s.equipmentId!,
            slotLabel: `Camera ${s.slotNumber}`,
            slotType: 'CAMERA',
            contributorId: s.assignedContributorId || undefined,
            jobRoleId: s.assignedJobRoleId || undefined,
          })),
        ...audioSlots
          .filter((s) => s.equipmentId)
          .map((s) => ({
            equipmentId: s.equipmentId!,
            slotLabel: `Audio ${s.slotNumber}`,
            slotType: 'AUDIO',
            contributorId: s.assignedContributorId || undefined,
            jobRoleId: s.assignedJobRoleId || undefined,
          })),
      ];

      // Expand multi-role crew assignments: one DTO entry per contributor + role
      const crewAssignmentsData = crewAssignments.flatMap((a) =>
        a.jobRoleIds.map((roleId) => {
          const cm = crewMembers.find((c: CrewMember) => c.id === a.contributorId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const role = cm?.contributor_job_roles?.find((r: any) => r.job_role.id === roleId);
          const positionName = role?.job_role?.display_name || role?.job_role?.name || 'Crew';
          return {
            contributorId: a.contributorId,
            jobRoleId: roleId,
            positionName,
            positionColor: a.positionColor,
          };
        }),
      );

      const response = await api.eventTypes.createPackageFromWizard(selectedEventType.id, {
        packageName,
        selectedDayIds: Array.from(selectedDayIds),
        selectedActivities,
        customActivities: customActivitiesData,
        selectedMomentIds: Array.from(selectedMomentIds),
        momentKeyOverrides: momentKeyOverridesData,
        selectedRoleIds: Array.from(selectedRoleIds),
        locationCount,
        crewAssignments: crewAssignmentsData,
        equipmentSlots: equipmentSlotsData,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const packageId = (response as any)?.id;
      if (packageId) {
        onPackageCreated(packageId);
        resetState();
      } else {
        setError('Failed to create package');
        setIsCreating(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create package');
      setIsCreating(false);
    }
  };

  const resetState = () => {
    setActiveStep(0);
    setSelectedEventType(null);
    setSelectedDayIds(new Set());
    setSelectedPresetIds(new Set());
    setSelectedMomentIds(new Set());
    setSelectedRoleIds(new Set());
    setCustomActivities([]);
    setExpandedPresets(new Set());
    setExpandedReviewPresets(new Set());
    setPresetTimeOverrides({});
    setPresetDurationOverrides({});
    setMomentKeyOverrides({});
    setCrewAssignments([]);
    setCameraSlots([{ slotNumber: 1, equipmentId: null, assignedContributorId: null, assignedJobRoleId: null }]);
    setAudioSlots([]);
    setLocationCount(3);
    setPackageName('');
    setIsCreating(false);
    setError(null);
  };

  const handleClose = () => {
    if (!isCreating) { resetState(); onClose(); }
  };

  const canAdvance = (() => {
    switch (activeStep) {
      case 0: return false; // event type selected via click
      case 1: return selectedDayIds.size > 0;
      case 2: return selectedPresetIds.size > 0 || customActivities.length > 0;
      case 3: return true; // subjects optional
      case 4: return true; // locations always valid
      case 5: return packageName.trim().length > 0;
      case 6: return true; // crew optional
      case 7: return true; // equipment optional
      default: return false;
    }
  })();

  const canCreate = activeStep === 8 && packageName.trim().length > 0 && !isCreating;
  const accent = selectedEventType?.color || '#f59e0b';

  // ── Shared styles ──────────────────────────────────────────────────
  const listRowSx = (selected: boolean, color = '#10b981') => ({
    display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1,
    borderRadius: 1.5, cursor: 'pointer', transition: 'all 0.15s',
    bgcolor: selected ? `${color}0A` : 'transparent',
    '&:hover': { bgcolor: selected ? `${color}10` : 'rgba(255,255,255,0.03)' },
  });

  const checkboxSx = (selected: boolean, color = '#10b981') => ({
    width: 18, height: 18, borderRadius: '4px',
    border: `2px solid ${selected ? color : 'rgba(148,163,184,0.3)'}`,
    bgcolor: selected ? color : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all 0.15s',
    '& svg': { fontSize: '0.75rem', color: '#fff' },
  });

  const miniInputSx = {
    '& .MuiOutlinedInput-root': {
      color: '#cbd5e1', fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.03)',
      '& fieldset': { borderColor: 'rgba(148,163,184,0.15)' },
      '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
      '&.Mui-focused fieldset': { borderColor: accent },
    },
    '& .MuiOutlinedInput-input': { py: '3px', px: '6px' },
  };

  const sectionBtnSx = (color: string) => ({
    px: 1, py: 0.25, bgcolor: 'transparent',
    border: `1px solid ${color}40`, borderRadius: 0.75, color,
    cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
    '&:hover': { bgcolor: `${color}0A` },
  });

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open} onClose={handleClose} maxWidth="md" fullWidth
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' } } }}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(15,20,25,0.97)', backdropFilter: 'blur(12px)',
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: 2.5, border: '1px solid rgba(148,163,184,0.15)',
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5)', overflow: 'hidden',
        },
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2.5, pb: 1.5 }}>
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>Create a Package</Typography>
        <IconButton onClick={handleClose} disabled={isCreating} sx={{ color: '#64748b', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Progress bar ───────────────────────────────────── */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
          <Typography sx={{ color: accent, fontSize: '0.8rem', fontWeight: 600 }}>{steps[activeStep]}</Typography>
          <Typography sx={{ color: '#475569', fontSize: '0.7rem' }}>Step {activeStep + 1} of {steps.length}</Typography>
        </Box>
        <Box sx={{ width: '100%', height: 3, bgcolor: '#1e293b', borderRadius: 2 }}>
          <Box sx={{ width: `${((activeStep + 1) / steps.length) * 100}%`, height: '100%', bgcolor: accent, borderRadius: 2, transition: 'width 0.3s ease' }} />
        </Box>
      </Box>

      <Box sx={{ height: '1px', bgcolor: 'rgba(148,163,184,0.1)' }} />

      {/* ── Content ────────────────────────────────────────── */}
      <DialogContent sx={{ pt: 2.5, px: 3, pb: 2, overflow: 'auto' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        {/* ── Step 0: Event Type ─────────────────────────── */}
        {activeStep === 0 && (
          <Box>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2.5 }}>What type of event is this package for?</Typography>
            <EventTypeSelector onEventTypeSelected={handleEventTypeSelected} selectedEventTypeId={selectedEventType?.id} />
          </Box>
        )}

        {/* ── Step 1: Event Days ─────────────────────────── */}
        {activeStep === 1 && selectedEventType && (
          <Box>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2 }}>Which days does this event include?</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1.5 }}>
              {selectedEventType.event_days.sort((a, b) => a.order_index - b.order_index).map((link) => {
                const day = link.event_day_template;
                const isSelected = selectedDayIds.has(link.id);
                const activityCount = day.activity_presets?.length || 0;
                const momentCount = day.activity_presets?.reduce((s, p) => s + (p.moments?.length || 0), 0) || 0;
                return (
                  <Box key={link.id} onClick={() => toggleDay(link.id)} sx={{
                    p: 2, borderRadius: 2, cursor: 'pointer', border: '2px solid',
                    borderColor: isSelected ? accent : 'rgba(148,163,184,0.12)',
                    bgcolor: isSelected ? `${accent}0A` : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: isSelected ? accent : 'rgba(148,163,184,0.3)', transform: 'translateY(-1px)' },
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{day.name}</Typography>
                      {isSelected && <CheckCircleIcon sx={{ fontSize: '1.1rem', color: accent }} />}
                    </Box>
                    {day.description && <Typography sx={{ color: '#64748b', fontSize: '0.75rem', mb: 0.75, lineHeight: 1.4 }}>{day.description}</Typography>}
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>{activityCount} activities · {momentCount} moments</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* ── Step 2: Activities (with times, durations, expandable moments) ── */}
        {activeStep === 2 && selectedEventType && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Select activities and moments to include</Typography>
                <Typography sx={{ color: '#475569', fontSize: '0.7rem', mt: 0.25 }}>Set start times, durations, and pick moments</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={`${selectedPresetIds.size + customActivities.filter((ca) => selectedDayIds.has(ca.dayLinkId)).length}/${totalPresetsInSelectedDays + customActivities.filter((ca) => selectedDayIds.has(ca.dayLinkId)).length}`} size="small"
                  sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'none' }} />
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Box component="button" onClick={() => {
                    if (!selectedEventType) return;
                    const allP = getPresetIdsForDays(selectedEventType, selectedDayIds);
                    setSelectedPresetIds(allP);
                    setSelectedMomentIds(getAllMomentIdsForPresets(selectedEventType, allP));
                  }} sx={sectionBtnSx('#10b981')}>Select All</Box>
                  <Box component="button" onClick={() => { setSelectedPresetIds(new Set()); setSelectedMomentIds(new Set()); }}
                    sx={{ ...sectionBtnSx('#64748b'), borderColor: 'rgba(255,255,255,0.1)' }}>None</Box>
                </Box>
              </Box>
            </Box>

            {selectedDays.length === 0 && (
              <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontStyle: 'italic' }}>Go back and select at least one event day first.</Typography>
            )}

            <Stack spacing={2.5}>
              {selectedDays.map((link) => {
                const day = link.event_day_template;
                const dayCustom = customActivities.filter((ca) => ca.dayLinkId === link.id);
                if (!day.activity_presets?.length && dayCustom.length === 0) return null;
                return (
                  <Box key={link.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {day.name}
                      </Typography>
                      <Box component="button" onClick={() => { setAddingActivityForDay(addingActivityForDay === link.id ? null : link.id); setNewActivityName(''); }}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, bgcolor: 'transparent',
                          border: '1px solid rgba(148,163,184,0.2)', borderRadius: 0.75, color: '#94a3b8', cursor: 'pointer',
                          fontSize: '0.65rem', fontWeight: 500, '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', color: '#fff' } }}>
                        <AddIcon sx={{ fontSize: '0.75rem' }} /> Add Activity
                      </Box>
                    </Box>

                    {/* Add activity input */}
                    <Collapse in={addingActivityForDay === link.id}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, p: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.12)' }}>
                        <TextField value={newActivityName} onChange={(e) => setNewActivityName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomActivity(link.id); if (e.key === 'Escape') setAddingActivityForDay(null); }}
                          placeholder="Activity name..." size="small" autoFocus fullWidth
                          sx={{ '& .MuiOutlinedInput-root': { color: '#fff', fontSize: '0.8rem', bgcolor: 'transparent',
                            '& fieldset': { borderColor: 'rgba(148,163,184,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.4)' }, '&.Mui-focused fieldset': { borderColor: accent } } }} />
                        <Button onClick={() => handleAddCustomActivity(link.id)} disabled={!newActivityName.trim()} size="small"
                          sx={{ color: '#10b981', fontSize: '0.75rem', textTransform: 'none', minWidth: 'auto', px: 1.5 }}>Add</Button>
                      </Box>
                    </Collapse>

                    {/* Activity list */}
                    <Stack spacing={0.5}>
                      {day.activity_presets.map((preset) => {
                        const sel = selectedPresetIds.has(preset.id);
                        const isExpanded = expandedPresets.has(preset.id);
                        const pColor = preset.color || '#10b981';
                        const momentCount = preset.moments?.length || 0;
                        const selectedMomentCount = preset.moments?.filter((m) => selectedMomentIds.has(m.id)).length || 0;
                        const startTime = getPresetTime(preset);
                        const duration = getPresetDuration(preset);

                        return (
                          <Box key={preset.id}>
                            <Box sx={listRowSx(sel, pColor)}>
                              <Box onClick={() => togglePreset(preset.id)} sx={checkboxSx(sel, pColor)}>
                                {sel && <CheckCircleIcon sx={{ fontSize: '0.7rem' }} />}
                              </Box>

                              <Typography onClick={() => togglePreset(preset.id)}
                                sx={{ color: sel ? '#e2e8f0' : '#94a3b8', fontSize: '0.82rem', fontWeight: sel ? 600 : 400, cursor: 'pointer', flex: 1, minWidth: 0 }}>
                                {preset.name}
                              </Typography>

                              {/* Time & Duration — right-aligned, fixed widths for column alignment */}
                              {sel ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                  <Tooltip title="Start time" arrow>
                                    <TextField
                                      type="time" size="small" value={startTime}
                                      onChange={(e) => setPresetTimeOverrides((prev) => ({ ...prev, [preset.id]: e.target.value }))}
                                      sx={{ ...miniInputSx, width: 110 }}
                                      InputProps={{ startAdornment: <AccessTimeIcon sx={{ fontSize: '0.7rem', color: '#475569', mr: 0.5 }} /> }}
                                    />
                                  </Tooltip>
                                  <Tooltip title="Duration (min)" arrow>
                                    <TextField
                                      type="number" size="small" value={duration}
                                      onChange={(e) => setPresetDurationOverrides((prev) => ({ ...prev, [preset.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                                      sx={{ ...miniInputSx, width: 68 }}
                                      inputProps={{ min: 1, step: 5 }}
                                    />
                                  </Tooltip>
                                  <Typography sx={{ color: '#475569', fontSize: '0.6rem', width: 20 }}>min</Typography>
                                </Box>
                              ) : (
                                <Box sx={{ width: 214, flexShrink: 0 }} />
                              )}

                              {momentCount > 0 ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, width: 50, justifyContent: 'flex-end' }}>
                                  {sel && <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>{selectedMomentCount}/{momentCount}</Typography>}
                                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpandPreset(preset.id); }}
                                    sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#94a3b8' } }}>
                                    {isExpanded ? <ExpandLessIcon sx={{ fontSize: '1rem' }} /> : <ExpandMoreIcon sx={{ fontSize: '1rem' }} />}
                                  </IconButton>
                                </Box>
                              ) : (
                                <Box sx={{ width: 50, flexShrink: 0 }} />
                              )}
                            </Box>

                            {/* Moments dropdown */}
                            <Collapse in={isExpanded && momentCount > 0}>
                              <Box sx={{ ml: 4.5, mt: 0.25, mb: 0.5, pl: 1.5, borderLeft: `2px solid ${sel ? `${pColor}30` : 'rgba(148,163,184,0.1)'}` }}>
                                <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, py: 0.25 }}>
                                  <Box component="button" onClick={() => selectAllMomentsForPreset(preset.id)} sx={sectionBtnSx(pColor)}>Select All</Box>
                                  <Box component="button" onClick={() => deselectAllMomentsForPreset(preset.id)}
                                    sx={{ ...sectionBtnSx('#64748b'), borderColor: 'rgba(255,255,255,0.08)' }}>None</Box>
                                </Box>
                                {preset.moments?.map((moment) => {
                                  const mSel = selectedMomentIds.has(moment.id);
                                  const isKey = isMomentKey(moment);
                                  return (
                                    <Box key={moment.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4, px: 0.5, borderRadius: 0.75, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                                      <Box onClick={() => toggleMoment(moment.id)} sx={{ ...checkboxSx(mSel, pColor), cursor: 'pointer' }}>
                                        {mSel && <CheckCircleIcon sx={{ fontSize: '0.65rem' }} />}
                                      </Box>
                                      <Typography onClick={() => toggleMoment(moment.id)} sx={{ color: mSel ? '#cbd5e1' : '#64748b', fontSize: '0.75rem', fontWeight: mSel ? 500 : 400, flex: 1, cursor: 'pointer' }}>
                                        {moment.name}
                                      </Typography>
                                      <Tooltip title={isKey ? 'Remove from key moments' : 'Mark as key moment'} arrow>
                                        <IconButton size="small" onClick={() => toggleMomentKey(moment.id, isKey)}
                                          sx={{ p: 0.15, color: isKey ? '#f59e0b' : '#334155', '&:hover': { color: '#f59e0b' } }}>
                                          {isKey ? <StarIcon sx={{ fontSize: '0.8rem' }} /> : <StarBorderIcon sx={{ fontSize: '0.8rem' }} />}
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Collapse>
                          </Box>
                        );
                      })}

                      {/* Custom activities with moments */}
                      {dayCustom.map((ca) => {
                        const isExpanded = expandedPresets.has(ca.tempId as unknown as number);
                        return (
                          <Box key={ca.tempId}>
                            <Box sx={listRowSx(true, '#818cf8')}>
                              <Box sx={checkboxSx(true, '#818cf8')}><CheckCircleIcon sx={{ fontSize: '0.7rem' }} /></Box>
                              <Typography sx={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, flex: 1, minWidth: 0 }}>{ca.name}</Typography>

                              {/* Time & Duration for custom activity — same column alignment */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                <TextField type="time" size="small" value={ca.startTime}
                                  onChange={(e) => updateCustomActivity(ca.tempId, { startTime: e.target.value })}
                                  sx={{ ...miniInputSx, width: 110 }}
                                  InputProps={{ startAdornment: <AccessTimeIcon sx={{ fontSize: '0.7rem', color: '#475569', mr: 0.5 }} /> }} />
                                <TextField type="number" size="small" value={ca.durationMinutes}
                                  onChange={(e) => updateCustomActivity(ca.tempId, { durationMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
                                  sx={{ ...miniInputSx, width: 68 }} inputProps={{ min: 1, step: 5 }} />
                                <Typography sx={{ color: '#475569', fontSize: '0.6rem', width: 20 }}>min</Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0, width: 50, justifyContent: 'flex-end' }}>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpandPreset(ca.tempId as unknown as number); }}
                                  sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#94a3b8' } }}>
                                  {isExpanded ? <ExpandLessIcon sx={{ fontSize: '1rem' }} /> : <ExpandMoreIcon sx={{ fontSize: '1rem' }} />}
                                </IconButton>
                                <IconButton size="small" onClick={() => handleRemoveCustomActivity(ca.tempId)}
                                  sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                                  <DeleteOutlineIcon sx={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              </Box>
                            </Box>

                            {/* Custom activity moments */}
                            <Collapse in={isExpanded}>
                              <Box sx={{ ml: 4.5, mt: 0.25, mb: 0.5, pl: 1.5, borderLeft: '2px solid rgba(129,140,248,0.2)' }}>
                                {ca.moments.map((m) => (
                                  <Box key={m.tempId} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4, px: 0.5, borderRadius: 0.75, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                                    <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#818cf8', flexShrink: 0 }} />
                                    <Typography sx={{ color: '#cbd5e1', fontSize: '0.75rem', flex: 1 }}>{m.name}</Typography>
                                    <Tooltip title={m.isKeyMoment ? 'Remove from key moments' : 'Mark as key moment'} arrow>
                                      <IconButton size="small" onClick={() => toggleCustomMomentKey(ca.tempId, m.tempId)}
                                        sx={{ p: 0.15, color: m.isKeyMoment ? '#f59e0b' : '#334155', '&:hover': { color: '#f59e0b' } }}>
                                        {m.isKeyMoment ? <StarIcon sx={{ fontSize: '0.8rem' }} /> : <StarBorderIcon sx={{ fontSize: '0.8rem' }} />}
                                      </IconButton>
                                    </Tooltip>
                                    <IconButton size="small" onClick={() => handleRemoveCustomMoment(ca.tempId, m.tempId)}
                                      sx={{ p: 0.15, color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                                      <DeleteOutlineIcon sx={{ fontSize: '0.75rem' }} />
                                    </IconButton>
                                  </Box>
                                ))}
                                {/* Add moment input */}
                                {addingMomentForActivity === ca.tempId ? (
                                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
                                    <TextField value={newMomentName} onChange={(e) => setNewMomentName(e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomMoment(ca.tempId); if (e.key === 'Escape') setAddingMomentForActivity(null); }}
                                      placeholder="Moment name..." size="small" autoFocus
                                      sx={{ ...miniInputSx, flex: 1, '& .MuiOutlinedInput-input': { py: '4px', px: '8px' } }} />
                                    <Button onClick={() => handleAddCustomMoment(ca.tempId)} disabled={!newMomentName.trim()} size="small"
                                      sx={{ color: '#818cf8', fontSize: '0.65rem', textTransform: 'none', minWidth: 'auto', px: 1 }}>Add</Button>
                                  </Box>
                                ) : (
                                  <Box component="button" onClick={() => { setAddingMomentForActivity(ca.tempId); setNewMomentName(''); }}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, px: 0.75, py: 0.25,
                                      bgcolor: 'transparent', border: '1px dashed rgba(129,140,248,0.25)', borderRadius: 0.5,
                                      color: '#818cf8', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 500,
                                      '&:hover': { bgcolor: 'rgba(129,140,248,0.06)' } }}>
                                    <AddIcon sx={{ fontSize: '0.65rem' }} /> Add Moment
                                  </Box>
                                )}
                              </Box>
                            </Collapse>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* ── Step 3: Subjects (list format) ─────────────── */}
        {activeStep === 3 && selectedEventType && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Who will be involved in this event?</Typography>
                <Typography sx={{ color: '#475569', fontSize: '0.7rem', mt: 0.25 }}>Select the subjects that apply to your package</Typography>
              </Box>
              {totalRoles > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={`${selectedRoleIds.size}/${totalRoles}`} size="small"
                    sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'rgba(244,114,182,0.12)', color: '#f472b6', border: 'none' }} />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Box component="button" onClick={() => selectedEventType && setSelectedRoleIds(getAllRoleIds(selectedEventType))} sx={sectionBtnSx('#f472b6')}>All</Box>
                    <Box component="button" onClick={() => setSelectedRoleIds(new Set())}
                      sx={{ ...sectionBtnSx('#64748b'), borderColor: 'rgba(255,255,255,0.1)' }}>None</Box>
                  </Box>
                </Box>
              )}
            </Box>

            {totalRoles === 0 && <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontStyle: 'italic' }}>No subject types configured for this event type yet.</Typography>}

            <Stack spacing={2}>
              {selectedEventType.subject_types.sort((a, b) => a.order_index - b.order_index).map((link) => {
                const st = link.subject_type_template;
                if (!st.roles?.length) return null;
                return (
                  <Box key={link.id}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', mb: 0.5 }}>{st.name}</Typography>
                    <Stack spacing={0.25}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {st.roles.sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((role) => {
                        const sel = selectedRoleIds.has(role.id);
                        return (
                          <Box key={role.id} onClick={() => toggleRole(role.id)} sx={listRowSx(sel, '#f472b6')}>
                            <Box sx={checkboxSx(sel, '#f472b6')}>{sel && <CheckCircleIcon sx={{ fontSize: '0.7rem' }} />}</Box>
                            <Typography sx={{ color: sel ? '#e2e8f0' : '#94a3b8', fontSize: '0.82rem', fontWeight: sel ? 600 : 400, flex: 1 }}>{role.role_name}</Typography>
                            {role.is_core && <Chip label="Core" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(244,114,182,0.12)', color: '#f472b6', border: 'none' }} />}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* ── Step 4: Locations ──────────────────────────── */}
        {activeStep === 4 && (
          <Box>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2 }}>How many distinct locations will this event have?</Typography>
            <Stack direction="row" spacing={1.5}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Box key={n} onClick={() => setLocationCount(n)} sx={{
                  width: 64, height: 64, borderRadius: 2, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 0.25, cursor: 'pointer', transition: 'all 0.15s',
                  bgcolor: n <= locationCount ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.02)',
                  border: n === locationCount ? '2px solid #22d3ee' : n <= locationCount ? '1px solid rgba(34,211,238,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  color: n <= locationCount ? '#22d3ee' : '#475569',
                  '&:hover': { borderColor: '#22d3ee', bgcolor: 'rgba(34,211,238,0.06)' },
                }}>
                  <PlaceIcon sx={{ fontSize: '1rem' }} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{n}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* ── Step 5: Package Name ───────────────────────── */}
        {activeStep === 5 && selectedEventType && (
          <Box sx={{ maxWidth: 520, mx: 'auto' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 3 }}>Give your package a name</Typography>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, mb: 2.5, borderRadius: 1, bgcolor: `${accent}12`, border: `1px solid ${accent}30` }}>
              <Typography sx={{ color: accent, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event Type:</Typography>
              <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{selectedEventType.icon || ''} {selectedEventType.name}</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>Package Name</Typography>
              <TextField value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder={`e.g., Premium ${selectedEventType.name} Package`}
                fullWidth autoFocus sx={{ '& .MuiOutlinedInput-root': { color: '#fff', fontSize: '1.2rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.03)',
                  '& fieldset': { borderColor: `${accent}50`, borderWidth: 2 }, '&:hover fieldset': { borderColor: `${accent}80` }, '&.Mui-focused fieldset': { borderColor: accent } } }} />
              <Typography sx={{ color: '#64748b', fontSize: '0.75rem', mt: 1 }}>This name will be visible to your clients. You can change it later.</Typography>
            </Box>
          </Box>
        )}

        {/* ── Step 6: Crew Members ───────────────────────── */}
        {activeStep === 6 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Assign crew members to this package</Typography>
                <Typography sx={{ color: '#475569', fontSize: '0.7rem', mt: 0.25 }}>Select crew and choose the role they&apos;ll fill on this project</Typography>
              </Box>
              {crewAssignments.length > 0 && (
                <Chip label={`${crewAssignments.length} assigned`} size="small"
                  sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'none' }} />
              )}
            </Box>

            {loadingCrew && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 3, justifyContent: 'center' }}>
                <CircularProgress size={18} sx={{ color: '#818cf8' }} />
                <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>Loading crew members...</Typography>
              </Box>
            )}

            {!loadingCrew && crewMembers.length === 0 && (
              <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontStyle: 'italic' }}>No crew members found. You can add them later in the package.</Typography>
            )}

            {!loadingCrew && crewMembers.length > 0 && (
              <Stack spacing={0.5}>
                {crewMembers.map((cm: CrewMember) => {
                  const assignment = crewAssignments.find((a) => a.contributorId === cm.id);
                  const isAssigned = !!assignment;
                  const crewColor = cm.crew_color || '#818cf8';
                  const hasRoles = cm.contributor_job_roles?.length > 0;

                  return (
                    <Box key={cm.id} sx={listRowSx(isAssigned, crewColor)}>
                      {/* Add/Remove toggle */}
                      <Box
                        onClick={() => isAssigned ? removeCrewMember(cm.id) : addCrewMember(cm)}
                        sx={checkboxSx(isAssigned, crewColor)}
                      >
                        {isAssigned && <CheckCircleIcon sx={{ fontSize: '0.7rem' }} />}
                      </Box>

                      {/* Avatar */}
                      <Box sx={{
                        width: 26, height: 26, borderRadius: '50%', bgcolor: `${crewColor}20`,
                        border: `2px solid ${crewColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Typography sx={{ color: crewColor, fontSize: '0.6rem', fontWeight: 700 }}>
                          {getCrewName(cm).charAt(0).toUpperCase()}
                        </Typography>
                      </Box>

                      {/* Name */}
                      <Box
                        onClick={() => isAssigned ? removeCrewMember(cm.id) : addCrewMember(cm)}
                        sx={{ cursor: 'pointer', minWidth: 120 }}
                      >
                        <Typography sx={{ color: isAssigned ? '#e2e8f0' : '#94a3b8', fontSize: '0.82rem', fontWeight: isAssigned ? 600 : 400 }}>
                          {getCrewName(cm)}
                        </Typography>
                      </Box>

                      {/* Role chips - only shown when assigned */}
                      {isAssigned && hasRoles && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {cm.contributor_job_roles?.map((r: any) => {
                            const isSelected = assignment.jobRoleIds.includes(r.job_role.id);
                            return (
                              <Chip
                                key={r.job_role.id}
                                label={`${r.job_role.display_name || r.job_role.name}${r.is_primary ? ' ★' : ''}`}
                                size="small"
                                onClick={() => toggleCrewRole(cm.id, r.job_role.id)}
                                sx={{
                                  height: 24, fontSize: '0.68rem', fontWeight: isSelected ? 600 : 400,
                                  cursor: 'pointer', transition: 'all 0.15s',
                                  bgcolor: isSelected ? `${crewColor}20` : 'rgba(255,255,255,0.03)',
                                  color: isSelected ? crewColor : '#64748b',
                                  border: `1px solid ${isSelected ? `${crewColor}40` : 'rgba(148,163,184,0.12)'}`,
                                  '&:hover': {
                                    bgcolor: isSelected ? `${crewColor}30` : 'rgba(255,255,255,0.06)',
                                    borderColor: isSelected ? `${crewColor}60` : 'rgba(148,163,184,0.25)',
                                  },
                                }}
                              />
                            );
                          })}
                        </Box>
                      )}

                      <Box sx={{ flex: 1 }} />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}

        {/* ── Step 7: Equipment (Camera/Audio Slots) ──── */}
        {activeStep === 7 && (
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Assign cameras and audio equipment</Typography>
              <Typography sx={{ color: '#475569', fontSize: '0.7rem', mt: 0.25 }}>Set up numbered slots and pick specific gear for each</Typography>
            </Box>

            {loadingEquipment && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 3, justifyContent: 'center' }}>
                <CircularProgress size={18} sx={{ color: '#fb923c' }} />
                <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>Loading equipment...</Typography>
              </Box>
            )}

            {!loadingEquipment && (
              <Stack spacing={3}>
                {/* ── Cameras Section ─── */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CameraAltIcon sx={{ fontSize: '1rem', color: '#fb923c' }} />
                      <Typography sx={{ color: '#fb923c', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Cameras
                      </Typography>
                      <Chip label={`${cameraSlots.filter((s) => s.equipmentId).length}/${cameraSlots.length}`} size="small"
                        sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(251,146,60,0.12)', color: '#fb923c', border: 'none' }} />
                    </Box>
                    <Box component="button" onClick={addCameraSlot}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, bgcolor: 'transparent',
                        border: '1px solid rgba(251,146,60,0.3)', borderRadius: 0.75, color: '#fb923c', cursor: 'pointer',
                        fontSize: '0.65rem', fontWeight: 600, '&:hover': { bgcolor: 'rgba(251,146,60,0.08)' } }}>
                      <AddIcon sx={{ fontSize: '0.75rem' }} /> Add Camera
                    </Box>
                  </Box>

                  <Stack spacing={0.75}>
                    {cameraSlots.map((slot) => (
                      <Box key={slot.slotNumber} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.75,
                        borderRadius: 1.5, bgcolor: slot.equipmentId ? 'rgba(251,146,60,0.05)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${slot.equipmentId ? 'rgba(251,146,60,0.2)' : 'rgba(148,163,184,0.1)'}`,
                        flexWrap: 'wrap',
                      }}>
                        <Typography sx={{ color: '#fb923c', fontSize: '0.75rem', fontWeight: 700, minWidth: 75 }}>
                          Camera {slot.slotNumber}
                        </Typography>
                        <Select
                          value={slot.equipmentId || 0}
                          onChange={(e) => updateCameraSlot(slot.slotNumber, Number(e.target.value) || null)}
                          size="small"
                          displayEmpty
                          sx={{
                            flex: 1, color: '#cbd5e1', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.03)',
                            height: 32,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.3)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fb923c' },
                            '& .MuiSelect-icon': { color: '#64748b' },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                                '& .MuiMenuItem-root': {
                                  color: '#cbd5e1', fontSize: '0.75rem',
                                  '&:hover': { bgcolor: 'rgba(251,146,60,0.1)' },
                                  '&.Mui-selected': { bgcolor: 'rgba(251,146,60,0.15)' },
                                },
                              },
                            },
                          }}
                        >
                          <MenuItem value={0}><em style={{ color: '#64748b' }}>Select camera...</em></MenuItem>
                          {cameraEquipment.map((eq: EquipmentItem) => (
                            <MenuItem key={eq.id} value={eq.id}>
                              {eq.item_name}{eq.brand_name ? ` (${eq.brand_name})` : ''}{eq.model ? ` ${eq.model}` : ''}
                            </MenuItem>
                          ))}
                        </Select>
                        <Select
                          value={slot.assignedContributorId && slot.assignedJobRoleId ? `${slot.assignedContributorId}:${slot.assignedJobRoleId}` : ''}
                          onChange={(e) => updateSlotAssignment('CAMERA', slot.slotNumber, String(e.target.value))}
                          size="small"
                          displayEmpty
                          sx={{
                            minWidth: 220, color: '#cbd5e1', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.03)',
                            height: 32,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.3)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fb923c' },
                            '& .MuiSelect-icon': { color: '#64748b' },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                                '& .MuiMenuItem-root': {
                                  color: '#cbd5e1', fontSize: '0.75rem',
                                  '&:hover': { bgcolor: 'rgba(251,146,60,0.1)' },
                                  '&.Mui-selected': { bgcolor: 'rgba(251,146,60,0.15)' },
                                },
                              },
                            },
                          }}
                        >
                          <MenuItem value=""><em style={{ color: '#64748b' }}>No operator yet</em></MenuItem>
                          {cameraOperatorOptions.map((option) => (
                            <MenuItem key={`cam-op-${option.contributorId}-${option.jobRoleId}`} value={`${option.contributorId}:${option.jobRoleId}`}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {cameraSlots.length > 1 && (
                          <IconButton size="small" onClick={() => removeCameraSlot(slot.slotNumber)}
                            sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                            <RemoveCircleOutlineIcon sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Stack>

                  {cameraEquipment.length === 0 && (
                    <Typography sx={{ color: '#475569', fontSize: '0.7rem', fontStyle: 'italic', mt: 0.5, pl: 1 }}>
                      No cameras in your equipment inventory yet.
                    </Typography>
                  )}
                </Box>

                {/* ── Audio Section ─── */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MicIcon sx={{ fontSize: '1rem', color: '#22d3ee' }} />
                      <Typography sx={{ color: '#22d3ee', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Audio
                      </Typography>
                      <Chip label={`${audioSlots.filter((s) => s.equipmentId).length}/${audioSlots.length}`} size="small"
                        sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(34,211,238,0.12)', color: '#22d3ee', border: 'none' }} />
                    </Box>
                    <Box component="button" onClick={addAudioSlot}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, bgcolor: 'transparent',
                        border: '1px solid rgba(34,211,238,0.3)', borderRadius: 0.75, color: '#22d3ee', cursor: 'pointer',
                        fontSize: '0.65rem', fontWeight: 600, '&:hover': { bgcolor: 'rgba(34,211,238,0.08)' } }}>
                      <AddIcon sx={{ fontSize: '0.75rem' }} /> Add Audio
                    </Box>
                  </Box>

                  <Stack spacing={0.75}>
                    {audioSlots.map((slot) => (
                      <Box key={slot.slotNumber} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.75,
                        borderRadius: 1.5, bgcolor: slot.equipmentId ? 'rgba(34,211,238,0.05)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${slot.equipmentId ? 'rgba(34,211,238,0.2)' : 'rgba(148,163,184,0.1)'}`,
                        flexWrap: 'wrap',
                      }}>
                        <Typography sx={{ color: '#22d3ee', fontSize: '0.75rem', fontWeight: 700, minWidth: 75 }}>
                          Audio {slot.slotNumber}
                        </Typography>
                        <Select
                          value={slot.equipmentId || 0}
                          onChange={(e) => updateAudioSlot(slot.slotNumber, Number(e.target.value) || null)}
                          size="small"
                          displayEmpty
                          sx={{
                            flex: 1, color: '#cbd5e1', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.03)',
                            height: 32,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.3)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#22d3ee' },
                            '& .MuiSelect-icon': { color: '#64748b' },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                                '& .MuiMenuItem-root': {
                                  color: '#cbd5e1', fontSize: '0.75rem',
                                  '&:hover': { bgcolor: 'rgba(34,211,238,0.1)' },
                                  '&.Mui-selected': { bgcolor: 'rgba(34,211,238,0.15)' },
                                },
                              },
                            },
                          }}
                        >
                          <MenuItem value={0}><em style={{ color: '#64748b' }}>Select audio device...</em></MenuItem>
                          {audioEquipment.map((eq: EquipmentItem) => (
                            <MenuItem key={eq.id} value={eq.id}>
                              {eq.item_name}{eq.brand_name ? ` (${eq.brand_name})` : ''}{eq.model ? ` ${eq.model}` : ''}
                            </MenuItem>
                          ))}
                        </Select>
                        <Select
                          value={slot.assignedContributorId && slot.assignedJobRoleId ? `${slot.assignedContributorId}:${slot.assignedJobRoleId}` : ''}
                          onChange={(e) => updateSlotAssignment('AUDIO', slot.slotNumber, String(e.target.value))}
                          size="small"
                          displayEmpty
                          sx={{
                            minWidth: 220, color: '#cbd5e1', fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.03)',
                            height: 32,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.15)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.3)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#22d3ee' },
                            '& .MuiSelect-icon': { color: '#64748b' },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                                '& .MuiMenuItem-root': {
                                  color: '#cbd5e1', fontSize: '0.75rem',
                                  '&:hover': { bgcolor: 'rgba(34,211,238,0.1)' },
                                  '&.Mui-selected': { bgcolor: 'rgba(34,211,238,0.15)' },
                                },
                              },
                            },
                          }}
                        >
                          <MenuItem value=""><em style={{ color: '#64748b' }}>No operator yet</em></MenuItem>
                          {equipmentOperatorOptions.map((option) => (
                            <MenuItem key={`aud-op-${option.contributorId}-${option.jobRoleId}`} value={`${option.contributorId}:${option.jobRoleId}`}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {audioSlots.length > 1 && (
                          <IconButton size="small" onClick={() => removeAudioSlot(slot.slotNumber)}
                            sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                            <RemoveCircleOutlineIcon sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Stack>

                  {audioEquipment.length === 0 && (
                    <Typography sx={{ color: '#475569', fontSize: '0.7rem', fontStyle: 'italic', mt: 0.5, pl: 1 }}>
                      No audio equipment in your inventory yet.
                    </Typography>
                  )}
                </Box>
              </Stack>
            )}
          </Box>
        )}

        {/* ── Step 8: Review & Create ────────────────────── */}
        {activeStep === 8 && selectedEventType && (
          <Box>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2.5 }}>Review everything before creating</Typography>

            {/* Package Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, borderRadius: 1.5, bgcolor: `${accent}0A`, border: `1px solid ${accent}25` }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.25 }}>Package Name</Typography>
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem' }}>{packageName}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.25 }}>Event Type</Typography>
                <Typography sx={{ color: accent, fontWeight: 600, fontSize: '0.9rem' }}>{selectedEventType.icon || ''} {selectedEventType.name}</Typography>
              </Box>
            </Box>

            {/* Stats Row */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
              {[
                { label: 'Days', value: stats.days, color: '#10b981' },
                { label: 'Activities', value: stats.activities, color: '#818cf8' },
                { label: 'Moments', value: stats.moments, color: '#f472b6' },
                { label: 'Subjects', value: stats.subjects, color: '#f472b6' },
                { label: 'Crew', value: stats.crew, color: '#818cf8' },
                { label: 'Equipment', value: stats.equipment, color: '#fb923c' },
                { label: 'Locations', value: stats.locations, color: '#22d3ee' },
              ].map((stat) => (
                <Box key={stat.label} sx={{ flex: 1, minWidth: 70, p: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                  <Typography sx={{ color: stat.color, fontWeight: 700, fontSize: '1rem' }}>{stat.value}</Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.55rem', textTransform: 'uppercase' }}>{stat.label}</Typography>
                </Box>
              ))}
            </Box>

            {/* Breakdown columns */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Left: Days & Activities with expandable moments */}
              <Box sx={{ flex: 3, p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
                <Typography sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarMonthIcon sx={{ fontSize: '0.75rem' }} /> Days & Activities
                </Typography>
                <Stack spacing={1}>
                  {selectedDays.map((link) => {
                    const day = link.event_day_template;
                    const selectedPresets = (day.activity_presets || []).filter((p) => selectedPresetIds.has(p.id));
                    const dayCustom = customActivities.filter((ca) => ca.dayLinkId === link.id);
                    if (selectedPresets.length === 0 && dayCustom.length === 0) return null;
                    return (
                      <Box key={link.id}>
                        <Typography sx={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, mb: 0.5 }}>{day.name}</Typography>
                        <Stack spacing={0.25} sx={{ pl: 1.5, borderLeft: '2px solid rgba(16,185,129,0.15)' }}>
                          {selectedPresets.map((preset) => {
                            const selMoments = preset.moments?.filter((m) => selectedMomentIds.has(m.id)) || [];
                            const isExpanded = expandedReviewPresets.has(preset.id);
                            const startTime = getPresetTime(preset);
                            const duration = getPresetDuration(preset);
                            return (
                              <Box key={preset.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25, cursor: selMoments.length > 0 ? 'pointer' : 'default' }}
                                  onClick={() => selMoments.length > 0 && toggleExpandReviewPreset(preset.id)}>
                                  <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: preset.color || '#10b981', flexShrink: 0 }} />
                                  <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', flex: 1 }}>{preset.name}</Typography>
                                  {startTime && <Typography sx={{ color: '#475569', fontSize: '0.6rem' }}>{startTime}</Typography>}
                                  <Typography sx={{ color: '#475569', fontSize: '0.6rem' }}>{duration}m</Typography>
                                  <Typography sx={{ color: '#475569', fontSize: '0.6rem', flexShrink: 0 }}>
                                    {selMoments.length} moment{selMoments.length !== 1 ? 's' : ''}
                                  </Typography>
                                  {selMoments.length > 0 && (
                                    <Box sx={{ color: '#475569', display: 'flex' }}>
                                      {isExpanded ? <ExpandLessIcon sx={{ fontSize: '0.85rem' }} /> : <ExpandMoreIcon sx={{ fontSize: '0.85rem' }} />}
                                    </Box>
                                  )}
                                </Box>
                                <Collapse in={isExpanded}>
                                  <Stack spacing={0} sx={{ pl: 2, pb: 0.5 }}>
                                    {selMoments.map((moment) => (
                                      <Typography key={moment.id} sx={{ color: '#64748b', fontSize: '0.7rem', py: 0.15, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <Box component="span" sx={{ width: 2, height: 2, borderRadius: '50%', bgcolor: '#475569', display: 'inline-block' }} />
                                        {moment.name}
                                        {isMomentKey(moment) && <Box component="span" sx={{ color: '#f59e0b', fontSize: '0.55rem' }}>Key</Box>}
                                      </Typography>
                                    ))}
                                  </Stack>
                                </Collapse>
                              </Box>
                            );
                          })}
                          {dayCustom.map((ca) => (
                            <Box key={ca.tempId}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
                                <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#818cf8', flexShrink: 0 }} />
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', flex: 1 }}>{ca.name}</Typography>
                                {ca.startTime && <Typography sx={{ color: '#475569', fontSize: '0.6rem' }}>{ca.startTime}</Typography>}
                                <Typography sx={{ color: '#475569', fontSize: '0.6rem' }}>{ca.durationMinutes}m</Typography>
                                <Chip label="Custom" size="small" sx={{ height: 16, fontSize: '0.55rem', bgcolor: 'rgba(129,140,248,0.12)', color: '#818cf8', border: 'none' }} />
                              </Box>
                              {ca.moments.length > 0 && (
                                <Stack spacing={0} sx={{ pl: 2, pb: 0.25 }}>
                                  {ca.moments.map((m) => (
                                    <Typography key={m.tempId} sx={{ color: '#64748b', fontSize: '0.65rem', py: 0.1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Box component="span" sx={{ width: 2, height: 2, borderRadius: '50%', bgcolor: '#475569', display: 'inline-block' }} />
                                      {m.name}
                                      {m.isKeyMoment && <Box component="span" sx={{ color: '#f59e0b', fontSize: '0.5rem' }}>Key</Box>}
                                    </Typography>
                                  ))}
                                </Stack>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              {/* Right column */}
              <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Subjects */}
                {stats.subjects > 0 && (
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(244,114,182,0.05)', border: '1px solid rgba(244,114,182,0.12)' }}>
                    <Typography sx={{ color: '#f472b6', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: '0.75rem' }} /> Subjects
                    </Typography>
                    <Stack spacing={0.75}>
                      {selectedEventType.subject_types.sort((a, b) => a.order_index - b.order_index).map((link) => {
                        const st = link.subject_type_template;
                        const selectedRoles = st.roles.filter((r) => selectedRoleIds.has(r.id));
                        if (selectedRoles.length === 0) return null;
                        return (
                          <Box key={link.id}>
                            <Typography sx={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 600, mb: 0.25 }}>{st.name}</Typography>
                            <Stack spacing={0.15}>
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {selectedRoles.sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((role) => (
                                <Typography key={role.id} sx={{ color: '#94a3b8', fontSize: '0.7rem', pl: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <Box component="span" sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: role.is_core ? '#f472b6' : '#475569', display: 'inline-block' }} />
                                  {role.role_name}
                                  {role.is_core && <Box component="span" sx={{ color: '#f472b6', fontSize: '0.55rem' }}>Core</Box>}
                                </Typography>
                              ))}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                {/* Crew */}
                {stats.crew > 0 && (
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}>
                    <Typography sx={{ color: '#818cf8', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <GroupsIcon sx={{ fontSize: '0.75rem' }} /> Crew
                    </Typography>
                    <Stack spacing={0.25}>
                      {crewAssignments.map((assignment) => {
                        const cm = crewMembers.find((c: CrewMember) => c.id === assignment.contributorId);
                        if (!cm) return null;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const roleNames = assignment.jobRoleIds.map((rid: number) => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const r = cm.contributor_job_roles?.find((cr: any) => cr.job_role.id === rid);
                          return r?.job_role?.display_name || r?.job_role?.name || '';
                        }).filter(Boolean);
                        return (
                          <Typography key={assignment.contributorId} sx={{ color: '#94a3b8', fontSize: '0.7rem', pl: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box component="span" sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: assignment.positionColor || '#818cf8', display: 'inline-block' }} />
                            {getCrewName(cm)}
                            <Box component="span" sx={{ color: '#475569', fontSize: '0.55rem' }}>{roleNames.join(', ')}</Box>
                          </Typography>
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                {/* Equipment */}
                {stats.equipment > 0 && (
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.12)' }}>
                    <Typography sx={{ color: '#fb923c', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VideocamIcon sx={{ fontSize: '0.75rem' }} /> Equipment
                    </Typography>
                    <Stack spacing={0.25}>
                      {cameraSlots.filter((s) => s.equipmentId).map((slot) => {
                        const eq = equipmentItems.find((e: EquipmentItem) => e.id === slot.equipmentId);
                        const assignedOperator = equipmentOperatorOptions.find(
                          (option) => option.contributorId === slot.assignedContributorId && option.jobRoleId === slot.assignedJobRoleId,
                        );
                        return (
                          <Typography key={`cam-${slot.slotNumber}`} sx={{ color: '#94a3b8', fontSize: '0.7rem', pl: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <CameraAltIcon sx={{ fontSize: '0.6rem', color: '#fb923c' }} />
                            Camera {slot.slotNumber}: {eq?.item_name || 'Unknown'}
                            {assignedOperator && <Box component="span" sx={{ color: '#475569', fontSize: '0.6rem' }}>· {assignedOperator.label}</Box>}
                          </Typography>
                        );
                      })}
                      {audioSlots.filter((s) => s.equipmentId).map((slot) => {
                        const eq = equipmentItems.find((e: EquipmentItem) => e.id === slot.equipmentId);
                        const assignedOperator = equipmentOperatorOptions.find(
                          (option) => option.contributorId === slot.assignedContributorId && option.jobRoleId === slot.assignedJobRoleId,
                        );
                        return (
                          <Typography key={`aud-${slot.slotNumber}`} sx={{ color: '#94a3b8', fontSize: '0.7rem', pl: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <MicIcon sx={{ fontSize: '0.6rem', color: '#22d3ee' }} />
                            Audio {slot.slotNumber}: {eq?.item_name || 'Unknown'}
                            {assignedOperator && <Box component="span" sx={{ color: '#475569', fontSize: '0.6rem' }}>· {assignedOperator.label}</Box>}
                          </Typography>
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                {/* Locations */}
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.12)' }}>
                  <Typography sx={{ color: '#22d3ee', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PlaceIcon sx={{ fontSize: '0.75rem' }} /> Location Slots
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    {Array.from({ length: locationCount }, (_, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4, borderRadius: 0.75, bgcolor: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)' }}>
                        <PlaceIcon sx={{ fontSize: '0.7rem', color: '#22d3ee' }} />
                        <Typography sx={{ color: '#22d3ee', fontSize: '0.7rem', fontWeight: 600 }}>Loc {i + 1}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* ── Footer ─────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1.5, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
        <Box>
          {activeStep > 0 && (
            <Box component="button" onClick={handleBack} disabled={isCreating} sx={{
              display: 'flex', alignItems: 'center', gap: 0.5, px: 2, py: 0.75,
              bgcolor: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 1,
              color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.15s',
              '&:hover': { bgcolor: 'rgba(148,163,184,0.12)', color: '#fff', borderColor: 'rgba(148,163,184,0.25)' },
              '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
            }}>
              <ArrowBackIcon sx={{ fontSize: '1rem' }} /> Back
            </Box>
          )}
        </Box>

        <Typography sx={{ color: '#475569', fontSize: '0.8rem' }}>Step {activeStep + 1} of {steps.length}</Typography>

        <Box>
          {activeStep >= 1 && activeStep <= 7 && (
            <Box component="button" onClick={handleNext} disabled={!canAdvance} sx={{
              display: 'flex', alignItems: 'center', gap: 0.5, px: 2.5, py: 0.75,
              bgcolor: canAdvance ? accent : '#334155', border: 'none', borderRadius: 1,
              color: canAdvance ? '#0f172a' : '#64748b', cursor: canAdvance ? 'pointer' : 'not-allowed',
              fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.15s',
              '&:hover': canAdvance ? { filter: 'brightness(0.9)' } : {},
            }}>
              Next <ArrowForwardIcon sx={{ fontSize: '1rem' }} />
            </Box>
          )}

          {activeStep === 8 && (
            <Button onClick={handleCreate} disabled={!canCreate} variant="contained"
              startIcon={isCreating ? <CircularProgress size={16} /> : <CheckCircleOutlineIcon />}
              sx={{ bgcolor: '#10b981', color: '#fff', fontWeight: 700, fontSize: '0.85rem', px: 3, textTransform: 'none',
                '&:hover': { bgcolor: '#059669' }, '&:disabled': { bgcolor: '#334155', color: '#64748b' } }}>
              {isCreating ? 'Creating...' : 'Create Package'}
            </Button>
          )}

          {activeStep === 0 && <Box sx={{ width: 80 }} />}
        </Box>
      </Box>
    </Dialog>
  );
}
