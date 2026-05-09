import { useState, useCallback, useEffect } from 'react';
import { crewApi, jobRolesApi, crewPresetsApi } from '@/features/workflow/crew/api';
import { equipmentApi } from '@/features/workflow/equipment/api';
import type { JobRole } from '@/features/catalog/task-library/types/job-roles';
import type { CrewPreset } from '@/features/workflow/crew/types/crew-presets';
import { buildDefaultEquipmentPresets, readStoredEquipmentPresets } from '../helpers/equipment-preset-storage';
import type { Crew, EquipmentItem, EquipmentPreset } from '../types/wizard.types';

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function buildWizardDefaultEquipmentPresets(
  brandId: number | undefined,
  crew: Crew[],
  roles: JobRole[],
  equipmentItems: EquipmentItem[],
): EquipmentPreset[] {
  const andy = crew.find((member: { first_name?: string; last_name?: string }) =>
    normalize(member.first_name) === 'andy' && normalize(member.last_name) === 'galloway',
  );
  const videographerRole = roles.find((role) => normalize(role.name) === 'videographer');
  const soundEngineerRole = roles.find((role) => normalize(role.name) === 'sound_engineer');

  const andyOwned = equipmentItems.filter((item: { owner_id?: number | null }) => item.owner_id === andy?.id);
  const cameras = andyOwned
    .filter((item: { category?: string }) => normalize(item.category) === 'camera')
    .slice(0, 3)
    .map((item: { id: number }) => item.id);
  const audio = andyOwned
    .filter((item: { category?: string }) => normalize(item.category) === 'audio')
    .slice(0, 2)
    .map((item: { id: number }) => item.id);

  return buildDefaultEquipmentPresets({
    brandId,
    andyCrewId: andy?.id ?? null,
    videographerRoleId: videographerRole?.id ?? null,
    soundEngineerRoleId: soundEngineerRole?.id ?? null,
    cameraIds: cameras,
    audioIds: audio,
  });
}

export function useWizardData(activeStep: number, brandId?: number) {
  const [availableJobRoles, setAvailableJobRoles] = useState<JobRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [crew, setCrew] = useState<Crew[]>([]);
  const [loadingCrew, setLoadingCrew] = useState(false);
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [crewPresets, setCrewPresets] = useState<CrewPreset[]>([]);
  const [loadingCrewPresets, setLoadingCrewPresets] = useState(false);
  const [crewPresetsFetched, setCrewPresetsFetched] = useState(false);
  const [equipmentPresets, setEquipmentPresets] = useState<EquipmentPreset[]>([]);
  const [loadingEquipmentPresets, setLoadingEquipmentPresets] = useState(false);
  const [equipmentPresetsFetched, setEquipmentPresetsFetched] = useState(false);

  const fetchJobRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const data = await jobRolesApi.getAll();
      setAvailableJobRoles(data || []);
    } catch {
      setAvailableJobRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  const fetchCrew = useCallback(async () => {
    if (!brandId) return;
    setLoadingCrew(true);
    try {
      const data = await crewApi.getByBrand(brandId);
      setCrew(data || []);
    } catch {
      setCrew([]);
    } finally {
      setLoadingCrew(false);
    }
  }, [brandId]);

  const fetchEquipment = useCallback(async () => {
    setLoadingEquipment(true);
    try {
      const data = await equipmentApi.getAll();
      setEquipmentItems(data || []);
    } catch {
      setEquipmentItems([]);
    } finally {
      setLoadingEquipment(false);
    }
  }, []);

  const fetchCrewPresets = useCallback(async () => {
    setLoadingCrewPresets(true);
    try {
      const data = await crewPresetsApi.getAll();
      setCrewPresets(data || []);
    } catch {
      setCrewPresets([]);
    } finally {
      setLoadingCrewPresets(false);
      setCrewPresetsFetched(true);
    }
  }, []);

  const fetchEquipmentPresets = useCallback(async () => {
    setLoadingEquipmentPresets(true);
    try {
      const stored = readStoredEquipmentPresets(brandId);
      const defaults = buildWizardDefaultEquipmentPresets(brandId, crew, availableJobRoles, equipmentItems);
      setEquipmentPresets(stored.length > 0 ? stored : defaults);
    } catch {
      setEquipmentPresets([]);
    } finally {
      setLoadingEquipmentPresets(false);
      setEquipmentPresetsFetched(true);
    }
  }, [brandId, crew, availableJobRoles, equipmentItems]);

  useEffect(() => {
    if (activeStep === 4 && availableJobRoles.length === 0) fetchJobRoles();
    if (activeStep === 5) {
      if (crew.length === 0) fetchCrew();
      if (!crewPresetsFetched && !loadingCrewPresets) fetchCrewPresets();
    }
    if (activeStep === 6) {
      if (equipmentItems.length === 0) fetchEquipment();
      if (crew.length === 0) fetchCrew();
      if (availableJobRoles.length === 0) fetchJobRoles();
      if (!equipmentPresetsFetched && !loadingEquipmentPresets && equipmentItems.length > 0 && crew.length > 0 && availableJobRoles.length > 0) fetchEquipmentPresets();
    }
  }, [activeStep, availableJobRoles.length, crew.length, equipmentItems.length, crewPresetsFetched, loadingCrewPresets, equipmentPresetsFetched, loadingEquipmentPresets, fetchJobRoles, fetchCrew, fetchEquipment, fetchCrewPresets, fetchEquipmentPresets]);

  return {
    availableJobRoles,
    loadingRoles,
    crew,
    loadingCrew,
    equipmentItems,
    loadingEquipment,
    crewPresets,
    loadingCrewPresets,
    fetchCrewPresets,
    equipmentPresets,
    loadingEquipmentPresets,
    fetchEquipmentPresets,
  };
}

export type WizardData = ReturnType<typeof useWizardData>;
