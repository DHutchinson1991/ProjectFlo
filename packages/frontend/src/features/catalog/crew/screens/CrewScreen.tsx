"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SkillTreeView from "../components/SkillTreeView";
import { useBrand } from "@/app/providers/BrandProvider";
import { formatCurrency } from "@/lib/utils/formatUtils";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
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
  Tabs,
  Tab,
  Tooltip,
  SelectChangeEvent,
  alpha,
  Grid,
  Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Groups as CrewIcon,
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
  AccountTree as SkillTreeIcon,
} from "@mui/icons-material";
import type { Contributor, UpdateContributorDto } from "@/lib/types/domains/users";
import { api } from "@/lib/api";
import { paymentBracketsApi } from "@/features/finance/payment-brackets";
import type {
  PaymentBracket,
  CreatePaymentBracketData,
  UpdatePaymentBracketData,
  AssignBracketData,
  BracketContributorAssignment,
  BrandSetting,
  SkillRoleMapping,
} from "@/lib/types";

// ─── Bracket Form ───────────────────────────────────────────────────────────

interface BracketFormData {
  name: string;
  display_name: string;
  level: number;
  hourly_rate: number;
  day_rate: number;
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

function contribName(c: BracketContributorAssignment["contributor"]): string {
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

export function CrewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentBrand } = useBrand();
  const currencyCode = currentBrand?.currency || "USD";

  // Top-level tab: 0 = Crew List, 1 = Payment Brackets
  const [mainTab, setMainTab] = useState(0);

  // activeTab = role index (only role tabs, no crew members tab)
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

