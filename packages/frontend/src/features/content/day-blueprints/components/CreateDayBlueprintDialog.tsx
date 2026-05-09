'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloseIcon from '@mui/icons-material/Close';
import { alpha } from '@mui/material/styles';
import { colors, compactFieldSx } from '@/shared/theme/tokens';
import { useCreateDayBlueprint } from '../hooks';
import { dayBlueprintsApi } from '../api';
import type { DayBlueprintSummary } from '../types';
import { useSimulatorAnswers } from './simulator/useSimulatorAnswers';
import {
  StepActivities,
  StepEventDayDetail,
  StepEventDays,
  StepGuestCount,
} from './simulator/simulator-steps';

interface ServiceTypeOption {
  key: string;
  eventCategory: string;
}

interface CreateDayBlueprintDialogProps {
  open: boolean;
  onClose: () => void;
  blueprints: DayBlueprintSummary[];
  serviceTypeOptions: ServiceTypeOption[];
  activeServiceKey: string | null;
}

type WizardStepId =
  | 'service-type'
  | 'template'
  | 'event-days'
  | `event-day-${number}`
  | 'activities'
  | 'guest-count'
  | 'name';

interface WizardStep {
  id: WizardStepId;
  label: string;
}

const WEDDING_TEMPLATE_KEYS = [
  {
    key: 'standard-uk-wedding',
    label: 'Standard UK Wedding',
    emoji: 'W',
    description:
      'Full single-day UK wedding: prep, ceremony, portraits, breakfast & evening reception.',
  },
  {
    key: 'punjabi-3day-wedding',
    label: 'Punjabi Wedding',
    emoji: '3D',
    description:
      'Punjabi wedding structure: Mehndi night, Anand Karaj ceremony day, and grand evening reception.',
  },
  {
    key: 'catholic-ceremony-17',
    label: 'Catholic Ceremony',
    emoji: 'C',
    description: 'Full Roman Catholic Mass with canonical liturgical moments.',
  },
] as const;

const DEFAULT_DAY_START_TIME = '12:00';
const DEFAULT_DAY_DURATION_HOURS = 10;

const ACTIVITY_DURATION_DEFAULTS: Record<string, number> = {
  prep: 60,
  'first look': 25,
  ceremony: 45,
  portraits: 30,
  'cocktail hour': 60,
  reception: 120,
  speeches: 30,
  'first dance': 10,
  'evening party': 90,
  exit: 10,
};

function parseClockMinutes(value?: string): number | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return (hours * 60) + minutes;
}

function toClockTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min((24 * 60) - 1, Math.round(totalMinutes)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getDefaultActivityDurationMinutes(name: string): number {
  const normalized = name.trim().toLowerCase();
  return ACTIVITY_DURATION_DEFAULTS[normalized] ?? 45;
}

function deriveDurationBand(durationMinutes: number) {
  const clamped = Math.max(5, Math.round(durationMinutes));
  return {
    default_duration_minutes: clamped,
    duration_min_minutes: Math.max(5, clamped - 10),
    duration_max_minutes: clamped + 10,
  };
}

function buildDefaultBlueprintName(eventCategory: string | undefined): string {
  if (!eventCategory || !eventCategory.trim()) {
    return 'New Day Blueprint';
  }
  return `New ${eventCategory} Blueprint`;
}

export function CreateDayBlueprintDialog({
  open,
  onClose,
  blueprints,
  serviceTypeOptions,
  activeServiceKey,
}: CreateDayBlueprintDialogProps) {
  const router = useRouter();
  const createMutation = useCreateDayBlueprint();
  const answersStore = useSimulatorAnswers(null);

  const [activeStep, setActiveStep] = useState(0);
  const [serviceTypeKey, setServiceTypeKey] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameDirty, setNameDirty] = useState(false);

  const selectedServiceTypeOption = useMemo(
    () => serviceTypeOptions.find((option) => option.key === serviceTypeKey) ?? null,
    [serviceTypeOptions, serviceTypeKey],
  );

  const isWeddingType =
    selectedServiceTypeOption?.eventCategory?.toLowerCase().includes('wedding') ?? false;

  const availableTemplates = useMemo(
    () =>
      WEDDING_TEMPLATE_KEYS.map((template) => ({
        ...template,
        blueprint: blueprints.find((bp) => bp.key === template.key) ?? null,
      })),
    [blueprints],
  );

  const shouldAskQuestions = isWeddingType && selectedTemplateKey === null;

  const wizardSteps: WizardStep[] = useMemo(() => {
    const steps: WizardStep[] = [{ id: 'service-type', label: 'Service Type' }];

    if (isWeddingType) {
      steps.push({ id: 'template', label: 'Template' });
    }

    if (shouldAskQuestions) {
      steps.push({ id: 'event-days', label: 'Event Days' });

      const eventDayCount = Math.max(1, Math.min(3, answersStore.answers.basics.eventDays ?? 1));
      if (eventDayCount > 1) {
        Array.from({ length: eventDayCount }, (_, index) => {
          const dayNumber = index + 1;
          steps.push({ id: `event-day-${dayNumber}`, label: `Event Day ${dayNumber}` });
          return dayNumber;
        });
      }

      steps.push({ id: 'activities', label: 'Activities' });
      steps.push({ id: 'guest-count', label: 'Guest Count' });
    }

    if (!(isWeddingType && selectedTemplateKey)) {
      steps.push({ id: 'name', label: 'Blueprint Details' });
    }

    return steps;
  }, [
    answersStore.answers.basics.eventDays,
    isWeddingType,
    selectedTemplateKey,
    shouldAskQuestions,
  ]);

  const currentStep = wizardSteps[activeStep];
  const isLastStep = activeStep === wizardSteps.length - 1;

  useEffect(() => {
    if (activeStep < wizardSteps.length) {
      return;
    }
    setActiveStep(Math.max(0, wizardSteps.length - 1));
  }, [activeStep, wizardSteps.length]);

  const resetAnswers = answersStore.reset;

  useEffect(() => {
    if (!open) {
      return;
    }
    const fallbackServiceType =
      activeServiceKey && serviceTypeOptions.some((option) => option.key === activeServiceKey)
        ? activeServiceKey
        : serviceTypeOptions[0]?.key ?? '';

    const fallbackServiceOption =
      serviceTypeOptions.find((option) => option.key === fallbackServiceType) ?? null;

    setServiceTypeKey(fallbackServiceType);
    setSelectedTemplateKey(null);
    setCreateError(null);
    setActiveStep(0);
    setName(buildDefaultBlueprintName(fallbackServiceOption?.eventCategory));
    setDescription('');
    setNameDirty(false);
    resetAnswers();
  }, [activeServiceKey, open, resetAnswers, serviceTypeOptions]);

  useEffect(() => {
    if (!open || nameDirty) {
      return;
    }
    setName(buildDefaultBlueprintName(selectedServiceTypeOption?.eventCategory));
  }, [nameDirty, open, selectedServiceTypeOption?.eventCategory]);

  useEffect(() => {
    if (!open || !isWeddingType) {
      setSelectedTemplateKey(null);
    }
  }, [isWeddingType, open]);

  const canAdvance = useMemo(() => {
    switch (currentStep?.id) {
      case 'service-type':
        return serviceTypeKey.trim().length > 0;
      case 'event-days':
        return Boolean(answersStore.answers.basics.eventDays);
      case 'name':
        return name.trim().length > 0;
      default:
        return true;
    }
  }, [
    answersStore.answers.basics.eventDays,
    currentStep?.id,
    name,
    serviceTypeKey,
  ]);

  const handleClose = () => {
    if (createMutation.isPending) {
      return;
    }
    onClose();
  };

  const handleNext = () => {
    if (!canAdvance || isLastStep) {
      return;
    }
    setCreateError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      return;
    }
    setCreateError(null);
    setActiveStep((prev) => prev - 1);
  };

  const buildKey = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

  const resolvePartnerDefaults = () => {
    if (isWeddingType) {
      return {
        primary_partner_label: 'Bride',
        second_partner_label: 'Groom',
      };
    }

    return {
      primary_partner_label: 'Partner 1',
      second_partner_label: 'Partner 2',
    };
  };

  const handleSubmit = async () => {
    if (!selectedServiceTypeOption) {
      setCreateError('Pick a service type first.');
      return;
    }

    setCreateError(null);

    if (isWeddingType && selectedTemplateKey) {
      const template = availableTemplates.find((item) => item.key === selectedTemplateKey);
      const templateBlueprint = template?.blueprint;

      if (!templateBlueprint) {
        setCreateError('This template is unavailable right now.');
        return;
      }

      const versions =
        templateBlueprint.versions && templateBlueprint.versions.length > 0
          ? templateBlueprint.versions
          : await dayBlueprintsApi.versions.list(templateBlueprint.id);
      const draftVersion = versions.find((version) => version.status === 'DRAFT') ?? versions[0];

      onClose();
      if (draftVersion?.id) {
        router.push(`/day-designer/${templateBlueprint.id}/${draftVersion.id}`);
      }
      return;
    }

    if (!name.trim()) {
      setCreateError('Blueprint name is required.');
      return;
    }

    try {
      const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const initialEventDayRoles = Object.entries(
        answersStore.answers.basics.eventDayDetails ?? {},
      ).reduce<Record<string, string>>((acc, [dayNumber, detail]) => {
        if (detail?.role) {
          acc[dayNumber] = detail.role;
        }
        return acc;
      }, {});
      const initialActivities = (answersStore.answers.basics.mainActivities ?? [])
        .map((activity) => activity.trim())
        .filter((activity) => activity.length > 0);
      const eventDayCount = Math.max(1, answersStore.answers.basics.eventDays ?? 1);
      const dayStartMinutes = parseClockMinutes(DEFAULT_DAY_START_TIME) ?? (12 * 60);

      const initialDayTimings = shouldAskQuestions
        ? Array.from({ length: eventDayCount }, (_, index) => ({
            day_number: index + 1,
            default_start_time: DEFAULT_DAY_START_TIME,
            default_duration_hours: DEFAULT_DAY_DURATION_HOURS,
          }))
        : [];

      let rollingMinutes = dayStartMinutes;
      const initialActivityTimings = shouldAskQuestions
        ? initialActivities.map((name) => {
            const defaultDurationMinutes = getDefaultActivityDurationMinutes(name);
            const timing = {
              name,
              default_start_time: toClockTime(rollingMinutes),
              ...deriveDurationBand(defaultDurationMinutes),
            };
            rollingMinutes += defaultDurationMinutes;
            return timing;
          })
        : [];

      const initialSetupPayload = shouldAskQuestions
        ? {
            initial_event_days: answersStore.answers.basics.eventDays,
            initial_event_day_roles:
              Object.keys(initialEventDayRoles).length > 0 ? initialEventDayRoles : undefined,
            initial_activities: initialActivities.length > 0 ? initialActivities : undefined,
            initial_day_timings: initialDayTimings.length > 0 ? initialDayTimings : undefined,
            initial_activity_timings:
              initialActivityTimings.length > 0 ? initialActivityTimings : undefined,
          }
        : {};

      const created = await createMutation.mutateAsync({
        key: buildKey(`${name}-${stamp}`),
        display_name: name.trim(),
        event_category: selectedServiceTypeOption.eventCategory,
        description: description.trim() ? description.trim() : undefined,
        ...initialSetupPayload,
        ...resolvePartnerDefaults(),
      });

      if (!created?.id) {
        onClose();
        return;
      }

      const versions =
        created.versions && created.versions.length > 0
          ? created.versions
          : await dayBlueprintsApi.versions.list(created.id);
      const draftVersion = versions.find((version) => version.status === 'DRAFT') ?? versions[0];

      if (shouldAskQuestions && answersStore.assumptions.length > 0) {
        sessionStorage.setItem(
          `autogenerate-${created.id}`,
          JSON.stringify({ brief: answersStore.assumptions }),
        );
      }

      onClose();
      if (draftVersion?.id) {
        router.push(`/day-designer/${created.id}/${draftVersion.id}?autogenerate=1`);
      }
    } catch (error) {
      setCreateError((error as Error).message || 'Unable to create day blueprint');
    }
  };

  const renderStepContent = () => {
    switch (currentStep?.id) {
      case 'service-type':
        return (
          <Stack spacing={1.5}>
            <Typography sx={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>
              Which service does this blueprint belong to?
            </Typography>
            <Select
              value={serviceTypeKey}
              onChange={(event) => {
                setServiceTypeKey(String(event.target.value));
                setSelectedTemplateKey(null);
              }}
              fullWidth
              sx={{
                ...compactFieldSx,
                '& .MuiSelect-select': {
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                },
              }}
            >
              {serviceTypeOptions.map((option) => (
                <MenuItem key={option.key} value={option.key}>
                  {option.eventCategory}
                </MenuItem>
              ))}
            </Select>
            <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
              Choose from this brand's enabled service types.
            </Typography>
          </Stack>
        );
      case 'template':
        return (
          <Stack spacing={1.25}>
            <Typography sx={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>
              Start blank or open a seeded wedding template.
            </Typography>
            <TemplateCard
              title="Start blank"
              description="Use guided questions and generate a brand-new blueprint."
              emoji="?"
              selected={selectedTemplateKey === null}
              onClick={() => setSelectedTemplateKey(null)}
            />
            {availableTemplates.map((template) => (
              <TemplateCard
                key={template.key}
                title={template.label}
                description={template.description}
                emoji={template.emoji}
                selected={selectedTemplateKey === template.key}
                disabled={!template.blueprint}
                badge={!template.blueprint ? 'Not seeded' : undefined}
                onClick={() => {
                  if (template.blueprint) {
                    setSelectedTemplateKey(template.key);
                  }
                }}
              />
            ))}
          </Stack>
        );
      case 'event-days':
        return (
          <StepEventDays
            answers={answersStore.answers}
            patchBasics={answersStore.patchBasics}
            patchPeople={answersStore.patchPeople}
            patchLocations={answersStore.patchLocations}
            day={null}
            version={null}
            completeness={null}
          />
        );
      case 'activities':
        return (
          <StepActivities
            answers={answersStore.answers}
            patchBasics={answersStore.patchBasics}
            patchPeople={answersStore.patchPeople}
            patchLocations={answersStore.patchLocations}
            day={null}
            version={null}
            completeness={null}
          />
        );
      case 'guest-count':
        return (
          <StepGuestCount
            answers={answersStore.answers}
            patchBasics={answersStore.patchBasics}
            patchPeople={answersStore.patchPeople}
            patchLocations={answersStore.patchLocations}
            day={null}
            version={null}
            completeness={null}
          />
        );
      case 'name':
        return (
          <Stack spacing={1.5}>
            <Typography sx={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>
              Name your blueprint before creating it.
            </Typography>
            <TextField
              label="Blueprint name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameDirty(true);
              }}
              required
              fullWidth
              sx={{ ...compactFieldSx }}
            />
            <TextField
              label="Description (optional)"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              minRows={3}
              fullWidth
              sx={{ ...compactFieldSx }}
            />
            <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
              We will generate a unique internal key automatically.
            </Typography>
          </Stack>
        );
      default:
        if (currentStep?.id.startsWith('event-day-')) {
          const dayNumber = Number(currentStep.id.replace('event-day-', ''));
          return (
            <StepEventDayDetail
              dayNumber={dayNumber}
              answers={answersStore.answers}
              patchBasics={answersStore.patchBasics}
              patchPeople={answersStore.patchPeople}
              patchLocations={answersStore.patchLocations}
              day={null}
              version={null}
              completeness={null}
            />
          );
        }

        return null;
    }
  };

  const primaryLabel = isLastStep
    ? isWeddingType && selectedTemplateKey
      ? 'Open Template'
      : 'Create Blueprint'
    : 'Next';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' } } }}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(15,20,25,0.97)',
          backdropFilter: 'blur(12px)',
          backgroundImage:
            'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: 2.5,
          border: `1px solid ${alpha(colors.border, 0.6)}`,
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          pt: 2.5,
          pb: 1.5,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoAwesomeRoundedIcon sx={{ color: '#60a5fa', fontSize: 20 }} />
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>
            New Day Blueprint
          </Typography>
        </Stack>
        <IconButton
          onClick={handleClose}
          disabled={createMutation.isPending}
          sx={{ color: '#64748b', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
          <Typography sx={{ color: '#60a5fa', fontSize: '0.8rem', fontWeight: 600 }}>
            {currentStep?.label ?? 'Create'}
          </Typography>
          <Typography sx={{ color: '#475569', fontSize: '0.7rem' }}>
            Step {activeStep + 1} of {wizardSteps.length}
          </Typography>
        </Box>
        <Box sx={{ width: '100%', height: 3, bgcolor: '#1e293b', borderRadius: 2 }}>
          <Box
            sx={{
              width: `${((activeStep + 1) / wizardSteps.length) * 100}%`,
              height: '100%',
              bgcolor: '#60a5fa',
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
      </Box>

      <Box sx={{ height: '1px', bgcolor: 'rgba(148,163,184,0.1)' }} />

      <DialogContent sx={{ pt: 2.5, px: 3, pb: 2, overflow: 'auto', maxHeight: '68vh' }}>
        {createError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCreateError(null)}>
            {createError}
          </Alert>
        )}
        {renderStepContent()}
      </DialogContent>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 1.5,
          borderTop: '1px solid rgba(148,163,184,0.1)',
        }}
      >
        <Box>
          {activeStep > 0 ? (
            <Box
              component="button"
              onClick={handleBack}
              disabled={createMutation.isPending}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 2,
                py: 0.75,
                bgcolor: 'rgba(148,163,184,0.08)',
                border: '1px solid rgba(148,163,184,0.15)',
                borderRadius: 1,
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: 'rgba(148,163,184,0.12)',
                  color: '#fff',
                  borderColor: 'rgba(148,163,184,0.25)',
                },
                '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: '1rem' }} />
              Back
            </Box>
          ) : (
            <Button onClick={handleClose} sx={{ color: '#94a3b8', textTransform: 'none' }}>
              Cancel
            </Button>
          )}
        </Box>

        <Typography sx={{ color: '#475569', fontSize: '0.8rem' }}>
          Step {activeStep + 1} of {wizardSteps.length}
        </Typography>

        <Box>
          <Box
            component="button"
            onClick={isLastStep ? handleSubmit : handleNext}
            disabled={!canAdvance || createMutation.isPending}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 2.5,
              py: 0.75,
              bgcolor: !canAdvance || createMutation.isPending ? '#334155' : '#60a5fa',
              border: 'none',
              borderRadius: 1,
              color: !canAdvance || createMutation.isPending ? '#64748b' : '#0f172a',
              cursor: !canAdvance || createMutation.isPending ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
              transition: 'all 0.15s',
              '&:hover':
                !canAdvance || createMutation.isPending ? {} : { filter: 'brightness(0.9)' },
            }}
          >
            {createMutation.isPending ? (
              <CircularProgress size={16} thickness={5} sx={{ color: 'inherit' }} />
            ) : null}
            {primaryLabel}
            {!isLastStep ? <ArrowForwardIcon sx={{ fontSize: '1rem' }} /> : null}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

function TemplateCard({
  title,
  description,
  emoji,
  selected,
  disabled = false,
  badge,
  onClick,
}: {
  title: string;
  description: string;
  emoji: string;
  selected: boolean;
  disabled?: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 1.75,
        py: 1.25,
        borderRadius: 2,
        cursor: disabled ? 'default' : 'pointer',
        border: '1px solid',
        borderColor: selected ? '#60a5fa' : 'rgba(255,255,255,0.08)',
        bgcolor: selected ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.02)',
        opacity: disabled ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        transition: 'border-color 0.15s, background-color 0.15s',
        '&:hover': disabled
          ? {}
          : {
              borderColor: 'rgba(96,165,250,0.5)',
              bgcolor: 'rgba(96,165,250,0.04)',
            },
      }}
    >
      <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{emoji}</Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9' }}>{title}</Typography>
          {badge ? (
            <Chip
              label={badge}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.62rem',
                bgcolor: 'rgba(255,255,255,0.06)',
                color: '#64748b',
              }}
            />
          ) : null}
        </Stack>
        <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.25 }}>{description}</Typography>
      </Box>
      {selected ? (
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#60a5fa', flexShrink: 0 }} />
      ) : null}
    </Box>
  );
}
