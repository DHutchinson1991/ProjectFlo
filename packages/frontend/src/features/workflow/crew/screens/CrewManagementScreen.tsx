"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBrand } from "@/features/platform/brand";
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { useCrewManagementData, useCrewManagementMutations } from "../hooks";
import { formatCurrency } from "@/shared/utils/formatUtils";
import { roundMoney } from "@/shared/utils/pricing";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  Stack,
  Tooltip,
  SelectChangeEvent,
  alpha,
  Grid,
  Autocomplete,
} from "@mui/material";
import { StudioTable, type StudioColumn } from '@/shared/ui';
import { sectionColors } from '@/shared/theme/tokens';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Groups as CrewIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  ArrowUpward as ArrowUpIcon,
  EmojiEvents as TrophyIcon,
  PersonAdd as PersonAddIcon,
  WorkOutline as RoleIcon,
  Layers as TiersIcon,
  Tune as ConfigureIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Psychology as SkillIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import type { Crew, UpdateCrewDto } from "@/shared/types/users";
import type { PaymentBracket, CreatePaymentBracketData, UpdatePaymentBracketData, AssignBracketData, BracketCrewAssignment } from "@/features/finance/payment-brackets";
import type { BrandSetting } from "@/features/platform/brand/types";
import type { SkillRoleMapping } from "@/features/catalog/task-library/types";

// ─── Bracket Form ───────────────────────────────────────────────────────────

interface BracketFormData {
  name: string;
  display_name: string;
  level: number;
  hourly_rate: number;
  day_rate: number;
  half_day_rate: number;
  overtime_rate: number;
  description: string;
  color: string;
}

const emptyBracketForm: BracketFormData = {
  name: "",
  display_name: "",
  level: 1,
  hourly_rate: 0,
  day_rate: 0,
  half_day_rate: 0,
  overtime_rate: 0,
  description: "",
  color: "#42A5F5",
};

const BRACKET_COLORS = [
  "#66BB6A",
  "#42A5F5",
  "#AB47BC",
  "#FF7043",
  "#78909C",
  "#FFCA28",
  "#26C6DA",
  "#EC407A",
];

const DEFAULT_OT_MULTIPLIER = 1.5;
const STANDARD_DAY_HOURS = 8;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRateDisplay(value: number | string | null | undefined, currency: string): string {
  if (value == null) return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n) || n === 0 ? "—" : formatCurrency(n, currency);
}