  // Assign bracket to contributor dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{
    contributorId: number;
    jobRoleId: number;
    name: string;
    roleName: string;
  } | null>(null);
  const [assignBracketId, setAssignBracketId] = useState<number | "">("");

  // Add new crew member dialog
  const [addCrewDialogOpen, setAddCrewDialogOpen] = useState(false);
  const [crewForm, setCrewForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    contributor_type: "Internal",
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
  const [dayRateManualBracket, setDayRateManualBracket] = useState(false);

  // Edit role dialog
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [editRoleForm, setEditRoleForm] = useState({
    display_name: "",
    description: "",
    categories: [] as string[],
  });

  // Edit crew member dialog (includes role management)
  const [editCrewDialogOpen, setEditCrewDialogOpen] = useState(false);
  const [editCrewMember, setEditCrewMember] = useState<Contributor | null>(null);
  const [editCrewForm, setEditCrewForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    contributor_type: "Internal",
    crew_color: "" as string,
  });
  const [editCrewFormErrors, setEditCrewFormErrors] = useState<{ [key: string]: string }>({});
  const [addRoleId, setAddRoleId] = useState<number | string>("");

  const CREW_COLORS = [
    "#42A5F5", "#66BB6A", "#AB47BC", "#FF7043",
    "#78909C", "#FFCA28", "#26C6DA", "#EC407A",
    "#5C6BC0", "#8D6E63", "#26A69A", "#D4E157",
  ];

  // ─── Data ─────────────────────────────────────────────────────────────────

  const {
    data: contributors = [],
    isLoading: loadContrib,
  } = useQuery({
    queryKey: ["contributors", currentBrand?.id],
    queryFn: () => api.contributors.getAll(),
    enabled: !!currentBrand,
  });

  const {
    data: jobRoles = [],
    isLoading: loadRoles,
  } = useQuery({
    queryKey: ["jobRoles"],
    queryFn: () => api.jobRoles.getAll(),
  });

  const {
    data: allBrackets = [],
    isLoading: loadBrackets,
  } = useQuery({
    queryKey: ["paymentBrackets"],
    queryFn: () => paymentBracketsApi.getAll(true),
  });

  const {
    data: bracketsByRole,
    isLoading: loadGrouped,
  } = useQuery({
    queryKey: ["paymentBracketsByRole", currentBrand?.id],
    queryFn: () => paymentBracketsApi.getByRole(currentBrand?.id),
    enabled: !!currentBrand,
  });

  // Fetch brand-level overtime multiplier setting
  const { data: otSetting } = useQuery<BrandSetting | null>({
    queryKey: ["brandSetting", "overtime_multiplier", currentBrand?.id],
    queryFn: async () => {
      if (!currentBrand?.id) return null;
      try {
        return await api.brands.getSetting(currentBrand.id, "overtime_multiplier");
      } catch {
        // Setting doesn't exist yet — will use default
        return null;
      }
    },
    enabled: !!currentBrand?.id,
  });

  const otMultiplier = otSetting?.value ? parseFloat(otSetting.value) : DEFAULT_OT_MULTIPLIER;

  // Fetch all skill-role mappings for display on bracket cards
  const {
    data: allSkillMappings = [],
  } = useQuery({
    queryKey: ["skillRoleMappings", currentBrand?.id],
    queryFn: () => api.skillRoleMappings.getAll({ brandId: currentBrand?.id }),
    enabled: !!currentBrand,
  });

  // Fetch available skills for autocomplete
  const {
    data: availableSkills = [],
  } = useQuery({
    queryKey: ["availableSkills", currentBrand?.id],
    queryFn: () => api.skillRoleMappings.getAvailableSkills(currentBrand?.id),
    enabled: !!currentBrand,
  });

  // Add skill mapping state
  const [addSkillAnchor, setAddSkillAnchor] = useState<{ roleId: number; bracketLevel: number } | null>(null);
  const [newSkillName, setNewSkillName] = useState("");

  // ─── Derived ──────────────────────────────────────────────────────────────

  const crewMembers = useMemo(
    () => contributors.filter((c) => c.is_crew && !c.archived_at),
    [contributors],
  );

  // Derive live member from query data so role changes reflect instantly
  const liveEditMember = useMemo(
    () => (editCrewMember ? crewMembers.find((c) => c.id === editCrewMember.id) ?? editCrewMember : null),
    [crewMembers, editCrewMember],
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

  // Brackets with contributor data from grouped endpoint
  const richBracketsForRole = (roleName: string): PaymentBracket[] => {
    if (!bracketsByRole) return [];
    const group = bracketsByRole[roleName];
    return group?.brackets?.sort((a: PaymentBracket, b: PaymentBracket) => a.level - b.level) ?? [];
  };

  const isLoading = loadContrib || loadRoles || loadBrackets || loadGrouped;

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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["paymentBrackets"] });
    queryClient.invalidateQueries({ queryKey: ["paymentBracketsByRole"] });
    queryClient.invalidateQueries({ queryKey: ["contributors"] });
  };

  const invalidateSkills = () => {
    queryClient.invalidateQueries({ queryKey: ["skillRoleMappings"] });
    queryClient.invalidateQueries({ queryKey: ["availableSkills"] });
  };

  // Skill mapping mutations
  const addSkillMut = useMutation({
    mutationFn: (data: { skill_name: string; job_role_id: number; payment_bracket_id: number; priority?: number }) =>
      api.skillRoleMappings.create(data),
    onSuccess: () => { invalidateSkills(); setNewSkillName(""); setAddSkillAnchor(null); toast("Skill mapped"); },
    onError: (e: Error) => toast(e.message || "Failed to map skill", "error"),
  });

  const removeSkillMut = useMutation({
    mutationFn: (id: number) => api.skillRoleMappings.delete(id),
    onSuccess: () => { invalidateSkills(); toast("Skill removed"); },
    onError: (e: Error) => toast(e.message || "Failed to remove skill", "error"),
  });

  const createMut = useMutation({
    mutationFn: (data: CreatePaymentBracketData) => paymentBracketsApi.create(data),
    onSuccess: () => { invalidateAll(); closeBracketDialog(); toast("Bracket created"); },
    onError: (e: Error) => toast(e.message || "Failed to create bracket", "error"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentBracketData }) => paymentBracketsApi.update(id, data),
    onSuccess: () => { invalidateAll(); closeBracketDialog(); toast("Bracket updated"); },
    onError: (e: Error) => toast(e.message || "Failed to update bracket", "error"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => paymentBracketsApi.delete(id),
    onSuccess: () => { invalidateAll(); toast("Bracket deactivated"); },
    onError: (e: Error) => toast(e.message || "Failed to delete bracket", "error"),
  });
  const assignMut = useMutation({
    mutationFn: (data: AssignBracketData) => paymentBracketsApi.assign(data),
    onSuccess: () => { invalidateAll(); setAssignDialogOpen(false); setAssignTarget(null); toast("Bracket assigned"); },
    onError: (e: Error) => toast(e.message || "Failed to assign bracket", "error"),
  });
  const unassignMut = useMutation({
    mutationFn: ({ cId, rId }: { cId: number; rId: number }) => paymentBracketsApi.unassign(cId, rId),
    onSuccess: () => { invalidateAll(); toast("Bracket removed"); },
    onError: (e: Error) => toast(e.message || "Failed to remove bracket", "error"),
  });

  const createCrewMut = useMutation({
    mutationFn: (data: any) => api.contributors.create(data),
    onSuccess: () => { invalidateAll(); closeAddCrewDialog(); toast("Crew member added"); },
    onError: (e: Error) => toast(e.message || "Failed to add crew member", "error"),
  });

  const createRoleMut = useMutation({
    mutationFn: (data: any) => api.jobRoles.create(data),
    onSuccess: (newRole) => {
      setNewRoleId(newRole.id);
      setWizardStep(2);
      toast("Role created!");
    },
    onError: (e: Error) => toast(e.message || "Failed to create role", "error"),
  });

  const updateRoleMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.jobRoles.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobRoles"] });
      setEditRoleDialogOpen(false);
      setEditingRole(null);
      toast("Role updated successfully");
    },
    onError: (e: Error) => toast(e.message || "Failed to update role", "error"),
  });

  const deleteRoleMut = useMutation({
    mutationFn: (id: number) => api.jobRoles.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobRoles"] });
      queryClient.invalidateQueries({ queryKey: ["paymentBrackets"] });
      queryClient.invalidateQueries({ queryKey: ["paymentBracketsByRole"] });
      setActiveTab(0);
      toast("Role deleted successfully");
    },
    onError: (e: Error) => toast(e.message || "Failed to delete role", "error"),
  });

  // ─── Crew Edit Mutations ──────────────────────────────────────────────────

  const updateContributorMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContributorDto }) =>
      api.contributors.update(id, data),
    onSuccess: () => {
      invalidateAll();
      toast("Crew member updated");
    },
    onError: (e: Error) => toast(e.message || "Failed to update crew member", "error"),
  });

  const addJobRoleMut = useMutation({
    mutationFn: ({ contributorId, jobRoleId }: { contributorId: number; jobRoleId: number }) =>
      api.contributors.addJobRole(contributorId, jobRoleId),
    onSuccess: () => {
      invalidateAll();
      setAddRoleId("");
      toast("Role added");
    },
    onError: (e: Error) => toast(e.message || "Failed to add role", "error"),
  });

  const removeJobRoleMut = useMutation({
    mutationFn: ({ contributorId, jobRoleId }: { contributorId: number; jobRoleId: number }) =>
      api.contributors.removeJobRole(contributorId, jobRoleId),
    onSuccess: () => {
      invalidateAll();
      toast("Role removed");
    },
    onError: (e: Error) => toast(e.message || "Failed to remove role", "error"),
  });

  const setPrimaryJobRoleMut = useMutation({
    mutationFn: ({ contributorId, jobRoleId }: { contributorId: number; jobRoleId: number }) =>
      api.contributors.setPrimaryJobRole(contributorId, jobRoleId),
    onSuccess: () => {
      invalidateAll();
      toast("Primary role updated");
    },
    onError: (e: Error) => toast(e.message || "Failed to set primary role", "error"),
  });

  const updateCrewProfileMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { crew_color?: string | null; bio?: string | null } }) =>
      api.crew.updateProfile(id, data),
    onSuccess: () => {
      invalidateAll();
      toast("Profile updated");
    },
    onError: (e: Error) => toast(e.message || "Failed to update profile", "error"),
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

  function openEditBracket(b: PaymentBracket) {
    setEditingBracket(b);
    setSelectedJobRoleId(b.job_role_id);
    const hourly = Number(b.hourly_rate);
    const day = b.day_rate ? Number(b.day_rate) : 0;
    // If day rate doesn't match the auto-calc, user has overridden it
    setDayRateManualBracket(day > 0 && Math.abs(day - hourly * STANDARD_DAY_HOURS) > 0.01);
    setBracketForm({
      name: b.name,
      display_name: b.display_name || "",
      level: b.level,
      hourly_rate: hourly,
      day_rate: day,
      overtime_rate: b.overtime_rate ? Number(b.overtime_rate) : 0,
      description: b.description || "",
      color: b.color || "#42A5F5",
    });
    setBracketDialogOpen(true);
  }

  function handleSaveBracket() {
    if (!selectedJobRoleId) return;
    const dayRate = bracketForm.day_rate || bracketForm.hourly_rate * STANDARD_DAY_HOURS;
    const overtimeRate = parseFloat((bracketForm.hourly_rate * otMultiplier).toFixed(2));
    const payload = {
      name: bracketForm.name,
      display_name: bracketForm.display_name || undefined,
      level: bracketForm.level,
      hourly_rate: bracketForm.hourly_rate,
      day_rate: dayRate || undefined,
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
      contributor_type: "Internal",
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

  function handleAddCrewMember() {
    if (!validateCrewForm()) return;

    const newCrewData = {
      email: crewForm.email,
      first_name: crewForm.first_name,
      last_name: crewForm.last_name,
      password: crewForm.password,
      role_id: sortedRoles[0]?.id || 1, // Default to first role
      contributor_type: crewForm.contributor_type,
      is_crew: true,
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

  function openEditCrewDialog(member: Contributor) {
    setEditCrewMember(member);
    setEditCrewForm({
      first_name: member.first_name || member.contact?.first_name || "",
      last_name: member.last_name || member.contact?.last_name || "",
      email: member.email || member.contact?.email || "",
      contributor_type: member.contributor_type || "Internal",
      crew_color: member.crew_color || "",
    });
    setEditCrewFormErrors({});
    setAddRoleId("");
    setEditCrewDialogOpen(true);
  }

  function closeEditCrewDialog() {
    setEditCrewDialogOpen(false);
    setEditCrewMember(null);
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

  function handleSaveCrewMember() {
    if (!editCrewMember || !validateEditCrewForm()) return;
    const data: UpdateContributorDto = {
      first_name: editCrewForm.first_name,
      last_name: editCrewForm.last_name,
      email: editCrewForm.email,
      contributor_type: editCrewForm.contributor_type,
    };
    updateContributorMut.mutate({ id: editCrewMember.id, data });
    // Also update crew_color via crew profile endpoint if changed
    if (editCrewForm.crew_color !== (editCrewMember.crew_color || "")) {
      updateCrewProfileMut.mutate({
        id: editCrewMember.id,
        data: { crew_color: editCrewForm.crew_color || null },
      });
    }
    closeEditCrewDialog();
  }

  // Get the roles NOT yet assigned to this contributor for the add dropdown
  function unassignedRolesFor(member: Contributor): typeof sortedRoles {
    const assignedIds = new Set((member.contributor_job_roles ?? []).map(jr => jr.job_role_id));
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
    } else {
      setWizardStep(3);
      const defaults = generateDefaultBrackets();
      setBracketForms(defaults);
      setDayRateManualWizard(new Array(defaults.length).fill(false));
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
      const dayRate = bracket.day_rate || bracket.hourly_rate * STANDARD_DAY_HOURS;
      const overtimeRate = parseFloat((bracket.hourly_rate * otMultiplier).toFixed(2));
      const payload = {
        name: bracket.name,
        display_name: bracket.display_name || undefined,
        level: bracket.level,
        hourly_rate: bracket.hourly_rate,
        day_rate: dayRate || undefined,
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
          Manage your crew members and configure payment brackets by role
          {currentBrand ? ` — ${currentBrand.name}` : ""}
        </Typography>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Top-level tabs: Crew List | Payment Brackets                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={mainTab}
          onChange={(_, v) => setMainTab(v)}
          sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "0.95rem" } }}
        >
          <Tab icon={<CrewIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Crew List" />
          <Tab icon={<MoneyIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Payment Brackets" />
          <Tab icon={<SkillTreeIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Skill Tree" />
        </Tabs>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 0: Crew List                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {mainTab === 0 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              Crew Members ({crewMembers.length})
            </Typography>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => setAddCrewDialogOpen(true)}
            >
              Add Crew Member
            </Button>
          </Stack>

          {crewMembers.length === 0 ? (
            <Card variant="outlined">
              <CardContent sx={{ textAlign: "center", py: 8 }}>
                <CrewIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No crew members yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Add your first crew member to get started
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddCrewDialogOpen(true)}
                >
                  Add Crew Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Card} elevation={1}>
              <Table>
                <TableHead>
                  <TableRow sx={{ "& .MuiTableCell-head": { fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" } }}>
                    <TableCell>Crew Member</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell align="center" sx={{ width: 60 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {crewMembers.map((m) => {
                    const roles = m.contributor_job_roles ?? [];
                    return (
                      <TableRow
                        key={m.id}
                        hover
                        onClick={() => openEditCrewDialog(m)}
                        sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              sx={{
                                bgcolor: m.crew_color || "primary.main",
                                width: 40,
                                height: 40,
                                fontSize: 15,
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
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={m.contributor_type || "Internal"}
                            size="small"
                            variant="outlined"
                            color={m.contributor_type === "External" ? "warning" : "default"}
                            sx={{ borderRadius: 1, fontSize: "0.75rem" }}
                          />
                        </TableCell>
                        <TableCell>
                          {roles.length > 0 ? (
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
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); openEditCrewDialog(m); }}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Payment Brackets                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {mainTab === 1 && (
        <Box>
        {sortedRoles.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 8 }}>
            <CrewIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No roles configured
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create job roles to start managing payment brackets
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
            {/* ─── Header: Add Role button ────────────────────────────────────── */}
            <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openRoleAndTierWizard}
                size="small"
              >
                Add Role
              </Button>
            </Stack>

            {/* ─── Tabs: Role 1 | Role 2 | … ────────────────────── */}
            {sortedRoles.length > 0 && (
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {sortedRoles.map((role) => (
                    <Tab
                      key={role.id}
                      label={role.display_name ?? role.name}
                      sx={{ textTransform: "none", fontWeight: 500, minHeight: 48 }}
                    />
                  ))}
                </Tabs>
              </Box>
            )}
            {selectedRole ? (
              <Box>
                {/* Role header bar */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  sx={{ mb: 3 }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {selectedRole.display_name ?? selectedRole.name}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                      {selectedRole.category && selectedRole.category.split(",")
                        .map(cat => cat.trim())
                        .sort((a, b) => DEFAULT_CATEGORIES.indexOf(a) - DEFAULT_CATEGORIES.indexOf(b))
                        .map((cat) => (
                        <Chip key={cat} label={cat} size="small" variant="outlined" />
                      ))}
                      <Typography variant="caption" color="text.secondary">
                        {selectedBrackets.length} tier{selectedBrackets.length !== 1 ? "s" : ""}
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit role">
                      <IconButton
                        size="small"
                        onClick={() => openEditRoleDialog(selectedRole)}
                        sx={{ color: "primary.main" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete role">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingRole(selectedRole);
                          if (confirm(`Are you sure you want to delete the role "${selectedRole.display_name}"? This will also delete all associated payment tiers.`)) {
                            deleteRoleMut.mutate(selectedRole.id);
                          }
                        }}
                        sx={{ color: "error.main" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Payment Tiers
                </Typography>

                {selectedBrackets.length === 0 ? (
                <Card>
                  <CardContent sx={{ textAlign: "center", py: 8 }}>
                    <MoneyIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No payment tiers yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Add bracket tiers for {selectedRole.display_name ?? selectedRole.name} to
                      start assigning crew. Use the &ldquo;Add Role&rdquo; button at the top to create a new role
                      and its first tier.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={openRoleAndTierWizard}
                    >
                      Create First Tier
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Stack spacing={0}>
                  {/* Render tiers from HIGHEST to LOWEST (top of page = highest rank) */}
                  {[...selectedBrackets].reverse().map((bracket, idx) => {
                const accent = tierAccent(bracket.level, bracket.color);
                const members = bracket.contributor_job_roles ?? [];
                const isTopTier = idx === 0;

                return (
                  <Box key={bracket.id}>
                    {/* ── Tier Card ── */}
                    <Card
                      variant="outlined"
                      sx={{
                        borderLeft: `4px solid ${accent}`,
                        borderRadius: 2,
                        overflow: "visible",
                        position: "relative",
                        mb: 0,
                        "&::before": isTopTier
                          ? {
                              content: '""',
                              position: "absolute",
                              top: -2,
                              left: -4,
                              right: 0,
                              height: 3,
                              background: `linear-gradient(90deg, ${accent}, transparent)`,
                              borderRadius: "4px 4px 0 0",
                            }
                          : undefined,
                      }}
                    >
                      {/* Tier header */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          px: 3,
                          py: 2,
                          bgcolor: (theme) => alpha(accent, theme.palette.mode === "dark" ? 0.08 : 0.04),
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          {/* Rank badge */}
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: (theme) => alpha(accent, theme.palette.mode === "dark" ? 0.2 : 0.12),
                              color: accent,
                              fontWeight: 800,
                              fontSize: 18,
                            }}
                          >
                            {isTopTier ? (
                              <TrophyIcon sx={{ fontSize: 22 }} />
                            ) : (
                              bracket.level
                            )}
                          </Box>
                          <Box>
                            <Typography variant="h6" fontWeight={700} sx={{ color: accent, lineHeight: 1.3 }}>
                              {bracket.display_name || bracket.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Tier {bracket.level}
                              {bracket.description ? ` — ${bracket.description}` : ""}
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Rate badges */}
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="h6" fontWeight={700} sx={{ color: accent }}>
                              {formatRateDisplay(bracket.hourly_rate, currencyCode)}<Typography component="span" variant="caption" color="text.secondary">/hr</Typography>
                            </Typography>
                          </Box>
                          {bracket.day_rate && (
                            <Box sx={{ textAlign: "right" }}>
                              <Typography variant="body2" fontWeight={600}>
                                {formatRateDisplay(bracket.day_rate, currencyCode)}<Typography component="span" variant="caption" color="text.secondary">/day</Typography>
                              </Typography>
                            </Box>
                          )}
                          {bracket.overtime_rate && (
                            <Box sx={{ textAlign: "right" }}>
                              <Typography variant="body2" color="text.secondary">
                                {formatRateDisplay(bracket.overtime_rate, currencyCode)}<Typography component="span" variant="caption"> OT</Typography>
                              </Typography>
                            </Box>
                          )}
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Edit tier">
                              <IconButton size="small" onClick={() => openEditBracket(bracket)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Deactivate tier">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  if (confirm(`Deactivate "${bracket.display_name || bracket.name}"?`)) {
                                    deleteMut.mutate(bracket.id);
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </Box>

                      {/* Members in this bracket */}
                      <Box sx={{ px: 3, py: 2 }}>
                        {members.length === 0 ? (
                          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
                            No crew assigned to this tier yet
                          </Typography>
                        ) : (
                          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                            {members.map((m) => (
                              <Tooltip key={m.id} title={m.contributor?.contact?.email ?? ""}>
                                <Chip
                                  avatar={
                                    <Avatar
                                      sx={{
                                        bgcolor: m.contributor?.crew_color || accent,
                                        width: 28,
                                        height: 28,
                                        fontSize: 12,
                                      }}
                                    >
                                      {initials(
                                        m.contributor?.contact?.first_name,
                                        m.contributor?.contact?.last_name,
                                      )}
                                    </Avatar>
                                  }
                                  label={contribName(m.contributor)}
                                  variant="outlined"
                                  onClick={() => router.push(`/manager/users/${m.contributor_id}`)}
                                  onDelete={() => unassignMut.mutate({ cId: m.contributor_id, rId: m.job_role_id })}
                                  deleteIcon={
                                    <Tooltip title="Remove from this tier">
                                      <DeleteIcon sx={{ fontSize: 16 }} />
                                    </Tooltip>
                                  }
                                  sx={{
                                    borderColor: accent,
                                    cursor: "pointer",
                                    "& .MuiChip-deleteIcon": { color: "text.secondary", "&:hover": { color: "error.main" } },
                                  }}
                                />
                              </Tooltip>
                            ))}
                          </Stack>
                        )}

                        {/* "Assign crew" quick button */}
                        <Button
                          size="small"
                          startIcon={<PersonAddIcon />}
                          onClick={() => {
                            // Open assign dialog defaulting to this bracket
                            setAssignBracketId(bracket.id);
                            setAssignTarget({
                              contributorId: 0, // will be picked in dialog
                              jobRoleId: selectedRole.id,
                              name: "",
                              roleName: selectedRole.display_name ?? selectedRole.name,
                            });
                            setAssignDialogOpen(true);
                          }}
                          sx={{ mt: members.length > 0 ? 1.5 : 0.5, textTransform: "none" }}
                        >
                          Assign crew member
                        </Button>
                      </Box>

                      {/* ── Mapped Skills for this bracket tier ── */}
                      {(() => {
                        const bracketSkills = skillsForBracket(bracket.id);
                        return (
                          <Box
                            sx={{
                              px: 3,
                              py: 1.5,
                              borderTop: "1px solid",
                              borderColor: "divider",
                              bgcolor: (theme) => alpha(accent, theme.palette.mode === "dark" ? 0.03 : 0.02),
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                              <SkillIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Skills
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
                              {bracketSkills.length === 0 ? (
                                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                                  No skills mapped to this tier yet
                                </Typography>
                              ) : (
                                bracketSkills
                                  .sort((a, b) => b.priority - a.priority)
                                  .map((mapping) => (
                                    <Chip
                                      key={mapping.id}
                                      label={mapping.skill_name}
                                      size="small"
                                      variant="outlined"
                                      onDelete={() => removeSkillMut.mutate(mapping.id)}
                                      deleteIcon={
                                        <Tooltip title="Remove skill mapping">
                                          <CloseIcon sx={{ fontSize: 14 }} />
                                        </Tooltip>
                                      }
                                      sx={{
                                        fontSize: "0.7rem",
                                        height: 24,
                                        borderColor: alpha(accent, 0.4),
                                        color: "text.secondary",
                                        "& .MuiChip-deleteIcon": {
                                          fontSize: 14,
                                          color: "text.disabled",
                                          "&:hover": { color: "error.main" },
                                        },
                                      }}
                                    />
                                  ))
                              )}
                              {/* Inline add skill */}
                              {addSkillAnchor?.roleId === selectedRole.id && addSkillAnchor?.bracketLevel === bracket.level ? (
                                <Autocomplete
                                  freeSolo
                                  size="small"
                                  options={unmappedSkillsForBracket(bracket.id)}
                                  inputValue={newSkillName}
                                  onInputChange={(_, v) => setNewSkillName(v)}
                                  onChange={(_, value) => {
                                    const name = typeof value === "string" ? value.trim() : "";
                                    if (name) {
                                      addSkillMut.mutate({ skill_name: name, job_role_id: selectedRole.id, payment_bracket_id: bracket.id, priority: 2 });
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && newSkillName.trim()) {
                                      e.preventDefault();
                                      addSkillMut.mutate({ skill_name: newSkillName.trim(), job_role_id: selectedRole.id, payment_bracket_id: bracket.id, priority: 2 });
                                    }
                                    if (e.key === "Escape") {
                                      setAddSkillAnchor(null);
                                      setNewSkillName("");
                                    }
                                  }}
                                  onBlur={() => { setAddSkillAnchor(null); setNewSkillName(""); }}
                                  sx={{ minWidth: 180, maxWidth: 220 }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      placeholder="Type skill name…"
                                      variant="outlined"
                                      size="small"
                                      autoFocus
                                      sx={{
                                        "& .MuiOutlinedInput-root": { fontSize: "0.75rem", height: 28, py: 0 },
                                      }}
                                    />
                                  )}
                                />
                              ) : (
                                <Chip
                                  icon={<AddIcon sx={{ fontSize: 14 }} />}
                                  label="Add"
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setAddSkillAnchor({ roleId: selectedRole.id, bracketLevel: bracket.level })}
                                  sx={{
                                    fontSize: "0.7rem",
                                    height: 24,
                                    borderStyle: "dashed",
                                    borderColor: alpha(accent, 0.3),
                                    color: "text.disabled",
                                    cursor: "pointer",
                                    "&:hover": { borderColor: accent, color: accent },
                                  }}
                                />
                              )}
                            </Stack>
                          </Box>
                        );
                      })()}
                    </Card>

                    {/* Connector arrow between tiers */}
                    {idx < selectedBrackets.length - 1 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          py: 0.5,
                          color: "text.disabled",
                        }}
                      >
                        <ArrowUpIcon sx={{ fontSize: 20 }} />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Stack>
              )}
            </Box>
            ) : (
              <Card variant="outlined">
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                  <MoneyIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    Select a role from the tabs to view payment tiers
                  </Typography>
                </CardContent>
              </Card>
            )}
        </Box>
        )}
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Skill Tree                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {mainTab === 2 && (
        <Box>
          {sortedRoles.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 8 }}>
                <SkillTreeIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No roles configured
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create job roles to see the skill tree visualisation
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box>
              {/* ─── Role sub-tabs ─── */}
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {sortedRoles.map((role) => (
                    <Tab
                      key={role.id}
                      label={role.display_name ?? role.name}
                      sx={{ textTransform: "none", fontWeight: 500, minHeight: 48 }}
                    />
                  ))}
                </Tabs>
              </Box>
              {selectedRole ? (
                <SkillTreeView
                  brackets={selectedBrackets}
                  skillMappings={allSkillMappings.filter(m => {
                    const bracketIds = new Set(selectedBrackets.map(b => b.id));
                    return bracketIds.has(m.payment_bracket_id ?? -1) && m.is_active;
                  })}
                  roleName={selectedRole.display_name ?? selectedRole.name}
                  currencyCode={currencyCode}
                  formatRate={formatRateDisplay}
                />
              ) : (
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: "center", py: 6 }}>
                    <SkillTreeIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      Select a role to view its skill tree
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </Box>
      )}

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
              {/* Pick contributor (if not pre-selected) */}
              {assignTarget.contributorId === 0 && (
                <FormControl fullWidth>
                  <InputLabel>Crew Member</InputLabel>
                  <Select
                    value={assignTarget.contributorId || ""}
                    label="Crew Member"
                    onChange={(e) =>
                      setAssignTarget((prev) =>
                        prev ? { ...prev, contributorId: Number(e.target.value) } : prev,
                      )
                    }
                  >
                    {crewMembers
                      .filter((c) =>
                        c.contributor_job_roles?.some(
                          (jr) => jr.job_role_id === assignTarget.jobRoleId,
                        ),
                      )
                      .map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.full_name} ({c.email})
                        </MenuItem>
                      ))}
                    {/* Also show crew not yet in this role */}
                    {crewMembers
                      .filter(
                        (c) =>
                          !c.contributor_job_roles?.some(
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
              assignTarget.contributorId === 0 ||
              assignBracketId === "" ||
              assignMut.isPending
            }
            onClick={() => {
              if (!assignTarget || assignBracketId === "") return;
              assignMut.mutate({
                contributor_id: assignTarget.contributorId,
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
      {/* Add Crew Member Dialog                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={addCrewDialogOpen}
        onClose={closeAddCrewDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.7)" } } }}
      >
        <DialogTitle>Add Crew Member</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddCrewMember();
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
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={crewForm.contributor_type}
                  onChange={(e) =>
                    setCrewForm({
                      ...crewForm,
                      contributor_type: e.target.value,
                    })
                  }
                  label="Type"
                >
                  <MenuItem value="Internal">Internal</MenuItem>
                  <MenuItem value="External">External</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddCrewDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddCrewMember}
            disabled={createCrewMut.isPending}
          >
            Add Crew Member
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
                  setBracketForm((f) => ({
                    ...f,
                    hourly_rate: hourly,
                    ...(!dayRateManualBracket ? { day_rate: parseFloat((hourly * STANDARD_DAY_HOURS).toFixed(2)) } : {}),
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
                  setDayRateManualBracket(true);
                  setBracketForm((f) => ({ ...f, day_rate: parseFloat(e.target.value) || 0 }));
                }}
                inputProps={{ min: 0, step: 1 }}
                fullWidth
                helperText={!dayRateManualBracket ? `Auto: hourly × ${STANDARD_DAY_HOURS}h` : "Manually set"}
              />
              <Box sx={{ minWidth: 140 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Overtime ({otMultiplier}×)
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {bracketForm.hourly_rate
                    ? formatCurrency(parseFloat((bracketForm.hourly_rate * otMultiplier).toFixed(2)), currencyCode)
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
              ? "Define the role your crew members will be assigned to"
              : wizardStep === 2
                ? "Pick how many pay tiers to start with"
                : `Set rates for each tier under ${roleFormState.display_name}`}
          </Typography>
        </Box>

        <DialogContent
          sx={{
            px: 4, pt: 3, pb: 2, maxHeight: "58vh", overflowY: "auto", bgcolor: "#111111",
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
                                  newForms[idx] = {
                                    ...newForms[idx],
                                    hourly_rate: hourly,
                                    ...(!isManual ? { day_rate: parseFloat((hourly * STANDARD_DAY_HOURS).toFixed(2)) } : {}),
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
                                  const newManual = [...dayRateManualWizard];
                                  newManual[idx] = true;
                                  setDayRateManualWizard(newManual);
                                  const newForms = [...bracketForms];
                                  newForms[idx] = { ...newForms[idx], day_rate: parseFloat(e.target.value) || 0 };
                                  setBracketForms(newForms);
                                }}
                                inputProps={{ min: 0 }}
                                fullWidth
                                autoComplete="off"
                                helperText={!dayRateManualWizard[idx] ? `×${STANDARD_DAY_HOURS}h` : ""}
                              />
                            </Stack>

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
                                  ? formatCurrency(parseFloat((bracket.hourly_rate * otMultiplier).toFixed(2)), currencyCode)
                                  : "—"}/hr
                              </Typography>
                            </Box>

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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Edit Crew Member Dialog (unified with role management)              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={editCrewDialogOpen}
        onClose={closeEditCrewDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.5)" } } }}
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        {liveEditMember && (
          <>
            <Box
              sx={{
                background: `linear-gradient(135deg, ${liveEditMember.crew_color || "#5C6BC0"} 0%, ${alpha(liveEditMember.crew_color || "#5C6BC0", 0.7)} 100%)`,
                px: 3,
                pt: 3,
                pb: 2.5,
                position: "relative",
              }}
            >
              <IconButton
                onClick={closeEditCrewDialog}
                size="small"
                sx={{ position: "absolute", top: 8, right: 8, color: "rgba(255,255,255,0.8)", "&:hover": { color: "#fff" } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    width: 52,
                    height: 52,
                    fontSize: 20,
                    fontWeight: 700,
                    border: "2px solid rgba(255,255,255,0.3)",
                  }}
                >
                  {initials(liveEditMember.contact?.first_name, liveEditMember.contact?.last_name)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: "#fff", lineHeight: 1.2 }}>
                    {liveEditMember.full_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                    {liveEditMember.email}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1, mb: 1.5, display: "block" }}>
                    Personal Details
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2}>
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
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={editCrewForm.contributor_type}
                        onChange={(e) => setEditCrewForm((f) => ({ ...f, contributor_type: e.target.value }))}
                        label="Type"
                      >
                        <MenuItem value="Internal">Internal</MenuItem>
                        <MenuItem value="External">External</MenuItem>
                      </Select>
                    </FormControl>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Crew Color
                      </Typography>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {CREW_COLORS.map((c) => (
                          <Box
                            key={c}
                            onClick={() => setEditCrewForm((f) => ({ ...f, crew_color: c }))}
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              bgcolor: c,
                              cursor: "pointer",
                              border: editCrewForm.crew_color === c ? "2.5px solid #fff" : "2px solid transparent",
                              boxShadow: editCrewForm.crew_color === c ? `0 0 0 2px ${c}, 0 2px 8px ${alpha(c, 0.4)}` : "0 1px 3px rgba(0,0,0,0.15)",
                              transition: "all 0.15s ease",
                              "&:hover": { transform: "scale(1.15)", boxShadow: `0 2px 8px ${alpha(c, 0.5)}` },
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ borderTop: 1, borderColor: "divider" }} />

                <Box>
                  <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1, mb: 1.5, display: "block" }}>
                    Assigned Roles
                  </Typography>
                  {(liveEditMember.contributor_job_roles ?? []).length === 0 ? (
                    <Box
                      sx={{
                        py: 2.5,
                        px: 2,
                        borderRadius: 2,
                        bgcolor: (theme) => alpha(theme.palette.text.disabled, 0.04),
                        textAlign: "center",
                      }}
                    >
                      <RoleIcon sx={{ fontSize: 28, color: "text.disabled", mb: 0.5 }} />
                      <Typography variant="body2" color="text.disabled">
                        No roles assigned yet
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={0.75}>
                      {(liveEditMember.contributor_job_roles ?? []).map((jr) => (
                        <Box
                          key={jr.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 1.5,
                            py: 1,
                            borderRadius: 1.5,
                            border: "1px solid",
                            borderColor: jr.is_primary ? "primary.main" : "divider",
                            bgcolor: jr.is_primary ? (theme) => alpha(theme.palette.primary.main, 0.04) : "transparent",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <RoleIcon sx={{ fontSize: 18, color: jr.is_primary ? "primary.main" : "text.secondary" }} />
                            <Typography variant="body2" fontWeight={jr.is_primary ? 600 : 400}>
                              {jr.job_role?.display_name || jr.job_role?.name}
                            </Typography>
                            {jr.is_primary && (
                              <Chip label="Primary" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }} />
                            )}
                          </Stack>
                          <Stack direction="row" spacing={0.25}>
                            {!jr.is_primary && (
                              <Tooltip title="Set as primary">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() =>
                                    setPrimaryJobRoleMut.mutate({
                                      contributorId: liveEditMember.id,
                                      jobRoleId: jr.job_role_id,
                                    })
                                  }
                                  disabled={setPrimaryJobRoleMut.isPending}
                                  sx={{ p: 0.5 }}
                                >
                                  <StarIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Remove">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  removeJobRoleMut.mutate({
                                    contributorId: liveEditMember.id,
                                    jobRoleId: jr.job_role_id,
                                  })
                                }
                                disabled={removeJobRoleMut.isPending}
                                sx={{ p: 0.5 }}
                              >
                                <CloseIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}

                  {unassignedRolesFor(liveEditMember).length > 0 && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Add a role</InputLabel>
                        <Select
                          value={addRoleId}
                          label="Add a role"
                          onChange={(e) => setAddRoleId(e.target.value as number)}
                        >
                          {unassignedRolesFor(liveEditMember).map((r) => (
                            <MenuItem key={r.id} value={r.id}>
                              {r.display_name || r.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          if (addRoleId !== "") {
                            addJobRoleMut.mutate({
                              contributorId: liveEditMember.id,
                              jobRoleId: addRoleId as number,
                            });
                          }
                        }}
                        disabled={addRoleId === "" || addJobRoleMut.isPending}
                        sx={{ minWidth: 80, whiteSpace: "nowrap" }}
                      >
                        Add
                      </Button>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={closeEditCrewDialog} sx={{ color: "text.secondary" }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveCrewMember}
                disabled={updateContributorMut.isPending || updateCrewProfileMut.isPending}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Save Changes
              </Button>
            </DialogActions>
          </>
        )}
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
