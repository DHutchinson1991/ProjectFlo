import { useState, useCallback, useEffect, useRef } from 'react';
import { crewApi, jobRolesApi, crewPresetsApi } from '@/features/workflow/crew/api';
import { equipmentApi, equipmentPresetsApi } from '@/features/workflow/equipment/api';
import type { JobRole } from '@/features/catalog/task-library/types/job-roles';
import type { CrewPreset } from '@/features/workflow/crew/types/crew-presets';
import type { Crew, EquipmentItem, EquipmentPreset } from '../types/wizard.types';
import { WIZARD_STEP_INDEX } from '../helpers/wizard-helpers';
import { buildWizardDefaultEquipmentPresets } from '../helpers/equipment-preset-defaults';

export function useWizardData(activeStep: number, brandId?: number, wizardOpen = false) {
  const prevWizardOpenRef = useRef(false);
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

  useEffect(() => {
    if (wizardOpen && !prevWizardOpenRef.current) {
      setCrewPresetsFetched(false);
      setEquipmentPresetsFetched(false);
      setCrewPresets([]);
      setEquipmentPresets([]);
    }
    prevWizardOpenRef.current = wizardOpen;
  }, [wizardOpen]);

  const removeEquipmentPresetLocal = useCallback((id: number) => {
    setEquipmentPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

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
      const presets = await equipmentPresetsApi.getAll();
      setEquipmentPresets(presets || []);
    } catch {
      setEquipmentPresets([]);
    } finally {
      setLoadingEquipmentPresets(false);
      setEquipmentPresetsFetched(true);
    }
  }, []);

  useEffect(() => {
    if (!wizardOpen) return;
    // Crew & kit (TEAM) folds roles/crew/equipment into one screen — load it all on entry.
    if (activeStep >= WIZARD_STEP_INDEX.TEAM) {
      if (availableJobRoles.length === 0) fetchJobRoles();
      if (crew.length === 0) fetchCrew();
      if (!crewPresetsFetched && !loadingCrewPresets) fetchCrewPresets();
      if (equipmentItems.length === 0) fetchEquipment();
      if (!equipmentPresetsFetched && !loadingEquipmentPresets) fetchEquipmentPresets();
    }
  }, [
    wizardOpen,
    activeStep,
    availableJobRoles.length,
    crew.length,
    equipmentItems.length,
    crewPresetsFetched,
    loadingCrewPresets,
    equipmentPresetsFetched,
    loadingEquipmentPresets,
    fetchJobRoles,
    fetchCrew,
    fetchEquipment,
    fetchCrewPresets,
    fetchEquipmentPresets,
  ]);

  // When the API returns no rows (common before seed/migrate), build presets from inventory + Andy + roles.
  useEffect(() => {
    if (!wizardOpen) return;
    if (!equipmentPresetsFetched || loadingEquipmentPresets) return;
    if (equipmentPresets.length > 0) return;
    if (activeStep < WIZARD_STEP_INDEX.TEAM) return;
    const built = buildWizardDefaultEquipmentPresets(brandId, crew, availableJobRoles, equipmentItems);
    if (built.length > 0) setEquipmentPresets(built);
  }, [
    wizardOpen,
    equipmentPresetsFetched,
    loadingEquipmentPresets,
    equipmentPresets.length,
    activeStep,
    brandId,
    crew,
    availableJobRoles,
    equipmentItems,
  ]);

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
    removeEquipmentPresetLocal,
  };
}

export type WizardData = ReturnType<typeof useWizardData>;