function initials(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

function crewName(c: BracketCrewAssignment["crew"]): string {
  const f = c.contact?.first_name ?? "";
  const l = c.contact?.last_name ?? "";
  return `${f} ${l}`.trim() || c.contact?.email || "Unknown";
}

/**
 * Tier accent colour: a faded version of the bracket's own colour,
 * falling back to a warm gradient by level.
 */
const LEVEL_FALLBACK_COLORS = [
  "#78909C", // 1 — slate
  "#66BB6A", // 2 — green
  "#42A5F5", // 3 — blue
  "#AB47BC", // 4 — purple
  "#FF7043", // 5 — orange
  "#FFD54F", // 6 — gold
];

function tierAccent(level: number, color?: string | null): string {
  if (color) return color;
  return LEVEL_FALLBACK_COLORS[Math.min(level, LEVEL_FALLBACK_COLORS.length) - 1] ?? "#42A5F5";
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CrewManagementScreen() {
  const router = useRouter();
  const { currentBrand } = useBrand();
  const currencyCode = currentBrand?.currency ?? DEFAULT_CURRENCY;

  // activeTab = role index (payment bracket wizard role tabs)
  const [activeTab, setActiveTab] = useState(0);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // Bracket create/edit dialog
  const [bracketDialogOpen, setBracketDialogOpen] = useState(false);
  const [editingBracket, setEditingBracket] = useState<PaymentBracket | null>(null);
  const [bracketForm, setBracketForm] = useState<BracketFormData>(emptyBracketForm);
  const [selectedJobRoleId, setSelectedJobRoleId] = useState<number | null>(null);

  // Assign bracket to crew dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{
    crewId: number;
    jobRoleId: number;
    name: string;
    roleName: string;
  } | null>(null);
  const [assignBracketId, setAssignBracketId] = useState<number | "">("");

  // Add new crew dialog
  const [addCrewDialogOpen, setAddCrewDialogOpen] = useState(false);
  const [crewForm, setCrewForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });
  const [crewFormErrors, setCrewFormErrors] = useState<{ [key: string]: string }>({});

  // Add role and tier wizard dialog
  const [roleAndTierWizardOpen, setRoleAndTierWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [newRoleId, setNewRoleId] = useState<number | null>(null);
  const [numBrackets, setNumBrackets] = useState<1 | 4 | null>(null);
  const [roleFormState, setRoleFormState] = useState({
    name: "",
    display_name: "",
    description: "",
    categories: [] as string[],
  });
  const DEFAULT_CATEGORIES = [
    "Admin",
    "Pre Production",
    "Production",
    "Post Production",
  ];
  const [bracketForms, setBracketForms] = useState<BracketFormData[]>([]);
  const [dayRateManualWizard, setDayRateManualWizard] = useState<boolean[]>([]);
  const [halfDayRateManualWizard, setHalfDayRateManualWizard] = useState<boolean[]>([]);
  const [dayRateManualBracket, setDayRateManualBracket] = useState(false);
  const [halfDayRateManualBracket, setHalfDayRateManualBracket] = useState(false);

  // Edit role dialog
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [editRoleForm, setEditRoleForm] = useState({
    display_name: "",
    description: "",
    categories: [] as string[],
  });

  // Inline crew details panel
  const [editCrew, setEditCrew] = useState<Crew | null>(null);
  const [hoveredCrewId, setHoveredCrewId] = useState<number | null>(null);
  // Role filter card selection (null = all)
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<number | null>(null);
  const [editCrewForm, setEditCrewForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    crew_color: "" as string,
  });
  const [editCrewFormErrors, setEditCrewFormErrors] = useState<{ [key: string]: string }>({});
  const [addRoleId, setAddRoleId] = useState<number | string>("");

  const CREW_COLORS = [
    "#42A5F5", "#66BB6A", "#AB47BC", "#FF7043",
    "#78909C", "#FFCA28", "#26C6DA", "#EC407A",
    "#5C6BC0", "#8D6E63", "#26A69A", "#D4E157",
  ];

  const ROLE_CARD_COLORS = [
    "#42A5F5", "#66BB6A", "#AB47BC", "#FF7043",
    "#26C6DA", "#EC407A", "#5C6BC0", "#FFCA28",
    "#26A69A", "#FF8A65", "#7E57C2", "#78909C",
  ];

  // ─── Data ─────────────────────────────────────────────────────────────────

  const {
    crewQuery,
    jobRolesQuery,
    paymentBracketsQuery,
    paymentBracketsByRoleQuery,
    overtimeSettingQuery,
    skillRoleMappingsQuery,
    availableSkillsQuery,
  } = useCrewManagementData();

  const allCrew = crewQuery.data ?? [];
  const jobRoles = jobRolesQuery.data ?? [];
  const allBrackets = paymentBracketsQuery.data ?? [];
  const bracketsByRole = paymentBracketsByRoleQuery.data;
  const otSetting = overtimeSettingQuery.data;

  const otMultiplier = otSetting?.value ? parseFloat(otSetting.value) : DEFAULT_OT_MULTIPLIER;

  // Fetch all skill-role mappings for display on bracket cards
  const allSkillMappings = skillRoleMappingsQuery.data ?? [];
  const availableSkills = availableSkillsQuery.data ?? [];

  // Add skill mapping state
  const [addSkillAnchor, setAddSkillAnchor] = useState<{ roleId: number; bracketLevel: number } | null>(null);
  const [newSkillName, setNewSkillName] = useState("");

  // ─── Derived ──────────────────────────────────────────────────────────────

  const crew = useMemo(
    () => allCrew.filter((c) => c.job_role_assignments?.length && !c.archived_at),
    [allCrew],
  );

  const filteredCrew = useMemo(
    () => selectedRoleFilter === null
      ? crew
      : crew.filter((c) => c.job_role_assignments?.some((jr) => jr.job_role_id === selectedRoleFilter)),
    [crew, selectedRoleFilter],
  );

  // Derive live member from query data so role changes reflect instantly
  const liveEditMember = useMemo(
    () => (editCrew ? crew.find((c) => c.id === editCrew.id) ?? editCrew : null),
    [crew, editCrew],
  );

  // Sorted role list for tabs
  const sortedRoles = useMemo(
    () => [...jobRoles].filter((r) => r.is_active).sort((a, b) => (a.display_name ?? a.name).localeCompare(b.display_name ?? b.name)),
    [jobRoles],
  );

  // For a given role id, get sorted brackets
  const bracketsForRole = (roleId: number): PaymentBracket[] => {
    return allBrackets
      .filter((b) => b.job_role_id === roleId && b.is_active)
      .sort((a, b) => a.level - b.level);
  };

  // Brackets with crew data from grouped endpoint
  const richBracketsForRole = (roleName: string): PaymentBracket[] => {
    if (!bracketsByRole) return [];
    const group = bracketsByRole[roleName];
    return group?.brackets?.sort((a: PaymentBracket, b: PaymentBracket) => a.level - b.level) ?? [];
  };

  const isLoading = crewQuery.isLoading || jobRolesQuery.isLoading || paymentBracketsQuery.isLoading || paymentBracketsByRoleQuery.isLoading;

  // ─── Skill Mapping Helpers ────────────────────────────────────────────────

  // Get skill mappings for a specific bracket (tier-specific)
  const skillsForBracket = (bracketId: number): SkillRoleMapping[] => {
    return allSkillMappings.filter(m => m.payment_bracket_id === bracketId && m.is_active);
  };

  // Skill names that are NOT yet mapped to a given bracket (for autocomplete)
  const unmappedSkillsForBracket = (bracketId: number): string[] => {
    const mapped = new Set(skillsForBracket(bracketId).map(m => m.skill_name.toLowerCase()));
    return availableSkills
      .map(s => s.skill_name)
      .filter(name => !mapped.has(name.toLowerCase()));
  };

  // ─── Mutations ────────────────────────────────────────────────────────────

  const {
    addSkillMutation: addSkillMut,
    removeSkillMutation: removeSkillMut,
    createBracketMutation: createMut,
    updateBracketMutation: updateMut,
    deleteBracketMutation: deleteMut,
    assignBracketMutation: assignMut,
    unassignBracketMutation: unassignMut,
    createCrewMutation: createCrewMut,
    createRoleMutation: createRoleMut,
    updateRoleMutation: updateRoleMut,
    deleteRoleMutation: deleteRoleMut,
    updateCrewMutation: updateCrewMut,
    addJobRoleMutation: addJobRoleMut,
    removeJobRoleMutation: removeJobRoleMut,
    setPrimaryJobRoleMutation: setPrimaryJobRoleMut,
    updateCrewProfileMutation: updateCrewProfileMut,
  } = useCrewManagementMutations({
    onSuccess: (message) => {
      if (message === 'Skill mapped') {
        setNewSkillName('');
        setAddSkillAnchor(null);
      }
      if (message === 'Role added') {
        setAddRoleId('');
      }
      toast(message);
    },
    onError: (message) => toast(message, 'error'),
    closeBracketDialog,
    closeAssignDialog: () => {
      setAssignDialogOpen(false);
      setAssignTarget(null);
    },
    closeAddCrewDialog,
    afterCreateRole: (newRole) => {
      setNewRoleId(newRole.id);
      setWizardStep(2);
    },
    afterUpdateRole: () => {
      setEditRoleDialogOpen(false);
      setEditingRole(null);
    },
    afterDeleteRole: () => {
      setActiveTab(0);
    },
  });


  // ─── Dialog helpers ───────────────────────────────────────────────────────

  function toast(message: string, severity: "success" | "error" = "success") {
    setSnackbar({ open: true, message, severity });
  }

  function closeBracketDialog() {
    setBracketDialogOpen(false);
    setEditingBracket(null);
    setBracketForm(emptyBracketForm);
    setSelectedJobRoleId(null);
  }

  function openCreateBracket(roleId?: number) {
    closeBracketDialog();
    if (roleId) setSelectedJobRoleId(roleId);
    setDayRateManualBracket(false);
    setBracketDialogOpen(true);
  }

  function openEditBracket(b: PaymentBracket) {
    setEditingBracket(b);
    setSelectedJobRoleId(b.job_role_id);
    const hourly = Number(b.hourly_rate);
    const day = b.day_rate ? Number(b.day_rate) : 0;
    // If day rate doesn't match the auto-calc, user has overridden it
    setDayRateManualBracket(day > 0 && Math.abs(day - hourly * STANDARD_DAY_HOURS) > 0.01);
    const halfDay = b.half_day_rate ? Number(b.half_day_rate) : 0;
    const autoHalfDay = roundMoney(day > 0 ? day / 2 : roundMoney(hourly * STANDARD_DAY_HOURS) / 2);
    const isHalfManual = halfDay > 0 && Math.abs(halfDay - autoHalfDay) > 0.01;
    setHalfDayRateManualBracket(isHalfManual);
    setBracketForm({
      name: b.name,
      display_name: b.display_name || "",
      level: b.level,
      hourly_rate: hourly,
      day_rate: day,
      half_day_rate: isHalfManual ? halfDay : autoHalfDay,
      overtime_rate: b.overtime_rate ? Number(b.overtime_rate) : 0,
      description: b.description || "",
      color: b.color || "#42A5F5",
    });
    setBracketDialogOpen(true);
  }

  function handleSaveBracket() {
    if (!selectedJobRoleId) return;
    const dayRate = bracketForm.day_rate || roundMoney(bracketForm.hourly_rate * STANDARD_DAY_HOURS);
    const overtimeRate = roundMoney(bracketForm.hourly_rate * otMultiplier);
    const halfDayRate = bracketForm.half_day_rate || roundMoney(dayRate / 2);
    const payload = {
      name: bracketForm.name,
      display_name: bracketForm.display_name || undefined,
      level: bracketForm.level,
      hourly_rate: bracketForm.hourly_rate,
      day_rate: dayRate || undefined,
      half_day_rate: halfDayRate || undefined,
      overtime_rate: overtimeRate || undefined,
      description: bracketForm.description || undefined,
      color: bracketForm.color || undefined,
    };
    if (editingBracket) {
      updateMut.mutate({ id: editingBracket.id, data: payload });
    } else {
      createMut.mutate({ ...payload, job_role_id: selectedJobRoleId });
    }
  }

  function closeAddCrewDialog() {
    setAddCrewDialogOpen(false);
    setCrewForm({
      email: "",
      first_name: "",
      last_name: "",
      password: "",
    });
    setCrewFormErrors({});
  }

  function validateCrewForm() {
    const newErrors: { [key: string]: string } = {};

    if (!crewForm.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(crewForm.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!crewForm.first_name) {
      newErrors.first_name = "First name is required";
    }

    if (!crewForm.last_name) {
      newErrors.last_name = "Last name is required";
    }

    if (!crewForm.password) {
      newErrors.password = "Password is required";
    } else if (crewForm.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    setCrewFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleAddCrew() {
    if (!validateCrewForm()) return;

    const newCrewData = {
      email: crewForm.email,
      first_name: crewForm.first_name,
      last_name: crewForm.last_name,
      password: crewForm.password,
      role_id: sortedRoles[0]?.id || 1, // Default to first role
    };

    createCrewMut.mutate(newCrewData);
  }

  // ─── Auto-slug generation ────────────────────────────────────────────────

  function generateSlug(displayName: string): string {
    return displayName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  }

  // ─── Default bracket templates ───────────────────────────────────────────

  const DEFAULT_BRACKET_TEMPLATES = [
    { name: "junior", displayName: "Junior", level: 1, color: "#66BB6A" },
    { name: "mid", displayName: "Mid-Level", level: 2, color: "#42A5F5" },
    { name: "senior", displayName: "Senior", level: 3, color: "#AB47BC" },
    { name: "lead", displayName: "Lead", level: 4, color: "#FF7043" },
  ];

  function generateDefaultBrackets(): BracketFormData[] {
    return DEFAULT_BRACKET_TEMPLATES.map((t) => ({
      name: t.name,
      display_name: t.displayName,
      level: t.level,
      hourly_rate: 0,
      day_rate: 0,
      overtime_rate: 0,
      description: "",
      color: t.color,
    }));
  }

  // ─── Wizard functions ───────────────────────────────────────────────────

  function openRoleAndTierWizard() {
    setRoleAndTierWizardOpen(true);
    setWizardStep(1);
    setNewRoleId(null);
    setNumBrackets(null);
    setRoleFormState({
      name: "",
      display_name: "",
      description: "",
      categories: [],
    });
    setBracketForms([]);
    setBracketForm(emptyBracketForm);
  }

  function closeRoleAndTierWizard() {
    setRoleAndTierWizardOpen(false);
    setWizardStep(1);
    setNewRoleId(null);
    setNumBrackets(null);
    setRoleFormState({
      name: "",
      display_name: "",
      description: "",
      categories: [],
    });
    setBracketForms([]);
    setBracketForm(emptyBracketForm);
    setSelectedJobRoleId(null);
  }

  function openEditRoleDialog(role: any) {
    setEditingRole(role);
    setEditRoleForm({
      display_name: role.display_name || "",
      description: role.description || "",
      categories: role.category ? role.category.split(",").map((c: string) => c.trim()) : [],
    });
    setEditRoleDialogOpen(true);
  }

  function closeEditRoleDialog() {
    setEditRoleDialogOpen(false);
    setEditingRole(null);
    setEditRoleForm({
      display_name: "",
      description: "",
      categories: [],
    });
  }

  function handleSaveRole() {
    if (!editingRole || !editRoleForm.display_name) {
      toast("Display name is required", "error");
      return;
    }
    if (editRoleForm.categories.length === 0) {
      toast("Please select at least one category", "error");
      return;
    }
    updateRoleMut.mutate({
      id: editingRole.id,
      data: {
        display_name: editRoleForm.display_name,
        description: editRoleForm.description || undefined,
        category: editRoleForm.categories.join(","),
      },
    });
  }

  function handleDeleteRole() {
    if (!editingRole) return;
    if (confirm(`Are you sure you want to delete the role "${editingRole.display_name}"? This will also delete all associated payment tiers.`)) {
      deleteRoleMut.mutate(editingRole.id);
    }
  }

  // ─── Edit Crew dialog helpers ─────────────────────────────────────────────

  function openEditCrewDialog(member: Crew) {
    setEditCrew(member);
    setEditCrewForm({
      first_name: member.first_name || member.contact?.first_name || "",
      last_name: member.last_name || member.contact?.last_name || "",
      email: member.email || member.contact?.email || "",
      crew_color: member.crew_color || "",
    });
    setEditCrewFormErrors({});
    setAddRoleId("");
  }

  function closeEditCrewDialog() {
    setEditCrew(null);
    setEditCrewFormErrors({});
    setAddRoleId("");
  }

  function validateEditCrewForm() {
    const newErrors: { [key: string]: string } = {};
    if (!editCrewForm.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editCrewForm.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!editCrewForm.first_name) newErrors.first_name = "First name is required";
    if (!editCrewForm.last_name) newErrors.last_name = "Last name is required";
    setEditCrewFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSaveCrew() {
    if (!editCrew || !validateEditCrewForm()) return;
    const data: UpdateCrewDto = {
      first_name: editCrewForm.first_name,
      last_name: editCrewForm.last_name,
      email: editCrewForm.email,
    };
    updateCrewMut.mutate({ id: editCrew.id, data });
    // Also update crew_color via crew profile endpoint if changed
    if (editCrewForm.crew_color !== (editCrew.crew_color || "")) {
      updateCrewProfileMut.mutate({
        id: editCrew.id,
        data: { crew_color: editCrewForm.crew_color || null },
      });
    }
  }

  // Get the roles not yet assigned to this crew entry for the add dropdown
  function unassignedRolesFor(member: Crew): typeof sortedRoles {
    const assignedIds = new Set((member.job_role_assignments ?? []).map(jr => jr.job_role_id));
    return sortedRoles.filter(r => !assignedIds.has(r.id));
  }

  function handleCreateRoleStep() {
    if (!roleFormState.display_name?.trim()) {
      toast("Name is required", "error");
      return;
    }
    if (roleFormState.categories.length === 0) {
      toast("At least one category is required", "error");
      return;
    }
    const slug = roleFormState.name || generateSlug(roleFormState.display_name);
    createRoleMut.mutate({
      name: slug,
      display_name: roleFormState.display_name,
      description: roleFormState.description || undefined,
      category: roleFormState.categories.join(",") || undefined,
      is_active: true,
    });
  }

  function handleChooseBracketCount(count: 1 | 4) {
    setNumBrackets(count);
    if (count === 1) {
      setWizardStep(3);
      setBracketForms([{ ...emptyBracketForm }]);
      setDayRateManualWizard([false]);
      setHalfDayRateManualWizard([false]);
    } else {
      setWizardStep(3);
      const defaults = generateDefaultBrackets();
      setBracketForms(defaults);
      setDayRateManualWizard(new Array(defaults.length).fill(false));
      setHalfDayRateManualWizard(new Array(defaults.length).fill(false));
    }
  }

  function handleCreateBracketsStep() {
    if (!newRoleId) return;
    if (bracketForms.length === 0) {
      toast("At least one bracket is required", "error");
      return;
    }

    // Validate all brackets
    for (const bracket of bracketForms) {
      if (!bracket.name || !bracket.hourly_rate) {
        toast("All brackets must have a name and hourly rate", "error");
        return;
      }
    }

    // Create all brackets — compute OT from brand multiplier, ensure day rate
    bracketForms.forEach((bracket) => {
      const dayRate = bracket.day_rate || roundMoney(bracket.hourly_rate * STANDARD_DAY_HOURS);
      const overtimeRate = roundMoney(bracket.hourly_rate * otMultiplier);
      const halfDayRate = bracket.half_day_rate || roundMoney(dayRate / 2);
      const payload = {
        name: bracket.name,
        display_name: bracket.display_name || undefined,
        level: bracket.level,
        hourly_rate: bracket.hourly_rate,
        day_rate: dayRate || undefined,
        half_day_rate: halfDayRate || undefined,
        overtime_rate: overtimeRate || undefined,
        description: bracket.description || undefined,
        color: bracket.color || undefined,
        job_role_id: newRoleId,
      };
      createMut.mutate(payload as CreatePaymentBracketData);
    });

    closeRoleAndTierWizard();
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  // Determine which role is selected based on activeTab
  const selectedRole = sortedRoles[activeTab] ?? null;
  const selectedBrackets = selectedRole
    ? richBracketsForRole(selectedRole.name)
    : [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Crew Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your crew and configure payment brackets by role
          {currentBrand ? ` — ${currentBrand.name}` : ""}
        </Typography>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Crew List                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
        <Box>
          {/* ─── Role filter cards ──────────────────────────────────────────── */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mb: 4,
              alignItems: "stretch",
            }}
          >
            {/* One card per role */}
            {sortedRoles.map((role, idx) => {
                const isSelected = selectedRoleFilter === role.id;
                const color = ROLE_CARD_COLORS[idx % ROLE_CARD_COLORS.length];
                const hoverShadow = alpha(color, 0.25);
                const roleCrewCount = crew.filter((c) =>
                  c.job_role_assignments?.some((jr) => jr.job_role_id === role.id)
                ).length;
                const topBracket = richBracketsForRole(role.name).slice(-1)[0];
                const topRate = topBracket ? formatRateDisplay(topBracket.hourly_rate, currencyCode) : null;

                return (
                  <Card
                    key={role.id}
                    elevation={0}
                    onClick={() => setSelectedRoleFilter(isSelected ? null : role.id)}
                    sx={{
                      p: 2.5,
                      flex: "1 1 160px",
                      border: "1px solid",
                      borderColor: isSelected ? "rgba(255,255,255,0.45)" : "divider",
                      borderRadius: 3,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      minHeight: 140,
                      position: "relative",
                      overflow: "hidden",
                      background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
                      backgroundSize: "200% 200%",
                      opacity: isSelected ? 1 : 0.9,
                      "&:hover": {
                        borderColor: color,
                        transform: "translateY(-4px)",
                        boxShadow: `0 8px 25px ${hoverShadow}`,
                        opacity: 1,
                        backgroundPosition: "right center",
                      },
                    }}
                  >
                    <Box sx={{ position: "absolute", top: -10, right: -10, opacity: 0.2, zIndex: 0 }}>
                      <RoleIcon sx={{ fontSize: 60, color: "#fff" }} />
                    </Box>
                    <Box sx={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 400, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                          {role.display_name ?? role.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mb: 2, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                        {roleCrewCount} crew
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto" }}>
                        <Chip
                          size="small"
                          label={`${roleCrewCount} assigned`}
                          sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "rgba(0,0,0,0.8)", fontWeight: 600, fontSize: "0.75rem", boxShadow: 1 }}
                        />
                        {topRate && (
                          <Typography variant="body2" sx={{ color: "#fff", fontWeight: 400, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                            {topRate}/hr
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            {/* ─── Add Crew thin card ─── */}
            <Card
              elevation={0}
              onClick={() => setAddCrewDialogOpen(true)}
              sx={{
                p: 1.5,
                border: "1px dashed",
                borderColor: "rgba(255,255,255,0.15)",
                borderRadius: 3,
                cursor: "pointer",
                transition: "all 0.3s ease",
                minHeight: 140,
                width: 88,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                bgcolor: "rgba(255,255,255,0.01)",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.35)",
                  bgcolor: "rgba(255,255,255,0.04)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <PersonAddIcon sx={{ fontSize: 22, color: "rgba(255,255,255,0.25)" }} />
              <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", textAlign: "center", lineHeight: 1.3 }}>
                Add<br />Crew
              </Typography>
            </Card>
            {/* ─── Add Role thin card ─── */}
            <Card
              elevation={0}
              onClick={openRoleAndTierWizard}
              sx={{
                p: 1.5,
                border: "1px dashed",
                borderColor: "rgba(255,255,255,0.15)",
                borderRadius: 3,
                cursor: "pointer",
                transition: "all 0.3s ease",
                minHeight: 140,
                width: 88,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                bgcolor: "rgba(255,255,255,0.01)",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.35)",
                  bgcolor: "rgba(255,255,255,0.04)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <AddIcon sx={{ fontSize: 22, color: "rgba(255,255,255,0.25)" }} />
              <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", textAlign: "center", lineHeight: 1.3 }}>
                Add<br />Role
              </Typography>
            </Card>
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              {selectedRoleFilter
                ? `${sortedRoles.find((r) => r.id === selectedRoleFilter)?.display_name ?? "Role"} (${filteredCrew.length})`
                : `All Crew (${crew.length})`
              }
            </Typography>
          </Stack>

          {filteredCrew.length === 0 ? (
            <Card variant="outlined">
              <CardContent sx={{ textAlign: "center", py: 8 }}>
                <CrewIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {crew.length === 0 ? "No crew yet" : "No crew in this role"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {crew.length === 0 ? "Add your first crew entry to get started" : "Try selecting a different role or add crew above"}
                </Typography>
                {crew.length === 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setAddCrewDialogOpen(true)}
                  >
                    Add Crew
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              {/* ── Left: crew table ── */}
              <Box sx={{ flex: "0 0 50%", minWidth: 0 }}>
                <StudioTable
                  sectionColor={selectedRoleFilter ? (ROLE_CARD_COLORS[sortedRoles.findIndex((r) => r.id === selectedRoleFilter) % ROLE_CARD_COLORS.length] ?? sectionColors.crew) : sectionColors.crew}
                  columns={[
                    {
                      key: 'member',
                      label: 'Crew',
                      flex: 2,
                      headerIcon: <PersonIcon />,
                      render: (m) => (
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              bgcolor: m.crew_color || "primary.main",
                              width: 36,
                              height: 36,
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            {initials(m.contact?.first_name, m.contact?.last_name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                              {m.full_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {m.email}
                            </Typography>
                          </Box>
                        </Stack>
                      ),
                    },
                    {
                      key: 'roles',
                      label: 'Roles',
                      flex: 3,
                      headerIcon: <RoleIcon />,
                      render: (m) => {
                        const roles = m.job_role_assignments ?? [];
                        return roles.length > 0 ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {roles.map((jr) => (
                              <Chip
                                key={jr.id}
                                label={jr.job_role?.display_name || jr.job_role?.name}
                                size="small"
                                icon={jr.is_primary ? <StarIcon sx={{ fontSize: 12 }} /> : undefined}
                                color={jr.is_primary ? "primary" : "default"}
                                variant={jr.is_primary ? "filled" : "outlined"}
                                sx={{ fontSize: "0.75rem", borderRadius: 1 }}
                              />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.disabled" fontStyle="italic">
                            No roles
                          </Typography>
                        );
                      },
                    },
                  ] as StudioColumn<typeof crew[number]>[]}
                  rows={filteredCrew}
                  getRowKey={(m) => m.id}
                  onRowClick={(m) => openEditCrewDialog(m)}
                  onRowHover={(m) => setHoveredCrewId(m ? m.id : null)}
                  emptyMessage="No crew yet"
                />
              </Box>

              {/* ── Right: inline crew detail / edit panel ── */}
              {(() => {
                const hoveredCrew = hoveredCrewId ? (crew.find((c) => c.id === hoveredCrewId) ?? null) : null;
                const activePreviewCrew = editCrew ?? hoveredCrew;
                const isSelected = editCrew !== null;
                const panelMember = isSelected ? liveEditMember : activePreviewCrew;
                // Role-contextual panel: show role tiers when a role card is selected and no crew is active
                const panelRole = !panelMember && selectedRoleFilter !== null
                  ? (sortedRoles.find((r) => r.id === selectedRoleFilter) ?? null)
                  : null;
                const panelRoleBrackets = panelRole ? richBracketsForRole(panelRole.name) : [];
                const panelRoleColor = panelRole
                  ? (ROLE_CARD_COLORS[sortedRoles.findIndex((r) => r.id === panelRole.id) % ROLE_CARD_COLORS.length] ?? "#5C6BC0")
                  : "#5C6BC0";
                return (
                  <Box sx={{ flex: "1 1 0", minWidth: 0, position: "sticky", top: 80 }}>
                    {panelMember ? (() => {
                      const memberColor = panelMember.crew_color || "#5C6BC0";
                      const primaryRole = (panelMember.job_role_assignments ?? []).find((jr) => jr.is_primary);
                      return (
                        <Box sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          bgcolor: "rgba(255,255,255,0.02)",
                          border: "1px solid",
                          borderColor: isSelected ? alpha(memberColor, 0.45) : "rgba(255,255,255,0.08)",
                          borderRadius: 3,
                          overflow: "hidden",
                          transition: "border-color 0.2s",
                        }}>
                          {/* Header */}
                          <Box sx={{
                            p: 2.5,
                            pb: 2,
                            background: `linear-gradient(135deg, ${memberColor}33 0%, transparent 100%)`,
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                          }}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                              <Box sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${memberColor} 0%, ${alpha(memberColor, 0.75)} 100%)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                fontSize: 16,
                                fontWeight: 700,
                                color: "#fff",
                              }}>
                                {initials(panelMember.contact?.first_name, panelMember.contact?.last_name)}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.25 }} noWrap>
                                  {panelMember.full_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {panelMember.email}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={closeEditCrewDialog}
                                sx={{ flexShrink: 0, color: "text.disabled", mt: -0.5, "&:hover": { color: "text.primary" } }}
                              >
                                <CloseIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                            {/* Role chips */}
                            <Box sx={{ display: "flex", gap: 0.75, mt: 1.5, flexWrap: "wrap" }}>
                              {(panelMember.job_role_assignments ?? []).length === 0 ? (
                                <Typography variant="caption" color="text.disabled" fontStyle="italic">No roles assigned</Typography>
                              ) : (panelMember.job_role_assignments ?? []).map((jr) => (
                                <Chip
                                  key={jr.id}
                                  label={jr.job_role?.display_name || jr.job_role?.name}
                                  size="small"
                                  sx={{
                                    bgcolor: jr.is_primary ? `${memberColor}33` : "rgba(255,255,255,0.06)",
                                    color: jr.is_primary ? memberColor : "text.secondary",
                                    border: `1px solid ${jr.is_primary ? memberColor + "66" : "rgba(255,255,255,0.1)"}`,
                                    fontWeight: jr.is_primary ? 700 : 500,
                                    fontSize: "0.7rem",
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>

                          {/* Body */}
                          <Box sx={{ flex: 1, overflowY: "auto", p: 2.5, pt: 1.5 }}>

                            {/* Contact section */}
                            <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "text.disabled", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5, mt: 1 }}>
                              Contact
                            </Typography>
                            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1 }} />

                            {isSelected ? (
                              <Stack spacing={1.5} sx={{ mb: 2 }}>
                                <Stack direction="row" spacing={1.5}>
                                  <TextField
                                    label="First Name"
                                    value={editCrewForm.first_name}
                                    onChange={(e) => setEditCrewForm((f) => ({ ...f, first_name: e.target.value }))}
                                    error={!!editCrewFormErrors.first_name}
                                    helperText={editCrewFormErrors.first_name}
                                    required
                                    fullWidth
                                    size="small"
                                  />
                                  <TextField
                                    label="Last Name"
                                    value={editCrewForm.last_name}
                                    onChange={(e) => setEditCrewForm((f) => ({ ...f, last_name: e.target.value }))}
                                    error={!!editCrewFormErrors.last_name}
                                    helperText={editCrewFormErrors.last_name}
                                    required
                                    fullWidth
                                    size="small"
                                  />
                                </Stack>
                                <TextField
                                  label="Email"
                                  value={editCrewForm.email}
                                  onChange={(e) => setEditCrewForm((f) => ({ ...f, email: e.target.value }))}
                                  error={!!editCrewFormErrors.email}
                                  helperText={editCrewFormErrors.email}
                                  required
                                  fullWidth
                                  size="small"
                                />
                              </Stack>
                            ) : (
                              <>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.875 }}>
                                  <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>Name</Typography>
                                  <Typography sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>{panelMember.full_name}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.875 }}>
                                  <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>Email</Typography>
                                  <Typography sx={{ fontSize: "0.8125rem", fontWeight: 500, color: "text.secondary" }}>{panelMember.email || "—"}</Typography>
                                </Box>
                              </>
                            )}

                            {/* Color section */}
                            <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "text.disabled", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5, mt: 1.5 }}>
                              Crew Color
                            </Typography>
                            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1 }} />
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ py: 0.5 }}>
                              {CREW_COLORS.map((c) => (
                                <Box
                                  key={c}
                                  onClick={() => isSelected && setEditCrewForm((f) => ({ ...f, crew_color: c }))}
                                  sx={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    bgcolor: c,
                                    cursor: isSelected ? "pointer" : "default",
                                    border: (isSelected ? editCrewForm.crew_color : panelMember.crew_color) === c ? "2px solid #fff" : "2px solid transparent",
                                    boxShadow: (isSelected ? editCrewForm.crew_color : panelMember.crew_color) === c
                                      ? `0 0 0 2px ${c}`
                                      : "0 1px 3px rgba(0,0,0,0.15)",
                                    transition: "all 0.15s ease",
                                    ...(isSelected && { "&:hover": { transform: "scale(1.2)" } }),
                                  }}
                                />
                              ))}
                            </Stack>

                            {/* Roles section */}
                            <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "text.disabled", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5, mt: 2 }}>
                              Assigned Roles
                            </Typography>
                            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1 }} />

                            {(panelMember.job_role_assignments ?? []).length === 0 ? (
                              <Box sx={{ py: 2, textAlign: "center" }}>
                                <RoleIcon sx={{ fontSize: 24, color: "rgba(255,255,255,0.1)", mb: 0.5 }} />
                                <Typography sx={{ fontSize: "0.8125rem", color: "text.disabled" }}>No roles assigned yet</Typography>
                              </Box>
                            ) : (
                              <Stack spacing={0.5}>
                                {(panelMember.job_role_assignments ?? []).map((jr) => (
                                  <Box
                                    key={jr.id}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      px: 1.5,
                                      py: 0.875,
                                      borderRadius: 1.5,
                                      bgcolor: jr.is_primary ? alpha(memberColor, 0.08) : "rgba(255,255,255,0.02)",
                                      border: "1px solid",
                                      borderColor: jr.is_primary ? alpha(memberColor, 0.3) : "rgba(255,255,255,0.06)",
                                    }}
                                  >
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <RoleIcon sx={{ fontSize: 15, color: jr.is_primary ? memberColor : "text.disabled" }} />
                                      <Typography sx={{ fontSize: "0.8125rem", fontWeight: jr.is_primary ? 600 : 400 }}>
                                        {jr.job_role?.display_name || jr.job_role?.name}
                                      </Typography>
                                      {jr.is_primary && (
                                        <Chip label="Primary" size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, bgcolor: alpha(memberColor, 0.15), color: memberColor, border: `1px solid ${alpha(memberColor, 0.3)}` }} />
                                      )}
                                    </Stack>
                                    {isSelected && (
                                      <Stack direction="row" spacing={0.25}>
                                        {!jr.is_primary && (
                                          <Tooltip title="Set as primary">
                                            <IconButton size="small" color="primary" onClick={() => setPrimaryJobRoleMut.mutate({ crewId: panelMember.id, jobRoleId: jr.job_role_id })} disabled={setPrimaryJobRoleMut.isPending} sx={{ p: 0.5 }}>
                                              <StarIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                        <Tooltip title="Remove">
                                          <IconButton size="small" color="error" onClick={() => removeJobRoleMut.mutate({ crewId: panelMember.id, jobRoleId: jr.job_role_id })} disabled={removeJobRoleMut.isPending} sx={{ p: 0.5 }}>
                                            <CloseIcon sx={{ fontSize: 14 }} />
                                          </IconButton>
                                        </Tooltip>
                                      </Stack>
                                    )}
                                  </Box>
                                ))}
                              </Stack>
                            )}
                            {isSelected && unassignedRolesFor(panelMember).length > 0 && (
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Add a role</InputLabel>
                                  <Select value={addRoleId} label="Add a role" onChange={(e) => setAddRoleId(e.target.value as number)}>
                                    {unassignedRolesFor(panelMember).map((r) => (
                                      <MenuItem key={r.id} value={r.id}>{r.display_name || r.name}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => { if (addRoleId !== "") addJobRoleMut.mutate({ crewId: panelMember.id, jobRoleId: addRoleId as number }); }} disabled={addRoleId === "" || addJobRoleMut.isPending} sx={{ minWidth: 72, whiteSpace: "nowrap" }}>
                                  Add
                                </Button>
                              </Stack>
                            )}

                          {/* ── Payment Tiers section ── */}
                          {(panelMember.job_role_assignments ?? []).some(jr => richBracketsForRole(jr.job_role?.name ?? "").length > 0) && (() => (
                            <>
                              <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "text.disabled", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5, mt: 2 }}>
                                Payment Tiers
                              </Typography>
                              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1 }} />
                              <Stack spacing={0.5}>
                                {(panelMember.job_role_assignments ?? []).map((jr) => {
                                  const roleBrackets = richBracketsForRole(jr.job_role?.name ?? "");
                                  if (roleBrackets.length === 0) return null;
                                  const currentBracket = roleBrackets.find(b => b.crew_job_role_assignments?.some(a => a.crew_id === panelMember.id));
                                  const roleName = jr.job_role?.display_name || jr.job_role?.name || "";
                                  return (
                                    <Box key={jr.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, py: 0.375 }}>
                                      <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", flexShrink: 0, minWidth: 60 }} noWrap>{roleName}</Typography>
                                      {isSelected ? (
                                        <FormControl size="small" sx={{ flex: 1, maxWidth: 180 }}>
                                          <Select
                                            value={currentBracket?.id ?? ""}
                                            displayEmpty
                                            onChange={(e) => {
                                              const bId = e.target.value as number | "";
                                              if (bId === "") {
                                                if (currentBracket) unassignMut.mutate({ cId: panelMember.id, rId: jr.job_role_id });
                                              } else {
                                                assignMut.mutate({ crew_id: panelMember.id, job_role_id: jr.job_role_id, payment_bracket_id: bId as number });
                                              }
                                            }}
                                            sx={{ fontSize: "0.75rem", "& .MuiSelect-select": { py: 0.625 } }}
                                          >
                                            <MenuItem value=""><em style={{ fontSize: "0.75rem" }}>Unassigned</em></MenuItem>
                                            {roleBrackets.map((b) => {
                                              const acc = tierAccent(b.level, b.color);
                                              return (
                                                <MenuItem key={b.id} value={b.id} sx={{ fontSize: "0.75rem" }}>
                                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: acc, flexShrink: 0 }} />
                                                    {b.display_name || b.name}
                                                  </Box>
                                                </MenuItem>
                                              );
                                            })}
                                          </Select>
                                        </FormControl>
                                      ) : currentBracket ? (
                                        <Chip
                                          label={currentBracket.display_name || currentBracket.name}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: "0.7rem",
                                            bgcolor: alpha(tierAccent(currentBracket.level, currentBracket.color), 0.15),
                                            color: tierAccent(currentBracket.level, currentBracket.color),
                                            border: `1px solid ${alpha(tierAccent(currentBracket.level, currentBracket.color), 0.3)}`,
                                          }}
                                        />
                                      ) : (
                                        <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", fontStyle: "italic" }}>Unassigned</Typography>
                                      )}
                                    </Box>
                                  );
                                })}
                              </Stack>
                            </>
                          ))()}

                          {/* ── Skills section ── */}
                          {(() => {
                            const memberSkills = (panelMember.job_role_assignments ?? []).flatMap((jr) => {
                              const roleBrackets = richBracketsForRole(jr.job_role?.name ?? "");
                              const cur = roleBrackets.find(b => b.crew_job_role_assignments?.some(a => a.crew_id === panelMember.id));
                              return cur ? skillsForBracket(cur.id) : [];
                            });
                            if (memberSkills.length === 0) return null;
                            return (
                              <>
                                <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "text.disabled", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5, mt: 2 }}>
                                  Skills
                                </Typography>
                                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1 }} />
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                  {memberSkills.map((skill) => (
                                    <Chip
                                      key={skill.id}
                                      label={skill.skill_name}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: "0.7rem", height: 22, color: "text.secondary", borderColor: "rgba(255,255,255,0.12)" }}
                                    />
                                  ))}
                                </Stack>
                              </>
                            );
                          })()}
                          </Box>

                          {/* Footer */}
                          <Box sx={{ px: 2.5, py: 1.5, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: isSelected ? "flex-end" : "center", gap: 1 }}>
                            {isSelected ? (
                              <>
                                <Button size="small" onClick={closeEditCrewDialog} sx={{ color: "text.secondary" }}>Cancel</Button>
                                <Button size="small" variant="contained" onClick={handleSaveCrew} disabled={updateCrewMut.isPending || updateCrewProfileMut.isPending} sx={{ borderRadius: 1.5, px: 2.5 }}>
                                  Save Changes
                                </Button>
                              </>
                            ) : (
                              <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", fontStyle: "italic" }}>
                                Click row to edit
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })() : panelRole ? (
                      /* ── Full role management panel ── */
                      <Box sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: "rgba(255,255,255,0.02)",
                        border: "1px solid",
                        borderColor: alpha(panelRoleColor, 0.3),
                        borderRadius: 3,
                        overflow: "hidden",
                      }}>
                        {/* Role header */}
                        <Box sx={{
                          p: 2,
                          background: `linear-gradient(135deg, ${panelRoleColor}33 0%, transparent 100%)`,
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                            <Box sx={{
                              width: 40, height: 40, borderRadius: 2,
                              background: `linear-gradient(135deg, ${panelRoleColor} 0%, ${alpha(panelRoleColor, 0.75)} 100%)`,
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              <RoleIcon sx={{ fontSize: 20, color: "#fff" }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.25 }} noWrap>
                                {panelRole.display_name ?? panelRole.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {panelRoleBrackets.length} tier{panelRoleBrackets.length !== 1 ? "s" : ""} · {filteredCrew.length} crew
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.25} flexShrink={0} sx={{ mt: -0.25 }}>
                              <Tooltip title="Edit role">
                                <IconButton size="small" onClick={() => openEditRoleDialog(panelRole)} sx={{ p: 0.5, color: "text.disabled", "&:hover": { color: "primary.main" } }}>
                                  <EditIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete role">
                                <IconButton size="small" onClick={() => {
                                  if (confirm(`Delete role "${panelRole.display_name ?? panelRole.name}"? This also removes all tiers.`)) {
                                    deleteRoleMut.mutate(panelRole.id);
                                  }
                                }} sx={{ p: 0.5, color: "text.disabled", "&:hover": { color: "error.main" } }}>
                                  <DeleteIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Box>
                        </Box>

                        {/* Tier list — scrollable */}
                        <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
                          {panelRoleBrackets.length === 0 ? (
                            <Box sx={{ textAlign: "center", py: 6 }}>
                              <MoneyIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.08)", mb: 1 }} />
                              <Typography sx={{ fontSize: "0.875rem", color: "text.disabled", mb: 1.5 }}>
                                No payment tiers yet
                              </Typography>
                              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => openCreateBracket(panelRole.id)}>
                                Add First Tier
                              </Button>
                            </Box>
                          ) : (
                            <Stack spacing={1}>
                              {[...panelRoleBrackets].reverse().map((bracket, bIdx) => {
                                const accent = tierAccent(bracket.level, bracket.color);
                                const members = bracket.crew_job_role_assignments ?? [];
                                const bracketSkills = skillsForBracket(bracket.id);
                                return (
                                  <Box key={bracket.id} sx={{
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderLeft: `3px solid ${accent}`,
                                    borderRadius: 1.5,
                                    bgcolor: alpha(accent, 0.03),
                                    overflow: "hidden",
                                  }}>
                                    {/* Tier header */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, bgcolor: alpha(accent, 0.06) }}>
                                      <Box sx={{
                                        width: 26, height: 26, borderRadius: "50%",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        bgcolor: alpha(accent, 0.15), color: accent, fontWeight: 800, fontSize: 12, flexShrink: 0,
                                      }}>
                                        {bIdx === 0 ? <TrophyIcon sx={{ fontSize: 13 }} /> : bracket.level}
                                      </Box>
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: accent }} noWrap>
                                          {bracket.display_name || bracket.name}
                                        </Typography>
                                        <Typography sx={{ fontSize: "0.7rem", color: "text.disabled" }}>
                                          {(() => {
                                            const effectiveDay = bracket.day_rate || roundMoney(Number(bracket.hourly_rate) * STANDARD_DAY_HOURS);
                                            const effectiveHalf = bracket.half_day_rate || roundMoney(effectiveDay / 2);
                                            return `${formatRateDisplay(bracket.hourly_rate, currencyCode)}/hr · ${formatRateDisplay(effectiveDay, currencyCode)}/day · ${formatRateDisplay(effectiveHalf, currencyCode)}/½day`;
                                          })()}
                                        </Typography>
                                      </Box>
                                      <Stack direction="row" spacing={0.25} flexShrink={0}>
                                        <Tooltip title="Edit tier">
                                          <IconButton size="small" onClick={() => openEditBracket(bracket)} sx={{ p: 0.375, color: "text.disabled", "&:hover": { color: "primary.main" } }}>
                                            <EditIcon sx={{ fontSize: 13 }} />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete tier">
                                          <IconButton size="small" onClick={() => {
                                            if (confirm(`Delete tier "${bracket.display_name || bracket.name}"?`)) deleteMut.mutate(bracket.id);
                                          }} sx={{ p: 0.375, color: "text.disabled", "&:hover": { color: "error.main" } }}>
                                            <DeleteIcon sx={{ fontSize: 13 }} />
                                          </IconButton>
                                        </Tooltip>
                                      </Stack>
                                    </Box>
                                    {/* Crew in tier */}
                                    <Box sx={{ px: 1.5, pt: 1, pb: 0.75 }}>
                                      <Typography sx={{ fontSize: "0.63rem", fontWeight: 700, color: "text.disabled", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.75 }}>
                                        Crew
                                      </Typography>
                                      {members.length === 0 ? (
                                        <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", fontStyle: "italic", mb: 0.5 }}>
                                          No crew assigned
                                        </Typography>
                                      ) : (
                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 0.75 }}>
                                          {members.map((m) => (
                                            <Chip
                                              key={m.id}
                                              avatar={<Avatar sx={{ bgcolor: m.crew?.crew_color || accent, width: 20, height: 20, fontSize: 9 }}>{initials(m.crew?.contact?.first_name, m.crew?.contact?.last_name)}</Avatar>}
                                              label={crewName(m.crew)}
                                              size="small"
                                              variant="outlined"
                                              onDelete={() => unassignMut.mutate({ cId: m.crew_id, rId: m.job_role_id })}
                                              deleteIcon={<Tooltip title="Remove from tier"><CloseIcon sx={{ fontSize: 11 }} /></Tooltip>}
                                              sx={{ fontSize: "0.7rem", height: 21, borderColor: alpha(accent, 0.3), "& .MuiChip-deleteIcon": { color: "text.disabled", "&:hover": { color: "error.main" } } }}
                                            />
                                          ))}
                                        </Stack>
                                      )}
                                      <Button
                                        size="small"
                                        startIcon={<PersonAddIcon sx={{ fontSize: 12 }} />}
                                        onClick={() => {
                                          setAssignBracketId(bracket.id);
                                          setAssignTarget({ crewId: 0, jobRoleId: panelRole.id, name: "", roleName: panelRole.display_name ?? panelRole.name });
                                          setAssignDialogOpen(true);
                                        }}
                                        sx={{ fontSize: "0.7rem", py: 0.25, px: 0.75, textTransform: "none", color: "text.secondary", "&:hover": { color: "primary.main" } }}
                                      >
                                        Assign crew
                                      </Button>
                                    </Box>
                                    {/* Skills for tier */}
                                    <Box sx={{ px: 1.5, pt: 0.75, pb: 1, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                      <Typography sx={{ fontSize: "0.63rem", fontWeight: 700, color: "text.disabled", letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.75 }}>
                                        Skills
                                      </Typography>
                                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center">
                                        {bracketSkills.length === 0 ? (
                                          <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", fontStyle: "italic" }}>No skills mapped</Typography>
                                        ) : bracketSkills.sort((a, b) => b.priority - a.priority).map((mapping) => (
                                          <Chip
                                            key={mapping.id}
                                            label={mapping.skill_name}
                                            size="small"
                                            variant="outlined"
                                            onDelete={() => removeSkillMut.mutate(mapping.id)}
                                            deleteIcon={<Tooltip title="Remove skill"><CloseIcon sx={{ fontSize: 11 }} /></Tooltip>}
                                            sx={{ fontSize: "0.67rem", height: 21, borderColor: alpha(accent, 0.3), color: "text.secondary", "& .MuiChip-deleteIcon": { color: "text.disabled", "&:hover": { color: "error.main" } } }}
                                          />
                                        ))}
                                        {addSkillAnchor?.roleId === panelRole.id && addSkillAnchor?.bracketLevel === bracket.level ? (
                                          <Autocomplete
                                            freeSolo size="small"
                                            options={unmappedSkillsForBracket(bracket.id)}
                                            inputValue={newSkillName}
                                            onInputChange={(_, v) => setNewSkillName(v)}
                                            onChange={(_, value) => {
                                              const name = typeof value === "string" ? value.trim() : "";
                                              if (name) addSkillMut.mutate({ skill_name: name, job_role_id: panelRole.id, payment_bracket_id: bracket.id, priority: 2 });
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter" && newSkillName.trim()) { e.preventDefault(); addSkillMut.mutate({ skill_name: newSkillName.trim(), job_role_id: panelRole.id, payment_bracket_id: bracket.id, priority: 2 }); }
                                              if (e.key === "Escape") { setAddSkillAnchor(null); setNewSkillName(""); }
                                            }}
                                            onBlur={() => { setAddSkillAnchor(null); setNewSkillName(""); }}
                                            sx={{ minWidth: 150, maxWidth: 190 }}
                                            renderInput={(params) => (
                                              <TextField {...params} placeholder="Skill name…" variant="outlined" size="small" autoFocus
                                                sx={{ "& .MuiOutlinedInput-root": { fontSize: "0.72rem", height: 25, py: 0 } }} />
                                            )}
                                          />
                                        ) : (
                                          <Chip
                                            icon={<AddIcon sx={{ fontSize: 11 }} />}
                                            label="Add"
                                            size="small" variant="outlined"
                                            onClick={() => setAddSkillAnchor({ roleId: panelRole.id, bracketLevel: bracket.level })}
                                            sx={{ fontSize: "0.67rem", height: 21, borderStyle: "dashed", borderColor: alpha(accent, 0.25), color: "text.disabled", cursor: "pointer", "&:hover": { borderColor: accent, color: accent } }}
                                          />
                                        )}
                                      </Stack>
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Stack>
                          )}
                        </Box>

                        {/* Footer — add tier */}
                        <Box sx={{ px: 2, py: 1.25, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "center" }}>
                          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => openCreateBracket(panelRole.id)}
                            sx={{ fontSize: "0.75rem", textTransform: "none" }}>
                            Add Tier
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.5,
                        bgcolor: "rgba(255,255,255,0.01)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 3,
                        p: 4,
                        minHeight: 320,
                      }}>
                        <PersonIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.08)" }} />
                        <Typography sx={{ fontSize: "0.875rem", color: "text.disabled", textAlign: "center" }}>
                          Hover or click a crew member<br />to see details
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })()}
            </Box>
          )}
        </Box>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Assign bracket dialog                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.7)" } } }}
      >
        <DialogTitle>Assign Crew to Tier</DialogTitle>
        <DialogContent>
          {assignTarget && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {/* Pick crew (if not pre-selected) */}
              {assignTarget.crewId === 0 && (
                <FormControl fullWidth>
                  <InputLabel>Crew</InputLabel>
                  <Select
                    value={assignTarget.crewId || ""}
                    label="Crew"
                    onChange={(e) =>
                      setAssignTarget((prev) =>
                        prev ? { ...prev, crewId: Number(e.target.value) } : prev,
                      )
                    }
                  >
                    {crew
                      .filter((c) =>
                        c.job_role_assignments?.some(
                          (jr) => jr.job_role_id === assignTarget.jobRoleId,
                        ),
                      )
                      .map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.full_name} ({c.email})
                        </MenuItem>
                      ))}
                    {/* Also show crew not yet in this role */}
                    {crew
                      .filter(
                        (c) =>
                          !c.job_role_assignments?.some(
                            (jr) => jr.job_role_id === assignTarget.jobRoleId,
                          ),
                      )
                      .map((c) => (
                        <MenuItem key={c.id} value={c.id} disabled>
                          {c.full_name} — not in this role
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}

              {/* Pick bracket */}
              <FormControl fullWidth>
                <InputLabel>Payment Tier</InputLabel>
                <Select
                  value={assignBracketId}
                  label="Payment Tier"
                  onChange={(e) => setAssignBracketId(e.target.value as number)}
                >
                  {bracketsForRole(assignTarget.jobRoleId).map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: b.color || "#42A5F5",
                            flexShrink: 0,
                          }}
                        />
                        <span>
                          Tier {b.level} — {b.display_name || b.name}
                        </span>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto !important" }}>
                          {formatRateDisplay(b.hourly_rate, currencyCode)}/hr
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={
              !assignTarget ||
              assignTarget.crewId === 0 ||
              assignBracketId === "" ||
              assignMut.isPending
            }
            onClick={() => {
              if (!assignTarget || assignBracketId === "") return;
              assignMut.mutate({
                crew_id: assignTarget.crewId,
                job_role_id: assignTarget.jobRoleId,
                payment_bracket_id: assignBracketId as number,
              });
            }}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Add Crew Dialog                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={addCrewDialogOpen}
        onClose={closeAddCrewDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.7)" } } }}
      >
        <DialogTitle>Add Crew</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddCrew();
            }}
            sx={{ display: "flex", flexDirection: "column" }}
          >
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Email"
                value={crewForm.email}
                onChange={(e) => setCrewForm({ ...crewForm, email: e.target.value })}
                error={!!crewFormErrors.email}
                helperText={crewFormErrors.email}
                required
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="First Name"
                  value={crewForm.first_name}
                  onChange={(e) => setCrewForm({ ...crewForm, first_name: e.target.value })}
                  error={!!crewFormErrors.first_name}
                  helperText={crewFormErrors.first_name}
                  required
                  fullWidth
                />
                <TextField
                  label="Last Name"
                  value={crewForm.last_name}
                  onChange={(e) => setCrewForm({ ...crewForm, last_name: e.target.value })}
                  error={!!crewFormErrors.last_name}
                  helperText={crewFormErrors.last_name}
                  required
                  fullWidth
                />
              </Stack>
              <TextField
                label="Password"
                type="password"
                value={crewForm.password}
                onChange={(e) => setCrewForm({ ...crewForm, password: e.target.value })}
                error={!!crewFormErrors.password}
                helperText={crewFormErrors.password}
                required
                fullWidth
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddCrewDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddCrew}
            disabled={createCrewMut.isPending}
          >
            Add Crew
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Create / Edit Bracket Dialog                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={bracketDialogOpen} onClose={closeBracketDialog} maxWidth="sm" fullWidth slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.7)" } } }}>
        <DialogTitle>{editingBracket ? "Edit Payment Tier" : "Create Payment Tier"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {!editingBracket && (
              <FormControl fullWidth required>
                <InputLabel>Job Role</InputLabel>
                <Select
                  value={selectedJobRoleId || ""}
                  label="Job Role"
                  onChange={(e: SelectChangeEvent<number | string>) =>
                    setSelectedJobRoleId(Number(e.target.value))
                  }
                >
                  {sortedRoles.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.display_name || r.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Name (slug)"
                value={bracketForm.name}
                onChange={(e) => setBracketForm((f) => ({ ...f, name: e.target.value }))}
                required
                fullWidth
                placeholder="junior"
              />
              <TextField
                label="Display Name"
                value={bracketForm.display_name}
                onChange={(e) => setBracketForm((f) => ({ ...f, display_name: e.target.value }))}
                fullWidth
                placeholder="Junior Videographer"
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Level"
                type="number"
                value={bracketForm.level}
                onChange={(e) => setBracketForm((f) => ({ ...f, level: parseInt(e.target.value) || 1 }))}
                required
                inputProps={{ min: 1 }}
                sx={{ width: 100 }}
              />
              <TextField
                label={`Hourly Rate (${currencyCode})`}
                type="number"
                value={bracketForm.hourly_rate || ""}
                onChange={(e) => {
                  const hourly = parseFloat(e.target.value) || 0;
                  const newDay = roundMoney(hourly * STANDARD_DAY_HOURS);
                  setBracketForm((f) => ({
                    ...f,
                    hourly_rate: hourly,
                    ...(!dayRateManualBracket ? { day_rate: newDay } : {}),
                    ...(!halfDayRateManualBracket ? { half_day_rate: roundMoney((dayRateManualBracket ? f.day_rate : newDay) / 2) } : {}),
                  }));
                }}
                required
                inputProps={{ min: 0, step: 0.5 }}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label={`Day Rate (${currencyCode})`}
                type="number"
                value={bracketForm.day_rate || ""}
                onChange={(e) => {
                  const day = parseFloat(e.target.value) || 0;
                  setDayRateManualBracket(true);
                  setBracketForm((f) => ({
                    ...f,
                    day_rate: day,
                    ...(!halfDayRateManualBracket ? { half_day_rate: roundMoney(day / 2) } : {}),
                  }));
                }}
                inputProps={{ min: 0, step: 1 }}
                fullWidth
                helperText={!dayRateManualBracket ? `Auto: hourly × ${STANDARD_DAY_HOURS}h` : "Manually set"}
              />
              <TextField
                label={`Half-Day Rate (${currencyCode})`}
                type="number"
                value={bracketForm.half_day_rate || ""}
                onChange={(e) => {
                  setHalfDayRateManualBracket(true);
                  setBracketForm((f) => ({ ...f, half_day_rate: parseFloat(e.target.value) || 0 }));
                }}
                inputProps={{ min: 0, step: 1 }}
                fullWidth
                helperText={!halfDayRateManualBracket ? "Auto: day ÷ 2" : "Manually set"}
              />
              <Box sx={{ minWidth: 140 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Overtime ({otMultiplier}×)
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {bracketForm.hourly_rate
                    ? formatCurrency(roundMoney(bracketForm.hourly_rate * otMultiplier), currencyCode)
                    : "—"}/hr
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Set in Brand Settings
                </Typography>
              </Box>
            </Stack>
            <TextField
              label="Description"
              value={bracketForm.description}
              onChange={(e) => setBracketForm((f) => ({ ...f, description: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tier Color
              </Typography>
              <Stack direction="row" spacing={1}>
                {BRACKET_COLORS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setBracketForm((f) => ({ ...f, color: c }))}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: c,
                      cursor: "pointer",
                      border: bracketForm.color === c ? "3px solid white" : "2px solid transparent",
                      boxShadow: bracketForm.color === c ? `0 0 0 2px ${c}` : "none",
                      transition: "all 0.15s",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBracketDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveBracket}
            disabled={
              !bracketForm.name ||
              !bracketForm.hourly_rate ||
              !selectedJobRoleId ||
              createMut.isPending ||
              updateMut.isPending
            }
          >
            {editingBracket ? "Save Changes" : "Create Tier"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Role & Tier Creation Wizard Dialog                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={roleAndTierWizardOpen}
        onClose={closeRoleAndTierWizard}
        maxWidth={wizardStep === 3 && numBrackets === 4 ? "lg" : "sm"}
        fullWidth
        PaperProps={{
          component: "form",
          autoComplete: "off",
          onSubmit: (e: React.FormEvent) => e.preventDefault(),
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            bgcolor: "#111111",
            backgroundImage: "none",
            color: "#e0e0e0",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
          },
        }}
        slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" } } }}
      >
        {/* ─── Stepper Header ─────────────────────────────────────────── */}
        <Box
          sx={{
            px: 4,
            pt: 3.5,
            pb: 2.5,
            bgcolor: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Stepper pills */}
          <Stack direction="row" spacing={0} alignItems="center" justifyContent="center" sx={{ mb: 3 }}>
            {[
              { label: "Role", icon: <RoleIcon sx={{ fontSize: 16 }} />, step: 1 },
              { label: "Tiers", icon: <TiersIcon sx={{ fontSize: 16 }} />, step: 2 },
              { label: "Configure", icon: <ConfigureIcon sx={{ fontSize: 16 }} />, step: 3 },
            ].map(({ label, icon, step }, i) => (
              <React.Fragment key={step}>
                {i > 0 && (
                  <Box
                    sx={{
                      width: 32,
                      height: 1,
                      mx: 0.5,
                      bgcolor: wizardStep >= step ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.06)",
                      transition: "background-color 0.4s",
                    }}
                  />
                )}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 10,
                    bgcolor: wizardStep === step
                      ? "rgba(255,255,255,0.1)"
                      : wizardStep > step
                        ? "rgba(16,185,129,0.12)"
                        : "transparent",
                    border: "1px solid",
                    borderColor: wizardStep === step
                      ? "rgba(255,255,255,0.15)"
                      : wizardStep > step
                        ? "rgba(16,185,129,0.25)"
                        : "transparent",
                    transition: "all 0.3s",
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: wizardStep > step
                        ? "#10b981"
                        : wizardStep === step
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(255,255,255,0.04)",
                      color: wizardStep > step
                        ? "#fff"
                        : wizardStep === step
                          ? "#fff"
                          : "rgba(255,255,255,0.2)",
                      fontSize: 14,
                      transition: "all 0.3s",
                    }}
                  >
                    {wizardStep > step ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : icon}
                  </Box>
                  <Typography
                    variant="caption"
                    fontWeight={wizardStep === step ? 600 : 500}
                    color={wizardStep >= step ? "#fff" : "rgba(255,255,255,0.25)"}
                    sx={{ fontSize: "0.75rem", letterSpacing: 0.3, transition: "all 0.3s" }}
                  >
                    {label}
                  </Typography>
                </Box>
              </React.Fragment>
            ))}
          </Stack>
          <Typography variant="h6" fontWeight={700} textAlign="center" color="#fff" sx={{ letterSpacing: "-0.02em" }}>
            {wizardStep === 1
              ? "Create a New Job Role"
              : wizardStep === 2
                ? "Choose Payment Structure"
                : "Configure Payment Tiers"}
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.45)" textAlign="center" sx={{ mt: 0.5 }}>
            {wizardStep === 1
              ? "Define the role your crew will be assigned to"
              : wizardStep === 2
                ? "Pick how many pay tiers to start with"
                : `Set rates for each tier under ${roleFormState.display_name}`}
          </Typography>
        </Box>

        <DialogContent
          sx={{
            px: 4, pt: 3, pb: 2, maxHeight: "58vh", overflowY: "auto", bgcolor: "#111111",
            // Dark-theme overrides — force dark on every MUI input variant
            "& .MuiOutlinedInput-root": {
              color: "#e0e0e0",
              bgcolor: "transparent",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#10b981 !important" },
            },
            "& .MuiInputBase-root": { bgcolor: "transparent !important", color: "#e0e0e0" },
            "& .MuiInputBase-input": { bgcolor: "transparent !important", color: "#e0e0e0" },
            "& .MuiFilledInput-root": { bgcolor: "transparent !important", "&:hover": { bgcolor: "rgba(255,255,255,0.03) !important" }, "&.Mui-focused": { bgcolor: "transparent !important" } },
            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
            "& .MuiInputLabel-root.Mui-focused": { color: "#10b981 !important" },
            "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.35)" },
            "& .MuiAlert-root": { bgcolor: "rgba(255,255,255,0.06)", color: "#e0e0e0" },
            "& .MuiSelect-icon": { color: "rgba(255,255,255,0.5)" },
            "& .MuiAutocomplete-option": { color: "#e0e0e0 !important", "&[aria-selected=true]": { bgcolor: "rgba(16,185,129,0.2) !important" } },
            "& .MuiAutocomplete-listbox": { bgcolor: "#111111 !important" },
            "& .MuiAutocomplete-paper": { bgcolor: "#1a1a1a !important", color: "#e0e0e0" },
          }}
        >
          {wizardStep === 1 ? (
            // ── Step 1: Create Role ────────────────────────────────────
            <Stack spacing={2.5}>
              <TextField
                label="Name"
                value={roleFormState.display_name}
                onChange={(e) => {
                  const displayName = e.target.value;
                  setRoleFormState((f) => ({
                    ...f,
                    display_name: displayName,
                    name: generateSlug(displayName),
                  }));
                }}
                required
                fullWidth
                placeholder="e.g. Videographer"
                autoFocus
                autoComplete="off"
              />
              {roleFormState.display_name && (
                <Box sx={{ px: 1.5, py: 1, borderRadius: 1, bgcolor: "rgba(255,255,255,0.03))" }}>
                  <Typography variant="caption" color="rgba(255,255,255,0.5)">Slug:</Typography>
                  <Typography variant="body2" fontFamily="monospace" color="#e0e0e0">
                    {generateSlug(roleFormState.display_name)}
                  </Typography>
                </Box>
              )}
              <Autocomplete
                multiple
                options={DEFAULT_CATEGORIES}
                value={roleFormState.categories || []}
                onChange={(_, newValue) =>
                  setRoleFormState((f) => ({ ...f, categories: newValue || [] }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categories"
                    placeholder="Select categories"
                    required
                  />
                )}
                freeSolo
                handleHomeEndKeys
              />
              <TextField
                label="Description"
                value={roleFormState.description}
                onChange={(e) => setRoleFormState((f) => ({ ...f, description: e.target.value }))}
                multiline
                rows={2}
                fullWidth
                placeholder="Briefly describe the role and its responsibilities"
                autoComplete="off"
              />
            </Stack>
          ) : wizardStep === 2 ? (
            // ── Step 2: How many tiers? ────────────────────────────────
            <Stack spacing={3}>
              <Alert
                severity="success"
                icon={<CheckCircleIcon fontSize="inherit" />}
                sx={{ borderRadius: 2, bgcolor: "rgba(16,185,129,0.1)", color: "#a7f3d0", "& .MuiAlert-icon": { color: "#10b981" } }}
              >
                Role <strong>{roleFormState.display_name}</strong> created successfully!
              </Alert>
              <Typography variant="body2" color="rgba(255,255,255,0.55)">
                Payment tiers let you set different rates for experience levels within this role.
                We recommend starting with 4 standard tiers that you can customise.
              </Typography>
              <Stack direction="row" spacing={2}>
                {/* 1-Tier Card */}
                <Card
                  onClick={() => handleChooseBracketCount(1)}
                  sx={{
                    flex: 1,
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: numBrackets === 1 ? "#10b981" : "rgba(255,255,255,0.06)",
                    bgcolor: numBrackets === 1 ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
                    "&:hover": { borderColor: "rgba(255,255,255,0.15)", bgcolor: "rgba(255,255,255,0.04)", transform: "translateY(-2px)" },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        bgcolor: numBrackets === 1 ? "#10b981" : "rgba(255,255,255,0.08)",
                        color: numBrackets === 1 ? "#fff" : "rgba(255,255,255,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 1.5,
                        transition: "all 0.2s",
                      }}
                    >
                      <MoneyIcon />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} color="#fff">
                      1 Tier
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                      Start simple, add more later
                    </Typography>
                  </CardContent>
                </Card>

                {/* 4-Tier Card */}
                <Card
                  onClick={() => handleChooseBracketCount(4)}
                  sx={{
                    flex: 1,
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: numBrackets === 4 ? "#10b981" : "rgba(255,255,255,0.06)",
                    bgcolor: numBrackets === 4 ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
                    position: "relative",
                    overflow: "visible",
                    "&:hover": { borderColor: "rgba(255,255,255,0.15)", bgcolor: "rgba(255,255,255,0.04)", transform: "translateY(-2px)" },
                  }}
                >
                  <Chip
                    label="Recommended"
                    size="small"
                    sx={{ position: "absolute", top: -12, right: 12, fontWeight: 600, fontSize: "0.7rem", bgcolor: "#10b981", color: "#fff" }}
                  />
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        bgcolor: numBrackets === 4 ? "#10b981" : "rgba(255,255,255,0.08)",
                        color: numBrackets === 4 ? "#fff" : "rgba(255,255,255,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 1.5,
                        transition: "all 0.2s",
                      }}
                    >
                      <TiersIcon />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} color="#fff">
                      4 Tiers
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                      Junior · Mid · Senior · Lead
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>
          ) : (
            // ── Step 3: Configure tiers ───────────────────────────────
            <Grid container spacing={1.5}>
                {bracketForms.map((bracket, idx) => {
                  const accentColor = bracket.color || BRACKET_COLORS[idx] || "#42A5F5";
                  return (
                    <Grid item xs={12} sm={6} md={numBrackets === 4 ? 3 : numBrackets === 1 ? 12 : 6} key={idx}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          bgcolor: "rgba(255,255,255,0.025)",
                          borderColor: alpha(accentColor, 0.15),
                          borderTop: `3px solid ${accentColor}`,
                          transition: "all 0.2s ease",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.05)", borderColor: alpha(accentColor, 0.3) },
                          height: "100%",
                        }}
                      >
                        <CardContent sx={{ px: 2, pt: 1.5, pb: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <Stack spacing={1.5}>
                            {/* Tier heading */}
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: "50%",
                                  bgcolor: accentColor,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {bracket.level}
                              </Box>
                              <Typography variant="subtitle2" fontWeight={700}>
                                {bracket.display_name || `Tier ${idx + 1}`}
                              </Typography>
                            </Stack>

                            {/* Name / Display row */}
                            <Stack direction="row" spacing={1}>
                              <TextField
                                size="small"
                                label="Slug"
                                value={bracket.name}
                                onChange={(e) => {
                                  const newForms = [...bracketForms];
                                  newForms[idx] = { ...newForms[idx], name: e.target.value };
                                  setBracketForms(newForms);
                                }}
                                fullWidth
                                autoComplete="off"
                                InputProps={{ sx: { fontFamily: "monospace", fontSize: "0.8rem" } }}
                              />
                              <TextField
                                size="small"
                                label="Display Name"
                                value={bracket.display_name}
                                onChange={(e) => {
                                  const newForms = [...bracketForms];
                                  newForms[idx] = {
                                    ...newForms[idx],
                                    display_name: e.target.value,
                                    name: generateSlug(e.target.value),
                                  };
                                  setBracketForms(newForms);
                                }}
                                fullWidth
                                autoComplete="off"
                              />
                            </Stack>

                            {/* Rates row */}
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                              <TextField
                                size="small"
                                label={`Hourly (${currencyCode})`}
                                type="number"
                                value={bracket.hourly_rate || ""}
                                onChange={(e) => {
                                  const hourly = parseFloat(e.target.value) || 0;
                                  const newForms = [...bracketForms];
                                  const isManual = dayRateManualWizard[idx];
                                  const isHalfManual = halfDayRateManualWizard[idx];
                                  const newDay = roundMoney(hourly * STANDARD_DAY_HOURS);
                                  newForms[idx] = {
                                    ...newForms[idx],
                                    hourly_rate: hourly,
                                    ...(!isManual ? { day_rate: newDay } : {}),
                                    ...(!isHalfManual ? { half_day_rate: roundMoney((isManual ? newForms[idx].day_rate : newDay) / 2) } : {}),
                                  };
                                  setBracketForms(newForms);
                                }}
                                inputProps={{ min: 0, step: 0.5 }}
                                fullWidth
                                required
                                autoComplete="off"
                              />
                              <TextField
                                size="small"
                                label={`Day (${currencyCode})`}
                                type="number"
                                value={bracket.day_rate || ""}
                                onChange={(e) => {
                                  const day = parseFloat(e.target.value) || 0;
                                  const newManual = [...dayRateManualWizard];
                                  newManual[idx] = true;
                                  setDayRateManualWizard(newManual);
                                  const isHalfManual = halfDayRateManualWizard[idx];
                                  const newForms = [...bracketForms];
                                  newForms[idx] = {
                                    ...newForms[idx],
                                    day_rate: day,
                                    ...(!isHalfManual ? { half_day_rate: roundMoney(day / 2) } : {}),
                                  };
                                  setBracketForms(newForms);
                                }}
                                inputProps={{ min: 0 }}
                                fullWidth
                                autoComplete="off"
                                helperText={!dayRateManualWizard[idx] ? `×${STANDARD_DAY_HOURS}h` : ""}
                              />
                              <TextField
                                size="small"
                                label={`Half-Day (${currencyCode})`}
                                type="number"
                                value={bracket.half_day_rate || ""}
                                onChange={(e) => {
                                  const newManual = [...halfDayRateManualWizard];
                                  newManual[idx] = true;
                                  setHalfDayRateManualWizard(newManual);
                                  const newForms = [...bracketForms];
                                  newForms[idx] = { ...newForms[idx], half_day_rate: parseFloat(e.target.value) || 0 };
                                  setBracketForms(newForms);
                                }}
                                inputProps={{ min: 0 }}
                                fullWidth
                                autoComplete="off"
                                helperText={!halfDayRateManualWizard[idx] ? "Auto: day ÷ 2" : ""}
                              />
                            </Stack>

                            {/* OT read-only */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: "rgba(255,255,255,0.04)",
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                OT ({otMultiplier}×):
                              </Typography>
                              <Typography variant="caption" fontWeight={700}>
                                {bracket.hourly_rate
                                  ? formatCurrency(roundMoney(bracket.hourly_rate * otMultiplier), currencyCode)
                                  : "—"}/hr
                              </Typography>
                            </Box>

                            {/* Color row */}
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              {BRACKET_COLORS.map((c) => (
                                <Box
                                  key={c}
                                  onClick={() => {
                                    const newForms = [...bracketForms];
                                    newForms[idx] = { ...newForms[idx], color: c };
                                    setBracketForms(newForms);
                                  }}
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    bgcolor: c,
                                    cursor: "pointer",
                                    border: bracket.color === c ? "2px solid white" : "2px solid transparent",
                                    boxShadow: bracket.color === c ? `0 0 0 2px ${c}` : "none",
                                    transition: "all 0.15s",
                                    "&:hover": { transform: "scale(1.2)" },
                                  }}
                                />
                              ))}
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 4, py: 2, borderTop: "1px solid rgba(255,255,255,0.06)", bgcolor: "#111111" }}>
          <Button onClick={closeRoleAndTierWizard} sx={{ color: "rgba(255,255,255,0.4)", textTransform: "none", fontWeight: 500, fontSize: "0.875rem" }}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          {wizardStep > 1 && (
            <Button
              variant="outlined"
              onClick={() => {
                if (wizardStep === 3) {
                  setWizardStep(2);
                  setNumBrackets(null);
                } else {
                  setWizardStep(1);
                  setNewRoleId(null);
                }
              }}
              sx={{ mr: 1, borderColor: "rgba(255,255,255,0.12)", color: "#ccc", textTransform: "none", fontWeight: 500, fontSize: "0.875rem", borderRadius: 2, "&:hover": { borderColor: "rgba(255,255,255,0.3)", bgcolor: "rgba(255,255,255,0.04)" } }}
            >
              Back
            </Button>
          )}
          {wizardStep !== 2 && (
            <Button
              variant="contained"
              endIcon={wizardStep === 1 ? <ArrowForwardIcon /> : undefined}
              onClick={
                wizardStep === 1
                  ? handleCreateRoleStep
                  : handleCreateBracketsStep
              }
              disabled={
                wizardStep === 1
                  ? !roleFormState.display_name || createRoleMut.isPending
                  : bracketForms.some((b) => !b.name || !b.hourly_rate) || createMut.isPending
              }
              sx={{ px: 3, bgcolor: "#10b981", textTransform: "none", fontWeight: 600, fontSize: "0.875rem", borderRadius: 2, boxShadow: "0 2px 8px rgba(16,185,129,0.3)", "&:hover": { bgcolor: "#059669", boxShadow: "0 4px 14px rgba(16,185,129,0.4)" }, "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)", boxShadow: "none" } }}
            >
              {wizardStep === 1
                ? "Create Role"
                : `Create ${numBrackets} Tier${numBrackets !== 1 ? "s" : ""}`}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Edit Role Dialog                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={editRoleDialogOpen} onClose={closeEditRoleDialog} maxWidth="sm" fullWidth slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.7)" } } }}>
        <DialogTitle>Edit Role: {editingRole?.display_name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Display Name"
              value={editRoleForm.display_name}
              onChange={(e) => setEditRoleForm((f) => ({ ...f, display_name: e.target.value }))}
              required
              fullWidth
            />
            <Autocomplete
              multiple
              options={DEFAULT_CATEGORIES}
              value={editRoleForm.categories || []}
              onChange={(_, newValue) => setEditRoleForm((f) => ({ ...f, categories: newValue || [] }))}
              freeSolo
              renderInput={(params) => (
                <TextField {...params} label="Categories *" placeholder="Select categories" />
              )}
            />
            <TextField
              label="Description"
              value={editRoleForm.description}
              onChange={(e) => setEditRoleForm((f) => ({ ...f, description: e.target.value }))}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditRoleDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteRole}
            disabled={updateRoleMut.isPending || deleteRoleMut.isPending}
          >
            Delete Role
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRole}
            disabled={!editRoleForm.display_name || updateRoleMut.isPending}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>


      {/* ─── Snackbar ────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}